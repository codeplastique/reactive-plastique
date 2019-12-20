class Serializator{
    public static toJson(obj: Object | Object[]): string{
        obj = obj['_data']? obj['_data']: obj;
        return JSON.stringify(new Serializator().serialize(obj));
    }
    private serialize(obj: any): Object | Object[]{
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
                let [fields, aliasToField] = this.getJsonFields(obj);
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

    private getJsonFields(obj: Object): [string[], object]{
        let fields = [], aliasToField = {};
        let proto = Object.getPrototypeOf(obj);
        while(proto != null){
            let jsonConfiguration = proto.constructor['$json'];
            if(jsonConfiguration){
                fields = fields.concat(jsonConfiguration.f);
                Object.assign(aliasToField, jsonConfiguration.a);
            }
            proto = Object.getPrototypeOf(proto)
        }
        return [fields, aliasToField];
    }
}

export default Serializator;