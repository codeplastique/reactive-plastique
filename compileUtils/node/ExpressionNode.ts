import Type from "./Type";

export default class ExpressionNode{
    constructor(protected readonly node){}

    public static createNull(): ExpressionNode{
        return new ExpressionNode(ts.createNull())
    }

    public static createThis(): ExpressionNode{
        return new ExpressionNode(ts.createThis())
    }

    public static createString(str: string): ExpressionNode{
        return new ExpressionNode(ts.createLiteral(str));
    }

    public static createNumber(numb: number): ExpressionNode{
        return new ExpressionNode(ts.createNumericLiteral(String(numb)))
    }

    public static createBoolean(bool: boolean): ExpressionNode{
        return new ExpressionNode(bool? ts.createTrue(): ts.createFalse())
    }

    public static createArray(arr: any[]): ExpressionNode{
        let nodes = arr.map(a => this.of(a));
        return new ExpressionNode(ts.createArrayLiteral(nodes))
    }

    public static createRegular(regexp: string): ExpressionNode{
        return new ExpressionNode(ts.createRegularExpressionLiteral(regexp))
    }

    public static createObject(obj: object): ExpressionNode{
        let props = [];
        for(let key in obj){
            let val = this.of(obj[key]);
            props.push(ts.createPropertyAssignment(key, val));
        }
        return new ExpressionNode(ts.createObjectLiteral(props));
    }

    public static of(arg: any): ExpressionNode{
        if(arg instanceof ExpressionNode)
            return arg;
        if(arg === null)
            return this.createNull();
        if(Array.isArray(arg))
            return this.createArray(arg);
        else if(typeof arg === 'string')
            return this.createString(arg);
        else if(typeof arg === 'boolean')
            return this.createBoolean(arg);
        else if(typeof arg === 'number')
            return this.createNumber(arg);
        else if(typeof arg === 'object'){
            return this.createObject(arg);
        }else
            throw new Error(arg);
    }

    asString(): string{
        return '';
    }

    asNumber(): number{
        return 0;
    }

    asBoolean(): boolean{
        return false
    }

    getRaw(): any{
        return this.node;
    }

    getType(): Type | null{

    }
}