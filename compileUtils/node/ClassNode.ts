import NameableNode from "./NameableNode";
import TsType from "./TsType";
import ClassPropertyNode from "./ClassPropertyNode";
import ConstructorNode from "./ConstructorNode";
import Decoratable from "./Decoratable";
import DecoratorNode from "./DecoratorNode";
import ClassMethodNode from "./ClassMethodNode";
import TsFile from "./TsFile";
import TsFileRef from "./TsFileRef";
import SyntheticEnumTransformer from "../SyntheticEnumTransformer";

export default class ClassNode extends NameableNode implements Decoratable{
    constructor(node){
        super(node);
    }

    getConstructor(): ConstructorNode{
        for(let member of this.node.members)
            if(member.kind == TsType.CONSTRUCTOR.getId())
                return new ConstructorNode(member);
    }

    getOrCreateConstructor(): ConstructorNode{
        let c = this.getConstructor();
        if(c)
            return c;

        let constructorNode = ts.createConstructor(null, null, null, ts.createBlock([]));
        this.node.members.push(constructorNode);
        if(ts.getClassExtendsHeritageElement(this.node) != null)
            constructorNode.body.statements.push(ts.createExpressionStatement(ts.createCall(ts.createSuper())));
        return new ConstructorNode(constructorNode)
    }

    getFields(): ClassPropertyNode[]{
        return (this.node.members || [])
            .filter(n => n.kind == TsType.CLASS_PROPERTY.getId())
            .map(p => new ClassPropertyNode(p));
    }

    addField(field: ClassPropertyNode): void{
        if(this.node.members == null)
            this.node.members = [];
        this.node.members.push(field);
    }

    getDecorators(): DecoratorNode[] {
        return (this.node.decorators || []).map(d => new DecoratorNode(d));
    }


    hasDecorator(name: string): boolean{
        return this.getDecorators().some(d => d.getName() == name)
    }

    findDecorator(name: string): DecoratorNode | null{
        return this.getDecorators().find(d => d.getName() == name)
    }

    //TODO
    removeDecorator(name: string): void {
        let decorators = this.node.decorators != null? this.node.decorators: [];
        for(let i = 0; i < decorators.length; i++){
            let decorator = decorators[i];
            let expr = decorator.expression;//.expression.escapedText
            let dName = expr.expression? expr.expression.escapedText: expr.escapedText;
            if(dName == name){
                decorators.end = decorators.pos = -1;
                decorators.transformFlags = null;
                decorators.splice(i, 1);

                if(decorators.length == 0)
                    this.node.decorators = undefined;
                return;
            }
        }
    }

    getFile(): TsFile{
        return new TsFile(this.node.getSourceFile());
    }

    getParent(): ClassNode | null{
        let parentNode = ts.getClassExtendsHeritageElement(this.node);
        if(parentNode == null)
            return null;
        let parentClassName = parentNode.name.escapedText;
        return this.getFile().getImportClass(parentClassName);
    }

    getAllParents(): ClassNode[]{
        let parents = [];
        let parent = this.getParent();
        let i = 0;
        while(parent != null){
            parents.push(parent);
            parent = parent.getParent();
            i++;
            if(i > 1000)
                throw new Error('More than 1000(???) parents on '+ this.getName());
        }
        return parents;
    }

    hasParent(filePath: TsFileRef): boolean{
        let parent = this.getParent();
        while(parent != null){
            if(parent.getFile().getPath() == filePath.getPath())
                return true;
            parent = parent.getParent();
        }
        return false
    }

    getMethods(withParentMethods?: boolean): ClassMethodNode[]{
        if(withParentMethods)
        return (this.node.members || [])
            .filter(m => m.kind == TsType.CLASS_METHOD.getId())
            .map(m => new ClassMethodNode(m));
    }

    isSyntheticEnum(): boolean{
        return SyntheticEnumTransformer.isEnum(this)
    }


    toString(): string {
        return this.getFile().toString();
    }

}