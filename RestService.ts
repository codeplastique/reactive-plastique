import HttpRequest from "./HttpRequest";
import HttpResponse from "./HttpResponse";
declare let axios;

class RestService{
    protected call(req: HttpRequest): Promise<HttpResponse>{
        let props: any = {};
        props.url = req.url;
        props.method = req.method == null? 'GET': req.method;
        if(req.data != null){
            ///@ts-ignore
            props.data = req.dataType == 'JSON'? JSON.stringify(req.data.keyToVal): req.data.keyToVal
            props.headers = {
                'content-type': req.dataType == 'JSON'? 'application/json': 'text/html'
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