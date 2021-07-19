import ReactiveReadonlySet from "./ReactiveReadonlySet";
import SimpleSet from "./SimpleSet";
import HashSet from "./HashSet";

export default interface ReactiveSet<V> extends ReactiveReadonlySet<V>{
    delete(value: V): boolean
    add(value: V): this
    merge(set: ReactiveSet<V>): void
}

/**
 * @return clone set
 */
export function mutableSetOf<V>(map: ReactiveReadonlySet<V>): ReactiveSet<V>
export function mutableSetOf<V>(...values: V[]): ReactiveSet<V>
export function mutableSetOf<V>(): ReactiveSet<V>
export function mutableSetOf<V>(): ReactiveSet<V>{
    let args = arguments
    if(args.length == 1 && (args[0] instanceof SimpleSet || args[0] instanceof HashSet)) {
        return new SimpleSet(args[0])
    }else {
        return SimpleSet.of.apply(null, args)
    }
}