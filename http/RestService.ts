import HttpRequest from "./HttpRequest";
import HttpResponse from "./HttpResponse";
import JsonRequestContent from "./JsonRequestContent";
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
                props.data = data.toJson? data.toJson(): JSON.stringify(data)
            else
                props.data = data.serialize? data.serialize(): data
        
            props.headers = {
                'content-type': req.content.contentType
            }
        }
        return axios(props);
    }
    protected buildQuery(url: string, attrToVal: Map<string, string>): string{
        let params = [];
        for (let param in attrToVal)
            if(attrToVal[param] != null)
                params.push(param +'='+ encodeURIComponent(attrToVal[param]));
        return url +'?'+ params.join('&');
    }
}


export default RestService;