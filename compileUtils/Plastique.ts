import Context from "./node/Context";
import TsFileRef from "./node/TsFileRef";
import EntryPointDecorator from "./EntryPointDecorator";

export default class Plastique{
    private isInitialized: boolean
    private workFiles: ReadonlyArray<TsFile>

    constructor(context: any) {
        /// @ts-ignore
        Context.context = context;

    }

    visit(): void{
        return (node) =>  {
            try{
                if(!isInitialized){
                    this.initialize()
                }
                if(!files.includes(node.fileName)) {
                    let result = ts.visitNode(node, visitor);
                    files.push(node.fileName)
                    return result
                }
                // let notInitEvent = eventToIdentifier.find(e => e.init == false);
                // if(notInitEvent)
                //     throw new Error('Event "'+ (notInitEvent.className +"."+ notInitEvent.memberName) +" is not found!")

                return node;
            }catch(e){
                console.error(e);
                process.exit(1)
            }
        };
    }


    initialize(): void {
        let plastiqueLibPathPrefix = Context.getLibraryDirectory() + '@plastique/'
        this.workFiles = Context.getSourceFiles().filter(f => {
            return !f.isDefaultLib() && !f.getPath().startsWith(plastiqueLibPathPrefix)
        })

        for(let file of this.workFiles){
            let importModules = file.getImportsModules()
            if(importModules.length == 0)
                continue;

            let hasEntryPointImport = importModules.some(m =>
                !m.isLibraryModule() && m.getPath().endsWith(EntryPointDecorator.ENTRYPOINT_ANNOTATION_PATH)
            )
            if(hasEntryPointImport){
                let classesNodes = file.getClassesNodes()
                if(classesNodes.length > 0){
                    let hasEntryPointClass = classesNodes.some(c => EntryPointDecorator.isEntryPointNode(c))
                    if(hasEntryPointClass){
                        if(entryPointClassPath)
                            console.error('EntryPoint is already defined: '+ entryPointClassPath)
                        entryPointClassPath = file.fileName;
                        configureEntryPointClass(entryPoint, context)
                    }
                }
            }


            if(file.resolvedModules){

                //check if entry point is single
                //add class to entry points

                let importModules = Array.from(file.resolvedModules.values()).filter(m => m != void 0); //remove invalid modules

                let hasEntryPoint = importModules.find(m => m.isExternalLibraryImport && m.originalFileName.endsWith(ENTRYPOINT_ANNOTATION_PATH));
                if(hasEntryPoint){
                    let entryPoint = file.statements.find(s => s.kind == ts.SyntaxKind.ClassDeclaration && isEntryPointNode(s));
                    if(entryPoint){
                        if(entryPointClassPath)
                            console.error('EntryPoint is already defined: '+ entryPointClassPath)
                        entryPointClassPath = file.fileName;
                        configureEntryPointClass(entryPoint, context)
                    }
                }

                // handle fragment

                const isFragmentUsed = importModules.some(m => m.isExternalLibraryImport && m.originalFileName.endsWith(FRAGMENT_TYPE_PATH));
                if(isFragmentUsed)
                    handleFragmentNode(file);

                // handle other
                let hasTypeUsage = importModules.find(m => m.isExternalLibraryImport && m.originalFileName.endsWith(TYPE_CLASS_PATH));
                let hasComponentUsage = importModules.find(m => m.isExternalLibraryImport && m.originalFileName.endsWith(COMPONENT_INTERFACE_PATH));
                let hasVirtualComponentUsage = importModules.find(m => m.isExternalLibraryImport && m.originalFileName.endsWith(VIRTUAL_COMPONENT_ANNOTATION_PATH));
                if(hasTypeUsage || hasComponentUsage || hasVirtualComponentUsage){
                    ts.visitNode(file, vis);
                }
            }
        }
    }

