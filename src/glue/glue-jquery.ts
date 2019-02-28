import { $glue, OutletTransformFunction } from './glue';

interface BeforeShowDayMethodResult {
    result: boolean,
    text: string
}

interface DatePickerOptions {
    date?: Date,
    minDate?: Date,
    maxDate?: Date,
    dateFormat?: string
    onSelect?: (d: Date) => void,
    beforeShowDay?: (d: Date) => BeforeShowDayMethodResult
}

let JQueryOutletTransformFunction: OutletTransformFunction = function (target: Element): JQuery {
    return $(target);
}

function DatePickerOutletTransformFunctionGenerator(options: DatePickerOptions): OutletTransformFunction {
    let DatePickerOutletTransformFunction: OutletTransformFunction = function (target: Element): JQuery {
        let jqTarget = $(target);
        jqTarget.datepicker();
        if (options && options.dateFormat)
            jqTarget.datepicker('option', 'dateFormat', options.dateFormat);
        if (options && options.date)
            jqTarget.val(options.date.valueOf());
        if (options && options.minDate)
            jqTarget.datepicker('option', 'minDate', options.minDate);
        if (options && options.maxDate)
            jqTarget.datepicker('option', 'maxDate', options.maxDate);
        if (options && options.beforeShowDay)
            jqTarget.datepicker('option', 'beforeShowDay', options.beforeShowDay);
        if (options && options.onSelect)
            jqTarget.datepicker('option', 'onSelect', options.onSelect);
        return jqTarget;
    }
    return DatePickerOutletTransformFunction;
}

function JQueryOutlet(): any {
    return function (target: any, name: string) {
        $glue.newOutletTransformFunction(target, name, JQueryOutletTransformFunction);
    };
}

function DatePickerOutlet(options: DatePickerOptions): any {
    return function (target: any, name: string) {
        $glue.newOutletTransformFunction(target, name, DatePickerOutletTransformFunctionGenerator(options));
    };
}

export { JQueryOutlet, DatePickerOutlet, DatePickerOptions };