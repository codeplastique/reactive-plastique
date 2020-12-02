import MapEntry from "./MapEntry";
import ReactiveCollection from "../ReactiveCollection";

export default interface ReactiveReadonlyMap<K, V> extends ReactiveCollection<V>{
    forEach(callback: (value: V, key: K, map: ReactiveReadonlyMap<K, V>) => void, thisArg?: any): void;
    get(key: K): V
    getOrDefault(key: K, defaultValue: V): V
    has(key: K): boolean
    keys(): K[]
    entries(): MapEntry<K, V>[]
}