define(['base/app', 'base/model', 'base/util'], function (app, BaseModel, util) {
    var BaseView = Backbone.View.extend({
        constructor: function (options) {
            var _this = this;
            Backbone.View.call(_this, options);
            _this.removeQue = [];
            _.each(setupFunctions, function (func) {
                func.call(_this, options);
            });
            /*
             _.each(_this.extensions, function (func) {
             func.call(_this, options);
             });

             var addOns = _this.getOption('addOns')
             if (addOns && addOns.length > 0) {
             _.each(addOns, function (func) {
             func.call(_this, options);
             })
             }
             */


        },
        render: function () {
            var _this = this;
            _this.beforeRender();

            var continueRender = function () {
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

            }

            var metaLoadSuccess = function () {

                continueRender();
            }

            var metaDef = _this.loadMeta();
            metaDef.done(metaLoadSuccess)
            return _this;
        },
        postRender: function () {

        },
        beforeRender: function () {

        },
        renderTemplate: function (templateFunction) {
            //console.log(this.template, templateFunction(this.model.toJSON()));
            var useDeepJSON = this.getOption('useDeepJSON');
            this.$el.html(templateFunction(this.model.toJSON(useDeepJSON)));
        },
        getOption: function (option) {
            //console.log(option, this.options[option],this[option]);
            return this.options[option] || this[option];
        },
        loadingHandler: function (isLoading) {
            this.$el.toggleClass('loading', isLoading);
        },
        metaLoadErrorHandler: function () {
            this.$el.html('Error Loading Meta Data');
        },
        addMethod: function (methodName, func) {
            if (!this[methodName]) {
                this[methodName] = func;
            }
        },
        remove:function(){
            console.log('removing view');
            this.removeChildViews();
            Backbone.View.prototype.remove.call(this);
            this.removeCalls();
            this.removeQue = null;
        },
        removeCalls:function(func){
            if(func){
                this.removeQue.push(func);
            }else{
                _.each(this.removeQue,function(func){
                    func.call(this);
                })
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
                    _this.listenTo(modelOrCollection,sevent, function () {
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
    };

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
                statedView.remove();
            }
        };

        var renderState = function (StateView) {
            statedView = util.createView({
                View: StateView,
                model: _this.model,
                parentEl: _this.$('.state-view'),
                parentView:_this
            });
        };

        _this.setState = function (toState) {
            if (typeof toState === 'string') {
                if (state === toState) {
                    return;
                }
                state = toState;
                var StateView = stateConfigs[toState];
                if (StateView) {
                    cleanUpState();
                    renderState(StateView);
                } else {
                    throw new Error('Invalid State');
                }

            } else {
                throw new Error('state should be a string');
            }
        };

        _this.getState = function () {
            return state;
        };

        _this.removeCalls(function(){
            stateConfigs = null;
            state=null;
            statedView=null;
            _this=null;
        })

    };

    var setupTemplateEvents = function () {
        var _this = this;
        var template = _this.getOption('template') || _this.template;
        //if (template) {
        _this.setTemplate = function (newTemplate) {
            template = newTemplate;
            _this.render();
        };

        _this.getTemplate = function () {
            return template;
        };

        _this.removeCalls(function(){
            template=null;
            _this=null;
        })
    };

    var setupSubViews = function () {
        var _this = this;
        var views = {};

        var subViewConfigs = _this.getOption('views');

        _.each(subViewConfigs, function (viewConfig, viewName) {
            if (viewConfig.parentEl && typeof viewConfig.parentEl === 'string') {
                viewConfig.parentEl = _this.$(viewConfig.parentEl);
                viewConfig.parentView = _this;
            }
            views[viewName] = util.createView(viewConfig);
        });

        _this.getSubView = function (id) {
            var subView = views[id];
            if (subView) {
                return subView;
            } else {
                throw new Error('No View Defined for id :' + id);
            }
        };

        _this.getSubModel = function (viewId) {
            return _this.getSubView(viewId).model;
        }

        _this.getSubAttribute = function (viewId, attributeName) {
            return _this.getSubModel(viewId).get(attributeName);
        }

        _this.removeCalls(function(){
            subViewConfigs=null;
            views=null;
            _this=null;
        })

    };


    var setupAttributeWatch = function () {
        var _this = this;
        var model = _this.model;
        if (model) {
            _this.listenTo(model,'change', _.bind(watchAttributes, _this));
            syncAttributes.call(_this, model);
        }

    };

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
    };

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
    };

    var setupActionNavigateAnchors = function () {
        var _this = this;
        var verifyPropagation = function (e) {
            if (e.actionHandled) {
                e.stopPropagation();
                $('body').trigger('click');
            }
        };

        if (_this.actionHandler) {
            _this.$el.on('click', '.action', function (e) {
                e.preventDefault();
                var target = $(e.currentTarget);
                var action = target.attr('href').substr(1);
                _this.actionHandler.call(_this, action, e);
                verifyPropagation(e);
            });
        }


        _this.$el.on('click', '.dummy', function (e) {
            e.preventDefault();
        });
    };

    var setupRenderEvents = function () {
        var _this = this;
        var renderEvents = this.getOption('renderEvents') || this.renderEvents;
        if (renderEvents && renderEvents.length > 0) {
            _this.listenTo(_this.model,renderEvents.join(' '), function () {
                _this.render.call(_this);
            });
        }

    };


    var setupMetaRequests = function () {
        var _this = this;
        var requestConfigs = _this.getOption('requests') || _this.requests;
        var runningRequestCount = 0;

        var bumpLoadingUp = function () {
            runningRequestCount++;
            _this.loadingHandler.call(_this, true);
        }

        var bumpLoadingDown = function () {
            runningRequestCount--;
            if (runningRequestCount === 0) {
                _this.loadingHandler.call(_this, false);
            }
        }
        _this.addRequest = function (config, callback) {
            var configArray = config;
            if (!_.isArray(configArray)) {
                configArray = [configArray];
            }

            var defArray = _.map(configArray, function (config) {
                var def = app.getRequestDef(config);
                def.always(bumpLoadingDown);
                if (config.callback) {
                    def.always(config.callback);
                }
                bumpLoadingUp();
                return def
            })

            var requestPromise = $.when.apply(null, defArray);

            if (callback) {
                requestPromise.then(callback);
            }

            return requestPromise;
        };

        _this.loadMeta = function () {
            if (!_this.metaDef) {
                var def = requestConfigs ? _this.addRequest(requestConfigs, function () {
                    var requestsParser = _this.getOption('requestsParser');
                    if (requestsParser) {
                        requestsParser.apply(_this, arguments);
                    }
                }) : $.when({});
                _this.metaDef = def;
            }
            return _this.metaDef;
        }


        _this.removeCalls(function(){
            requestConfigs=null;
            runningRequestCount=null;
            _this=null;
        })


    };

    var setupChildViews = function(){
        var _this = this;
        var childViews =[];
        _this.addChildView = function(view){
            childViews.push(view);
        }
        _this.removeChildViews = function(){
            _.each(childViews,function(view){
                if(view && view.remove){
                    view.remove();
                }
            });
        }

        _this.removeCalls(function(){
            childViews=null;
            _this=null;
        })
    }

    var setupFunctions = [bindDataEvents, setupMetaRequests, setupTemplateEvents, setupAttributeWatch, setupActionNavigateAnchors, setupRenderEvents, setupStateEvents, setupChildViews];

    return BaseView;
});
