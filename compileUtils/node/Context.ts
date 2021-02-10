import ClassNode from "./ClassNode";
import TsType from "./TsType";
const PATH = require("path");

export default class Context{
    public static context: any
    static getModule(path: string){
        return this.context.getEmitHost().getSourceFile(path);
    }

    static getClass(path: string): ClassNode{
        let module = this.getModule(path);
        let className = this.getFilenameWithoutExt(path);
        for(let node of module.statements)
            if((node.kind === TsType.CLASS) && node.name.escapedText == className)
                return node;
    }

    private static getFilenameWithoutExt(path: string){
        let filename: string = PATH.basename(path);
        return filename.split('.')[0]
    }
}