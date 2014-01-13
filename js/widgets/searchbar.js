define([
        'base/app',
        'base',
        'text!./searchbar/searchbar.html'
    ],
    function(app, Base, template) {

        "use strict";


        var View = Base.View.extend({
            template:template,
            className:'search-bar',
            states:{
                'closed':function(){
                    this.$el.removeClass('open');
                },
                'open':function(){
                    this.$el.addClass('open');
                    this.$('input').focus();
                }
            },
            actionHandler:function(action){
                if(action === 'open'){
                    this.setState(this.getState() === 'closed'?'open':'closed');
                }
            }

        });
        
        return {
            View: View,
            Model: Base.Model
        };

    });