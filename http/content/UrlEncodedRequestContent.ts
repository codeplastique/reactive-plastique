import HttpRequestContent from "./HttpRequestContent";
import ReactiveReadonlyMap from "../../collection/map/ReactiveReadonlyMap";

class UrlEncodedRequestContent implements HttpRequestContent{
    public contentType = 'application/x-www-form-urlencoded'
    constructor(
        public data: ReactiveReadonlyMap<string, string>
    ){}
}

export default UrlEncodedRequestContent;