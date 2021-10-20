import ClassNode from "./node/ClassNode";

export default class EntryPointDecorator{
    private static readonly ANNOTATION_BEANS = 'Beans';

    constructor(node: ClassNode) {

        let beans = node.findDecorator(EntryPointDecorator.ANNOTATION_BEANS)
        if(beans){
            let beanClasses = beans.getArguments()
        }

    }
}