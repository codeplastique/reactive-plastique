import I18n from "../utils/I18n";
import Jsonable from "../hash/Jsonable";
import Component from "../component/Component";
import CapturedComponent from "../component/CapturedComponent";
import Eventer from "../event/Eventer";
import { TypeDef } from "./Type";
import AppEvent from "../event/AppEvent";
import SimpleMap from "../collection/impl/SimpleMap";
import HashMap from "../collection/impl/HashMap";
import HashSet from "../collection/impl/HashSet";
import SimpleSet from "../collection/impl/SimpleSet";
import Marker from "../component/Marker";
declare const Vue: any;
declare const _app: any;

class EventerImpl implements Eventer{
    static listeners: {[eventName: string]: Array<(event?: any, caller?: any) => Promise<any>>} = {} 
    constructor(private $caller){}

    public static addListener(eventIds: string[], func: Function): void{
        eventIds.forEach(eventId => {
            if(EventerImpl.listeners[eventId] == null)
                EventerImpl.listeners[eventId] = [];
            ///@ts-ignore
            EventerImpl.listeners[eventId].push(func);
        })
    }
    public fireEvent<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T[]>{
        eventName = (eventName as string).toLowerCase();
        if(EventerImpl.listeners[eventName as string] == null){
            console.log('No listeners for event: '+ eventName);
            ///@ts-ignore
            return Promise.resolve();
        } 
        let caller = this.$caller? this.$caller: this;
        let promise: any = Promise.resolve();
        for(let listener of EventerImpl.listeners[eventName as string]){
            promise = function(list){ 
                return promise.then(() => Promise.all([list(eventObject, caller)]));
            }(listener);
        }
        return promise;
    }

    public fireEventParallel<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T[]>{
        eventName = (eventName as string).toLowerCase();
        if(EventerImpl.listeners[eventName as string] == null){
            console.log('No listeners for event: '+ eventName);
            ///@ts-ignore
            return Promise.resolve();
        } 
        return Promise.all(EventerImpl.listeners[eventName as string].map(func => func(eventObject, this.$caller? this.$caller: this)));
    }
}
class ComponentImpl extends EventerImpl implements Component{
    private checkInit(checkForAttaching?: boolean): void{
        //@ts-ignore
        if(this.app$ == null)
            throw new Error('Component is not initialized!')
        //@ts-ignore
        if(checkForAttaching && this.app$.v$ == null)
            throw new Error('Component is not attached!')
    }
    public isComponentAttached(): boolean{
        //@ts-ignore
        return this.app$.v$ != null
    }
    public getClosestComponent(types?: Array<Component | TypeDef<any> | Marker>): CapturedComponent {
        this.checkInit();
        ///@ts-ignore
        let app$ = this.app$;
        if(app$.fp){
            let closest = types && types.length != 0?
                app$.fp.find(parent => types.find(type => _app.instanceOf(parent, type)))
                :
                app$.fp[0];
            ///@ts-ignore
            return new CapturedComponent(closest);
        }else {
            this.checkInit(true);
            //@ts-ignore
            return _app.getClosestComponent(app$.v$.$el.parentElement, null, types);
        }
    }
    public fireEventOnParents<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T>{
        this.checkInit();
        ///@ts-ignore
        let app$ = this.app$;
        let fakeParents: Array<any>;
        if(app$.fp)
            fakeParents = app$.fp.slice().reverse();
        else
        this.checkInit(true);
        eventName = (eventName as string).toLowerCase();
        let parent = fakeParents? fakeParents.pop(): app$.parent;
        while(parent){
            if(parent.app$.events[eventName as string])
                return Promise.resolve(parent.app$.events[eventName as string][0](eventObject, this));
            parent = fakeParents? fakeParents.pop(): parent.app$.parent;
        }
        // console.log('No parent listeners for event: '+ eventName);
        return Promise.resolve() as Promise<any>;
    }

    public runWithFakeParents(action: Function, ...parents: Component[]): Promise<any>{
        ///@ts-ignore
        this.app$.fp = parents;
        try {
            return Promise.resolve(action()).finally(() =>
        ///@ts-ignore
                this.app$.fp = null)
        }catch (e) {
            ///@ts-ignore
            this.app$.fp = null;
            throw e
        }
    }

