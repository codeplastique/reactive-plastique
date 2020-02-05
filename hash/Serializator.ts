class Serializator{
    public static toJson(
        obj: Object | Object[], 
        valueFilter?: (object: Object, propertyNameOrIndex: string | number, value: any) => boolean,
        valueTransformator?: (object: Object, propertyNameOrIndex: string | number, value: any) => any,
    ): string{
        obj = obj['_data']? obj['_data']: obj;
        return JSON.stringify(new Serializator(valueFilter, valueTransformator).serialize(obj));
    }

    public constructor(
        private readonly filter?: (object: Object | Array<any>, propertyNameOrIndex: string | number, value: any) => boolean,
        private readonly transformator?: (object: Object | Array<any>, propertyNameOrIndex: string | number, value: any) => any
    ){}

    public serialize(obj: any): Object | Object[]{
        if(obj != null && obj.toJSON){
            return obj.toJSON();
        }else{
            let valueTransformator = this.transformator;
            if(Array.isArray(obj)){
                let result = [];
                for(let i = 0; i < obj.length; i++){
                    if(this.filter == null || this.filter(obj, i, obj[i]))
                        result.push(valueTransformator?
                            valueTransformator(obj, i, obj[i])
                            :
                            this.serialize(obj[i])
                        );
                }
                return result;
            }else if(obj != null && typeof obj === 'object'){
                let [fieldNames, fieldNameToAlias, aliasToMethodName] = this.getJsonFields(obj);
                let result = {};
                for(let fieldName in obj){
                    if(!obj.hasOwnProperty(fieldName) || fieldName == 'app$')
                        continue;
                    if(this.filter == null || this.filter(obj, fieldName, obj[fieldName])){
                        let aliasName = fieldNameToAlias[fieldName] != null?
                            fieldNameToAlias[fieldName]
                            :
                            (fieldNames.indexOf(fieldName) >= 0? 
                                fieldName
                                :
                                null
                            )
                        if(aliasName)
                            result[aliasName] = this.serialize(valueTransformator?
                                valueTransformator(obj, fieldName, obj[fieldName])
                                :
                                obj[fieldName]
                            )
                    }
                }
                for(let aliasName in aliasToMethodName){
                    let methodName = aliasToMethodName[aliasName];
                    let methodResult = obj[methodName]();
                    if(this.filter == null || this.filter(obj, methodName, methodResult))
                        result[aliasName] = this.serialize(valueTransformator?
                            valueTransformator(obj, methodName, methodResult)
                            :
                            methodResult
                        );
                }
                return result;
            }else
                return obj;
        }
    }

    private isUpperCase(char: string){
        return char && char == char.toUpperCase();
    }

    private getJsonFields(obj: Object): [string[], object, object]{
        let fields = [], fieldNameToAlias = {}, aliasNameToMethodName = {};
        let proto = Object.getPrototypeOf(obj);
        while(proto != null){
            let jsonConfiguration = proto.constructor['$json'];
            if(jsonConfiguration){
                fields = fields.concat(jsonConfiguration.f);
                Object.assign(fieldNameToAlias, jsonConfiguration.fa);
                Object.assign(aliasNameToMethodName, jsonConfiguration.am);
                
                for(let methodName of jsonConfiguration.m as string[]){
                    let alias = methodName;
                    let charNumber = methodName.startsWith('get')? 3: (methodName.startsWith('is')? 2: null);
                    if(charNumber && this.isUpperCase(methodName[charNumber]))
                        alias = methodName[charNumber].toLowerCase() + methodName.substr(charNumber + 1);

                    aliasNameToMethodName[alias] = methodName;
                }
            }
            proto = Object.getPrototypeOf(proto);
        }
        return [fields, fieldNameToAlias, aliasNameToMethodName];
    }
}

export default Serializator;