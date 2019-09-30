interface HttpResponse<T>{
    data: T,
    status: number,
    statusText: string,
    headers: Object,
}

export default HttpResponse;