import EventTransformer from "./EventTransformer";
import ClassNode from "./node/ClassNode";
import FunctionCallStatement from "./node/FunctionCallStatement";
import IdentifierNode from "./node/statement/IdentifierNode";
import ExpressionNode from "./node/ExpressionNode";

export default class ListenerTransformer {
    static readonly ANNOTATION_LISTENER = 'Listener';

    constructor(
        protected readonly events: EventTransformer
    ){}


    transform(clazz: ClassNode){
        let methods = clazz.getMethods().filter(it => it.hasDecorator(ListenerTransformer.ANNOTATION_LISTENER))
        if(methods.length == 0)
            return;

        let methodNameToEventId = methods.map(method => {
            let args = method.getDecorator(ListenerTransformer.ANNOTATION_LISTENER).getArguments()
            if(args.length == 0)
                throw new Error('Listener has no arguments');

            method.removeDecorator(ListenerTransformer.ANNOTATION_LISTENER)


        });

        let isStaticInit = clazz.hasDecorator('EntryPoint') //TODO
        let initCall = isStaticInit?
            FunctionCallStatement.ofSuper('addListeners', [ExpressionNode.of(methodNameToEventId), ExpressionNode.createThis()])
            :
            FunctionCallStatement.of(IdentifierNode.of('_app'), 'listeners', [ExpressionNode.of(methodNameToEventId), ExpressionNode.createThis()])


        clazz.getOrCreateConstructor().addStatementToBottom(initCall)
    }
}