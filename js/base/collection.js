define(['base/app', 'base/model'], function (baseApp, BaseModel) {

    var BaseCollection = Backbone.Collection.extend({
        model: BaseModel,
        constructor: function (array, options) {
            var _this = this;
            _this.options = options || {};
            Backbone.Collection.apply(_this, arguments);

        },
        getOption: function (option) {
            //console.log(option, this.options[option],this[option]);
            return this.options[option] || this[option];
        },
        moveTo: function (model1Id, model2Id, position) {
            var index1 = this.get(model1Id).index();
            var index2 = this.get(model2Id).index();

            var delta;
            if (index1 < index2) {
                delta = position === 'after' ? 0 : -1;
            } else {
                delta = position === 'before' ? 0 : -1;
            }
            index2 += delta;
            var model1 = this.models.splice(index1, 1)[0];
            this.models.splice(index2, 0, model1);
            //this.swapModels(index1, index2);
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
