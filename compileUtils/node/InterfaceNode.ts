import NameableNode from "./NameableNode";
import TsType from "./TsType";
import ClassPropertyNode from "./ClassPropertyNode";
import TsFile from "./TsFile";
import TsFileRef from "./TsFileRef";
import ClassMethodNode from "./ClassMethodNode";
import SyntheticEnumTransformer from "../SyntheticEnumTransformer";

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


    getAllParents(): Array<InterfaceNode>{

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

    getMethods(withParentMethods: boolean = false): ClassMethodNode[]{
        if(withParentMethods){
            //TODO
        }
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