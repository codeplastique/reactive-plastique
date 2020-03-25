export default abstract class Enumerable{
    public name(): string{
        ///@ts-ignore
        Enumerable.checkInit(this.name$);
        ///@ts-ignore
        return this.name$;
    }

    public toString(): string{
        ///@ts-ignore
        return this.name$;
    }

    public static values<T extends Enumerable>(): T[]{
        ///@ts-ignore
        Enumerable.checkInit(this.$);
        ///@ts-ignore
        return Object.values(this.$);
    }

    public static valueOf<T extends Enumerable>(name: string): T{
        ///@ts-ignore
        Enumerable.checkInit(this.$);
        ///@ts-ignore
        return this.$[name];
    }

    private static init(enumClass: any){
        let keyToVal = {};
        for(let e in enumClass){
            if(typeof enumClass[e] === 'object'){
                keyToVal[e] = enumClass[e]
                Object.defineProperty(enumClass[e], 'name$', {
                    value: e
                })
            }
        }
        Object.defineProperty(enumClass, '$', {
            configurable: true,
            writable: true
        })
        return keyToVal;
    }

    private static checkInit(val: any): void{
        if(val === void 0)
            throw new Error('Enum is not initialized yet!')
    }
}