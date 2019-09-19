declare let Vue: any;

class SimpleMap<V> implements Map<String, V>{
    public size: number;
    private keyToVal: object;
    constructor(obj?: object){
        obj = obj || {};
        this.size = Object.keys(obj).length;
        this.keyToVal = obj;
    }
    clear(): void {
        this.keyToVal = {};
        this.size = 0;
    }    
    delete(key: String): boolean {
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
    forEach(callbackfn: (value: V, key: String, map: Map<String, V>) => void, thisArg?: any): void {
        for(let key in this.keyToVal)
            callbackfn.call(thisArg, this.keyToVal[key], key, this);
    }
    get(key: String): V {
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
    [Symbol.iterator](): IterableIterator<[String, V]> {
        return this.entries();
    }
    entries(): IterableIterator<[String, V]> {
        return Object.entries(this.keyToVal)[Symbol.iterator]();
    }
    keys(): IterableIterator<String> {
        return Object.keys(this.keyToVal)[Symbol.iterator]();
    }
    values(): IterableIterator<V> {
        return Object.values(this.keyToVal)[Symbol.iterator]();
    }
    [Symbol.toStringTag]: string;

}

export default SimpleMap;