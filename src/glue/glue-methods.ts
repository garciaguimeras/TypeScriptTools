import { $glue } from './glue';

class GlueMethods {

    static getControllerInstances(clazz: any): Array<any> {
        return $glue.getControllers(clazz).map<any>(c => c.instance);
    }

    static getControllerNames(clazz: any): Array<string> {
        return $glue.getControllers(clazz).map<any>(c => c.name);
    }

    static getControllerCount(clazz: any): number {
        return $glue.getControllers(clazz).length;
    }

    static getNameFromInstance(clazz: any, instance: any): string | null {
        let controllers = $glue.getControllers(clazz).filter(c => c.instance == instance);
        if (controllers == null || controllers.length == 0)
            return null;
        return controllers[0].name;
    }

    static getInstanceFromName(clazz: any, name: string): any | null {
        let controllers = $glue.getControllers(clazz).filter(c => c.name == name);
        if (controllers == null || controllers.length == 0)
            return null;
        return controllers[0].instance;
    }

    static removeController(name: string) {
        let controller = $glue.getController(name);
        if (controller == null)
            return;

        if (controller.element.parentElement)
            controller.element.parentElement.removeChild(controller.element);
        $glue.removeController(name);
    }

    static removeControllerInstance(clazz: any, instance: any) {
        let controllers = $glue.getControllers(clazz).filter(c => c.instance == instance);
        if (controllers == null || controllers.length == 0)
            return;

        let controller = controllers[0];
        if (controller.element.parentElement)
            controller.element.parentElement.removeChild(controller.element);
        $glue.removeController(controller.name);
    }

    static templateToController(parentElement: string | Element, templateClazz: any, id: string, parentId: string, initAttributes?: any): any {
        let parent: Element | null = null;

        if (typeof parentElement === 'string') {
            let controller = $glue.getController(parentElement);
            if (!controller)
                return;
            parent = controller.element;
        }
        else
            parent = parentElement as Element;

        parent = parent.querySelector('#' + parentId);
        if (!parent)
            return;

        let template = $glue.getTemplate(templateClazz);
        if (!template)
            return;

        let elem = template.element.cloneNode(true) as Element;
        elem.removeAttribute('id');
        elem.setAttribute('id', id);
        parent.appendChild(elem);

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