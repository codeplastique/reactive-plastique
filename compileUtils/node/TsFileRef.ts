import Context from "./Context";

export default class TsFileRef {
    private readonly path: string
    constructor(protected readonly node: any){
        this.path = node.fileName
    }

    getPath(): string{
        return this.path
    }

    toString(): string{
        return this.getPath()
    }

    isDefaultLib(): boolean{
        return this.node.hasNoDefaultLib
            || Context.getRaw().isSourceFileFromExternalLibrary(this.node)
            || this.getPath().startsWith(Context.getLibraryDirectory() +'typescript/')
    }


}