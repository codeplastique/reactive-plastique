import Jsonable from "../hash/Jsonable";

export interface MapEntry<K, V>{
    key: K
    value: V
}
export default interface ReactiveMap<K, V> extends Jsonable{
    size(): number
    clear(): void
    delete(key: K): boolean 
    forEach(callback: (value: V, key: K, map: ReactiveMap<K, V>) => void, thisArg?: any): void;
    get(key: K): V 
    has(key: K): boolean
    set(key: K, value: V): this
    keys(): K[] 
    values(): V[] 
    entries(): MapEntry<K, V>[]

    merge(map: ReactiveMap<K, V>): void
}