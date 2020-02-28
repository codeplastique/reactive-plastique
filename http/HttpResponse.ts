interface HttpResponse<T>{
    data: T,
    status: number,
    statusText: string,
    headers: Object,

    message?: string //error message
}

export default HttpResponse;