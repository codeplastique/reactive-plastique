import TsType from "./TsType";
import ClassNode from "./ClassNode";
import Context from "./Context";
import TsFileRef from "./TsFileRef";
import InterfaceNode from "./InterfaceNode";
import ModuleNode from "./ModuleNode";

export default class TsFile extends TsFileRef{
    constructor(node: any) {
        super(node)
    }

    getImportClass(className: string): ClassNode | InterfaceNode{
        let path = this.getPathOfImportName(className);
        return Context.getClass(path);
    }

    getImportsModules(): ReadonlyArray<ModuleNode>{
        let arr = this.node.resolvedModules? []: this.node.resolvedModules.values()
        return Array.from(arr).filter(m => m != void 0).map(n => new ModuleNode(n))
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

    getClassesNodes(): ReadonlyArray<ClassNode>{
        return this.node.statements.find(s => s.kind == ts.SyntaxKind.ClassDeclaration).map(c => new ClassNode(c));
    }
}