import ClassNode from "./node/ClassNode";
import FunctionParameterNode from "./node/FunctionParameterNode";
import TsType from "./node/TsType";

class RegExpUtil{
    static removeNamedGroups(regexp: string): string{
        return regexp.replace(/(?<!\\)\(\?<.+?>/g, '(');
    }

    static removeModifier(regexp: string, modifier: string): string{
        let endOfRegexpPos = regexp.lastIndexOf('/');
        return regexp.substr(0, endOfRegexpPos) + regexp.substr(endOfRegexpPos).replace(modifier,'');
    }
}

export default class RoutingDecorator{
    private static readonly ANNOTATION_REQUEST_MAPPING = 'RequestMapping';
    private static readonly GROUP_IN_REGEXP = /(?<!\\)\(/g;
    private static readonly NAMED_GROUP_IN_REGEXP = /\(?<(.+?)>/;
    private static readonly JS_VARIABLE = /^\w[\w\d]*$/;

    constructor(node: ClassNode) {
        node.getMethods().forEach(it => {
            if(!it.hasDecorator(RoutingDecorator.ANNOTATION_REQUEST_MAPPING))
                return;
            let mappingArgs = it.getDecorator(RoutingDecorator.ANNOTATION_REQUEST_MAPPING).getArguments()
            if(mappingArgs.length != 1)
                throw new Error(`Invalid request mapping arguments for ${node}.${it.getName()}`)
            let pattern = mappingArgs[0]
            if(pattern.isRegExp()){
                this.requireStringParameters(it.getParameters())
                let patternText: string = pattern.getRaw().text //TODO
            }
        })
    }

    private requireStringParameters(params: FunctionParameterNode[]): void{
        let illegalParam = params.find(p =>
            p.isVarArg()
            || p.getRaw().type == null  //TODO
            || p.getRaw().kind == null
            || p.getRaw().type.kind != TsType.STRING_LITERAL.getId()
        );
        if(illegalParam)
            throw new Error(`Parameter '${illegalParam.getName()}' must be a string!`);
    }

    private checkPatternVariables(patternText: string, params: FunctionParameterNode[]): void{
        let paramsNames = params.map(it => it.getName());

        let argsIndices = [];
        for(
            let groupIndex = 1, groupMatch = null;
            (groupMatch = RoutingDecorator.GROUP_IN_REGEXP.exec(patternText)) != null;
            groupIndex++
        ){
            let matchPos = groupMatch.index;
            let namedGroupMatch = patternText.substr(matchPos).match(RoutingDecorator.NAMED_GROUP_IN_REGEXP)
            if(namedGroupMatch && namedGroupMatch.index == 2){
                let variableId = namedGroupMatch[1];
                if(!RoutingDecorator.JS_VARIABLE.test(variableId))
                    throw new Error(`Named group "${variableId}" is not valid!`)

                if(paramsNames.includes(variableId)){
                    let paramPos = paramsNames.indexOf(variableId);
                    paramsNames[paramPos] = null
                    argsIndices[paramPos] = groupIndex;
                }
            }
        }

        paramsNames.forEach(p => {
            if(p !== null)
                throw new Error(`Parameter '${p}' is not found in the request method pattern!`)
        });


        let simplePattern = RegExpUtil.removeNamedGroups(patternText)
        let patternWithoutGlobal = RegExpUtil.removeModifier(simplePattern, 'g')

    }



}

function getMapperConfiguration(node){
    let mappers = [];
    if(node.members){
        for(let member of node.members){
            if(member.kind == ts.SyntaxKind.MethodDeclaration){
                let patternArg = getDecoratorArguments(member, ANNOTATION_REQUEST_MAPPING, true);
                if(patternArg != null){
                    patternArg = patternArg[0]; //first argument

                    let methodName = member.name.escapedText;
                    if(patternArg.kind == ts.SyntaxKind.RegularExpressionLiteral){
                        let pattern = patternArg.text;
                        checkStringParameters(member.parameters, methodName);
                        let methodParameters = member.parameters.map(p => p.name.escapedText);
                        let argsIndices = [];

                        if(methodParameters.length > 0){
                            let groupSearcher = /(?<!\\)\(/g;
                            let result;
                            let groupIndex = 1;
                            while ((result = groupSearcher.exec(pattern)) !== null) {
                                let namedGroup = pattern.substr(result.index).match()
                                if(namedGroup && namedGroup.index == 2){
                                    let variableId = namedGroup[1];
                                    if(/^\w[\w\d]*$/.test(variableId) == false)
                                        throw new Error(`Named group "${variableId}" is not valid!`)

                                    if(methodParameters.includes(variableId)){
                                        let paramPos = methodParameters.indexOf(variableId);
                                        methodParameters.splice(paramPos, 1, void 0);
                                        argsIndices[paramPos] = ts.createNumericLiteral(String(groupIndex));
                                    }
                                }

                                groupIndex++;
                            }

                            let undefinedVariableId = methodParameters.find(p => p !== void 0);
                            if(undefinedVariableId)
                                throw new Error(`Parameter '${undefinedVariableId}' is not found in the request method pattern (${memberName})!`)
                        }

                        pattern = pattern.replace(/(?<!\\)\(\?<.+?>/g, '('); //remove all named groups
                        let endOfRegexpPos = pattern.lastIndexOf('/');
                        pattern = pattern.substr(0, endOfRegexpPos) + pattern.substr(endOfRegexpPos).replace('g',''); //remove 'g' modifier

                        let isArgsIndecesConsistent = argsIndices.find((e, i) => (+e.text) != (i+1)) === void 0
                        if(argsIndices.length > 0 && !isArgsIndecesConsistent)
                            mappers.push(ts.createArrayLiteral([
                                ts.createRegularExpressionLiteral(pattern),
                                ts.createLiteral(methodName),
                                ts.createArrayLiteral(argsIndices)
                            ]));
                        else
                            mappers.push(ts.createArrayLiteral([
                                ts.createRegularExpressionLiteral(pattern),
                                ts.createLiteral(methodName)
                            ]));
                    }else{
                        mappers.push(ts.createArrayLiteral([
                            ts.createLiteral(patternArg.text),
                            ts.createLiteral(methodName)
                        ]));
                    }

                    removeDecorator(member, ANNOTATION_REQUEST_MAPPING)
                }
            }
        }
    }
    return mappers;
}