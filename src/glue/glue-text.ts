import { $glue } from './glue';

function TextOutletTransformFunction(target: Element): string {
    let text = target.getAttribute('value') || '';
    return text;
}

function JsonOutletTransformFunction(target: Element): any {
    let text = target.getAttribute('value') || '';
    let obj: any = null;
    try {
        obj = JSON.parse(text);
    }
    catch { }
    return obj
}

function TextOutlet(): any {
    return function (target: any, name: string) {
        $glue.newOutletTransformFunction(target, name, TextOutletTransformFunction);
    }
}

function JsonOutlet(): any {
    return function (target: any, name: string) {
        $glue.newOutletTransformFunction(target, name, JsonOutletTransformFunction);
    }
}

export {
    TextOutlet,
    JsonOutlet
}