    public getElement(): Element{
        this.checkInit(true);
        //@ts-ignore
        return this.app$.v$.$el;
    }
    public hashCode(): string{
        this.checkInit();
        ///@ts-ignore
        return String(this.app$.id)
    }

    public whenAttached(callback: Function): void{
        this.checkInit();
        ///@ts-ignore
        if(this.app$.v$ == null) {
            ///@ts-ignore
            this.app$.ac = this.app$.ac || [];
            ///@ts-ignore
            this.app$.ac.push(callback);
        }else
            callback();
    }

    public whenDetached(callback: Function): void{
        this.checkInit();
        ///@ts-ignore
        if(this.app$.v$ == null) {
            ///@ts-ignore
            this.app$.dc = this.app$.dc || [];
            ///@ts-ignore
            this.app$.dc.push(callback);
        }else
            callback();
    }

    public getSlots(): string[]{
        this.checkInit(true);
        //@ts-ignore
        return Object.keys(this.app$.v$.$slots)
    }
}
abstract class App{
    private static beanNameToDef: {[beanName: string]: Function | Object} = {};
    private static beanNameToProto: {[beanName: string]: boolean} = {};
    private static beanIdToName: {[beanId: number]: string} = {};
    private static componentId = 0;
    private static epName: string; //entry point name
    private static ep: Object; //entry point
    private static contextPath: string;
    private static mappers: object[]; //mappers container

    private static getClosestComponent(parent: any, topLimitElem: HTMLElement, types?: Array<Component | TypeDef<any> | Marker>) {
        if(parent)
            while(true){
                let marker: any
                if(parent.hasAttribute('data-vcn')){
                    marker = parent.getAttribute('data-vcn');
                    parent = parent.parentElement.closest('[data-cn]');
                    if(types && types.find(type => typeof type == 'string' && type == marker)){
                        types = void 0;// clear types, because the marker is caught
                    }
                }
                if((marker || parent.hasAttribute('data-cn')) && parent.__vue__ != null){ //__vue__ can be the null if the tag is v:parent or out or root tag
                    if(types){
                        for(let type of types){
                            ///@ts-ignore

                            //if type is not marker and ...
                            if(typeof type !== 'string' && _app.instanceOf(parent.__vue__._data, type))
                                ///@ts-ignore
                                return new CapturedComponent(parent.__vue__._data, marker);
                        }
                    }else
                        ///@ts-ignore
                        return new CapturedComponent(parent.__vue__._data, marker);
                }
                parent = parent.parentElement && parent.parentElement.closest('[data-cn],[data-vcn]');
                if(parent == null || (topLimitElem && !topLimitElem.contains(parent)))
                    break
            }
        ///@ts-ignore
        return new CapturedComponent();
    }

    private static getBean<T>(id: String | Number, componentObj?: object): T{
        if(id == -1 || id == App.epName)
            return App.ep as T;
        let beanName: any = typeof id == 'number'? App.beanIdToName[id as number]: id;
        if(beanName == 'Eventer'){
            if(componentObj)
                ///@ts-ignore
                return new EventerImpl(componentObj);
            throw new Error('You can get Eventer through Autowired only!')
        }
        let bean: any = App.beanNameToDef[beanName];
        if(bean instanceof Function) {
            bean = bean();
            if(!App.beanNameToProto[beanName])
                App.beanNameToDef[beanName] = bean
        }
        return bean;
    }   
    public getBean<T>(beanName: string): T{
        return App.getBean(beanName);
    }   
    
    private static addListeners(methodNameToEventsIds: {[method: string]: string[]}, obj: any){
        for(let methodName in methodNameToEventsIds){
            let eventsIds = methodNameToEventsIds[methodName];
            let method = obj[methodName].bind(obj);
            if(obj.app$){
                eventsIds.forEach(eventId => {
                    let events = obj.app$.events[eventId] = obj.app$.events[eventId] || [];
                    events.push(method);
                })
            }
            EventerImpl.addListener(eventsIds, method);
        }
    }


    private static initRouting(mappersContainers: any[]): void{
        App.mappers = mappersContainers;
        mappersContainers.forEach((e, i, arr) => {
            if(e != App.ep)
                arr[i] = new e();
        });
        App.route(location.pathname);
    }

