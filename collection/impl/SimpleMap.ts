import ReactiveMap, { MapEntry } from "../ReactiveMap";

export default class SimpleMap<K, V> implements ReactiveMap<K, V>{
    protected k: K[] = [];
    protected v: V[] = [];
    constructor(map?: ReactiveMap<K, V>){
        if(map)
            this.merge(map);
    }
    public size(): number{
        return this.k.length;
    }
    public clear(): void {
        this.v = [];
        this.k = [];
    }    
    public delete(key: K): boolean {
        let keyIndex = this.getKeyIndex(key)
        if(keyIndex >= 0){
            this.k.remove(keyIndex);
            this.v.remove(keyIndex);
            return true;
        }
    }
    public forEach(callback: (value: V, key: K, map: ReactiveMap<K, V>) => void, thisArg?: any): void {
        let vals = this.v;
        return this.k.forEach((key, i) => callback.call(thisArg, vals[i], key, this))
    }
    public get(key: K): V {
        let keyIndex = this.getKeyIndex(key);
        return this.v[keyIndex];
    }
    public has(key: K): boolean {
        return this.getKeyIndex(key) >= 0;
    }
    protected getKeyIndex(key: K): number{
        return this.k.findIndex(k => k === key);
    }

    /**
     * @param key is non null!
     */
    public set(key: K, value: V): this {
        let index = this.getKeyIndex(key)
        if(index < 0){
            this.k.push(key);
            this.v.push(value);
        }else{
            this.v.set(index, value);
        }
        return this;
    }
    public entries(): MapEntry<K, V>[] {
        let vals = this.v;
        return this.k.map((key, i) => {
            return {
                key: key,
                value: vals[i]
            }
        })
    }
    public keys(): K[] {
        return this.k.slice();
    }
    public values(): V[] {
        return this.v.slice();
    }

    /**
     * @override
     */
    public toJSON(): Object | Object[]{
        let obj: object = {};
        this.forEach((v, k) => obj[k.toString()] = v);
        return obj;
    }

    public merge(map: ReactiveMap<K, V>){
        map.forEach((v, k) => this.set(k, v))
    }
    
    public static of<K, V>(k1: K, v1: V): SimpleMap<K, V>
    public static of<K, V>(k1: K, v1: V, k2?: K, v2?: V): SimpleMap<K, V>
    public static of<K, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V): SimpleMap<K, V>
    public static of<K, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V): SimpleMap<K, V>
    public static of<K, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V, k5?: K, v5?: V): SimpleMap<K, V>
    public static of<K, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V, k5?: K, v5?: V, k6?: K, v6?: V): SimpleMap<K, V>
    public static of<K, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V, k5?: K, v5?: V, k6?: K, v6?: V, k7?: K, v7?: V): SimpleMap<K, V>
    public static of<K, V>(k1: K, v1: V, k2?: K, v2?: V, k3?: K, v3?: V, k4?: K, v4?: V, k5?: K, v5?: V, k6?: K, v6?: V, k7?: K, v7?: V, k8?: K, v8?: V): SimpleMap<K, V>{
        let map: SimpleMap<K, V> = new SimpleMap();
        for(let i = 0; i < arguments.length; i += 2){
            map.set(arguments[i], arguments[i + 1])
        }
        return map;
    }
}