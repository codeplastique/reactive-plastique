interface Map<K, V>{
    map <K2, V2>(keyAction: (K) => K2, valueAction: (V) => V2): Map<K2, V2>
    mapKeys <K2>(keyAction: (K) => K2): Map<K2, V>
    mapValues <V2>(valueAction: (V) => V2): Map<K, V2>
    toObject(): object
}
Map.prototype.map = function(keyAction: Function, valueAction: Function): Map<any, any>{
    let m = new Map();
    this.forEach((v, k) => m.set(
        keyAction? keyAction(k): k,
        valueAction? valueAction(v): v
    ))
    return m;
}

Map.prototype.mapValues = function(valueAction: Function): Map<any, any>{
    return this.map(null, valueAction);
}
Map.prototype.mapKeys = function(keyAction: Function): Map<any, any>{
    return this.map(keyAction, null);
}
Map.prototype.toObject = function(): object{
    // @ts-ignore
    return Object.fromEntries(this);
    // const obj = {};
    // for (const key of map.keys()) {
    //     obj[key] = map.get(key);
    // }
    // return obj;
}