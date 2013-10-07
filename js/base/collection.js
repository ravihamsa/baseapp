define(['base/app','base/model'], function(baseApp, BaseModel) {

    var BaseCollection = Backbone.Collection.extend({
        model: BaseModel,
        constructor: function (array, options) {
            var _this = this;
            _this.options = options || {};
            Backbone.Collection.apply(_this,arguments);

        },
        getOption: function (option) {
            //console.log(option, this.options[option],this[option]);
            return this.options[option] || this[option];
        }
    });


    /*

    Example Usage:
    var arr = [{name:'ravi kumar ravi', kam:'coding'}, {name:'john', kam:'going home'}]
    var coll = new BaseCollection();
    coll.addFilter({column:'name', expr:'eq', value:'ravi'})
    coll.addFilter({column:'name', expr:'startsWith', value:'ravi'})
    coll.addFilter({column:'name', expr:'endsWith', value:'ravi'})
    coll.addFilter({column:'name', expr:'has', value:'ravi'})
     */






    return BaseCollection;
});
