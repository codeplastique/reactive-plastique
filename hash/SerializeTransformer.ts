export default interface SerializeTransformer{
    /**
     * transform entry: key or(and) value
     * Warning! You should not change the array index, if you change, an exception is thrown
     * @param object
     * @param propertyNameOrIndex property object name or array index
     * @param value
     * @return [changed object name or previous array index, changed value]
     */
    (object: Object | Array<any>, propertyNameOrIndex: string | number, value: any): [string | number, any]
}