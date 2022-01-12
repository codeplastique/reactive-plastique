interface Array<T>{
    toMap<K, V>(keyGenerator: (elem: T) => K, valueGenerator?: (elem: T) => V): Map<K, V>
}
Array.prototype.toMap = function (keyGenerator: (elem: any) => any, valueGenerator?: (elem: any) => any) {
    return this.reduce((map: Map<any, any>, val) => {
        map.set(keyGenerator(val), valueGenerator? valueGenerator(val): val);
        return map;
    }, new Map<any, any>())
}