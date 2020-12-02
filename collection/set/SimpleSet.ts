import ReactiveSet from "./ReactiveSet";
import SimpleMap from "../map/SimpleMap";
import ReactiveReadonlySet from "./ReactiveReadonlySet";

export default class SimpleSet<V> implements ReactiveSet<V>{
    private map: SimpleMap<V, any>;
    constructor(set?: ReactiveReadonlySet<V>){
        this.map = new SimpleMap();
        if(set)
            this.merge(set);
    }
    public size(): number{
        return this.map.size();
    }
    public clear(): void {
        this.map.clear();
    }    
    public delete(value: V): boolean {
        return this.map.delete(value);
    }
    public forEach(callback: (value: V, map: ReactiveSet<V>) => void, thisArg?: any): void {
        return this.map.keys().forEach((value) => callback.call(thisArg, value, this))
    }
    public has(value: V): boolean {
        return this.map.has(value);
    }

    public add(value: V): this {
        ///@ts-ignore
        this.map.addKey(value);
        return this;
    }
    public values(): V[] {
        return this.map.keys();
    }

    /**
     * @override
     */
    public toJSON(): Object | Object[]{
        return this.map.keys();
    }

    public merge(set: ReactiveReadonlySet<V>){
        set.forEach(v => this.add(v))
    }
    
    public static of<V>(...values: V[]): SimpleSet<V>{
        let set: SimpleSet<V> = new SimpleSet();
        for(let val of values)
            ///@ts-ignore
            set.map.addKey(val)
        return set;
    }
}