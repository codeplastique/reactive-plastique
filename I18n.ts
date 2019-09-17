class I18n {
    private static locale: string;
    private static keyToValue: Object
    public static text(key: string): string{
        return I18n.keyToValue[key]? I18n.keyToValue[key]: alert('Bundle key "'+ key +'" is not found!');
    }
}

export default I18n;