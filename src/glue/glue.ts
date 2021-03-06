﻿import { Expr, ExprParser } from './expr';

type OutletTransformFunction = (target: any) => any;

const $self: string = "$self";

enum MetadataType {
    Outlet,
    Action,
    Inject,
    LoadMethod,
    BeforeAppLoadMethod,
    AfterAppLoadMethod
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
    beforeAppLoadMethod: LoadMethodMetadata;
    afterAppLoadMethod: LoadMethodMetadata;
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
    isApplication: boolean;
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
            let elem = (o.id == $self || o.id == decl.name) ? decl.element : decl.element.querySelector('#' + o.id);
            if (elem) {

                // Run transformation chain
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
            let elem = (a.id == $self || a.id == decl.name) ? decl.element : decl.element.querySelector('#' + a.id);
            if (elem) {
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

    private createController(id: string, elem: Element, isApplication: boolean, clazz: any): ControllerDecl {
        elem.setAttribute('id', id);
        let decl: ControllerDecl = {
            name: id,
            clazz: clazz,
            element: elem,
            instance: null,
            isApplication: isApplication,
            stringTemplateNodes: []
        };

        return decl;
    }

    private createControllerFromId(id: string, isApplication: boolean, clazz: any): ControllerDecl | null {
        let elements = document.querySelectorAll('#' + id);
        if (elements.length == 0)
            return null;

        let elem = elements.item(0);
        return this.createController(id, elem, isApplication, clazz);
    }

    private executeLoadMethod(decl: ControllerDecl, methodMetadata: LoadMethodMetadata) {
        if (methodMetadata && methodMetadata.methodName) {
            let methodName = methodMetadata.methodName;
            if (decl.instance[methodName]) {
                decl.instance[methodName].apply(decl.instance, []);
            }
        }
    }

    // Public methods

    bootstrap() {
        // Before app load
        let app = this.controllers.find(elem => elem.isApplication);
        let appMetadata = app ? this.getMetadata(app) : null;
        if (app && appMetadata) {
            this.populateController(app);
            this.executeLoadMethod(app, appMetadata.beforeAppLoadMethod);
            this.executeLoadMethod(app, appMetadata.loadMethod);
        }

        // Load controllers
        this.controllers.filter(elem => !elem.isApplication).forEach(decl => {
            if (!decl.instance) {
                this.populateController(decl);
            }

            let metadata = this.getMetadata(decl);
            this.executeLoadMethod(decl, metadata.loadMethod);
        });

        // After app load
        if (app && appMetadata) {
            this.executeLoadMethod(app, appMetadata.afterAppLoadMethod);
        }
    }

    notifyLoad(decl: ControllerDecl) {
        if (!decl) {
            return;
        }
        let metadata = this.getMetadata(decl);
        this.executeLoadMethod(decl, metadata.loadMethod);
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

    newController(id: string, isApplication: boolean, clazz: any): ControllerDecl | null {
        let exists = this.controllers.some(elem => elem.name == id);
        if (exists)
            return null;

        if (isApplication) {
            exists = this.controllers.some(elem => elem.isApplication);
            if (exists)
                return null;
        }

        let decl = this.createControllerFromId(id, isApplication, clazz);
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
        let decl = this.createController('', elem, false, clazz);
        this.templates.push(decl);
        return decl; 
    }

    newMetadata(clazz: any, type: MetadataType, data: any) {
        if (!clazz.__metadata__) {
            clazz.__metadata__ = { 
                outlets: [], 
                actions: [], 
                references: [], 
                loadMethod: { methodName: '' },
                beforeAppLoadMethod: { methodName: '' },
                afterAppLoadMethod: { methodName: '' },
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

        if (type == MetadataType.BeforeAppLoadMethod) {
            clazz.__metadata__.beforeAppLoadMethod = data;
        }

        if (type == MetadataType.AfterAppLoadMethod) {
            clazz.__metadata__.afterAppLoadMethod = data;
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

function BeforeAppLoadMethod(): any {
    return function (target: any, name: string) {
        $glue.newMetadata(target, MetadataType.BeforeAppLoadMethod, { methodName: name });
    };
}

function AfterAppLoadMethod(): any {
    return function (target: any, name: string) {
        $glue.newMetadata(target, MetadataType.AfterAppLoadMethod, { methodName: name });
    };
}

function Controller(id: string): any {
    return function (target: any) {
        $glue.newController(id, false, target);
    };
}

function Template(elem: Element): any {
    return function (target: any) {
        $glue.newTemplate(elem, target);
    };
}

function Application(id: string): any {
    return function (target: any) {
        $glue.newController(id, true, target);
    };
}

let $glue = new Glue();

export { 
    $glue, 
    $self,
    OutletTransformFunction, 
    Outlet, 
    Action, 
    Inject, 
    LoadMethod, 
    BeforeAppLoadMethod,
    AfterAppLoadMethod,
    Controller,
    Template,
    Application
};