import TemplateAttribute from "./TemplateAttribute";

class TemplateTransformator{
    constructor(
        private root: Element,
        private prefix: string
    ){

    }

    transform(): void{
        let elems = this.root.querySelectorAll('*');
        for(let elem of elems){
            if(!elem.hasAttributes())
                continue;

            let attributesForDelete = [];
            for(var attr of elem.attributes){
                if(TemplateAttribute.isTemplateAttribute(attr, this.prefix)){
                    let templateAttr = new TemplateAttribute();
                }
                if(handleAttr(elem, attr))
                    attributesForDelete.push(attr.name);
            }
            for(var attr of attributesForDelete){
                elem.removeAttribute(attr);
            }
        }
    }

    private transformAttr(attr: TemplateAttribute): void{

    }

}

function handle(prefix, elems){
    if(prefix == null)
        return true;
        
    for(let i = 0; i < elems.length; i++){
        let elem = elems[i];
        if(elem.hasAttributes()){
            let attributesForDelete = [];
            for(var attr of elem.attributes){
                if(handleAttr(elem, attr))
                    attributesForDelete.push(attr.name);
            }
            for(var attr of attributesForDelete){
                elem.removeAttribute(attr);
            }
        }
    }
    return true;

    function handleAttr(elem, attr){
        if(!attr.name.startsWith(prefix +':'))
            return;
        var attrName = attr.name.substr(prefix.length + 1);// +1 - ':'
        let modifiers = getModifiers(attrName);
        attrName = attrName.split('.')[0]
        switch(attrName){
            case 'ref':
                elem.setAttribute('ref', extractExpression(attr.value));
                break;
            case 'slot':
                if(modifiers.length > 0 && attr.value.length > 0){
                    throw new Error(`Component ${componentName}. Indefinable slot name: ${attr.name}="${attr.value}"`)
                }else if(modifiers.length == 0 && attr.value.length == 0){
                    throw new Error(`Component ${componentName}. Slot without name!`)
                }
                let slotAttrName = 'v-slot:'+ (modifiers.length > 0? modifiers[0]: '['+ extractExpression(attr.value) +']');
                elem.setAttribute(slotAttrName, '');
                elem.setAttribute('v-hasSlot', '');
                break;
            case 'model':
                elem.setAttribute('v-model' + addModifiers(modifiers), extractExpression(attr.value));
                break;
            case 'text':
                let expression = extractExpression(attr.value)
                elem.textContent = '{{'+ expression +'}}';
                break;
            case 'if':
                elem.setAttribute('v-if', extractExpression(attr.value));
                break;
            case 'unless':
                elem.setAttribute('v-if', '!('+ extractExpression(attr.value) +')');
                break;
            case 'animation':
                return false;

            case 'attrappend':
            case 'eventappend':
                for(let dynamicAttr of attr.value.split(',')){
                    if(dynamicAttr.trim().length == 0)
                        continue;
                    let [dynAttrName, dynAttrVal] = dynamicAttr.trim().split('=');
                    dynAttrName = dynAttrName.trim();
                    if(isExpression(dynAttrName)){
                        var macrosType = attrName == 'attrappend'? '__:': '___:';
                        elem.setAttribute(macrosType + extractExpression(dynAttrName) + macrosType, extractExpression(dynAttrVal));
                    }else if(isExpression(dynAttrVal)){
                        handleUnknownAttr(elem, dynAttrName, dynAttrVal);
                    }else{
                        elem.setAttribute(dynAttrName, dynAttrVal);
                    }
                }
                break;
            case 'classappend':
                elem.setAttribute('v-bind:class', extractExpression(attr.value));
                break;
            case 'component':
                // var componentVar = extractExpression(attr.value);
                // if(VirtualComponents.isVirtualComponentName(componentVar, componentNode)){
                    // elem.setAttribute('data-vcn', VirtualComponents.getId(componentVar, componentNode));
                // }else{
                return false;
                    // let componentCast = modifiers[0];
                    // let componentName = componentCast != null? `'${componentCast.toUpperCase()}'`: (componentVar + '.app$.cn');
                    // elem.insertAdjacentHTML('beforebegin',
                    //     `<component :is="${componentName}" :key="${componentVar}.app$.id" v-bind:m="$convComp(${componentVar})">${elem.innerHTML}</component>`
                    // );
                    // let clone = elem.previousSibling;
                    // copyIfUnlessEachAttributesToComponent(elem, clone);
                    // elem.setAttribute = function(){
                    //     clone.setAttribute.apply(clone, arguments);
                    // }
                    // elem.remove();
                // }
                // break;
            case 'marker':
                var componentVar = extractExpression(attr.value);
                // if(VirtualComponents.isVirtualComponentName(componentVar, componentNode)){
                elem.setAttribute('data-vcn', VirtualComponents.getId(componentVar, componentNode));
                // }else{
                    // return false;
                    // let componentCast = modifiers[0];
                    // let componentName = componentCast != null? `'${componentCast.toUpperCase()}'`: (componentVar + '.app$.cn');
                    // elem.insertAdjacentHTML('beforebegin',
                    //     `<component :is="${componentName}" :key="${componentVar}.app$.id" v-bind:m="$convComp(${componentVar})">${elem.innerHTML}</component>`
                    // );
                    // let clone = elem.previousSibling;
                    // copyIfUnlessEachAttributesToComponent(elem, clone);
                    // elem.setAttribute = function(){
                    //     clone.setAttribute.apply(clone, arguments);
                    // }
                    // elem.remove();
                // }
                break;
            case 'each':
                let iterateParts = attr.value.split(':');
                let leftExpr = iterateParts[0].trim();
                let rightExpr = iterateParts[1].trim();
                let isWithState = leftExpr.includes(',')? 1: 0;
                rightExpr = `$convState(${isWithState},${extractExpression(rightExpr)})`;
                if(isWithState){
                    let leftPartVars = leftExpr.split(',');
                    elem.insertAdjacentText('afterBegin',
                        `{{void(${leftPartVars[1]}=${leftPartVars[0]}.s,${leftPartVars[0]}=${leftPartVars[0]}.v)}}`);
                }
                elem.setAttribute('v-for', leftExpr +' in '+ rightExpr);
                break;
            default:
                handleUnknownAttr(elem, attrName, modifiers, attr);
        }
        return true;
    }

    function handleUnknownAttr(elem, attrName, modifiers, attr){
        let attrVal = attr.value;
        if(attrName == 'name' && elem.tagName.startsWith(prefix.toUpperCase() +':SLOT')) {
            if(elem.tagName.includes('.')) // tag has modifiers
                throw new Error(`Component ${componentName}. Indefinable slot name: <${elem.tagName.toLowerCase()} ${prefix}:name="...">`)
            elem.setAttribute('v-bind:name', extractExpression(attrVal));
        }else if(attrName.startsWith('on')){
            elem.setAttribute('v-on:'+ attrName.substr(2) + addModifiers(modifiers), extractExpression(attrVal));
        }else
            elem.setAttribute('v-bind:'+ attrName, extractExpression(attrVal));
    }
}