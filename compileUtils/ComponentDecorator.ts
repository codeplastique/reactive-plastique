import ClassDecorator from "./ClassDecorator";
import ClassNode from "./node/ClassNode";
import ConstructorNode from "./node/ConstructorNode";
import ClassPropertyNode from "./node/ClassPropertyNode";
import ClassMethodNode from "./node/ClassMethodNode";

export default class ComponentDecorator extends ClassDecorator{
    private static readonly ANNOTATION_INIT_VIRTUAL_COMPONENT = 'InitMarker';
    private static readonly ANNOTATION_ELEMENT = 'Inject';
    private static readonly ANNOTATION_IGNORE_FIELD_INIT = 'IgnoreInit';
    private static readonly ANNOTATION_AFTERATTACH = 'AfterAttach';
    private static readonly ANNOTATION_BEFOREDETACH = 'BeforeDetach';

    constructor(node: ClassNode){
        super(node);
        const className = node.getName()
        const parents = node.getAllParents()
        const parentsFields = parents.flatMap(c => c.getFields())

        let constructor = node.getOrCreateConstructor();
        let propsElems: string[] = []
        node.getFields().forEach(f => {
            if(f.hasDecorator(ComponentDecorator.ANNOTATION_INIT_VIRTUAL_COMPONENT)){
                f.setValue(MemberInitializator.getInitializer(member))
                f.removeDecorator(ComponentDecorator.ANNOTATION_INIT_VIRTUAL_COMPONENT)

            }else if(f.hasDecorator(ComponentDecorator.ANNOTATION_ELEMENT)){
                propsElems.push(f.getName())
                f.removeDecorator(ComponentDecorator.ANNOTATION_ELEMENT)

            }else {
                if(f.hasDecorator(ComponentDecorator.ANNOTATION_IGNORE_FIELD_INIT)){
                    f.removeDecorator(ComponentDecorator.ANNOTATION_IGNORE_FIELD_INIT)

                }else if(
                    f.getValue() == null
                    && !parentsFields.some(pf => pf.equals(f))
                    && !this.hasPropertyAssignmentInConstructor(constructor, f)
                ){
                    f.setValue(null)
                }

            }
        })


        let attachHook: ClassMethodNode;
        let detachHook: ClassMethodNode;


        node.getMethods().forEach(m => {
            if(!attachHook && m.hasDecorator(ComponentDecorator.ANNOTATION_AFTERATTACH)){
                attachHook = m;
                if(componentRoot.attachHook){
                    member.body.statements.unshift(
                        ts.createExpressionStatement(ts.createCall(ts.createPropertyAccess(ts.createSuper(), ts.createIdentifier(componentRoot.attachHook))))
                    );
                }
                m.removeDecorator(ComponentDecorator.ANNOTATION_AFTERATTACH)
            }
            if(!detachHook && m.hasDecorator(ComponentDecorator.ANNOTATION_BEFOREDETACH)){
                detachHook = m;
                if(componentRoot.detachHook){
                    member.body.statements.unshift(
                        ts.createExpressionStatement(ts.createCall(ts.createPropertyAccess(ts.createSuper(), ts.createIdentifier(componentRoot.detachHook))))
                    );
                }
                m.removeDecorator(ComponentDecorator.ANNOTATION_BEFOREDETACH)
            }
        })


    }

    private hasPropertyAssignmentInConstructor(node: ConstructorNode, property: ClassPropertyNode): boolean{

    }


