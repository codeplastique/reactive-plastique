import AppEvent from "./AppEvent";

 class EventManager {
    private static listeners: {[eventName: string]: Array<(event?: any) => Promise<any>>} = {} 
    private constructor(
        private component
    ){}

    private static addListener(eventName: string, func: Function): void{
        if(EventManager.listeners[eventName] == null)
            EventManager.listeners[eventName] = [];
        ///@ts-ignore
        EventManager.listeners[eventName].push(func);
    }
    public fireEvent<T>(eventName: AppEvent<any>, eventObject?: any): Promise<T[]>{
        eventName = eventName.toLowerCase();
        if(EventManager.listeners[eventName as string] == null){
            console.log('No listeners for event: '+ eventName);
            ///@ts-ignore
            return Promise.resolve();
        }
        return Promise.all(EventManager.listeners[eventName as string].map(func => func(eventObject)));
    }
    public fireEventOnParents<T>(eventName: AppEvent<any>, eventObject?: any): Promise<T>{
        if(this.component == null)
            throw new Error('fireEventOnParents works only with components!')
        eventName = eventName.toLowerCase();
        let parent = this.component.app$.parent;
        while(parent){
            if(parent.app$.events[eventName as string])
                return Promise.resolve(parent.app$.events[eventName as string][0](eventObject));
            parent = parent.app$.parent;
        }
        console.log('No parent listeners for event: '+ eventName);
        ///@ts-ignore
        return Promise.resolve();
    }
}

export default EventManager;