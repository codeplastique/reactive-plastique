import HttpRequest from "./HttpRequest";
import HttpResponse from "./HttpResponse";
import JsonRequestContent from "./content/JsonRequestContent";
import UrlEncodedRequestContent from "./content/UrlEncodedRequestContent";
import Serializator from "../hash/Serializator";
import ReactiveReadonlyMap from "../collection/map/ReactiveReadonlyMap";

declare let axios;

export default class RestService{
    /**
     * Executes the request
     */
    call<T>(req: HttpRequest): Promise<HttpResponse<T>>{
        let props: any = {
            headers: {},
            url: req.url,
            method: req.method == null? 'GET': req.method
        };
        if(req.content != null){
            let data = req.content.data;
            if(req.content instanceof JsonRequestContent)
                props.data = typeof data == 'string'? data: new Serializator().toJson(data)
            else if(req.content instanceof UrlEncodedRequestContent)
                props.data = this.encodeMap(data);
            else // FormDataRequestContent
                props.data = data;
        
            props.headers['content-type'] = req.content.contentType
        }
        if(req.headers)
            Object.assign(props.headers, req.headers.toJSON())
        return axios(props);
    }

    /**
     * Builds a query params string
     * @param attrToVal where key is a param name and value is its value. Also, the value can be an array
     * @example {'a'=>1, 'b'=>2, 'c'=>[3, 4, 5]}
     *          transforms to
     *          "a=1&b=2&c=3&c=4&c=5"
     */
    encodeMap(attrToVal: ReactiveReadonlyMap<string, any>): string{
        let params = [];
        attrToVal.forEach((val, key) => {
            if(val != null) {
                let arrValString: string[] = Array.isArray(val)? val.map(it => it.toString()): [val.toString()]
                arrValString.forEach(val => {
                    params.push(key +'='+ encodeURIComponent(val));
                })
            }
        });
        return params.join('&');
    }

    /**
     * Builds a work query with query params
     */
    buildQuery(
        url: string,
        attrToVal: ReactiveReadonlyMap<string, number | string | boolean | number[] | string[] | boolean[]>
    ): string{
        return url +'?'+ this.encodeMap(attrToVal);
    }
}