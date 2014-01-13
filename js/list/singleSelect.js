define(['base'], function(Base) {

    "use strict";

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
        template: '<a href="#select" data-id="{{id}}" class="action">{{name}}</a>',
        changeHandler: function() {
            this.render();
            this.$el.toggleClass('active', this.model.is('selected'));
        }
    });

    var ItemCollection = Base.Collection.extend({
        model: ItemModel
    });

    var View = Base.View.extend({
        template: '<div class="list-view"></div>',
        views: {
            listView: function() {
                var _this = this;
                var items = this.model.get('items');
                return {
                    View: Base.CollectionView,
                    collection: items,
                    parentEl: '.list-view',
                    ItemView: _this.getOption('ItemView') || ItemView
                };
            }
        },
        actionHandler: function(action, event) {

            if (action === 'select') {
                var selectedId = $(event.target).data('id');
                this.model.setSelectedById(selectedId);
            }

        }
    });

    function setupSingleSelection(model) {

        var selected, previousSelected;

        var coll = model.get('items');

        if (!coll) {

            var ItemCollectionClass = model.getOption('ItemCollection') || ItemCollection;
            coll = new ItemCollectionClass();
            model.set('items', coll);
        }

        var selectedItem = coll.findWhere({
            selected: true
        });
        if (selectedItem) {
            selected = selectedItem;
            previousSelected = selectedItem;
        }

        var updateSelected = function() {
            model.set('selectedItem', selected);
            model.trigger('selectionChange', selected, previousSelected);
        };

        model.getSelected = function() {
            return selected;
        };

        model.getSelectedId = function() {
            return selected.id;
        };

        model.getSelectedIndex = function() {
            if (selected !== undefined) {
                return coll.indexOf(selected);
            } else {
                return -1;
            }

        };

        model.prevSelected = function() {
            return previousSelected;
        };

        model.setSelectedById = function(id) {
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

        model.setSelected = function(curItem) {
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

        model.clearSelection = function() {
            previousSelected = selected;
            selected = null;
            if (previousSelected) {
                previousSelected.deselect();
            }
            updateSelected();
        };

        model.selectFirst = function() {
            model.setSelected(coll.first());
        };

        model.selectAt = function(index) {
            if (coll.at(index)) {
                model.setSelected(coll.at(index));
            } else {
                model.selectFirst();
            }
        };

        updateSelected();

    }

    var setupFunctions = [setupSingleSelection];

        var Model = Base.Model.extend({
        constructor: function(options) {
            var _this = this;
            Base.Model.call(_this, options);
            _.each(setupFunctions, function(func) {
                func(_this, {});
            });
        }
    });

    return {
        View: View,
        Model: Model,
        ItemModel: ItemModel,
        ItemView: ItemView,
        ItemCollection: ItemCollection
    };

});