import InterfaceNode from "./node/InterfaceNode";

export default class InterfaceDecorator{
    private counter = 1;
    private interfacePathToId = new Map<string, number>();

    add(i: InterfaceNode){
        let path = i.getFile().getPath()
        if(this.interfacePathToId.get(path) == null)
            return this.interfacePathToId.set(path, this.counter++);
    }
    getId(i: InterfaceNode): number{
        let path = i.getFile().getPath()
        let counter = this.interfacePathToId.get(path)
        if(counter)
            return counter
        else{
            counter = this.counter++
            this.interfacePathToId.set(path, counter)
        }
        return counter;
    }
    // getNameById(id){
    //     return Object.keys(interfaceNameToId).find(key => interfaceNameToId[key] === id);
    // }
    // getMask(interfaces){
    //     let mask = [];
    //     for(let interface of interfaces)
    //         if(interfaceNameToId[interface])
    //             mask.push(interfaceNameToId[interface])
    //     return mask;
    // }

}