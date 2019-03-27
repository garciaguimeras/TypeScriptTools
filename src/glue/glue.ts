import { Expr, ExprParser } from './expr';

type OutletTransformFunction = (target: any) => any;

enum MetadataType {
    Outlet,
    Action,
    Inject,
    LoadMethod
}

interface OutletMetadata {
    id: string;
    outletName: string;
    transformChain: Array<OutletTransformFunction>
}

interface ActionMetadata {
    id: string;
    event: string;
    actionName: string;
}

interface InjectMetadata {
    ref: string,
    propertyName: string
}

interface LoadMethodMetadata {
    methodName: string;
}

interface Metadata {
    outlets: Array<OutletMetadata>;
    actions: Array<ActionMetadata>;
    references: Array<InjectMetadata>;
    loadMethod: LoadMethodMetadata;
}

interface StringTemplate {
    node: Node;
    template: string;
}

interface ControllerDecl {
    name: string;
    clazz: any;
    element: Element;
    instance: any;
    stringTemplateNodes: Array<StringTemplate>;
}

class Glue {

    controllers: Array<ControllerDecl> = [];
    templates: Array<ControllerDecl> = [];
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

    private applyStringTemplate(decl: ControllerDecl) {
        decl.stringTemplateNodes.forEach(nodeTemplate => {
            let template = nodeTemplate.template;
            let matches = template.match(this.regexp);
            if (matches) {
                matches.forEach(elem => {
                    let text = elem.substr(2, elem.length - 4).trim();
                    let parser = new ExprParser();
                    let expr = parser.parse(text);
                    let result = expr.eval(decl.instance);
                    if (result != null)
                        template = template.replace(elem, result);
                });
            }
            nodeTemplate.node.textContent = template;
        });
    }

    private bindStringTemplates(decl: ControllerDecl) {
        let templates: Array<StringTemplate> = [];
        this.traverseDOM(decl.element, node => {
            if (node.nodeType == 3 && node.textContent) {
                let matches = node.textContent.match(this.regexp);
                if (matches && matches.length > 0)
                    templates.push({ node: node, template: node.textContent });
            }
        });
        decl.stringTemplateNodes = templates;
    }

    private callMethod(decl: ControllerDecl, methodName: string, params: Array<any>) {
        if (decl.instance[methodName]) {
            decl.instance[methodName].apply(decl.instance, params);
            this.applyChanges(decl);
        }
    }

    private applyChanges(decl: ControllerDecl) {
        this.applyStringTemplate(decl);
    }

    private bindController(decl: ControllerDecl) {
        if (decl.instance != null)
            return;

        decl.instance = Object.create(decl.clazz.prototype);
        decl.instance.constructor.apply(decl.instance, []);
    }

    private getMetadata(decl: ControllerDecl): Metadata {
        let metadata = decl.clazz.prototype.__metadata__;
        if (!metadata)
            metadata = { outlets: [], actions: [], references: [], loadMethod: '' };
        return metadata as Metadata;
    }

    private bindContext(decl: ControllerDecl) {
        let outlets = this.getMetadata(decl).outlets;
        outlets.forEach(o => {
            let elements = decl.element.querySelectorAll('#' + o.id);
            if (elements.length > 0) {
                let elem: any = elements[0];

                o.transformChain.forEach(fn => {
                    elem = fn(elem);
                });

                decl.instance[o.outletName] = elem;
            }
        });
    }

    private bindOutlets(decl: ControllerDecl) {
        this.bindStringTemplates(decl);
        this.bindContext(decl);
    }

    private bindAttributes(decl: ControllerDecl, initAttributes: any) {
        Object.keys(initAttributes).forEach(attrName => {
            let attrValue = initAttributes[attrName];
            decl.instance[attrName] = attrValue;
        });
    }

    private bindActions(decl: ControllerDecl) {
        let self = this;

        let actions = this.getMetadata(decl).actions;
        actions.forEach(a => {
            let elements = decl.element.querySelectorAll('#' + a.id);
            if (elements.length > 0) {
                let elem = elements[0];
                elem.addEventListener(a.event, () => {
                    self.callMethod(decl, a.actionName, [elem, decl.name]);
                    self.applyChanges(decl);
                });
            }
        });
    }

    private bindReferences(decl: ControllerDecl) {
        let self = this;

        let references = this.getMetadata(decl).references;
        references.forEach(r => {
            if (decl.instance[r.propertyName] == null) {
                let list = self.controllers.filter(c => c.name == r.ref);
                if (list.length > 0) {
                    if (!list[0].instance)
                        self.populateController(list[0]);
                    decl.instance[r.propertyName] = list[0].instance;
                }
            }
        });
    }

