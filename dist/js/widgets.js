
/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 28/06/13
 * Time: 4:18 PM
 * To change this template use File | Settings | File Templates.
 */
define('widgets/form/validator',['base/app'],function(app){
    



    var validateValue=function(value, validationRules){

        var errors=[];
        var errorRule;

        var isValid = _.every(validationRules, function (rule) {
            var isValidForRule = validationRuleMethods[rule.expr].call(this, rule, value);
            if (!isValidForRule) {
                errors.push(rule);
                errorRule = rule;
            }
            return isValidForRule;
        });

        return {
            isValid:isValid,
            errors:errors,
            errorRule:errorRule
        };
    };

    var validationRuleMethods = {
        'req': function (rule, value) {
            return !_.isEmpty(value);
        },
        'digits': function (rule, value) {
            return (/^\d{5}$/).test(value);
        },
        'alphanumeric': function (rule, value) {
            var ck_alphaNumeric = /^\w+$/;
            return ck_alphaNumeric.test(value);
        },
        'number': function (rule, value) {
            if (value === undefined) {
                return true;
            }
            var numberVal = +value;
            return numberVal === numberVal;
        },
        'email': function (rule, value) {
            var ck_email = /^([\w\-]+(?:\.[\w\-]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return ck_email.test($.trim(value));
        },
        'minlen': function (rule, value) {
            var min = rule.length;
            return $.trim(String(value)).length >= min;
        },
        'maxlen': function (rule, value, exprvalue) {
            var max = rule.length;
            return $.trim(String(value)).length <= max;
        },
        'lt': function (rule, value, exprvalue) {
            var target = parseFloat(exprvalue);
            var curvalue = parseFloat(value);
            return curvalue < target;
        },
        'gt': function (rule, value, exprvalue) {
            var target = parseFloat(exprvalue);
            var curvalue = parseFloat(value);
            return curvalue > target;
        },
        'eq': function (rule, value, exprvalue) {
            return exprvalue === value;
        },
        'neq': function (rule, value) {
            return rule.value !== value;
        },
        'url': function (rule, value) {
            if (value === '') {
                return true;
            }
            var ck_url = /(http|https|market):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i;
            return ck_url.test($.trim(value));
        },
        'emaillist': function (rule, value) {
            var emails = value.split(',');
            var ck_email = /^([\w\-]+(?:\.[\w\-]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            for (var i = 0; i < emails.length; i++) {
                if ($.trim(emails[i]) !== '' && !ck_email.test($.trim(emails[i]))) {
                    return false;
                }
            }
            return true;
        },
        'function': function (rule, value) {
            var func = rule.func;
            return func.call(null, value);
        }

    };



    return {
        validateValue:validateValue,
        validationRuleMethods:validationRuleMethods
    };
});
define('text!widgets/form/inputView.html',[],function () { return '<div class="control-group">\n    <label class="control-label">\n        {{elementLabel this}}\n    </label>\n\n    <div class="controls type-{{type}}">\n        <input type="{{type}}" name="{{name}}" value="{{value}}" class="el-{{name}}"/>\n        <span class="help-inline"></span>\n    </div>\n</div>';});

/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 21/06/13
 * Time: 11:36 AM
 * To change this template use File | Settings | File Templates.
 */
define('widgets/form/element',['base/app', 'base', 'widgets/form/validator','text!./inputView.html'], function (app, Base, Validator, inputViewTemplate) {
    

    var DOT_CONTROL_GROUP = '.control-group';
    var DOT_CONTROL_LABEL = '.control-label';
    var DOT_HELP_INLINE = '.help-inline';
    var INVALID_CLASS = 'error';


    var ElementModel = Base.Model.extend({
        defaults: {
            valid: true,
            active: true,
            disabled: false,
            readonly: false,
            value: null,
            label: null,
            activeRules: [],
            validationRules: [],
            type: 'text',
            errorCode: '',
            group: 'elements'
        },
        idAttribute: 'name',
        updateActive: function () {
            var activeRules = this.get('activeRules');
            var isActive = _.every(activeRules, function (rule) {
                var sourceElement = this.collection.get(rule.element);
                return activeRuleMethods[rule.expr].call(null, sourceElement, rule);
            }, this);
            this.set('active', isActive);
        },
        isElementValid: function (skipShowErrors) {
            var validationRules = this.get('validationRules');
            var errors = [];
            if (this.isNot('active')) {
                return [];
            }

            var errorRule;
            var isValid = _.every(validationRules, function (rule) {
                var isValidForRule = Validator.validationRuleMethods[rule.expr].call(this, rule, this.get('value'));
                if (!isValidForRule) {
                    errors.push(rule);
                    errorRule = rule;
                }
                return isValidForRule;
            }, this);
            //ee.log('isElementValid',this.id, isValid, errorRule);
            this.set('valid', isValid);
            if(!skipShowErrors) {
                if (errorRule) {
                    var message = errorRule.message || ('error.' + this.get('name') + '.' + errorRule.expr);
                    this.set('errorCode', message);
                } else {
                    this.set('errorCode', '');
                }
            }
            return errors;
        },
        getSiblingValue:function(siblingName){
            if(this.collection){
                return this.collection.get(siblingName).get('value');
            }
        },
        getSiblingAttribute:function(siblingName, attributeName){
            if(this.collection){
                return this.collection.get(siblingName).get(attributeName);
            }
        },
        setSiblingAttribute:function(siblingName, attributeName, value){
            if(this.collection){
                return this.collection.get(siblingName).set(attributeName,value);
            }
        },
        setSiblingValue:function(siblingName, value){
            if(this.collection){
                return this.collection.get(siblingName).set('value',value);
            }
        }
    });

    var ElementCollection = Base.Collection.extend({
        model: ElementModel
    });


    var ElementView = Base.View.extend({
        tagName: 'div',
        className: 'element',
        events: {
            'change input': 'updateValue',
            'blur input': 'updateValue',
            'click': 'setFocus'
        },
        template: inputViewTemplate,
        // typeChangeHandler:function(value){
        //     this.$('input').attr('type', value);
        // },

        postRender:function(){
            this.syncAttributes();
        },
        syncAttributes: function () {
            var model = this.model;
            var attr = model.toJSON();
            _.each(attr, function (value, attribute) {
                var handler = this[attribute + 'ChangeHandler'];
                if (handler && typeof handler === 'function') {
                    handler.call(this, model.get(attribute));
                }
            }, this);
            this.updateValue(true);
        },

        disabledChangeHandler: function (value) {
            this.$el.toggleClass('disabled', value);
            this.$('input').attr('disabled', value);
        },
        readonlyChangeHandler: function (value) {
            this.$el.toggleClass('readonly', value);
            this.$('input').attr('readonly', value);
        },
        validChangeHandler: function (value) {
            this.$(DOT_CONTROL_GROUP).toggleClass(INVALID_CLASS, !value);
        },
        activeChangeHandler: function (value) {
            this.$el.toggle(value);
        },
        valueChangeHandler: function (value) {
            this.$('input').val(value);
           // console.log(value, 'txt');
        },
        errorCodeChangeHandler: function (errorCode) {
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
        nameChangeHandler: function (value) {
            this.$el.addClass('element-' + value);
        },
        valueFunction: function () {
            return this.$('input').val();
        },
        updateValue: function (skipValidate) {
            this.model.set('value', this.valueFunction());
            if (skipValidate !== true) {
                this.model.isElementValid();
            }

        },
        setFocus:function(){
            var form = this.$el.closest('form');
            form.find('.focused').removeClass('focused');
            this.$el.addClass('focused');
        },
        removeFocus:function(){
            this.$el.removeClass('focused');
        }
    });


    var activeRuleMethods = {
        'eq': function (source, rule) {
            return source.isEqual('value', rule.value);
        },
        'valid': function (source) {
            source.isElementValid(true);
            return source.is('valid');
        },
        'isIn': function (source, rule) {
            var value = source.get('value');
            return rule.value.indexOf(value) !== -1;
        },
        'neq': function (source, rule) {
            return source.isNotEqual('value', rule.value);
        },
        'function': function (source, rule) {
            var func = rule.func;
            return func.apply(null, arguments);
        }
    };


    return {
        View: ElementView,
        Model: ElementModel,
        Collection: ElementCollection
    };
});
define('text!widgets/messageStack/messageStack.html',[],function () { return '<div>\n\n</div>';});

define('widgets/messageStack',['base', 'text!./messageStack/messageStack.html'],function(Bone, template){

    var MessageStack = Bone.View.extend({
        template:template

    });

    var MessageStackModel = Bone.Model.extend({
        removeAllMessages:function(){

        }
    });

    return {
        View:MessageStack,
        Model:MessageStackModel
    };
});
define('text!widgets/form/checkListView.html',[],function () { return '<div class="control-group">\n    <label class="control-label">\n        {{elementLabel this}}\n    </label>\n\n    <div class="controls">\n        {{#each options}}\n        <label class="checkbox inline">\n            <input type="checkbox" name="{{id}}" value="{{id}}" class="el-{{name}}"/>{{name}}\n        </label>\n        {{/each}}\n        <span class="help-inline"></span>\n    </div>\n</div>';});

define('text!widgets/form/radioListView.html',[],function () { return '<div class="control-group">\n    <label class="control-label">\n        {{elementLabel this}}\n    </label>\n\n    <div class="controls">\n        {{#each options}}\n        <label class="radio inline">\n            <input type="radio" name="{{../name}}" value="{{id}}" class="el-{{name}}"/>{{name}}\n        </label>\n        {{/each}}\n        <span class="help-inline"></span>\n    </div>\n</div>';});

define('text!widgets/form/selectView.html',[],function () { return '<div class="control-group">\n    <label class="control-label">\n        {{elementLabel this}}\n    </label>\n\n    <div class="controls">\n        <select name="{{name}}" class="el-{{name}}">\n            {{#each options}}\n            <option value="{{id}}">{{name}}</option>\n            {{/each}}\n        </select>\n        <span class="help-inline"></span>\n    </div>\n</div>';});

define('text!widgets/form/textAreaView.html',[],function () { return '<div class="control-group">\n    <label class="control-label">\n        {{elementLabel this}}\n    </label>\n\n    <div class="controls">\n        <textarea type="{{type}}" name="{{name}}" class="el-{{name}}">{{value}}</textarea>\n        <span class="help-inline"></span>\n    </div>\n</div>';});

define('text!widgets/form/buttonView.html',[],function () { return '<div class="control-group">\n    <div class="controls">\n        <button type="submit" class="btn btn-default">{{value}}</button>\n        <span class="help-inline"></span>\n    </div>\n</div>';});

/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 14/06/13
 * Time: 12:28 PM
 * To change this template use File | Settings | File Templates.
 */
define('widgets/form',[
    'base/app',
    'base',
    'widgets/form/element',
    'widgets/messageStack',
    'text!./form/checkListView.html',
    'text!./form/radioListView.html',
    'text!./form/selectView.html',
    'text!./form/textAreaView.html',
    'text!./form/buttonView.html'
],function(app, Base, Element, MessageStack, checkListTemplate, radioListTemplate, selectViewTemplate, textAreaTemplate, buttonViewTemplate){
    

    var ElementView = Element.View;
    var ElementModel = Element.Model;
    var ElementCollection = Element.Collection;

    var ButtonView = ElementView.extend({
        template:buttonViewTemplate,
        valueFunction: function () {
            return;
        },
        valueChangeHandler: function (value) {
            return;
        }
    });

    var CheckboxView = ElementView.extend({
        valueFunction: function () {
            return this.$('input').is(':checked');
        },
        valueChangeHandler: function (value) {
            this.$('input').attr('checked', value);
        }
    });
    var TextAreaView = ElementView.extend({
        template:textAreaTemplate,
        events: {
            'change textarea': 'updateValue',
            'blur textarea': 'updateValue'
        },
        valueFunction: function () {
            return this.$('textarea').val();
        },
        valueChangeHandler: function (value) {
            this.$('textarea').val(value);
        }
    });

    var SelectView = ElementView.extend({
        template: selectViewTemplate,
        events: {
            'change select': 'updateValue',
            'blur select': function(){
                this.updateValue();
                this.removeFocus();
            },
            'click': 'setFocus'
        },
        valueFunction: function () {
            return this.$('select').val();
        },
        valueChangeHandler: function (value) {
            this.$('select').val(value);
        },
        disabledChangeHandler: function (value) {
            this.$el.toggleClass('disabled', value);
            this.$('select').attr('disabled', value);
        }
    });


    var RadioListView = ElementView.extend({
        template:radioListTemplate,
        valueFunction: function () {
            return this.$('input:checked').val();
        },
        valueChangeHandler: function (value) {
            this.$('input[value=' + value + ']').attr('checked', true);
        }
    });

    var CheckListView = ElementView.extend({
        template: checkListTemplate,
        valueFunction: function () {
            var selectedOptions = this.$('input:checked');

            var valueArr = _.map(selectedOptions, function (option) {
                return $(option).val();
            });

            return valueArr;
        },
        valueChangeHandler: function (valueArr) {
            //this.$('input[value='+value+']').attr('checked',true);
            if (_.isArray(valueArr)) {
                _.each(valueArr, function (value) {
                    this.$('input[value=' + value + ']').attr('checked', true);
                }, this);
            }
        }
    });

    var HiddenView = ElementView.extend({
        template: '<input type="hidden" value="{{value}}" name="{{name}}" />',
        valueChangeHandler: function (value) {
            this.$('input').val(value);
            this.$('input').trigger('change');
        },
        valueFunction:function(){
            return ''+this.$('input').val();
        }
    });

    var ContainerView = ElementView.extend({
        template: ' ',
        valueChangeHandler: function (value) {
            //this.$('input').val(value);
        },
        valueFunction:function(){
            //return this.$('input').val();
        }
    });

    var HiddenJSONView = ElementView.extend({
        template: '<input type="hidden" value="{{value}}" name="{{name}}" />',
        valueChangeHandler: function (value) {
            this.$('input').val(JSON.stringify(value));
            //console.log(value, 'HiddenJSONView');
            this.updateValue();
        },
        valueFunction:function(){
            return JSON.parse(this.$('input').val());
        }
    });

    var CheckboxList = ElementView.extend({
        valueFunction: function () {
            return this.$('input').is(':checked');
        },
        valueChangeHandler: function (value) {
            this.$('input').attr('checked', value);
        }
    });

    var typeViewIndex = {
        'select': SelectView,
        'textarea': TextAreaView,
        'checkbox': CheckboxView,
        'radioList': RadioListView,
        'checkList': CheckListView,
        'hidden':HiddenView,
        'json':HiddenJSONView,
        'submit':ButtonView,
        'container':ContainerView
    };

    var getViewByType = function (type) {
        return typeViewIndex[type] || ElementView;
    };

    var updateTypeViewIndex = function (indexObj) {
        typeViewIndex = _.extend({}, typeViewIndex, indexObj);
    };

    var FormModel = Base.Model.extend({
        constructor: function () {
            Base.Model.apply(this, arguments);
            var elements = this.get('elements');
            elements.on('change', function (model) {
                var eventName = 'change';
                var args = Array.prototype.slice.call(arguments, [0]);
                args[0] = 'elements:' + eventName;
                this.trigger.apply(this, args);
                args[0] = 'elements:' + model.get('name') + ':' + eventName;
                this.trigger.apply(this, args);
            }, this);

            elements.each(function (elementModel) {

                //add active rules
                var activeRules = elementModel.get('activeRules');
                _.each(activeRules, function (rule) {
                    var toWatchElement = elements.get(rule.element);
                    toWatchElement.on('change:value', function (model, value) {
                        elementModel.updateActive();
                    });
                    elementModel.updateActive();
                    /*
                     switch(rule.expr){
                     case 'eq':
                     elementModel.set('active', toWatchElement.isEqual('value', rule.value));
                     toWatchElement.on('change:value',function(model, value){
                     elementModel.updateActive();
                     });
                     break;
                     case 'neq':
                     elementModel.set('active', toWatchElement.isNotEqual('value', rule.value));
                     toWatchElement.on('change:value',function(model, value){
                     elementModel.set('active', value !== rule.value);
                     });
                     break;
                     }
                     */

                });
            });

        },
        defaults: {
            elements: new ElementCollection()
        },
        setElementAttribute: function (elementName, attribute, value) {
            var elements = this.get('elements');
            elements.get(elementName).set(attribute, value);
        },
        getValueObject: function () {
            var elements = this.get('elements');
            var errors = this.validateElements();
            var obj = {};
            if (errors.length === 0) {
                elements.each(function (model) {
                    if (model.is('active')) {
                        obj[model.id] = model.get('value');
                    }
                });
            }
            return obj;
        },
        validateElements: function () {
            var elements = this.get('elements');
            var errors = [];
            elements.each(function (model) {

                errors = errors.concat(model.isElementValid());

            });
            return errors;
        }

    });


    var groupPrefix = 'grp-';


    var FormView = Base.View.extend({
        constructor: function (options) {
            this.typeViewIndex = {};
            Base.View.apply(this, arguments);
        },
        tagName: 'div',
        className: 'form-view',
        events: {
            'submit form': 'formSubmitHandler'
        },
        template: '<div class="form-message-container"></div><form action="{{actionId}}" id="form-{{id}}" class="form-vertical" method=""></form>',

        postRender: function () {
            this.formEl = this.$('form');
            this.renderGroupContainers();
            this.renderMessageStack();
            var model = this.model;
            var elements = model.get('elements');
            elements.each(function (elementModel) {
                this.addElement(elementModel);
            }, this);
            return this;
        },
        addElement: function (model) {
            var attr = model.toJSON();
            var ElementView = this.typeViewIndex[attr.type] || getViewByType(attr.type);

            var name = attr.name;
            var view;
            //if element already rendered dont render again
            var viewEl =  this.$('.element-'+name);

            if(viewEl.length !== 0){
                view = new ElementView({
                    model: model,
                    el:viewEl
                });
                view.afterRender();
                view.syncAttributes();
            }else{
                view = new ElementView({
                    model: model
                });
                var group = attr.group;
                this.$('.' + groupPrefix + group).append(view.render().el);
            }


        },
        renderGroupContainers: function () {
            var model = this.model;
            var elements = model.get('elements');
            var groupList = _.unique(elements.pluck('group'));
            _.each(groupList, function (groupName) {
                if (this.$('.' + groupPrefix + groupName).length === 0) {
                    this.formEl.append('<div class="' + groupPrefix + groupName + '"></div>');
                }
            }, this);
        },

        renderMessageStack:function(){
            var messageStack = new MessageStack.Model();
            var messageStackView = new MessageStack.View({
                model:messageStack,
                el:this.$('.form-message-container')
            });
            messageStackView.render();

            this.on('showMessages',function(messages){
                messageStack.removeAllMessages();
                _.each(messages,function(message){
                    var messageModel = new MessageStack.Model(message);
                    messageStack.addMessage(messageModel.toJSON());
                });
            });

            this.on('clearMessages',function(error){
                messageStack.removeAllMessages();
            });
        },
        formSubmitHandler: function (e) {
            e.preventDefault();

            this.trigger('clearMessages');

            var dataObj = this.model.getValueObject();

            var actionId = this.model.get('actionId');

            if(this.options.prePostParser){
                dataObj = this.options.prePostParser(dataObj);
            }

            this.trigger('formSubmit', dataObj);
        },
        addToTypeViewIndex: function (type, View) {
            this.typeViewIndex[type] = View;
        },
        submitSuccessHandler:function(){
            console.log(arguments);
        },
        submitFailureHandler:function(resp, errors){
            _.each(errors, function(error){
                error.messageType='failure';
                error.expires = 0;
            });
            this.trigger('showMessages', errors);
        },
        setElementValue:function(name, value){
            var elements = this.model.get('elements');
            elements.get(name).set('value', value);
        }
    });



    return {
        Model:FormModel,
        View:FormView,
        ElementModel:ElementModel,
        ElementCollection:ElementCollection,
        ElementView:ElementView
    };
});

define('widgets/tab',[
    'base/app',
    'base',
    'list/singleSelect'
    ],
    function(app, Base, SingleSelect){

        var baseUtil =  Base.util;

        var NavItemView = Base.View.extend({
            tagName:'li',
            template:'<a href="#{{id}}" class="action">{{name}}</a>',
            changeHandler:function(){
                this.$el.toggleClass('active',this.model.is('selected'));
            }
        })

        var TabItemView = Base.View.extend({
            changeHandler:function(){
                this.$el.toggle(this.model.is('selected'));
            }
        })

        var View = SingleSelect.View.extend({
            template:'<div class="prop-tabs"><ul class="ib-list"></ul></div><div class="tab-panes"></div> ',
            postRender:function(){
                var items = this.model.get('items');
                var navListView = baseUtil.createView({
                    View:Base.CollectionView,
                    collection:items,
                    el:this.$('.ib-list'),
                    itemView:NavItemView
                })

                var tabListView = baseUtil.createView({
                    View:Base.CollectionView,
                    tagName:'div',
                    collection:items,
                    el:this.$('.tab-panes'),
                    itemView:TabItemView
                })


            },
            actionHandler:function(selectedId){
                this.model.setSelectedById(selectedId);
            }
        })


        return {
            View:View,
            Model:SingleSelect.Model
        }

    });
define('widgets',['require','widgets/form','widgets/header','widgets/messageStack','widgets/tab'],function (require) {

    return {
        Form: require('widgets/form'),
        Header: require('widgets/header'),
        MessageStack: require('widgets/messageStack'),
        Tab: require('widgets/tab')
    }
});