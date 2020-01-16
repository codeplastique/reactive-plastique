import AppEvent from "./AppEvent";

export default interface Eventer{
    fireEvent<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T[]>
}