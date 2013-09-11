
define('base/util',[],function () {

    var paramsToObject = function(params){
        if(!params){
            return  {};
        }
        var paramsArray = _.map(params.split(';'),function(str){return str.split('=');});
        var obj = {};
        _.each(paramsArray,function(arr){
            obj[arr[0]]=arr[1];
        });
        return obj;
    };
    var objectToParams = function(obj){
        var str = [];

        _.each(obj, function(value, index){
            str.push(index+'='+value);
        });

        return str.join(';');
    }


    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    function only_once(fn) {
        var called = false;
        return function () {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(null, arguments);
        }
    }

    var nextTick;

    if (typeof setImmediate === 'function') {
        nextTick = function (fn) {
            // not a direct alias for IE10 compatibility
            setImmediate(fn);
        };
    }
    else {
        nextTick = function (fn) {
            setTimeout(fn, 0);
        };
    }


    return {
        paramsToObject:paramsToObject,
        objectToParams:objectToParams,
        createView: function (config) {

            var view;
            var viewTye = 'model';

            if (config.collection || config.Collection) {
                viewTye = 'collection'
            }


            if (viewTye === 'model') {
                if (config.Model) {
                    config.model = new config.Model(config.attributes);
                }
            } else {
                if (config.Collection) {
                    config.collection = new config.Collection(config.items);
                }
            }



            var filteredConfig = _.omit(config, 'Collection', 'Model', 'parentEl', 'skipRender');
            view = new config.View(filteredConfig);

            if (view) {
                //skip render if skipRender is true
                if (!config['skipRender']) {
                    view.render();
                }

                //if parentEl
                if (config.parentEl) {
                    if (config['replaceHTML']) {
                        config.parentEl.empty();
                    }
                    view.$el.appendTo(config.parentEl);
                }
            }

            return view;
        },
        aSyncQueue: function (worker, concurrency) {
            if (concurrency === undefined) {
                concurrency = 1;
            }
            function _insert(q, data, pos, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    var item = {
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    };

                    if (pos) {
                        q.tasks.unshift(item);
                    } else {
                        q.tasks.push(item);
                    }

                    if (q.saturated && q.tasks.length === concurrency) {
                        q.saturated();
                    }
                    nextTick(q.process);
                });
            }

            var workers = 0;
            var q = {
                tasks: [],
                concurrency: concurrency,
                saturated: null,
                empty: null,
                drain: null,
                added:null,
                push: function (data, callback) {
                    _insert(q, data, false, callback);
                    if(q.added && q.tasks.length !== 0){
                        q.added();
                    }
                },
                unshift: function (data, callback) {
                    _insert(q, data, true, callback);
                },
                process: function () {
                    if (workers < q.concurrency && q.tasks.length) {
                        var task = q.tasks.shift();
                        if (q.empty && q.tasks.length === 0) {
                            q.empty();
                        }
                        workers += 1;
                        var next = function () {
                            workers -= 1;
                            if (task.callback) {
                                task.callback.apply(task, arguments);
                            }
                            if (q.drain && q.tasks.length + workers === 0) {
                                q.drain();
                            }
                            q.process();
                        };
                        var cb = only_once(next);
                        worker(task.data, cb);
                    }
                },
                length: function () {
                    return q.tasks.length;
                },
                running: function () {
                    return workers;
                }
            };
            return q;
        }
    }

});
define('base/router',['require','base/util'],function (require) {

    var util = require('base/util');

    var Router = Backbone.Router.extend({
        routes: {
            '': 'index',
            ':appId/:pageId/*params': 'loadAppPage',
            ':appId/': 'loadApp',
            ':appId': 'loadApp',
            ':appId/:pageId': 'loadAppPage',
            ':appId/:pageId/': 'loadAppPage'

        },
        index: function () {

            require(['base/app'],function(app){
                app.router.navigate('#studio', {trigger: true});
            });

        },
        loadAppPage: function (appId, pageId, params) {

            require(['base/app'],function(baseApp){
                var paramsObject = util.paramsToObject(params);
                paramsObject.appId = appId;
                paramsObject.pageId = pageId;
                baseApp.appModel.set(paramsObject);
            });
        },
        loadApp:function(appId, pageId, params){
            require(['base/app'],function(baseApp){
                var paramsObject = util.paramsToObject(params);
                paramsObject.appId = appId;
                paramsObject.pageId = pageId;
                baseApp.appModel.set(paramsObject);
            });
        }
    });

    return Router;

});
define('base/app',['require', 'base/router'], function (require, Router) {

    var hex_md5 = window.hex_md5;


    var templateIndex = {}, dataIndex = {};

    var app = {
        root: '/',
        baseUrl: 'js/',
        appBody: '#app-body',
        compileTemplate: function (str) {
            return Handlebars.compile(str);
        },
        router: new Router(),
        getTemplateDef: function (template) {
            var _this = this;
            template = template || '';
            var hash = getHash(template);
            var def = getTemplateDefByHash(hash);
            if (!def) {
                def = $.Deferred();
                _this.cacheTemplate(def, hash);
                //if template is already a function, can be used for using other template engines
                if (typeof template === 'function') {
                    def.resolve(template);
                } else if (typeof  template === 'string') {
                    //app.log(template, template.length, template.indexOf('.html'));
                    //if template is an url
                    if (template.indexOf('.html') === template.length - 5) {
                        require(['text!' + template], function (txt) {
                            def.resolve(_this.compileTemplate(txt));
                        });
                    } else
                    //if template is an id of script element in html page
                    if (template.indexOf('#') === 0) {
                        def.resolve(_this.compileTemplate($(template).html()));
                    } else {
                        //if template is a template string
                        def.resolve(_this.compileTemplate(template));
                    }
                }
            }
            return def;
        },
        cacheTemplate: function (def, hash) {
            templateIndex[hash] = def;
        },
        cacheData: function (def, hash) {
            dataIndex[hash] = def;
        },
        log: function () {
            console.log.apply(console, arguments);
        },
        getString: function (str) {
            return str;
        },
        parseSuccessResponse: function (resp) {
            return resp;
        },
        parseFailureResponse: function (resp) {
            return resp;
        },
        appModel: new Backbone.Model(),
        getRequestDef: function (config) {
            var _this = this;
            var hash = getHash(JSON.stringify(_.pick(config, 'id', 'params')));
            var def = getTemplateDefByHash(hash);

            if (!def) {
                def = $.Deferred();
                $.ajax(config).done(function (resp) {
                    var parsedResponse = _this.parseSuccessResponse(resp)
                    if (parsedResponse.errors) {
                        def.reject(parsedResponse.errors);
                    } else {
                        _this.cacheData(def, hash);
                        def.resolve(parsedResponse);
                    }
                }).fail(function (resp) {
                        var parsedResponse = _this.parseFailureResponse(resp)
                        def.reject(parsedResponse.errors);
                    })

            }
            return def;
        },
        makeRequest:function(task, callback){
            setTimeout(function(){
                callback(null, task.params);
            }, Math.round(Math.random()*3000))
        },
        beautifyId:function(s){
            s = s.replace(/([A-Z])/g, function(s){return ' '+s});
            return s.replace(/(^.)/g, function(s){return s.toUpperCase()});
        }
    }


    var getHash = function (key) {
        return hex_md5(key.toString());
    }

    var getTemplateDefByHash = function (hash) {
        return templateIndex[hash];
    }
    var getRequestDefByHash = function (hash) {
        return dataIndex[hash];
    }


    return app;


})
;
define('base/model',[],function(){

    var BaseModel = Backbone.Model.extend({
        is:function(attribute){
            return this.get(attribute) === true;
        },
        isNot:function(attribute){
            return this.get(attribute) === false;
        },
        isEqual:function(attribute, value){
            return this.get(attribute) === value;
        },
        isNotEqual:function(attribute, value){
            return this.get(attribute) !== value;
        },
        removeSelf:function(){
            if(this.collection){
                this.collection.remove(this);
            }
        },
        moveUp:function(){
            var coll = this.collection;
            if(!coll){
                return;
            }
            var index = coll.indexOf(this);
            if(index===0){
                return;
            }
            this.removeSelf();
            coll.add(this, {at:index-1});
        },
        moveDown:function(){
            var coll = this.collection;
            if(!coll){
                return;
            }
            var index = coll.indexOf(this);
            if(index === coll.length-1){
                return;
            }
            this.removeSelf();
            coll.add(this, {at:index+1});
        },
        getClosest:function(){
            var coll = this.collection;
            if(!coll || coll.length < 2){
                return;
            }
            var index = coll.indexOf(this);
            var prev = coll.at(index-1);
            if(prev){
                return prev;
            }else{
                return coll.at(index+1);
            }
        }
    });

    return BaseModel;
});
define('base/view',['base/app', 'base/model', 'base/util'], function (app, BaseModel, util) {

    var BaseView = Backbone.View.extend({
        constructor: function (options) {
            var _this = this;
            Backbone.View.call(_this, options);
            _.each(setupFunctions, function (func) {
                func.call(_this, options);
            })
        },
        render: function () {
            var _this = this;
            _this.beforeRender();
            app.getTemplateDef(_this.getTemplate()).done(function (templateFunction) {
                if (!_this.model) {
                    _this.model = new BaseModel();
                }
                _this.renderTemplate(templateFunction);
                setupSubViews.call(_this);
                if (_this.setState) {
                    var defaultState = _.keys(_this.getOption('states'))[0];
                    _this.setState(_this.getState() || _this.getOption('state') || defaultState);
                }
                _this.postRender();
            });
            return _this;
        },
        postRender: function () {

        },
        beforeRender: function () {

        },
        renderTemplate: function (templateFunction) {
            var templateHTML = $(templateFunction(this.model.toJSON()));
            templateHTML.find('a').addClass(this.cid);
            this.$el.html(templateHTML);
        },
        loadMeta: function () {
            if (!this.metaDef) {
                var def = $.Deferred();
                this.metaDef = def.promise();
                def.resolve();
            }
            return this.metaDef;
        },
        getOption: function (option) {
            return this.options[option];
        },
        actionHandler: function () {

        },
        loadingHandler:function(isLoading){
            this.$el.toggleClass('loading', isLoading);
        },
        addMethod:function(methodName, func){
            if(!this[methodName]){
                this[methodName] = func;
            }
        }
    });


    var bindDataEvents = function () {
        var _this = this;
        var modelOrCollection = _this.model || _this.collection;
        var eventList, _this;
        eventList = _this.dataEvents;
        _.each(eventList, function (handler, event) {
            var events, handlers, splitter;
            splitter = /\s+/;
            handlers = handler.split(splitter);
            events = event.split(splitter);
            _.each(handlers, function (shandler) {
                _.each(events, function (sevent) {
                    modelOrCollection.on(sevent, function () {
                        if (_this[shandler]) {
                            var args = Array.prototype.slice.call(arguments);
                            args.unshift(sevent);
                            _this[shandler].apply(_this, args);
                        } else {
                            throw shandler + ' Not Defined';
                        }
                    });
                });
            });
        });
    }

    var setupStateEvents = function () {
        var _this = this;
        var stateConfigs = _this.getOption('states');
        if (!stateConfigs) {
            return;
        }

        var state;
        var statedView;


        var cleanUpState = function () {
            if (statedView) {
                statedView.off();
                statedView.remove();
            }

        }

        var renderState = function (StateView) {
            statedView = util.createView({
                View: StateView,
                model: _this.model,
                parentEl: _this.$('.state-view')
            });
        }

        _this.setState = function (toState) {
            if (typeof toState === 'string') {
                if(state === toState){
                    return;
                }
                state = toState;
                var StateView = stateConfigs[toState];
                if (StateView) {
                    cleanUpState();
                    renderState(StateView);
                } else {
                    throw new Error('Invalid State')
                }

            } else {
                throw new Error('state should be a string')
            }
        }

        _this.getState = function () {
            return state;
        }

    }

    var setupTemplateEvents = function () {
        (function (that) {
            var template = that.getOption('template') || that.template;
            //if (template) {
            that.setTemplate = function (newTemplate) {
                template = newTemplate;
                that.render();
            }

            that.getTemplate = function () {
                return template;
            }
            //}
        })(this);
    }

    var setupSubViews = function () {
        var _this = this;
        var views = {};

        var subViewConfigs = _this.getOption('views');

        if(!subViewConfigs){
            return ;
        }

        _.each(subViewConfigs, function (viewConfig, viewName) {
            if (viewConfig.parentEl && typeof viewConfig.parentEl === 'string') {
                viewConfig.parentEl = _this.$(viewConfig.parentEl);
            }
            views[viewName] = util.createView(viewConfig);
        })

        _this.getSubView = function (id) {
            var subView = views[id]
            if (subView) {
                return subView;
            } else {
                throw new Error('No View Defined for id :' + id);
            }
        }

    }


    var setupAttributeWatch = function () {
        var _this = this;
        var model = _this.model;
        if (model) {
            model.on('change', _.bind(watchAttributes, _this));
            syncAttributes.call(_this, model)
        }

    }

    var watchAttributes = function (model) {
        var changes = model.changedAttributes();
        _.each(changes, function (value, attribute) {
            var handler = this[attribute + 'ChangeHandler'];
            if (handler && typeof handler === 'function') {
                handler.call(this, value);
            }
        }, this);

        var changeHandler = this.changeHandler;
        if (changeHandler && typeof changeHandler === 'function') {
            changeHandler.call(this, changes);
        }
    }

    var syncAttributes = function (model) {
        var changes = model.toJSON();
        _.each(changes, function (value, attribute) {
            var handler = this[attribute + 'ChangeHandler'];
            if (handler && typeof handler === 'function') {
                handler.call(this, value);
            }
        }, this);

        var changeHandler = this.changeHandler;
        if (changeHandler && typeof changeHandler === 'function') {
            changeHandler.call(this, changes);
        }
    }

    var setupActionNavigateAnchors = function () {
        var _this = this;
        var verifyPropagation = function(e){
            if(e.actionHandled){
                e.stopPropagation();
                $('body').trigger('click');
            }
        }
        _this.$el.on('click', '.action', function (e) {
            e.preventDefault();
            var target = $(e.currentTarget);
            var action = target.attr('href').substr(1);
            _this.actionHandler.call(_this, action, e);
            verifyPropagation(e);
        });

        _this.$el.on('click', '.dummy', function (e) {
            e.preventDefault();
        });
    }

    var setupOnChangeRender = function () {
        var _this = this;
        if (this.getOption('renderOnChange') === true) {
            _this.model.on('change', function () {
                _this.render.call(_this);
            })
        }
    }




    var setupMetaRequests = function(){
        var _this = this;
        var requestConfigs = _this.getOption('requests') || _this.requests;
        var loading = false;
        if(!requestConfigs){
            return;
        }
        var requestQue = util.aSyncQueue(app.makeRequest, 10);
        requestQue.added = function(){
            loading = true;
            _this.loadingHandler.call(_this, loading);
        }
        requestQue.drain = function(){
            loading = false;
            _this.loadingHandler.call(_this, loading);
        }

        requestQue.push(requestConfigs, function(err, data){
            _this.trigger('requestComplete', data);
        })

        _this.getRequestQue = function(){
            return requestQue;
        }
    }

    var setupFunctions = [bindDataEvents, setupTemplateEvents, setupAttributeWatch, setupActionNavigateAnchors, setupOnChangeRender, setupStateEvents, setupMetaRequests];

    return BaseView;
});

