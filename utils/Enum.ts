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
}