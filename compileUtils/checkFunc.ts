export function errorIf(condition: boolean, error: string){
    if(condition)
        throw new Error(error)
}

export function check(condition: boolean, error: string){
    if(!condition)
        throw new Error(error)
}