import { Expr, ExprParser } from './expr';

interface Reference {
    name: string;
    clazz: any;
}

interface TextTemplate {
    node: Node;
    template: string;
}

interface ControllerDecl {
    name: string;
    element: Element;
    instance: any;
    textTemplateNodes: Array<TextTemplate>;
}

class Glue {

    metaControllers: Array<Reference> = [];
    regexp: RegExp = /\{\{\s*([\w\W\d\D]+)\s*\}\}/g;

    // Private methods

    private traverseDOM(node: Node, callbackFn: (node: Node) => void) {
        if (callbackFn)
            callbackFn(node);

        for (let i = 0; i < node.childNodes.length; i++) {
            let child = node.childNodes.item(i);
            this.traverseDOM(child, callbackFn);
        }
    }

    private applyTextTemplate(decl: ControllerDecl) {
        decl.textTemplateNodes.forEach(nodeTemplate => {
            let template = nodeTemplate.template;
            let matches = template.match(this.regexp);
            if (matches) {
                matches.forEach(elem => {
                    let text = elem.substr(2, elem.length - 4).trim();
                    let parser = new ExprParser();
                    let expr = parser.parse(text);
                    let result = expr.eval(decl.instance, decl.instance);
                    if (result != null)
                        template = template.replace(elem, result);
                });
            }
            nodeTemplate.node.textContent = template;
        });
    }

    private bindTextTemplates(decl: ControllerDecl) {
        let templates: Array<TextTemplate> = [];
        this.traverseDOM(decl.element, node => {
            if (node.nodeType == 3 && node.textContent) {
                let matches = node.textContent.match(this.regexp);
                if (matches && matches.length > 0)
                    templates.push({ node: node, template: node.textContent });
            }
        });
        decl.textTemplateNodes = templates;
    }

    private callMethod(decl: ControllerDecl, methodName: string, params: Array<any>) {
        if (decl.instance[methodName]) {
            decl.instance[methodName].apply(decl.instance, params);
            this.applyChanges(decl);
        }
    }

    private applyChanges(decl: ControllerDecl) {
        this.applyTextTemplate(decl);
    }

    private bindController(decl: ControllerDecl) {
        if (decl.instance != null)
            return;

        let refs = this.metaControllers.filter(elem => elem.name == decl.name);
        if (refs.length == 0)
            return;

        decl.instance = Object.create(refs[0].clazz.prototype);
        decl.instance.constructor.apply(decl.instance, []);
    }

    private bindContext(decl: ControllerDecl) {
        let elements = decl.element.querySelectorAll('[id]');
        if (elements.length == 0)
            return;

        let properties = Object.keys(decl.instance);
        for (var i = 0; i < elements.length; i++) {
            let elem = elements.item(i);
            let id = elem.getAttribute('id');
            if (id) {
                let exists = properties.some(p => p === id);
                if (exists)
                    decl.instance[id] = elem;
            }
        }
    }

    private bindOutlets(decl: ControllerDecl) {
        this.bindTextTemplates(decl);
        this.bindContext(decl);
    }

    private bindActions(decl: ControllerDecl) {
        let self = this;

        let elements = decl.element.querySelectorAll('*');
        for (let i = 0; i < elements.length; i++) {
            let elem = elements.item(i);

            for (let j = 0; j < elem.attributes.length; j++) {
                let attr = elem.attributes.item(j);

                if (attr && attr.name.indexOf('glue-on') == 0) {
                    let eventName = attr.name.substr(7);
                    let methodName = attr.value;
                    elem.addEventListener(eventName, () => {
                        self.callMethod(decl, methodName, [elem]);
                        self.applyChanges(decl);
                    });
                }
            }
        }
    }

    private getDeclaredControllers(): Array<ControllerDecl> {
        let elements = document.querySelectorAll('[glue-controller]');
        if (elements.length == 0)
            return [];

        let list: Array<ControllerDecl> = [];
        for (var i = 0; i < elements.length; i++) {
            let elem = elements.item(i);
            let attr = elem.getAttribute('glue-controller') || '';
            let decl: ControllerDecl = {
                name: attr,
                element: elem,
                instance: null,
                textTemplateNodes: []
            };
            this.bindController(decl);
            this.bindOutlets(decl);
            this.bindActions(decl);
            this.applyChanges(decl);
            list.push(decl);
        }
        return list;
    }

    // Public methods

    controller(name: string, clazz: any) {
        let exists = this.metaControllers.some(elem => elem.name == name);
        if (exists)
            return Error('Controller name already in use: ' + name);
        this.metaControllers.push({ name: name, clazz: clazz });
    }

    bootstrap() {
        console.log('Applying glue...');
        this.getDeclaredControllers().forEach(decl => {
            this.applyChanges(decl);
        });
    }

}

function Outlet(target: any) {
    target.__metadata__ = { type: 'outlet' };
    return target;
}

function Action(target: any) {
    target.__metadata__ = { type: 'action' };
    return target;
}

function Controller(name: string) {
    return function (target: any) {
        $glue.controller(name, target);
        return target;
    }
}

let $glue = new Glue();

export { $glue, Outlet, Action, Controller };