export interface TypeDef<T>{}
export default function Type<T>(): TypeDef<T> {
    return arguments[0];
}
