import {TypeDef} from "../base/Type";

export default class SerializeFilter {
    protected constructor(
        protected stack: [],
        protected obj: object,
        protected prop: string | number,
        protected val: any,
    ) {
    }

    public getObject(): object {
        if (this.isObject())
            return this.obj;
        throw new Error('Object ' + this.obj + ' is not object!')
    }

    public getArray(): ReadonlyArray<any> {
        if (this.isArray())
            return this.obj as any
        throw new Error('Object ' + this.obj + ' is not array!')
    }

    public isArray(): boolean {
        return Array.isArray(this.obj);
    }

    public isObject(): boolean {
        return !this.isArray()
    }

    public getStack(): ReadonlyArray<object | Array<any>> {
        return this.stack;
    }

    /**
     * Searches for an object of a specific type in the parent stack queue
     */
    public isChildOfType(type: TypeDef<any>): boolean {
        ///@ts-ignore
        return this.getStack().find(it => _app.instanceOf(it, type)) != null;
    }

    /**
     * Searches for an object in the parent stack queue
     */
    public isChildOfParent(obj: object | Array<any>): boolean {
        ///@ts-ignore
        return this.getStack().includes(obj);
    }

    public index(): number {
        this.getArray(); //check
        return this.prop as number;
    }

    public key(): string {
        this.getObject(); //check
        return this.prop as string;
    }

    public value(): any {
        return this.val;
    }
}