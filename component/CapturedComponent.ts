import Component from "./Component";
import { TypeDef } from "../base/Type";
import VirtualComponent from "./VirtualComponent";

export default class CapturedComponent{
    private constructor(
        private component,
        private virtualComponent
    ){}
    public is(type: Component | TypeDef<any> | VirtualComponent): boolean{
        if(type == null)
            return this.component == null;
        if(this.component){
            if(typeof type == 'string' && (type as String).startsWith('vc'))
                return type == this.virtualComponent;
            ///@ts-ignore
            return _app.instanceOf(this.component, type);
        }
    }

    public get<T extends Component>(): T{
        return this.component
    }
    public getClosestComponent(types?: Array<Component | TypeDef<any>>): CapturedComponent{
        if(this.component == null)
            return this;
        ///@ts-ignore
        return _app.getClosestComponent(this.component.app$.v$.$el, null, types);
    }
}