define(['require', 'base/router', 'base/dataLoader', 'base/util', 'base/formatter', 'base/model'], function (require, Router, dataLoader, baseUtil, _formatter_,  BaseModel) {

    var hex_md5 = window.hex_md5;

    function checksum(s)
    {
        var i;
        var chk = 0x12345678;

        var start = 1, end = s.length+1; // to tackle 1 length strings

        for (i = start; i < end; i++) {
            chk += (s.charCodeAt(i-1) * i);
        }

        return chk;
    }


    var getHash = function (key) {
        //console.log(key, key.toString(), checksum(key.toString()))
        return checksum(key.toString());
        //return 'hash_'+(hashCounter++);

    };

    var getTemplateDefByHash = function (hash) {
        return templateIndex[hash];
    };
    var getRequestDefByHash = function (hash, id) {
        if(dataIndex[id] && dataIndex[id][hash]){
            return dataIndex[id][hash];
        }        
    };
    var clearDefById = function ( id) {
        
        if(dataIndex[id]){
            console.log('clearing cache for id', id);
            delete dataIndex[id];   
        }
          
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
        cacheData: function (def, hash, id) {
            if(!dataIndex[id]){
                dataIndex[id]=[];
            }
            dataIndex[id][hash] = def;
        },
        log: function () {
            console.log.apply(console, arguments);
        },
        getString: function (str) {
            return str;
        },
        escapeString:function(str){
            return Handlebars.Utils.escapeExpression(str);
        },
        responseParser: function (resp) {
            return resp;
        },
        parseFailureResponse: function (resp) {
            return resp;
        },
        appModel: new BaseModel(),
        getRequestDef: function (config) {
            var _this = this;


            //fetch request config for dataLoader request index
            var requestConfig = dataLoader.getConfig(config.id);
            requestConfig.paramsParser = requestConfig.paramsParser || _.identity;

            //default parsers
            var responseParser = this.responseParser;

            //console.log(requestConfig);

            //if defined consider custom parser
            if (requestConfig.responseParser) {
                responseParser = requestConfig.responseParser;
            }
            
            if(requestConfig.cacheDependencies){
                _.each(requestConfig.cacheDependencies,function(requestId){
                    clearDefById(requestId);
                });
            }

            config.params = requestConfig.paramsParser(config.params);

            //get hash of id and parameters
            var hash = getHash(JSON.stringify(_.pick(config, 'id', 'params')));

            //check if given hash already has a request running;
            var def = getRequestDefByHash(hash,config.id);

            if (!def) {
                def = $.Deferred();
                var request = dataLoader.getRequest(config.id,config.params);

                request.done(function (resp) {

                    if (resp.errors && resp.errors.length > 0) {
                        def.reject(resp.errors);
                    } else {
                        if(requestConfig.cache === 'session'){
                            _this.cacheData(def, hash, config.id);
                        }
                        var parsedResponse = responseParser(resp);
                        def.resolve(parsedResponse);
                    }
                })

                request.fail(function (resp) {
                    def.reject({errors:[{errorCode:'network issue', message:'Network failure try again later'}]});
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
        getUrl:function(appId, pageId, params){
            return '#'+appId+'/'+pageId+'/'+baseUtil.objectToParams(params);
        },
        navigateToPage:function(appId, pageId, params){
            app.router.navigate(app.getUrl.apply(app, arguments), {trigger:true});
        },
        getHash: getHash,
        getPageAttributes:function(){
            return this.appModel.toJSON();
        },
        getPageAttribute:function(attributeName){
            return this.appModel.get(attributeName);
        }
    };


    var formatterIndex = {

    };


    return app;


});
