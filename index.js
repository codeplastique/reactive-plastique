const VUE_TEMPLATE_FUNC_NAME = '$vue_templ';
let componentPathToTemplate = {};
let workFilesPaths = [];
let Interfaces = new function(){
    var counter = 1;
    let interfaceNameToId = {};
    this.add = function(name){
        if(interfaceNameToId[name] == null)
            return interfaceNameToId[name] = counter++;
    }
    this.getId = function(name){
        if(interfaceNameToId[name])
            return interfaceNameToId[name];
        return interfaceNameToId[name] = counter++;
    }
    this.getNameById = function(id){
        return Object.keys(interfaceNameToId).find(key => interfaceNameToId[key] === id);
    }
    this.getMask = function(interfaces){
        let mask = [];
        for(let interface of interfaces)
            if(interfaceNameToId[interface])
                mask.push(interfaceNameToId[interface])
        return mask;
    }
}
function Plastique(options){
    let OUTPUT_DIR = options.outputDir; //__dirname + "/target";
    const VUE_TEMPLATES_DIR = options.vueTemplatesDir || 'templates';
    const VUE_TEMPLATES_JS_FILE_NAME = options.vueTemplatesOutputFileName || 'templates';
    const I18N_DIR = options.i18nDir || 'i18n';
    const I18N_JS_FILE_NAME = options.i18nOutputFileName || 'app.locale';

    //---------------------------------------------------------------------------------------------------------------------

    const VUE_SCRIPT_DIALECT_URL = 'http://github.com/codeplastique/plastique';


    // const APP_CLASS_NAME = 'App';
    const ANNOTATION_REACTIVE_CLASS = 'Reactive';
    // const ANNOTATION_TEMPLATE = 'Template';
    const ANNOTATION_ENTRY_POINT_CLASS = 'EntryPoint';
    // const ANNOTATION_REACTIVE_FIELD = 'Reactive';
    // const ANNOTATION_CACHED_METHOD = 'Cached';
    const ANNOTATION_AUTOWIRED = 'Autowired';
    const ANNOTATION_ONCHANGE = 'OnChange';
    const ANNOTATION_BEAN = 'Bean';
    const ANNOTATION_BEANS = 'Beans';
    const ANNOTATION_LISTENER = 'Listener';
    const ANNOTATION_AFTERATTACH = 'AfterAttach';
    const ANNOTATION_BEFOREDETACH = 'BeforeDetach';
    const ANNOTATION_ELEMENT = 'Inject';
    const ANNOTATION_INIT_EVENT = 'InitEvent';
    const ANNOTATION_INIT_VIRTUAL_COMPONENT = 'InitVirtualComponent';
    const ANNOTATION_TO_JSON = 'ToJson';

    const COMPONENT_INTERFACE_NAME = 'Component';
    const EVENTMANAGER_CLASS_NAME = 'Eventer';
    const APP_EVENT_TYPE = 'AppEvent';
    const I18N_METHOD = '_app.i18n';
    const TYPE_CLASS_NAME = 'Type';
    const TYPE_CLASS_PATH = '/plastique/base/Type.ts';
    const COMPONENT_INTERFACE_PATH = '/plastique/component/Component.ts';

    // --------------------------------------------------------------------------------------------------------------------

    var glob = require('glob');
    var fs = require('fs');
    const pug = require('pug');
    const vueCompiler = require('vue-template-compiler');
    const { JSDOM } = require('jsdom');
    const ts = require("typescript");
    const PropertiesReader = require('properties-reader');
    const mkdirp = require('mkdirp');
    Array.prototype.flatMap = function(f) {
        return this.map(f).reduce((x,y) => x.concat(y), [])
    }

    function isImplementsInterface(context, node, interfaceName, deep){
        if(node == null)
            return;
        interfaceName = interfaceName.toLowerCase();
        let typeInterfaces;
        if(node.kind == ts.SyntaxKind.ClassDeclaration)
            typeInterfaces = ts.getClassImplementsHeritageClauseElements(node);
        else{ //node is interface
            if(node.heritageClauses && node.heritageClauses[0] && node.heritageClauses[0].types)
                typeInterfaces = node.heritageClauses[0].types
        }

        let interfaces = (typeInterfaces || []).map(t => t.expression.escapedText.toLowerCase());
        let isImplements = interfaces.includes(interfaceName);
        if(isImplements)
            return isImplements;
        if(deep){
            for(let interface of interfaces){
                if(isImplementsInterface(
                    context,
                    getClass(node, interface, context),
                    interfaceName,
                    true
                ))
                    return true;
            }
            if(isImplementsInterface(
                context,
                getParentClass(node, context),
                interfaceName,
                true
            ))
                return true;
        }
    }

    function getParents(classNode) {
        let parents = (ts.getClassImplementsHeritageClauseElements(classNode) || []).map(t => getNodePath(classNode, t.expression.escapedText))
        let parentClass = ts.getClassExtendsHeritageElement(node);
        if(parentClass)
            parents.push(getNodePath(classNode, parentClass.expression.escapedText))
        return parents;
    }

    function isNodeHasDecorator(nodeClass, decoratorName){
        let decorators = nodeClass.decorators != null? nodeClass.decorators: [];
        return decorators.map(d => {
            let expr = d.expression;//.expression.escapedText
            return expr.expression? expr.expression.escapedText: expr.escapedText;
        }).includes(decoratorName);
    }
    function removeDecorator(nodeClass, decoratorName){
        let decorators = nodeClass.decorators != null? nodeClass.decorators: [];
        for(let i = 0; i < decorators.length; i++){
            let decorator = decorators[i];
            let expr = decorator.expression;//.expression.escapedText
            let dName = expr.expression? expr.expression.escapedText: expr.escapedText;
            if(dName == decoratorName){
                decorators.end = decorators.pos = -1;
                decorators.transformFlags = null;
                decorators.splice(i, 1);
                return;
            }
        }
        // if(decorators.length == 0)
        //     nodeClass.decorators = null;
    }

    function getDecoratorArguments(nodeClass, decoratorName, isArgRequired){
        let decorators = nodeClass.decorators != null? nodeClass.decorators: [];
        if(decorators.length > 0){
            for(let decorator of nodeClass.decorators){
                let expr = decorator.expression;//.expression.escapedText
                let name = expr.expression? expr.expression.escapedText: expr.escapedText;

                if(name == decoratorName){
                    if(decorator.expression.arguments && decorator.expression.arguments.length > 0){
                        return decorator.expression.arguments;
                    }
                    if(isArgRequired)
                        throw new Error('Decorator "'+ decoratorName +'" has no arguments!');
                }
            }
        }
        return null;
    }

    function getDecoratorArgumentMethodName(nodeClass, decoratorName, required){
        let args = getDecoratorArguments(nodeClass, decoratorName, required);
        if(args == null)
            return null;

        let text = args[0].text;
        return text? text: (args[0].name? args[0].name.escapedText: args[0].getFullText());
    }

    function getDecoratorArgumentCallExpr(nodeClass, decoratorName, required){
        let args = getDecoratorArguments(nodeClass, decoratorName, required);
        if(args == null)
            return null;
        let arg = args[0];
        let isCompositeName = arg.expression.expression != null;
        return [
            (isCompositeName? arg.expression.expression.escapedText: arg.expression.escapedText),
            (isCompositeName? (arg.expression.name.escapedText +'.'): '') + arg.name.escapedText
        ]
    }

    function getFileNameWithoutExt(filePath){
        var nameArray = filePath.split('/');
        return nameArray[nameArray.length - 1].split('.').slice(0, -1)[0]
    }

    function getVueTemplateRender(vueTemplate, componentName, virtualComponentToId){
        virtualComponentToId = virtualComponentToId || {};
        let dom = new JSDOM('<html><body><template>'+ vueTemplate +'</template></body></html>');
        var rootTag = dom.window.document.body.firstElementChild.content;
        let elems = rootTag.querySelectorAll('*');
        if(rootTag.children.length > 1)
            throw new Error('Component '+ componentName +' has multiple root tags!')
        if(handle(rootTag.children[0], elems, componentName)){
            let blockTags = Array.from(elems).filter(e => e.tagName == 'V:BLOCK');
            for(let blockTag of blockTags){
                blockTag.insertAdjacentHTML('beforebegin',`<template>${blockTag.innerHTML}</template>`);
                let templateTag = blockTag.previousSibling;
                for(attr of blockTag.attributes)
                    templateTag.setAttribute(attr.name, attr.value);
                blockTag.remove();
            }
            let completeVueTemplate = rootTag.firstElementChild.outerHTML.replace(/___:([a-zA-Z\d]+?)___:/g, 'v-on:[$1]').replace(/__:([a-zA-Z\d]+?)__:/g, 'v-bind:[$1]');
            let vueCompilerResult = vueCompiler.compile(completeVueTemplate);
            if(vueCompilerResult.errors.length != 0)
                throw new Error('Vue compile error!' + vueCompilerResult.errors);
            let staticRenders = [];
            for(let staticRender of vueCompilerResult.staticRenderFns){
                staticRenders.push(`function(){${staticRender}}`);
            }
            return {
                template: `{r:function(){${vueCompilerResult.render}},s:[${staticRenders.join(',')}]}`
            };
        }else
            return null;

        function handle(rootComponent, elems, componentName){
            let prefix;
            rootComponent.setAttribute('data-cn', componentName);
            if(elems.length > 0){
                for(var attr of rootComponent.attributes){
                    if(attr.name.startsWith('xmlns:') && attr.value == VUE_SCRIPT_DIALECT_URL){
                        prefix = attr.name.substr(6);
                        rootComponent.removeAttribute(attr.name);
                        break;
                    }
                }
                if(prefix == null){
                    return true;
                }
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


                function extractExpression(val){
                    val = val.trim();
                    let exprMatch = val.match(/[$#]\{(.+?)\}/g);
                    if(exprMatch == null)
                        return val;
                    let isWithBrackets = exprMatch.length > 1;
                    return val.replace(/(?<!\w)this\./g, '')
                        .replace(/#\{(.+?)(\((.+?)\))?}/g, I18N_METHOD +"('$1',$3)")
                        .replace(/\$\{(.+?)\}/g, (isWithBrackets? '($1)': '$1'))
                }
                function isExpression(val){
                    return val.trim().search(/\$\{(.+?)\}/i) == 0;
                }

                function getModifiers(attrName){
                    return attrName.split('.').slice(1);
                }
                function addModifiers(modifiers){
                    // let modifiers = attrName.split('.').slice(1).join('.');
                    return modifiers && modifiers.length != 0? ('.'+ modifiers.join('.')): ''
                }

                function copyIfUnlessEachAttributesToComponent(from, to) {
                    let ifAttr = from.getAttribute('v-if');
                    let forAttr = from.getAttribute('v-for');
                    if(ifAttr)
                        to.setAttribute('v-if', ifAttr);
                    if(forAttr)
                        to.setAttribute('v-for', forAttr);
                }


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
                            var componentVar = extractExpression(attr.value);
                            if(virtualComponentToId[componentVar]){
                                let virtualComponentId = virtualComponentToId[componentVar];
                                elem.setAttribute('data-vcn', virtualComponentId);
                            }else{
                                let componentCast = modifiers[0];
                                let componentName = componentCast != null? `'${componentCast.toUpperCase()}'`: (componentVar + '.app$.cn');
                                elem.insertAdjacentHTML('beforebegin',
                                    `<component :is="${componentName}" :key="${componentVar}.app$.id" v-bind:m="$convComp(${componentVar})"></component>`
                                );
                                let clone = elem.previousSibling;
                                copyIfUnlessEachAttributesToComponent(elem, clone);
                                elem.setAttribute = function(){
                                    clone.setAttribute.apply(clone, arguments);
                                }
                                elem.remove();
                            }
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
                            handleUnknownAttr(elem, attrName, modifiers, attr.value);
                    }
                    return true;
                }

                function handleUnknownAttr(elem, attrName, modifiers, attrVal){
                    if(attrName.startsWith('on')){
                        elem.setAttribute('v-on:'+ attrName.substr(2) + addModifiers(modifiers), extractExpression(attrVal));
                    }else
                        elem.setAttribute('v-bind:'+ attrName, extractExpression(attrVal));
                }
            }
        }
    }

    // function buildTemplates(){
    //     const templatesFunctions = [];
    //     glob(VUE_TEMPLATES_DIR +'/**/*.@(pug|html)', {sync: true}).forEach(function(element) {
    //         let componentName = getFileNameWithoutExt(element);
    //         var vueTemplate = element.endsWith('.pug')? pug.compileFile(element)(): fs.readFileSync(element, 'utf8');
    //         let render = getVueTemplateRender(vueTemplate, componentName);
    //         if(render){
    //             templatesFunctions.push(`"${componentName.toUpperCase()}":${render.template}`);
    //         }
    //     });
    //     if(templatesFunctions.length > 0){
    //         let vueTempaltesObject = 'var _VueTemplates={' + (templatesFunctions.join(',')) + '};';
    //         if (!fs.existsSync(OUTPUT_DIR)) {
    //             mkdirp.sync(OUTPUT_DIR);
    //         }
    //         fs.writeFileSync(OUTPUT_DIR +'/'+ VUE_TEMPLATES_JS_FILE_NAME + '.js', vueTempaltesObject);
    //     }
    // }

    function buildLocales(){
        let langToPropertiesReader = {};
        let regexp = new RegExp('"([^(\")"]+)":', 'g');
        glob(I18N_DIR +'/**/*.properties', {sync: true}).forEach(function(filePath) {
            let fileName = getFileNameWithoutExt(filePath);
            let [bundle, locale] = fileName.split('_');
            if(langToPropertiesReader[locale] == null)
                langToPropertiesReader[locale] = new PropertiesReader();
            langToPropertiesReader[locale].append(filePath);
        });
        for(let locale in langToPropertiesReader){
            let i18nObj = JSON.stringify(langToPropertiesReader[locale]._properties).replace(regexp,"$1:");
            let localeFileString = 'var _AppLocale={locale:"'+ locale +'",values:'+ i18nObj +'};';
            if (!fs.existsSync(OUTPUT_DIR)) {
                fs.mkdirSync(OUTPUT_DIR, {recursive: true});
            }
            fs.writeFileSync(OUTPUT_DIR +'/'+ I18N_JS_FILE_NAME + '_' + locale +'.js', localeFileString);
        }
    }

    buildTemplates();
    buildLocales();

    let beanToId = {};
    let beanCounter = 0;
    beanToId[EVENTMANAGER_CLASS_NAME] = beanCounter++; 
    let entryPointsNames = [];
    let componentsNames = [];
    let eventToIdentifier = [];

    function getOrCreateConstructor(classNode){
        for(let member of classNode.members)
            if(member.kind == ts.SyntaxKind.Constructor)
                return member;
        let constructorNode = ts.createConstructor(null, null, null, ts.createBlock([]));
        classNode.members.push(constructorNode);
        if(ts.getClassExtendsHeritageElement(classNode) != null)
            constructorNode.body.statements.push(ts.createExpressionStatement(ts.createCall(ts.createSuper())));
        return constructorNode;
    }

    function cleanMemberCache(memberNode){
        memberNode.end = memberNode.pos = -1;
        memberNode.flags = 8;
        memberNode.modifierFlagsCache = memberNode.transformFlags = null;
    }

    function getNodePath(node, className){
        let d = node.getSourceFile()
            .locals
            .get(className? className: node.expression.escapedText);

        if(d == null)
            return;
        let f =  d.declarations[0].parent;

        if(f.fileName)
            return f.fileName;

        let relativeModulePath = f
            .moduleSpecifier
            .text
        return node.getSourceFile().resolvedModules.get(relativeModulePath).resolvedFileName;
    }

    function getClass(currentNode, className, context){
        let fullModulePath = getNodePath(currentNode, className);
        if(fullModulePath != null){
            let module = context.getEmitHost().getSourceFileByPath(fullModulePath);
            for(let node of module.statements)
                if((node.kind === ts.SyntaxKind.ClassDeclaration || node.kind == ts.SyntaxKind.InterfaceDeclaration) && node.name.escapedText == className)
                    return node;
        }
    }

    function getParentClassName(classNode) {
        let parent = ts.getClassExtendsHeritageElement(classNode);
        if(parent == null)
            return;
        return parent.expression.escapedText;
    }

    function getParentClass(classNode, context){
        let parentClassName = getParentClassName(classNode);
        if(parentClassName == null)
            return;
        return getClass(classNode, parentClassName, context);
    }

    function getAllRootComponentsData(componentNode, context){
        let maxParents = 0;
        let members = [];
        let attachHook = null;
        let detachHook = null;
        while(componentNode = getParentClass(componentNode, context)){
            if(componentNode.members){
                members = members.concat(componentNode.members
                    .filter(m => m.kind == ts.SyntaxKind.PropertyDeclaration)
                    .map(m => m.name.escapedText)
                )
                for(let member of componentNode.members){
                    if(member.kind == ts.SyntaxKind.MethodDeclaration){
                        let methodName = member.name.escapedText;
                        if(!attachHook && isNodeHasDecorator(member, ANNOTATION_AFTERATTACH)){
                            attachHook = methodName;
                        }
                        if(!detachHook && isNodeHasDecorator(member, ANNOTATION_BEFOREDETACH)){
                            detachHook = methodName;
                        }
                    }
                }
            }
            if(++maxParents > 100)
                throw new Error('More than 100 parents!!');
        }
        return {
            members: members,
            attachHook: attachHook,
            detachHook: detachHook
            // onChangeMethods: {}
        }
    }

    function hasPropertyAssignmentInConstructor(constructorNode, member){
        let memberName = member.name.escapedText;
        for(let node of constructorNode.body.statements){
            if(node.kind == ts.SyntaxKind.ExpressionStatement
                && node.expression.kind == ts.SyntaxKind.BinaryExpression
                && node.expression.operatorToken.kind == ts.SyntaxKind.FirstAssignment
                && node.expression.left.kind == ts.SyntaxKind.PropertyAccessExpression
                && node.expression.left.name.escapedText == memberName
            )
                return true;
        }
    }

    function getSuperNode(constructorNode){
        return constructorNode.body.statements.filter(s =>
            (s.kind == ts.SyntaxKind.ExpressionStatement)
            && (s.expression.kind == ts.SyntaxKind.CallExpression)
            && (s.expression.expression.kind == ts.SyntaxKind.SuperKeyword))[0]
    }

    function getComponentTemplate(componentNode) {
        let reactiveArgs = getDecoratorArguments(componentNode, ANNOTATION_REACTIVE_CLASS);
        let templateArg = reactiveArgs? reactiveArgs[0]: null;
        if(templateArg){
            if(templateArg.kind == ts.SyntaxKind.ArrowFunction || templateArg.kind == ts.SyntaxKind.FunctionExpression){
                for(let s of templateArg.body.statements){
                    if(
                        (s.kind == ts.SyntaxKind.ExpressionStatement || s.kind == ts.SyntaxKind.ReturnStatement ) 
                        && s.expression.kind == ts.SyntaxKind.TemplateExpression
                    ){
                        templateArg = s.expression
                    }
                }
                if(templateArg == null)
                    throw new Error('Template is not found! Component: '+ componentNode.name.escapedText)
            }else if(templateArg.kind != ts.SyntaxKind.TemplateExpression){
                throw new Error('Template is not valid type! StringTemplate is required! Component: '+ componentNode.name.escapedText)
            }
            return templateArg.getFullText().slice(1, -1);// remove quote(`) chars
        }
    }


    const VirtualComponentIdProducer = new class{
        constructor(){
            this.counter = 0;
        }
        getNext(){
            return 'vc' + (this.counter++);
        }
    }
    class MemberInitializator{
        constructor(className, member, requiredType, idProducer){
            this.memberPathToId = {}
            this.initialize(className, member, requiredType, idProducer);
        }
        getInitializer(memberPathName, member, requiredType, idProducer){
            let isCompositeMember = member.type.kind == ts.SyntaxKind.ObjectLiteralExpression;
            if(!isCompositeMember){
                if(member.type.typeName && member.type.typeName.escapedText == requiredType){
                    let id = idProducer.getNext();
                    this.memberPathToId[memberPathName] = id;
                    return ts.createStringLiteral(String(id));
                }else
                    throw new Error(`Member "${memberPathName} must have the ${requiredType} type`);
            }else{
                let properies = [];
                let memberParts = member.type.members;
                for(let memberPart of memberParts){
                    let fullMemberPartName = memberPathName + '.'+ memberPart.name.escapedText;
                    properies.push(ts.createPropertyAssignment(
                        memberPart.name.escapedText, 
                        this.getInitializer(fullMemberPartName, memberPart, requiredType, idProducer)
                    ));
                }
                return ts.createObjectLiteral(properies);
            }
        }
        initialize(className, member, requiredType, idProducer) {
            let memberName = className +'.'+ member.name.escapedText;
            member.initializer = this.getInitializer(memberName, member, requiredType, idProducer);
        }
        getMemberPathToId(){
            return this.memberPathToId;
        }
    }

    function configureComponent(componentNode, context){
        let componentName = componentNode.name.escapedText;
        let template = getComponentTemplate(componentNode);
        let virtualComponentToId = null;
        let componentRoot = getAllRootComponentsData(componentNode, context);
        // let parent = getParentClass(componentNode, context);
        // if(parent)
        // configureComponent(parent);

        let onchangeMethods = {};
        let elementProps = [];
        let attachHook = null;
        let detachHook = null;
        let constructorNode = getOrCreateConstructor(componentNode);
        if(isEntryPointNode(componentNode)){
            let superStatement = getSuperNode(constructorNode);
            let elementArgument = superStatement.expression.arguments.shift();

            constructorNode.body.statements.push(
                ts.createExpressionStatement(
                    ts.createCall(
                        ts.createPropertyAccess(
                            ts.createThis(),
                            "attachComponent"),
                        null,
                        [elementArgument, ts.createThis()]
                    )
                )
            )
        }
        if(componentNode.members){
            for(let member of componentNode.members){
                if(member.kind == ts.SyntaxKind.PropertyDeclaration){
                    let memberName = member.name.escapedText;

                    if(isNodeHasDecorator(member, ANNOTATION_INIT_VIRTUAL_COMPONENT)){
                        let neededModifiers = member.modifiers.filter(m => (m.kind == ts.SyntaxKind.ReadonlyKeyword) || (m.kind == ts.SyntaxKind.StaticKeyword));
                        let memberName = member.name.escapedText;
                        if(neededModifiers.length == 2){
                            virtualComponentToId = 
                                new MemberInitializator(componentName, member, ANNOTATION_INIT_VIRTUAL_COMPONENT, VirtualComponentIdProducer)
                                .getMemberPathToId()
                        }else
                            throw new Error(`Event "${className}.${memberName}" should be be a static & readonly`)
                    }

                    let isElementProp = isNodeHasDecorator(member, ANNOTATION_ELEMENT);
                    if(isElementProp){
                        elementProps.push(memberName);
                        removeDecorator(member, ANNOTATION_ELEMENT);
                    }else{
                        if(member.initializer == null
                            && !componentRoot.members.includes(memberName)
                            && !hasPropertyAssignmentInConstructor(constructorNode, member)
                        ){
                            member.initializer = ts.createNull();
                        }
                    }
                    let methodName = getDecoratorArgumentMethodName(member, ANNOTATION_ONCHANGE, true);
                    if(methodName != null){
                        onchangeMethods[member.name.escapedText] = methodName;
                        removeDecorator(member, ANNOTATION_ONCHANGE);
                    }
                }else if(member.kind == ts.SyntaxKind.MethodDeclaration){
                    let methodName = member.name.escapedText;
                    if(!attachHook && isNodeHasDecorator(member, ANNOTATION_AFTERATTACH)){
                        attachHook = methodName;
                        if(componentRoot.attachHook){
                            member.body.statements.unshift(
                                ts.createExpressionStatement(ts.createCall(ts.createPropertyAccess(ts.createSuper(), ts.createIdentifier(componentRoot.attachHook))))
                            );
                        }
                        removeDecorator(member, ANNOTATION_AFTERATTACH);
                    }
                    if(!detachHook && isNodeHasDecorator(member, ANNOTATION_BEFOREDETACH)){
                        detachHook = methodName;
                        if(componentRoot.detachHook){
                            member.body.statements.unshift(
                                ts.createExpressionStatement(ts.createCall(ts.createPropertyAccess(ts.createSuper(), ts.createIdentifier(componentRoot.detachHook))))
                            );
                        }
                        removeDecorator(member, ANNOTATION_BEFOREDETACH);
                    }
                }
            }
        }
        let configuration = {
            w: onchangeMethods, //onchange methods
            // c: [], //cached methods
            ep: elementProps //element properties
        };
        if(attachHook)
            configuration.ah = attachHook;
        else
            configuration.ah = componentRoot.attachHook
        if(detachHook)
            configuration.dh = detachHook;
        else
            configuration.dh = componentRoot.detachHook

        let renderObj
        if(template){
            // configuration.tn = templateName.toUpperCase();
            // let render = getVueTemplateRender(template, componentName);
            // renderObj = ts.createSourceFile("a", `alert(${render})`).statements[0].expression.arguments[0];
            renderObj = ts.createIdentifier(VUE_TEMPLATE_FUNC_NAME);
            let templateRender = getVueTemplateRender(template, componentName, virtualComponentToId);
            // for(let interfaceId of templateRender.virtualComponents){
            //     let interfaceName = Interfaces.getNameById(interfaceId);
            //     if(!isImplementsInterface(context, componentNode, interfaceName, true))
            //         throw new Error('Invalid template virtual component "Type<'+ interfaceName +'>". Component "'+ componentName + '" does not implement interface: '+ interfaceName);
            // }
            componentPathToTemplate[componentNode.parent.path] = templateRender.template;
            // removeDecorator(componentNode, ANNOTATION_TEMPLATE)
        }

        let callExpr = (isStatic) => ts.createCall(
            ts.createPropertyAccess(
                ts.createIdentifier(isStatic? '_super': '_app'),
                ts.createIdentifier(isStatic? 'initComponent': 'initComp')
            ),
            undefined, // type arguments, e.g. Foo<T>()
            [
                ts.createLiteral(componentName.toUpperCase()),
                ts.createLiteral(JSON.stringify(configuration)),
                ts.createThis(),
                renderObj == null? ts.createNull(): renderObj
            ]
        );
        if(isEntryPointNode(componentNode))
            constructorNode.body.statements.unshift(callExpr(true));
        else
            constructorNode.body.statements.push(callExpr(false));

        removeDecorator(componentNode, ANNOTATION_REACTIVE_CLASS)
        componentsNames.push(componentName);
    }

    function getBeansDeclarations(beanClass, beansOfEntryPoint){
        let beansDeclarations = {};
        for(let member of beanClass.members){
            if(member.kind == ts.SyntaxKind.MethodDeclaration && isNodeHasDecorator(member, ANNOTATION_BEAN)){
                if(member.type.typeName == null)
                    throw new Error('Method '+ member.name.escapedText +' is not typed!')
                if(member.parameters && member.parameters.length != 0)
                    throw new Error('Method '+ member.name.escapedText +' should not have parameters')
                // beansDeclarations[member.type.typeName.escapedText] = member.name.escapedText;

                let typeName = member.type.typeName.escapedText

                let beanId = beanToId[typeName];
                if(beanId === undefined){
                    beanId = beanCounter;
                    beanToId[typeName] = beanCounter;
                    beanCounter++;
                    if(beansOfEntryPoint)
                        beansOfEntryPoint.push(typeName);
                }else if(beansOfEntryPoint && beansOfEntryPoint.includes(typeName)){
                    throw new Error(`Bean with type ${typeName} is initialized twice!`)
                }
                beansDeclarations[beanId +';'+ typeName] = member.name.escapedText;
                removeDecorator(member, ANNOTATION_BEAN);
                cleanMemberCache(member);
            }
        }
        return beansDeclarations;
    }

    function configureEntryPointClass(entryPointNode, context){
        let entryPointClassName = entryPointNode.name.escapedText;
        let beansClassesBeans = [];
        let beansOfEntryPoint = [];

        let beansClassesArg = getDecoratorArguments(entryPointNode, ANNOTATION_BEANS, true);
        let beansClasses = beansClassesArg != null? beansClassesArg[0].elements: [];
        for(let beanClass of beansClasses){
            let beanClassName = beanClass.escapedText;
            beansClassesBeans.push(getBeansDeclarations(getClass(entryPointNode, beanClassName, context), beansOfEntryPoint));
        }

        beansClassesBeans.push(getBeansDeclarations(entryPointNode, beansOfEntryPoint));

        let configurator = {
            name: entryPointClassName,
            beans: beansClassesBeans
        }

        // $ = (window[class] = class, jsonConfiguration)
        entryPointNode.members.push(
            ts.createProperty(
                undefined,
                [ts.createModifier(ts.SyntaxKind.StaticKeyword)],
                ts.createIdentifier('$beans'),
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.ArrayLiteralExpression),
                ts.createArrayLiteral(beansClasses)
            )
        );
        entryPointNode.members.push(
            ts.createProperty(
                undefined,
                [ts.createModifier(ts.SyntaxKind.StaticKeyword)],
                ts.createIdentifier('$'),
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.StringLiteral),
                ts.createBinary(
                    ts.createBinary(
                        ts.createElementAccess(ts.createIdentifier('window'), ts.createLiteral(entryPointClassName)),
                        ts.SyntaxKind.FirstAssignment,
                        ts.createIdentifier(entryPointClassName)
                    ),
                    ts.SyntaxKind.CommaToken,
                    ts.createLiteral(JSON.stringify(configurator))
                )
            )
        );
        entryPointsNames.push(entryPointNode.name.escapedText);
        removeDecorator(entryPointNode, ANNOTATION_BEANS)
        removeDecorator(entryPointNode, ANNOTATION_ENTRY_POINT_CLASS)
    }

    function isComponentNode(classNode){
        let className = classNode.name.escapedText;
        return componentsNames.includes(className) || isNodeHasDecorator(classNode, ANNOTATION_REACTIVE_CLASS);
    }

    function isEntryPointNode(classNode){
        let className = classNode.name.escapedText;
        return entryPointsNames.includes(className) || isNodeHasDecorator(classNode, ANNOTATION_ENTRY_POINT_CLASS);
    }

    function injectAutowiredEverywhere(rootNode, context){
        function getBeanId(beanName){
            if(entryPointsNames.includes(beanName))
                return -1;
            let beanId = beanToId[beanName];
            if(beanId === undefined)
                throw new Error('Bean '+ beanName +' is not initialized!')
            return beanId;
        }
        ts.visitEachChild(rootNode, (node) => {
            if (node.kind === ts.SyntaxKind.ClassDeclaration && node.members) {
                tryBindListeners(node);

                for(let member of node.members){
                    if(isNodeHasDecorator(member, ANNOTATION_AUTOWIRED)){
                        if(member.type.typeName == null)
                            throw new Error('Field '+ member.name.escapedText +' is not typed!')
                        member.initializer =  ts.createCall(
                            ts.createPropertyAccess(
                                ts.createIdentifier('_app'),
                                ts.createIdentifier('bean')
                            ),
                            undefined, // type arguments, e.g. Foo<T>()
                            [
                                ts.createLiteral(getBeanId(member.type.typeName.escapedText)),
                            ]
                        );
                        if(member.type.typeName.escapedText == EVENTMANAGER_CLASS_NAME) {
                            member.initializer.arguments.push(ts.createThis());
                        }
                        removeDecorator(member, ANNOTATION_AUTOWIRED)
                    }
                }
            }
        }, context)
    }


    function tryBindListeners(classNode){
        if (classNode.members) {
            let methodToEvent = {};
            let hasListeners;
            for(let member of classNode.members){
                if(isNodeHasDecorator(member, ANNOTATION_LISTENER)){
                    hasListeners = true;
                    let [className, propName] = getDecoratorArgumentCallExpr(member, ANNOTATION_LISTENER, true);
                    let path = getNodePath(classNode, className);
                    let index = eventToIdentifier.findIndex(o => o.classFile == path && o.className == className && o.memberName == propName);
                    if(index == null || index < 0)
                        index = eventToIdentifier.push({
                            classFile: path,
                            className: className,
                            memberName: propName,
                            init: false
                        }) - 1;

                    methodToEvent[member.name.escapedText] = String(index);
                    removeDecorator(member, ANNOTATION_LISTENER);
                }
            }

            if(hasListeners){
                let callExpr = (isStatic) => ts.createCall(
                    ts.createPropertyAccess(
                        ts.createIdentifier(isStatic? '_super': '_app'),
                        ts.createIdentifier(isStatic? 'addListeners': 'listeners')
                    ),
                    undefined, // type arguments, e.g. Foo<T>()
                    [
                        ts.createLiteral(JSON.stringify(methodToEvent)),
                        ts.createThis()
                    ]
                );
                if(isEntryPointNode(classNode))
                    getOrCreateConstructor(classNode).body.statements.unshift(callExpr(true));
                else
                    getOrCreateConstructor(classNode).body.statements.push(callExpr(false));
            }
        }
    }


    function initInterfacesDef(classNode) {
        let interfaceMask = Interfaces.getMask(getParents(classNode));
        if(interfaceMask.length > 0){
            // getOrCreateConstructor(classNode).body.statements.unshift(callExpr(true));
            // let initInterfacesCall = ts.createCall(
            //     ts.createPropertyAccess(
            //         ts.createIdentifier('_app'),
            //         ts.createIdentifier('interface')
            //     ),
            //     undefined, // type arguments, e.g. Foo<T>()
            //     [
            //         ts.createNumericLiteral(String(interfaceMask)),
            //         ts.createThis()
            //     ]
            // );
            classNode.members.push(
                ts.createProperty(
                    undefined,
                    [ts.createModifier(ts.SyntaxKind.StaticKeyword)],
                    ts.createIdentifier('$intf'),
                    undefined,
                    undefined,
                    ts.createArrayLiteral(
                        interfaceMask.map(id => ts.createNumericLiteral(String(id)))
                    )
                )
            );

            // let constructorNode = getOrCreateConstructor(classNode);
            // let superNode = getSuperNode(constructorNode);
            // if(superNode != null){
            //     let superNodeIndex = constructorNode.body.statements.indexOf(superNode);
            //     constructorNode.body.statements.splice(superNodeIndex + 1, 0, initInterfacesCall); // after super
            // }else
            //     constructorNode.body.statements.unshift(initInterfacesCall);
        }
    }

    function initAppEvents(classNode){
        let jsonFields = [];
        let jsonNameToAlias = [];
        let noStaticFieldsCount = 0;
        if(classNode.members){
            let className = classNode.name.escapedText;
            for(let member of classNode.members){
                if(member.kind == ts.SyntaxKind.PropertyDeclaration){
                    if(member.modifiers && member.modifiers.find(m => m.kind == ts.SyntaxKind.StaticKeyword) == null){
                        noStaticFieldsCount++;
                        if(isNodeHasDecorator(member, ANNOTATION_TO_JSON)){
                            let memberName = member.name.escapedText;
                            let aliasName = getDecoratorArgumentMethodName(member, ANNOTATION_TO_JSON);
                            if(aliasName){
                                jsonNameToAlias.push(
                                    ts.createPropertyAssignment(memberName, ts.createStringLiteral(aliasName))
                                );
                            }else{
                                jsonFields.push(ts.createStringLiteral(memberName));
                            }
                        }
                    }
                    removeDecorator(member, ANNOTATION_TO_JSON);
                }
                if(member.kind == ts.SyntaxKind.PropertyDeclaration && isNodeHasDecorator(member, ANNOTATION_INIT_EVENT)){
                    let classFile = classNode.getSourceFile().path;
                    let neededModifiers = member.modifiers.filter(m => (m.kind == ts.SyntaxKind.ReadonlyKeyword) || (m.kind == ts.SyntaxKind.StaticKeyword));
                    let memberName = member.name.escapedText;
                    if(neededModifiers.length == 2){
                        let isCompositeEvent = member.type.members != null;
                        let events = member.type.members || [member];
                        let properies = [];
                        for(let event of events){
                            let eventName = memberName + (isCompositeEvent? ('.'+ event.name.escapedText): '');
                            if(event.type.typeName && event.type.typeName.escapedText == APP_EVENT_TYPE){
                                let eventId;
                                for(let i = 0; i < eventToIdentifier.length; i++){
                                    let event = eventToIdentifier[i];
                                    if(event.classFile == classFile && event.className == className && event.memberName == eventName){
                                        event.init = true;
                                        eventId = i;
                                        break;
                                    }
                                }
                                if(eventId == null)
                                    eventId = eventToIdentifier.push({
                                        classFile: classNode.getSourceFile().path,
                                        className: className,
                                        memberName: eventName,
                                        init: true
                                    }) - 1;

                                if(isCompositeEvent)
                                    properies.push(ts.createPropertyAssignment(event.name.escapedText, ts.createStringLiteral(String(eventId))));
                                else
                                    member.initializer = ts.createStringLiteral(String(eventId));
                            }else
                                throw new Error(`Event "${className}.${eventName}" must have ${APP_EVENT_TYPE} type`)
                        }

                        if(isCompositeEvent)
                            member.initializer = ts.createObjectLiteral(properies);
                    }else
                        throw new Error(`Event "${className}.${memberName}" must be a static & readonly`)
                    removeDecorator(member, ANNOTATION_INIT_EVENT);
                }
            }
        }
        if(jsonNameToAlias.length > 0 || jsonFields.length > 0){
            classNode.members.push(
                ts.createProperty(
                    undefined,
                    [ts.createModifier(ts.SyntaxKind.StaticKeyword)],
                    ts.createIdentifier('$json'),
                    undefined,
                    undefined,
                    ts.createObjectLiteral([
                        ts.createPropertyAssignment('f', ts.createArrayLiteral(jsonFields)),
                        ts.createPropertyAssignment('a', ts.createObjectLiteral(jsonNameToAlias))
                    ])
                )
            );
        }
    }

    function getRealIdentifier(sourceFile, classPath) {
        if(!sourceFile.resolvedModules.has(classPath))
            return null;
        for(let statement of sourceFile.statements){
            if(statement.kind == ts.SyntaxKind.ImportDeclaration){
                if(statement.moduleSpecifier.text == classPath){
                    return statement.importClause.name.escapedText;
                }
            }
        }
    }


    let files = [];
    let isInitialized;

    var transformer = function (context) {
        var visitor = function (node) {
            if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                // let className = node.name.escapedText;
                // if(className == APP_CLASS_NAME)
                //     appClassNode = node;
                // else 
                if(getParentClassName(node) == 'Array'){
                    let constructorNode = getOrCreateConstructor(node);
                    let superNode = getSuperNode(constructorNode);
                    if(superNode != null){
                        if(superNode.expression.arguments && superNode.expression.arguments.length > 0){
                            throw new Error('Super node should be without arguments when you extending array');
                        }
                        let superNodeIndex = constructorNode.body.statements.indexOf(superNode);
                        constructorNode.body.statements.splice(superNodeIndex, 1);
                    }
                }
                if(isEntryPointNode(node)){
                    // entryPointClassNodes.push(node);
                    configureEntryPointClass(node, context)
                }
                if(isComponentNode(node)){
                    // components[className] = node;
                    configureComponent(node, context);
                }

                initAppEvents(node);

                initInterfacesDef(node);

                // tryBindListeners(node);
                // if(isNodeHasDecorator(node, ANNOTATION_BEAN) && isHasEmptyPublicConscructor(node))
                // beans.push(className);
            }else if(node.kind === ts.SyntaxKind.InterfaceDeclaration && isImplementsInterface(context, node, 'Component')){
                
            }else if(node.kind == ts.SyntaxKind.CallExpression
                 && node.expression.escapedText == TYPE_CLASS_NAME 
                 && (node.arguments == null || arguments.length == 0)){
                     
                let typeName = node.typeArguments[0].typeName.escapedText;
                node.arguments = [getNodePath(node, typeName)?
                    ts.createNumericLiteral(String(Interfaces.getId(typeName)))
                    :
                    ts.createIdentifier(typeName)
                ];
            }else if(node.kind == ts.SyntaxKind.SourceFile){
                var result = ts.visitEachChild(node, visitor, context);
                injectAutowiredEverywhere(node, context);
                return result;
            }else {
                if(node.kind == ts.SyntaxKind.ImportDeclaration && node.importClause.name){
                    let name = node.importClause.name.escapedText;
                    if(
                        name == ANNOTATION_AUTOWIRED ||
                        name == ANNOTATION_BEAN ||
                        name == ANNOTATION_BEANS ||
                        name == ANNOTATION_ENTRY_POINT_CLASS ||
                        name == ANNOTATION_ONCHANGE ||
                        name == ANNOTATION_LISTENER ||
                        name == ANNOTATION_BEFOREDETACH ||
                        name == ANNOTATION_AFTERATTACH ||
                        name == ANNOTATION_ELEMENT ||
                        name == ANNOTATION_INIT_EVENT ||
                        name == ANNOTATION_INIT_VIRTUAL_COMPONENT ||
                        // name == ANNOTATION_TEMPLATE ||
                        name == ANNOTATION_TO_JSON ||
                        name == ANNOTATION_REACTIVE_CLASS){
                        node.kind = -1;
                        return;
                    }
                }
                return ts.visitEachChild(node, visitor, context);
            }
        };

        return function (node) {
            if(!isInitialized){
                isInitialized = true;
                let host = context.getEmitHost();
                let basePath = host.getCommonSourceDirectory();
                let libPath = basePath + 'node_modules/';
                let workNodes = host.getSourceFiles().filter(f => 
                    !f.hasNoDefaultLib
                    &&
                    !host.isSourceFileFromExternalLibrary(f)
                    &&
                    !f.path.startsWith(libPath)
                );
                let vis = function (node) {
                    componentExpr: if(node.kind == ts.SyntaxKind.SourceFile){
                        let interfaceDeclaration = 
                            node.statements.find(s => s.kind === ts.SyntaxKind.InterfaceDeclaration && isImplementsInterface(context, s, 'Component'));
                        if(interfaceDeclaration == null)
                            break componentExpr;
                        let className = interfaceDeclaration.name.escapedText;
                        let classIndex = node.statements.findIndex(s => s.kind === ts.SyntaxKind.ClassDeclaration && s.name.escapedText == className);
                        if(classIndex < 0){
                            throw new Error('Component mixin should be with component class')
                        }
                        node.statements.splice(classIndex + 1, 0, ts.createCall(
                            ts.createPropertyAccess(
                                ts.createIdentifier('_app'),
                                ts.createIdentifier('mixin')
                            ),
                            undefined, // type arguments, e.g. Foo<T>()
                            [
                                ts.createLiteral(className),
                            ]
                        ));
                    }
                    typeExpr: if(node.kind == ts.SyntaxKind.CallExpression && node.expression.escapedText == TYPE_CLASS_NAME){
                        if(node.arguments != null && node.arguments.length == 1){
                            if(node.typeArguments != null && node.typeArguments.length > 0)
                                throw new Error('Type should be with generic type or argument type but not both!')
                            break typeExpr;
                        }
                        if(node.typeArguments == null || node.typeArguments.length == 0)
                            throw new Error('Genertic type of Type is not set!')
                        if(node.typeArguments[0].typeName == null)
                            throw new Error('Genertic type of Type is not valid: '+ node.typeArguments[0].typeName)

                        let typeName = node.typeArguments[0].typeName.escapedText;
                        let typePath = getNodePath(node, typeName);
                        if(typePath)
                            Interfaces.add(typePath)
                    }
                    return ts.visitEachChild(node, vis, context);
                }
                workFilesPaths = workNodes.map(n => n.path);
                for(let node of workNodes){
                    if(node.resolvedModules){
                        let importModules = Array.from(node.resolvedModules.values());
                        let hasTypeUsage = importModules.find(m => m.isExternalLibraryImport && m.originalFileName.endsWith(TYPE_CLASS_PATH));
                        let hasComponentUsage = importModules.find(m => m.isExternalLibraryImport && m.originalFileName.endsWith(COMPONENT_INTERFACE_PATH));
                        if(hasTypeUsage || hasComponentUsage){
                            ts.visitNode(node, vis);
                        }
                    }
                }
            }
            if(!files.includes(node.fileName)) {
                let result = ts.visitNode(node, visitor);
                files.push(node.fileName)
                return result
            }
            // let notInitEvent = eventToIdentifier.find(e => e.init == false);
            // if(notInitEvent)
            //     throw new Error('Event "'+ (notInitEvent.className +"."+ notInitEvent.memberName) +" is not found!")

            return node;
        };
    };
    return transformer;
}

