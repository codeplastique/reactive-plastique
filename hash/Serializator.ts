import SerializeFilter from "./SerializeFilter";
import SerializeTransformer from "./SerializeTransformer";

class Serializator{
    private stack = [];

    public constructor(
        protected readonly filtrator?: (filter: SerializeFilter) => boolean,
        protected readonly transformer?: (transformer: SerializeTransformer) => void
    ){}

    public static toJson(
        obj: Object | Object[],
        filter?: (filtrator: SerializeFilter) => boolean,
        transformer?: (transformer: SerializeTransformer) => void,
    ): string{
        return JSON.stringify(new Serializator(filter, transformer).serialize(obj));
    }

    protected filter(filtrator: SerializeFilter): boolean{
        if(this.filtrator)
            return this.filtrator(filtrator)
        return true;
    }

    protected transform(transformer: SerializeTransformer): void{
        if(this.transformer)
            this.transformer(transformer)
    }

    private modify(object: Object | Array<any>, propertyNameOrIndex: string | number, value: any): SerializeTransformer {
        if(value != null && value.toJSON)
            value = value.toJSON();

        ///@ts-ignore
        let transformerObj = new SerializeTransformer(this.stack, object, propertyNameOrIndex, value);
        this.transform(transformerObj);
        return transformerObj;
    }

    public serialize(obj: any): Object | Object[]{
        obj = obj['_data']? obj['_data']: obj;
        ///@ts-ignore

        // this.stack.push(obj);
        if(obj.toJSON){
            ///@ts-ignore
            obj = obj.toJSON();
        }
        return this.serializePart(obj);
        // this.stack.pop();
    }


    private serializePart(obj: any): Object | Object[]{
        if(obj == null || typeof obj !== 'object')
            return obj; //literal

        let result;
        this.stack.push(obj);

        if(Array.isArray(obj)){
            result = [];
            for(let i = 0; i < obj.length; i++){
                let transformerObj = this.modify(obj, i, obj[i])
                if(this.filter(transformerObj)){
                    ///@ts-ignore
                    result.push(this.serializePart(transformerObj.val));
                }
            }

        }else{ //object
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
                    let transformerObj = this.modify(obj, fieldName, obj[fieldName]);
                    if(this.filter(transformerObj)){
                        ///@ts-ignore
                        Object.assign(result, this.serializePart(transformerObj.val))
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
                    let transformerObj = this.modify(obj, aliasName, obj[fieldName]);
                    if(this.filter(transformerObj)){
                        ///@ts-ignore
                        result[transformerObj.prop] = this.serializePart(transformerObj.val);
                    }
                }
            }
            for(let aliasName in aliasToMethodName){
                let methodName = aliasToMethodName[aliasName];
                let transformerObj = this.modify(obj, aliasName, obj[methodName]());
                if(this.filter(transformerObj)){
                    ///@ts-ignore
                    result[transformerObj.prop] = this.serializePart(transformerObj.val);
                }
            }
        }

        this.stack.pop();
        return result;
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
