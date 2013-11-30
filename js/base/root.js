define(['base/view', 'base/model', 'widgets/header'], function(BaseView, BaseModel, Header) {

    var RootView = BaseView.extend({
        changeHandler: function(changes) {
            var attr = this.model.toJSON();
            if (changes.appId) {
                require(['apps/' + attr.appId], function() {
                    require(['apps/' + attr.appId + '/app'], function(app) {
                        app.renderPage(attr.pageId, attr);
                    });
                });
            }else if (changes.pageId) {
                require(['apps/' + attr.appId + '/app'], function(app) {
                    app.renderPage(attr.pageId, attr);
                });
            }
        }
    });

    return {
        View: RootView
    };

});
