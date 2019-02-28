/*
    expr -> expr.expr
    expr -> string
    expr -> number
    expr -> string[number]
*/

interface Expr {
    _debug(): string;
    eval(scope: any, baseScope?: any): any;
}

class PropertyExpr implements Expr {

    leftExpr: Expr;
    rightExpr: Expr;

    constructor(leftExpr: Expr, rightExpr: Expr) {
        this.leftExpr = leftExpr;
        this.rightExpr = rightExpr;
    }

    _debug(): string {
        return this.leftExpr._debug() + ' . ' + this.rightExpr._debug();
    }

    eval(scope: any, baseScope?: any): any {
        if (!baseScope)
            baseScope = scope;
        if (!scope)
            return null;

        let leftEval = this.leftExpr.eval(scope, baseScope);
        if (!leftEval)
            return null;

        return this.rightExpr.eval(leftEval, baseScope);
    }

}

class ArrayItemExpr implements Expr {

    propertyName: string;
    indexExpr: Expr;

    constructor(propertyName: string, indexExpr: Expr) {
        this.propertyName = propertyName;
        this.indexExpr = indexExpr;
    }

    _debug(): string {
        return this.propertyName + ' [ ' + this.indexExpr._debug() + ' ] ';
    }

    eval(scope: any, baseScope?: any): any {
        if (!baseScope)
            baseScope = scope;
        if (!scope)
            return null;

        if (!scope[this.propertyName])
            return null;

        let indexEval = this.indexExpr.eval(baseScope, baseScope);
        return scope[this.propertyName][indexEval];
    }

}

class NumberExpr implements Expr {

    value: number;

    constructor(value: number) {
        this.value = value;
    }

    _debug(): string {
        return '(' + this.value.toString() + ')';
    }

    eval(scope: any, baseScope?: any): any {
        return this.value;
    }
}

class StringExpr implements Expr {

    value: string;

    constructor(value: string) {
        this.value = value;
    }

    _debug(): string {
        return '(' + this.value + ')';
    }

    eval(scope: any, baseScope?: any): any {
        if (!scope)
            return null;
        return scope[this.value];
    }
}

class ExprParser {

    private getFirstLevelZeroIndexOfDot(text: string) {
        let level = 0;
        for (let i = 0; i < text.length; i++) {
            let c = text.charAt(i);
            if (c == '.' && level == 0)
                return i;
            if (c == '[')
                level++;
            if (c == ']')
                level--;
        }
        return -1;
    }

    parse(text: string): Expr {
        let index = this.getFirstLevelZeroIndexOfDot(text);
        if (index >= 0) {
            let expr1 = this.parse(text.substr(0, index));
            let expr2 = this.parse(text.substr(index + 1));
            return new PropertyExpr(expr1, expr2);
        }

        let index2 = text.indexOf('[');
        let index3 = text.indexOf(']');
        if (index2 >= 1 && index3 > index2) {
            let name = text.substr(0, index2);
            let arrayIndex = text.substring(index2 + 1, index3);
            let indexExpr = this.parse(arrayIndex);
            return new ArrayItemExpr(name, indexExpr);
        }

        let numberRegexp: RegExp = /^[\d]+$/;
        if (numberRegexp.test(text)) {
            let value: number = parseInt(text);
            return new NumberExpr(value);
        }

        return new StringExpr(text);
    }

}

export { Expr, ExprParser };