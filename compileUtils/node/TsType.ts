declare global {
    const ts;
}
export default class TsType{
    public static readonly CLASS = new TsType(ts.SyntaxKind.ClassDeclaration)
    public static readonly CONSTRUCTOR = new TsType(ts.SyntaxKind.Constructor)
    public static readonly CLASS_PROPERTY = new TsType(ts.SyntaxKind.PropertyDeclaration)
    public static readonly CLASS_METHOD = new TsType(ts.SyntaxKind.MethodDeclaration)

    // public static readonly PRIVATE_KEYWORD = new TsType(ts.SyntaxKind.PrivateKeyword)
    // public static readonly READONLY_KEYWORD = new TsType(ts.SyntaxKind.ReadonlyKeyword)
    // public static readonly PUBLIC_KEYWORD = new TsType(ts.SyntaxKind.PublicKeyword)
    // public static readonly PROTECTED_KEYWORD = new TsType(ts.SyntaxKind.ProtectedKeyword)
    // public static readonly STATIC_KEYWORD = new TsType(ts.SyntaxKind.StaticKeyword);

    public static readonly EXPRESSION_STATEMENT = new TsType(ts.SyntaxKind.ExpressionStatement)
    public static readonly CALL_EXPRESSION = new TsType(ts.SyntaxKind.CallExpression)
    public static readonly SUPER_KEYWORD = new TsType(ts.SyntaxKind.SuperKeyword)
    public static readonly IMPORT_STATEMENT = new TsType(ts.SyntaxKind.ImportDeclaration)

    protected readonly id: number;

    constructor(id: number) {
        this.id = id;
    }
    getId(): number{
        return this.id;
    }
}