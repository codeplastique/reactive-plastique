import Component from "./Component";
import EventManager from "./EventManager";
declare const Vue: any;
declare const _VueTemplates: any;

abstract class App{
    private static beans: {[beanName: string]: Function | Object} = {};
    private static beansNames: string[] = [];
    private componentId = 0;
    public static getBean<T>(id: String | Number): T{
        let beanName: any = id instanceof Number? App.beansNames[id as number]: id;
        let bean: any = App.beans[beanName];
        if(bean instanceof Function)
            App.beans[beanName] = bean = bean();
        return bean;
    }   
    public getBean<T>(beanFunction: string): T{
        return App.getBean(beanFunction);
    }   
    
    private initComponent(configuration: string, component: any){
        let configurator = JSON.parse(configuration);
        let methodNameToMethod: any = {};
        let methodNameToComputed: any = {};
        let computedMethods = configurator.c;
        let memberNameToWatchMethod = configurator.w;
        for(let methodName in component.prototype){
            if(computedMethods.indexOf(methodName) >= 0)
                methodNameToComputed['$s' + methodName] = function(){return this.$.clazz[methodName].apply(this, arguments)}
            else
                methodNameToMethod[methodName] = function(){return this.$.clazz[methodName].apply(this, arguments);}
        }
        for(let member in memberNameToWatchMethod){
            let methodName = memberNameToWatchMethod[member];
            memberNameToWatchMethod[member] = function(){return this.$.clazz[methodName].apply(this, arguments)};
        }

        Vue.component(configurator.cn, {
            props: ['m'],
            data: function () {
                return this.m
            },
            methods: methodNameToMethod,
            watch: memberNameToWatchMethod,
            // computed: {},
            render: _VueTemplates[configurator.cn]  
        });
    }

    constructor(){
        let $ = this.constructor['$'];
        if($){
            let configurator = JSON.parse($);
            for(let bean in configurator.beans)
                App.beans[bean] = this[configurator.beans[bean]];
            App.beans[configurator.name] = this; // add self as bean
            ///@ts-ignore
            App.beans['EventManager'] = new EventManager();
            App.beansNames = Object.keys(App.beans);
        }
        window['_app'] = {
            bean: App.getBean,
            initComp: this.initComponent
            // i18n: I18n.text
        };
        this.genVueMixins();
    }

    private genVueMixins(){
        let superThis = this;
        Vue.mixin({
            methods: {
                $convState: function _convert(iterable: object | any[]){
                    let arr = [], size: number, value: (i: number) => object;
                    if(!(iterable instanceof Array)){
                        let keys = Object.keys(iterable);
                        size =  keys.length;
                        value = i => ({key: keys[i], value: iterable[keys[i]]});
                    }else{
                        size = iterable.length;
                        value = i => iterable[i];
                    }
                    for(var i = 0; i < size; i++)
                        arr.push({v: value(i), s:{index: i, size: size, last: i == (size-1), first: i == 0}});
                    return arr;
                },
                $convComp: function(obj: any){
                    if(typeof(obj.$) == 'string'){
                        obj.$ = {
                            cn: obj.$.cn,
                            id: ++superThis.componentId,
                            clazz: obj
                        }
                    }
                    return obj;
                } 
            }
        });
    }

    public attachComponent(element: HTMLElement, component: Component){
        ///@ts-ignore
        if(!this.isComponentAttached(component)){
            ///@ts-ignore
            Vue.component(component.$, {
                el: element,
                data: {c: component},
                template: 
                '{{void $convComp(c)}}<component :is="c.$.cn" :key="c.$.id" v-bind:m="c"></component>'
            });
        }else{
            console.log(component);
            throw new Error('Component is already attached!')
        }
    }

    public isComponentAttached(component: Component){
        ///@ts-ignore
        return typeof(component.$) == 'object';
    }
}

export default App;