import CapturedComponent from "./CapturedComponent";
import Eventer from "../event/Eventer";
import { TypeDef } from "../base/Type";
import AppEvent from "../event/AppEvent";

interface Component extends Eventer{
    isComponentAttached(): boolean

    getClosestComponent(types?: Array<Component | TypeDef<any>>): CapturedComponent

    fireEventOnParents<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T>

    getElement(): Element
}
export default Component;