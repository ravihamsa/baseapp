define(['require', 'base/router'], function(require, Router) {

    var hex_md5 = window.hex_md5;


    var templateIndex = {}, dataIndex = {};

    var app = {
        root: '/',
        baseUrl: 'js/',
        defaultApp: 'default',
        appBody: '#app-body',
        compileTemplate: function(str) {
            return Handlebars.compile(str);
        },
        router: new Router(),
        getTemplateDef: function(template) {
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
                } else if (typeof template === 'string') {
                    //app.log(template, template.length, template.indexOf('.html'));
                    //if template is an url
                    //console.log(template.indexOf('.html'), template.length - 5);
                    if (/html$/.test(template)) {
                        require(['text!' + template], function(txt) {
                            def.resolve(_this.compileTemplate(txt));
                        });
                    } else if (template.indexOf('#') === 0) {
                        def.resolve(_this.compileTemplate($(template).html()));
                    } else {
                        //if template is a template string
                        def.resolve(_this.compileTemplate(template));
                    }
                }
            }
            return def;
        },
        cacheTemplate: function(def, hash) {
            templateIndex[hash] = def;
        },
        cacheData: function(def, hash) {
            dataIndex[hash] = def;
        },
        log: function() {
            console.log.apply(console, arguments);
        },
        getString: function(str) {
            return str;
        },
        parseSuccessResponse: function(resp) {
            return resp;
        },
        parseFailureResponse: function(resp) {
            return resp;
        },
        appModel: new Backbone.Model(),
        getRequestDef: function(config) {
            var _this = this;
            var attributeName = config.name || '';
            var responseParser = config.parser;
            config = _.omit(config, 'name', 'parser');


            var hash = getHash(JSON.stringify(_.pick(config, 'id', 'params')));
            var def = getRequestDefByHash(hash);

            if (!def) {
                def = $.Deferred();
                $.ajax(config).done(function(resp) {
                    var parserFunc = responseParser || _this.parseSuccessResponse;
                    var parsedResponse = parserFunc(resp);
                    if (parsedResponse.errors) {
                        def.reject(parsedResponse.errors);
                    } else {
                        _this.cacheData(def, hash);
                        def.resolve(parsedResponse);
                    }
                }).fail(function(resp) {
                        var parserFunc = responseParser || _this.parseFailureResponse;
                        var parsedResponse = parserFunc(resp);
                        def.reject(parsedResponse.errors);
                    });

            }
            return def;
        },
        makeRequest: function(task, callback) {
            var def = this.getRequestDef(task);
            def.done(function(results) {
                callback(null, results);
            });
            def.fail(function(errors) {
                callback(errors);
            });
        },
        beautifyId: function(s) {
            s = s.replace(/([A-Z])/g, function(s) {return ' ' + s});
            return s.replace(/(^.)/g, function(s) {return s.toUpperCase()});
        },
        getDataIndex: function() {
            return dataIndex;
        },
        getTemplateIndex:function(){
            return templateIndex;
        }
    };


    var getHash = function(key) {
        return key.toString();
    };

    var getTemplateDefByHash = function(hash) {
        return templateIndex[hash];
    };
    var getRequestDefByHash = function(hash) {
        return dataIndex[hash];
    };


    return app;


});
