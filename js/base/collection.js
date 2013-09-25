define(['base/app','base/model'], function(baseApp, BaseModel) {

    var BaseCollection = Backbone.Collection.extend({
        model: BaseModel
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




    var setupFilters = function(){
        var collection = this;
        var filtersIndex={

        }

        collection.addFilter = function(filterConfig){
            var hash = baseApp.getHash(filterConfig);
            filtersIndex[hash] = filterConfig;
        }

        collection.removeFilter = function(filterConfig){
            var hash = baseApp.getHash(filterConfig);
            var filter = filtersIndex[hash];
            if(filter){
                delete filtersIndex[hash];
            }else{
                throw new Error('Filter missing');
            }
        }

        collection.filteredEach = function(obj, iterator, context){
            var filtersArray = _.values(filtersIndex);
            for(var i= 0, len = obj.length; i<len; i++){
                var model = obj.at(i);
                if(model.checkFilters(filtersArray)){
                    iterator.call(context||model);
                };
            }
        }
    }


    var setupPagination = function(){
        var collection = this;
        var curPage =  0;

    }

    return BaseCollection;
});
