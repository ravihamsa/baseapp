define(['base/app', 'base/model', 'base/util'], function(app, BaseModel, util) {

    var BaseView = Backbone.View.extend({
        constructor: function(options) {
            var _this = this;
            Backbone.View.call(_this, options);
            _.each(setupFunctions, function(func) {
                func.call(_this, options);
            });
        },
        render: function() {
            var _this = this;
            _this.beforeRender();
            app.getTemplateDef(_this.getTemplate()).done(function(templateFunction) {
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
        postRender: function() {

        },
        beforeRender: function() {

        },
        renderTemplate: function(templateFunction) {
            //console.log(this.template, templateFunction(this.model.toJSON()));
            this.$el.html(templateFunction(this.model.toJSON()));
        },
        getOption: function(option) {
            return this.options[option];
        },
        actionHandler: function() {

        },
        loadingHandler: function(isLoading) {
            this.$el.toggleClass('loading', isLoading);
        },
        addMethod: function(methodName, func) {
            if (!this[methodName]) {
                this[methodName] = func;
            }
        }
    });


    var bindDataEvents = function() {
        var _this = this;
        var modelOrCollection = _this.model || _this.collection;
        var eventList, _this;
        eventList = _this.dataEvents;
        _.each(eventList, function(handler, event) {
            var events, handlers, splitter;
            splitter = /\s+/;
            handlers = handler.split(splitter);
            events = event.split(splitter);
            _.each(handlers, function(shandler) {
                _.each(events, function(sevent) {
                    modelOrCollection.on(sevent, function() {
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

    var setupStateEvents = function() {
        var _this = this;
        var stateConfigs = _this.getOption('states');
        if (!stateConfigs) {
            return;
        }

        var state;
        var statedView;


        var cleanUpState = function() {
            if (statedView) {
                statedView.off();
                statedView.remove();
            }

        };

        var renderState = function(StateView) {
            statedView = util.createView({
                View: StateView,
                model: _this.model,
                parentEl: _this.$('.state-view')
            });
        };

        _this.setState = function(toState) {
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

        _this.getState = function() {
            return state;
        };

    };

    var setupTemplateEvents = function() {
        (function(that) {
            var template = that.getOption('template') || that.template;
            //if (template) {
            that.setTemplate = function(newTemplate) {
                template = newTemplate;
                that.render();
            };

            that.getTemplate = function() {
                return template;
            };
            //}
        })(this);
    };

    var setupSubViews = function() {
        var _this = this;
        var views = {};

        var subViewConfigs = _this.getOption('views');

        if (!subViewConfigs) {
            return;
        }

        _.each(subViewConfigs, function(viewConfig, viewName) {
            if (viewConfig.parentEl && typeof viewConfig.parentEl === 'string') {
                viewConfig.parentEl = _this.$(viewConfig.parentEl);
            }
            views[viewName] = util.createView(viewConfig);
        });

        _this.getSubView = function(id) {
            var subView = views[id];
            if (subView) {
                return subView;
            } else {
                throw new Error('No View Defined for id :' + id);
            }
        };

    };


    var setupAttributeWatch = function() {
        var _this = this;
        var model = _this.model;
        if (model) {
            model.on('change', _.bind(watchAttributes, _this));
            syncAttributes.call(_this, model);
        }

    };

    var watchAttributes = function(model) {
        var changes = model.changedAttributes();
        _.each(changes, function(value, attribute) {
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

    var syncAttributes = function(model) {
        var changes = model.toJSON();
        _.each(changes, function(value, attribute) {
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

    var setupActionNavigateAnchors = function() {
        var _this = this;
        var verifyPropagation = function(e) {
            if (e.actionHandled) {
                e.stopPropagation();
                $('body').trigger('click');
            }
        };
        _this.$el.on('click', '.action', function(e) {
            e.preventDefault();
            var target = $(e.currentTarget);
            var action = target.attr('href').substr(1);
            _this.actionHandler.call(_this, action, e);
            verifyPropagation(e);
        });

        _this.$el.on('click', '.dummy', function(e) {
            e.preventDefault();
        });
    };

    var setupOnChangeRender = function() {
        var _this = this;
        if (this.getOption('renderOnChange') === true) {
            _this.model.on('change', function() {
                _this.render.call(_this);
            });
        }
    };




    var setupMetaRequests = function() {
        var _this = this;
        var requestConfigs = _this.getOption('requests') || _this.requests;
        var loading = false;

        var defArray = [];

        var addRequest = function(config, callback) {
            var def = app.getRequestDef(config);
            defArray.push(def);
            def.done(callback);
            def.fail(callback);
            return def;
        };

        var requestQue = util.aSyncQueue(addRequest);
        requestQue.added = function() {
            loading = true;
            _this.loadingHandler.call(_this, loading);
        };
        requestQue.drain = function() {
            loading = false;
            defArray=[];
            _this.loadingHandler.call(_this, loading);
        };


        requestQue.push(requestConfigs || [], function(data) {
            _this.model.set(data);
        });

        _this.loadMeta = function() {
            return $.when.apply(null, defArray);
        };

        _this.addRequest = function(config, callback) {
            requestQue.push(config, callback);
        };

        /*


        _this.getRequestQue = function(){
            return requestQue;
        }

        */


    };

    var setupFunctions = [bindDataEvents, setupTemplateEvents, setupAttributeWatch, setupActionNavigateAnchors, setupOnChangeRender, setupStateEvents, setupMetaRequests];

    return BaseView;
});
