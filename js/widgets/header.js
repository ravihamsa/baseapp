define(['base/view', 'base/model', 'text!./header/header.html'], function(BaseView, BaseModel, template) {

    var HeaderView = BaseView.extend({
        template: template,
        appIdChangeHandler: function(value) {
            this.$('.active').removeClass('active');
            this.$('.' + value).addClass('active');
        }
    });

    return {
        View: HeaderView,
        Model: BaseModel
    };
});
