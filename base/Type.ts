export interface TypeDef<T> extends Function{}
export default function Type<T>(type?: any): TypeDef<T> {
    return type;
}
