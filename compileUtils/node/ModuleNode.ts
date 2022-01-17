import TsFile from "./TsFile";

export default class ModuleNode{
    constructor(
        private readonly node: any
    ) {
    }

    isLibraryModule(): boolean{
        return !this.node.isExternalLibraryImport
    }

    getPath(): string{
        return this.node.originalFileName
    }
}