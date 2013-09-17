/**
 * Created with JetBrains WebStorm.
 * User: ravi.hamsa
 * Date: 28/06/13
 * Time: 4:18 PM
 * To change this template use File | Settings | File Templates.
 */
define(['base/app'], function(app) {
    'use strict';



    var validateValue = function(value, validationRules) {

        var errors = [];
        var errorRule;

        var isValid = _.every(validationRules, function(rule) {
            var isValidForRule = validationRuleMethods[rule.expr].call(this, rule, value);
            if (!isValidForRule) {
                errors.push(rule);
                errorRule = rule;
            }
            return isValidForRule;
        });

        return {
            isValid: isValid,
            errors: errors,
            errorRule: errorRule
        };
    };

    var validationRuleMethods = {
        'req': function(rule, value) {
            return !_.isEmpty(value);
        },
        'digits': function(rule, value) {
            return (/^\d{5}$/).test(value);
        },
        'alphanumeric': function(rule, value) {
            var ck_alphaNumeric = /^\w+$/;
            return ck_alphaNumeric.test(value);
        },
        'number': function(rule, value) {
            if (value === undefined) {
                return true;
            }
            var numberVal = +value;
            return numberVal === numberVal;
        },
        'email': function(rule, value) {
            var ck_email = /^([\w\-]+(?:\.[\w\-]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            return ck_email.test($.trim(value));
        },
        'minlen': function(rule, value) {
            var min = rule.length;
            return $.trim(String(value)).length >= min;
        },
        'maxlen': function(rule, value, exprvalue) {
            var max = rule.length;
            return $.trim(String(value)).length <= max;
        },
        'lt': function(rule, value, exprvalue) {
            var target = parseFloat(exprvalue);
            var curvalue = parseFloat(value);
            return curvalue < target;
        },
        'gt': function(rule, value, exprvalue) {
            var target = parseFloat(exprvalue);
            var curvalue = parseFloat(value);
            return curvalue > target;
        },
        'eq': function(rule, value, exprvalue) {
            return exprvalue === value;
        },
        'neq': function(rule, value) {
            return rule.value !== value;
        },
        'url': function(rule, value) {
            if (value === '') {
                return true;
            }
            var ck_url = /(http|https|market):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i;
            return ck_url.test($.trim(value));
        },
        'emaillist': function(rule, value) {
            var emails = value.split(',');
            var ck_email = /^([\w\-]+(?:\.[\w\-]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            for (var i = 0; i < emails.length; i++) {
                if ($.trim(emails[i]) !== '' && !ck_email.test($.trim(emails[i]))) {
                    return false;
                }
            }
            return true;
        },
        'function': function(rule, value) {
            var func = rule.func;
            return func.call(null, value);
        }

    };



    return {
        validateValue: validateValue,
        validationRuleMethods: validationRuleMethods
    };
});
