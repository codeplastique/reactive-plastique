// const enum CONFIG_FIELD{
//     CONSTRUCTOR,
//
//     OPTIONAL_METHOD,
//     OPTIONAL_METHOD_AUTO,
//
//     REQUIRED_METHOD,
//     REQUIRED_METHOD_AUTO,
//
//     OPTIONAL_FIELDS,
//     REQUIRED_FIELDS,
// }
//
// export default class JsonParser{
//     public parse<T>(json: string, clazz: Class<T>): T{
//         let raw = JSON.parse(json);
//
//         let jsonConfiguration = clazz.constructor['$json'];
//         if(jsonConfiguration){
//             let constructorProps = jsonConfiguration[CONFIG_FIELD.CONSTRUCTOR]
//             let result: T;
//             if(constructorProps){
//                 let values = this.getObjectValues(raw, this.getFieldsNames())
//                 values.unshift(void 0)
//                 result = new (clazz.bind.apply(clazz, values))();
//             }else {
//                 result = new clazz();
//             }
//
//             this.cloneTo(raw, result);
//
//         }else {
//             let result = new clazz();
//             return this.cloneTo(raw, result) as any;
//         }
//
//
//         return null;
//     }
//
//
//
//
//     private getObjectValues(obj: object, fieldNames: string[]): any{
//         return fieldNames.map(f => obj[f])
//     }
//
//     private getFieldsNames(obj: object, namesIndices): string[]{
//         return Object.keys(obj).filter((_, i) => namesIndices.includes(i));
//     }
//
//
//     private callSetterAuto(from: object, result: object, fromFields: string[], isRequired?: boolean){
//         if(fromFields) {
//             let fieldToSetterName = fromFields.reduce((obj, f) => {
//                 obj[f] = 'set' + f[0].toUpperCase() + (f.length > 1 ? f.substring(1) : '');
//                 return obj;
//             }, {})
//             this.callSetter(
//                 from,
//                 result,
//                 fieldToSetterName,
//                 isRequired
//             )
//         }
//     }
//     private callSetter(from: object, result: object, fromFieldToResultSetter: {[fromField: string]: string}, isRequired?: boolean){
//         if(fromFieldToResultSetter) {
//             for (let field in fromFieldToResultSetter) {
//                 let setterName = fromFieldToResultSetter[field];
//                 if (field in from) {
//                     let value = from[field];
//                     result[setterName](value);
//                 } else if (isRequired)
//                     throw new Error('Field ' + field + ' is not found in json object');
//             }
//         }
//     }
//
//     private cloneTo2(from: any, result: any, clazzOfFrom: Class<any>): object{
//         let requiredMethods = clazzOfFrom.constructor['$json'];
//
//         this.callSetterAuto(from, result, requiredMethods[CONFIG_FIELD.OPTIONAL_METHOD_AUTO])
//         this.callSetter(from, result, requiredMethods[CONFIG_FIELD.OPTIONAL_METHOD])
//
//         this.callSetterAuto(from, result, requiredMethods[CONFIG_FIELD.REQUIRED_METHOD_AUTO], true)
//         this.callSetter(from, result, requiredMethods[CONFIG_FIELD.REQUIRED_METHOD], true)
//
//         for(let field in from) {
//             if(field in result){
//                 let value = from[field];
//                 if(Array.isArray(value)){
//                     result[field]= value;
//                 }else if(value != null && typeof value === 'object') {
//                     // to[field] = this.cloneTo(value, {});
//                 }else
//                     result[field] = value;
//             }
//         }
//         return result;
//     }
//
//     private cloneTo(from: any, to: any): object{
//         for(let field in from) {
//             if(field in to){
//                 let value = from[field];
//                 if(Array.isArray(value)){
//                     to[field]= value;
//                 }else if(value != null && typeof value === 'object') {
//                     // to[field] = this.cloneTo(value, {});
//                 }else
//                     to[field] = value;
//             }
//         }
//         return to;
//     }
// }