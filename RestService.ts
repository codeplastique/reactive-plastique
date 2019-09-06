import HttpRequest from "./HttpRequest";

abstract class RestService{
    protected call<T>(req: HttpRequest): Promise<T>{
        let props = {
            url: req.url,
            type: req.method,
            data: req.dataType == 'JSON'? JSON.stringify(req.data): req.data,
            contentType: req.dataType
        }
        return new Promise<T>((resolve, reject) => {
            $.ajax(props).then(resolve, reject);
        });
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