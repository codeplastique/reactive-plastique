import AppEvent from "./AppEvent";

/**
 * for the methods only!
 *
 * Listening the specified events
 * Arguments that are passed to the method marked by \@Listener:
 * 1. argument of the event
 * @see AppEvent
 * 2. Component instance which fired the specified event
 *
 * @example
 * class Example{
 *     \@InitEvent public static readonly EXAMPLE_EVENT: AppEvent<number>
 * }
 * ...
 * \@Listener(Example.EXAMPLE_EVENT)
 * public onChane(arg: number){...}
 *
 * @see InitEvent
 * @see AppEvent
 */
declare const Listener: (...event: AppEvent<any>[]) => Function;
export default Listener;