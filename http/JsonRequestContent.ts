import HttpRequestContent from "./HttpRequestContent";
import Jsonable from "../annotation/Jsonable";

class JsonRequestContent implements HttpRequestContent{
    public contentType = 'application/json'
    constructor(
        public data: Object | Object[] | Jsonable
    ){}
}

export default JsonRequestContent;