    function configureComponent(componentNode, context){
        let componentName = componentNode.name.escapedText;
        let template = getComponentTemplateAndPropsVar(componentNode);
        let componentRoot = getAllRootComponentsData(componentNode, context);
        // let parent = getParentClass(componentNode, context);
        // if(parent)
        // configureComponent(parent);

        let onchangeMethods = {};
        let elementProps = [];
        let attachHook = null;
        let detachHook = null;
        let constructorNode = getOrCreateConstructor(componentNode);
        if(isEntryPointNode(componentNode)){
            let superStatement = getSuperNode(constructorNode);
            let elementArgument = superStatement.expression.arguments.shift();

            if(!FragmentSet.isEmpty()) {
                constructorNode.body.statements.push(
                    ts.createExpressionStatement(
                        ts.createCall(
                            ts.createPropertyAccess(
                                ts.createIdentifier('_super'),
                                ts.createIdentifier("initFragments")
                            ),
                            null,
                            [ts.createIdentifier(VUE_FRAGMENTS_OBJ_NAME)]
                        )
                    )
                )
            }
            constructorNode.body.statements.push(
                ts.createExpressionStatement(
                    ts.createCall(
                        ts.createPropertyAccess(
                            ts.createIdentifier('_super'),
                            "attachComponent"),
                        null,
                        [elementArgument, ts.createThis()]
                    )
                )
            )

        }
        if(componentNode.members){
            for(let member of componentNode.members){
                if(member.kind == ts.SyntaxKind.PropertyDeclaration){
                    let memberName = member.name.escapedText;


                    let isElementProp = isNodeHasDecorator(member, ANNOTATION_ELEMENT);
                    if(isElementProp){
                        elementProps.push(memberName);
                        removeDecorator(member, ANNOTATION_ELEMENT);
                    }else{
                        if(isNodeHasDecorator(member, ANNOTATION_IGNORE_FIELD_INIT)){
                            removeDecorator(member, ANNOTATION_IGNORE_FIELD_INIT);

                        }else if(member.initializer == null
                            && !componentRoot.members.includes(memberName)
                            && !hasPropertyAssignmentInConstructor(constructorNode, member)
                        ){
                            member.initializer = ts.createNull();
                        }
                    }
                    let methodName = getDecoratorArgumentMethodName(member, ANNOTATION_ONCHANGE, true);
                    if(methodName != null){
                        onchangeMethods[member.name.escapedText] = methodName;
                        removeDecorator(member, ANNOTATION_ONCHANGE);
                    }
                }else if(member.kind == ts.SyntaxKind.MethodDeclaration){
                    let methodName = member.name.escapedText;
                    if(!attachHook && isNodeHasDecorator(member, ANNOTATION_AFTERATTACH)){
                        attachHook = methodName;
                        if(componentRoot.attachHook){
                            member.body.statements.unshift(
                                ts.createExpressionStatement(ts.createCall(ts.createPropertyAccess(ts.createSuper(), ts.createIdentifier(componentRoot.attachHook))))
                            );
                        }
                        removeDecorator(member, ANNOTATION_AFTERATTACH);
                    }
                    if(!detachHook && isNodeHasDecorator(member, ANNOTATION_BEFOREDETACH)){
                        detachHook = methodName;
                        if(componentRoot.detachHook){
                            member.body.statements.unshift(
                                ts.createExpressionStatement(ts.createCall(ts.createPropertyAccess(ts.createSuper(), ts.createIdentifier(componentRoot.detachHook))))
                            );
                        }
                        removeDecorator(member, ANNOTATION_BEFOREDETACH);
                    }
                }
            }
        }
        let configuration = {
            w: onchangeMethods, //onchange methods
            // c: [], //cached methods
            ep: elementProps //element properties
        };
        if(attachHook)
            configuration.ah = attachHook;
        else
            configuration.ah = componentRoot.attachHook
        if(detachHook)
            configuration.dh = detachHook;
        else
            configuration.dh = componentRoot.detachHook

        let renderObj
        let withParentTag
        if(template){
            // configuration.tn = templateName.toUpperCase();
            // let render = getVueTemplateRender(template, componentName);
            // renderObj = ts.createSourceFile("a", `alert(${render})`).statements[0].expression.arguments[0];
            renderObj = ts.createIdentifier(VUE_TEMPLATE_FUNC_NAME);
            let templateRender
            try {
                let templateRenderResult = getComponentTemplateRender(template.template, componentNode, template.props[0]);
                templateRender = templateRenderResult.template
                withParentTag = templateRenderResult.withParentTag;
            }catch (e) {
                console.error('Template component "'+ componentName +'" error!')
                throw e
            }
            // for(let interfaceId of templateRender.virtualComponents){
            //     let interfaceName = Interfaces.getNameById(interfaceId);
            //     if(!isImplementsInterface(context, componentNode, interfaceName, true))
            //         throw new Error('Invalid template virtual component "Type<'+ interfaceName +'>". Component "'+ componentName + '" does not implement interface: '+ interfaceName);
            // }
            componentPathToTemplate[componentNode.parent.fileName] = templateRender;
            // removeDecorator(componentNode, ANNOTATION_TEMPLATE)
        }

        if(isEntryPointNode(componentNode))
            constructorNode.body.statements.unshift(genInitComponentCallExpression(true, componentName, configuration, renderObj, withParentTag));
        else
            constructorNode.body.statements.push(genInitComponentCallExpression(false, componentName, configuration, renderObj, withParentTag));

        removeDecorator(componentNode, ANNOTATION_REACTIVE_CLASS)
        componentsNames.push(componentName);
    }

}