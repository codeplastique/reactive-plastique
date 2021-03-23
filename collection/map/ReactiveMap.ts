import ReactiveReadonlyMap from "./ReactiveReadonlyMap";

export default interface ReactiveMap<K, V> extends ReactiveReadonlyMap<K, V>{
    delete(value: K): boolean
    set(key: K, value: V): this
    merge(map: ReactiveMap<K, V>): void
    mapValues <V2>(action: (value: V) => V2): ReactiveMap<K, V2>
}