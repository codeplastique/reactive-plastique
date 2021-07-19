import MapEntry from "./MapEntry";
import ReactiveCollection from "../ReactiveCollection";
import ReactiveMap, {mutableMapOf} from "./ReactiveMap";

export default interface ReactiveReadonlyMap<K, V> extends ReactiveCollection<V>{
    forEach(callback: (value: V, key: K, map: ReactiveReadonlyMap<K, V>) => void, thisArg?: any): void;
    get(key: K): V
    getOrDefault(key: K, defaultValue: V): V
    has(key: K): boolean
    keys(): K[]
    map <T>(action: (key: K, value: V) => T): T[]
    mapValues <V2>(action: (value: V) => V2): ReactiveMap<K, V2>
    entries(): MapEntry<K, V>[]
}

export function mapOf<K, V>(obj: object): ReactiveReadonlyMap<K, V>
/**
 * @return clone map
 */
export function mapOf<K, V>(map: ReactiveReadonlyMap<K, V>): ReactiveReadonlyMap<K, V>
export function mapOf<K, V>(mapEntries: ReadonlyArray<MapEntry<K, V>>): ReactiveReadonlyMap<K, V>
export function mapOf<K, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V, k5?: K, v5?: V, k6?: K, v6?: V, k7?: K, v7?: V, k8?: K, v8?: V): ReactiveReadonlyMap<K, V>
export function mapOf<K, V>(): ReactiveReadonlyMap<K, V>
export function mapOf<K, V>(): ReactiveReadonlyMap<K, V>{
    return mutableMapOf.apply(null, arguments)
}