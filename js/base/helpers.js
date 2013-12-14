define(['base/app'], function(app) {

    Handlebars.registerHelper('elementLabel', function(element) {
        return element.label || element.name;
    });

    var monthArr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


    Handlebars.registerHelper('string', function(str) {
        return app.getString(str);
    });

    Handlebars.registerHelper('monthName', function(month) {
        return monthArr[month];
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
