import ReactiveSet from "./ReactiveSet";
import SimpleMap from "../map/SimpleMap";
import ReactiveReadonlySet from "./ReactiveReadonlySet";

export default class SimpleSet<V> implements ReactiveSet<V>{
    private m: SimpleMap<V, any>;
    constructor(set?: ReactiveReadonlySet<V>){
        this.m = new SimpleMap();
        if(set)
            this.merge(set);
    }
    public size(): number{
        return this.m.size();
    }
    public clear(): void {
        this.m.clear();
    }    
    public delete(value: V): boolean {
        return this.m.delete(value);
    }
    public forEach(callback: (value: V, map: ReactiveSet<V>) => void, thisArg?: any): void {
        return this.m.keys().forEach((value) => callback.call(thisArg, value, this))
    }
    public has(value: V): boolean {
        return this.m.has(value);
    }

    public add(value: V): this {
        ///@ts-ignore
        this.m.addKey(value);
        return this;
    }
    public values(): V[] {
        return this.m.keys();
    }

    public map<V2>(action: (value: V) => V2): ReactiveSet<V2> {
        return SimpleSet.of(...this.values().map(action));
    }

    /**
     * @override
     */
    public toJSON(): Object | Object[]{
        return this.m.keys();
    }

    public merge(set: ReactiveReadonlySet<V>){
        set.forEach(v => this.add(v))
    }
    
    public static of<V>(...values: V[]): SimpleSet<V>{
        let set: SimpleSet<V> = new SimpleSet();
        for(let val of values)
            ///@ts-ignore
            set.m.addKey(val)
        return set;
    }
}