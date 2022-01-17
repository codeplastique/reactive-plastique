import ClassNode from "./ClassNode";
import TsType from "./TsType";
import TsFile from "./TsFile";
const PATH = require("path");

export default class Context{
    //Autowired
    static readonly context: any

    static getModule(path: string){
        return this.context.getEmitHost().getSourceFile(path);
    }

    static getSourceFiles(): Array<TsFile>{
        return this.context.getEmitHost().getSourceFiles().map(f => new TsFile(f))
    }

    static getLibraryDirectory(): string{
        return this.context.getEmitHost().getCommonSourceDirectory() +'node_modules/'
    }

    static getClass(path: string): ClassNode{
        let module = this.getModule(path);
        let className = this.getFilenameWithoutExt(path);
        for(let node of module.statements)
            if((node.kind === TsType.CLASS) && node.name.escapedText == className)
                return new ClassNode(node);
    }

    private static getFilenameWithoutExt(path: string){
        let filename: string = PATH.basename(path);
        return filename.split('.')[0]
    }

    static getRaw(): any{
        return this.context
    }
}