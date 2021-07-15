import ClassNode from "./node/ClassNode";
import ClassPropertyNode from "./node/ClassPropertyNode";
import TsModifier from "./node/TsModifier";
import TsFileRef from "./node/TsFileRef";

export default class EnumTransformer{
    private static readonly ANNOTATION_ENUM = 'Enum';
    private static readonly ENUMERABLE_IDENTIFIER_PATH = '@plastique/core/enum/Enumerable';

    public static transform(clazz: ClassNode): void{
        if(!this.isEnum(clazz))
            return;

        let classIdentity = clazz.getIdentifier();
        let enumSpecialField = ClassPropertyNode.create(
            TsModifier.STATIC,
            '$',
            classIdentity.createFunctionCallStatement('$init', [classIdentity]));

        clazz.addField(enumSpecialField);
        removeDecorator(node, ANNOTATION_ENUM);
    }

    public static isEnum(clazz: ClassNode): boolean{
        if(clazz.getDecorators().some(d => d.getName() == EnumTransformer.ANNOTATION_ENUM)){
            if(!clazz.hasParent(new TsFileRef(this.ENUMERABLE_IDENTIFIER_PATH)))
                throw new Error(`Class ${clazz.getName()} has an Enum decorator, but no Enumerable parent!`)
        }
        return false;
    }
}