import HttpRequest from "./HttpRequest";
import HttpResponse from "./HttpResponse";
import JsonRequestContent from "./JsonRequestContent";
import TextRequestContent from "./TextRequestContent";
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
            else if(req.content instanceof TextRequestContent)
                props.data = data.serialize? data.serialize(): data
            else // FormDataRequestContent
                props.data = data;
        
            props.headers = {
                'content-type': req.content.contentType
            }
        }
        return axios(props);
    }
    protected buildQuery(url: string, attrToVal: Map<string, string>): string{
        let params = [];
        attrToVal.forEach((val, paramKey) => {
            if(val != null)
                params.push(paramKey +'='+ encodeURIComponent(val));
        });
        return url +'?'+ params.join('&');
    }
}


export default RestService;