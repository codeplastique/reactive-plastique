import ReactiveCollection from "../ReactiveCollection";
import SimpleSet from "./SimpleSet";
import HashSet from "./HashSet";

export default interface ReactiveReadonlySet<V> extends ReactiveCollection<V>{
    forEach(callback: (value: V, set: ReactiveReadonlySet<V>) => void, thisArg?: any): void;
    has(value: V): boolean
}

/**
 * @return clone set
 */
export function setOf<V>(map: ReactiveReadonlySet<V>): ReactiveReadonlySet<V>
export function setOf<V>(...values: V[]): ReactiveReadonlySet<V>
export function setOf<V>(): ReactiveReadonlySet<V>
export function setOf<V>(): ReactiveReadonlySet<V>{
    let args = arguments
    if(args.length == 1 && (args[0] instanceof SimpleSet || args[0] instanceof HashSet)) {
        return new SimpleSet(args[0])
    }else {
        return SimpleSet.of.apply(null, args)
    }
}