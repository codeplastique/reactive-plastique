import ClassNode from "../node/ClassNode";
import { JSDOM } from "jsdom";

export default class Template{
    static readonly DEFAULT_PREFIX = 'v';
    static readonly VUE_SCRIPT_DIALECT_URL = 'http://github.com/codeplastique/plastique';
    private readonly PREFIX_PATTERN = / xmlns:(\w+)="http:\/\/github\.com\/codeplastique\/plastique"( |>)/gm
    private static readonly VUE_TEMPLATE_PROPS_VAR_NAME = "$pr";

    private readonly prefix: string | null;
    private readonly root: HTMLElement

    constructor(
        private readonly component: ClassNode,
        template: string
    ) {
        try {
            if(template.trim().length == 0)
                throw new Error(`Template is empty`)
            this.prefix = this.getPrefix(template);

            if(this.prefix) {
                template = template.replace(this.PREFIX_PATTERN, ' ');
                template = this.closePlastiqueUnclosedTags(template);
            }

            let dom = new JSDOM(`<html><body><template>${template}</template></body></html>`);
            let rootTag = dom.window.document.body.firstElementChild.content;
            if(rootTag.children.length > 1)
                throw new Error(`Template has multiple root tags!`)

            this.root = rootTag.children[0];
            if(this.prefix){
                this.handle()

            }
        }catch (error){
            let e = error as Error;
            throw new Error(`${this}. ${e.message}`)
        }
    }

    private getPrefix(template: string): string | null{
        let results = template.match(this.PREFIX_PATTERN)
        return results == null? null: results[0]
    }

    //(?<!\\)"(.*?)(?<!\\)"

    private closePlastiqueUnclosedTags(template: string){
        let tagPrefix = this.prefix;
        return template
            .replace(new RegExp(`<${tagPrefix}:parent(.*?)\/>`), `<${tagPrefix}:parent$1></${tagPrefix}:parent>`)
            .replace(new RegExp(`<${tagPrefix}:slot\\s*\/>`), `<${tagPrefix}:slot></${tagPrefix}:slot>`);
    }


    private handle(){
        let elems = this.root.querySelectorAll('*');

        for(let i = 0; i < elems.length; i++){
            let elem = elems[i];
            if(elem.hasAttributes()){
                let attributesForDelete = [];
                for(var attr of elem.attributes){
                    if(this.handleAttr(elem, attr))
                        attributesForDelete.push(attr.name);
                }
                for(var attr of attributesForDelete){
                    elem.removeAttribute(attr);
                }
            }
        }
        return true;

    }

    private handleUnknownAttr(elem: HTMLElement, attrName: string, modifiers: string[], attrVal: string){
        let prefix = this.prefix

        if(attrName == 'name' && elem.tagName.startsWith(prefix.toUpperCase() +':SLOT')) {
            if(elem.tagName.includes('.')) // tag has modifiers
                throw new Error(`Indefinable slot name: <${elem.tagName.toLowerCase()} ${prefix}:name="...">`)
            elem.setAttribute('v-bind:name', this.extractExpression(attrVal));

        }else if(attrName.startsWith('on')){
            let expr = this.extractExpression(attrVal);
            let isOnlyMethodNameWithoutCalling = /^\w+$/.test(expr);
            if(isOnlyMethodNameWithoutCalling) {
                expr += '($event)';
            }

            let modifiersString = modifiers.length == 0? '': ('.'+ modifiers.join('.'))
            elem.setAttribute('v-on:'+ attrName.substr(2) + modifiersString, expr);
        }else
            elem.setAttribute('v-bind:'+ attrName, this.extractExpression(attrVal));
    }

