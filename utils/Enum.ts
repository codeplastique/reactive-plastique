export default class Enum{
    ///@ts-ignore
    static keys<E extends Object>(enumClass: E): InstanceType<E>[]{
        ///@ts-ignore
        let keys: InstanceType<E>[] = Object.keys(enumClass);
        for(let i = 0; i < keys.length; i++){
            if(isNaN(+keys[i]))
                return i == 0? keys: keys.slice(i)
        }
        return keys
    }

    ///@ts-ignore
    static findByValue<E extends Object>(enumClass: E, value: any): InstanceType<E>{
        return Enum.keys(enumClass).find(k => enumClass[k].equals(value));
    }
}