import TsType from "./TsType";
import ClassNode from "./ClassNode";
import Context from "./Context";

export default class TsFile {
    constructor(protected readonly node) {}

    getPath(): string{
        return this.node.fileName
    }

    getImportClass(className: string): ClassNode{
        let path = this.getPathOfImportName(className);
        return Context.getClass(path);
    }

    getPathOfImportName(importName: string): string{
        let d = this.node
            .locals
            .get(importName);

        if(d == null)
            return;
        let f =  d.declarations[0].parent;

        if(f.fileName)
            return f.fileName;

        let relativeModulePath = f
            .moduleSpecifier
            .text

        let module = this.node.resolvedModules.get(relativeModulePath);
        if(module == null){
            throw new Error(`${relativeModulePath} is not found in ${this.getPath()}`)
        }

        return module.resolvedFileName
    }

    getImportName(path: string): string{
        let node = this.node;
        if(node.resolvedModules == null)
            return null;

        let module = Array.from(node.resolvedModules.entries())
            .find(m => {
                let filePath = m[1].originalFileName;
                return filePath === path;
            });
        if(module == null)
            return null;

        let moduleRelative = module[0];
        for(let st of node.statements){
            if(st.kind === TsType.IMPORT_STATEMENT.getId() && st.moduleSpecifier.text === moduleRelative){
                return st.importClause.name.escapedText;
            }
        }
        throw new Error('Import declaration is not found for path: '+ path)
    }
}