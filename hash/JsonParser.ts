import Reactive from "../component/Reactive";

const enum CONFIG_FIELD{
    CONSTRUCTOR, //constructor properties,  ['param1', '*param2', ...], '*...' - optional param
    FIELDS, //fields ,  ['param1', '*param2', ...], '*...' - optional param
}

export default class JsonParser{
    public static convert<T>(raw: object, clazz: Class<T>): T{

        let jsonConfiguration: Array<any> = clazz.constructor['$json'];
        if(jsonConfiguration){
            let constructorProps: string[] = jsonConfiguration[CONFIG_FIELD.CONSTRUCTOR]
            let result: T;
            if(constructorProps){
                let values = this.getObjectValues(raw, constructorProps)
                result = new (clazz.bind.apply(clazz, values))();
            }else {
                result = new clazz();
            }

            let fieldProps: string[] = jsonConfiguration[CONFIG_FIELD.FIELDS];
            return this.cloneToWithRequired(raw, result, fieldProps) as any;

        }else {
            let result = new clazz();
            return this.cloneToWithRequired(raw, result) as any;
        }
    }


    protected static getObjectValues(raw: object, fieldNames: string[]): Array<string | number | boolean>{
        let result = [];
        for(let field of fieldNames){
            let isRequired = field.startsWith('*');
            field = isRequired? field.substring(1): field;
            if(isRequired && !(field in raw))
                throw new Error('Json object has no a required field: '+ field);
            result.push(raw[field]);
        }
        return result;
    }


    // private getObjectValues(obj: object, fieldNames: string[]): any{
    //     return fieldNames.map(f => obj[f])
    // }

    // private getFieldsNames(obj: object, namesIndices): string[]{
    //     return Object.keys(obj).filter((_, i) => namesIndices.includes(i));
    // }


    // private callSetterAuto(from: object, result: object, fromFields: string[], isRequired?: boolean){
    //     if(fromFields) {
    //         let fieldToSetterName = fromFields.reduce((obj, f) => {
    //             obj[f] = 'set' + f[0].toUpperCase() + (f.length > 1 ? f.substring(1) : '');
    //             return obj;
    //         }, {})
    //         this.callSetter(
    //             from,
    //             result,
    //             fieldToSetterName,
    //             isRequired
    //         )
    //     }
    // }
    // private callSetter(from: object, result: object, fromFieldToResultSetter: {[fromField: string]: string}, isRequired?: boolean){
    //     if(fromFieldToResultSetter) {
    //         for (let field in fromFieldToResultSetter) {
    //             let setterName = fromFieldToResultSetter[field];
    //             if (field in from) {
    //                 let value = from[field];
    //                 result[setterName](value);
    //             } else if (isRequired)
    //                 throw new Error('Field ' + field + ' is not found in json object');
    //         }
    //     }
    // }
    //
    // private cloneTo2(from: any, result: any, clazzOfFrom: Class<any>): object{
    //     let requiredMethods = clazzOfFrom.constructor['$json'];
    //
    //     this.callSetterAuto(from, result, requiredMethods[CONFIG_FIELD.OPTIONAL_METHOD_AUTO])
    //     this.callSetter(from, result, requiredMethods[CONFIG_FIELD.OPTIONAL_METHOD])
    //
    //     this.callSetterAuto(from, result, requiredMethods[CONFIG_FIELD.REQUIRED_METHOD_AUTO], true)
    //     this.callSetter(from, result, requiredMethods[CONFIG_FIELD.REQUIRED_METHOD], true)
    //
    //     for(let field in from) {
    //         if(field in result){
    //             let value = from[field];
    //             if(Array.isArray(value)){
    //                 result[field]= value;
    //             }else if(value != null && typeof value === 'object') {
    //                 // to[field] = this.cloneTo(value, {});
    //             }else
    //                 result[field] = value;
    //         }
    //     }
    //     return result;
    // }

    // private cloneTo(from: any, to: any): object{
    //     for(let field in from) {
    //         if(field in to){
    //             let value = from[field];
    //             if(Array.isArray(value)){
    //                 to[field]= value;
    //             }else if(value != null && typeof value === 'object') {
    //                 // to[field] = this.cloneTo(value, {});
    //             }else
    //                 to[field] = value;
    //         }
    //     }
    //     return to;
    // }

    private static getFieldToOptional(keys: string[]): {[field: string]: boolean}{
        if(keys.length > 0) {
            let fieldToOptional = {}
            for (let key of keys) {
                let isOptional = key.startsWith('*');
                let keyName = isOptional ? key.substring(1) : key;
                fieldToOptional[keyName] = isOptional;
            }
            return fieldToOptional;
        }else
            return null;
    }

    private static cloneToWithRequired(from: any, to: any, keys?: string[]): object{
        let fieldToOptional = this.getFieldToOptional(keys);
        for(let field in to) {
            if(fieldToOptional != null) {
                if(field in fieldToOptional) {
                    let isRequired = fieldToOptional[field];
                    if(field in from)
                        to[field] = from[field];
                    else if(isRequired)
                        throw new Error('Json object has no a required field: ' + field);
                }
            }else if(field in from){
                to[field] = from[field];
            }
        }
        return to;
    }
}