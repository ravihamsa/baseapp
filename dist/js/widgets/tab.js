define([
    'base/app',
    'base',
    'list/singleSelect'
    ],
    function(app, Base, SingleSelect) {

        var baseUtil = Base.util;

        var NavItemView = Base.View.extend({
            tagName: 'li',
            template: '<a href="#{{id}}" class="action">{{name}}</a>',
            changeHandler: function() {
                this.$el.toggleClass('active', this.model.is('selected'));
            }
        });

        var TabItemView = Base.View.extend({
            changeHandler: function() {
                this.$el.toggle(this.model.is('selected'));
            }
        });

        var View = SingleSelect.View.extend({
            template: '<div class="prop-tabs"><ul class="ib-list"></ul></div><div class="tab-panes"></div> ',
            postRender: function() {
                var items = this.model.get('items');
                var navListView = baseUtil.createView({
                    View: Base.CollectionView,
                    collection: items,
                    el: this.$('.ib-list'),
                    itemView: NavItemView
                });

                var tabListView = baseUtil.createView({
                    View: Base.CollectionView,
                    tagName: 'div',
                    collection: items,
                    el: this.$('.tab-panes'),
                    itemView: TabItemView
                });


            },
            actionHandler: function(selectedId) {
                this.model.setSelectedById(selectedId);
            }
        });


        return {
            View: View,
            Model: SingleSelect.Model
        };

    });
