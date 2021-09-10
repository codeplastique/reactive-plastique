import ClassNode from "./node/ClassNode";

export default class EventTransformer {
    static readonly INIT_EVENT_DECORATOR = 'InitEvent';
    static readonly APP_EVENT_TYPE = 'AppEvent';
    private lastId: number = 0;
    private uniqueToEventId: Map<string, string> = new Map();

    public transform(clazz: ClassNode): void{
        clazz.getFields().filter(it => it.hasDecorator(EventTransformer.INIT_EVENT_DECORATOR)).forEach(field => {
            if(!field.isReadonly() || !field.isStatic())
                throw new Error(`Event "${clazz.getName()}.${field.getName()}" must be a static & readonly`)

            let type = field.getType();
            if(type == null)
                throw new Error(`Event "${clazz.getName()}.${field.getName()}" must have the ${EventTransformer.APP_EVENT_TYPE} type`)

            try {
                field.setValue(this.handleMember(type));
            }catch (e) {
                throw new Error(`Event "${clazz.getName()}.${field.getName()}" must have the ${EventTransformer.APP_EVENT_TYPE} type`)
            }

            field.removeDecorator(EventTransformer.INIT_EVENT_DECORATOR)
        });
    }

    protected handleMember(type): string | object{
        if(type.isComposite()){
            let obj = {};
            for(let member of type.members){
                obj[member.getName()] = this.handleMember(type)
            }
            return obj
        }else {
            if(type.getName() != EventTransformer.APP_EVENT_TYPE)
                throw new Error() //TODO

            this.uniqueToEventId.set(type.getUnique(), String(this.lastId++));
            return String(this.lastId)
        }
    }


    getEventId(unique): string{
        let id = this.uniqueToEventId.get(unique);
        if(id == null)
            throw new Error(`Field "${unique} is not event`)
        return id
    }
}