class HttpRequest{
    constructor(
        public url: string,
        public method?: "GET"|"POST"|"PUT"|"DELETE",
        public data?: Map<string, string>,
        public dataType?: "TEXT"|"JSON"
    ){}
}

export default HttpRequest;