import AppEvent from "./AppEvent";

/**
 * for methods only!
 *
 * Listening the specified events
 * Arguments that are passed to the method:
 * 1. argument of the event
 * @see AppEvent
 * 2. Component instance which fired the specified event
 */
declare const Listener: (...event: AppEvent<any>[]) => Function;
export default Listener;