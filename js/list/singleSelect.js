define(['base'], function (Base) {

    var baseUtil = Base.util;

    var View = Base.View.extend({
        template: '<div class="list-view"></div>',
        postRender: function () {
            var _this = this;
            var items = this.model.get('items');
            var listView = baseUtil.createView({
                View: Base.CollectionView,
                collection: items,
                parentEl: _this.$('.list-view'),
                itemView: _this.getOption('ItemView') || ItemView,
                parentView: _this
            });
        },
        actionHandler: function (selectedId) {
            this.model.setSelectedById(selectedId);
        }
    });

    var ItemModel = Base.Model.extend({
        defaults: {
            selected: false
        },
        select: function () {
            this.set('selected', true);
        },
        deselect: function () {
            this.set('selected', false);
        },
        toggleSelect: function () {
            var selected = this.is('selected');
            this.set('selected', !selected);
        }
    });

    var ItemView = Base.View.extend({
        tagName: 'li',
        className: 'single-select-item',
        template: '<a href="#{{id}}" class="action">{{name}}</a>',
        changeHandler: function () {
            this.render();
            this.$el.toggleClass('active', this.model.is('selected'));
        }
    });

    var ItemCollection = Base.Collection.extend({
        model: ItemModel
    });


    var setupFunctions = [setupSingleSelection];

    var Model = Base.Model.extend({
        constructor: function (options) {
            var _this = this;
            Base.Model.call(_this, options);
            _.each(setupFunctions, function (func) {
                func(_this,  {});
            });
        }
    });

    function setupSingleSelection(model) {

        var selected, previousSelected;

        var coll = model.get('items');

        if (!coll) {
            coll = new ItemCollection();
            model.set('items', coll);
        }

        var selectedItem = coll.findWhere({selected: true});
        if (selectedItem) {
            selected = selectedItem;
            previousSelected = selectedItem;
        }

        var updateSelected = function () {
            model.set('selectedItem', selected);
        };

        model.getSelected = function () {
            return selected;
        };

        model.getSelectedIndex = function () {
            if(selected!== undefined){
                return coll.indexOf(selected);
            }else{
                return -1;
            }

        };

        model.prevSelected = function () {
            return previousSelected;
        };

        model.setSelectedById = function (id) {
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

        model.setSelected = function (curItem) {
            if (!curItem) {
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

        model.clearSelection = function () {
            previousSelected = selected;
            selected = null;
            previousSelected.deselect();
            updateSelected();
        };

        model.selectFirst = function () {
            model.setSelected(coll.first());
        }

        model.selectAt = function(index){
            if(coll.at(index)){
                model.setSelected(coll.at(index));
            }else{
                model.selectFirst();
            }
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
