export default class TsModifier{
    public static readonly PRIVATE = new TsModifier(ts.SyntaxKind.PrivateKeyword)
    public static readonly READONLY = new TsModifier(ts.SyntaxKind.ReadonlyKeyword)
    public static readonly PUBLIC = new TsModifier(ts.SyntaxKind.PublicKeyword)
    public static readonly PROTECTED = new TsModifier(ts.SyntaxKind.ProtectedKeyword)
    public static readonly STATIC = new TsModifier(ts.SyntaxKind.StaticKeyword);

    protected readonly id: number;

    constructor(id: number) {
        this.id = id;
    }
    getId(): number{
        return this.id;
    }
}