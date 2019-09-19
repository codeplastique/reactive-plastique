import Hashable from "./Hashable";
import SimpleMap from "./SimpleMap";

///@ts-ignore
class HashSet implements Set<Hashable>{
    public size: number;
    private hashToElem: SimpleMap<Hashable>;
    constructor(elems?: Hashable[]){
        elems = elems || [];
        let hashCodeToElem = {};
        for(let elem of elems)
            hashCodeToElem[elem.hashCode()] = elem;
        this.hashToElem = new SimpleMap(hashCodeToElem);
        Object.defineProperty(this, "size", {get: () => this.hashToElem.size})
    }
    add(value: Hashable): this {
        let hash = value.hashCode();
        if(!this.hashToElem.has(hash))
            this.hashToElem.set(hash, value);
        return this;
    }    
    clear(): void {
        this.hashToElem.clear();
    }
    delete(value: Hashable): boolean {
        let hash = value.hashCode();
        if(this.hashToElem.has(hash)){
            this.hashToElem.delete(hash);
            return true;
        }
    }
    forEach(callbackfn: (value: Hashable, value2: Hashable, set: Set<Hashable>) => void, thisArg?: any): void {
        for(let val in this.hashToElem.values())
            callbackfn.call(thisArg, val, val, this);
    }
    has(value: Hashable): boolean {
        return this.hashToElem.has(value.hashCode());
    }
    [Symbol.iterator](): IterableIterator<Hashable> {
        return this.hashToElem.values();
    }    
    values(): IterableIterator<Hashable> {
        return this.hashToElem.values();
    }
    [Symbol.toStringTag]: string;
}

export default HashSet;