    private handleAttr(elem: HTMLElement, attr: Attr){
        if(!attr.name.startsWith(this.prefix +':'))
            return;

        let modifiers = this.getModifiers(attr);
        let fullAttrName = attr.name.substr(this.prefix.length + 1);// +1 - ':'
        let attrName = fullAttrName.split('.')[0];
        let attrVal = attr.value.trim();

        switch(attrName){
            case 'ref':
                elem.setAttribute('ref', this.extractExpression(attrVal));
                break;
            case 'slot':
                if(modifiers.length > 0 && attrVal.length > 0){
                    throw new Error(`Indefinable slot name: ${fullAttrName}="${attrVal}"`)
                }else if(modifiers.length == 0 && attrVal.length == 0){
                    throw new Error(`Slot without name`)
                }else if(modifiers.length > 1){
                    throw new Error(`Slot attribute must have only one modifier!`)
                }

                let slotName: string
                if(modifiers.length > 0){
                    slotName = modifiers[0];
                }else {
                    let dynamicExpr = this.extractExpression(attrVal);
                    slotName = 'dynamic_slot_name'+ this.stringToHash(dynamicExpr)
                }
                let slotAttrName = 'v-slot:'+ slotName;
                elem.setAttribute(slotAttrName, '');
                elem.setAttribute('v-hasSlot', '');
                break;
            case 'model':
                let modifiersString = modifiers.length == 0? '': ('.'+ modifiers.join('.'))
                elem.setAttribute(`v-model`+ modifiersString, this.extractExpression(attrVal));
                break;
            case 'text':
                let expression = this.extractExpression(attrVal)
                elem.textContent = '{{'+ expression +'}}';
                break;
            case 'if':
                elem.setAttribute('v-if', this.extractExpression(attrVal));
                break;
            case 'unless':
                elem.setAttribute('v-if', '!('+ this.extractExpression(attrVal) +')');
                break;
            case 'include':
                if(isFragment)
                    throw new Error(`Inner fragments is not realized!`)
                return false;

            case 'mod':
                if(modifiers.length == 0)
                    throw new Error(`'Mod' attribute must contain a directive modifier`)
                if(modifiers.length > 1)
                    throw new Error(`'Mod' attribute must contain an only one directive modifier`)
                elem.setAttribute('v-'+ modifiers[0], this.extractExpression(attrVal));

                break;
            case 'animation':
                return false;

            case 'attrappend':
            case 'eventappend':
                // for(let dynamicAttr of attr.value.split(',')){
                //     if(dynamicAttr.trim().length == 0)
                //         continue;
                //     let [dynAttrName, dynAttrVal] = dynamicAttr.trim().split('=');
                //     dynAttrName = dynAttrName.trim();
                //     if(isExpression(dynAttrName)){
                //         var macrosType = attrName == 'attrappend'? '__:': '___:';
                //         elem.setAttribute(macrosType + extractExpression(dynAttrName) + macrosType, extractExpression(dynAttrVal));
                //     }else if(isExpression(dynAttrVal)){
                //         handleUnknownAttr(elem, dynAttrName, dynAttrVal);
                //     }else{
                //         elem.setAttribute(dynAttrName, dynAttrVal);
                //     }
                // }
                throw new Error("TODO")
                break;
            case 'classappend':
                let isComponentOrFragment = elem.hasAttribute(this.prefix + ':component')
                    || elem.hasAttribute(this.prefix + ':include');
                if (isComponentOrFragment)
                    elem.setAttribute('v-bind:class', attrVal);
                else
                    elem.setAttribute('v-bind:class', this.extractExpression(attrVal));
                break;

            case 'prop': {
                let isComponent = elem.hasAttribute(this.prefix + ':component');
                if (!isComponent)
                    throw new Error(`The "prop" attribute applies to the component tags only!`)
                else if(modifiers.length != 1)
                    throw new Error(`The "prop" attribute is set with the property name modifier only!`)

                let hasThisKeyword = /(?<!\w)this\./.test(attr.value);
                if(hasThisKeyword)
                    throw new Error(`The "prop" attribute should contains constants values only! ${attrName}="${attrVal}"`)

                return false;
            }
            case 'component':
                return false;

            case 'marker':
                let componentVar = this.extractExpression(attrVal);
                elem.setAttribute('data-vcn', VirtualComponents.getId(componentVar, componentNode));
                break;

            case 'each':
                let iterateParts = attrVal.split(':');
                let leftExpr = iterateParts[0].trim();
                let isWithState = leftExpr.includes(',')? 1: 0;
                let rightExpr = iterateParts[1].trim();

                rightExpr = `$cs(${isWithState},${this.extractExpression(rightExpr)})`;
                if(isWithState){
                    let leftPartVars = leftExpr.split(',');
                    elem.insertAdjacentText('afterBegin',
                        `{{void(${leftPartVars[1]}=${leftPartVars[0]}.s,${leftPartVars[0]}=${leftPartVars[0]}.v)}}`);
                }
                elem.setAttribute('v-for', leftExpr +' in '+ rightExpr);
                break;

            default:
                this.handleUnknownAttr(elem, attrName, modifiers, attr);
        }
        return true;
    }

    private extractExpression(val){
        val = val.trim().replace(/\s*\n\s*/g, ' ') //remove all break lines
        let exprMatch = val.match(/[$#]\{(.+?)\}/g);
        if(exprMatch == null)
            return val;
        let isWithBrackets = exprMatch.length > 1 || (exprMatch.length == 1 && (val.startsWith("'") ||  val.endsWith("'"))) ;

        if(templatePropVarNames && templatePropVarNames.length > 0) {
            for(let templatePropVarName of templatePropVarNames) {
                if(isFragment) {
                    let pattern = new RegExp("(?<!\w)("+ templatePropVarName +"\\.?)", 'g')
                    val = val.replace(pattern, VUE_TEMPLATE_PROPS_VAR_NAME +'.$1');
                }else {
                    let pattern = new RegExp("(?<!\w)" + templatePropVarName + "\.", 'g')
                    val = val.replace(pattern, VUE_TEMPLATE_PROPS_VAR_NAME + '.')
                }
            }
        }
        return val.replace(/(?<!\w)this\./g, '')
            .replace(/^#{(\$\{.+?\}|[\w_.]+)(?:\((\$\{.+\}|[\w_.]+)\))?}/g, function(text, first, second){
                let result = I18N_METHOD+ '('
                result += first.startsWith('${')? extractExpression(first): ("'"+ first +"'");
                if(second) {
                    result += ',';
                    result += second.startsWith('${') ? extractExpression(second) : ("'" + second + "'");
                }
                return result + ")";
            })
            .replace(/\$\{(.+?)\}/g, (isWithBrackets? '($1)': '$1'))
    }

    private isExpression(value){
        //TODO remove strings before matching
        let val = value.trim();
        return val.search(/\$\{(.+?)\}/is) >= 0 || val.includes('+');
    }

    private getModifiers(attr: Attr): string[]{
        return attr.name.split('.').slice(1);
    }

    private stringToHash(str){
        let asciiKeys = [];
        for (var i = 0; i < str.length; i ++)
            asciiKeys.push(str[i].charCodeAt(0));
        return asciiKeys.join('-');
    }
    private hashToString(str){
        let keys = str.split('-');
        return String.fromCharCode(...keys);
    }

    toString(): string{
        return `Template of component ${this.component}`
    }
}