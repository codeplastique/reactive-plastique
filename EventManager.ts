import AppEvent from "./AppEvent";

 class EventManager {
    private static listeners: {[eventName: string]: Array<(event?: any, caller?: any) => Promise<any>>} = {} 
    private constructor(
        private caller
    ){}

    private static addListener(eventName: string, func: Function): void{
        if(EventManager.listeners[eventName] == null)
            EventManager.listeners[eventName] = [];
        ///@ts-ignore
        EventManager.listeners[eventName].push(func);
    }
    public fireEvent<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T[]>{
        eventName = eventName.toLowerCase();
        if(EventManager.listeners[eventName as string] == null){
            console.log('No listeners for event: '+ eventName);
            ///@ts-ignore
            return Promise.resolve();
        }
        return Promise.all(EventManager.listeners[eventName as string].map(func => func(eventObject, this.caller)));
    }
    public fireEventOnParents<A, T>(eventName: AppEvent<A>, eventObject?: A): Promise<T>{
        if(this.caller.app$ == null)
            throw new Error('fireEventOnParents works only with components!')
        eventName = eventName.toLowerCase();
        let parent = this.caller.app$.parent;
        while(parent){
            if(parent.app$.events[eventName as string])
                return Promise.resolve(parent.app$.events[eventName as string][0](eventObject, this.caller));
            parent = parent.app$.parent;
        }
        console.log('No parent listeners for event: '+ eventName);
        ///@ts-ignore
        return Promise.resolve();
    }
}

export default EventManager;