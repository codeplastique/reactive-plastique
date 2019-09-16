function Plastique(options){
    let OUTPUT_DIR = options.outputDir; //__dirname + "/target";
    const VUE_TEMPLATES_DIR = options.vueTemplatesDir || 'templates';
    const VUE_TEMPLATES_JS_FILE_NAME = options.vueTemplatesOutputFileName || 'templates';

    //---------------------------------------------------------------------------------------------------------------------

    const VUE_SCRIPT_DIALECT_URL = 'http://github.com/codeplastique/plastique';


    const APP_CLASS_NAME = 'App';
    const ANNOTATION_REACTIVE_CLASS = 'Reactive';
    const ANNOTATION_ENTRY_POINT_CLASS = 'EntryPoint';
    const ANNOTATION_REACTIVE_FIELD = 'Reactive';
    const ANNOTATION_CACHED_METHOD = 'Cached';
    const ANNOTATION_AUTOWIRED = 'Autowired';
    const ANNOTATION_ONCHANGE = 'OnChange';
    const ANNOTATION_BEAN = 'Bean';

    const COMPONENT_INTERFACE_NAME = 'Component';
    const I18N_METHOD = '_app.i18n';

    // --------------------------------------------------------------------------------------------------------------------

    var glob = require('glob');
    var fs = require('fs');
    // let path = require("path");
    const pug = require('pug');
    const vueCompiler = require('vue-template-compiler');
    const { JSDOM } = require('jsdom');
    const ts = require("typescript");


    function isClassImplementsInterface(nodeClass, interfaceName){
        let interfaces = nodeClass.heritageClauses != null && nodeClass.heritageClauses[0]? nodeClass.heritageClauses[0].types: [];
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
                decorators.splice(i, 1);
                return;
            }
        }
        return decorators.map(d => {
            let expr = d.expression;//.expression.escapedText
            return expr.expression? expr.expression.escapedText: expr.escapedText;
        }).includes(decoratorName);
    }
    function getDecoratorArgumentMethodName(nodeClass, decoratorName){
        if(!isNodeHasDecorator(nodeClass, decoratorName))
            return null;
        for(let decorator of nodeClass.decorators){
            let expr = decorator.expression;//.expression.escapedText
            let name = expr.expression? expr.expression.escapedText: expr.escapedText;

            if(name == decoratorName)
                return decorator.expression.arguments[0].name.escapedText;
        }
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

    function buildTemplates(){
        const templatesFunctions = [];

        function getComponentName(filePath){
            var nameArray = filePath.split('/');
            return nameArray[nameArray.length - 1].split('.').slice(0, -1)
        }
    
        glob(VUE_TEMPLATES_DIR +'/**/*.pug', {sync: true}).forEach(function(element) {
            let componentName = getComponentName(element);
            var vueTemplate = pug.compileFile(element)();
            let dom = new JSDOM(vueTemplate);
            var elems = dom.window.document.body.querySelectorAll('*');
            if(handle(elems)){
                let completeVueTemplate = dom.window.document.body.innerHTML.replace(/___:([a-zA-Z\d]+?)___:/g, 'v-on:[$1]').replace(/__:([a-zA-Z\d]+?)__:/g, 'v-bind:[$1]');
                let vueCompilerResult = vueCompiler.compile(completeVueTemplate);
                if(vueCompilerResult.errors.length != 0)
                    throw new Error('Vue compile error!' + vueCompilerResult.errors);
                templatesFunctions.push(`"${componentName}":` + 'function(){' + vueCompilerResult.render +'}');
            }
        });
        let vueTempaltesObject = 'var _VueTemplates={' + (templatesFunctions.join(',')) + '};';
        if (!fs.existsSync(OUTPUT_DIR)) {
            fs.mkdirSync(OUTPUT_DIR, {recursive: true});
        }
        fs.writeFileSync(OUTPUT_DIR +'/'+ VUE_TEMPLATES_JS_FILE_NAME + '.js', vueTempaltesObject);
    
        function handle(elems){
            if(elems.length > 0){
                let prefix;
                elemsLoop: for(let i = 0; i < elems.length; i++){
                    let elem = elems[i];
                    if(i == 0){
                        if(!elem.hasAttributes())
                            return;
                        for(var attr of elem.attributes){
                            if(attr.name.startsWith('xmlns:') && attr.value == VUE_SCRIPT_DIALECT_URL){
                                prefix = attr.name.substr(6);
                                elem.removeAttribute(attr.name);
                                continue elemsLoop;
                            }
                        }
                        return;
                    }
                    if(!elem.hasAttributes())
                        continue;
                    let attributesForDelete = [];
                    for(var attr of elem.attributes){
                        if(handleAttr(elem, attr))
                            attributesForDelete.push(attr.name);
                    }
                    for(var attr of attributesForDelete){
                        elem.removeAttribute(attr);
                    }
                }
                return true;
    
    
                function wrapExpression(prefix, suffix, val){
                    return prefix + val + suffix;
                }
                function extractExpression(val, prefix, suffix){
                    let wrapExpr = wrapExpression.bind(this, prefix || "", suffix || "");
                    val = val.trim();
                    let isWithBrackets = val.match(/[$#]\{(.+?)\}/g).length > 1;
                    return val.replace(/\$\{(.+?)\}/g, wrapExpr(isWithBrackets? '($1)': '$1'))
                            .replace(/#\{(.+?)\}/g, wrapExpr(I18N_METHOD +'($1)'));
                }
                function isExpression(val){
                    return val.trim().search(/\$\{(.+?)\}/i) == 0;
                }
                function extract18nExpression(val, prefix, suffix){
                    let wrapExpr = wrapExpression.bind(this, prefix || "", suffix || "");
                    val = val.trim();
                    return val.replace(/#\{(.+?)\}/g, wrapExpr(I18N_METHOD +'($1)'));
                }
                function is18nExpression(val){
                    return val.trim().search(/#\{(.+?)\}/i) == 0;
                }
                function getModifiers(attrName){
                    let modifiers = attrName.split(':').slice(1).join('.');
                    return modifiers.length != 0? '.'+ modifiers: ''
                }
    
    
                function handleAttr(elem, attr){
                    if(!attr.name.startsWith(prefix +':'))
                        return;
                    var attrName = attr.name.substr(prefix.length + 1);// +1 - ':'
                    switch(attrName){
                        case 'model':
                            elem.setAttribute('v-model' + getModifiers(attrName), extractExpression(attr.value));
                            break;
                        case 'text':
                            elem.textContent = '{{'+ extractExpression(attr.value) +'}}';
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
                                let keyToVal = dynamicAttr.trim().split('=');
                                if(isExpression(keyToVal[0])){
                                    var macrosType = attrName == 'attrappend'? '__:': '___:';
                                    elem.setAttribute(macrosType + extractExpression(keyToVal[0]) + macrosType, extractExpression(keyToVal[1]));
                                }else if(isExpression(keyToVal[1])){
                                    handleUnknownAttr(elem, keyToVal[0].trim(), keyToVal[1]);
                                }else{
                                    elem.setAttribute(keyToVal[0], keyToVal[1]);
                                }
                            }
                            break;
                        case 'classappend':
                            elem.setAttribute('v-bind:class', extractExpression(attr.value));
                            break;
                        case 'component':
                            var componentVar = extractExpression(attr.value);
                            elem.insertAdjacentHTML('beforebegin',
                                `{{void $convComp(${componentVar})}}<component :is="${componentVar}.$.cn" :key="${componentVar}.$.id" v-bind:m="${componentVar}"></component>`
                            );
                            elem.remove();
                            break;
                        case 'each':
                            let iterateExpr = extractExpression(attr.value, '$convState(', ')');
                            var iterateParts = iterateExpr.split(':');
    
                            //each with stateObject
                            if(iterateParts[0].includes(',')){
                                var leftPartVars = iterateParts[0].split(',');
                                elem.insertAdjacentText('afterBegin',
                                    `{{void(${leftPartVars[1]}=${leftPartVars[0]}.s,${leftPartVars[0]}=${leftPartVars[0]}.v)}}`);
                            }
                            elem.setAttribute('v-for', iterateParts.join(' in '));
    
                            break;
                        default:
                            handleUnknownAttr(elem, attrName, attr.value);
                    }
                    return true;
                }
                function handleUnknownAttr(elem, attrName, attrVal){
                    if(is18nExpression(attrVal)){
                        elem.setAttribute(attrName, extract18nExpression(attrVal));
                    }else if(attrName.startsWith('on')){
                        elem.setAttribute('v-on:'+ attrName.substr(2) + getModifiers(attrName), extractExpression(attrVal));
                    }else
                        elem.setAttribute('v-bind:'+ attrName, extractExpression(attrVal));
                }
            }
        }
    
    }

    buildTemplates();
   
    // let appClassNode;
    let components = {};
    let beans = [];

    function configureComponentInitProperty(componentNode){
        let componentName = componentNode.name.escapedText;
        let onchangeMethods = [];
        for(let member of componentNode.members){
            if(member.kind == ts.SyntaxKind.PropertyDeclaration){
                if(member.initializer == null)
                    member.initializer = ts.createNull();
                let methodName = getDecoratorArgumentMethodName(member, ANNOTATION_ONCHANGE);
                if(methodName != null){
                    onchangeMethods.push(methodName);
                }
            }
        }

        let configuration = {
            cn: componentName,
            w: onchangeMethods, //onchange methods
            c: [] //cached methods
        };

        let field = ts.createProperty(
            undefined,
            [ts.createModifier(ts.SyntaxKind.StaticKeyword)],
            ts.createIdentifier('$s'),
            undefined,
            ts.createKeywordTypeNode(ts.SyntaxKind.StringLiteral),
            ts.createLiteral('')
        )
        field.initializer = ts.createCall(
            ts.createPropertyAccess(
            ts.createIdentifier('_app'),
            ts.createIdentifier('initComp')
            ),
            undefined, // type arguments, e.g. Foo<T>()
            [
            ts.createLiteral(JSON.stringify(configuration)),
            ts.createIdentifier(componentName)
            ]
        );
        componentNode.members.push(field);
        removeDecorator(componentNode, ANNOTATION_REACTIVE_CLASS)
    }

    function configureEntryPointClass(entryPointNode){
        let beansDeclarations = {};

        for(let member of entryPointNode.members){
            if(member.kind == ts.SyntaxKind.MethodDeclaration && isNodeHasDecorator(member, ANNOTATION_BEAN)){
                if(member.type.typeName == null)
                    throw new Error('Method '+ member.name.escapedText +' is not typed!')
                if(member.parameters && member.parameters.length != 0)
                    throw new Error('Method '+ member.name.escapedText +' should not have parameters')
                beansDeclarations[member.type.typeName.escapedText] = member.name.escapedText;
                beans.push(member.type.typeName.escapedText)
                removeDecorator(member, ANNOTATION_BEAN)
            }
        }
        let configurator = {
            name: entryPointNode.name.escapedText, //entry point class name
            beans: beansDeclarations
        }
        entryPointNode.members.push(
            ts.createProperty(
                undefined,
                [ts.createModifier(ts.SyntaxKind.StaticKeyword)],
                ts.createIdentifier('$'),
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.StringLiteral),
                ts.createLiteral(JSON.stringify(configurator))
            )
        );
        beans.push(entryPointNode.name.escapedText); //add entry point as bean
        beans.push('EventManager'); //add EventManager as bean
        removeDecorator(entryPointNode, ANNOTATION_ENTRY_POINT_CLASS)
    }

    function injectAutowiredEverywhere(rootNode, context){
        function getBeanId(beanName){
            let beanId = beans.indexOf(beanName);
            if(beanId < 0)
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
                        removeDecorator(member, ANNOTATION_AUTOWIRED)
                    }
                }
            }
        }, context)
    }

    var transformer = function (context) {
        


        var visitor = function (node) {
            if (node.kind === ts.SyntaxKind.ClassDeclaration) {
                let className = node.name.escapedText;
                // if(className == APP_CLASS_NAME)
                //     appClassNode = node;
                // else 
                if(isNodeHasDecorator(node, ANNOTATION_ENTRY_POINT_CLASS)){
                    // entryPointClassNodes.push(node);
                    configureEntryPointClass(node)
                }else if(isClassImplementsInterface(node, COMPONENT_INTERFACE_NAME) && isNodeHasDecorator(node, ANNOTATION_REACTIVE_CLASS)){
                    components[className] = node;
                    configureComponentInitProperty(node);
                }
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
                        name == ANNOTATION_REACTIVE_CLASS){
                        node.kind = -1;
                        return;
                    }
                }
                return ts.visitEachChild(node, visitor, context);
            }
        };
        return function (node) { 
            // if(node.fileName && node.fileName.endsWith('Login.ts'))
                return ts.visitNode(node, visitor); 
            // else null;
        };
    };

    return transformer;
}

module.exports = {
    Plastique: Plastique,
    CompilePlugin: function(){
        return new webpack.ProvidePlugin({
            '__extends': path.join(__dirname, './compileUtils', 'extends.ts'),
            '__decorate': path.join(__dirname, './compileUtils', 'decorate.ts'),
            '__assign': path.join(__dirname, './compileUtils', 'assign.ts')
        })
    }
}