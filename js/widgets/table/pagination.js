define([
    'base/app',
    'base/view',
    'base/model',
    'base/util',
    'text!./pagination.html',
    'widgets/table/rowCollection'
],
    function (baseApp, BaseView, BaseModel, baseUtil, paginationTemplate, RowCollection) {
        'use strict';
        var View = BaseView.extend({
           constructor:function(){
                BaseView.apply(this, arguments);
                var rowCollection = this.getOption('rowCollection');
                this.listenTo(rowCollection, 'config_change',this.render);
            },
            template:paginationTemplate,
            renderTemplate:function(templateFunction){
                var rowCollection = this.getOption('rowCollection');
                var records = rowCollection.getProcessedRecords();
                var dataObj = rowCollection.getConfigs();
                dataObj.start = (records.length !== 0)? ((dataObj.page-1)*dataObj.perPage)+1 : 0;
                dataObj.end = Math.min((dataObj.page)*dataObj.perPage, dataObj.totalRecords);
                this.$el.html(templateFunction(dataObj));
            },
            actionHandler:function(action){
                var rowCollection = this.getOption('rowCollection');
                switch(action){
                    case 'nextPage':
                        rowCollection.nextPage();
                        break;
                    case 'prevPage':
                        rowCollection.prevPage();
                        break;
                }
            }
        })

        return {
            View:View
        }


    });