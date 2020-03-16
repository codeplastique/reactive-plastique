import HttpRequestContent from "./HttpRequestContent";
import SimpleMap from "../../collection/impl/SimpleMap";

class UrlEncodedRequestContent implements HttpRequestContent{
    public contentType = 'application/x-www-form-urlencoded'
    constructor(
        public data: SimpleMap<string, string | number | boolean>
    ){}
}

export default UrlEncodedRequestContent;