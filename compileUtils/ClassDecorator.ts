import ClassNode from "./node/ClassNode";
import IdentifierNode from "./node/statement/IdentifierNode";
import ExpressionNode from "./node/ExpressionNode";
import IocContainer from "./IocContainer";
import InterfaceDecorator from "./InterfaceDecorator";
import TsModifier from "./node/TsModifier";
import ClassPropertyNode from "./node/ClassPropertyNode";

export default class ClassDecorator{
    private static readonly ANNOTATION_AUTOWIRED = 'Autowired';
    private static readonly EVENTER_CLASS_NAME = 'Eventer';
    private static interfaceDecorator: InterfaceDecorator

    constructor(node: ClassNode) {
        try {
            node.getFields().forEach(field => {
                if(field.retrieveDecorator(ClassDecorator.ANNOTATION_AUTOWIRED) == null)
                    return;

                let beanId = IocContainer.getBeanId(node);
                let callArgs = field.getType().getName() == ClassDecorator.EVENTER_CLASS_NAME?
                    [ExpressionNode.createNumber(beanId), ExpressionNode.createThis()]
                    :
                    [ExpressionNode.createNumber(beanId)]

                field.setValue(
                    IdentifierNode.of("_app").createFunctionCallStatement("bean", callArgs)
                )
            })

            let interfaceMask = ClassDecorator.interfaceDecorator.getIdsIfExists(node.getAllInterfaces())
            if(interfaceMask.length > 0){
                node.addField(ClassPropertyNode.create(
                    TsModifier.STATIC,
                    "$intf",
                    ExpressionNode.of(interfaceMask)
                ))
            }
        }catch (e){
            console.error(e);
            throw new Error("Illegal autowired declaration!")
        }
    }
}