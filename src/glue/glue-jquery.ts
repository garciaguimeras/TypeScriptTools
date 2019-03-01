import { $glue, OutletTransformFunction } from './glue';

interface DatePickerOptions {
    date?: Date,
    minDate?: Date,
    maxDate?: Date,
    dateFormat?: string
    onSelect?: (d: Date) => void,
    beforeShowDay?: (d: Date) => Array<any>
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

function Select2OutletTransformFunction(target: Element): JQuery {
    let jqTarget = $(target);
    jqTarget.select2();
    jqTarget.select2({
        minimumResultsForSearch: Infinity
    });
    return jqTarget;
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

function Select2Outlet(): any {
    return function (target: any, name: string) {
        $glue.newOutletTransformFunction(target, name, Select2OutletTransformFunction);
    }
}

export { JQueryOutlet, DatePickerOutlet, DatePickerOptions, Select2Outlet };