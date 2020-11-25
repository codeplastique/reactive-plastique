/**
 * for the fields with primitive values only !
 * Works only if the component is attached!
 * Calling 'method' if the field value is changed.
 * New value and old value of the field will be passed to the method.
 *
 * @Example
 * class Example{
 *     \@OnChange(Example.prototype.onValueChange) //or \@OnChange(this.onValueChange)
 *     protected string value = '';
 *
 *     private onValueChange(newValue: string, oldValue: string){...}
 * }
 */
declare const OnChange: (
    method: Function 
) => Function;
export default OnChange;