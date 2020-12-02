import ReactiveReadonlySet from "./ReactiveReadonlySet";

export default interface ReactiveSet<V> extends ReactiveReadonlySet<V>{
    delete(value: V): boolean
    add(value: V): this
    merge(set: ReactiveSet<V>): void
}