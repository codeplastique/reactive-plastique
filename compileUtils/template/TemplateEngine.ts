const vueCompiler = require("vue-template-compiler");
const { JSDOM } = require('jsdom');
const VUE_SCRIPT_DIALECT_URL = 'http://github.com/codeplastique/plastique';
const VUE_TEMPLATE_PROPS_VAR_NAME = "$pr";


function closePlastiqueUnclosedTags(template, prefix){
    let tagPrefix = prefix? prefix: 'v';
    return template
        .replace(new RegExp(`<${tagPrefix}:parent(.*?)\/>`), `<${tagPrefix}:parent$1></${tagPrefix}:parent>`)
        .replace(new RegExp(`<${tagPrefix}:slot\\s*\/>`), `<${tagPrefix}:slot></${tagPrefix}:slot>`);
}


function getVueTemplateRender(vueTemplate, componentNode, templatePropVarNames, realPrefix, isFragment){
    vueTemplate = closePlastiqueUnclosedTags(vueTemplate, realPrefix);

    const TEMPLATE_NAME = componentNode.name.escapedText;
    let dom = new JSDOM('<html><body><template>'+ vueTemplate +'</template></body></html>');
    let rootTag = dom.window.document.body.firstElementChild.content;
    let elems = rootTag.querySelectorAll('*');
    if(rootTag.children.length > 1)
        console.error('Template '+ TEMPLATE_NAME +' has multiple root tags!')
    let rootComponent = rootTag.children[0];

    let prefixAttr = Array.from(rootComponent.attributes)
        .find(a => a.name.startsWith('xmlns:') && a.value == VUE_SCRIPT_DIALECT_URL);
    let prefixAttrName = prefixAttr? prefixAttr.name: null;

    let prefix = null;
    if(prefixAttrName){
        rootComponent.removeAttribute(prefixAttrName);
        prefix = prefixAttrName.substr(6)
    }

    if(prefix != 'v')
        return getVueTemplateRender(vueTemplate, componentNode, templatePropVarNames, prefix, isFragment);

    if(!isFragment)
        rootComponent.setAttribute('data-cn', TEMPLATE_NAME);

    if(handle(prefix, elems)){
        function replaceSpecialTag(tagName, tag){
            tag.insertAdjacentHTML('beforebegin', `<${tagName}>${tag.innerHTML}</${tagName}>`);
            let specialTag = tag.previousSibling;
            for(let attr of tag.attributes)
                specialTag.setAttribute(attr.name, attr.value);
            tag.remove();
            return specialTag;
        }

        function replaceAnimationElems(root){
            if(root.children == null)
                return;

            let attrName = prefix +':animation';
            for(let child of root.children){
                if(child.hasAttribute(attrName)){
                    let val = child.getAttribute(attrName);
                    child.removeAttribute(attrName);
                    let isAnimString = val.trim().match(/^'.+'$/) != null;
                    let transitionAttr = isAnimString?
                        `name="${val.trim().slice(1, -1)}"`
                        :
                        `v-bind:name="${extractExpression(val)}"`;

                    child.insertAdjacentHTML('beforebegin',`<transition ${transitionAttr}>${child.outerHTML}</transition>`);
                    let newTag = child.previousSibling;
                    child.remove();
                    child = newTag;
                }
                replaceAnimationElems(child);
            }
        }

        function replaceTagElems(replaceFilterAction, raplaceTagName, newTagTransform, root){
            if(root == null)
                root = rootTag.firstElementChild;
            if(root.children == null)
                return;

            if(root.tagName == 'TEMPLATE')
                root = root.content
            for(let child of root.children){
                if(replaceFilterAction(child)){
                    child.insertAdjacentHTML('beforebegin',`<${raplaceTagName}>${child.innerHTML}</${raplaceTagName}>`);
                    let newTag = child.previousSibling;

                    for(let attr of child.attributes)
                        newTag.setAttribute(attr.name, attr.value);

                    if(newTagTransform)
                        newTagTransform(newTag)

                    child.remove();
                    child = newTag;
                }
                replaceTagElems(replaceFilterAction, raplaceTagName, newTagTransform, child);
            }
        }

        function replaceComponentElems(elems){
            for(let elem of elems){
                let componentAttr = Array.from(elem.attributes).find(a => a.name.startsWith(prefix+ ':component'));
                if(componentAttr){
                    let componentExpr = extractExpression(componentAttr.value);
                    elem.removeAttribute(componentAttr.name);

                    let cloneComponent = replaceSpecialTag('component', elem);
                    cloneComponent.getAttributeNames().filter(a => a != 'ref' && a != 'data-cn' && !a.startsWith(prefix)).forEach((a) => {
                        throw new Error('Invalid attribute \''+ a +'="'+ cloneComponent.getAttribute(a) +'"\` in the component tag. Component tag can`t have simple html attributes!');
                    })

                    if(cloneComponent.hasChildNodes()){
                        replaceComponentElems(cloneComponent.querySelectorAll('*'))
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
                            propsArray.push(propName +":"+ extractExpression(attrVal));
                            cloneComponent.removeAttribute(attrName);
                        }
                        let propsObjResult = "{"+ propsArray.join(',') +"}";
                        cloneComponent.setAttribute('v-bind:p', propsObjResult);
                    }

                    let classAppendAttr = cloneComponent.getAttribute('v-bind:class');
                    if(classAppendAttr){
                        if(isExpression(classAppendAttr)){
                            cloneComponent.setAttribute('v-bind:class', extractExpression(classAppendAttr));
                        }else{
                            cloneComponent.setAttribute('class', classAppendAttr.slice(1, -1));
                            cloneComponent.removeAttribute('v-bind:class');
                        }
                    }
                }
            }
        }

        if(prefix){
            let arrayElems = Array.from(elems);
            let slotElems = arrayElems.filter(t => t.tagName.startsWith(prefix.toUpperCase() +':SLOT'))
            if(slotElems.length > 0){
                slotElems.map(t => {
                    let slotName = getModifiers(t.tagName)[0]
                    if(slotName)
                        t.setAttribute('v-bind:name', slotName)
                    return t;
                })
                    .forEach(t => replaceSpecialTag('slot', t));
            }

            replaceTagElems(
                tag => tag.hasAttribute('v-hasSlot'),
                prefix +':block',
                tag => tag.removeAttribute('v-hasSlot'),
                null)

            replaceAnimationElems(rootTag.firstElementChild);

            arrayElems = Array.from(rootTag.querySelectorAll('*'))
            replaceComponentElems(arrayElems);

            arrayElems = Array.from(rootTag.querySelectorAll('*'));
            let fragmentsElems = arrayElems.filter(t => t.getAttribute(prefix +':include'))
            if(fragmentsElems.length > 0){
                fragmentsElems.forEach(e => {
                    let attrVal = e.getAttribute(prefix +':include');
                    let expr = extractExpression(attrVal);
                    let match = expr.match(/^(\w+)(?:\((.*)\))?$/);
                    let fragmentKey = match[1];
                    let fragmentArgsString = (match[2] || "");
                    let fragmentArgs = [];

                    if(fragmentArgsString.includes('[') || fragmentArgsString.includes('{') || fragmentArgsString.includes('"') || fragmentArgsString.includes("'")){
                        let tempSource = ts.createSourceMapSource('test', '['+ fragmentArgsString +"]");
                        let tempArgs = tempSource.statements[0].expression.elements;
                        for(let tempArg of tempArgs){
                            let resultArg = fragmentArgsString.substring(tempArg.pos, tempArgs.end).trim();
                            fragmentArgs.push(resultArg);
                        }
                    }else {
                        fragmentArgs = fragmentArgsString.split(",").map(a => a.trim());
                    }

                    if(fragmentArgs.length > 0) {
                        let attrValue = FragmentSet.getFragmentPropValue(fragmentKey, fragmentArgs);
                        e.setAttribute('v-bind:p', attrValue)
                    }

                    let classAppendAttr = e.getAttribute('v-bind:class');
                    if(classAppendAttr){
                        if(isExpression(classAppendAttr)){
                            e.setAttribute('v-bind:class', extractExpression(classAppendAttr));
                        }else{
                            e.setAttribute('class', classAppendAttr.slice(1, -1));
                            e.removeAttribute('v-bind:class');
                        }
                    }
                    e.removeAttribute(prefix +':include');

                    replaceSpecialTag(FragmentSet.getFragmentName(fragmentKey), e);
                });
            }

            replaceTagElems(tag => tag.tagName == (prefix.toUpperCase() +':BLOCK'), 'template', null, null)
        }

        let classAppendAttr = rootTag.firstElementChild.getAttribute('v-bind:class');
        let classPrefix = classAppendAttr? `(${classAppendAttr})+' '+`: ''
        rootTag.firstElementChild.setAttribute('v-bind:class', classPrefix + '(css$ != null? css$: "")');

        let completeVueTemplate = rootTag.firstElementChild.outerHTML.replace(/___:([a-zA-Z\d]+?)___:/g, 'v-on:[$1]').replace(/__:([a-zA-Z\d]+?)__:/g, 'v-bind:[$1]');
        let vueCompilerResult = vueCompiler.compile(completeVueTemplate);
        if(vueCompilerResult.errors.length != 0)
            throw new Error(`Vue compile error! Template ${TEMPLATE_NAME}. ` + vueCompilerResult.errors);
        let staticRenders = [];
        for(let staticRender of vueCompilerResult.staticRenderFns){
            staticRenders.push(`function(){${staticRender}}`);
        }

        let parentDefPattern = new RegExp(`_c\\('${prefix}:parent'(,\\{class:(.+?)})?\\)`);
        let dynamicSlotNamePattern = new RegExp(`key\\s*:"dynamic_slot_name([-\\d]+?)"`);
        // debugger;
        let withParentTag = false;
        if(isFragment){
            vueCompilerResult.render = vueCompilerResult.render.replace(
                "with(this){",
                "var "+VUE_TEMPLATE_PROPS_VAR_NAME+"=this.p||{};with(this){"
            )
        }else {
            vueCompilerResult.render = vueCompilerResult.render.replace(
                "with(this){",
                "var "+VUE_TEMPLATE_PROPS_VAR_NAME+"=this.p||{},$cc=this.$cc,$cs=this.$cs,_c=this._c,_q=this._q,_k=this._k,_u=this._u,_e=this._e,_l=this._l,_t=this._t.bind(this),_s=this._s,_v=this._v,_m=this._m.bind(this);with(this.m){"
            )
        }
        vueCompilerResult.render = vueCompilerResult.render
            .replace(parentDefPattern, (all, p1, p2) => {
                withParentTag = true;
                return `app$.ptg.call(this, null, ${p2 != null? p2: '""'})`
            })
            .replace("clazz$", '(css$ != null? css$: clazz$)')
            .replace(dynamicSlotNamePattern, (all, p1) => {
                let expr = hashToString(p1)
                return 'key:('+ expr +")";
            })

        return {
            template: `{r:function(_$, css$){${vueCompilerResult.render}},s:[${staticRenders.join(',')}]}`, //_$ - vue js object,
            withParentTag: withParentTag
        };
    }else
        return null;


    function extractExpression(val){
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
    function isExpression(value){
        //TODO remove strings before matching
        let val = value.trim();
        return val.search(/\$\{(.+?)\}/is) >= 0 || val.includes('+');
    }

    function getModifiers(attrNameOrTagName){
        return attrNameOrTagName.split('.').slice(1);
    }
    function addModifiers(modifiers){
        // let modifiers = attrName.split('.').slice(1).join('.');
        return modifiers && modifiers.length != 0? ('.'+ modifiers.join('.')): ''
    }
    function stringToHash(str){
        let asciiKeys = [];
        for (var i = 0; i < str.length; i ++)
            asciiKeys.push(str[i].charCodeAt(0));
        return asciiKeys.join('-');
    }
    function hashToString(str){
        let keys = str.split('-');
        return String.fromCharCode(...keys);
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
            let attrName = attr.name.substr(prefix.length + 1);// +1 - ':'
            let modifiers = getModifiers(attrName);
            attrName = attrName.split('.')[0]
            switch(attrName){
                case 'ref':
                    elem.setAttribute('ref', extractExpression(attr.value));
                    break;
                case 'slot':
                    if(modifiers.length > 0 && attr.value.length > 0){
                        throw new Error(`Template ${TEMPLATE_NAME}. Indefinable slot name: ${attr.name}="${attr.value}"`)
                    }else if(modifiers.length == 0 && attr.value.length == 0){
                        throw new Error(`Template ${TEMPLATE_NAME}. Slot without name!`)
                    }
                    let slotName;
                    if(modifiers.length > 0){
                        if(modifiers.length != 1)
                            throw new Error(`Template ${TEMPLATE_NAME}. Slot attribute must have only one modifier!`)

                        slotName = modifiers[0];
                    }else {
                        let dynamicExpr = extractExpression(attr.value);
                        slotName = 'dynamic_slot_name'+ stringToHash(dynamicExpr)
                    }
                    let slotAttrName = 'v-slot:'+ slotName;
                    // console.log(slotAttrName)
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
                case 'include':
                    if(isFragment)
                        throw new Error(`Template ${TEMPLATE_NAME}. Inner fragments is not realized!`)
                    return false;

                case 'mod':
                    if(modifiers.length == 0)
                        throw new Error(`Template ${TEMPLATE_NAME}. 'Mod' attribute must contain a directive modifier`)
                    if(modifiers.length > 1)
                        throw new Error(`Template ${TEMPLATE_NAME}. 'Mod' attribute must contain an only one directive modifier`)
                    elem.setAttribute('v-'+ modifiers[0], extractExpression(attr.value));

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
                case 'classappend': {
                    let isComponentOrFragment = elem.hasAttribute(prefix + ':component') || elem.hasAttribute(prefix + ':include');
                    if (isComponentOrFragment)
                        elem.setAttribute('v-bind:class', attr.value);
                    else
                        elem.setAttribute('v-bind:class', extractExpression(attr.value));
                    break;
                }
                case 'prop': {
                    let isComponent = elem.hasAttribute(prefix + ':component');
                    if (!isComponent)
                        throw new Error(`Template ${TEMPLATE_NAME}. The "prop" attribute applies to the component tags only!`)
                    else if(modifiers.length === 0)
                        throw new Error(`Template ${TEMPLATE_NAME}. The "prop" attribute is set with the property name modifier only!`)

                    let hasThisKeyword = /(?<!\w)this\./.test(attr.value);
                    if(hasThisKeyword)
                        throw new Error(`Template ${TEMPLATE_NAME}. The "prop" attribute should contains constants values only! ${attr.name}="${attr.value}"`)

                    return false;
                }
                case 'component':
                    return false;

                case 'marker':
                    let componentVar = extractExpression(attr.value);
                    elem.setAttribute('data-vcn', VirtualComponents.getId(componentVar, componentNode));
                    break;

                case 'each':
                    let iterateParts = attr.value.split(':');
                    let leftExpr = iterateParts[0].trim();
                    let rightExpr = iterateParts[1].trim();
                    let isWithState = leftExpr.includes(',')? 1: 0;
                    rightExpr = `$cs(${isWithState},${extractExpression(rightExpr)})`;
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
                    throw new Error(`Template ${TEMPLATE_NAME}. Indefinable slot name: <${elem.tagName.toLowerCase()} ${prefix}:name="...">`)
                elem.setAttribute('v-bind:name', extractExpression(attrVal));
            }else if(attrName.startsWith('on')){
                let expr = extractExpression(attrVal);
                let isOnlyMethodnameWithoutCalling = /^\w+$/.test(expr);
                if(isOnlyMethodnameWithoutCalling) {
                    // console.log(expr)
                    expr += '($event)';
                }
                elem.setAttribute('v-on:'+ attrName.substr(2) + addModifiers(modifiers), expr);
            }else
                elem.setAttribute('v-bind:'+ attrName, extractExpression(attrVal));
        }
    }
}
