import Jsonable from "../hash/Jsonable";
import Hashable from '../hash/Hashable';

declare let Vue: any;

class HashMap<K extends Hashable, V> implements Map<string, V>, Jsonable{
    public size: number;
    private keyToVal: object;
    constructor(obj?: object){
        obj = obj || {};
        let size = Object.keys(obj).length;
        this.keyToVal = obj;
        Object.defineProperty(this, 'size', {set: (n) => size = n, get: () => size});
    }
    public clear(): void {
        this.keyToVal = {};
        this.size = 0;
    }    
    public delete(key: String): boolean {
        let has = this.has(key);
        if(has){
            this.size--;
            if("__ob__" in this.keyToVal)
                Vue.delete( this.keyToVal, key )
            else
                delete this.keyToVal[key as string];
            return true;
        }
    }
    public forEach(callbackfn: (value: V, key: string, map: Map<string, V>) => void, thisArg?: any): void {
        for(let key in this.keyToVal)
            callbackfn.call(thisArg, this.keyToVal[key], key, this);
    }
    public get(key: String): V {
        return this.keyToVal[key as string];
    }
    has(key: String): boolean {
        return key as string in this.keyToVal;
    }
    set(key: string, value: V): this {
        this.size++;
        if("__ob__" in this.keyToVal){
            Vue.set( this.keyToVal, key, value );
        }else
            this.keyToVal[key] = value;
        return this;
    }
    // [Symbol.iterator](): IterableIterator<[string, V]> {
    //     return this.entries();
    // }
    entries(): IterableIterator<[string, V]> {
        return Object.entries(this.keyToVal)[Symbol.iterator]();
    }
    keys(): IterableIterator<string> {
        return Object.keys(this.keyToVal)[Symbol.iterator]();
    }
    values(): IterableIterator<V> {
        return Object.values(this.keyToVal);
    }
    [Symbol.toStringTag]: string;

    /**
     * @override
     */
    public toJSON(): Object | Object[]{
        let obj: object = {};
        for(let key in this.keyToVal){
            let val = this.keyToVal[key];
            obj[key] = val.toJSON? val.toJSON(): val
        }
        return obj;
    }

    public merge(map: SimpleMap<V>){
        for(let key in map.keyToVal)
            this.set(key, map.keyToVal[key]);
    }
    
}

export default SimpleMap;