export default class TsFileRef {
    constructor(
        private readonly path: string
    ){}

    getPath(): string{
        return this.path
    }

    toString(): string{
        return this.getPath()
    }
}