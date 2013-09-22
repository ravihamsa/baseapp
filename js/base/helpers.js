define(['base/app'], function(app) {

    Handlebars.registerHelper('elementLabel', function(element) {
        return element.label || element.name;
    });

    Handlebars.registerHelper('stringify', function(obj) {
        return JSON.stringify(obj);
    });

    Handlebars.registerHelper('toggleClass', function(attributeName) {

        if (this[attributeName]) {
            return attributeName;
        }
    });

    Handlebars.registerHelper('ifEqual', function(val1, val2, obj) {

        if (val1 === val2) {
            return obj.fn(this);
        }
        else if (obj.inverse) {
            return obj.inverse(this);
        }
    });




});
