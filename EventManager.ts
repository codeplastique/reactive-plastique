 class EventManager {
    private listeners: {[eventName: string]: [(event?: any) => Promise<any>]} 
    private constructor(){}


    public fireEvent<T extends Array<T>>(eventName: string, eventObject?: any): Promise<T>{
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