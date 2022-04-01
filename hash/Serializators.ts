import Serializator from "./Serializator";
import Types from "../base/Types";

/**
 * Collection of useful serializators
 */
export default class Serializators{
    /**
     * Generates the serializator that skips:
     * empty strings
     * empty arrays
     * nullable values
     */
    static skipEmptyFields(): Serializator{
        return new Serializator(
            filter => {
                let val = filter.value();
                let isIgnored = val == null || (Types.isString(val) && val.length == 0) || (Types.isArray(val) && val.length == 0)
                return !isIgnored;
            }
        )
    }
}