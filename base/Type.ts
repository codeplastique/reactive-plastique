export interface TypeDef<T> extends Function, VoidFunction{}
export default function Type<T>(type?: any): TypeDef<T> {
    return type;
}