import ReactiveMap from "../collection/ReactiveMap";
import SimpleMap from "../collection/impl/SimpleMap";

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
    static toMap<E extends Object>(enumClass: E): ReactiveMap<InstanceType<E>, any>{
        return Enum.keys(enumClass)
            .reduce((map, key) => map.set(key, enumClass[key]), new SimpleMap<InstanceType<any>, any>());
    }

    ///@ts-ignore
    static findByValue<E extends Object>(enumClass: E, value: any): InstanceType<E> | null{
        return Enum.keys(enumClass).find(k => enumClass[k].equals(value));
    }
}