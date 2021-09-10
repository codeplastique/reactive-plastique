/**
 * Plastique by default initializes all component fields to 'null' value.
 * Use IgnoreInit to prevent it
 * @example
 * \@Reactive
 * class Example{
 *     \@IgnoreInit
 *     private field: any
 * }
 */

declare const IgnoreInit: Function;
export default IgnoreInit;