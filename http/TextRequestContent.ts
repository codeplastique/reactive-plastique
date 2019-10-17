import HttpRequestContent from "./HttpRequestContent";

class TextRequestContent implements HttpRequestContent{
    public contentType = 'text/plain'
    constructor(
        public data: string
    ){}
}

export default TextRequestContent;