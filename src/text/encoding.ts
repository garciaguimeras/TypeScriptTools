class Encoding {

    static atobUtf8(encodedStr: string): string {
        return decodeURIComponent(Array.prototype.map.call(atob(encodedStr), function (c: string) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''));
    }

    static btoaUtf8(str: string): string {
        return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
            return String.fromCharCode(parseInt(p1, 16))
        }));
    }

}

class JsonEx {

    static parse64(str: string): any {
        let decoded = Encoding.atobUtf8(str);
        return JSON.parse(decoded);
    }

    static stringify64(obj: any): string {
        let str = JSON.stringify(obj);
        return Encoding.btoaUtf8(str);
    }

}

export {
    Encoding,
    JsonEx
}
