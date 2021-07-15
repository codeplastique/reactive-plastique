export default class TsFileRef {
    constructor(
        private readonly path: string
    ){}

    getPath(): string{
        return this.path
    }
}