define('base/itemView',['base/view'],function(BaseView){

    var ItemView = BaseView.extend({
        tagName:'li',
        template:'{{name}}'
    });

    return ItemView;
});
define('base/collectionView',['base/view', 'base/itemView', 'base/util'], function (BaseView, BaseItemView, util) {



    var CollectionView = BaseView.extend({
        tagName: 'ul',
        dataEvents:{
            'add' : 'addHandler',
            'remove':'removeHandler'
        },
        postRender: function () {
            collectionRender.call(this);
        },
        addHandler:function(event, model){
            this.addItem(model)
        },
        removeHandler:function(event,model){
            this.removeItem(model)
        }
    });

    var collectionRender = function(){
        var _this = this;
        var viewArray = {};
        var el = this.$el;
        var coll = this.collection;

        _this.addItem = function(model, containerEl){
            if(!containerEl){
                containerEl = el;
            }
            var index = coll.indexOf(model);

            var ItemView = _this.getOption('itemView') || BaseItemView;
            var view = util.createView({model: model, className:'id-'+model.id, View:ItemView});
            viewArray[model.id] = view;

            var index = coll.indexOf(model);
            if(index=== 0){
                view.$el.prependTo(containerEl);
            }else if(index >= coll.length -1){
                view.$el.appendTo(containerEl);
            }else{
                var beforeView = _this.getModelViewAt(coll.at(index-1).id);
                view.$el.insertAfter(beforeView.$el)
            }

        }

        _this.removeItem = function(model){
            var view = _this.getModelViewAt(model.id);
            view.remove();
        }

        _this.getModelViewAt =function(id){
            return viewArray[id];
        }

        var fragment = document.createDocumentFragment();
        coll.each(function (model, index) {
            _this.addItem(model, fragment);
        });
        this.$el.append(fragment);
    }

    return CollectionView;
});

