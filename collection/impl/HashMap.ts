import SimpleMap from "./SimpleMap";
import Hashable from "../../hash/Hashable";
import ReactiveMap from "../ReactiveMap";

export default class HashMap<K extends Hashable, V> extends SimpleMap<K, V>{
   protected hashCodes: string[] = [];
    constructor(map?: ReactiveMap<K, V>){
        super();
        if(map)
            this.merge(map);
    }
    public clear(): void {
        super.clear()
        this.hashCodes = []
    }    

    protected deleteIndex(index: number): boolean{
        if(super.deleteIndex(index)){
            this.hashCodes.remove(index);
            return true;
        }
    }

    protected getKeyIndex(key: K, hashCode?: string): number{
        let hash = hashCode === void 0? key.hashCode(): hashCode;
        return this.hashCodes.indexOf(hash);
    }

    /**
     * @param key is non null!
     */
    public set(key: K, value: V): this {
        let hashCode = key.hashCode();
        let index = this.getKeyIndex(key, hashCode)
        if(index < 0){
            this.k.push(key);
            this.v.push(value);
            this.hashCodes.push(hashCode)
        }else{
            this.v.set(index, value);
        }
        return this;
    }
    
    public static of<K extends Hashable, V>(k1: K, v1: V): HashMap<K, V>
    public static of<K extends Hashable, V>(k1: K, v1: V, k2?: K, v2?: V): HashMap<K, V>
    public static of<K extends Hashable, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V): HashMap<K, V>
    public static of<K extends Hashable, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V): HashMap<K, V>
    public static of<K extends Hashable, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V, k5?: K, v5?: V): HashMap<K, V>
    public static of<K extends Hashable, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V, k5?: K, v5?: V, k6?: K, v6?: V): HashMap<K, V>
    public static of<K extends Hashable, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V, k5?: K, v5?: V, k6?: K, v6?: V, k7?: K, v7?: V): HashMap<K, V>
    public static of<K extends Hashable, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V, k5?: K, v5?: V, k6?: K, v6?: V, k7?: K, v7?: V, k8?: K, v8?: V): HashMap<K, V>{
        let map: HashMap<K, V> = new HashMap();
        for(let i = 0; i < arguments.length; i += 2){
            map.set(arguments[i], arguments[i + 1])
        }
        return map;
    }
}