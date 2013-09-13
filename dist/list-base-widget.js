
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
                app.router.navigate('#'+app.defaultApp, {trigger: true});
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
        defaultApp:'default',
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

/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 28/06/13
 * Time: 4:18 PM
 * To change this template use File | Settings | File Templates.
 */
define('widgets/form/validator',['base/app'],function(app){
    



    var validateValue=function(value, validationRules){

        var errors=[];
        var errorRule;

        var isValid = _.every(validationRules, function (rule) {
            var isValidForRule = validationRuleMethods[rule.expr].call(this, rule, value);
            if (!isValidForRule) {
                errors.push(rule);
                errorRule = rule;
            }
            return isValidForRule;
        });

        return {
            isValid:isValid,
            errors:errors,
            errorRule:errorRule
        };
    };

    var validationRuleMethods = {
        'req': function (rule, value) {
            return !_.isEmpty(value);
        },
        'digits': function (rule, value) {
            return (/^\d{5}$/).test(value);
        },
        'alphanumeric': function (rule, value) {
            var ck_alphaNumeric = /^\w+$/;
            return ck_alphaNumeric.test(value);
        },
        'number': function (rule, value) {
            if (value === undefined) {
                return true;
            }
            var numberVal = +value;
            return numberVal === numberVal;
        },
        'email': function (rule, value) {
            var ck_email = /^([\w\-]+(?:\.[\w\-]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return ck_email.test($.trim(value));
        },
        'minlen': function (rule, value) {
            var min = rule.length;
            return $.trim(String(value)).length >= min;
        },
        'maxlen': function (rule, value, exprvalue) {
            var max = rule.length;
            return $.trim(String(value)).length <= max;
        },
        'lt': function (rule, value, exprvalue) {
            var target = parseFloat(exprvalue);
            var curvalue = parseFloat(value);
            return curvalue < target;
        },
        'gt': function (rule, value, exprvalue) {
            var target = parseFloat(exprvalue);
            var curvalue = parseFloat(value);
            return curvalue > target;
        },
        'eq': function (rule, value, exprvalue) {
            return exprvalue === value;
        },
        'neq': function (rule, value) {
            return rule.value !== value;
        },
        'url': function (rule, value) {
            if (value === '') {
                return true;
            }
            var ck_url = /(http|https|market):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i;
            return ck_url.test($.trim(value));
        },
        'emaillist': function (rule, value) {
            var emails = value.split(',');
            var ck_email = /^([\w\-]+(?:\.[\w\-]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            for (var i = 0; i < emails.length; i++) {
                if ($.trim(emails[i]) !== '' && !ck_email.test($.trim(emails[i]))) {
                    return false;
                }
            }
            return true;
        },
        'function': function (rule, value) {
            var func = rule.func;
            return func.call(null, value);
        }

    };



    return {
        validateValue:validateValue,
        validationRuleMethods:validationRuleMethods
    };
});
/**
 * @license RequireJS text 2.0.5+ Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
 define, window, process, Packages,
 java, location, Components, FileUtils */

define('text',['module'], function (module) {
    

    var text, fs, Cc, Ci,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = [],
        masterConfig = (module.config && module.config()) || {};

    text = {
        version: '2.0.5+',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.indexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                    name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1, name.length);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                ((!uPort && !uHostName) || uPort === port);
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                    text.useXhr;

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                        parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                    "define(function () { return '" +
                        content +
                        "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
            //Use a '.js' file name so that it indicates it is a
            //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
        typeof process !== "undefined" &&
        process.versions &&
        !!process.versions.node)) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback) {
            var file = fs.readFileSync(url, 'utf8');
            //Remove BOM (Byte Mark Order) from utf8 files if it is there.
            if (file.indexOf('\uFEFF') === 0) {
                file = file.substring(1);
            }
            callback(file);
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
        text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        errback(err);
                    } else {
                        callback(xhr.responseText);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
        typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                stringBuffer.append(line);

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env &&
        typeof Components !== 'undefined' && Components.classes &&
        Components.interfaces)) {
        //Avert your gaze!
        Cc = Components.classes,
            Ci = Components.interfaces;
        Components.utils['import']('resource://gre/modules/FileUtils.jsm');

        text.get = function (url, callback) {
            var inStream, convertStream,
                readData = {},
                fileObj = new FileUtils.File(url);

            //XPCOM, you so crazy
            try {
                inStream = Cc['@mozilla.org/network/file-input-stream;1']
                    .createInstance(Ci.nsIFileInputStream);
                inStream.init(fileObj, 1, 0, false);

                convertStream = Cc['@mozilla.org/intl/converter-input-stream;1']
                    .createInstance(Ci.nsIConverterInputStream);
                convertStream.init(inStream, "utf-8", inStream.available(),
                    Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

                convertStream.readString(inStream.available(), readData);
                convertStream.close();
                inStream.close();
                callback(readData.value);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            }
        };
    }
    return text;
});
define('text!widgets/form/inputView.html',[],function () { return '<div class="control-group">\n    <label class="control-label">\n        {{label}}\n    </label>\n\n    <div class="controls type-{{type}}">\n        <input type="{{type}}" name="{{name}}" value="{{value}}" class="el-{{name}}"/>\n        <span class="help-inline"></span>\n    </div>\n</div>';});

/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 21/06/13
 * Time: 11:36 AM
 * To change this template use File | Settings | File Templates.
 */
define('widgets/form/element',['base/app', 'base', 'widgets/form/validator','text!./inputView.html'], function (app, Base, Validator, inputViewTemplate) {
    

    var DOT_CONTROL_GROUP = '.control-group';
    var DOT_CONTROL_LABEL = '.control-label';
    var DOT_HELP_INLINE = '.help-inline';
    var INVALID_CLASS = 'error';


    var ElementModel = Base.Model.extend({
        defaults: {
            valid: true,
            active: true,
            disabled: false,
            readonly: false,
            value: null,
            label: null,
            activeRules: [],
            validationRules: [],
            type: 'text',
            errorCode: '',
            group: 'elements'
        },
        idAttribute: 'name',
        updateActive: function () {
            var activeRules = this.get('activeRules');
            var isActive = _.every(activeRules, function (rule) {
                var sourceElement = this.collection.get(rule.element);
                return activeRuleMethods[rule.expr].call(null, sourceElement, rule);
            }, this);
            this.set('active', isActive);
        },
        isElementValid: function (skipShowErrors) {
            var validationRules = this.get('validationRules');
            var errors = [];
            if (this.isNot('active')) {
                return [];
            }

            var errorRule;
            var isValid = _.every(validationRules, function (rule) {
                var isValidForRule = Validator.validationRuleMethods[rule.expr].call(this, rule, this.get('value'));
                if (!isValidForRule) {
                    errors.push(rule);
                    errorRule = rule;
                }
                return isValidForRule;
            }, this);
            //ee.log('isElementValid',this.id, isValid, errorRule);
            this.set('valid', isValid);
            if(!skipShowErrors) {
                if (errorRule) {
                    var message = errorRule.message || ('error.' + this.get('name') + '.' + errorRule.expr);
                    this.set('errorCode', message);
                } else {
                    this.set('errorCode', '');
                }
            }
            return errors;
        },
        getSiblingValue:function(siblingName){
            if(this.collection){
                return this.collection.get(siblingName).get('value');
            }
        },
        getSiblingAttribute:function(siblingName, attributeName){
            if(this.collection){
                return this.collection.get(siblingName).get(attributeName);
            }
        },
        setSiblingAttribute:function(siblingName, attributeName, value){
            if(this.collection){
                return this.collection.get(siblingName).set(attributeName,value);
            }
        },
        setSiblingValue:function(siblingName, value){
            if(this.collection){
                return this.collection.get(siblingName).set('value',value);
            }
        }
    });

    var ElementCollection = Base.Collection.extend({
        model: ElementModel
    });


    var ElementView = Base.View.extend({
        tagName: 'div',
        className: 'element',
        events: {
            'change input': 'updateValue',
            'blur input': 'updateValue',
            'click': 'setFocus'
        },
        template: inputViewTemplate,
        // typeChangeHandler:function(value){
        //     this.$('input').attr('type', value);
        // },

        disabledChangeHandler: function (value) {
            this.$el.toggleClass('disabled', value);
            this.$('input').attr('disabled', value);
        },
        readonlyChangeHandler: function (value) {
            this.$el.toggleClass('readonly', value);
            this.$('input').attr('readonly', value);
        },
        validChangeHandler: function (value) {
            this.$(DOT_CONTROL_GROUP).toggleClass(INVALID_CLASS, !value);
        },
        activeChangeHandler: function (value) {
            this.$el.toggle(value);
        },
        valueChangeHandler: function (value) {
            this.$('input').val(value);
           // console.log(value, 'txt');
        },
        errorCodeChangeHandler: function (errorCode) {
            var el = this.$(DOT_HELP_INLINE);
            //console.log('errorCodeChangeHandler',this.model.id, el, errorCode);
            if (errorCode === '') {
                el.empty();
                this.model.set('valid', true);
            } else {
                this.model.set('valid', false);

                el.html(app.getString(errorCode));
            }
        },
        nameChangeHandler: function (value) {
            this.$el.addClass('element-' + value);
        },
        valueFunction: function () {
            return this.$('input').val();
        },
        updateValue: function (skipValidate) {
            this.model.set('value', this.valueFunction());
            if (skipValidate !== true) {
                this.model.isElementValid();
            }

        },
        setFocus:function(){
            var form = this.$el.closest('form');
            form.find('.focused').removeClass('focused');
            this.$el.addClass('focused');
        },
        removeFocus:function(){
            this.$el.removeClass('focused');
        }
    });


    var activeRuleMethods = {
        'eq': function (source, rule) {
            return source.isEqual('value', rule.value);
        },
        'valid': function (source) {
            source.isElementValid(true);
            return source.is('valid');
        },
        'isIn': function (source, rule) {
            var value = source.get('value');
            return rule.value.indexOf(value) !== -1;
        },
        'neq': function (source, rule) {
            return source.isNotEqual('value', rule.value);
        },
        'function': function (source, rule) {
            var func = rule.func;
            return func.apply(null, arguments);
        }
    };


    return {
        View: ElementView,
        Model: ElementModel,
        Collection: ElementCollection
    };
});
define('text!widgets/messageStack/messageStack.html',[],function () { return '<div>\n\n</div>';});

define('widgets/messageStack',['base', 'text!./messageStack/messageStack.html'],function(Bone, template){

    var MessageStack = Bone.View.extend({
        template:template

    });

    var MessageStackModel = Bone.Model.extend({
        removeAllMessages:function(){

        }
    });

    return {
        View:MessageStack,
        Model:MessageStackModel
    };
});
define('text!widgets/form/checkListView.html',[],function () { return '<div class="control-group">\n    <label class="control-label">\n        {{label}}\n    </label>\n\n    <div class="controls">\n        {{#each options}}\n        <label class="checkbox inline">\n            <input type="checkbox" name="{{id}}" value="{{id}}" class="el-{{name}}"/>{{name}}\n        </label>\n        {{/each}}\n        <span class="help-inline"></span>\n    </div>\n</div>';});

define('text!widgets/form/radioListView.html',[],function () { return '<div class="control-group">\n    <label class="control-label">\n        {{label}}\n    </label>\n\n    <div class="controls">\n        {{#each options}}\n        <label class="radio inline">\n            <input type="radio" name="{{../name}}" value="{{id}}" class="el-{{name}}"/>{{name}}\n        </label>\n        {{/each}}\n        <span class="help-inline"></span>\n    </div>\n</div>';});

define('text!widgets/form/selectView.html',[],function () { return '<div class="control-group">\n    <label class="control-label">\n        {{label}}\n    </label>\n\n    <div class="controls">\n        <select name="{{name}}" class="el-{{name}}">\n            {{#each options}}\n            <option value="{{id}}">{{name}}</option>\n            {{/each}}\n        </select>\n        <span class="help-inline"></span>\n    </div>\n</div>';});

define('text!widgets/form/textAreaView.html',[],function () { return '<div class="control-group">\n    <label class="control-label">\n        {{label}}\n    </label>\n\n    <div class="controls">\n        <textarea type="{{type}}" name="{{name}}" class="el-{{name}}">{{value}}</textarea>\n        <span class="help-inline"></span>\n    </div>\n</div>';});

define('text!widgets/form/buttonView.html',[],function () { return '<div class="control-group">\n    <div class="controls">\n        <button type="submit" class="btn btn-default">{{value}}</button>\n        <span class="help-inline"></span>\n    </div>\n</div>';});

/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 14/06/13
 * Time: 12:28 PM
 * To change this template use File | Settings | File Templates.
 */
define('widgets/form',[
    'base/app',
    'base',
    'widgets/form/element',
    'widgets/messageStack',
    'text!./form/checkListView.html',
    'text!./form/radioListView.html',
    'text!./form/selectView.html',
    'text!./form/textAreaView.html',
    'text!./form/buttonView.html'
],function(app, Base, Element, MessageStack, checkListTemplate, radioListTemplate, selectViewTemplate, textAreaTemplate, buttonViewTemplate){
    

    var ElementView = Element.View;
    var ElementModel = Element.Model;
    var ElementCollection = Element.Collection;

    var ButtonView = ElementView.extend({
        template:buttonViewTemplate,
        valueFunction: function () {
            return;
        },
        valueChangeHandler: function (value) {
            return;
        }
    });

    var CheckboxView = ElementView.extend({
        valueFunction: function () {
            return this.$('input').is(':checked');
        },
        valueChangeHandler: function (value) {
            this.$('input').attr('checked', value);
        }
    });
    var TextAreaView = ElementView.extend({
        template:textAreaTemplate,
        events: {
            'change textarea': 'updateValue',
            'blur textarea': 'updateValue'
        },
        valueFunction: function () {
            return this.$('textarea').val();
        },
        valueChangeHandler: function (value) {
            this.$('textarea').val(value);
        }
    });

    var SelectView = ElementView.extend({
        template: selectViewTemplate,
        events: {
            'change select': 'updateValue',
            'blur select': function(){
                this.updateValue();
                this.removeFocus();
            },
            'click': 'setFocus'
        },
        valueFunction: function () {
            return this.$('select').val();
        },
        valueChangeHandler: function (value) {
            this.$('select').val(value);
        },
        disabledChangeHandler: function (value) {
            this.$el.toggleClass('disabled', value);
            this.$('select').attr('disabled', value);
        }
    });


    var RadioListView = ElementView.extend({
        template:radioListTemplate,
        valueFunction: function () {
            return this.$('input:checked').val();
        },
        valueChangeHandler: function (value) {
            this.$('input[value=' + value + ']').attr('checked', true);
        }
    });

    var CheckListView = ElementView.extend({
        template: checkListTemplate,
        valueFunction: function () {
            var selectedOptions = this.$('input:checked');

            var valueArr = _.map(selectedOptions, function (option) {
                return $(option).val();
            });

            return valueArr;
        },
        valueChangeHandler: function (valueArr) {
            //this.$('input[value='+value+']').attr('checked',true);
            if (_.isArray(valueArr)) {
                _.each(valueArr, function (value) {
                    this.$('input[value=' + value + ']').attr('checked', true);
                }, this);
            }
        }
    });

    var HiddenView = ElementView.extend({
        template: '<input type="hidden" value="{{value}}" name="{{name}}" />',
        valueChangeHandler: function (value) {
            this.$('input').val(value);
            this.$('input').trigger('change');
        },
        valueFunction:function(){
            return ''+this.$('input').val();
        }
    });

    var ContainerView = ElementView.extend({
        template: ' ',
        valueChangeHandler: function (value) {
            //this.$('input').val(value);
        },
        valueFunction:function(){
            //return this.$('input').val();
        }
    });

    var HiddenJSONView = ElementView.extend({
        template: '<input type="hidden" value="{{value}}" name="{{name}}" />',
        valueChangeHandler: function (value) {
            this.$('input').val(JSON.stringify(value));
            //console.log(value, 'HiddenJSONView');
            this.updateValue();
        },
        valueFunction:function(){
            return JSON.parse(this.$('input').val());
        }
    });

    var CheckboxList = ElementView.extend({
        valueFunction: function () {
            return this.$('input').is(':checked');
        },
        valueChangeHandler: function (value) {
            this.$('input').attr('checked', value);
        }
    });

    var typeViewIndex = {
        'select': SelectView,
        'textarea': TextAreaView,
        'checkbox': CheckboxView,
        'radioList': RadioListView,
        'checkList': CheckListView,
        'hidden':HiddenView,
        'json':HiddenJSONView,
        'submit':ButtonView,
        'container':ContainerView
    };

    var getViewByType = function (type) {
        return typeViewIndex[type] || ElementView;
    };

    var updateTypeViewIndex = function (indexObj) {
        typeViewIndex = _.extend({}, typeViewIndex, indexObj);
    };

    var FormModel = Base.Model.extend({
        constructor: function () {
            Base.Model.apply(this, arguments);
            var elements = this.get('elements');
            elements.on('change', function (model) {
                var eventName = 'change';
                var args = Array.prototype.slice.call(arguments, [0]);
                args[0] = 'elements:' + eventName;
                this.trigger.apply(this, args);
                args[0] = 'elements:' + model.get('name') + ':' + eventName;
                this.trigger.apply(this, args);
            }, this);

            elements.each(function (elementModel) {

                //add active rules
                var activeRules = elementModel.get('activeRules');
                _.each(activeRules, function (rule) {
                    var toWatchElement = elements.get(rule.element);
                    toWatchElement.on('change:value', function (model, value) {
                        elementModel.updateActive();
                    });
                    elementModel.updateActive();
                    /*
                     switch(rule.expr){
                     case 'eq':
                     elementModel.set('active', toWatchElement.isEqual('value', rule.value));
                     toWatchElement.on('change:value',function(model, value){
                     elementModel.updateActive();
                     });
                     break;
                     case 'neq':
                     elementModel.set('active', toWatchElement.isNotEqual('value', rule.value));
                     toWatchElement.on('change:value',function(model, value){
                     elementModel.set('active', value !== rule.value);
                     });
                     break;
                     }
                     */

                });
            });

        },
        defaults: {
            elements: new ElementCollection()
        },
        setElementAttribute: function (elementName, attribute, value) {
            var elements = this.get('elements');
            elements.get(elementName).set(attribute, value);
        },
        getValueObject: function () {
            var elements = this.get('elements');
            var errors = this.validateElements();
            var obj = {};
            if (errors.length === 0) {
                elements.each(function (model) {
                    if (model.is('active')) {
                        obj[model.id] = model.get('value');
                    }
                });
            }
            return obj;
        },
        validateElements: function () {
            var elements = this.get('elements');
            var errors = [];
            elements.each(function (model) {

                errors = errors.concat(model.isElementValid());

            });
            return errors;
        }

    });


    var groupPrefix = 'grp-';


    var FormView = Base.View.extend({
        constructor: function (options) {
            this.typeViewIndex = {};
            Base.View.apply(this, arguments);
        },
        tagName: 'div',
        className: 'form-view',
        events: {
            'submit form': 'formSubmitHandler'
        },
        template: '<div class="form-message-container"></div><form action="{{actionId}}" id="form-{{id}}" class="form-vertical" method=""></form>',

        postRender: function () {
            this.formEl = this.$('form');
            this.renderGroupContainers();
            this.renderMessageStack();
            var model = this.model;
            var elements = model.get('elements');
            elements.each(function (elementModel) {
                this.addElement(elementModel);
            }, this);
            return this;
        },
        addElement: function (model) {
            var attr = model.toJSON();
            var ElementView = this.typeViewIndex[attr.type] || getViewByType(attr.type);

            var name = attr.name;
            var view;
            //if element already rendered dont render again
            var viewEl =  this.$('.element-'+name);

            if(viewEl.length !== 0){
                view = new ElementView({
                    model: model,
                    el:viewEl
                });
                view.afterRender();
                view.syncAttributes();
            }else{
                view = new ElementView({
                    model: model
                });
                var group = attr.group;
                this.$('.' + groupPrefix + group).append(view.render().el);
            }


        },
        renderGroupContainers: function () {
            var model = this.model;
            var elements = model.get('elements');
            var groupList = _.unique(elements.pluck('group'));
            _.each(groupList, function (groupName) {
                if (this.$('.' + groupPrefix + groupName).length === 0) {
                    this.formEl.append('<div class="' + groupPrefix + groupName + '"></div>');
                }
            }, this);
        },

        renderMessageStack:function(){
            var messageStack = new MessageStack.Model();
            var messageStackView = new MessageStack.View({
                model:messageStack,
                el:this.$('.form-message-container')
            });
            messageStackView.render();

            this.on('showMessages',function(messages){
                messageStack.removeAllMessages();
                _.each(messages,function(message){
                    var messageModel = new MessageStack.Model(message);
                    messageStack.addMessage(messageModel.toJSON());
                });
            });

            this.on('clearMessages',function(error){
                messageStack.removeAllMessages();
            });
        },
        formSubmitHandler: function (e) {
            e.preventDefault();

            this.trigger('clearMessages');

            var dataObj = this.model.getValueObject();

            var actionId = this.model.get('actionId');

            if(this.options.prePostParser){
                dataObj = this.options.prePostParser(dataObj);
            }

            this.trigger('formSubmit', dataObj);
        },
        addToTypeViewIndex: function (type, View) {
            this.typeViewIndex[type] = View;
        },
        submitSuccessHandler:function(){
            console.log(arguments);
        },
        submitFailureHandler:function(resp, errors){
            _.each(errors, function(error){
                error.messageType='failure';
                error.expires = 0;
            });
            this.trigger('showMessages', errors);
        },
        setElementValue:function(name, value){
            var elements = this.model.get('elements');
            elements.get(name).set('value', value);
        }
    });



    return {
        Model:FormModel,
        View:FormView,
        ElementModel:ElementModel,
        ElementCollection:ElementCollection,
        ElementView:ElementView
    };
});

define('text!widgets/header/header.html',[],function () { return '<div>\n    <a href="http://ravihamsa.com">Ravi Hamsa</a>\n    <ul class="nav nav-pills">\n        <li class="examples"><a href="#examples/landing">Examples</a></li>\n        <li class="studio"><a href="#studio">Studio</a></li>\n    </ul>\n</div>';});

define('widgets/header',['base', 'text!./header/header.html'],function(Bone, template){

    var HeaderView = Bone.View.extend({
        template:template,
        appIdChangeHandler:function(value){
            this.$('.active').removeClass('active');
            this.$('.'+value).addClass('active');
        }
    });

    return {
        View:HeaderView,
        Model:Bone.Model
    };
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
define('widgets/tab',[
    'base/app',
    'base',
    'list/singleSelect'
    ],
    function(app, Base, SingleSelect){

        var baseUtil =  Base.util;

        var NavItemView = Base.View.extend({
            tagName:'li',
            template:'<a href="#{{id}}" class="action">{{name}}</a>',
            changeHandler:function(){
                this.$el.toggleClass('active',this.model.is('selected'));
            }
        })

        var TabItemView = Base.View.extend({
            changeHandler:function(){
                this.$el.toggle(this.model.is('selected'));
            }
        })

        var View = SingleSelect.View.extend({
            template:'<div class="prop-tabs"><ul class="ib-list"></ul></div><div class="tab-panes"></div> ',
            postRender:function(){
                var items = this.model.get('items');
                var navListView = baseUtil.createView({
                    View:Base.CollectionView,
                    collection:items,
                    el:this.$('.ib-list'),
                    itemView:NavItemView
                })

                var tabListView = baseUtil.createView({
                    View:Base.CollectionView,
                    tagName:'div',
                    collection:items,
                    el:this.$('.tab-panes'),
                    itemView:TabItemView
                })


            },
            actionHandler:function(selectedId){
                this.model.setSelectedById(selectedId);
            }
        })


        return {
            View:View,
            Model:SingleSelect.Model
        }

    });
define('widgets',['require','widgets/form','widgets/header','widgets/messageStack','widgets/tab'],function (require) {

    return {
        Form: require('widgets/form'),
        Header: require('widgets/header'),
        MessageStack: require('widgets/messageStack'),
        Tab: require('widgets/tab')
    }
});