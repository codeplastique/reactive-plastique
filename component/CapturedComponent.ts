import Component from "./Component";
import { TypeDef } from "../base/Type";

export default class CapturedComponent{
    private constructor(
        private component,
        private virtualComponent
    ){}
    public is(type: Component | TypeDef<any>): boolean{
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
}