    private createController(id: string, elem: Element, clazz: any): ControllerDecl {
        elem.setAttribute('id', id);
        let decl: ControllerDecl = {
            name: id,
            clazz: clazz,
            element: elem,
            instance: null,
            stringTemplateNodes: []
        };

        return decl;
    }

    private createControllerFromId(id: string, clazz: any): ControllerDecl | null {
        let elements = document.querySelectorAll('#' + id);
        if (elements.length == 0)
            return null;

        let elem = elements.item(0);
        return this.createController(id, elem, clazz);
    }

    // Public methods

    bootstrap() {
        this.controllers.forEach(decl => {
            if (!decl.instance) {
                this.populateController(decl);
            }
            this.notifyLoad(decl);
        });
    }

    notifyLoad(decl: ControllerDecl) {
        if (!decl)
            return;

        let metadata = this.getMetadata(decl);
        if (metadata.loadMethod && metadata.loadMethod.methodName) {
            let methodName = metadata.loadMethod.methodName;
            if (decl.instance[methodName]) {
                decl.instance[methodName].apply(decl.instance, []);
            }
        }
    }

    getController(name: string): ControllerDecl | null {
        let elements = this.controllers.filter(elem => elem.name == name);
        if (elements.length == 0)
            return null;
        return elements[0];
    }

    getControllers(clazz: any): Array<ControllerDecl> {
        let elements = this.controllers.filter(elem => elem.clazz === clazz);
        return elements;
    }

    removeController(name: string) {
        let tmp: Array<ControllerDecl> = [];
        this.controllers.forEach(elem => {
            if (elem.name != name) {
                tmp.push(elem);
            }
        });
        this.controllers = tmp;
    }

    newController(id: string, clazz: any): ControllerDecl | null {
        let exists = this.controllers.some(elem => elem.name == id);
        if (exists)
            return null;
            
        let decl = this.createControllerFromId(id, clazz);
        if (!decl)
            return null;

        this.controllers.push(decl);  
        return decl;   
    }

    populateController(decl: ControllerDecl, initAttributes?: any) {
        this.bindController(decl);
        this.bindOutlets(decl);
        this.bindActions(decl);
        this.bindReferences(decl);
        if (initAttributes) {
            this.bindAttributes(decl, initAttributes);
        }
        this.applyChanges(decl);
    }

    getTemplate(clazz: any): ControllerDecl | null {
        let elements = this.templates.filter(elem => elem.clazz === clazz);
        return elements.length > 0 ? elements[0] : null;
    }

    newTemplate(elem: Element, clazz: any): ControllerDecl {
        let decl = this.createController('', elem, clazz);
        this.templates.push(decl);
        return decl; 
    }

    newMetadata(clazz: any, type: MetadataType, data: any) {
        if (!clazz.__metadata__) {
            clazz.__metadata__ = { 
                outlets: [], 
                actions: [], 
                references: [], 
                loadMethod: { methodName: '' } 
            } as Metadata;
        }

        if (type == MetadataType.Outlet) {
            clazz.__metadata__.outlets.push(data);
        }

        if (type == MetadataType.Action) {
            clazz.__metadata__.actions.push(data);
        }

        if (type == MetadataType.Inject) {
            clazz.__metadata__.references.push(data);
        }

        if (type == MetadataType.LoadMethod) {
            clazz.__metadata__.loadMethod = data;
        }
    }

    newOutletTransformFunction(clazz: any, name: string, fn: OutletTransformFunction) {
        if (!clazz.__metadata__ || !clazz.__metadata__.outlets)
            return;

        let metadata = clazz.__metadata__ as Metadata;
        let list: Array<OutletMetadata> = metadata.outlets.filter(o => o.outletName == name);
        if (list.length == 0)
            return;

        let outlet = list[0];
        outlet.transformChain.push(fn);
    }

}

function Outlet(id: string): any {
    return function (target: any, name: string) {
        $glue.newMetadata(target, MetadataType.Outlet, { id: id, outletName: name, transformChain: [] });
    };
}

function Action(id: string, event: string): any {
    return function (target: any, name: string) {
        $glue.newMetadata(target, MetadataType.Action, { id: id, event: event, actionName: name });
    };
}

function Inject(ref: string): any {
    return function (target: any, name: string) {
        $glue.newMetadata(target, MetadataType.Inject, { ref: ref, propertyName: name });
    };
}

function LoadMethod(): any {
    return function (target: any, name: string) {
        $glue.newMetadata(target, MetadataType.LoadMethod, { methodName: name });
    };
}

function Controller(id: string): any {
    return function (target: any) {
        $glue.newController(id, target);
    };
}

function Template(elem: Element): any {
    return function (target: any) {
        $glue.newTemplate(elem, target);
    };
}

let $glue = new Glue();

export { 
    $glue, 
    OutletTransformFunction, 
    Outlet, 
    Action, 
    Inject, 
    LoadMethod, 
    Controller,
    Template
};