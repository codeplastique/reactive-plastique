import HttpRequest from "./HttpRequest";
import HttpResponse from "./HttpResponse";
declare let axios;

class RestService{
    protected call(req: HttpRequest): Promise<HttpResponse>{
        let props = {
            url: req.url,
            method: req.method,
            ///@ts-ignore
            data: req.dataType == 'JSON'? JSON.stringify(req.data.keyToVal): req.data.keyToVal,
            headers: {
                'content-type': req.dataType == 'TEXT'? 'text/html': 'application/json'
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