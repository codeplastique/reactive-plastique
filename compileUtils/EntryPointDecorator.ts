import ClassNode from "./node/ClassNode";
import ClassPropertyNode from "./node/ClassPropertyNode";
import TsModifier from "./node/TsModifier";
import ExpressionNode from "./node/ExpressionNode";
import IdentifierNode from "./node/statement/IdentifierNode";
import RoutingDecorator from "./RoutingDecorator";
import ClassDecorator from "./ClassDecorator";

export default class EntryPointDecorator extends ClassDecorator{
    private static readonly ANNOTATION_BEANS = 'Beans';
    private static readonly ANNOTATION_ENTRY_POINT_CLASS = 'EntryPoint';

    constructor(node: ClassNode) {
        super(node)
        if(!node.hasDecorator(EntryPointDecorator.ANNOTATION_ENTRY_POINT_CLASS))
            throw new Error(`Node ${node} is not entry point!`)

        let entryPointName = node.getName()
        let beans = node.findDecorator(EntryPointDecorator.ANNOTATION_BEANS)
        if(beans){
            let beanClasses = beans.getArguments();
            //TODO
            node.addField(ClassPropertyNode.create([TsModifier.STATIC], "$beans", ExpressionNode.createArray([])))
            node.removeDecorator(EntryPointDecorator.ANNOTATION_BEANS)
        }


        let makeEntryPointGlobalStatement = IdentifierNode.of("window")
            .getPropertyIdentifier(entryPointName)
            .createAssignmentStatement(IdentifierNode.of(entryPointName))

        node.getOrCreateConstructor().addStatementToBottom(makeEntryPointGlobalStatement)

        let configurator = {
            name: entryPointName,
            beans: []
        }
        node.addField(ClassPropertyNode.create(
            TsModifier.STATIC,
            '$',
            ExpressionNode.createString(JSON.stringify(configurator))
        ))

        let routes = new RoutingDecorator(node).getRoutes()
        if(routes.length > 0){
            node.addField(ClassPropertyNode.create(
                TsModifier.STATIC,
                'routing$',
                ExpressionNode.createArray(routes)
            ))

            node.getOrCreateConstructor().addStatementToBottom(
                IdentifierNode.of('_app').createFunctionCallStatement(
                    "routing",
                    [[ExpressionNode.createThis()]]
                )
            )
        }

        node.removeDecorator(EntryPointDecorator.ANNOTATION_ENTRY_POINT_CLASS)
    }
}