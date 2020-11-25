/**
 * Marker decorator for the compile-time events initializing;
 * Requires 'public' & 'static' & 'readonly' field modifiers
 *
 * @example
 * class Example{
 *     \@InitEvent public static readonly EVENT_NAME: AppEvent<ARG>
 * }
 *
 * @see AppEvent
 * @see Listener
 */

declare const InitEvent: Function;
export default InitEvent;