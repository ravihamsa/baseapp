define(['base/view'], function(BaseView) {

    var ItemView = BaseView.extend({
        tagName: 'li',
        template: '{{name}}'
    });

    return ItemView;
});
