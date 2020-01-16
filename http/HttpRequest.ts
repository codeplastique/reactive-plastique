import HttpRequestContent from "./content/HttpRequestContent";

class HttpRequest{
    constructor(
        public url: string,
        public method?: "GET"|"POST"|"PUT"|"DELETE",
        public content?: HttpRequestContent
    ){}
}

export default HttpRequest;