define(['require', 'base/router', 'base/dataLoader', 'base/formatter'], function (require, Router, dataLoader) {

    var hex_md5 = window.hex_md5;

    var getHash = function (key) {
        return hex_md5(key.toString());
    };

    var getTemplateDefByHash = function (hash) {
        return templateIndex[hash];
    };
    var getRequestDefByHash = function (hash) {
        return dataIndex[hash];
    };


    var templateIndex = {}, dataIndex = {};

    var app = {
        root: '/',
        baseUrl: 'js/',
        defaultApp: 'default',
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
                } else if (typeof template === 'string') {
                    //app.log(template, template.length, template.indexOf('.html'));
                    //if template is an url
                    //console.log(template.indexOf('.html'), template.length - 5);
                    if (/html$/.test(template)) {
                        require(['text!' + template], function (txt) {
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


            //fetch request config for dataLoader request index
            var requestConfig = dataLoader.getConfig(config.id);
            requestConfig.paramsParser = requestConfig.paramsParser || _.identity;

            //default parsers
            var successParser = _this.parseSuccessResponse, failureParser = _this.parseFailureResponse;

            //if defined consider custom parser
            if (requestConfig.parser) {
                successParser = failureParser = requestConfig.parser;
            }

            //get hash of id and parameters
            var hash = getHash(JSON.stringify(_.pick(config, 'id', 'params')));

            //check if given hash already has a request running;
            var def = getRequestDefByHash(hash);

            if (!def) {
                def = $.Deferred();
                var request = dataLoader.getRequest(config.id,requestConfig.paramsParser(config.params));

                request.done(function (resp) {
                    var parsedResponse = successParser(resp);
                    if (parsedResponse.errors) {
                        def.resolve(parsedResponse.errors);
                    } else {
                        _this.cacheData(def, hash);
                        def.resolve(parsedResponse);

                    }
                })

                request.fail(function (resp) {
                    def.resolve({errors:[{errorCode:'network issue', message:'Network failure try again later'}]});
                });

            }
            return def;
        },
        beautifyId: function (s) {
            s = s.replace(/_([a-z])/g, function (s) {
                return s.toUpperCase()
            });

            s= s.replace(/_/g,'');

            s = s.replace(/([A-Z])/g, function (s) {
                return ' ' + s
            });

            return s.replace(/(^.)/g, function (s) {
                return s.toUpperCase()
            });
        },
        getDataIndex: function () {
            return dataIndex;
        },
        getTemplateIndex: function () {
            return templateIndex;
        },
        getFormatted:function(value, format, dataObj){
            if(typeof format === 'function'){
                return format.apply(null, arguments);
            }

            var formatter = formatterIndex[format];
            if(formatter){
                return formatter(value, dataObj);
            }else{
                return value;
            }

        },
        addFormatter:function(type, formatterFunction){
            if(formatterIndex[type]){
                throw new Error('formatter already exist');
            }else{
                this.setFormatter.apply(null, arguments);
            }
        },
        setFormatter:function(type, formatterFunction){
            formatterIndex[type] = formatterFunction;
        },
        getHash: getHash
    };


    var formatterIndex = {

    };


    return app;


});
