class Serializator{
    public static toJson(
        obj: Object | Object[], 
        filter?: (object: Object, propertyNameOrIndex: string | number, value: any) => boolean,
        valueTransformator?: (object: Object, propertyNameOrIndex: string | number, value: any) => any,
    ): string{
        obj = obj['_data']? obj['_data']: obj;
        return JSON.stringify(new Serializator(filter, valueTransformator).serialize(obj));
    }

    public constructor(
        private readonly filter?: (object: Object | Array<any>, propertyNameOrIndex: string | number, value: any) => boolean,
        private readonly transformator?: (object: Object | Array<any>, propertyNameOrIndex: string | number, value: any) => [string | number, any]
    ){}

    private transform(object: Object | Array<any>, propertyNameOrIndex: string | number, value: any): [string | number, any] {
        let transformator = this.transformator;
        if(transformator){
            let result = transformator(object, propertyNameOrIndex, value);
            if(typeof propertyNameOrIndex === 'number' && propertyNameOrIndex !== result[0])
                throw new Error('Array index is not changeable!')
            propertyNameOrIndex = result[0];
            value = result[1];    
        }
        return [propertyNameOrIndex, value];
    }

    public serialize(obj: any): Object | Object[]{
        if(obj != null && obj.toJSON){
            return obj.toJSON();
        }else{
            let filter = this.filter;
            if(Array.isArray(obj)){
                let result = [];
                for(let i = 0; i < obj.length; i++){
                    if(this.filter == null || this.filter(obj, i, obj[i]))
                        result.push(
                            this.serialize(
                                this.transform(obj, i, obj[i])[1]
                                )
                            );
                }
                return result;
            }else if(obj != null && typeof obj === 'object'){
                let [fieldNames, fieldNameToAlias, aliasToMethodName] = this.getJsonFields(obj);
                let result = {};
                for(let fieldName in obj){
                    if(!obj.hasOwnProperty(fieldName) || fieldName == 'app$')
                        continue;

                    let aliasName = fieldNameToAlias[fieldName] != null?
                        fieldNameToAlias[fieldName]
                        :
                        (fieldNames.indexOf(fieldName) >= 0? 
                            fieldName
                            :
                            null
                        );
                    if(aliasName && (filter == null || filter(obj, aliasName, obj[fieldName]))){
                        let transformResult = this.transform(obj, aliasName, obj[fieldName]);
                        result[transformResult[0]] = this.serialize(transformResult[1]);
                    }
                }
                for(let aliasName in aliasToMethodName){
                    let methodName = aliasToMethodName[aliasName];
                    let methodResult = obj[methodName]();
                    if(filter == null || filter(obj, aliasName, methodResult)){
                        let transformResult = this.transform(obj, aliasName, methodResult);
                        result[transformResult[0]] = this.serialize(transformResult[1]);
                    }
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