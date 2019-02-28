// TODO:
//    - glue-data -> select, ? / glue-repeat ?
//    + glue-onchange
//    + glue-onclick
//    - glue-class
//    - glue-value -> radiobuttons ?
//    + expresiones 

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
    scope: any;
    textTemplateNodes: Array<TextTemplate>;
}

interface Context {
    scope: any;
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
                    let result = expr.eval(decl.scope, decl.scope);
                    result = result ? result : '';
                    template = template.replace(elem, result);
                });
            }
            nodeTemplate.node.textContent = template;
        });
    }

    private bindTextTemplates(decl: ControllerDecl) {
        let templates: Array<TextTemplate> = [];
        this.traverseDOM(decl.element, node => {
            if (node.textContent && node.nodeType == 3) {
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
        this.applyDeclaredValues(decl);
    }

    private bindController(decl: ControllerDecl) {
        if (decl.instance != null)
            return;

        let refs = this.metaControllers.filter(elem => elem.name == decl.name);
        if (refs.length == 0)
            return;

        let context: Context = { scope: decl.scope };
        decl.instance = Object.create(refs[0].clazz.prototype);
        decl.instance.constructor.apply(decl.instance, [context]);
    }

    private onValueChanged(decl: ControllerDecl, elem: Element) {
        let attr = elem.getAttribute('glue-value');
        let properties = Object.keys(decl.scope);
        let exists = properties.some(p => p == attr);
        if (attr && exists) {
            decl.scope[attr] = elem.getAttribute('value');
            this.applyChanges(decl);
        }
    }

    private applyDeclaredValues(decl: ControllerDecl) {
        let elements = decl.element.querySelectorAll('[glue-value]');
        if (elements.length == 0)
            return;

        let properties = Object.keys(decl.scope);
        for (var i = 0; i < elements.length; i++) {
            let elem = elements.item(i);
            let attr = elem.getAttribute('glue-value');
            let exists = properties.some(p => p == attr);
            if (attr && exists) {
                elem.setAttribute('value', decl.scope[attr]);
            }
        }
    }

    private bindDeclaredValues(decl: ControllerDecl) {
        let elements = decl.element.querySelectorAll('[glue-value]');
        if (elements.length == 0)
            return;

        let self = this;
        for (var i = 0; i < elements.length; i++) {
            let elem = elements.item(i);
            elem.addEventListener('change', () => {
                this.onValueChanged(decl, elem);
            });
            elem.addEventListener('input', () => {
                this.onValueChanged(decl, elem);
            });
        }
    }

    private bindDeclaredCallbacks(decl: ControllerDecl, attrName: string, eventName: string) {
        let elements = decl.element.querySelectorAll('[' + attrName + ']');
        if (elements.length == 0)
            return;

        let self = this;
        for (var i = 0; i < elements.length; i++) {
            let elem = elements.item(i);
            let methodName = elem.getAttribute(attrName) || '';
            elem.addEventListener(eventName, () => {
                self.callMethod(decl, methodName, [ elem ]);
                self.applyChanges(decl);
            });
        }
    }

    private bindEvents(decl: ControllerDecl) {
        this.bindDeclaredCallbacks(decl, 'glue-onchange', 'change');
        this.bindDeclaredCallbacks(decl, 'glue-onclick', 'click');
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
                scope: {},
                textTemplateNodes: []
            };
            this.bindController(decl);
            this.bindTextTemplates(decl);
            this.bindDeclaredValues(decl);
            this.bindEvents(decl);
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

export let $glue = new Glue();