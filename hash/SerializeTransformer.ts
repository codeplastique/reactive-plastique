import SerializeFilter from "./SerializeFilter";

export default class SerializeTransformer extends SerializeFilter{
    public changeValue(value: any){
        this.val = value;
    }

    public changeKey(key: string){
        this.prop = key;
    }

    public change(key: string, value: any): void{
        this.prop = key;
        this.val = value;
    }
}