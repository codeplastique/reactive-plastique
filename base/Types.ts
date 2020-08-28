import {TypeDef} from "./Type";

export default class Types{
    public static isString(value: any): value is string{
        return typeof value === 'string'
    }
    public static isBoolean(value: any): value is boolean{
        return typeof value === 'boolean'
    }
    public static isNumber(value: any): value is number{
        return typeof value === 'number' && !isNaN(value);
    }
    public static isArray(value: any): value is Array<any>{
        return Array.isArray(value);
    }
    public static isObject(value: any): value is object{
        return typeof value === 'object' && value !== null && !this.isArray(value)
    }
    public static isFunction(value: any): value is Function{
        return typeof value === 'function'
    }
    public static is<T>(value: any, type: TypeDef<T>): value is T{
        ///@ts-ignore
        return _app.instanceOf(value, type)
    }
}