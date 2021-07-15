import ClassNode from "./node/ClassNode";
import NameableNode from "./node/NameableNode";
import Decoratable from "./node/Decoratable";
import ClassPropertyNode from "./node/ClassPropertyNode";
import TsModifier from "./node/TsModifier";
import ExpressionNode from "./node/ExpressionNode";


class JsonParser{
    public static readonly JSON_CLASS_META_PROPERTY: string = '$json';
    public static readonly JSON_FROM_ANNOTATION: string = 'JsonFrom';
    public static readonly JSON_TO_ANNOTATION: string = 'ToJson';
    public static readonly JSON_MERGE_ANNOTATION: string = 'JsonMerge';

    // meta:
    public static readonly TO_JSON_FIELDS_NAMES_META: string = 'f';
    public static readonly TO_JSON_FIELD_NAME_TO_ALIAS_NAME_META: string = 'fa';
    public static readonly TO_JSON_METHODS_NAMES_META: string = 'm';
    public static readonly TO_JSON_ALIAS_NAME_TO_METHOD_NAME_META: string = 'am';
    public static readonly JSON_MERGE_META: string = 'mf';
    public static readonly FROM_JSON_CONSTRUCTOR_FIELDS_META: string = 'c';
    public static readonly FROM_JSON_FIELDS_META: string = 'ff';


    private readonly clazz: ClassNode;

    private fromJsonFields = []; // ['param1', '*param2', ...], '*...' - optional param
    private fromJsonConstructorFields = []; // ['param1', '*param2', ...], '*...' - optional param
    private toJsonFieldsNames: string[] = [];
    private toJsonFieldNameToAlias: {[key: string]: ExpressionNode} = {};
    private jsonMergeFieldsNames: string[] = [];
    private toJsonMethodsNames: string[] = [];
    private toJsonAliasToMethodName: {[key: string]: string} = {};

    constructor(clazz: ClassNode) {
        this.clazz = clazz;
    }

    transform(): void{
        this.handleFromJson();
        this.handleToJsonFields();
        this.handleToJsonMethods();

        let meta = {};
        if(this.toJsonFieldsNames.length > 0)
            meta[JsonParser.TO_JSON_FIELDS_NAMES_META] = this.toJsonFieldsNames;
        if(Object.keys(this.toJsonFieldNameToAlias).length > 0)
            meta[JsonParser.TO_JSON_FIELD_NAME_TO_ALIAS_NAME_META] = this.toJsonFieldNameToAlias;
        if(this.jsonMergeFieldsNames.length > 0)
            meta[JsonParser.JSON_MERGE_META] = this.jsonMergeFieldsNames;
        if(this.toJsonMethodsNames.length > 0)
            meta[JsonParser.TO_JSON_METHODS_NAMES_META] = this.toJsonMethodsNames
        if(Object.keys(this.toJsonAliasToMethodName).length > 0)
            meta[JsonParser.TO_JSON_ALIAS_NAME_TO_METHOD_NAME_META] = this.toJsonAliasToMethodName
        if(this.fromJsonFields.length > 0)
            meta[JsonParser.FROM_JSON_FIELDS_META] = this.fromJsonFields;
        if(this.fromJsonConstructorFields.length > 0)
            meta[JsonParser.FROM_JSON_CONSTRUCTOR_FIELDS_META] = this.fromJsonConstructorFields

        if(Object.keys(meta).length > 0) {
            let metaField = ClassPropertyNode.create(
                TsModifier.STATIC,
                JsonParser.JSON_CLASS_META_PROPERTY,
                ExpressionNode.createObject(meta));

            this.clazz.addField(metaField);
        }
    }

    public handleToJsonFields(){
        let nonStaticFields = this.clazz.getFields()
            .filter(f => !f.isStatic());

        for(let field of nonStaticFields){
            let fieldName = field.getName();
            let decorators = field.getDecorators();
            let decorator = decorators.find(d => d.getName(JsonParser.JSON_TO_ANNOTATION))
            if(decorator){
                let alias = decorator.getArguments()[0]
                if(alias)
                    this.toJsonFieldNameToAlias[fieldName] = alias;
                else
                    this.toJsonFieldsNames.push(fieldName)
            }else if(decorators.some(d => d.getName() == JsonParser.JSON_MERGE_ANNOTATION)){
                this.jsonMergeFieldsNames.push(fieldName)
            }
        }
    }

    public handleToJsonMethods(){
        let nonStaticMethods = this.clazz.getMethods().filter(f => !f.isStatic());
        for(let method of nonStaticMethods){
            let decorators = method.getDecorators();
            let decorator = decorators.find(d => d.getName(JsonParser.JSON_TO_ANNOTATION))
            if(decorator){
                let fieldName = method.getName();
                let alias = decorator.getArguments()[0]
                if(alias)
                    this.toJsonAliasToMethodName[alias.asString()] = fieldName;
                else
                    this.toJsonMethodsNames.push(fieldName)
            }
        }
    }

    protected handleFromJson(): void{
        let constructor = this.clazz.getConstructor();
        if(constructor != null) {
            let params = constructor.getParameters();
            if (params.length > 0) {
                this.fromJsonConstructorFields = params.map(p => this.handleNode(p))
            }
        }
        this.fromJsonFields = this.clazz.getFields()
            .filter(f => !f.isStatic())
            .map(f => this.handleNode(f));
    }

    protected handleNode(node: Decoratable & NameableNode): string{
        let decorator = node.getDecorators().find(p => p.getName() == JsonParser.JSON_FROM_ANNOTATION);

        if(decorator && decorator.getArguments().length > 0){
            let [jsonFieldNameArg, isOptionalArg] = decorator.getArguments();
            let name = jsonFieldNameArg.asString();
            let isOptional = isOptionalArg && isOptionalArg.asBoolean();
            if(isOptional)
                name = '*'+ name;
            return name;
        }else
            return node.getName();
    }
}