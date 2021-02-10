import HttpRequest from "./HttpRequest";
import HttpResponse from "./HttpResponse";
import JsonRequestContent from "./content/JsonRequestContent";
import UrlEncodedRequestContent from "./content/UrlEncodedRequestContent";
import Serializator from "../hash/Serializator";
import ReactiveReadonlyMap from "../collection/map/ReactiveReadonlyMap";
import JsonParser from "../hash/JsonParser";

declare let axios;

class RestService{
    protected call<T>(req: HttpRequest, resultMapper?: Class<T>): Promise<HttpResponse<T>>{
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
        let resp = axios(props);
        if(resultMapper)
            resp.data = JsonParser.convert(resp.data, resultMapper);
        return resp;
    }

    private encodeMap(attrToVal: ReactiveReadonlyMap<string, string>): string{
        let params = [];
        attrToVal.forEach((val, paramKey) => {
            if(val != null)
                params.push(paramKey +'='+ encodeURIComponent(val));
        });
        return params.join('&');
    }

    protected buildQuery(url: string, attrToVal: ReactiveReadonlyMap<string, string>): string{
        return url +'?'+ this.encodeMap(attrToVal);
    }
}


export default RestService;