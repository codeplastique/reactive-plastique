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
    public fireEvent<T extends Array<T>>(eventName: string, eventObject?: any): Promise<T>{
        eventName = eventName.toLowerCase();
        if(EventManager.listeners[eventName] == null){
            console.log('No listeners for event: '+ eventName);
            ///@ts-ignore
            return Promise.resolve();
        }
        return Promise.all(EventManager.listeners[eventName].map((func) => func(eventObject))) as Promise<T>;
    }
    public fireEventOnParents<T>(eventName: string, eventObject?: any): Promise<T>{
        if(this.component == null)
            throw new Error('fireEventOnParents works only with components!')
        eventName = eventName.toLowerCase();
        let parent = this.component.app$.parent;
        while(parent){
            if(parent.app$.events[eventName])
                return parent.app$.events[eventName][0].call(parent, eventObject) as Promise<T>;
            parent = parent.app$.parent;
        }
        console.log('No parent listeners for event: '+ eventName);
        ///@ts-ignore
        return Promise.resolve();
    }
}

export default EventManager;