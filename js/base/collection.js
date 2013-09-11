define([ 'base/model'],function(BaseModel){

    var BaseCollection = Backbone.Collection.extend({
        model:BaseModel
    });

    return BaseCollection;
});