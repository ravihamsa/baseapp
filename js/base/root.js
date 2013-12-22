define(['base/view', 'base/app', 'widgets/header'], function(BaseView, baseApp, Header) {

    var currentPageView;


    var renderPage = function(appId, pageId, params){
        if(currentPageView){

            console.log('currentPageView removed ', new Date().toLocaleTimeString());
            currentPageView.remove();
        }

        require(['apps/' + appId + '/pages/'+pageId], function(Page){
            var view = new Page.View({
                model: baseApp.appModel
            });
            var el = $(baseApp.appBody);
            el.empty();
            el.html(view.el);
            view.render();
            currentPageView = view;
        })
    }

    var RootView = BaseView.extend({
        changeHandler: function(changes) {
            var attr = this.model.toJSON();
            if (changes.appId) {
                require(['apps/' + attr.appId], function() {
                    require(['apps/' + attr.appId + '/app'], function(currentApp) {
                        var pageId = attr.pageId || currentApp.defaultPage;
                        renderPage(attr.appId,pageId, attr);
                    });
                });
            }else if (changes.hasOwnProperty('pageId')) {
                require(['apps/' + attr.appId + '/app'], function(currentApp) {
                    var pageId = attr.pageId || currentApp.defaultPage;
                    renderPage(attr.appId,pageId, attr);
                });
            }
        }
    });

    return {
        View: RootView
    };

});
