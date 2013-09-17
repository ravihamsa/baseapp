define(['base', 'text!./messageStack/messageStack.html'], function(Bone, template) {

    var MessageStack = Bone.View.extend({
        template: template

    });

    var MessageStackModel = Bone.Model.extend({
        removeAllMessages: function() {

        }
    });

    return {
        View: MessageStack,
        Model: MessageStackModel
    };
});
