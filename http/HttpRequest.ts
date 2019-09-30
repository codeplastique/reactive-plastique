import HttpRequestContent from "./HttpRequestContent";

class HttpRequest{
    constructor(
        public url: string,
        public method?: "GET"|"POST"|"PUT"|"DELETE",
        public data?: HttpRequestContent
    ){}
}

export default HttpRequest;