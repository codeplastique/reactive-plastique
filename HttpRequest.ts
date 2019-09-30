import Jsonable from "./annotation/Jsonable";

class HttpRequest{
    constructor(
        public url: string,
        public method?: "GET"|"POST"|"PUT"|"DELETE",
        public data?: Object | Object[] | Jsonable,
        public dataType?: "TEXT"|"JSON"
    ){}
}

export default HttpRequest;