/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 14/06/13
 * Time: 12:28 PM
 * To change this template use File | Settings | File Templates.
 */
define([
    'base/app',
    'base/util',
    'base',
    'widgets/form/element',
    'widgets/messageStack',
    'widgets/calendar',
    'text!./form/checkListView.html',
    'text!./form/checkBoxView.html',
    'text!./form/radioListView.html',
    'text!./form/selectView.html',
    'text!./form/textAreaView.html',
    'text!./form/buttonView.html',
    'text!./form/dateInputView.html',
    'text!./form/messageView.html'
], function (app, baseUtil, Base, Element, MessageStack, Calendar, checkListTemplate, checkBoxTemplate, radioListTemplate, selectViewTemplate, textAreaTemplate, buttonViewTemplate, dateInputTemplate, messageViewTemplate) {
    'use strict';

    var ElementView = Element.View;
    var ElementModel = Element.Model;
    var ElementCollection = Element.Collection;

    var ButtonView = ElementView.extend({
        template: buttonViewTemplate,
        valueFunction: function () {
            return;
        },
        valueChangeHandler: function (value) {
            return;
        }
    });


    var InputView = ElementView.extend({
        events: {
            'change input': 'updateValue',
            'blur input': 'resetIfEmpty',
            'focus input': 'selectIfDefault',
            'click input': 'clearIfDefault'
        },
        selectIfDefault: function () {
            if (this.model.isElementDefault()) {
                this.$('input').select();
            }
        },
        clearIfDefault: function () {
            if (this.model.isElementDefault()) {
                this.$('input').val('');
            }
        },
        resetIfEmpty: function () {
            var inputValue = this.$('input').val();
            if (inputValue === '') {
                var attr = this.model.toJSON();
                if (attr.defaultValue) {
                    this.$('input').val(attr.defaultValue);
                }
            }
            this.updateValue();
        }
    });

    var DateInputView = InputView.extend({
        template: dateInputTemplate,
        events:{
            'click .dateInput':'showDatePicker',
            'change .dateInput':'dateChangeHandler'
        },
        postRender: function () {
            this.hideDatePicker();
        },
        showDatePicker:function(){
            var _this = this;
            var monthView = this.getSubView('monthView');
            if(!monthView){
                monthView = baseUtil.createView({
                    View:Calendar.Month.View,
                    Model:Calendar.Month.Model,
                    parentEl:'.monthView',
                    parentView:this
                })

                this.setSubView('monthView', monthView);

                this.listenTo(monthView, 'dateClicked', function(date){
                    _this.hideDatePicker();
                    _this.$('.dateInput').val(date.format('L'));
                    _this.updateValue();
                });
            }


            var value = this.model.get('value');
            var date = moment(value, 'MM/DD/YYYY');
            monthView.model.set({
                year:date.year(),
                month:date.month(),
                selectedEpoch:date.valueOf()
            })
            var viewEl = this.$el, bodyEl = $('body');
            var monthViewEl = this.$('.monthView');
            var clickOutSideEvent = 'click.clickOutSite_'+this.cid;
            monthViewEl.show();
            bodyEl.off(clickOutSideEvent);
            bodyEl.on(clickOutSideEvent,function(e){
                var target = $(e.target);
                if(target.parents().index(bodyEl) == -1){
                    if(!target.is(bodyEl)){
                        return;
                    }
                }

                if(target.parents().index(viewEl) == -1) {
                    if(monthViewEl.is(":visible")) {
                        monthViewEl.hide();
                        $('body').off(clickOutSideEvent);
                    }
                }
            });

        },
        hideDatePicker:function(){
            var clickOutSideEvent = 'click.clickOutSite_'+this.cid;
            this.$('.monthView').hide();
            $('body').off(clickOutSideEvent);
        },
        valueFunction: function () {
            return this.$('.dateInput').val();
        },
        valueChangeHandler: function (value) {
            var date = moment(value, 'MM/DD/YYYY');
            if(!date.isValid()){
                date = moment();
                this.model.set('value', date.format('L'));
            };
            this.$('.dateInput').val(date.format('L'));
        },
        dateChangeHandler:function(){
            var value = this.$('.dateInput').val();
            var date = moment(value, 'MM/DD/YYYY');
            if(!date.isValid()){
                this.valueChangeHandler(this.model.get('value'));
            }else{
                this.model.set('value', value);
                this.hideDatePicker();
            }
        }
    });

    var CheckboxView = InputView.extend({
        template: checkBoxTemplate,
        valueFunction: function () {
            return this.$('input').is(':checked');
        },
        valueChangeHandler: function (value) {
            this.$('input').attr('checked', value);
        }
    });
    var TextAreaView = ElementView.extend({
        template: textAreaTemplate,
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
            'blur select': 'updateValue'
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


    var RadioListView = InputView.extend({
        template: radioListTemplate,
        valueFunction: function () {
            return this.$('input:checked').val();
        },
        valueChangeHandler: function (value) {
            this.$('input[value=' + value + ']').attr('checked', true);
        }
    });

    var CheckListView = InputView.extend({
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
        valueFunction: function () {
            return '' + this.$('input').val();
        }
    });

    var ContainerView = ElementView.extend({
        template: ' ',
        valueChangeHandler: function (value) {
            //this.$('input').val(value);
        },
        valueFunction: function () {
            //return this.$('input').val();
        }
    });


    var MessageView = ElementView.extend({
        template: messageViewTemplate,
        valueChangeHandler: function (value) {
            this.$('.message').html(value)
        },
        valueFunction: function () {
            return this.$('.message').html();
        }
    })


    var HiddenJSONView = ElementView.extend({
        template: '<input type="hidden" value="{{value}}" name="{{name}}" />',
        valueChangeHandler: function (value) {
            this.$('input').val(JSON.stringify(value));
            //console.log(value, 'HiddenJSONView');
            this.updateValue();
        },
        valueFunction: function () {
            return JSON.parse(this.$('input').val());
        }
    });

    var CheckboxList = InputView.extend({
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
        'dateInput': DateInputView,
        'radioList': RadioListView,
        'checkList': CheckListView,
        'hidden': HiddenView,
        'json': HiddenJSONView,
        'submit': ButtonView,
        'message': MessageView,
        'container': ContainerView
    };

    var getViewByType = function (type) {
        return typeViewIndex[type] || InputView;
    };

    var setViewByType = function (type, View) {
        typeViewIndex[type] = View;
    }

    var updateTypeViewIndex = function (indexObj) {
        typeViewIndex = _.extend({}, typeViewIndex, indexObj);
    };

    var FormModel = Base.Model.extend({
        constructor: function () {
            Base.Model.apply(this, arguments);
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
            } else {
                obj.errors = errors;
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
        },
        elementsChangeHandler: function () {

            var elements = this.get('elements');
            elements.on('change', function (model) {
                var eventName = 'change';
                var args = Array.prototype.slice.call(arguments, [0]);
                args[0] = 'elements:' + eventName;
                this.trigger.apply(this, args);
                args[0] = 'elements:' + model.get('name') + ':' + eventName;
                this.trigger.apply(this, args);
            }, this);
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
        template: '<div class="form-message-container"></div><form action="{{actionId}}" class="form-vertical" method=""> <div class="group-list"></div> <div class="grp-buttons"> </div> </form>',

        postRender: function () {
            this.formEl = this.$('form');
            this.renderGroupContainers();
            this.renderMessageStack();
            var model = this.model;
            var elements = model.get('elements');
            this.$el.hide();
            elements.each(function (elementModel) {
                this.addElement(elementModel);
            }, this);
            this.$el.show();
        },
        addElement: function (model) {
            var attr = model.toJSON();
            var thisView = this;
            var ElementView = this.typeViewIndex[attr.type] || getViewByType(attr.type);

            var name = attr.name;
            var view;
            //if element already rendered dont render again
            var viewEl = this.$('.element-' + name);

            if (viewEl.length !== 0) {
                view = new ElementView({
                    model: model,
                    el: viewEl
                });
                view.postRender();
                view.syncAttributes();
            } else {

                view = baseUtil.createView({
                    View: ElementView,
                    model: model,
                    parentView: thisView
                })

                var group = attr.group;
                this.$('.' + groupPrefix + group).append(view.render().el);
            }
        },
        removeElement: function (model) {

        },
        renderGroupContainers: function () {
            var model = this.model;
            var elements = model.get('elements');
            var groupList = _.unique(elements.pluck('group'));
            var groupListEl = this.$('.group-list');
            _.each(groupList, function (groupName) {
                if (this.$('.' + groupPrefix + groupName).length === 0) {
                    groupListEl.append('<div class="' + groupPrefix + groupName + '"></div>');
                }
            }, this);
        },

        renderMessageStack: function () {
            var messageStack = new MessageStack.Model();
            var messageStackView = new MessageStack.View({
                model: messageStack,
                el: this.$('.form-message-container')
            });
            messageStackView.render();

            this.on('showMessages', function (messages) {
                messageStack.removeAllMessages();
                _.each(messages, function (message) {
                    var messageModel = new MessageStack.Model(message);
                    messageStack.addMessage(messageModel.toJSON());
                });
            });

            this.on('clearMessages', function (error) {
                messageStack.removeAllMessages();
            });
        },
        formSubmitHandler: function (e) {
            e.preventDefault();

            this.trigger('clearMessages');

            var dataObj = this.model.getValueObject();

            var actionId = this.model.get('actionId');

            if (this.options.prePostParser) {
                dataObj = this.options.prePostParser(dataObj);
            }

            this.trigger('formSubmit', dataObj);
        },
        addToTypeViewIndex: function (type, View) {
            this.typeViewIndex[type] = View;
        },
        submitSuccessHandler: function () {
            console.log(arguments);
        },
        submitFailureHandler: function (resp, errors) {
            _.each(errors, function (error) {
                error.messageType = 'failure';
                error.expires = 0;
            });
            this.trigger('showMessages', errors);
        },
        setElementValue: function (name, value) {
            var elements = this.model.get('elements');
            elements.get(name).set('value', value);
        }
    });


    FormView.addToTypeViewIndex = function (type, View) {
        setViewByType(type, View)
    }

    return {
        Model: FormModel,
        View: FormView,
        ElementModel: ElementModel,
        ElementCollection: ElementCollection,
        ElementView: ElementView
    };
});