    initializeTEST(): void{
        let host = context.getEmitHost();
        let basePath = host.getCommonSourceDirectory();

        let libPath = basePath + 'node_modules/';
        const workNodes = host.getSourceFiles().filter(f =>
            !f.hasNoDefaultLib
            &&
            !host.isSourceFileFromExternalLibrary(f)
            &&
            !f.fileName.startsWith(libPath +'typescript/')
            &&
            !f.fileName.startsWith(libPath +'@plastique/')
        );
        let vis = function (node) {
            componentExpr: if(node.kind == ts.SyntaxKind.SourceFile){

                // append Component mixin


                let interfaceDeclaration =
                    node.statements.find(s => s.kind === ts.SyntaxKind.InterfaceDeclaration && isImplementsInterface(context, s, 'Component'));
                if(interfaceDeclaration == null)
                    break componentExpr;
                let className = interfaceDeclaration.name.escapedText;
                let classIndex = node.statements.findIndex(s => s.kind === ts.SyntaxKind.ClassDeclaration && s.name.escapedText == className);
                if(classIndex < 0){
                    //its just interface, not component
                    break componentExpr;

                }
                //append after class declaration
                node.statements.splice(classIndex + 1, 0, ts.createCall(
                    ts.createPropertyAccess(
                        ts.createIdentifier('_app'),
                        ts.createIdentifier('mixin')
                    ),
                    undefined, // type arguments, e.g. Foo<T>()
                    [
                        ts.createIdentifier(className),
                    ]
                ));
            }
            if(node.kind == ts.SyntaxKind.ClassDeclaration){
                // init marker fields


                if(isComponentNode(node)){
                    let className = node.name.escapedText;
                    for(let member of node.members){
                        if(member.kind == ts.SyntaxKind.PropertyDeclaration){
                            if(isNodeHasDecorator(member, ANNOTATION_INIT_VIRTUAL_COMPONENT)){
                                // removeDecorator(member, ANNOTATION_INIT_VIRTUAL_COMPONENT);
                                let neededModifiers = (member.modifiers || [])
                                    .filter(m => (m.kind == ts.SyntaxKind.ReadonlyKeyword) || (m.kind == ts.SyntaxKind.StaticKeyword));
                                let memberName = member.name.escapedText;
                                if(neededModifiers.length == 2){
                                    MemberInitializator.initialize(node, member, VIRTUAL_COMPONENT_CLASS_NAME, VirtualComponents)
                                }else
                                    throw new Error(`Event "${className}.${memberName}" should be be a static & readonly`)
                            }
                        }
                    }
                }
            }
            typeExpr: if(node.kind == ts.SyntaxKind.CallExpression && node.expression.escapedText == TYPE_CLASS_NAME){
                // add interface mask

                if(node.arguments != null && node.arguments.length == 1){
                    if(node.typeArguments != null && node.typeArguments.length > 0)
                        throw new Error('Type should be with generic type or argument type but not both!')
                    break typeExpr;
                }
                if(node.typeArguments == null || node.typeArguments.length == 0)
                    throw new Error('Generic type of Type is not set!')
                if(node.typeArguments[0].typeName == null)
                    throw new Error('Generic type of Type is not valid: '+ node.typeArguments)

                let typeName = node.typeArguments[0].typeName.escapedText;
                let typePath = getNodePath(node, typeName);
                if(typePath){
                    let classOrInterface = getClassByPath(typePath, typeName, context);
                    if(classOrInterface){
                        if(classOrInterface.kind == ts.SyntaxKind.ClassDeclaration) {
                            throw new Error(`Generic type ${typeName} is not interface!`);
                        }else{
                            Interfaces.add(typePath);
                            // getInterfacesDeep(classOrInterface, context).concat(typePath).forEach(path => Interfaces.add(path))
                        }
                    }else
                        throw new Error(`Type ${typeName} is not recognized!`);
                }
            }
            return ts.visitEachChild(node, vis, context);
        }



        workFilesPaths = workNodes.map(n => n.fileName);
        for(let node of workNodes){
            if(node.resolvedModules){
                let importModules = Array.from(node.resolvedModules.values()).filter(m => m != void 0); //remove invalid modules

                let hasEntryPoint = importModules.find(m => m.isExternalLibraryImport && m.originalFileName.endsWith(ENTRYPOINT_ANNOTATION_PATH));
                if(hasEntryPoint){
                    let entryPoint = node.statements.find(s => s.kind == ts.SyntaxKind.ClassDeclaration && isEntryPointNode(s));
                    if(entryPoint){
                        if(entryPointClassPath)
                            console.error('EntryPoint is already defined: '+ entryPointClassPath)
                        entryPointClassPath = node.fileName;
                        configureEntryPointClass(entryPoint, context)
                    }
                }

                const isFragmentUsed = importModules.some(m => m.isExternalLibraryImport && m.originalFileName.endsWith(FRAGMENT_TYPE_PATH));
                if(isFragmentUsed)
                    handleFragmentNode(node);

                let hasTypeUsage = importModules.find(m => m.isExternalLibraryImport && m.originalFileName.endsWith(TYPE_CLASS_PATH));
                let hasComponentUsage = importModules.find(m => m.isExternalLibraryImport && m.originalFileName.endsWith(COMPONENT_INTERFACE_PATH));
                let hasVirtualComponentUsage = importModules.find(m => m.isExternalLibraryImport && m.originalFileName.endsWith(VIRTUAL_COMPONENT_ANNOTATION_PATH));
                if(hasTypeUsage || hasComponentUsage || hasVirtualComponentUsage){
                    ts.visitNode(node, vis);
                }
            }
        }


        this.isInitialized = true;
    }
}
