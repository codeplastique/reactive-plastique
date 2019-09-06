class App{
    private static beans: {[beanName: string]: Function | Object} = {};
    private static beansNames: string[] = [];
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
    
    constructor(){
        if(this['$beans']){
            App.beans = this['$beans'];
            App.beans = this['$beans'];
            App.beansNames = Object.keys(App.beans);
        }
    }

   
    public addComponent(domId: string, component: any){
        if(component.$.vue == null){
             ///@ts-ignore
            component.$.vue = generateVueComponent(component, _VueTemplates[component.$.cn.toLowerCase()], domId);
        }
    }
}

export default App;