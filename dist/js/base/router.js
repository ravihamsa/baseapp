define(function (require) {

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

})