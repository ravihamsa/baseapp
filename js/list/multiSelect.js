define(['base', 'list/singleSelect'], function(Base, SingleSelect) {


    var setupFunctions = [setupMultiSelection];

    var Model = Base.Model.extend({
        constructor: function(options) {
            var _this = this;
            Base.Model.call(_this, options);
            _.each(setupFunctions, function(func) {
                func.call(_this, options);
            });
        }
    });


    function setupMultiSelection() {

        var _this = this, selected = [];

        var coll = _this.get('items');



        _this.getSelected = function() {
            return selected;
        };

        _this.setSelectedById = function(id) {
            var curItem = coll.get(id);
            curItem.toggleSelect();
            updateSelected();
        };

        _this.setSelected = function(curItem) {
            curItem.toggleSelect();
            updateSelected();
        };

        _this.selectAll = function() {
            coll.each(function(model) {
                model.select();
            });
            updateSelected();
        };

        _this.selectNone = function() {
            coll.each(function(model) {
                model.deselect();
            });
            updateSelected();
        };
        var updateSelected = function() {
            selected = coll.where({selected: true});
            _this.set('selectedCount', selected.length);
        };

        updateSelected();
    }

    return {
        View: SingleSelect.View,
        Model: Model,
        ItemView: SingleSelect.ItemView,
        ItemCollection: SingleSelect.ItemCollection
    };

});
