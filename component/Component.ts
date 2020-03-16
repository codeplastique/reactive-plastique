import CapturedComponent from "./CapturedComponent";
import Eventer from "../event/Eventer";
import { TypeDef } from "../base/Type";
import AppEvent from "../event/AppEvent";
import Hashable from "../hash/Hashable";

interface Component extends Eventer, Hashable{
    isComponentAttached(): boolean

    getClosestComponent(types?: Array<Component | TypeDef<any>>): CapturedComponent

    fireEventOnParents<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T>

    getElement(): Element;

    whenAttached(callback: Function): void;
    
    whenDetached(callback: Function): void;

    getSlots(): string[]
}
export default Component;