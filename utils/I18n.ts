class I18n {
    // private static locale: string;
    private static keyToValue: Object
    public static text(key: string, ...args: any[]): string{
        if(!I18n.keyToValue[key])
            alert('Bundle key "'+ key +'" is not found!')
        let result = I18n.keyToValue[key]; 
        for(let i = 0; i < args.length; i++)
            result = result.replace(new RegExp('\\{'+ i +'\\}', 'g'), String(args[i]))
        return result;
    }
}

export default I18n;