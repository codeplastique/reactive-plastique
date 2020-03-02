import AppEvent from "./AppEvent";

export default interface Eventer{
    /**
     * calling event listener step by step. Next listener is not called until the previous listener is completed
     */
    fireEvent<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T[]>
    /**
     * calling event listeners in parallel
     */
    fireEventParallel<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T[]>
}