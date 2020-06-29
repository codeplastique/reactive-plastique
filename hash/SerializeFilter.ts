export default interface SerializeFilter{
    /**
     * filtering entry
     * @param object
     * @param propertyNameOrIndex property object name or array index
     * @param value
     * @return true if entry should be added and false if not
     */
    (object: Object | Array<any>, propertyNameOrIndex: string | number, value: any): boolean
}