import HttpRequestContent from "./HttpRequestContent";
import Jsonable from "../annotation/Jsonable";
import Serializable from "../annotation/Serializable";

class JsonRequestContent implements HttpRequestContent{
    public contentType = 'application/json'
    constructor(
        public data: Object | Object[] | Jsonable | Serializable
    ){}
}

export default JsonRequestContent;