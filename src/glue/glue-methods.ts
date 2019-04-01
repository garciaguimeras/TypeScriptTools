import { $glue } from './glue';

class GlueMethods {

    static getControllerInstances(clazz: any): Array<any> {
        return $glue.getControllers(clazz).map<any>(c => c.instance);
    }

    static getControllerCount(clazz: any): number {
        return $glue.getControllers(clazz).length;
    }

    static removeController(name: string) {
        let controller = $glue.getController(name);
        if (controller == null)
            return;

        if (controller.element.parentElement)
            controller.element.parentElement.removeChild(controller.element);
        $glue.removeController(name);
    }

    static templateToController(parentControllerName: string, templateClazz: any, id: string, parentId: string, initAttributes?: any): any {
        let controller = $glue.getController(parentControllerName);
        if (!controller)
            return;

        let template = $glue.getTemplate(templateClazz);
        if (!template)
            return;

        let parentElement = controller.element.querySelector('#' + parentId);
        if (!parentElement)
            return;

        let elem = template.element.cloneNode(true) as Element;
        elem.removeAttribute('id');
        elem.setAttribute('id', id);
        parentElement.appendChild(elem);

        let newController = $glue.newController(id, template.clazz);
        if (!newController)
            return;
            
        $glue.populateController(newController, initAttributes);
        $glue.notifyLoad(newController);

        return newController.instance;
    }

}

export {
    GlueMethods
};