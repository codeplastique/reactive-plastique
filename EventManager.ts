 class EventManager {
    private listeners: {[eventName: string]: Array<(event?: any) => Promise<any>>} 
    private constructor(){}

    private addListener(eventName: string, func: Function): void{
        eventName = eventName.toLowerCase();
        if(this.listeners[eventName] == null)
            this.listeners[eventName] = [];
        ///@ts-ignore
        this.listeners[eventName].push(func);
    }
    public fireEvent<T extends Array<T>>(eventName: string, eventObject?: any): Promise<T>{
        eventName = eventName.toLowerCase();
        if(this.listeners[eventName] == null){
            console.log('No listeners for event: '+ eventName);
            ///@ts-ignore
            return Promise.resolve();
        }
        return Promise.all(this.listeners[eventName].map((func) => func(eventObject))) as Promise<T>;
    }
    public fireEventOnParents<T>(eventName: string, eventObject?: any): Promise<T>{
        return null;
    }
}

export default EventManager;