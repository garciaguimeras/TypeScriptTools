import { $glue } from './glue';

class GlueMethods {

    static removeController(name: string) {
        let controller = $glue.getController(name);
        if (controller == null)
            return;

        if (controller.element.parentElement)
            controller.element.parentElement.removeChild(controller.element);
        $glue.removeController(name);
    }

    static templateToController(templateClazz: any, id: string, parentId: string, initAttributes?: any) {
        let template = $glue.getTemplate(templateClazz);
        if (!template)
            return;

        let parentElement = document.querySelector('#' + parentId);
        if (!parentElement)
            return;

        let elem = template.element.cloneNode(true) as Element;
        elem.removeAttribute('id');
        elem.setAttribute('id', id);
        parentElement.appendChild(elem);

        let controller = $glue.newController(id, template.clazz);
        if (!controller)
            return;
            
        $glue.populateController(controller, initAttributes);
        $glue.notifyLoad(controller);
    }

}

export {
    GlueMethods
};