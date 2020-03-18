import Component from "./Component";
import { TypeDef } from "../base/Type";
import Marker from "./Marker";

export default class CapturedComponent{
    private constructor(
        private component,
        private marker
    ){}
    public is(type: Component | TypeDef<any> | Marker): boolean{
        if(type == null)
            return this.component == null;
        if(this.component){
            if(typeof type == 'string' && (type as String).startsWith('vc'))
                return type == this.marker;
            ///@ts-ignore
            return _app.instanceOf(this.component, type);
        }
    }

    public get<T>(): T{
        return this.component
    }
    public getClosestComponent(types?: Array<Component | TypeDef<any> | Marker>): CapturedComponent{
        if(this.component == null)
            return this;
        ///@ts-ignore
        return _app.getClosestComponent(this.component.app$.v$.$el.parentElement, null, types);
    }
}