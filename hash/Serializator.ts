class Serializator{
    public static toJson(
        obj: Object | Object[], 
        filter?: (object: Object, propertyNameOrIndex: string | number, value: any) => boolean,
        transformator?: (object: Object, propertyNameOrIndex: string | number, value: any) => any,
    ): string{
        return JSON.stringify(new Serializator(filter, transformator).serialize(obj));
    }

    public constructor(
        private readonly filter?: (object: Object | Array<any>, propertyNameOrIndex: string | number, value: any) => boolean,
        private readonly transformator?: (object: Object | Array<any>, propertyNameOrIndex: string | number, value: any) => [string | number, any]
    ){}

    private transform(object: Object | Array<any>, propertyNameOrIndex: string | number, value: any): [string | number, any] {
        if(value != null && value.toJSON)
            value = value.toJSON();

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
        obj = obj['_data']? obj['_data']: obj;
        ///@ts-ignore
        if(obj.toJSON){
            ///@ts-ignore
            obj = obj.toJSON();
        }
        return this.serializePart(obj);
    }


    public serializePart(obj: any): Object | Object[]{
        let filter = this.filter;
        if(Array.isArray(obj)){
            let result = [];
            for(let i = 0; i < obj.length; i++){
                let transformValResult = this.transform(obj, i, obj[i])[1]; //index is the same
                if(filter == null || filter(obj, i, transformValResult)){
                    result.push(this.serializePart(transformValResult));
                }
            }
            return result;
        }else if(obj != null && typeof obj === 'object'){
            
            let [fieldNames, fieldNameToAlias, aliasToMethodName, mergeFields] = this.getJsonFields(obj);
            let isSimpleObject = fieldNames.length == 0 
                && mergeFields.length == 0 
                && Object.keys(fieldNameToAlias).length == 0 
                && Object.keys(aliasToMethodName).length == 0;

            let result = {};
            for(let fieldName in obj){
                if(!obj.hasOwnProperty(fieldName) || fieldName == 'app$')
                    continue;

                if(mergeFields.includes(fieldName)){
                    let val = obj[fieldName]
                    if(val != null && (filter == null || filter(obj, fieldName, val))){
                        if(val.toJSON)
                            val = val.toJSON();
                        Object.assign(result, this.serializePart(val))
                    }
                    continue;
                }

                let aliasName = isSimpleObject? 
                    fieldName
                    : 
                    fieldNameToAlias[fieldName] != null?
                        fieldNameToAlias[fieldName]
                        :
                        (fieldNames.indexOf(fieldName) >= 0? fieldName: null);

                if(aliasName){
                    let [key, val] = this.transform(obj, aliasName, obj[fieldName]);
                    if(filter == null || filter(obj, key, val)){
                        result[key] = this.serializePart(val);
                    }
                }
            }
            for(let aliasName in aliasToMethodName){
                let methodName = aliasToMethodName[aliasName];
                let [key, val] = this.transform(obj, aliasName, obj[methodName]());
                if(filter == null || filter(obj, key, val)){
                    result[key] = this.serializePart(val);
                }
            }
            return result;
        }else
            return obj;
    }

    private isUpperCase(char: string){
        return char && char == char.toUpperCase();
    }

    private getJsonFields(obj: Object): [string[], object, object, string[]]{
        let fields = [], fieldNameToAlias = {}, aliasNameToMethodName = {}, mergeFields = [];
        let proto = Object.getPrototypeOf(obj);
        while(proto != null){
            let jsonConfiguration = proto.constructor['$json'];
            if(jsonConfiguration){
                fields = fields.concat(jsonConfiguration.f);
                mergeFields = mergeFields.concat(jsonConfiguration.mf);
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
        return [fields, fieldNameToAlias, aliasNameToMethodName, mergeFields];
    }
}

export default Serializator;
