import Jsonable from "../hash/Jsonable";

export default interface ReactiveCollection<V> extends Jsonable{
    size(): number
    clear(): void
    values(): V[]
}