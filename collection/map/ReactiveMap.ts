import ReactiveReadonlyMap from "./ReactiveReadonlyMap";
import MapEntry from "./MapEntry";
import SimpleMap from "./SimpleMap";

export default interface ReactiveMap<K, V> extends ReactiveReadonlyMap<K, V>{
    delete(value: K): boolean
    set(key: K, value: V): this
    merge(map: ReactiveMap<K, V>): void
}

export function mutableMapOf<K, V>(obj: object): ReactiveMap<K, V>
/**
 * @return clone map
 */
export function mutableMapOf<K, V>(map: ReactiveReadonlyMap<K, V>): ReactiveMap<K, V>
export function mutableMapOf<K, V>(mapEntries: ReadonlyArray<MapEntry<K, V>>): ReactiveMap<K, V>
export function mutableMapOf<K, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V, k5?: K, v5?: V, k6?: K, v6?: V, k7?: K, v7?: V, k8?: K, v8?: V): ReactiveMap<K, V>
export function mutableMapOf<K, V>(): ReactiveMap<K, V>
export function mutableMapOf<K, V>(): ReactiveMap<K, V>{
    let args = arguments
    if(args.length == 0 || Array.isArray(args[0]) || args[0] instanceof SimpleMap) {
        return new SimpleMap(args[0])
    }else {
        let params = args.length > 1? args: Object.entries(args[0]).flat()
        return SimpleMap.of.apply(null, params)
    }
}