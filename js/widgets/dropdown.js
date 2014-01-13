define([
        'base/app',
        'base',
        'list/singleSelect',
        'text!./dropdown/dropdown.html'
    ],
    function(app, Base, SingleSelect, template) {

        "use strict";

        var SelectionSummaryView = Base.View.extend({
            template:'',
            selectedItemChangeHandler:function(selectedModel){
                this.$el.html(selectedModel.get('name'));
            }
        });

        var SingleSelectView = SingleSelect.View.extend({
            template: template,
            events:{
                'click .toggle-but':'toggleState',
                'click .toggle-body':'hideBody'
            },
            states:{
                'closed':function(){
                   this.$el.removeClass('open');
                },
                'open':function(){
                    this.$el.addClass('open');
                }
            },
            toggleState:function(){
                this.setState(this.getState() === 'closed'?'open':'closed');
            },
            views: {
                listView: SingleSelect.View.prototype.views.listView,
                summaryView: function(){
                    return {
                        View:SelectionSummaryView,
                        model:this.model,
                        parentEl:'.summary-view'
                    };
                }
            },
            selectedItemChangeHandler:function(){
                this.hideBody();
            },
            hideBody:function(){
                this.setState('closed');
            },
            className:'drop-down'
        });

        return {
            SingleSelectView: SingleSelectView,
            SingleSelectModel: SingleSelect.Model
        };

    });