    private static route(path: string): void{
        if(!App.mappers)
            return;

        const contextPath = App.contextPath;
        if(contextPath && path.startsWith(contextPath))
            path = path.substr(contextPath.length);

        for(let mappersContainer of App.mappers){
            let mappers: [string | object, string, []][] = mappersContainer.constructor['routing$']; //mask, methodName, args indexes

            for(let mapper of mappers){
                if(typeof mapper[0] === 'string'){
                    if(mapper[0] == path)
                        mappersContainer[mapper[1]].call(mappersContainer);
                }else{
                    let match = path.match(mapper[0] as any);
                    if(match && match.index == 0 && match[0].length == path.length){
                        let args: any[];
                        if(mapper[2]){
                            args = mapper[2].reduce((args, e, i) => {
                                args[i] = match[e];
                                return args;
                            }, [])
                        }else
                            args = match.slice(1);

                        mappersContainer[mapper[1]].apply(mappersContainer, args);  
                    }
                }
            }
        }
    }

    private static initComponent(componentName: string, configuration: string, obj: any, templateGenerator?: Function, initParentTG?: boolean){
        let config = JSON.parse(configuration);
        // let teplateName = config.tn || componentName;
        let componentMethod = function(methodName: string){
            return function(){ return this._data.app$.clazz[methodName].apply(this._data, arguments)}
        };
        if(obj.app$){
            //from super
            let pc = obj.app$.pc;
            obj.app$.cn = componentName; //replace parent name to child name
            Object.assign(pc.w, config.w);
            pc.ah = config.ah || pc.ah
            pc.dh = config.dh || pc.dh
            pc.ep = (pc.ep || []).concat(config.ep); // element prop
            if(initParentTG)
                obj.app$.ptg = obj.app$.tg().r;
            obj.app$.tg = templateGenerator? templateGenerator: obj.app$.tg
        }else{
            Object.defineProperty(obj, 'app$', {
                value: {
                    cn: componentName,
                    id: ++App.componentId,
                    clazz: obj,
                    events: {},
                    pc: config,// parent configuration
                    tg: templateGenerator
                }
            });
        }
        if(obj.app$.tg == null || Vue.component(componentName) != null)
            return;
        let configurator = obj.app$.pc;
        let methodNameToMethod: any = {};
        // let methodNameToComputed: any = {};
        // let computedMethods = configurator.c;
        let memberNameToWatchMethodName: {[methid: string]: string} = configurator.w;
        let memberNameToWatchMethod: {[methid: string]: Function} = {};
        for(let methodName in obj.constructor.prototype){
            // if(computedMethods.indexOf(methodName) >= 0)
            //     methodNameToComputed['$s' + methodName] = function(){return this.app$.clazz[methodName].apply(this, arguments)}
            methodNameToMethod[methodName] = componentMethod(methodName)
        }
        for(let member in memberNameToWatchMethodName){
            let methodName = memberNameToWatchMethodName[member];
            memberNameToWatchMethod[member] = methodNameToMethod[methodName];
        }

    
        let render = obj.app$.tg();
        Vue.component(componentName, {
            props: ['m', 'c'], //m - main, c - cssClass
            data: function(elementProps: string[]){
                return function () {
                    if(elementProps){ // element props
                        for(let prop of elementProps)
                            if(!(prop in this.m))
                                Object.defineProperty(this.m, prop, {
                                    enumerable: true,
                                    get: function(){ 
                                        return this.app$.v$? this.app$.v$.$refs[prop]: null
                                    }
                                })
                    }
                    // if(!('clazz$' in this.m)) {
                    Object.defineProperty(this.m, 'clazz$', {
                        enumerable: true,
                        configurable: true,
                        get: (function (p) {
                            return function () {
                                return p.c || ''
                            }
                        })(this)
                    })
                    // }
                    return this.m
                }
            }(configurator.ep),
            methods: methodNameToMethod,
            watch: memberNameToWatchMethod,
            render: render.r,
            staticRenderFns: render.s,
            mounted: configurator.ah? methodNameToMethod[configurator.ah]: null,
            beforeDestroy: configurator.dh? methodNameToMethod[configurator.dh]: null
        });
    }


