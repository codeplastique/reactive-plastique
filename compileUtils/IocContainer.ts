import ClassNode from "./node/ClassNode";
import {check} from "./checkFunc";

export default class IocContainer{
    private static readonly EVENTER_CLASS_NAME = 'Eventer';
    private static readonly  ANNOTATION_SCOPE = 'Scope';
    private static readonly  ANNOTATION_BEAN = 'Bean';


    private static counter = 0;
    private static beanToId: {[name: string]: number} = (() => {
        let result = {}
        result[IocContainer.EVENTER_CLASS_NAME] = IocContainer.counter++
        return result
    })()



    static getBeanId(node: ClassNode): number {
        if(entryPointsNames.includes(beanName))
            return -1;
        let beanId = this.beanToId[node.getFile().getPath()];
        if(beanId === undefined)
            throw new Error('Bean '+ node.getName() +' is not initialized!')
        return beanId;
    }


    static initializeBeans(node: ClassNode){
        node.getMethods().forEach(m => {
            if(m.retrieveDecorator(IocContainer.ANNOTATION_BEAN) == null)
                return;

            if(m.getReturnType() == null)
                throw new Error(`Method ${node}.${m} is not typed!`)
            if(m.getParameters().length != 0)
                throw new Error(`Method ${node}.${m} should not have parameters`)

            const returnTypePath = node.getFile().getPath()

            let scope = m.retrieveDecorator(IocContainer.ANNOTATION_SCOPE)
            let isPrototype = false
            if(scope){
                check(scope.getArguments().length == 1, `Scope of method ${node}.${m} must have only 1 argument`)
                isPrototype = scope.getArguments()[0].asString() == 'PROTOTYPE'
            }

            if(this.beanToId[returnTypePath] !== undefined)
                throw new Error(`Bean with type ${returnTypePath} is initialized twice!`)

            this.beanToId[returnTypePath] = this.counter++;

            // let beanKey = beanId +';'+ typeName + (isPrototype? ';1': '');
            // beansDeclarations[beanKey] = member.name.escapedText;
            // cleanMemberCache(member);
        })
    }

    static getBeansDeclarations(node: ClassNode, beansOfEntryPoint){
        let beansDeclarations = {};
        for(let member of beanClass.members){
            if(member.kind == ts.SyntaxKind.MethodDeclaration && isNodeHasDecorator(member, ANNOTATION_BEAN)){
                if(member.type.typeName == null)
                    throw new Error('Method '+ member.name.escapedText +' is not typed!')
                if(member.parameters && member.parameters.length != 0)
                    throw new Error('Method '+ member.name.escapedText +' should not have parameters')
                // beansDeclarations[member.type.typeName.escapedText] = member.name.escapedText;

                let isPrototype
                if(isNodeHasDecorator(member, ANNOTATION_SCOPE)) {
                    let scope = getDecoratorArguments(member, ANNOTATION_SCOPE, true)
                    isPrototype = scope[0].text === 'PROTOTYPE';
                    removeDecorator(member, ANNOTATION_SCOPE);
                }

                let typeName = member.type.typeName.escapedText

                let beanId = beanToId[typeName];
                if(beanId === undefined){
                    beanId = beanCounter;
                    beanToId[typeName] = beanCounter;
                    beanCounter++;
                    if(beansOfEntryPoint)
                        beansOfEntryPoint.push(typeName);
                }else if(beansOfEntryPoint && beansOfEntryPoint.includes(typeName)){
                    throw new Error(`Bean with type ${typeName} is initialized twice!`)
                }

                let beanKey = beanId +';'+ typeName + (isPrototype? ';1': '');
                beansDeclarations[beanKey] = member.name.escapedText;
                removeDecorator(member, ANNOTATION_BEAN);
                cleanMemberCache(member);
            }
        }
        return beansDeclarations;
    }
}
