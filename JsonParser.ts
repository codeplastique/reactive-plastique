class JsonGenerator{
    public toJson(obj: Object | Object[]): string{
        return JSON.stringify(this.serialize(obj));
    }
    public serialize(obj: any): Object | Object[]{
        if(obj != null && obj.toJSON){
            return obj.toJSON();
        }else{
            if(Array.isArray(obj)){
                let result = [];
                for(let i = 0; i < obj.length; i++){
                    result.push(this.serialize(obj[i]));
                }
                return result;
            }else if(obj != null && typeof obj === 'object'){
                let fields: string[], aliasToField = {};
                if(obj.constructor.$json){
                    fields = obj.constructor.$json.f;
                    aliasToField = obj.constructor.$json.a || {};
                }
                let result = {};
                for(let fieldName in obj){
                    if(!obj.hasOwnProperty(fieldName) || fieldName == 'app$')
                        continue;
                    else if(aliasToField[fieldName] != null)
                        result[aliasToField[fieldName]] = this.serialize(obj[fieldName]);
                    else if(fields == null || fields.indexOf(fieldName) >= 0){
                        result[fieldName] = this.serialize(obj[fieldName]);
                    }
                }
                return result;
            }else
                return obj;
        }
    }
}

export default JsonGenerator;