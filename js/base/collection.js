define(['base/app','base/model'], function(baseApp, BaseModel) {

    var BaseCollection = Backbone.Collection.extend({
        model: BaseModel,
        constructor: function (options) {
            var _this = this;
            _this.options = options || {};
            Backbone.Collection.call(_this, options);

            _.each(setupFunctions, function (func) {
                func.call(_this, {});
            });
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




    var setupFilters = function(){
        var collection = this;
        var sortKey = collection.getOption('sortKey') || 'name';
        var sortOrder=collection.getOption('sortOrder') || 'asc';

        var filtersIndex={

        }

        collection.addFilter = function(filterConfig){
            var hash = baseApp.getHash(JSON.stringify(filterConfig));
            console.log(hash, filterConfig);
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

        collection.processedEach = function(iterator, context){
            var _this = this;
            var filtersArray = _.values(filtersIndex);
            for(var i= 0, len = _this.length; i<len; i++){
                var model = _this.at(i);
                console.log('filter satisfied', model.checkFilters(filtersArray))
                if(model.checkFilters(filtersArray)){
                    iterator.call(context||_this, model);
                };
            }
        }
    }


    var setupPagination = function(){
        var collection = this;
        var curPage =  0;

    }

    var setupFunctions = [setupFilters, setupPagination];

    return BaseCollection;
});
