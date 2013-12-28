define([
    'base/app',
    'base/view',
    'base/model',
    'base/configurableModel',
    'base/collection',
    'base/util',
    'widgets/table/rowCollection',
    'widgets/table/pagination'
],
    function (baseApp, BaseView, BaseModel, ConfigurableModel, BaseCollection, baseUtil, RowCollection, Pagination) {
        'use strict';

        var TableModel = BaseModel.extend({

        })


        var RowView = BaseView.extend({
            tagName: 'tr',
            className: 'table-row',
            template: '{{#each items}}<td data-key="{{key}}" class="{{classNames}}" style="width:{{width}}"><div class="cell-value" style="text-align: {{align}};">{{#if renderHTML}}{{{value}}}{{else}}{{value}}{{/if}}</div></td>{{/each}}',
            useDeepJSON: true
        })

        var HeaderView = RowView.extend({
            className: 'table-heading',
            template: '{{#each items}}<th data-key="{{key}}" class="{{classNames}}"  style="width:{{width}}"><div class="cell-value" style="text-align: {{align}}">{{value}}</div></th>{{/each}}'
        })

        var setupRowRender = function () {
            var _this = this; 
            var viewIndex = {};
            var el = this.$el;
            var coll = this.getOption('rowCollection');
            var columns = this.getOption('columns');



            _this.addItem = function (model, index, containerEl) {
                var sortOrder = coll.getConfig('sortOrder');
                var sortKey = coll.getConfig('sortKey');

                var rowValueArray = _.map(columns, function (item) {
                    var classList = ['cell'];
                    if (sortKey === item.key) {
                        classList.push('sorted');
                        classList.push('order-'+sortOrder);

                    }

                    if (index % 2 === 0) {
                        classList.push('even')
                    }

                    var dataObj = model.toJSON();

                    return {
                        key: item.key,
                        classNames: classList.join(' '),
                        value: baseApp.getFormatted(dataObj[item.key], item.formatter, dataObj),
                        align: item.align || 'left',
                        width: item.width ? item.width+'px' : 'auto',
                        renderHTML: item.renderHTML
                    }

                })

                var rowModel = new BaseModel({
                    items: new BaseCollection(rowValueArray)
                })


                var view = baseUtil.createView({model: rowModel, View: RowView, parentView: _this});
                viewIndex[view.cid] = view;
                //console.log(view.$el.html());
                view.$el.appendTo(containerEl);

            };

            _this.addHeaderItem = function(containerEl){
                var sortOrder = coll.getConfig('sortOrder');
                var sortKey = coll.getConfig('sortKey');

                var columnsArray = _.map(columns, function (item) {
                    var classList = ['header-cell'];
                    if(item.sortable !== false){
                        classList.push('sortable');
                    }

                    if (sortKey === item.key) {
                        classList.push('sorted');
                        classList.push('order-'+sortOrder);
                    }

                    return {
                        key: item.key,
                        classNames: classList.join(' '),
                        value: item.label || baseApp.beautifyId(item.key),
                        align: item.align || 'left',
                        width: item.width ? item.width+'px' : 'auto'
                    }
                })

                var headerModel = new BaseModel({
                    items: new BaseCollection(columnsArray)
                })

                var headerView = baseUtil.createView({
                    View: HeaderView,
                    model: headerModel,
                    parentEl: containerEl,
                    parentView: _this
                })

                viewIndex[headerView.cid] = headerView;
            }

            _this.removeItem = function (model) {
                var view = _this.getModelViewAt(model.id);
                view.remove();
            };

            _this.removeAllRows = function(){
                _.each(viewIndex, function(view, modelId){
                    //console.log(view.el, modelId);
                    view.remove();
                });
            }

            _this.getModelViewAt = function (id) {
                return viewIndex[id];
            };

            _this.removeReferences(function () {
                _this = null;
                viewIndex = null;
                el = null;
                coll = null;
            })


        };


        var View = BaseView.extend({
            template: '<div class="table-header"></div> <table class="row-list"></table><div class="table-footer"></div>',
            className: 'data-table',
            events:{
                'click th.sortable':'toggleSort'
            },
            constructor: function (options) {
                var _this = this;
                BaseView.call(_this, options);
                _.each([setupRowRender], function (func) {
                    func.call(_this, options);
                });
                var rowCollection = this.getOption('rowCollection');
                _this.listenTo(rowCollection, 'config_change', _this.loadRows);

                _this.listenTo(rowCollection, 'reset', function () {
                   _this.redrawTable();
                })
            },
            redrawTable:function(){
                this.removeAllRows();
                this.renderHeader();
                this.renderRows();
            },
            postRender: function () {
                this.loadRows();
            },
            loadRows:function(){
                var _this = this;
                var el = this.$el;
                var coll = this.getOption('rowCollection');
                el.hide();

                var collConfig = coll.getConfigs();

                if (collConfig.requestId) {

                    var def = _this.addRequest({
                        id: collConfig.requestId,
                        params: collConfig
                    })

                    def.done(function (resp) {
                        coll.setConfig('totalRecords', resp.totalRecords);
                        coll.reset(resp.results);
                    })
                } else if (coll.url) {
                    coll.fetch({processData: true,reset: true});
                } else {
                    _this.redrawTable();
                }
                el.show();
            },
            renderRows:function(){
                var _this = this;
                var coll = _this.getOption('rowCollection');
                var arrayOfRecords = coll.getProcessedRecords();
                var rowList = this.$('.row-list');

                if(arrayOfRecords.length === 0){
                    _this.renderNoData();
                }else{
                    _.each(arrayOfRecords, function(model, index){
                        _this.addItem(model, index, rowList);
                    })
                }
            },
            renderNoData:function(){
                var _this = this;
                var noDataTemplate = this.getOption('noDataTemplate') || 'No Records';
                var rowList = this.$('.row-list');
                var columns = this.getOption('columns');
                baseApp.getTemplateDef(noDataTemplate, _this.getTemplateType()).done(function(templateFunction){
                    var td = $('<td></td>').prop('colspan',columns.length);
                    td.html(templateFunction({}));
                    var tr = $('<tr class="table-row no-data-row"></tr>').appendTo(rowList);
                    td.appendTo(tr);
                });
                
            },
            renderHeader: function () {
                var _this = this;
                var rowList = this.$('.row-list');
                _this.addHeaderItem(rowList)

            },
            loadingHandler:function(isLoading){
                BaseView.prototype.loadingHandler.call(this, isLoading);
                //console.log(this.el);
            },
            toggleSort:function(e){
                var target = $(e.currentTarget);
                var colName = target.data('key');
                this.getOption('rowCollection').setSortKey(colName);
            }
        })

        return {
            View: View,
            RowCollection: RowCollection,
            Model: TableModel
        }


    });