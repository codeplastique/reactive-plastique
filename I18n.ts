class I18n {
    // private static locale: string;
    private static keyToValue: Object
    public static text(key: string, ...args: string[]): string{
        if(!I18n.keyToValue[key])
            alert('Bundle key "'+ key +'" is not found!')
        let result = I18n.keyToValue[key]; 
        if(arguments.length > 1)
            for(let i in arguments)
                result = result.replace(new RegExp('\\{'+ i +'\\}', 'g'), arguments[i + 1])
        return result;
    }
}

export default I18n;