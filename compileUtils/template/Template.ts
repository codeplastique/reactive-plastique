import ClassNode from "../node/ClassNode";
import { JSDOM } from "jsdom";
import I18nEngine from "../I18nEngine";

export default class Template{
    private static readonly PREFIX_PATTERN = / xmlns:(\w+)="http:\/\/github\.com\/codeplastique\/plastique"( |>)/gm
    private static readonly BREAK_LINE_PATTERN = /\s*\n\s*/gm
    private static readonly THYMELEAF_EXPRESSION_PATTERN = /[$#]\{(.+?)}/g
    private static readonly THIS_PREFIX_PATTERN = /(?<!\w)this\./g
    private static readonly I18N_EXPRESSION_PATTERN = /^#{(\$\{.+?\}|[\w_.]+)(?:\((\$\{.+\}|[\w_.]+)\))?}/g

    private static readonly VUE_TEMPLATE_PROPS_VAR_NAME = "$pr";

    private readonly prefix: string | null;
    private readonly root: HTMLElement
    private readonly templatePropPattern: RegExp

    constructor(
        private readonly component: ClassNode,
        template: string,
        private readonly isFragment: boolean,
        templatePropName: string
    ) {
        try {
            if(template.trim().length == 0)
                throw new Error(`Template is empty`)

            this.prefix = this.getPrefix(template);
            if(this.prefix) {
                template = template.replace(Template.PREFIX_PATTERN, ' ');
                template = this.closePlastiqueUnclosedTags(template);
            }

            this.templatePropPattern = new RegExp("(?<![\.\w\$])" + templatePropName + "\.", 'g')

            let dom = new JSDOM(`<html><body><template>${template}</template></body></html>`);
            let rootTag = dom.window.document.body.firstElementChild.content;
            if(rootTag.children.length > 1)
                throw new Error(`Template has multiple root tags!`)
            this.root = rootTag.children[0];

            if(!isFragment)
                this.root.setAttribute('data-cn', template);

            if(this.prefix){
                this.handleElems()
            }
        }catch (error){
            let e = error as Error;
            throw new Error(`${this}. ${e.message}`)
        }
    }

    private getPrefix(template: string): string | null{
        let results = template.match(Template.PREFIX_PATTERN)
        return results == null? null: results[0]
    }

    //(?<!\\)"(.*?)(?<!\\)"

    private closePlastiqueUnclosedTags(template: string){
        let tagPrefix = this.prefix;
        return template
            .replace(new RegExp(`<${tagPrefix}:parent(.*?)\/>`), `<${tagPrefix}:parent$1></${tagPrefix}:parent>`)
            .replace(new RegExp(`<${tagPrefix}:slot\\s*\/>`), `<${tagPrefix}:slot></${tagPrefix}:slot>`);
    }


    private handleElems(){
        let elems = this.root.querySelectorAll('*');
        for (let elem of Array.from(elems)){
            if(elem.hasAttributes()){
                let attributesForDelete = [];
                for(let attr of Array.from(elem.attributes)){
                    let isAttrHandled = this.handleAttr(elem, attr)
                    if(isAttrHandled)
                        attributesForDelete.push(attr.name);
                }
                attributesForDelete.forEach(it => elem.removeAttribute(it))
            }
        }
        return true;

    }

    private replaceTagName(elem: HTMLElement, newTagName: string): HTMLElement{
        elem.insertAdjacentHTML('beforebegin', `<${newTagName}>${elem.innerHTML}</${newTagName}>`);
        let newElem: HTMLElement = elem.previousSibling as HTMLElement;
        for(let attr of Array.from(elem.attributes))
            newElem.setAttribute(attr.name, attr.value);
        elem.remove();
        return newElem;
    }

    private isValidAttrForComponentElem(attrName: string): boolean{
        return attrName == 'ref' || attrName == 'data-cn' || attrName.startsWith(this.prefix +':')
    }

    private replaceComponentElemIfExist(elem: HTMLElement){
        let componentAttr = Array.from(elem.attributes).find(a => a.name.startsWith(this.prefix +':component'));
        return this.replaceComponentElem(elem, componentAttr)
    }

    private replaceComponentElem(elem: HTMLElement, componentAttr: Attr){
        let illegalAttrName = elem.getAttributeNames().find(it => !this.isValidAttrForComponentElem(it))
        if(illegalAttrName)
            throw new Error(`Invalid attribute ${illegalAttrName} in the component tag. Component tag cant have simple html attributes!`);

        let attrName = componentAttr.name
        let attrVal = componentAttr.value

        let componentExpr = this.extractExpression(attrVal);
        elem.removeAttribute(attrName);

        let cloneComponent = this.replaceTagName(elem, 'component');
        if(cloneComponent.hasChildNodes()){
            cloneComponent.querySelectorAll('*')
                .forEach(it => this.replaceComponentElemIfExist(it as HTMLElement))
        }

        let componentVar;
        let componentName;
        if(componentExpr.includes(' as ')){
            componentName = componentExpr.replace(/([\w\d\.]+)\s+as\s+([\w\d]+)/g, (_, varName, cast) => {
                if(componentVar && componentVar != varName)
                    throw new Error(`Invalid casting in ${componentAttr.value}`)
                componentVar = varName;
                return `'${cast.toUpperCase()}'`
            })

            let regexp = new RegExp(`(?<=[?:]\\s*)${componentVar}`, 'g');
            componentName = componentName.replace(regexp, componentVar + '.app$.cn')

        }else{
            componentVar = componentExpr;
            componentName = componentVar + '.app$.cn';
        }

        cloneComponent.setAttribute(':is', componentName);
        cloneComponent.setAttribute(':key', componentVar +'.app$.id');
        cloneComponent.setAttribute('v-bind:m', `$cc(${componentVar})`);

        let propsAttrsNames = cloneComponent.getAttributeNames().filter(a => a.startsWith(prefix +":prop."));
        if(propsAttrsNames.length > 0){
            let propsArray = [];
            for(let attrName of propsAttrsNames){
                let attrVal = cloneComponent.getAttribute(attrName);
                let propName = attrName.substr(attrName.lastIndexOf('.') + 1);
                propsArray.push(propName +":"+ this.extractExpression(attrVal));
                cloneComponent.removeAttribute(attrName);
            }
            let propsObjResult = "{"+ propsArray.join(',') +"}";
            cloneComponent.setAttribute('v-bind:p', propsObjResult);
        }

        let classAppendAttr = cloneComponent.getAttribute('v-bind:class');
        if(classAppendAttr){
            if(this.isExpression(classAppendAttr)){
                cloneComponent.setAttribute('v-bind:class', this.extractExpression(classAppendAttr));
            }else{
                cloneComponent.setAttribute('class', classAppendAttr.slice(1, -1));
                cloneComponent.removeAttribute('v-bind:class');
            }
        }
    }

    private handleUnknownAttr(elem: HTMLElement, attrName: string, modifiers: string[], attrVal: string): void{
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

    /**
     * @return true if attribute is handled, false otherwise
     */
    private handleAttr(elem: HTMLElement, attr: Attr): boolean{
        if(!attr.name.startsWith(this.prefix +':'))
            return false;

        let modifiers = this.getModifiers(attr);
        let fullAttrName = attr.name.substr(this.prefix.length + 1);// +1 - ':'
        let attrName = fullAttrName.split('.')[0];
        let attrVal = attr.value.trim();

        switch(attrName){
            case 'ref':
                elem.setAttribute('ref', this.extractExpression(attrVal));
                return true;

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
                return true;

            case 'model':
                let modifiersString = modifiers.length == 0? '': ('.'+ modifiers.join('.'))
                elem.setAttribute(`v-model`+ modifiersString, this.extractExpression(attrVal));
                return true;

            case 'text':
                let expression = this.extractExpression(attrVal)
                elem.textContent = '{{'+ expression +'}}';
                return true;

            case 'if':
                elem.setAttribute('v-if', this.extractExpression(attrVal));
                return true;

            case 'unless':
                elem.setAttribute('v-if', '!('+ this.extractExpression(attrVal) +')');
                return true;

            case 'include':
                if(this.isFragment)
                    throw new Error(`Inner fragments is not realized!`)
                return false;

            case 'mod':
                if(modifiers.length == 0)
                    throw new Error(`'Mod' attribute must contain a directive modifier`)
                if(modifiers.length > 1)
                    throw new Error(`'Mod' attribute must contain an only one directive modifier`)
                elem.setAttribute('v-'+ modifiers[0], this.extractExpression(attrVal));

                return true;
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
                // break;

            case 'classappend':
                let isComponentOrFragment = elem.hasAttribute(this.prefix + ':component')
                    || elem.hasAttribute(this.prefix + ':include');
                if (isComponentOrFragment)
                    elem.setAttribute('v-bind:class', attrVal);
                else
                    elem.setAttribute('v-bind:class', this.extractExpression(attrVal));
                return true;

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
                return true;

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
                return true;

            default:
                this.handleUnknownAttr(elem, attrName, modifiers, attrVal);
                return true;
        }
    }

    private extractExpression(rawVal: string): string{
        let val = rawVal.replace(Template.BREAK_LINE_PATTERN, ' ')
        let exprMatch = val.match(Template.THYMELEAF_EXPRESSION_PATTERN);
        if(exprMatch == null)
            return val;
        let isWithBrackets = exprMatch.length > 1 || (exprMatch.length == 1 && (val.startsWith("'") ||  val.endsWith("'"))) ;

        if(this.templatePropPattern){
            // if(isFragment) {
            //     let pattern = new RegExp("(?<!\w)("+ templatePropVarName +"\\.?)", 'g')
            //     val = val.replace(pattern, Template.VUE_TEMPLATE_PROPS_VAR_NAME +'.$1');
            // }else {
                val = val.replace(this.templatePropPattern, Template.VUE_TEMPLATE_PROPS_VAR_NAME + '.')
            // }
        }
        return val
            .replace(Template.THIS_PREFIX_PATTERN, '')
            .replace(Template.I18N_EXPRESSION_PATTERN, (text, first, second) => {
                let bundleKey = first.startsWith('${')? this.extractExpression(first): `'${first}'`;
                let args = second? [this.extractExpression(second)]: []
                return I18nEngine.buildGlobalCallExpression(bundleKey, args);
            })
            .replace(Template.THYMELEAF_EXPRESSION_PATTERN, isWithBrackets? '($1)': '$1')
    }

    private isExpression(value){
        //TODO remove strings before matching
        let val = value.trim();
        return val.search(/\$\{(.+?)\}/is) >= 0 || val.includes('+');
    }

    private getModifiers(attr: Attr): string[]{
        return attr.name.split('.').slice(1);
    }

    // private stringToHash(str){
    //     let asciiKeys = [];
    //     for (var i = 0; i < str.length; i ++)
    //         asciiKeys.push(str[i].charCodeAt(0));
    //     return asciiKeys.join('-');
    // }
    // private hashToString(str){
    //     let keys = str.split('-');
    //     return String.fromCharCode(...keys);
    // }

    toString(): string{
        return `Template of component ${this.component}`
    }
}