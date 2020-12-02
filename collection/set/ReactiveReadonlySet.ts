import ReactiveCollection from "../ReactiveCollection";

export default interface ReactiveReadonlySet<V> extends ReactiveCollection<V>{
    forEach(callback: (value: V, set: ReactiveReadonlySet<V>) => void, thisArg?: any): void;
    has(value: V): boolean
}