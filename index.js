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
    const ANNOTATION_ENTRY_POINT_CLASS = 'EntryPoint';
    // const ANNOTATION_REACTIVE_FIELD = 'Reactive';
    const ANNOTATION_CACHED_METHOD = 'Cached';
    const ANNOTATION_AUTOWIRED = 'Autowired';
    const ANNOTATION_ONCHANGE = 'OnChange';
    const ANNOTATION_BEAN = 'Bean';
    const ANNOTATION_LISTENER = 'Listener';
    const ANNOTATION_AFTERATTACH = 'AfterAttach';
    const ANNOTATION_BEFOREDETACH = 'BeforeDetach';

    const COMPONENT_INTERFACE_NAME = 'Component';
    const I18N_METHOD = '_app.i18n';

    // --------------------------------------------------------------------------------------------------------------------

    var glob = require('glob');
    var fs = require('fs');
    const pug = require('pug');
    const vueCompiler = require('vue-template-compiler');
    const { JSDOM } = require('jsdom');
    const ts = require("typescript");
    const PropertiesReader = require('properties-reader');
    Array.prototype.flatMap = function(f) {
        return this.map(f).reduce((x,y) => x.concat(y), [])
    }


    function isClassImplementsInterface(nodeClass, interfaceName){
        let interfaces = ts.getClassImplementsHeritageClauseElements(nodeClass);
        return interfaces.map(t => t.expression.escapedText).includes(interfaceName);
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
    function getDecoratorArgumentMethodName(nodeClass, decoratorName, required){
        let decorators = nodeClass.decorators != null? nodeClass.decorators: [];
        if(decorators.length > 0){
            for(let decorator of nodeClass.decorators){
                let expr = decorator.expression;//.expression.escapedText
                let name = expr.expression? expr.expression.escapedText: expr.escapedText;

                if(name == decoratorName){
                    if(decorator.expression.arguments && decorator.expression.arguments.length > 0){
                        let text = decorator.expression.arguments[0].text;
                        return text? text: decorator.expression.arguments[0].name.escapedText;
                    }
                    if(required)
                        throw new Error('Decorator "'+ decoratorName +'" has no arguments!');
                }
            }
        }
        return null;
    }
    // function isHasEmptyPublicConscructor(classNode){
    //     let className = classNode.name.escapedText;
    //     let constructorDeclaration = classNode.members.filter(m => m.symbol.escapedName == '__constructor')
    //     if(constructorDeclaration.length > 0){
    //         if(classNode.parameters && classNode.parameters.length > 0)
    //             throw new Error('Class '+ className +' has no empty constructor!')
    //         if(classNode.modifiers && classNode.modifiers.length > 0 && classNode.modifiers[0].kind != ts.SyntaxKind.PublicKeyword)
    //             throw new Error('Class '+ className +' has no public constructor!')
    //     }
    //     return true;
    // }

    function getFileNameWithoutExt(filePath){
        var nameArray = filePath.split('/');
        return nameArray[nameArray.length - 1].split('.').slice(0, -1)[0]
    }

    function buildTemplates(){
        const templatesFunctions = [];
    
        glob(VUE_TEMPLATES_DIR +'/**/*.pug', {sync: true}).forEach(function(element) {
            let componentName = getFileNameWithoutExt(element);
            var vueTemplate = pug.compileFile(element)();
            let dom = new JSDOM('<html><body><template>'+ vueTemplate +'</template></body></html>');
            var rootTag = dom.window.document.body.firstElementChild.content;
            let elems = rootTag.querySelectorAll('*');
            if(handle(rootTag.children, elems, componentName)){
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
                templatesFunctions.push(`"${componentName.toUpperCase()}":{r:function(){${vueCompilerResult.render}},s:[${staticRenders.join(',')}]}`);
            }
        });
        let vueTempaltesObject = 'var _VueTemplates={' + (templatesFunctions.join(',')) + '};';
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, {recursive: true});
        }
        fs.writeFileSync(OUTPUT_DIR +'/'+ VUE_TEMPLATES_JS_FILE_NAME + '.js', vueTempaltesObject);
    
        function handle(rootComponents, elems, componentName){
            let prefix;
            if(elems.length > 0){
                for(var attr of rootComponents[0].attributes){
                    if(attr.name.startsWith('xmlns:') && attr.value == VUE_SCRIPT_DIALECT_URL){
                        let elem = rootComponents[0];
                        if(rootComponents.length > 1)
                            throw new Error('Component '+ componentName +' has multiple root tags!')
                        prefix = attr.name.substr(6);
                        elem.removeAttribute(attr.name);
                        elem.setAttribute('data-cn', componentName);
                        break;
                    }
                }
                if(prefix == null){
                    console.warn('Ignore template of component: '+ componentName)
                    return;
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
                    let isWithBrackets = val.match(/[$#]\{(.+?)\}/g).length > 1;
                    return val.replace(/#\{(.+?)\((.+?)\)}/g, I18N_METHOD +"('$1',$2)")
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
                            let componentCast = modifiers[0];
                            var componentVar = extractExpression(attr.value);
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

                // function getClickAndDblClickEvents(elem){
                //     let events = {};
                //     let size = 0;
                //     for(var attr of elem.attributes){

                //         if(attr.name.startsWith('v-on:click')){
                //             size++;
                //             events['click'] = attr;
                //         }else if(attr.name.startsWith('v-on:dblclick')){
                //             size++;
                //             events['dblClick'] = attr;
                //         }
                //         if(size == 2)
                //             return events;
                //     }
                // }

                function handleUnknownAttr(elem, attrName, modifiers, attrVal){
                    if(attrName.startsWith('on')){
                        elem.setAttribute('v-on:'+ attrName.substr(2) + addModifiers(modifiers), extractExpression(attrVal));
                        // let eventNameToAttr = getClickAndDblClickEvents(elem);
                        // if(eventNameToAttr){
                        //     elem.removeAttribute(eventNameToAttr['dblClick'].name);
                        //     eventNameToAttr['click'].value = `$convDblClick($event,${eventNameToAttr['click'].value},${eventNameToAttr['dblClick'].value})`;
                        // }
                    }else
                        elem.setAttribute('v-bind:'+ attrName, extractExpression(attrVal));
                }
            }
        }
    
    }


    function buildLocales(){
        let langToPropertiesReader = {};
        let regexp = new RegExp('"([^(\")"]+)":', 'g');
        glob(I18N_DIR +'/**/*', {sync: true}).forEach(function(filePath) {
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
    beanToId['EventManager'] = beanCounter++; //add EventManager as bean
    let entryPointsNames = [];
    let componentsNames = [];

    function getOrCreateConstructor(classNode){
        for(let member of classNode.members)
            if(member.kind == ts.SyntaxKind.Constructor)
                return member;
        constructorNode = ts.createConstructor(null, null, null, ts.createBlock([]));
        classNode.members.push(constructorNode);
        return constructorNode;
    }

    function cleanMemberCache(memberNode){
        memberNode.end = memberNode.pos = -1;
        memberNode.flags = 8;
        memberNode.modifierFlagsCache = memberNode.transformFlags = null;
    }


    function getParentClass(classNode, context){
        let parent = ts.getClassExtendsHeritageElement(classNode);
        if(parent == null)
            return;
        let parentClassName = parent.expression.escapedText;
        let relativeModulePath = classNode.getSourceFile().locals.get(parentClassName).declarations[0].parent.moduleSpecifier.text
        let fullModulePath = classNode.getSourceFile().resolvedModules.get(relativeModulePath).resolvedFileName;
        let module = context.getEmitHost().getSourceFileByPath(fullModulePath);
        for(let node of module.statements)
            if(node.kind === ts.SyntaxKind.ClassDeclaration && node.name.escapedText == parentClassName)
                return node;
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

    function configureComponent(componentNode, context){
        let componentName = componentNode.name.escapedText;
        let customComponentName = getDecoratorArgumentMethodName(componentNode, ANNOTATION_REACTIVE_CLASS) || componentName;

        let componentRoot = getAllRootComponentsData(componentNode, context);
        // let parent = getParentClass(componentNode, context);
        // if(parent)
            // configureComponent(parent);



        let onchangeMethods = {};
        let attachHook = null; 
        let detachHook = null; 
        let constructorNode = getOrCreateConstructor(componentNode);
        if(componentNode.members){
            for(let member of componentNode.members){
                if(member.kind == ts.SyntaxKind.PropertyDeclaration){
                    let memberName = member.name.escapedText;
                    if(member.initializer == null 
                        && !componentRoot.members.includes(memberName) 
                        && !hasPropertyAssignmentInConstructor(constructorNode, member)
                    )
                        member.initializer = ts.createNull();
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
            c: [] //cached methods
        };
        if(attachHook)
            configuration.ah = attachHook;
        else
            configuration.ah = componentRoot.attachHook
        if(detachHook)
            configuration.dh = detachHook;
        else
            configuration.dh = componentRoot.detachHook


        constructorNode.body.statements.push(ts.createCall(
            ts.createPropertyAccess(
            ts.createIdentifier('_app'),
            ts.createIdentifier('initComp')
            ),
            undefined, // type arguments, e.g. Foo<T>()
            [
                ts.createLiteral(customComponentName.toUpperCase()),
                ts.createLiteral(JSON.stringify(configuration)),
                ts.createThis()
            ]
        ));
        removeDecorator(componentNode, ANNOTATION_REACTIVE_CLASS)
        componentsNames.push(componentName);
    }

    function configureEntryPointClass(entryPointNode){
        let beansDeclarations = {};
        let entryPointClassName = entryPointNode.name.escapedText;

        for(let member of entryPointNode.members){
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
                }
                beansDeclarations[beanId +';'+ typeName] = member.name.escapedText;
                removeDecorator(member, ANNOTATION_BEAN);
                cleanMemberCache(member);
            }
        }
        let configurator = {
            name: entryPointClassName,
            beans: beansDeclarations
        }

        // $ = (window[class] = class, jsonConfiguration)
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
        removeDecorator(entryPointNode, ANNOTATION_ENTRY_POINT_CLASS)
    }

    function isComponentNode(classNode){
        let className = classNode.name.escapedText;
        return componentsNames.includes(className) || isNodeHasDecorator(classNode, ANNOTATION_REACTIVE_CLASS);
            // (isClassImplementsInterface(classNode, COMPONENT_INTERFACE_NAME) && isNodeHasDecorator(classNode, ANNOTATION_REACTIVE_CLASS));
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
                        if(member.type.typeName.escapedText == 'EventManager' && isComponentNode(node)) {
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
                    let eventName = getDecoratorArgumentMethodName(member, ANNOTATION_LISTENER, true);
                    methodToEvent[member.name.escapedText] = eventName.toLowerCase();
                    removeDecorator(member, ANNOTATION_LISTENER);
                }
            }
            
            if(hasListeners){
                getOrCreateConstructor(classNode).body.statements.push(ts.createCall(
                    ts.createPropertyAccess(
                    ts.createIdentifier('_app'),
                    ts.createIdentifier('listeners')
                    ),
                    undefined, // type arguments, e.g. Foo<T>()
                    [
                        ts.createLiteral(JSON.stringify(methodToEvent)),
                        ts.createThis()
                    ]
                ));
            }
        }
    }

    var transformer = function (context) {
        var visitor = function (node) {
            if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                // let className = node.name.escapedText;
                // if(className == APP_CLASS_NAME)
                //     appClassNode = node;
                // else 
                if(isNodeHasDecorator(node, ANNOTATION_ENTRY_POINT_CLASS)){
                    // entryPointClassNodes.push(node);
                    configureEntryPointClass(node)
                }else if(isComponentNode(node)){
                    // components[className] = node;
                    configureComponent(node, context);
                }

                

                tryBindListeners(node);
                // if(isNodeHasDecorator(node, ANNOTATION_BEAN) && isHasEmptyPublicConscructor(node))
                    // beans.push(className);
            }
            if(node.kind == ts.SyntaxKind.SourceFile){
                var result = ts.visitEachChild(node, visitor, context);
                injectAutowiredEverywhere(node, context);
                return result;
            }else {
                if(node.kind == ts.SyntaxKind.ImportDeclaration){
                    let name = node.importClause.name.escapedText;
                    if(
                        name == ANNOTATION_AUTOWIRED ||
                        name == ANNOTATION_BEAN ||
                        name == ANNOTATION_ENTRY_POINT_CLASS ||
                        name == ANNOTATION_ONCHANGE ||
                        name == ANNOTATION_LISTENER ||
                        name == ANNOTATION_BEFOREDETACH ||
                        name == ANNOTATION_AFTERATTACH ||
                        name == ANNOTATION_REACTIVE_CLASS){
                        node.kind = -1;
                        return;
                    }
                }
                return ts.visitEachChild(node, visitor, context);
            }
        };
        return function (node) { 
            return ts.visitNode(node, visitor); 
        };
    };

    return transformer;
}

module.exports = {
    Plastique: Plastique,
    CompilePlugin: function(varToLibPath){
        let path = require("path");
        let webpack = require("webpack");
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
}