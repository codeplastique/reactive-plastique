import HttpRequestContent from "./content/HttpRequestContent";
import ReactiveMap from "../collection/map/ReactiveMap";

class HttpRequest{
    constructor(
        public url: string,
        public method?: "GET"|"POST"|"PUT"|"DELETE",
        public content?: HttpRequestContent,
        public headers?: ReactiveMap<string, string>
    ){}
}

export default HttpRequest;