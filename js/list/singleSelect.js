define(['base'], function(Base) {

    var baseUtil = Base.util;

    var View = Base.View.extend({
        template: '<div class="list-view"></div>',
        postRender: function() {
            var items = this.model.get('items');
            var listView = baseUtil.createView({
                View: Base.CollectionView,
                collection: items,
                parentEl: this.$('.list-view'),
                itemView: this.getOption('ItemView') || ItemView
            });
        },
        actionHandler: function(selectedId) {
            this.model.setSelectedById(selectedId);
        }
    });

    var ItemModel = Base.Model.extend({
        defaults: {
            selected: false
        },
        select: function() {
            this.set('selected', true);
        },
        deselect: function() {
            this.set('selected', false);
        },
        toggleSelect: function() {
            var selected = this.is('selected');
            this.set('selected', !selected);
        }
    });

    var ItemView = Base.View.extend({
        tagName: 'li',
        className: 'single-select-item',
        template: '<a href="#{{id}}" class="action">{{name}}</a>',
        changeHandler: function() {
            this.render();
            this.$el.toggleClass('active', this.model.is('selected'));
        }
    });

    var ItemCollection = Base.Collection.extend({
        model: ItemModel
    });


    var setupFunctions = [setupSingleSelection];

    var Model = Base.Model.extend({
        constructor: function(options) {
            var _this = this;
            Base.Model.call(_this, options);
            _.each(setupFunctions, function(func) {
                func.call(_this, options);
            });
        }
    });

    function setupSingleSelection() {

        var _this = this, selected, previousSelected;

        var coll = _this.get('items');

        if(!coll){
            coll = new ItemCollection();
            _this.set('items', coll);
        }

        var selectedItem = coll.findWhere({selected: true});
        if (selectedItem) {
            selected = selectedItem;
            previousSelected = selectedItem;
        }

        var updateSelected = function() {
            _this.set('selectedItem', selected);
        };

        _this.getSelected = function() {
            return selected;
        };

        _this.prevSelected = function() {
            return previousSelected;
        };

        _this.setSelectedById = function(id) {
            var curItem = coll.get(id);
            if (!selected) {
                selected = curItem;
                curItem.select();
                updateSelected();
                return;
            }
            if (curItem.id === selected.id) {
                return;
            }
            previousSelected = selected;
            selected = curItem;
            previousSelected.deselect();
            curItem.select();
            updateSelected();
        };

        _this.setSelected = function(curItem) {
            if(!curItem){
                updateSelected();
                return;
            }

            if (!selected) {
                selected = curItem;
                curItem.select();
                updateSelected();
                return;
            }

            if (curItem.id === selected.id) {
                return;
            }
            previousSelected = selected;
            selected = curItem;
            previousSelected.deselect();
            curItem.select();
            updateSelected();
        };

        _this.clearSelection = function() {
            previousSelected = selected;
            selected = null;
            previousSelected.deselect();
            updateSelected();
        };

        _this.selectFirst = function(){
            _this.setSelected(coll.first());
        }
    }

    return {
        View: View,
        Model: Model,
        ItemModel: ItemModel,
        ItemView: ItemView,
        ItemCollection: ItemCollection
    };

});
