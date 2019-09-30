import Hashable from "./Hashable";
import SimpleMap from "./SimpleMap";
import Serializable from "./annotation/Serializable";
import Jsonable from "./annotation/Jsonable";

///@ts-ignore
class HashSet<T extends Hashable> implements Set<T>, Serializable, Jsonable{
    public size: number;
    private hashToElem: SimpleMap<T>;
    constructor(elems?: Hashable[]){
        elems = elems || [];
        let hashCodeToElem = {};
        for(let elem of elems)
            hashCodeToElem[elem.hashCode()] = elem;
        this.hashToElem = new SimpleMap(hashCodeToElem);
        Object.defineProperty(this, "size", {get: () => this.hashToElem.size})
    }
    add(value: T): this {
        let hash = value.hashCode();
        if(!this.hashToElem.has(hash))
            this.hashToElem.set(hash, value);
        return this;
    }    
    clear(): void {
        this.hashToElem.clear();
    }
    delete(value: T): boolean {
        let hash = value.hashCode();
        if(this.hashToElem.has(hash)){
            this.hashToElem.delete(hash);
            return true;
        }
    }
    forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
        let arr = this.toArray();
        for(let i = 0; i < arr.length; i++)
            callbackfn.call(thisArg, arr[i], arr[i], this);
    }
    has(value: T): boolean {
        return this.hashToElem.has(value.hashCode());
    }
    [Symbol.iterator](): IterableIterator<T> {
        return this.hashToElem.values();
    }    
    values(): IterableIterator<T> {
        return this.hashToElem.values();
    }
    [Symbol.toStringTag]: string;

    public toArray(): T[]{
        return Array.from(this.values())
    }

    /**
     * @override
     */
    public serialize(): Object | Object[]{
        return this.toArray().serialize();
    }
    /**
     * @override
     */
    public toJson(): string{
        return JSON.stringify(this.serialize());
    }
}

export default HashSet;