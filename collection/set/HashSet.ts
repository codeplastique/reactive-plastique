import Hashable from "../../hash/Hashable";
import ReactiveSet from "./ReactiveSet";
declare const Vue: any;

export default class HashSet<V extends Hashable> implements ReactiveSet<V>{
    private hashToVal: {[hash: string]: V} = {};
    protected s: number; //size
    constructor(set?: ReactiveSet<V>){
        if(set)
            this.merge(set);
    }
    public size(): number{
        return this.s;
    }
    public clear(): void {
        this.hashToVal = {};
        this.s = 0
    }    
    public delete(value: V): boolean {
        let hashCode = value.hashCode()
        if(hashCode in this.hashToVal){
            Vue.delete(this.hashToVal, hashCode)
            this.s--;
            return true
        }
    }
    public forEach(callback: (value: V, map: ReactiveSet<V>) => void, thisArg?: any): void {
        return this.values().forEach(val => callback.call(thisArg, val, this))
    }
    public has(value: V): boolean {
        return value.hashCode() in this.hashToVal
    }

    public add(value: V): this {
        let hashCode = value.hashCode();
        if(!(hashCode in this.hashToVal)){
            Vue.set(this.hashToVal, hashCode, value);
            this.s++
        }
        return this;
    }
    public values(): V[] {
        let hashToVal = this.hashToVal;
        return Object.keys(hashToVal).map(hash => hashToVal[hash]);
    }

    public map<V2 extends Hashable>(action: (value: V) => V2): HashSet<V2> {
        return HashSet.of(...this.values().map(action));
    }

    /**
     * @override
     */
    public toJSON(): Object | Object[]{
        return this.values();
    }

    public merge(set: ReactiveSet<V>){
        set.forEach(v => this.add(v))
    }
    
    public static of<V extends Hashable>(...values: V[]): HashSet<V>{
        let set: HashSet<V> = new HashSet();
        values.forEach(v => set.add(v));
        return set;
    }
}