import FunctionCallStatement from "./node/FunctionCallStatement";

export default class TypeDecorator{
    private static readonly TYPE_FUNCTION = "Type"
    constructor(node: FunctionCallStatement){
        // super(node);
        if(node.getName() == TypeDecorator.TYPE_FUNCTION){
            if(node.getArguments().length == 0){

            }
        }


        // else if (node.kind == ts.SyntaxKind.CallExpression
        //     && node.expression.escapedText == TYPE_CLASS_NAME
        //     && (node.arguments == null || node.arguments.length == 0)) {
        //
        //     let typeName = node.typeArguments[0].typeName.escapedText;
        //     let nodePath = getNodePath(node, typeName);
        //     node.arguments = [nodePath ?
        //         ts.createNumericLiteral(String(Interfaces.getId(nodePath)))
        //         :
        //         ts.createIdentifier(typeName)
        //     ];
        //     // }
        //     // else if(node.kind == ts.SyntaxKind.SourceFile){
        //     //     var result = ts.visitEachChild(node, visitor, context);
        //     //     injectAutowiredEverywhere(node, context);
        // }
    }
}