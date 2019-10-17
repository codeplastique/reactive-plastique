import AppEvent from "../AppEvent";

/**
 * Слушает событие / события; 
 */
declare const Listener: (event: AppEvent<any>) => Function;
export default Listener;