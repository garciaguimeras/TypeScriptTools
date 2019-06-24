type ValidationMethod = (value: string) => boolean;
type WarningTextMethod = (text: string) => Element;

interface Validation {
    validationMethod: ValidationMethod;
    text: string
}

class FormValidator {

    element: Element | null;
    validations: Array<Validation>;
    warningTextMethod: WarningTextMethod;

    constructor(elementName: string, validations: Array<Validation>, warningTextMethod: WarningTextMethod) {
        this.element = document.querySelector('#' + elementName);
        this.validations = validations;
        this.warningTextMethod = warningTextMethod;
    }

    private appendWarningText(elem: Element, parentElem: Element) {
        var jqElem = $(elem);
        jqElem.attr('id', 'warning-text');
        $(parentElem).append(jqElem);
    }

    validate(): boolean {
        let self = this;

        if (!this.element)
            return true;

        let parent = this.element.parentElement;
        if (!parent)
            return true;

        let warningText = parent.querySelector('#warning-text');
        if (warningText) {
            warningText.remove();
        }

        let text = '';
        this.validations.forEach(v => {
            if (!self.element)
                return;

            let isValid = v.validationMethod($(self.element).val());
            if (!isValid) {
                text += (text.length > 0 ? ' ' : '') + v.text;
            }
        });

        if (text) {
            let warningElement = this.warningTextMethod(text);
            this.appendWarningText(warningElement, parent);
            return false;
        }

        return true;
    }

}

class CommonValidationMethods {

    static notEmpty(value: string): boolean {
        return !!value;
    }

    static isEmail(value: string): boolean {
        var regexp = /^[a-z0-9!#$%&'*+\/=?^_`{|}~.-]+@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;
        return regexp.test(value);
    }

}

export {
    FormValidator, 
    Validation, 
    ValidationMethod,
    CommonValidationMethods,
    WarningTextMethod
}