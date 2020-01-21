import I18n from "../utils/I18n";
import HashSet from "../collection/HashSet";
import SimpleMap from "../collection/SimpleMap";
import Jsonable from "../hash/Jsonable";
import Component from "../component/Component";
import CapturedComponent from "../component/CapturedComponent";
import Eventer from "../event/Eventer";
import { TypeDef } from "./Type";
import AppEvent from "../event/AppEvent";
declare const Vue: any;
declare const _app: any;

class EventerImpl implements Eventer{
    static listeners: {[eventName: string]: Array<(event?: any, caller?: any) => Promise<any>>} = {} 
    constructor(private $caller){}

    public static addListener(eventName: string, func: Function): void{
        if(EventerImpl.listeners[eventName] == null)
            EventerImpl.listeners[eventName] = [];
        ///@ts-ignore
        EventerImpl.listeners[eventName].push(func);
    }
    public fireEvent<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T[]>{
        eventName = eventName.toLowerCase();
        if(EventerImpl.listeners[eventName as string] == null){
            console.log('No listeners for event: '+ eventName);
            ///@ts-ignore
            return Promise.resolve();
        }
        return Promise.all(EventerImpl.listeners[eventName as string].map(func => func(eventObject, this.$caller? this.$caller: this)));
    }
}
class ComponentImpl extends EventerImpl implements Component{
    public isComponentAttached(): boolean{
        //@ts-ignore
        return this.app$.v$ != null
    }
    public getClosestComponent(types?: Array<Component | TypeDef<any>>): CapturedComponent {
        //@ts-ignore
        if(this.app$.v$ == null)
            throw new Error('Component is not attached!')
        //@ts-ignore
        return _app.getClosestComponent(this.app$.v$.$el.parentElement, null, types);
    }
    public fireEventOnParents<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T>{
        eventName = eventName.toLowerCase();
        ///@ts-ignore
        let parent = this.app$.parent;
        while(parent){
            if(parent.app$.events[eventName as string])
                return Promise.resolve(parent.app$.events[eventName as string][0](eventObject, this));
            parent = parent.app$.parent;
        }
        console.log('No parent listeners for event: '+ eventName);
        ///@ts-ignore
        return Promise.resolve();
    }
    // attach
    // detach

    //when attached
    //when dettached
}
abstract class App{
    private static beanNameToDef: {[beanName: string]: Function | Object} = {};
    private static beanIdToName: {[beanId: number]: string} = {};
    private static componentId = 0;
    private static epName: string; //entry point name
    private static ep: Object; //entry point

    private static getClosestComponent(parent: any, topLimitElem: HTMLElement, types?: Array<Component | TypeDef<any>>) {
        if(parent)
            while(true){
                let virtualComponent: any
                if(parent.hasAttribute('data-vcn')){
                    virtualComponent = parent.getAttribute('data-vcn');
                    parent = parent.parentElement.closest('[data-cn]');
                }
                if(virtualComponent || parent.hasAttribute('data-cn')){
                    if(parent.__vue__ == null) //if server template
                        break
                    if(types){
                        for(let type of types){
                            ///@ts-ignore
                            if(_app.instanceOf(parent.__vue__._data, type))
                                ///@ts-ignore
                                return new CapturedComponent(parent.__vue__._data, virtualComponent);
                        }
                    }else
                        ///@ts-ignore
                        return new CapturedComponent(parent.__vue__._data, virtualComponent);
                }
                parent = parent.parentElement && parent.parentElement.closest('[data-cn],[data-vcn]');
                if(parent == null || (topLimitElem && !topLimitElem.contains(parent)))
                    break
            }
        ///@ts-ignore
        return new CapturedComponent();
    }

    public static getBean<T>(id: String | Number, componentObj?: object): T{
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
        if(bean instanceof Function)
            App.beanNameToDef[beanName] = bean = bean();
        return bean;
    }   
    public getBean<T>(beanFunction: string): T{
        return App.getBean(beanFunction);
    }   
    

