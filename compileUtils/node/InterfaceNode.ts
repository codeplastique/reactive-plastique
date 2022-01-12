import NameableNode from "./NameableNode";
import TsType from "./TsType";
import ClassPropertyNode from "./ClassPropertyNode";
import TsFile from "./TsFile";
import ClassMethodNode from "./ClassMethodNode";
import "./ArrayExtension";
import "./MapExtension>";

export default class InterfaceNode extends NameableNode{
    constructor(node){
        super(node);
    }


    getFields(): ClassPropertyNode[]{
        return (this.node.members || [])
            .filter(n => n.kind == TsType.CLASS_PROPERTY.getId())
            .map(p => new ClassPropertyNode(p));
    }

    getFile(): TsFile{
        return new TsFile(this.node.getSourceFile());
    }


    getParents(): ReadonlyArray<InterfaceNode>{
        if(this.node.heritageClauses && this.node.heritageClauses[0] && this.node.heritageClauses[0].types)
            return this.node.heritageClauses[0].types.map(i => new InterfaceNode(i))
        return []
    }


    /**
     * deep
     */
    getAllParents(): ReadonlyArray<InterfaceNode>{
        let oneLevel = this.getParents()
        return oneLevel.concat(
            oneLevel.flatMap(i => i.getAllParents())
        ).toMap<string, InterfaceNode>(i => i.getFile().getPath())
        .valuesArray()
    }

    getMethods(withParentMethods: boolean = false): ClassMethodNode[]{
        if(withParentMethods){
            //TODO
        }
        return (this.node.members || [])
            .filter(m => m.kind == TsType.CLASS_METHOD.getId())
            .map(m => new ClassMethodNode(m));
    }

    toString(): string {
        return this.getFile().toString();
    }

}