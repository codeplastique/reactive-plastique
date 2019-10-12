import Component from "./Component";
import EventManager from "./EventManager";
import I18n from "./I18n";
import HashSet from "./HashSet";
import SimpleMap from "./SimpleMap";
import Serializable from "./annotation/Serializable";
import Jsonable from "./annotation/Jsonable";
declare const Vue: any;
declare const _VueTemplates: any;


declare global {
    interface Array<T> extends Serializable, Jsonable{
        remove(index: number): Array<T>;
        removeValue(value: T): boolean;
        removeValues(value: T[]): void;
        set(index: number, value: T): Array<T>;
    }

    interface Event{
        getClosestComponent: (types?: Component[]) => Component
    }
}
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
Array.prototype.serialize = function() {
    let result = [];
    for(let elem of this)
        result.push(elem.serialize? elem.serialize(): elem);
    return result;
}
Array.prototype.toJson = function () {
    return JSON.stringify(this.serialize());
}

Event.prototype.getClosestComponent = function(types?: Function[]) {
    let parent = this.target;
    while(true){
        if(parent.hasAttribute('data-cn')){
            if(types){
                for(let type of types)
                    if(parent.__vue__._data instanceof type)
                        return parent.__vue__._data;
            }else
                return parent.__vue__._data
        }
        parent = parent.closest('[data-cn]');
        if(parent == null || !this.currentTarget.contains(parent))
            return;
    }
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

abstract class App{
    private static beanNameToDef: {[beanName: string]: Function | Object} = {};
    private static beanIdToName: {[beanId: number]: string} = {};
    private static componentId = 0;
    private static epName: string; //entry point name
    private static ep: Object; //entry point
    public static getBean<T>(id: String | Number, componentObj?: object): T{
        if(id == -1 || id == App.epName)
            return App.ep as T;
        let beanName: any = typeof id == 'number'? App.beanIdToName[id as number]: id;
        if(beanName == 'EventManager' && componentObj){
            ///@ts-ignore
            return new EventManager(componentObj);
        }
        let bean: any = App.beanNameToDef[beanName];
        if(bean instanceof Function)
            App.beanNameToDef[beanName] = bean = bean();
        return bean;
    }   
    public getBean<T>(beanFunction: string): T{
        return App.getBean(beanFunction);
    }   
    

    private static initComponent(componentName: string, configuration: string, obj: any){
        let config = JSON.parse(configuration);
        let componentMethod = function(methodName: string){
            return function(){ return this.app$.clazz[methodName].apply(this, arguments)}
        };
        if(obj.app$){
            //from super
            // obj.app$.pc.super = obj.app$.cn;
            obj.app$.cn = componentName; //replace parent name to child name
            Object.assign(obj.app$.pc.w, config.w);
            obj.app$.pc.c = obj.app$.pc.c.concat(config.c);
        }else{
            obj.app$ = {
                cn: componentName,
                id: ++App.componentId,
                clazz: obj,
                events: {},
                pc: config// parent configuration
            }
        }
        if(_VueTemplates[componentName] == null || Vue.component(componentName) != null)
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

        Vue.component(componentName, {
            props: ['m'],
            data: function () {
                return this.m
            },
            methods: methodNameToMethod,
            watch: memberNameToWatchMethod,
            // computed: {},
            render: _VueTemplates[componentName].r,
            staticRenderFns: _VueTemplates[componentName].s,
            mounted: config.ah? methodNameToMethod[config.ah]: null,
            beforeDestroy: config.dh? methodNameToMethod[config.dh]: null
        });

        if(config.ep){ // element props
            for(let prop of config.ep)
                Object.defineProperty(obj, prop, {
                    get: function(prop){ return function(){ return this.$refs[prop]}}(prop)
                })
        }
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
            ///@ts-ignore
            EventManager.addListener(event, method);
        }
    }

    constructor(){
        let $ = this.constructor['$'];
        if($){
            let configurator = JSON.parse($);
            App.beanIdToName['0'] = 'EventManager';
            ///@ts-ignore 
            App.beanNameToDef['EventManager'] = new EventManager();
            for(let bean in configurator.beans){
                let beanIdAndName = bean.split(';');
                App.beanIdToName[beanIdAndName[0]] = beanIdAndName[1];
                App.beanNameToDef[beanIdAndName[1]] = this[configurator.beans[bean]];
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
        window['_app'] = {
            bean: App.getBean,
            initComp: App.initComponent,
            i18n: I18n.text,
            listeners: App.addListeners
        };
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
                    if(component.app$.parent != this.app$.clazz)
                        component.app$.parent = this.app$.clazz;
                    if(component.app$.pc)
                        delete component.app$.pc;
                    return component;
                },
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
    

    public setLocale(locale: string){
        ///@ts-ignore
        // if(I18n.locale != locale){
        //     this.locale = locale;
        // }
    }
}

export default App;