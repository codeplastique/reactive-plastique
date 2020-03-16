import Jsonable from "../hash/Jsonable";

export default interface ReactiveSet<V> extends Jsonable{
    size(): number
    clear(): void
    delete(value: V): boolean 
    forEach(callback: (value: V, set: ReactiveSet<V>) => void, thisArg?: any): void;
    has(value: V): boolean
    add(value: V): this
    values(): V[] 

    merge(set: ReactiveSet<V>): void
}