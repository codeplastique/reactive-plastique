import HttpRequestContent from "./HttpRequestContent";
import Serializable from "../annotation/Serializable";

class TextRequestContent implements HttpRequestContent{
    public contentType = 'text/html'
    constructor(
        public data: Object | Object[] | Serializable
    ){}
}

export default TextRequestContent;