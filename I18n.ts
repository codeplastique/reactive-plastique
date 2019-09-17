class I18n {
    private static locale: string;
    private static keyToValue: Object
    public static text(key: string): string{
        return this.keyToValue[key]? this.keyToValue[key]: alert('Bundle key "'+ key +'" is not found!');
    }
}

export default I18n;