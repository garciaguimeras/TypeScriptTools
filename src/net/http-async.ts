interface HttpAsyncRequest {
    url: string;
    method?: string;
    params?: any;
    headers?: any;
    withCredentials?: boolean;
}

class HttpAsync {
    
    baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private response(request: HttpAsyncRequest): Promise<any> {

        var url = (request && request.url) ? request.url : "";
        var method = (request && request.method) ? request.method : "GET";
        var params = (request && request.params) ? request.params : {};
        var headers = (request && request.headers) ? request.headers : {};
        var withCredentials = (request && request.withCredentials) ? request.withCredentials : false;

        let promise = new Promise((resolve, reject) => {
            var finalUrl = this.baseUrl + (url ? '/' + url : '');
            var xhr = new XMLHttpRequest();
            if (!xhr) {
                console.log('CORS not supported');
                reject('CORS not supported');
                return;
            }

            xhr.open(method, finalUrl, true);
            let formData = new FormData();
            if (params) {
                Object.keys(params).forEach(k => {
                    formData.append(k, params[k]);
                });
            }
            if (headers) {
                Object.keys(headers).forEach(k => {
                    xhr.setRequestHeader(k, headers[k]);
                });
            }
            xhr.withCredentials = withCredentials;
            xhr.onload = function () {
                if (xhr.status == 200) {
                    var text = xhr.responseText;
                    resolve(xhr.responseText);
                }
                else {
                    console.log('Sorry, response error ' + xhr.status + ': ' + xhr.statusText);
                    reject(xhr.responseText);
                }
            };
            xhr.onerror = function () {
                console.log('Sorry, there was an error making the request.');
                reject('Sorry, there was an error making the request.');
            };

            xhr.send(formData);
        });
        return promise;
    }

    get(request: HttpAsyncRequest): Promise<any> {
        request.method = 'GET';
        return this.response(request);
    }

    post(request: HttpAsyncRequest): Promise<any> {
        request.method = 'POST';
        return this.response(request);
    }

}

export { HttpAsync, HttpAsyncRequest };