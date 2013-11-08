define(['base/view', 'base/itemView', 'base/util'], function(BaseView, BaseItemView, util) {

    var setupCollectionRender = function() {
        var _this = this;
        var viewIndex = {};
        var el = this.$el;
        var coll = this.collection;

        _this.addItem = function(model, containerEl) {
            if (!containerEl) {
                containerEl = el;
            }
            var index = coll.indexOf(model);

            var ItemView = _this.getOption('itemView') || BaseItemView;
            var view = util.createView({model: model, attributes:{'data-id':model.id}, View: ItemView, parentView:_this});
            viewIndex[model.id] = view;

            var index = coll.indexOf(model);
            if (index === 0) {
                view.$el.prependTo(containerEl);
            }else if (index >= coll.length - 1) {
                view.$el.appendTo(containerEl);
            }else {
                var beforeView = _this.getViewByModelId(coll.at(index - 1).id);
                view.$el.insertAfter(beforeView.$el);
            }

        };

        _this.removeItem = function(model) {
            var view = _this.getViewByModelId(model.id);
            view.remove();
        };

        _this.getViewByModelId = function(id) {
            return viewIndex[id];
        };

        _this.removeReferences(function(){
            _this = null;
            viewIndex = null;
            el = null;
            coll = null;
        })


    };


    var CollectionView = BaseView.extend({
        constructor: function (options) {
            var _this = this;
            BaseView.call(_this, options);
            _.each([setupCollectionRender], function (func) {
                func.call(_this, options);
            });
        },
        tagName: 'ul',
        dataEvents: {
            'add' : 'addHandler',
            'remove': 'removeHandler',
            'reset':'resetHandler'
        },
        postRender: function() {
            var _this = this;
            var el = this.$el;
            var coll = this.collection;
            el.hide();
            coll.each(function(model) {
                _this.addItem(model, el);
            });
            el.show();
        },
        addHandler: function(event, model) {
            this.addItem(model);
        },
        removeHandler: function(event,model) {
            this.removeItem(model);
        },
        resetHandler:function(event, collection, options){
            var _this = this;
            var prevModels = options.previousModels;
            _.each(prevModels,function(model){
                _this.getViewByModelId(model.id).remove();
            })
            collection.each(function(model){
                _this.addItem(model);
            })

        }
    });



    return CollectionView;
});
