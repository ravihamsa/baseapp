define([
    'base/app',
    'base',
    'list/singleSelect'
    ],
    function(app, Base, SingleSelect) {

        "use strict";
        
        var baseUtil = Base.util;

        var View = SingleSelect.View.extend({});

        return {
            View: View,
            Model: SingleSelect.Model
        };

    });