define('base/collection',[ 'base/model'],function(BaseModel){

    var BaseCollection = Backbone.Collection.extend({
        model:BaseModel
    });

    return BaseCollection;
});
define('base',['require','base/view','base/collectionView','base/itemView','base/model','base/collection','base/util','base/app','base/router'],function (require) {
    return {
        View: require('base/view'),
        CollectionView: require('base/collectionView'),
        ItemView: require('base/itemView'),
        Model: require('base/model'),
        Collection: require('base/collection'),
        util:require('base/util'),
        app:require('base/app'),
        Router:require('base/router')
    }

});

define('list/singleSelect',['base'], function (Base) {

    var baseUtil =  Base.util;

    var View = Base.View.extend({
        template:'<div class="list-view"></div>',
        postRender:function(){
            var items = this.model.get('items');
            var listView = baseUtil.createView({
                View:Base.CollectionView,
                collection:items,
                parentEl:this.$('.list-view'),
                itemView:this.getOption('ItemView') || ItemView
            })
        },
        actionHandler:function(selectedId){
            this.model.setSelectedById(selectedId);
        }
    })

    var ItemModel = Base.Model.extend({
        defaults:{
            selected:false
        },
        select:function(){
            this.set('selected', true);
        },
        deselect:function(){
            this.set('selected', false);
        },
        toggleSelect:function(){
            var selected = this.is('selected');
            this.set('selected', !selected);
        }
    })

    var ItemView = Base.View.extend({
        tagName:'li',
        className:'single-select-item',
        template:'<a href="#{{id}}" class="action">{{name}}</a>',
        changeHandler:function(){
            this.render();
            this.$el.toggleClass('active',this.model.is('selected'));
        }
    })

    var ItemCollection = Base.Collection.extend({
        model:ItemModel
    });


    var setupFunctions = [setupSingleSelection];

    var Model = Base.Model.extend({
        constructor: function (options) {
            var _this = this;
            Base.Model.call(_this, options);
            _.each(setupFunctions, function(func){
                func.call(_this, options);
            })
        }
    })

    function setupSingleSelection() {

        var _this = this, selected, previousSelected;

        var coll = _this.get('items');

        var selectedItem = coll.findWhere({selected: true});
        if (selectedItem) {
            selected = selectedItem;
            previousSelected = selectedItem;
        }

        var updateSelected = function(){
            _this.set('selectedItem', selected);
        }

        _this.getSelected = function () {
            return selected;
        }

        _this.prevSelected = function () {
            return previousSelected;
        }

        _this.setSelectedById = function(id){
            var curItem = coll.get(id);
            if(!selected){
                selected = curItem;
                curItem.select();
                updateSelected();
                return;
            }
            if(curItem.id === selected.id){
                return;
            }
            previousSelected = selected;
            selected =  curItem;
            previousSelected.deselect();
            curItem.select();
            updateSelected();
        }

        _this.setSelected = function(curItem){
            if(curItem.id === selected.id){
                return;
            }
            previousSelected = selected;
            selected =  curItem;
            previousSelected.deselect();
            curItem.select();
            updateSelected();
        },

        _this.clearSelection = function(){
            previousSelected = selected;
            selected =  null;
            previousSelected.deselect();
            updateSelected();
        }
    }

    return {
        View:View,
        Model:Model,
        ItemModel:ItemModel,
        ItemView:ItemView,
        ItemCollection:ItemCollection
    }

});
define('list/multiSelect',['base', 'list/singleSelect'], function (Base, SingleSelect) {


    var setupFunctions = [setupMultiSelection];

    var Model = Base.Model.extend({
        constructor: function (options) {
            var _this = this;
            Base.Model.call(_this, options);
            _.each(setupFunctions, function(func){
                func.call(_this, options);
            })
        }
    })


    function setupMultiSelection() {

        var _this = this, selected = [];

        var coll = _this.get('items');



        _this.getSelected = function () {
            return selected;
        }

        _this.setSelectedById = function(id){
            var curItem = coll.get(id);
            curItem.toggleSelect();
            updateSelected();
        }

        _this.setSelected = function(curItem){
            curItem.toggleSelect();
            updateSelected();
        }

        _this.selectAll = function(){
            coll.each(function(model){
                model.select();
            })
            updateSelected();
        }

        _this.selectNone = function(){
            coll.each(function(model){
                model.deselect();
            })
            updateSelected();
        }
        var updateSelected = function(){
            selected = coll.where({selected: true});
            _this.set('selectedCount', selected.length);
        }

        updateSelected();
    }

    return {
        View:SingleSelect.View,
        Model:Model,
        ItemView:SingleSelect.ItemView,
        ItemCollection:SingleSelect.ItemCollection
    }

});
define('list',['require','list/singleSelect','list/multiSelect'],function (require) {

    return {
        SingleSelect: require('list/singleSelect'),
        MultiSelect: require('list/multiSelect')
    }
});