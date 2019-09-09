const OUTPUT_DIR = __dirname + "/target";
const VUE_TEMPLATES_DIR = "templates";
const VUE_TEMPLATES_JS_FILE_NAME = "templates";

//---------------------------------------------------------------------------------------------------------------------

const VUE_SCRIPT_DIALECT_URL = 'http://www.protei.ru/vuescript/dialect';
const I18N_METHOD = 'I18N.text';

// --------------------------------------------------------------------------------------------------------------------


var glob = require('glob');
var fs = require('fs');
let webpack = require("webpack");
let path = require("path");
const pug = require('pug');
const vueCompiler = require('vue-template-compiler');
const { JSDOM } = require('jsdom');


function addSemanticUiPrefix(element) {
    if(element)
}


debugger;
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


        function handleAttr(elem, attr){
            if(!attr.name.startsWith(prefix +':'))
                return;
            var attrName = attr.name.substr(prefix.length + 1);
            switch(attrName){
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
                        `<component :is="${componentVar}.$.cn" :key="${componentVar}.$.id" v-bind:m="$convComp(${componentVar})"></component>`
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
            }else if(attrName.startsWith('on'))
                elem.setAttribute('v-on:'+ attrName.substr(2), extractExpression(attrVal));
            else
                elem.setAttribute('v-bind:'+ attrName, extractExpression(attrVal));
        }

        //var vueJs = require('vue');
    }
}


var ts = require("typescript");
var transformer = function (context) {
    var visitor = function (node) {
        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            let reactMembers = [];
            let watchMembers = [];
            members: for(let member of node.members)
                if(member.decorators){
                    for(let decorator of member.decorators){
                        if(decorator.expression.escapedText == 'React' || decorator.expression.escapedText == 'Watch'){
                            member.decorators = undefined;
                            if(decorator.expression.escapedText == 'React')
                                reactMembers.push(member.name.text)
                            else if(decorator.expression.escapedText == 'Watch')
                                watchMembers.push(member.name.text)
                            continue members;
                        }
                    }
                }
            if(node.decorators && node.decorators.find(d => d.expression.expression.escapedText == 'Component') != null){
                let vueProps = reactMembers.join(',') +';'+ watchMembers.join(',');
                node.members.push(
                    ts.createProperty(
                        undefined,
                        [ts.createModifier(ts.SyntaxKind.PublicKeyword)],
                        ts.createIdentifier('_vue'),
                        undefined,
                        ts.createKeywordTypeNode(ts.SyntaxKind.StringLiteral),
                        ts.createLiteral(vueProps)
                    )
                );
            }
        }
        return ts.visitEachChild(node, visitor, context);
    };
    return function (node) { return ts.visitNode(node, visitor); };
};

module.exports = {
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        rules: [
            {
                // Set up ts-loader for .ts/.tsx files and exclude any imports from node_modules.
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    getCustomTransformers: (program) => ({
                        before: [transformer]
                    })
                }
            }
        ]
    },
    entry: {
        'test': './test.ts',
        // 'appPlan': './appPlan.ts',
        // 'appSprint': './appSprint.ts',
        // 'appAuth': './appAuth.ts'
    },
    plugins:[
        new webpack.ProvidePlugin({
            '__extends': path.join(__dirname, './compileUtils', 'extends.ts'),
            '__decorate': path.join(__dirname, './compileUtils', 'decorate.ts'),
            '__assign': path.join(__dirname, './compileUtils', 'assign.ts')
        })
    ],
    output: {
        filename: '[name].js',
        path: OUTPUT_DIR
    },
    optimization: {
        // We no not want to minimize our code.
        minimize: false
        // minimize: true
    },
};