import MapEntry from "./MapEntry";
import ReactiveMap from "./ReactiveMap";
import ReactiveReadonlyMap from "./ReactiveReadonlyMap";

export default class SimpleMap<K, V> implements ReactiveMap<K, V>{
    protected readonly k: K[] = [];
    protected readonly v: V[] = [];

    constructor(mapEntries?: MapEntry<K, V>[])
    constructor(map?: ReactiveReadonlyMap<K, V>)
    constructor(arg?: MapEntry<K, V>[] | ReactiveReadonlyMap<K, V>){
        if(arg)
            this.merge(arg as any);
    }
    public size(): number{
        return this.k.length;
    }
    public clear(): void {
        this.v.clear();
        this.k.clear();
    }    
    public delete(key: K): boolean {
        return this.deleteIndex(this.getKeyIndex(key));
    }
    protected deleteIndex(index: number): boolean{
        if(index >= 0){
            this.k.remove(index);
            this.v.remove(index);
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

    public getOrDefault(key: K, defaultValue: V): V {
        let val = this.get(key);
        return val === void 0? defaultValue: val;
    }

    public has(key: K): boolean {
        return this.getKeyIndex(key) >= 0;
    }
    protected getKeyIndex(key: K): number{
        return this.k.findIndex(k => k.equals(key));
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

    private addKey(key: K): void {
        let index = this.getKeyIndex(key)
        if(index < 0)
            this.k.push(key);
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

    public mapValues<V2>(action: (value: V) => V2): ReactiveMap<K, V2> {
        let newMap: SimpleMap<K, V2> = new SimpleMap();
        this.forEach((v, k) => newMap.set(k, action(v)));
        ///@ts-ignore
        return newMap;
    }

    filter(action: (key: K, value: V) => boolean): ReactiveMap<K, V> {
        let newMap: SimpleMap<K, V> = new SimpleMap();
        this.forEach((v, k) => {
            if(action(k, v))
                newMap.set(k, v)
        });
        return newMap;
    }

    public map<T>(action: (key: K, value: V) => T): T[] {
        let result = [];
        this.forEach((v, k) => result.push(action(k, v)))
        return result;
    }

    public merge(map: ReactiveReadonlyMap<K, V>)
    public merge(mapEntries: MapEntry<K, V>[])
    public merge(arg: ReactiveReadonlyMap<K, V> | MapEntry<K, V>[]){
        if(Array.isArray(arg))
            (arg as MapEntry<K, V>[]).forEach(e => this.set(e.key, e.value))
        else
            (arg as ReactiveReadonlyMap<K, V>).forEach((v, k) => this.set(k, v))
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