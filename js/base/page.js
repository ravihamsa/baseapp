define(['base', 'widgets/header'],function(Base, Header){

    var PageView = Base.View.extend({
        postRender:function(){
            var header = new Header.View({
                el:this.$('#header'),
                model:this.model
            });
            header.render();
        },
        changeHandler:function(changes){
            var attr = this.model.toJSON();
            if(changes.appId){
                require(['apps/'+attr.appId],function(){
                    require(['apps/'+attr.appId+'/app'], function(app){
                        app.renderPage(attr.pageId, attr);
                    })
                })
            }else if(changes.pageId){
                require(['apps/'+attr.appId+'/app'], function(app){
                    app.renderPage(attr.pageId, attr);
                })
            }
        }
    });

    var PageModel = Base.Model.extend({

    })

    return {
        Model:PageModel,
        View:PageView
    }

})
