import HttpRequest from "./HttpRequest";
import HttpResponse from "./HttpResponse";
import JsonRequestContent from "./content/JsonRequestContent";
import UrlEncodedRequestContent from "./content/UrlEncodedRequestContent";
import Serializator from "../hash/Serializator";
import ReactiveReadonlyMap from "../collection/map/ReactiveReadonlyMap";

declare let axios;

class RestService{
    protected call<T>(req: HttpRequest): Promise<HttpResponse<T>>{
        let props: any = {
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
        
            props.headers = {
                'content-type': req.content.contentType
            }
        }
        return axios(props);
    }

    private encodeMap(attrToVal: ReactiveReadonlyMap<string, any>): string{
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

    protected buildQuery(
        url: string,
        attrToVal: ReactiveReadonlyMap<string, number | string | boolean | number[] | string[] | boolean[]>
    ): string{
        return url +'?'+ this.encodeMap(attrToVal);
    }
}


export default RestService;