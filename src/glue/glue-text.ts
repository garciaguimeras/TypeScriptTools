import { $glue } from './glue';

const $innerHtml: string = '$innerHtml';

function atobUtf8(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
}

function TextOutletTransformFunctionGenerator(attrName: string) {
    return function (target: Element): string {
        let text = target.getAttribute(attrName);
        text = text ? text : (attrName == $innerHtml) ? target.innerHTML : '';
        return text;
    };
}

function IntOutletTransformFunctionGenerator(attrName: string) {
    return function (target: Element): number {
        let text = target.getAttribute(attrName);
        text = text ? text : (attrName == $innerHtml) ? target.innerHTML : '';
        return parseInt(text);
    };
}

function FloatOutletTransformFunctionGenerator(attrName: string) {
    return function (target: Element): number {
        let text = target.getAttribute(attrName);
        text = text ? text : (attrName == $innerHtml) ? target.innerHTML : '';
        return parseFloat(text);
    };
}

function JsonOutletTransformFunctionGenerator(attrName: string) {
    return function (target: Element): any {
        let text = target.getAttribute(attrName);
        text = text ? text : (attrName == $innerHtml) ? target.innerHTML : '';
        let obj: any = null;
        try {
            obj = JSON.parse(text);
        }
        catch { }
        return obj
    };
}

function Base64JsonOutletTransformFunctionGenerator(attrName: string) {
    return function (target: Element): any {
        let text = target.getAttribute(attrName);
        text = text ? text : (attrName == $innerHtml) ? target.innerHTML : '';
        text = atobUtf8(text);
        let obj: any = null;
        try {
            obj = JSON.parse(text);
        }
        catch { }
        return obj
    };
}

function TextOutlet(attrName: string): any {
    return function (target: any, name: string) {
        $glue.newOutletTransformFunction(target, name, TextOutletTransformFunctionGenerator(attrName));
    }
}

function IntOutlet(attrName: string): any {
    return function (target: any, name: string) {
        $glue.newOutletTransformFunction(target, name, IntOutletTransformFunctionGenerator(attrName));
    }
}

function FloatOutlet(attrName: string): any {
    return function (target: any, name: string) {
        $glue.newOutletTransformFunction(target, name, FloatOutletTransformFunctionGenerator(attrName));
    }
}

function JsonOutlet(attrName: string): any {
    return function (target: any, name: string) {
        $glue.newOutletTransformFunction(target, name, JsonOutletTransformFunctionGenerator(attrName));
    }
}

function Base64JsonOutlet(attrName: string): any {
    return function (target: any, name: string) {
        $glue.newOutletTransformFunction(target, name, Base64JsonOutletTransformFunctionGenerator(attrName));
    }
}

export {
    $innerHtml,
    atobUtf8,
    TextOutlet,
    IntOutlet,
    FloatOutlet,
    JsonOutlet,
    Base64JsonOutlet
}