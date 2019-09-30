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
        if(req.data != null){
            if(req.data instanceof JsonRequestContent)
                 ///@ts-ignore
                props.data = req.data.toJson? req.data.toJson(): JSON.stringify(req.data)
            else
                ///@ts-ignore
                props.data = req.data.serialize? req.data.serialize(): req.data
        
            props.headers = {
                'content-type': req.data.contentType
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