    protected constructor(element?: HTMLElement, contextPath?: string){
        let $ = this.constructor['$'];
        
        ///@ts-ignore
        contextPath = element; //element is moved to this.attachComponent, in the compile time element is the contextPath
        
        if(contextPath){
            if(!contextPath.startsWith('/'))
                contextPath = '/' + contextPath;
            if(!contextPath.endsWith('/'))
                contextPath += '/';
        }
        App.contextPath = contextPath || '/';
        if($){
            let configurator = JSON.parse($);
            App.beanIdToName['0'] = 'Eventer';

            let beansClasses = this.constructor['$beans'] || [];
            beansClasses.push(this);
            for(let i = 0; i < configurator.beans.length; i++){
                let beanClassBeans = configurator.beans[i];
                let beanClass = beansClasses[i] != this? new beansClasses[i](): beansClasses[i];
                for(let bean in beanClassBeans){
                    let [beanId, beanName, isPrototype] = bean.split(';');
                    if(isPrototype)
                        App.beanNameToProto[beanName] = true;
                    App.beanIdToName[beanId] = beanName;
                    App.beanNameToDef[beanName] = beanClass[configurator.beans[i][bean]].bind(beanClass);
                }
            }
            App.epName = configurator.name;
            App.ep = this;
        }
        if(window['_AppLocale']){
            ///@ts-ignore
            I18n.locale = _AppLocale.locale;
            ///@ts-ignore
            I18n.keyToValue = _AppLocale.values;
        }
        _app.bean = App.getBean;
        _app.initComp = App.initComponent;
        _app.i18n = I18n.text;
        _app.listeners = App.addListeners;
        _app.routing = App.initRouting;
        _app.getClosestComponent = App.getClosestComponent;

        window['getComponentPath'] =  function(elem){
            let components = [];
            while(elem && (elem = elem.closest('[data-cn]'))){
                components.push(elem.getAttribute('data-cn'))
                elem = elem.parentElement;
            }
            return components.join(' => ');
        }
        this.genVueMixins();
    }

    private genVueMixins(){
        Vue.mixin({
            created: function(){
                if(this._data.app$)
                    this._data.app$.v$ = this;
            },
            mounted: function(){
                //attach callbacks
                let callbacks = this._data.app$? this._data.app$.ac: null;
                if(callbacks) {
                    this.$nextTick(() => {
                        callbacks.forEach((f: Function) => f());
                        this._data.app$.ac = null;
                    });
                }
            },
            beforeDestroy: function(){
                //detach callbacks
                let callbacks = this._data.app$? this._data.app$.dc: null;
                if(callbacks) {
                    this.$nextTick(() => {
                        callbacks.forEach((f: Function) => f());
                        this._data.app$.dc = null;
                    });
                }
                
            },
            destroyed: function(){
                if(this._data.app$) {
                    this._data.app$.parent = null
                    this._data.app$.v$ = null
                }
                this._data = null
                this.$vnode.componentOptions.propsData = null
                this.$children = [];
                this._props = null;
                this.$options.propsData = null;
            },
            methods: {
                $convState: function (isWithState: number, iterable: object | any[]){
                    let arr = [], 
                        size: number, 
                        values: object[];

                    if(iterable instanceof SimpleMap || iterable instanceof HashMap){
                        size = iterable.size();
                        values = iterable.entries(); 

                    }else if(iterable instanceof SimpleSet || iterable instanceof HashSet){
                        size = iterable.size();
                        values = iterable.values();

                    }else if(iterable instanceof Array){
                        size = iterable.length;
                        values = iterable;

                    }else
                        throw new Error('You cant iterate simple object!')

                    for(var i = 0; i < size; i++){
                        let value = values[i];
                        if(isWithState)
                            value = {v: value, s:{index: i, size: size, last: i == (size-1), first: i == 0}}
                        arr.push(value);
                    }
                    return arr;
                },
                $convComp: function(component: any) {
                    if(component.app$.parent != this._data.app$.clazz)
                        component.app$.parent = this._data.app$.clazz;
                    if(component.app$.pc)
                        delete component.app$.pc;
                    return component;
                }
               
            }
        });
    }

    private attachComponent(element: HTMLElement, component: Component){
        new Vue({
            el: element,
            data: {c: component},
            template: 
            '<component :is="c.app$.cn" :key="c.app$.id" v-bind:m="c"></component>'
        });
    }

