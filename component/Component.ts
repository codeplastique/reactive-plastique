import CapturedComponent from "./CapturedComponent";
import Eventer from "../event/Eventer";
import { TypeDef } from "../base/Type";
import AppEvent from "../event/AppEvent";
import Hashable from "../hash/Hashable";

interface Component extends Eventer, Hashable{
    isComponentAttached(): boolean

    getClosestComponent(types?: Array<Class<Component> | TypeDef<any>>): CapturedComponent

    fireEventOnParents<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T>

    /**
     * Execute action as if the component had the specified parents.
     * The real parents are ignored.
     * Useful when the component is not attached.
     * @param parents in ascending order
     */
    runWithFakeParents(action: Function, ...parents: Component[]): Promise<any>

    getElement(): Element;

    whenAttached(callback: Function): void;
    
    whenDetached(callback: Function): void;

    getSlots(): string[]
}
export default Component;