import FunctionCallStatement from "./node/FunctionCallStatement";
import InterfaceDecorator from "./InterfaceDecorator";
import {check} from "./checkFunc";
import ExpressionNode from "./node/ExpressionNode";
import ClassNode from "./node/ClassNode";
import InterfaceNode from "./node/InterfaceNode";

export default class TypeDecorator{
    private static readonly TYPE_FUNCTION = "Type"
    static interfaceDecorator: InterfaceDecorator;

    constructor(clazz: ClassNode, node: FunctionCallStatement){
        if(node.getName() == TypeDecorator.TYPE_FUNCTION){
            if(node.getArguments().length == 0){
                let types = node.getGenericTypes()
                check(types.length == 1, "Function Type required generic type or argument")

                let i = clazz.getFile().getImportClass(types[0].getName()) as InterfaceNode
                let counter = TypeDecorator.interfaceDecorator.add(i)
                node.getArguments().push(
                    ExpressionNode.of(counter)
                )
            }
        }
    }
}