    // public isComponentAttached(component: Component){
    //     let parent = component;
    //     while(parent){
    //         if(parent['_isVue'])
    //             return true;
    //         ///@ts-ignore
    //         parent = parent.app$.parent;
    //     }
    // }

    public static triggerDomReflow(): void{
        void window.innerHeight;
    }

    public static nextTick(action: Function): void{
        Vue.nextTick(action);
    }
    // protected attachedComponents = {};
    // public whenAttached(component: Component): Promise<Component>{
    //     if(this.isComponentAttached(component))
    //         return Promise.resolve(component);
    //     return this.attachedComponents[component];
    // }
    

    // public setLocale(locale: string){
        ///@ts-ignore
        // if(I18n.locale != locale){
        //     this.locale = locale;
        // }
    // }
}


declare global {
    interface Object{
        equals(obj: Object): boolean;
    }
    interface Array<T> extends Jsonable{
        remove(index: number): Array<T>;
        removeValue(value: T): boolean;
        removeValues(value: T[]): void;
        set(index: number, value: T): Array<T>;
        includes(searchElement: T, fromIndex?: number): boolean;
        clear(...newElems: T[]): void
    }

    interface Event{
        getClosestComponent: (types?: Array<Component | TypeDef<any> | Marker>) => CapturedComponent
    }

    interface Element{
        getClosestComponent: (types?: Array<Component | TypeDef<any> | Marker>) => CapturedComponent
    }
}
if(!Object.values){
    Object.values = function(obj): any[]{
        return Object.keys(obj).map(function(e) {
            return obj[e]
        })
    }
}
Object.defineProperty(Object.prototype, 'equals', {
    value: function(obj: Object) {
        return this === obj;
    }, 
    writable: true,
    configurable: true
});
Array.prototype.remove = function (index: number) {
    if("__ob__" in this)
        Vue.delete(this, index);
    else
        this.splice(index, 1);
    return this;
}
Array.prototype.removeValue = function (value: any) {
    for(let i = 0; i < this.length; i++){
        let val = this[i];
        if(val == value || (val.app$ && value.app$ && val.app$.id == value.app$.id)){
            this.remove(i);
            return true;
        }
    }
}
Array.prototype.removeValues = function (values: any[]) {
    for(let val of values){
        this.removeValue(val);
    }
}
Array.prototype.clear = function () {
    this.splice(0, this.length);
    if(arguments.length > 0)
        this.push.apply(this, arguments)
}
Array.prototype.set = function (index: number, value: any) {
    if("__ob__" in this)
        Vue.set( this, index, value);
    else
        this[index] = value;
    return this;
}
Element.prototype.getClosestComponent = function(types?: Array<Component | TypeDef<any> | Marker>) {
    return _app.getClosestComponent(this, null, types);
}
Event.prototype.getClosestComponent = function(types?: Array<Component | TypeDef<any> | Marker>) {
    function getElem(elem): Element{
        return elem == window || elem == document? null: elem;
    }
    return _app.getClosestComponent(getElem(this.target), getElem(this.currentTarget), types);
}

window['_app'] = {
    instanceOf: function (obj, type) {
        if(obj == null) return false;

        if(typeof type == 'number'){
            let proto = Object.getPrototypeOf(obj);
            while(proto != null){
                let isImplements = (proto.constructor['$intf'] || []).indexOf(type) >= 0;
                if(isImplements)
                    return true;
                proto = Object.getPrototypeOf(proto)
            }
            return false;
        }
        let typeOfType = typeof obj;
        if(typeOfType === 'string')obj = String
        else if(typeOfType === 'number')obj = Number
        else if(typeOfType === 'boolean')obj = Boolean

        return obj instanceof type;
    },
    mixin: function (clazz) {
        Object.getOwnPropertyNames(ComponentImpl.prototype).forEach(name => {
            if(name != 'constructor' && !clazz.prototype[name])
                Object.defineProperty(clazz.prototype, name, Object.getOwnPropertyDescriptor(ComponentImpl.prototype, name));
        });
        Object.defineProperty(clazz.prototype, 'fireEvent', Object.getOwnPropertyDescriptor(EventerImpl.prototype, 'fireEvent'));
        Object.defineProperty(clazz.prototype, 'fireEventParallel', Object.getOwnPropertyDescriptor(EventerImpl.prototype, 'fireEventParallel'));
    },
}

export default App;