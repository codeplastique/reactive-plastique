import Component from "./Component";
import EventManager from "./EventManager";
import I18n from "./I18n";
import HashSet from "./HashSet";
import SimpleMap from "./SimpleMap";
declare const Vue: any;
declare const _VueTemplates: any;


declare global {
    interface Array<T> {
        remove(index: number): Array<T>;
        removeValue(value: T): boolean;
        set(index: number, value: T): Array<T>;
    }
}
Array.prototype.remove = function (index: number) {
    if("__ob__" in this)
        Vue.delete( this.keyToVal, index);
    else
        this.splice(index, 1);
    return this;
}
Array.prototype.removeValue = function (value: any) {
    for(let i = 0; i < this.length; i++)
        if(this[i] == value){
            this.remove(i);
            return true;
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
        Object.defineProperty(obj, "app$", {get: () => {
            return {
                cn: componentName,
                id: ++App.componentId,
                clazz: obj,
                events: {}
            }
        }})
        if(Vue.component(componentName) != null)
            return;
        let configurator = JSON.parse(configuration);
        let methodNameToMethod: any = {};
        let methodNameToComputed: any = {};
        let computedMethods = configurator.c;
        let memberNameToWatchMethod = configurator.w;
        for(let methodName in obj.constructor.prototype){
            if(computedMethods.indexOf(methodName) >= 0)
                methodNameToComputed['$s' + methodName] = function(){return this.app$.clazz[methodName].apply(this, arguments)}
            else
                methodNameToMethod[methodName] = function(){return this.app$.clazz[methodName].apply(this, arguments);}
        }
        for(let member in memberNameToWatchMethod){
            let methodName = memberNameToWatchMethod[member];
            memberNameToWatchMethod[member] = function(){return this.app$.clazz[methodName].apply(this, arguments)};
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
            staticRenderFns: _VueTemplates[componentName].s
        });
    }

    private static addListeners(configuration: string, obj: any){
        let methodNameToEvent = JSON.parse(configuration);
        for(let methodName in methodNameToEvent){
            let event = methodNameToEvent[methodName];
            let method = obj[methodName];
            ///@ts-ignore
            EventManager.addListener(event, method);
            if(obj.app$){
                let events = obj.app$.events[event] = obj.app$.events[event] || [];
                events.push(method);
            }
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
                    return component;
                }
            }
        });
    }

    public attachComponent(element: HTMLElement, component: Component){
        if(!this.isComponentAttached(component)){
            new Vue({
                el: element,
                data: {c: component},
                template: 
                '<component :is="c.app$.cn" :key="c.app$.id" v-bind:m="c"></component>'
            });
        }else{
            console.log(component);
            throw new Error('Component is already attached!')
        }
    }

    public isComponentAttached(component: Component){
        return "__ob__" in component;
    }
    public setLocale(locale: string){
        ///@ts-ignore
        // if(I18n.locale != locale){
        //     this.locale = locale;
        // }
    }
}

export default App;