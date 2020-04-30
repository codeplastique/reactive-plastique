import Plastique from "../const";

declare global{ 
    interface Array<T> {
        flatMap(e: any): Array<any>;
    }
}

export default class ExpressionTransformator{
    private locales: Set<string>;
    private usedlocales: Set<string> = new Set();

    constructor(
        root: Element, 
        prefix: string,
        locales: Set<string>
    ){
        let elems = Array.from(root.querySelectorAll('*'));
        let attr = prefix +':each';
        elems.filter(e => e.hasAttribute(attr))
            .flatMap(e => {
                let leftExpr = e.getAttribute(attr).split(':')[0]
                if(leftExpr.includes(','))
                    return leftExpr.split(',')
                else [leftExpr];
            })
            .forEach(v => {
                locales.delete(v.trim())
            });
        locales.delete('this');
        if(locales.has('as'))
            throw new Error('Sorry, the "as" keyword is reserved in the template block');
        this.locales = locales;
    }

    private insertIn(str: string, fromIndex: number, tillIndex: number, replacement: string) {
        return str.substr(0, fromIndex) + replacement + str.substr(tillIndex);
    }

    transformExpression(expr: string): string{
        let exprWithEmptyStrings = expr.replace(/".*?(?<!\\)"/gm, str => ' '.repeat(str.length))
            .replace(/'.*?(?<!\\)"'/gm, str => ' '.repeat(str.length))
        
        let regexp = /(?<![\.\w])(?!this\.)(\w+)/gm;
        let catchResult;
        let result = expr;
        let replacementOffset = 0;
        while ((catchResult = regexp.exec(exprWithEmptyStrings)) !== null) {
            let capture = catchResult[0];
            let index = catchResult.index;
            if(this.locales.has(capture)){
                this.usedlocales.add(capture);
                let newVarPrefix = Plastique.TEMPLATE_SPECIAL_OBJECT_NAME + '.'
                let newVarName = newVarPrefix + capture;
                let replaceFrom = index + replacementOffset;
                let replaceTill = replaceFrom + capture.length;
                result = this.insertIn(result, replaceFrom, replaceTill, newVarName);
                replacementOffset += newVarPrefix.length; 
            }
        }
        return result;
       
    }

    public getUsedLocales(): Set<string>{
        return this.usedlocales;
    }
}