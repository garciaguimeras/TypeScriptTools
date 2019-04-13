# TypeScriptTools (TST)

Are you

- Fan of TypeScript?
- Bored of using jQuery on your web apps?
- Thinking that jQuery programming generates confusing and hard to maintain code?
- Needing/Wanting not to use Angular or React?

Ok, you can use **glue**!!

## glue Controllers

Suppose you need to manage a web page fragment like that:

``` html
<div id="person-form">
    Write your name:
    <input type="text" id="person-name" />
    <button id="accept-button">Accept</button>
</div>
```

Using **glue**, you could write some code like that:

``` ts
@Controller('person-form')
class PersonFormController {

    @Outlet('person-name')
    personName: Element;

    @Action('accept-button', 'click')
    onAcceptButtonClick() {
        let name = personName.getAttribute('value');
        console.log('Person name is ' + name);
    }

}
```

You can add some jQuery flavour to your code, including **glue-jquery**:

``` ts
@Controller('person-form')
class PersonFormController {

    @JQueryOutlet()
    @Outlet('person-name')
    personName: JQuery;

    @Action('accept-button', 'click')
    onAcceptButtonClick() {
        let name = personName.val();
        console.log('Person name is ' + name);
    }

}
```

Do you need to use another controller's instance on your code?

``` ts
@Controller('foo')
class FooController {
    ...
}

@Controller('bar')
class BarController {
    ...
    @Inject('foo')
    foo: FooController;
    ...
}
```

And if you need to capture the on-load event?

``` ts
@Controller('foo')
class FooController {
    ...
    @LoadMethod()
    didLoad() {
        ...
    }
    ...
}

```

## glue Templates

You can create a controller template using TSX, including the **react-jsx-polyfill**:

``` tsx
let template: Element = (
    <div>
        Write your name:
        <input type="text" id="person-name" />
        <button id="accept-button">Accept</button>
    </div>
)
```

``` ts
@Template(template)
class PersonFormTemplate {

    @Outlet('person-name')
    personName: Element;

    someData: string;

    @Action('accept-button', 'click')
    onAcceptButtonClick() {
        let name = personName.getAttribute('value');
        console.log('Person name is ' + name);
    }

}
```

Inject it dynamically into the DOM using **glue-methods**:

``` ts
GlueMethods.templateToController(parentController, PersonFormTemplate, 'person-form', 'parent-div');
```

or

``` ts
GlueMethods.templateToController('parent-controller-id', PersonFormTemplate, 'person-form', 'parent-div');
```

or even injecting it somo initialization data

``` ts
var params = {  
    someData: 'some value'    
}
GlueMethods.templateToController(parentController, PersonFormTemplate, 'person-form', 'parent-div', params);
```

and remove the controller dynamically from DOM:

``` ts
GlueMethods.removeController('person-form');
```

## Using glue with require.js

Include require.js on your web page:

``` html
<script src="require.js" data-main="require-main"></script>
```

In your main script, write something like that:

``` js
var requirements = ['glue', 'my-controller'];
require(requirements, function (glue) {
    glue.$glue.bootstrap();
});
```