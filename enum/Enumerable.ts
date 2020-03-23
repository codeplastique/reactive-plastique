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

    public static values<T>(): T[]{
        ///@ts-ignore
        Enumerable.checkInit(this.$);
        ///@ts-ignore
        return Object.values(this.$);
    }

    public static valueOf<T>(name: string): T{
        ///@ts-ignore
        Enumerable.checkInit(this.$);
        ///@ts-ignore
        return this.$[name];
    }

    private static init(enumClass: any): void{
        enumClass.valueOf = enumClass.valueOf.bind(enumClass);
        enumClass.values = enumClass.values.bind(enumClass);
        enumClass.checkInit = enumClass.checkInit.bind(enumClass);
        // let entries = {};
        for(let e in enumClass){
            Object.defineProperty(enumClass[e], 'name$', {
                value: e
            })
        }
        Object.defineProperty(enumClass, '$', {
            configurable: true,
            value: true
        })
    }

    private static checkInit(enumClass: any): void{
        ///@ts-ignore
        if(enumClass.$ === void 0)
            throw new Error('Enum is not initialized yet!')
        
    }
}