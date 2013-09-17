define(function() {

    var BaseModel = Backbone.Model.extend({
        is: function(attribute) {
            return this.get(attribute) === true;
        },
        isNot: function(attribute) {
            return this.get(attribute) === false;
        },
        isEqual: function(attribute, value) {
            return this.get(attribute) === value;
        },
        isNotEqual: function(attribute, value) {
            return this.get(attribute) !== value;
        },
        removeSelf: function() {
            if (this.collection) {
                this.collection.remove(this);
            }
        },
        moveUp: function() {
            var coll = this.collection;
            if (!coll) {
                return;
            }
            var index = coll.indexOf(this);
            if (index === 0) {
                return;
            }
            this.removeSelf();
            coll.add(this, {at: index - 1});
        },
        moveDown: function() {
            var coll = this.collection;
            if (!coll) {
                return;
            }
            var index = coll.indexOf(this);
            if (index === coll.length - 1) {
                return;
            }
            this.removeSelf();
            coll.add(this, {at: index + 1});
        },
        getClosest: function() {
            var coll = this.collection;
            if (!coll || coll.length < 2) {
                return;
            }
            var index = coll.indexOf(this);
            var prev = coll.at(index - 1);
            if (prev) {
                return prev;
            }else {
                return coll.at(index + 1);
            }
        }
    });

    return BaseModel;
});
