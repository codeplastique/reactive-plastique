class Serializator{
    public static toJson(obj: Object | Object[], filter?: (object: Object, propertyName: string, value: any) => boolean): string{
        obj = obj['_data']? obj['_data']: obj;
        return JSON.stringify(new Serializator().serialize(obj, filter));
    }
    private serialize(obj: any, filter?: (object: Object, propertyName: string, value: any) => boolean): Object | Object[]{
        if(obj != null && obj.toJSON){
            return obj.toJSON();
        }else{
            if(Array.isArray(obj)){
                let result = [];
                for(let i = 0; i < obj.length; i++){
                    result.push(this.serialize(obj[i], filter));
                }
                return result;
            }else if(obj != null && typeof obj === 'object'){
                let [fieldNames, fieldNameToAlias, aliasToMethodName] = this.getJsonFields(obj);
                let result = {};
                for(let fieldName in obj){
                    if(!obj.hasOwnProperty(fieldName) || fieldName == 'app$')
                        continue;
                    if(filter == null || filter(obj, fieldName, obj[fieldName])){
                        let aliasName = fieldNameToAlias[fieldName] != null?
                            fieldNameToAlias[fieldName]
                            :
                            (fieldNames.indexOf(fieldName) >= 0? 
                                fieldName
                                :
                                null
                            )
                        if(aliasName)
                            result[aliasName] = this.serialize(obj[fieldName], filter)
                    }
                }
                for(let aliasName in aliasToMethodName){
                    result[aliasName] = this.serialize(obj[aliasToMethodName[aliasName]](), filter);
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