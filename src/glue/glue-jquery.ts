import { $glue, OutletTransformFunction } from './glue';

type BeforeShowDayResult = [boolean, string];

enum DatePickerLanguage {
    EN,
    ES
}

enum DatePickerFormat {
    EN = 'mm/dd/yy',
    ES = 'dd/mm/yy'
}

interface DatePickerOptions {
    date?: Date;
    minDate?: Date;
    maxDate?: Date;
    dateFormat?: string;
    onSelect?: (d: Date) => void;
    beforeShowDay?: (d: Date) => BeforeShowDayResult;
    language: DatePickerLanguage;
}

let JQueryOutletTransformFunction: OutletTransformFunction = function (target: Element): JQuery {
    return $(target);
}

function configureDatePicker(jqTarget: JQuery, options: DatePickerOptions) {

    let dayNamesMin = function (): string[] {
        if (options.language == DatePickerLanguage.EN)
            return ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    }

    let monthNames = function (): string[] {
        if (options.language == DatePickerLanguage.EN)
            return ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
        return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
            'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    }

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

    jqTarget.datepicker('option', 'dayNamesMin', dayNamesMin());
    jqTarget.datepicker('option', 'monthNames', monthNames());
}

function DatePickerOutletTransformFunctionGenerator(options: DatePickerOptions): OutletTransformFunction {

    let DatePickerOutletTransformFunction: OutletTransformFunction = function (target: Element): JQuery {
        let jqTarget = $(target);
        configureDatePicker(jqTarget, options);
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

interface SliderOptions {
    min: number;
    max: number;
    values: [number, number];
    slide?: () => void;
    change?: () => void;
}

function configureSlider(jqTarget: JQuery, options: SliderOptions) {
    jqTarget.slider({
        range: true,
        min: options.min,
        max: options.max,
        values: options.values,
        slide: options.slide,
        change: options.change
    });
}

function SliderOutletTransformFunctionGenerator(options: SliderOptions): OutletTransformFunction {

    let SliderOutletTransformFunction: OutletTransformFunction = function (target: Element): JQuery {
        let jqTarget = $(target);
        configureSlider(jqTarget, options);
        return jqTarget;
    }
    return SliderOutletTransformFunction;
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

function SliderOutlet(options: SliderOptions): any {
    return function (target: any, name: string) {
        $glue.newOutletTransformFunction(target, name, SliderOutletTransformFunctionGenerator(options));
    }
}

export { 
    JQueryOutlet, 
    DatePickerOutlet, 
    DatePickerOptions, 
    BeforeShowDayResult, 
    DatePickerLanguage,
    DatePickerFormat,
    configureDatePicker,
    Select2Outlet,
    SliderOptions,
    configureSlider,
    SliderOutlet
};