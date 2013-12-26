define(['base/app', 'base/util' , 'base/model', 'base/collection'], function (baseApp, baseUtil, BaseModel, BaseCollection) {

    'use strict';
    var Collection = BaseCollection.extend({
        constructor: function (array, options) {
            var _this = this;
            BaseCollection.apply(_this, arguments);
            _.each(setupFunctions, function (func) {
                func(_this);
            });
        }
    });

    var setupSortActions = function(collection){
        collection.setSortKey = function(key){
            var config =  collection.getConfigs();
            var newOrder = "asc";
            if(key === config.sortKey){
                newOrder = config.sortOrder === "asc" ? "desc" : "asc";
                collection.setConfigs({sortOrder:newOrder});
            }else{
                collection.setConfigs({sortKey:key, sortOrder:newOrder});
            }
        }

        collection.getSorted = function(){
            var config =  collection.getConfigs();
            var toReturn = collection.sortBy(config.sortKey);
            if(config.sortOrder !== "asc"){
                toReturn.reverse();
            }
            return toReturn;
        }
    }


    var setupFilters = function (collection) {

        var sortKey = collection.getOption('sortKey') || 'name';
        var sortOrder = collection.getOption('sortOrder') || 'asc';


        var filtersIndex = {

        };

        collection.addFilter = function (filterConfig) {
            var hash = baseApp.getHash(JSON.stringify(filterConfig));
            filtersIndex[hash] = filterConfig;
        };

        collection.removeFilter = function (filterConfig) {
            var hash = baseApp.getHash(filterConfig);
            var filter = filtersIndex[hash];
            if (filter) {
                delete filtersIndex[hash];
            } else {
                throw new Error('Filter missing');
            }
        };

        collection.getFiltered = function (arrayOfModels) {
            //console.log(arrayOfModels.length, 'getFiltered');
            var filtersArray = _.values(filtersIndex);
            if (filtersArray.length === 0) {
                return arrayOfModels;
            } else {
                return _.filter(arrayOfModels, function (model) {
                    return  model.checkFilters(filtersArray);
                });
            }

        };

        collection.getProcessedRecords = function(){
            var config = collection.getConfigs();
            if(config.requestId || collection.url){
                return collection.toArray();
            }else{
                return collection.getPaginated(collection.getFiltered(collection.getSorted(collection)));
            }
        };

        collection.processedEach = function (iterator, context) {
            var finalArray = collection.getProcessedRecords();
            _.each(finalArray, function (model, index) {
                iterator.call(context || collection, model, index);
            });
        };


    };


    var setupPagination = function (collection) {
        var configs = collection.getConfigs();
        collection.setConfig('totalRecords', collection.length);

        collection.getPaginated = function (arrayOfModels) {
            //console.log(arrayOfModels.length, 'getPaginated');
            configs = collection.getConfigs();
            collection.setConfig('totalRecords', arrayOfModels.length);
            if (configs.paginated) {
                return arrayOfModels.splice((configs.page - 1) * configs.perPage, configs.perPage);
            } else {
                return arrayOfModels;
            }
        };

        collection.nextPage = function () {

            var configs = collection.getConfigs();
            var totalPages = Math.ceil(configs.totalRecords / configs.perPage);

            var page = collection.getConfig('page');
            collection.setConfig('page', Math.min(page + 1, totalPages));
        };

        collection.prevPage = function () {
            var page = collection.getConfig('page');
            collection.setConfig('page', Math.max(1, page - 1));
        };


    };

    var configureMixin = function (context) {
        var config = new BaseModel();

        var methods = {
            setConfig: function (key, value) {
                config.set(key, value);
            },
            getConfig: function (key) {
                return config.get(key);
            },
            setConfigs: function (obj) {
                config.set(obj);
            },
            getConfigs: function (useDeep) {
                return config.toJSON(useDeep);
            },
            getConfigModel: function () {
                return config;
            }
        };

        _.extend(context, methods);
        context.setConfigs(_.extend({}, context.getOption('config')));
        context.listenTo(config, 'all', function (sourceEventName) {
            context.trigger.apply(context, ['config_' + sourceEventName].concat(_.rest(arguments)));
        });

        config.on('change:page change:perPage',function(model){
            var config = model.toJSON();
            var start = (config.page-1)*config.perPage;
            var end=Math.min(start+config.perPage, config.totalRecords);
            model.set({
                start:start,
                end:end
            });
        })

    };


    var setupUrlFetch = function (collection) {
        //collection.url = collection.getConfig('baseUrl');
        /*
        collection.parse = function (data) {
            collection.setConfig('totalRecords', 100);
            return _.map(data.results, function (item) {
                return item.user;
            });
        };
         */
    };



    var setupFunctions = [configureMixin, setupFilters, setupSortActions, setupPagination, setupUrlFetch];

    return Collection;
});