    private static initComponent(componentName: string, configuration: string, obj: any, templateGenerator: Function){
        let config = JSON.parse(configuration);
        // let teplateName = config.tn || componentName;
        let componentMethod = function(methodName: string){
            return function(){ return this._data.app$.clazz[methodName].apply(this._data, arguments)}
        };
        if(obj.app$){
            //from super
            // obj.app$.pc.super = obj.app$.cn;
            obj.app$.cn = componentName; //replace parent name to child name
            Object.assign(obj.app$.pc.w, config.w);
            // obj.app$.pc.c = obj.app$.pc.c.concat(config.c);
            obj.app$.pc.ep = (obj.app$.pc.ep || []).concat(config.ep); // element prop
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

        // if(config.ep){ // element props
        //     for(let prop of config.ep)
        //         Object.defineProperty(obj, prop, {
        //             enumerable: true,
        //             get: function(prop){ return function(){ 
        //                 return this.app$.v$? this.app$.v$.$refs[prop]: null}
        //             }(prop)
        //         })
        // }

        let render = obj.app$.tg();
        Vue.component(componentName, {
            props: ['m'],
            data: function(elementProps: string[]){
                return function () {
                    if(elementProps){ // element props
                        for(let prop of elementProps)
                            if(!(prop in this.m))
                                Object.defineProperty(this.m, prop, {
                                    enumerable: true,
                                    get:  function(){ 
                                        return this.app$.v$? this.app$.v$.$refs[prop]: null
                                    }
                                })
                    }
                    return this.m
                }
            }(configurator.ep),
            methods: methodNameToMethod,
            watch: memberNameToWatchMethod,
            // computed: {},
            render: render.r,
            staticRenderFns: render.s,
            mounted: config.ah? methodNameToMethod[config.ah]: null,
            beforeDestroy: config.dh? methodNameToMethod[config.dh]: null
        });
    }

    private static addListeners(configuration: string, obj: any){
        let methodNameToEvent = JSON.parse(configuration);
        for(let methodName in methodNameToEvent){
            let event = methodNameToEvent[methodName];
            let method = obj[methodName].bind(obj);
            if(obj.app$){
                let events = obj.app$.events[event] = obj.app$.events[event] || [];
                events.push(method);
            }
            EventerImpl.addListener(event, method);
        }
    }

    constructor(element?: HTMLElement){
        let $ = this.constructor['$'];
        if($){
            let configurator = JSON.parse($);
            App.beanIdToName['0'] = 'Eventer';

            let beansClasses = this.constructor['$beans'] || [];
            beansClasses.push(this);
            for(let i = 0; i < configurator.beans.length; i++){
                let beanClassBeans = configurator.beans[i];
                let beanClass = beansClasses[i] != this? new beansClasses[i](): beansClasses[i];
                for(let bean in beanClassBeans){
                    let [beanId, beanName] = bean.split(';');
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
            methods: {
                $convState: function (isWithState: number, iterable: object | any[]){
                    let arr = [], size: number, getValue: (i: number) => object;
                    if(iterable instanceof SimpleMap){
                        size = iterable.size;
                        let entries = iterable.entries(); 
                        getValue = (i) => {
                            let val = entries.next().value;
                            return {key: val[0], value: val[1]};
                        }
                    }else if(iterable instanceof HashSet){
                        size = iterable.size;
                        let values = iterable.values();
                        getValue = (i) => values.next().value;
                    }else if(iterable instanceof Array){
                        size = iterable.length;
                        getValue = i => iterable[i];
                    }else
                        throw new Error('You cant iterate simple object!')

                    for(var i = 0; i < size; i++){
                        let value = getValue(i);
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
                // mounted: function(){
                //     if(this.attachedComponents[this]){
                //         let func = (res, rej) => {res(this);}
                //         this.attachedComponents[this].promise = new Promise(func);
                //     }
                // }
                // $convDblClick: function(event, clickAction: any, dblClickAction: Function) {
                //     let target = event.currentTarget;
                //     if(target.cc == null)
                //         target.cc = 1; // click count
                //     else 
                //         target.cc++;
                //     if(target.cc == 1) {
                //         target.cct = setTimeout(() => {
                //             target.cc = 0;
                //             clickAction(event);
                //         }, 700);
                //     }else{
                //         clearTimeout(target.cct);  
                //         target.cc = 0;
                //         dblClickAction(event);
                //     }  
                // }
            }
        });
    }

    public attachComponent(element: HTMLElement, component: Component){
        // if(!this.isComponentAttached(component)){
        new Vue({
            el: element,
            data: {c: component},
            template: 
            '<component :is="c.app$.cn" :key="c.app$.id" v-bind:m="c"></component>'
        });
        // }else{
        //     console.log(component);
        //     throw new Error('Component is already attached!')
        // }
    }

    public isComponentAttached(component: Component){
        let parent = component;
        while(parent){
            if(parent['_isVue'])
                return true;
            ///@ts-ignore
            parent = parent.app$.parent;
        }
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
    interface Clazz extends Function{}
    interface Object{
        equals(obj: Object): boolean;
    }
    interface Array<T> extends Jsonable{
        remove(index: number): Array<T>;
        removeValue(value: T): boolean;
        removeValues(value: T[]): void;
        set(index: number, value: T): Array<T>;
        includes(searchElement: T, fromIndex?: number): boolean;
    }

    interface Event{
        getClosestComponent: (types?: Array<Component | TypeDef<any>>) => CapturedComponent
    }

    interface Element{
        getClosestComponent: (types?: Array<Component | TypeDef<any>>) => CapturedComponent
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
Array.prototype.set = function (index: number, value: any) {
    if(this.length >= index)
        this.push(value);
    if("__ob__" in this)
        Vue.set( this, index, value);
    else
        this[index] = value;
    return this;
}
Element.prototype.getClosestComponent = function(types?: Array<Component | TypeDef<any>>) {
    return _app.getClosestComponent(this, null, types);
}
Event.prototype.getClosestComponent = function(types?: Array<Component | TypeDef<any>>) {
    return _app.getClosestComponent(this.target, this.currentTarget, types);
}

//ES 6 support
declare global {
    interface Object {
        values(obj: Object): Array<any>;
        entries(obj: Object): [string, any];
    }
}
if (!Object.values || !Object.entries) {
    const reduce = Function.bind.call(Function.call, Array.prototype.reduce);
    const isEnumerable = Function.bind.call(Function.call, Object.prototype.propertyIsEnumerable);
    const concat = Function.bind.call(Function.call, Array.prototype.concat);
    const keys = Reflect.ownKeys;
	Object.values = function values(O) {
		return reduce(keys(O), (v, k) => concat(v, typeof k === 'string' && isEnumerable(O, k) ? [O[k]] : []), []);
    };
    Object.entries = function entries(O) {
		return reduce(keys(O), (e, k) => concat(e, typeof k === 'string' && isEnumerable(O, k) ? [[k, O[k]]] : []), []);
	};
}
if(!Array.prototype.includes){
    Array.prototype.includes = function(searchElement: any, fromIndex?: number){
        for(let i = fromIndex || 0; i < this.length; i++)
            if(searchElement === this[i] || (isNaN(searchElement) && isNaN(this[i])))
                return true;
        return false;
    }
}
window['_app'] = {
    instanceOf: function (obj, type) {
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
        // public isComponentAttached(): boolean{
        //     //@ts-ignore
        //     return this.app$.v$ != null
        // }
        // public getClosestComponent(types?: Array<Component | TypeDef<any>>): CapturedComponent {
        //     //@ts-ignore
        //     if(this.app$.v$ == null)
        //         throw new Error('Component is not attached!')
        //     //@ts-ignore
        //     return _app.getClosestComponent(this.app$.v$.$el, null, types);
        // }
        // public fireEventOnParents<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T>{

        Object.getOwnPropertyNames(ComponentImpl.prototype).forEach(name => {
            if(name != 'constructor')
                Object.defineProperty(clazz.prototype, name, Object.getOwnPropertyDescriptor(ComponentImpl.prototype, name));
        });
        Object.defineProperty(clazz.prototype, 'fireEvent', Object.getOwnPropertyDescriptor(EventerImpl.prototype, 'fireEvent'));
    },
}

export default App;