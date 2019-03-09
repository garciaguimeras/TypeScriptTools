import { $glue } from './glue';


interface GlueDOMTemplate {
    root: Element;
}

class GlueMethods {

    static getControllerDOMTemplate(name: string): GlueDOMTemplate | null {
        let controller = $glue.getController(name);
        if (controller == null)
            return null;

        let elem = controller.element.cloneNode(true) as Element;
        elem.removeAttribute('id');
        return {
            root: elem
        };
    }

    static cloneControllerIntoParent(template: GlueDOMTemplate, clazz: any): any {
        let list = $glue.getControllers(clazz);
        if (list.length == 0)
            return;
        let controller = list[0];
        let clonedName = controller.name + '-' + list.length.toString();

        let elem = template.root.cloneNode(true) as Element;
        elem.removeAttribute('id');
        elem.setAttribute('id', clonedName);
        if (controller.element.parentElement)
            controller.element.parentElement.appendChild(elem);

        let newController = $glue.newController(clonedName, controller.clazz);
        return newController ? newController.instance : null;
    }

    static removeController(name: string) {
        let controller = $glue.getController(name);
        if (controller == null)
            return;

        if (controller.element.parentElement)
            controller.element.parentElement.removeChild(controller.element);
        $glue.removeController(name);
    }

}

export { GlueMethods, GlueDOMTemplate };