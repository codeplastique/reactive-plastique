import ClassNode from "./node/ClassNode";
import IdentifierNode from "./node/statement/IdentifierNode";
import ExpressionNode from "./node/ExpressionNode";
import IocContainer from "./IocContainer";

export default class ClassDecorator{
    private static readonly ANNOTATION_AUTOWIRED = 'Autowired';
    private static readonly EVENTER_CLASS_NAME = 'Eventer';

    constructor(node: ClassNode) {
        try {
            node.getFields().forEach(field => {
                if(!field.hasDecorator(ClassDecorator.ANNOTATION_AUTOWIRED))
                    return;

                let beanId = IocContainer.getBeanId(node);
                let callArgs = field.getType().getName() == ClassDecorator.EVENTER_CLASS_NAME?
                    [ExpressionNode.createNumber(beanId), ExpressionNode.createThis()]
                    :
                    [ExpressionNode.createNumber(beanId)]

                field.setValue(
                    IdentifierNode.of("_app").createFunctionCallStatement("bean", callArgs)
                )
                field.removeDecorator(ClassDecorator.ANNOTATION_AUTOWIRED)
            })
        }catch (e){
            console.error(e);
            throw new Error("Illegal autowired declaration!")
        }
    }
}