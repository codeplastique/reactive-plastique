import HttpRequestContent from "./HttpRequestContent";

class FormDataRequestContent implements HttpRequestContent{
    public contentType = 'multipart/form-data'
    constructor(
        public data: FormData
    ){}
}

export default FormDataRequestContent;