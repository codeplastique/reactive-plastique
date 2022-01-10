import ClassNode from "./node/ClassNode";
import ClassPropertyNode from "./node/ClassPropertyNode";
import TsModifier from "./node/TsModifier";
import ExpressionNode from "./node/ExpressionNode";
import IdentifierNode from "./node/statement/IdentifierNode";
import RoutingDecorator from "./RoutingDecorator";
import ClassDecorator from "./ClassDecorator";
import ComponentDecorator from "./ComponentDecorator";

export default class EntryPointDecorator extends ComponentDecorator{
    private static readonly ANNOTATION_BEANS = 'Beans';
    private static readonly ANNOTATION_ENTRY_POINT_CLASS = 'EntryPoint';

    constructor(node: ClassNode) {
        super(node)
        if(!node.hasDecorator(EntryPointDecorator.ANNOTATION_ENTRY_POINT_CLASS))
            throw new Error(`Node ${node} is not entry point!`)

        const constructor = node.getConstructor()
        let domElemArg = constructor.getSuperCall().getArguments().shift();
        constructor.addStatementToBottom(
            IdentifierNode.of("_super").createFunctionCallStatement(
                "attachComponent",
                [domElemArg, ExpressionNode.createThis()]
            )
        )

        // if(!FragmentSet.isEmpty()) {
        //     constructorNode.body.statements.push(
        //         ts.createExpressionStatement(
        //             ts.createCall(
        //                 ts.createPropertyAccess(
        //                     ts.createIdentifier('_super'),
        //                     ts.createIdentifier("initFragments")
        //                 ),
        //                 null,
        //                 [ts.createIdentifier(VUE_FRAGMENTS_OBJ_NAME)]
        //             )
        //         )
        //     )
        // }

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

        constructor.addStatementToBottom(makeEntryPointGlobalStatement)

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

            constructor.addStatementToBottom(
                IdentifierNode.of('_app').createFunctionCallStatement(
                    "routing",
                    [[ExpressionNode.createThis()]]
                )
            )
        }

        node.removeDecorator(EntryPointDecorator.ANNOTATION_ENTRY_POINT_CLASS)
    }
}