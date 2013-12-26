define(function () {

    var BaseModel = Backbone.Model.extend({
        constructor: function (attributes, options) {
            var _this = this;

            if (options && options.defaults) {
                _this.defaults = options.defaults;
            }
            if (!options) {
                _this.options = {};
            }

            Backbone.Model.apply(_this, arguments);
        },
        is: function (attribute) {
            return this.get(attribute) === true;
        },
        isNot: function (attribute) {
            return this.get(attribute) === false;
        },
        isEqual: function (attribute, value) {
            return this.get(attribute) === value;
        },
        isNotEqual: function (attribute, value) {
            return this.get(attribute) !== value;
        },
        removeSelf: function () {
            if (this.collection) {
                this.collection.remove(this);
            }
        },
        insertAfter: function (attributes) {
            var coll = this.collection;
            var index = coll.indexOf(this);
            coll.add(attributes, {at: index + 1});
            return coll.at(index + 1);
        },
        isDefault: function (attribute, value) {
            return this.defaults[attribute] === value;
        },
        setDefault: function (attribute, value) {
            this.defaults[attribute] = value;
        },
        next: function () {
            var coll = this.collection;
            if (!coll) {
                return;
            }
            var index = coll.indexOf(this);
            if (index === coll.length - 1) {
                return;
            }
            return coll.at(index + 1);
        },
        index: function () {
            var coll = this.collection;
            if (!coll) {
                return 0;
            }
            return coll.indexOf(this);
        },
        moveUp: function () {
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
        moveDown: function () {
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
        getClosest: function () {
            var coll = this.collection;
            if (!coll || coll.length < 2) {
                return;
            }
            var index = coll.indexOf(this);
            var prev = coll.at(index - 1);
            if (prev) {
                return prev;
            } else {
                return coll.at(index + 1);
            }
        },
        toJSON: function (useDeepJSON) {
            var attributes = _.clone(this.attributes);
            //clearTMPIds(attributes);
            if (useDeepJSON) {
                _.each(attributes, function (value, key) {
                    if (value.toJSON) {
                        attributes[key] = value.toJSON();
                    }
                });
            }
            return attributes;
        },
        serializeForSave: function () {
            var attributes = _.clone(this.attributes);
            return clearTMPIds(attributes);
        },
        checkFilters: function (filtersArray) {

            if (filtersArray.length === 0) {
                return true;
            }

            var _this = this;
            var attributes = _this.toJSON();

            var filtered = _.every(filtersArray, function (filter) {
                return filterMethods[filter.expr].call(_this, filter, attributes[filter.column])
            })
            return filtered;
        },
        getOption: function (option) {
            //console.log(option, this.options[option],this[option]);
            return this.options[option] || this[option];
        },
        reset: function (key, val, options) {
            var attr, attrs, unset, changes, silent, changing, prev, current,missing;
            if (key == null) return this;

            // Handle both `"key", value` and `{key: value}` -style arguments.
            if (typeof key === 'object') {
                attrs = key;
                options = val;
            } else {
                (attrs = {})[key] = val;
            }

            options || (options = {});

            // Run validation.
            if (!this._validate(attrs, options)) return false;

            // Extract attributes and options.
            unset = options.unset;
            silent = options.silent;
            changes = [];

            changing = this._changing;
            this._changing = true;

            if (!changing) {
                this._previousAttributes = _.clone(this.attributes);
                this.changed = {};
            }
            current = this.attributes, prev = this._previousAttributes;

            missing = _.omit(this._previousAttributes, _.keys(attrs));

            // Check for changes of `id`.
            if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];


            for(attr in missing){
                val = attrs[attr];
                if (!_.isEqual(current[attr], val)) changes.push(attr);
                if (!_.isEqual(prev[attr], val)) {
                    this.changed[attr] = val;
                } else {
                    delete this.changed[attr];
                }
                delete current[attr]
            }


            // For each `set` attribute, update or delete the current value.
            for (attr in attrs) {
                val = attrs[attr];
                if (!_.isEqual(current[attr], val)) changes.push(attr);
                if (!_.isEqual(prev[attr], val)) {
                    this.changed[attr] = val;
                } else {
                    delete this.changed[attr];
                }
                unset ? delete current[attr] : current[attr] = val;
            }

            // Trigger all relevant attribute changes.
            if (!silent) {
                if (changes.length) this._pending = true;
                for (var i = 0, l = changes.length; i < l; i++) {
                    this.trigger('change:' + changes[i], this, current[changes[i]], options);
                }
            }

            // You might be wondering why there's a `while` loop here. Changes can
            // be recursively nested within `"change"` events.
            if (changing) return this;
            if (!silent) {
                while (this._pending) {
                    this._pending = false;
                    this.trigger('change', this, options);
                }
            }
            this._pending = false;
            this._changing = false;
            return this;

        }
    });


    var filterMethods = {
        'eq': function (filter, value) {
            return filter.value === value;
        },
        'startsWith': function (filter, value) {
            return new RegExp('^' + filter.value, 'i').test(value);
        },
        'endsWith': function (filter, value) {
            return new RegExp(filter.value + '$', 'i').test(value);
        },
        'has': function (filter, value) {
            return new RegExp(filter.value, 'i').test(value);
        }
    };


    return BaseModel;
});
