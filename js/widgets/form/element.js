/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 21/06/13
 * Time: 11:36 AM
 * To change this template use File | Settings | File Templates.
 */
define(['base/app', 'base', 'widgets/form/validator', 'text!./inputView.html'], function(app, Base, Validator, inputViewTemplate) {
    'use strict';

    var DOT_CONTROL_GROUP = '.control-group';
    var DOT_CONTROL_LABEL = '.control-label';
    var DOT_HELP_INLINE = '.help-inline';
    var INVALID_CLASS = 'error';


    var ElementModel = Base.Model.extend({
        constructor:function(){
            Base.Model.apply(this, arguments);
            var elementModel = this;
            var elements = elementModel.collection;
            var activeRules = elementModel.get('activeRules');
            _.each(activeRules, function (rule) {
                var toWatchElement = elements.get(rule.element);
                toWatchElement.on('change:value', function (model, value) {
                    elementModel.updateActive();
                });
                elementModel.updateActive();
            });
        },
        defaults: {
            valid: true,
            active: true,
            disabled: false,
            readonly: false,
            skipPost:false,
            value: null,
            label: null,
            activeRules: [],
            validationRules: [],
            type: 'text',
            errorCode: '',
            group: 'elements'
        },
        idAttribute: 'name',
        updateActive: function() {
            var activeRules = this.get('activeRules');
            var isActive = _.every(activeRules, function(rule) {
                var sourceElement = this.collection.get(rule.element);
                return activeRuleMethods[rule.expr].call(this, sourceElement, rule);
            }, this);
            this.set('active', isActive);
        },
        isElementValid: function(skipShowErrors) {
            var validationRules = this.get('validationRules');
            var errors = [];
            if (this.isNot('active')) {
                return [];
            }

            var errorRule;
            var isValid = _.every(validationRules, function(rule) {
                var isValidForRule = Validator.validationRuleMethods[rule.expr].call(this, rule, this.get('value'));
                if (!isValidForRule) {
                    errors.push(rule);
                    errorRule = rule;
                }
                return isValidForRule;
            }, this);
            //ee.log('isElementValid',this.id, isValid, errorRule);
            this.set('valid', isValid);
            if (!skipShowErrors) {
                if (errorRule) {
                    var message = errorRule.message || ('error.' + this.get('name') + '.' + errorRule.expr);
                    this.set('errorCode', message);
                } else {
                    this.set('errorCode', '');
                }
            }
            return errors;
        },
        getSiblingValue: function(siblingName) {
            if (this.collection) {
                return this.collection.get(siblingName).get('value');
            }
        },
        getSiblingAttribute: function(siblingName, attributeName) {
            if (this.collection) {
                return this.collection.get(siblingName).get(attributeName);
            }
        },
        setSiblingAttribute: function(siblingName, attributeName, value) {
            if (this.collection) {
                return this.collection.get(siblingName).set(attributeName, value);
            }
        },
        setSiblingValue: function(siblingName, value) {
            if (this.collection) {
                return this.collection.get(siblingName).set('value', value);
            }
        },
        isElementDefault:function(){
            var attributes = this.toJSON();
            return attributes.value === attributes.defaultValue;
        }
    });

    var ElementCollection = Base.Collection.extend({
        model: ElementModel
    });


    var ElementView = Base.View.extend({
        tagName: 'div',
        className: 'element',
        template: inputViewTemplate,
        dataEvents:{
            'forceRender':'render'
        },
        disabledChangeHandler: function(value) {
            this.$el.toggleClass('disabled', value);
            this.$('input').attr('disabled', value);
        },
        readonlyChangeHandler: function(value) {
            this.$el.toggleClass('readonly', value);
            this.$('input').attr('readonly', value);
        },
        validChangeHandler: function(value) {
            this.$(DOT_CONTROL_GROUP).toggleClass(INVALID_CLASS, !value);
        },
        activeChangeHandler: function(value) {
            this.$el.toggle(value);
        },
        valueChangeHandler: function(value) {
            this.$('input').val(value);
            this.model.updateActive();
        },
        errorCodeChangeHandler: function(errorCode) {
            var el = this.$(DOT_HELP_INLINE);
            //console.log('errorCodeChangeHandler',this.model.id, el, errorCode);
            if (errorCode === '') {
                el.empty();
                this.model.set('valid', true);
            } else {
                this.model.set('valid', false);

                el.html(app.getString(errorCode));
            }
        },
        nameChangeHandler: function(value) {
            this.$el.addClass('element-' + value);
        },
        valueFunction: function() {
            return this.$('input').val();
        },
        updateValue: function(skipValidate) {
            this.model.set('value', this.valueFunction());
            if (skipValidate !== true) {
                this.model.isElementValid();
            }

        }
    });


    var activeRuleMethods = {
        'eq': function(source, rule) {
            return source.isEqual('value', rule.value);
        },
        'valid': function(source) {
            source.isElementValid(true);
            return source.is('valid');
        },
        'isIn': function(source, rule) {
            var value = source.get('value');
            return rule.value.indexOf(value) !== -1;
        },
        'neq': function(source, rule) {
            return source.isNotEqual('value', rule.value);
        },
        'function': function(source, rule) {
            var func = rule.func;
            return func.apply(this, arguments);
        }
    };


    return {
        View: ElementView,
        Model: ElementModel,
        Collection: ElementCollection
    };
});