class CompilePlugin{
    apply(compiler){
        const isDevelopmentMode = compiler.options.mode && compiler.options.mode == 'development';
        const ast = require('abstract-syntax-tree');
        function replaceDefaultInstanceof(element) {
            ast.replace(element, {
                enter (node) {
                    if (node.operator && node.operator == 'instanceof') {
                        let newNode = ast.parse('_app.instanceOf(1, 2)').body[0].expression;
                        newNode.arguments[0] = node.left;
                        newNode.arguments[1] = node.right;
                        return newNode;
                    }
                    return node
                }
            })
        }

        if(isDevelopmentMode) {
            compiler.hooks.compilation.tap('plastique modules compiling', function (compilation) {
                compilation.hooks.succeedModule.tap('plastique module compiling', function (module) {
                    if (!workFilesPaths.includes(module.resource))
                        return;
                    let tree = ast.parse(module._source._value);
                    replaceDefaultInstanceof(tree)
                    module._source._value = ast.generate(tree)
                });
            });
        }
        // compiler.hooks.afterCompile.tap('plastique after compiling operations', function (compilation) {
        //     compilation.compiler.parentCompilation = true; // to ignore ts-loader afterCompile hook, because its diagnostic fails
        // });
        compiler.hooks.emit.tap('plastique final compilation of modules', function(compilation){
            const uglifyJS = require("uglify-js");
            for(let asset in compilation.assets){
                let source = compilation.assets[asset].source();
                let tree = ast.parse(source);

                let modulesWrapper = tree.body[0].expression.arguments[0];
                let modules = isDevelopmentMode? modulesWrapper.properties: modulesWrapper.elements;

                modules.forEach((element, index) => {
                    let modulePath = compilation.modules[index].resource;
                    if(workFilesPaths.includes(modulePath)) {
                        replaceDefaultInstanceof(element)
                        let template = componentPathToTemplate[modulePath];
                        if (template == null)
                            return;

                        element = isDevelopmentMode ? element.value : element;
                        let origBody = element.body;
                        let fakeWrap = ast.parse('(function(){1}());');
                        fakeWrap.body[0].expression.callee.body = origBody;
                        fakeWrap.body.unshift(ast.parse(`$["__vueTemplateGenerator${modulePath}__"]`).body[0]);
                        element.body = {body: fakeWrap.body, type: "BlockStatement"}
                    }
                });
                let newCode = isDevelopmentMode? ast.generate(tree): uglifyJS.minify(ast.generate(tree)).code;
                for(let componentPath in componentPathToTemplate){
                    let vueTemplateGeneratorFunc = `function ${VUE_TEMPLATE_FUNC_NAME}(){return ${componentPathToTemplate[componentPath]}}`;
                    if(isDevelopmentMode)
                        newCode = newCode.replace(`$["__vueTemplateGenerator${componentPath}__"]`, vueTemplateGeneratorFunc);
                    else
                        newCode = newCode.replace(`$["__vueTemplateGenerator${componentPath}__"],`, vueTemplateGeneratorFunc +'!');

                }
                compilation.assets[asset]._cachedSource = newCode;
            }
        });
    }
}
function Loader(content) {
    // if(this.resourcePath.endsWith('node_modules/plastique/Type.ts'))
    //     return content;
    // content = content.replace(/Type\s*<\s*(\w+)>\s*\(\s*\)/g, function(typeDef, interfaceName){
    //     return typeDef.replace(/\(\s*\)/, '('+ Interfaces.getId(interfaceName) +')')
    // })
    return content;
}
Loader.Plastique = Plastique,
Loader.CompilePlugin = CompilePlugin,
Loader.LibraryPlugin = function(varToLibPath){
    const path = require("path");
    const webpack = require("webpack");
    varToLibPath = varToLibPath || {};
    for(let lib in varToLibPath){
        if(varToLibPath[lib] == null || varToLibPath[lib] == '')
            varToLibPath[lib] = path.join(__dirname, './compileUtils', 'empty.ts')
    }
    return new webpack.ProvidePlugin(Object.assign(varToLibPath ,{
        '__extends': path.join(__dirname, './compileUtils', 'extends.ts'),
        '__decorate': path.join(__dirname, './compileUtils', 'decorate.ts'),
        '__assign': path.join(__dirname, './compileUtils', 'assign.ts')
    }))
}
module.exports = Loader;