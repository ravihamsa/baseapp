define("widgets/form/validator",["base/app"],function(e){var t=function(e,t){var r=[],i,s=_.every(t,function(t){var s=n[t.expr].call(this,t,e);return s||(r.push(t),i=t),s});return{isValid:s,errors:r,errorRule:i}},n={req:function(e,t){return!_.isEmpty(t)},digits:function(e,t){return/^\d{5}$/.test(t)},alphanumeric:function(e,t){var n=/^\w+$/;return n.test(t)},number:function(e,t){if(t===undefined)return!0;var n=+t;return n===n},email:function(e,t){var n=/^([\w\-]+(?:\.[\w\-]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;return n.test($.trim(t))},minlen:function(e,t){var n=e.length;return $.trim(String(t)).length>=n},maxlen:function(e,t,n){var r=e.length;return $.trim(String(t)).length<=r},lt:function(e,t,n){var r=parseFloat(n),i=parseFloat(t);return i<r},gt:function(e,t,n){var r=parseFloat(n),i=parseFloat(t);return i>r},eq:function(e,t,n){return n===t},neq:function(e,t){return e.value!==t},url:function(e,t){if(t==="")return!0;var n=/(http|https|market):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i;return n.test($.trim(t))},emaillist:function(e,t){var n=t.split(","),r=/^([\w\-]+(?:\.[\w\-]+)*)@((?:[\w\-]+\.)*\w[\w\-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;for(var i=0;i<n.length;i++)if($.trim(n[i])!==""&&!r.test($.trim(n[i])))return!1;return!0},"function":function(e,t){var n=e.func;return n.call(null,t)}};return{validateValue:t,validationRuleMethods:n}}),define("text!widgets/form/inputView.html",[],function(){return'<div class="control-group">\n    <label class="control-label">\n        {{elementLabel this}}\n    </label>\n\n    <div class="controls type-{{type}}">\n        <input type="{{type}}" name="{{name}}" value="{{value}}" placeholder="{{placeholder}}" class="el-{{name}}"/>\n        <span class="help-inline"></span>\n    </div>\n</div>'}),define("widgets/form/element",["base/app","base","widgets/form/validator","text!./inputView.html"],function(e,t,n,r){var i=".control-group",s=".control-label",o=".help-inline",u="error",a=t.Model.extend({constructor:function(){t.Model.apply(this,arguments);var e=this,n=e.collection,r=e.get("activeRules");_.each(r,function(t){var r=n.get(t.element);r.on("change:value",function(t,n){e.updateActive()}),e.updateActive()})},defaults:{valid:!0,active:!0,disabled:!1,readonly:!1,skipPost:!1,value:null,label:null,activeRules:[],validationRules:[],type:"text",errorCode:"",group:"elements"},idAttribute:"name",updateActive:function(){var e=this.get("activeRules"),t=_.every(e,function(e){var t=this.collection.get(e.element);return c[e.expr].call(this,t,e)},this);this.set("active",t)},isElementValid:function(e){var t=this.get("validationRules"),r=[];if(this.isNot("active"))return[];var i,s=_.every(t,function(e){var t=n.validationRuleMethods[e.expr].call(this,e,this.get("value"));return t||(r.push(e),i=e),t},this);this.set("valid",s);if(!e)if(i){var o=i.message||"error."+this.get("name")+"."+i.expr;this.set("errorCode",o)}else this.set("errorCode","");return r},getSiblingValue:function(e){if(this.collection)return this.collection.get(e).get("value")},getSiblingAttribute:function(e,t){if(this.collection)return this.collection.get(e).get(t)},setSiblingAttribute:function(e,t,n){if(this.collection)return this.collection.get(e).set(t,n)},setSiblingValue:function(e,t){if(this.collection)return this.collection.get(e).set("value",t)},isElementDefault:function(){var e=this.toJSON();return e.value===e.defaultValue}}),f=t.Collection.extend({model:a}),l=t.View.extend({tagName:"div",className:"element",template:r,dataEvents:{forceRender:"render"},disabledChangeHandler:function(e){this.$el.toggleClass("disabled",e),this.$("input").attr("disabled",e)},readonlyChangeHandler:function(e){this.$el.toggleClass("readonly",e),this.$("input").attr("readonly",e)},validChangeHandler:function(e){this.$(i).toggleClass(u,!e)},activeChangeHandler:function(e){this.$el.toggle(e)},valueChangeHandler:function(e){this.$("input").val(e),this.model.updateActive()},errorCodeChangeHandler:function(t){var n=this.$(o);t===""?(n.empty(),this.model.set("valid",!0)):(this.model.set("valid",!1),n.html(e.getString(t)))},nameChangeHandler:function(e){this.$el.addClass("element-"+e)},valueFunction:function(){return this.$("input").val()},updateValue:function(e){this.model.set("value",this.valueFunction()),e!==!0&&this.model.isElementValid()}}),c={eq:function(e,t){return e.isEqual("value",t.value)},valid:function(e){return e.isElementValid(!0),e.is("valid")},isIn:function(e,t){var n=e.get("value");return t.value.indexOf(n)!==-1},neq:function(e,t){return e.isNotEqual("value",t.value)},"function":function(e,t){var n=t.func;return n.apply(this,arguments)}};return{View:l,Model:a,Collection:f}}),define("text!widgets/messageStack/messageStack.html",[],function(){return"<div>\n\n</div>"}),define("widgets/messageStack",["base","text!./messageStack/messageStack.html"],function(e,t){var n=e.View.extend({template:t}),r=e.Model.extend({removeAllMessages:function(){}});return{View:n,Model:r}}),define("widgets/calendar/month",["base"],function(e){var t=e.app.compileTemplate('<td><a href="#selectDate" data-date="{{date}}" data-month="{{month}}" data-year="{{year}}" class="day action {{#if isToday}}today{{/if}} {{#if isSelected}}selected{{/if}}{{#if isDisabled}}disabled{{/if}}">{{date}}</a> </td>'),n=e.View.extend({className:"month",template:'<a href="#prevMonth" class="action but-prev"> < </a><div class="month-name">{{monthName month}}-{{year}}</div> <a href="#nextMonth" class="action but-next"> > </a> ',postRender:function(){var e=$("<table></table>"),n=this.model.toJSON(),r=this.getDate().startOf("week"),i=0,s,o=!1,u=!1,a=!1,f=moment().startOf("day").valueOf(),l=n.selectedEpoch;while(i<42){var c=r.day();c===0&&(s=$("<tr></tr>"),e.append(s)),r.valueOf()===f?o=!0:o=!1,r.valueOf()===l?u=!0:u=!1,r.month()!==n.month?a=!0:a=!1,s.append(t({date:r.date(),month:r.month(),year:r.year(),isToday:o,isSelected:u,isDisabled:a})),r.add("days",1),i++}this.$el.append(e)},getDate:function(){var e=this.model.toJSON();return moment({y:e.year,M:e.month,d:1})},changeHandler:function(){this.render()},actionHandler:function(e,t){switch(e){case"prevMonth":var n=this.getDate();n.add("months",-1),this.model.set({month:n.month(),year:n.year()});break;case"nextMonth":var n=this.getDate();n.add("months",1),this.model.set({month:n.month(),year:n.year()});break;case"selectDate":var r=$(t.target),i=r.data(),n=moment({y:i.year,M:i.month,d:i.date});this.model.set("selectedEpoch",n.valueOf()),this.trigger("dateClicked",n);break;default:alert("unhandled action: "+e)}}}),r=e.Model.extend({defaults:{month:moment().month(),year:moment().year(),selectedEpoch:moment().startOf("day").valueOf()}});return{View:n,Model:r}}),define("widgets/calendar",["require","widgets/calendar/month"],function(e){return{Month:e("widgets/calendar/month")}}),define("text!widgets/form/checkListView.html",[],function(){return'<div class="control-group">\n    <label class="control-label">\n        {{elementLabel this}}\n    </label>\n\n    <ul class="controls list-inline">\n        {{#each options}}\n        <li>\n        <label class="type-checkbox inline">\n            <input type="checkbox" name="{{id}}" value="{{id}}" class="el-{{name}}"/>{{name}}\n        </label>\n        </li>\n        {{/each}}\n    </ul>\n    <span class="help-inline"></span>\n</div>'}),define("text!widgets/form/checkBoxView.html",[],function(){return'<div class="control-group">\n    <div class="controls">\n        <label class="type-{{type}} inline">\n            <input type="{{type}}" name="{{id}}" value="{{id}}" class="el-{{name}}"/>{{elementLabel this}}\n        </label>\n        <span class="help-inline"></span>\n    </div>\n</div>'}),define("text!widgets/form/radioListView.html",[],function(){return'<div class="control-group">\n    <label class="control-label">\n        {{elementLabel this}}\n    </label>\n\n    <ul class="controls list-inline">\n        {{#each options}}\n        <li>\n        <label class="type-radio inline">\n            <input type="radio" name="{{../name}}" value="{{id}}" class="el-{{name}}"/>{{name}}\n        </label>\n        </li>\n        {{/each}}\n    </ul>\n    <span class="help-inline"></span>\n</div>'}),define("text!widgets/form/selectView.html",[],function(){return'<div class="control-group">\n    <label class="control-label">\n        {{elementLabel this}}\n    </label>\n\n    <div class="controls">\n        <div class="styled_select">\n            <em class="down-arrow">&#9660;</em>\n        <select name="{{name}}" class="el-{{name}}">\n            {{#each options}}\n            <option value="{{id}}">{{name}}</option>\n            {{/each}}\n        </select>\n        </div>\n        <span class="help-inline"></span>\n\n    </div>\n</div>'}),define("text!widgets/form/textAreaView.html",[],function(){return'<div class="control-group">\n    <label class="control-label">\n        {{elementLabel this}}\n    </label>\n\n    <div class="controls">\n        <textarea type="{{type}}" name="{{name}}" class="el-{{name}}" placeholder="{{placeholder}}">{{value}}</textarea>\n        <span class="help-inline"></span>\n    </div>\n</div>'}),define("text!widgets/form/buttonView.html",[],function(){return'<div class="control-group">\n    <div class="controls">\n        <button type="submit" class="btn btn-default">{{value}}</button>\n        <span class="help-inline"></span>\n    </div>\n</div>'}),define("text!widgets/form/dateInputView.html",[],function(){return'<div class="control-group">\n    <label class="control-label">\n        {{elementLabel this}}\n    </label>\n\n    <div class="controls type-{{type}}">\n        <input type="text" name="{{name}}" value="{{value}}" placeholder="{{placeholder}}" class="el-{{name}} dateInput">\n        <div class="monthView"></div>\n        <span class="help-inline"></span>\n    </div>\n</div>'}),define("text!widgets/form/messageView.html",[],function(){return'<div class="control-group">\n    <div class="message">{{value}}\n    </div>\n</div>'}),define("widgets/form",["base/app","base/util","base","widgets/form/element","widgets/messageStack","widgets/calendar","text!./form/checkListView.html","text!./form/checkBoxView.html","text!./form/radioListView.html","text!./form/selectView.html","text!./form/textAreaView.html","text!./form/buttonView.html","text!./form/dateInputView.html","text!./form/messageView.html"],function(e,t,n,r,i,s,o,u,a,f,l,c,h,p){var d=r.View,v=r.Model,m=r.Collection,g=d.extend({template:c,valueFunction:function(){return},valueChangeHandler:function(e){return}}),y=d.extend({events:{"change input":"updateValue","blur input":"resetIfEmpty","focus input":"selectIfDefault","click input":"clearIfDefault"},selectIfDefault:function(){this.model.isElementDefault()&&this.$("input").select()},clearIfDefault:function(){this.model.isElementDefault()&&this.$("input").val("")},resetIfEmpty:function(){var e=this.$("input").val();if(e===""){var t=this.model.toJSON();t.defaultValue&&this.$("input").val(t.defaultValue)}this.updateValue()}}),b=y.extend({template:h,events:{"click .dateInput":"showDatePicker","change .dateInput":"dateChangeHandler"},postRender:function(){this.hideDatePicker()},showDatePicker:function(){var e=this,n=this.getSubView("monthView");n||(n=t.createView({View:s.Month.View,Model:s.Month.Model,parentEl:".monthView",parentView:this}),this.setSubView("monthView",n),this.listenTo(n,"dateClicked",function(t){e.hideDatePicker(),e.$(".dateInput").val(t.format("L")),e.updateValue()}));var r=this.model.get("value"),i=moment(r,"MM/DD/YYYY");n.model.set({year:i.year(),month:i.month(),selectedEpoch:i.valueOf()});var o=this.$el,u=$("body"),a=this.$(".monthView"),f="click.clickOutSite_"+this.cid;a.show(),u.off(f),u.on(f,function(e){var t=$(e.target);if(t.parents().index(u)==-1&&!t.is(u))return;t.parents().index(o)==-1&&a.is(":visible")&&(a.hide(),$("body").off(f))})},hideDatePicker:function(){var e="click.clickOutSite_"+this.cid;this.$(".monthView").hide(),$("body").off(e)},valueFunction:function(){return this.$(".dateInput").val()},valueChangeHandler:function(e){var t=moment(e,"MM/DD/YYYY");t.isValid()||(t=moment(),this.model.set("value",t.format("L"))),this.$(".dateInput").val(t.format("L"))},dateChangeHandler:function(){var e=this.$(".dateInput").val(),t=moment(e,"MM/DD/YYYY");t.isValid()?(this.model.set("value",e),this.hideDatePicker()):this.valueChangeHandler(this.model.get("value"))}}),w=y.extend({template:u,valueFunction:function(){return this.$("input").is(":checked")},valueChangeHandler:function(e){this.$("input").attr("checked",e)}}),E=d.extend({template:l,events:{"change textarea":"updateValue","blur textarea":"updateValue"},valueFunction:function(){return this.$("textarea").val()},valueChangeHandler:function(e){this.$("textarea").val(e)}}),S=d.extend({template:f,events:{"change select":"updateValue","blur select":"updateValue"},valueFunction:function(){return this.$("select").val()},valueChangeHandler:function(e){this.$("select").val(e)},disabledChangeHandler:function(e){this.$el.toggleClass("disabled",e),this.$("select").attr("disabled",e)}}),x=y.extend({events:{"change input":"updateValue"},template:a,valueFunction:function(){return this.$("input:checked").val()},valueChangeHandler:function(e){if(e==="")return;this.$("input[value="+e+"]").prop("checked","checked")}}),T=y.extend({template:o,valueFunction:function(){var e=this.$("input:checked"),t=_.map(e,function(e){return $(e).val()});return t},valueChangeHandler:function(e){_.isArray(e)&&_.each(e,function(e){this.$("input[value="+e+"]").attr("checked",!0)},this)}}),N=d.extend({template:'<input type="hidden" value="{{value}}" name="{{name}}" />',valueChangeHandler:function(e){this.$("input").val(e),this.$("input").trigger("change")},valueFunction:function(){return""+this.$("input").val()}}),C=d.extend({template:" ",valueChangeHandler:function(e){},valueFunction:function(){}}),k=d.extend({template:p,valueChangeHandler:function(e){this.$(".message").html(e)},valueFunction:function(){return this.$(".message").html()}}),L=d.extend({template:'<input type="hidden" value="{{value}}" name="{{name}}" />',valueChangeHandler:function(e){this.$("input").val(JSON.stringify(e)),this.updateValue()},valueFunction:function(){return JSON.parse(this.$("input").val())}}),A=y.extend({valueFunction:function(){return this.$("input").is(":checked")},valueChangeHandler:function(e){this.$("input").attr("checked",e)}}),O={select:S,textarea:E,checkbox:w,dateInput:b,radioList:x,checkList:T,hidden:N,json:L,submit:g,message:k,container:C},M=function(e){return O[e]||y},D=function(e,t){O[e]=t},P=function(e){O=_.extend({},O,e)},H=n.Model.extend({constructor:function(){n.Model.apply(this,arguments)},defaults:{elements:new m},setElementAttribute:function(e,t,n){var r=this.get("elements");r.get(e).set(t,n)},getValueObject:function(){var e=this.get("elements"),t=this.validateElements(),n={};return t.length===0?e.each(function(e){e.is("active")&&e.isNot("skipPost")&&(n[e.id]=e.get("value"))}):n.errors=t,n},validateElements:function(){var e=this.get("elements"),t=[];return e.each(function(e){t=t.concat(e.isElementValid())}),t},elementsChangeHandler:function(){var e=this.get("elements");e.on("change",function(e){var t="change",n=Array.prototype.slice.call(arguments,[0]);n[0]="elements:"+t,this.trigger.apply(this,n),n[0]="elements:"+e.get("name")+":"+t,this.trigger.apply(this,n)},this)}}),B="grp-",j=n.View.extend({constructor:function(e){this.typeViewIndex={},n.View.apply(this,arguments)},tagName:"div",className:"form-view",events:{"submit form":"formSubmitHandler"},template:'<div class="form-message-container"></div><form action="{{actionId}}" class="form-vertical" method=""> <div class="group-list"></div> <div class="grp-buttons"> </div> </form>',postRender:function(){this.formEl=this.$("form"),this.renderGroupContainers(),this.renderMessageStack();var e=this.model,t=e.get("elements");this.$el.hide(),t.each(function(e){this.addElement(e)},this),this.$el.show()},addElement:function(e){var n=e.toJSON(),r=this,i=this.typeViewIndex[n.type]||M(n.type),s=n.name,o,u=this.$(".element-"+s);if(u.length!==0)o=new i({model:e,el:u}),o.trigger("rendered"),o.postRender();else{o=t.createView({View:i,model:e,parentView:r});var a=n.group;this.$("."+B+a).append(o.el)}},removeElement:function(){},renderGroupContainers:function(){var e=this.model,t=e.get("elements"),n=_.unique(t.pluck("group")),r=this.$(".group-list");_.each(n,function(e){this.$("."+B+e).length===0&&r.append('<div class="'+B+e+'"></div>')},this)},renderMessageStack:function(){var e=new i.Model,t=new i.View({model:e,el:this.$(".form-message-container")});t.render(),this.on("showMessages",function(t){e.removeAllMessages(),_.each(t,function(t){var n=new i.Model(t);e.addMessage(n.toJSON())})}),this.on("clearMessages",function(t){e.removeAllMessages()})},formSubmitHandler:function(e){e.preventDefault(),this.trigger("clearMessages");var t=this.model.getValueObject(),n=this.model.get("actionId");this.options.prePostParser&&(t=this.options.prePostParser(t)),this.trigger("formSubmit",t)},addToTypeViewIndex:function(e,t){this.typeViewIndex[e]=t},submitSuccessHandler:function(){console.log(arguments)},submitFailureHandler:function(e,t){_.each(t,function(e){e.messageType="failure",e.expires=0}),this.trigger("showMessages",t)},setElementValue:function(e,t){var n=this.model.get("elements");n.get(e).set("value",t)}});return j.addToTypeViewIndex=function(e,t){D(e,t)},{Model:H,View:j,ElementModel:v,ElementCollection:m,ElementView:d}}),define("widgets/tab",["base/app","base","list/singleSelect"],function(e,t,n){var r=t.util,i=t.View.extend({tagName:"li",template:'<a href="#{{id}}" class="action">{{name}}</a>',changeHandler:function(){this.$el.toggleClass("active",this.model.is("selected"))}}),s=t.View.extend({changeHandler:function(){this.$el.toggle(this.model.is("selected"))}}),o=n.View.extend({template:'<div class="prop-tabs"><ul class="ib-list"></ul></div><div class="tab-panes"></div> ',postRender:function(){var e=this,n=this.model.get("items"),o=r.createView({View:t.CollectionView,collection:n,el:e.$(".ib-list"),itemView:i,parentView:e}),u=r.createView({View:t.CollectionView,tagName:"div",collection:n,el:e.$(".tab-panes"),itemView:s,parentView:e})},actionHandler:function(e){this.model.setSelectedById(e)}});return{View:o,Model:n.Model}}),define("widgets/table/rowCollection",["base/app","base/util","base/model","base/collection"],function(e,t,n,r){var i=r.extend({constructor:function(e,t){var n=this;r.apply(n,arguments),_.each(l,function(e){e(n)})}}),s=function(e){e.setSortKey=function(t){var n=e.getConfigs(),r="asc";t===n.sortKey?(r=n.sortOrder==="asc"?"desc":"asc",e.setConfigs({sortOrder:r})):e.setConfigs({sortKey:t,sortOrder:r})},e.getSorted=function(){var t=e.getConfigs(),n=e.sortBy(t.sortKey);return t.sortOrder!=="asc"&&n.reverse(),n}},o=function(t){var n=t.getOption("sortKey")||"name",r=t.getOption("sortOrder")||"asc",i={};t.addFilter=function(t){var n=e.getHash(JSON.stringify(t));i[n]=t},t.removeFilter=function(t){var n=e.getHash(t),r=i[n];if(!r)throw new Error("Filter missing");delete i[n]},t.getFiltered=function(e){var t=_.values(i);return t.length===0?e:_.filter(e,function(e){return e.checkFilters(t)})},t.getProcessedRecords=function(){var e=t.getConfigs();return e.requestId||t.url?t.toArray():t.getPaginated(t.getFiltered(t.getSorted(t)))},t.processedEach=function(e,n){var r=t.getProcessedRecords();_.each(r,function(r,i){e.call(n||t,r,i)})}},u=function(e){var t=e.getConfigs();e.setConfig("totalRecords",e.length),e.getPaginated=function(n){return t=e.getConfigs(),e.setConfig("totalRecords",n.length),t.paginated?n.splice((t.page-1)*t.perPage,t.perPage):n},e.nextPage=function(){var t=e.getConfigs(),n=Math.ceil(t.totalRecords/t.perPage),r=e.getConfig("page");e.setConfig("page",Math.min(r+1,n))},e.prevPage=function(){var t=e.getConfig("page");e.setConfig("page",Math.max(1,t-1))}},a=function(e){var t=new n({sortOrder:"asc"}),r={setConfig:function(e,n){t.set(e,n)},getConfig:function(e){return t.get(e)},setConfigs:function(e){t.set(e)},getConfigs:function(e){return t.toJSON(e)},getConfigModel:function(){return t}};_.extend(e,r),e.setConfigs(_.extend({},e.getOption("config"))),e.listenTo(t,"all",function(t){e.trigger.apply(e,["config_"+t].concat(_.rest(arguments)))}),t.on("change:page change:perPage",function(e){var t=e.toJSON(),n=(t.page-1)*t.perPage,r=Math.min(n+t.perPage,t.totalRecords);e.set({start:n,end:r})})},f=function(e){},l=[a,o,s,u,f];return i}),define("text!widgets/table/pagination.html",[],function(){return'<div class="paginator">\n    <div class="summary">\n        <strong>{{start}}</strong> to <strong>{{end}}</strong> of <strong>{{totalRecords}}</strong>\n    </div>\n    {{#if totalRecords}}\n    <div class="buttons">\n        <ul>\n\n            <li><a href="#prevPage" class="action"> < </a> </li>\n            <li class="cur-page">{{page}}</li>\n            <li><a href="#nextPage" class="action"> > </a> </li>\n        </ul>\n    </div>\n    {{/if}}\n</div>'}),define("widgets/table/pagination",["base/app","base/view","base/model","base/util","text!./pagination.html","widgets/table/rowCollection"],function(e,t,n,r,i,s){var o=t.extend({constructor:function(){t.apply(this,arguments);var e=this.getOption("rowCollection");this.listenTo(e,"config_change",this.render)},template:i,renderTemplate:function(e){var t=this.getOption("rowCollection"),n=t.getProcessedRecords(),r=t.getConfigs();r.start=n.length!==0?(r.page-1)*r.perPage+1:0,r.end=Math.min(r.page*r.perPage,r.totalRecords),this.$el.html(e(r))},actionHandler:function(e){var t=this.getOption("rowCollection");switch(e){case"nextPage":t.nextPage();break;case"prevPage":t.prevPage()}}});return{View:o}}),define("widgets/table",["base/app","base/view","base/model","base/configurableModel","base/collection","base/util","widgets/table/rowCollection","widgets/table/pagination"],function(e,t,n,r,i,s,o,u){var a=n.extend({}),f=t.extend({constructor:function(){var e=this;t.apply(e,arguments);var n=e.getOption("rowModel");if(!n)return;var r=e.model.get("key");e.listenTo(n,"change:"+r,function(t,n){e.model.set("value",n)})},tagName:"td",template:'<div class="cell-value" style="text-align: {{align}};">{{#if renderHTML}}{{{value}}}{{else}}{{value}}{{/if}}</div>',attributes:function(){var e=this.model.toJSON();return{"class":e.classNames,style:"width:"+e.width,"data-key":e.key}},valueChangeHandler:function(){this.render()},valueFunction:function(){return this.model.get("value")}}),l=f.extend({tagName:"th",template:'<div class="cell-value" style="text-align: {{align}};">{{#if renderHTML}}{{{label}}}{{else}}{{label}}{{/if}}</div>'}),c=l.extend({constructor:function(){var e=this;t.apply(e,arguments);var n=e.getOption("rowCollection"),r=e.model.get("key"),i=function(){var t=n.getProcessedRecords(),i=_.filter(t,function(e){return e.get(r)===!0});t.length===0?(e.model.set("value",!1),e.model.set("disabled",!0)):(i.length===t.length?e.model.set("value",!0):e.model.set("value",!1),e.model.set("disabled",!1))};e.listenTo(n,"change:"+r,i),i()},template:'<label class="cell-value" style="text-align: {{align}}; display:block;"> <input type="checkbox" /></label>',events:{"change input":"updateRowCollection"},updateRowCollection:function(){var e=this.model.get("key"),t=this.getOption("rowCollection"),n=t.getProcessedRecords(),r=this.valueFunction();_.each(n,function(t){t.set(e,r)})},valueFunction:function(){return this.$("input").is(":checked")},valueChangeHandler:function(e){this.$("input").prop("checked",e)},disabledChangeHandler:function(e){this.$("input").prop("disabled",e)}}),h=f.extend({template:'<label class="cell-value" style="text-align: {{align}}; display:block;"> <input type="checkbox" /></label>',events:{"change input":"updateRowModel"},updateRowModel:function(){var e=this.getOption("rowModel"),t=this.model.get("key");e.set(t,this.valueFunction())},valueFunction:function(){return this.$("input").is(":checked")},valueChangeHandler:function(e){this.$("input").prop("checked",e)},disabledChangeHandler:function(e){console.log(e,this.$("input")),this.$("input").prop("disabled",e)}}),p={checkbox:h},d={checkbox:c},v=t.extend({tagName:"tr",className:"table-row",postRender:function(){var e=this,t=this.model.toJSON(!0),r=t.items,i=this.getOption("rowModel");_.each(r,function(t){var r=p[t.type]||f,o=s.createView({View:r,Model:n,modelAttributes:t,rowModel:i,parentView:e});o.$el.appendTo(e.$el)})},useDeepJSON:!0}),m=v.extend({className:"table-heading",postRender:function(){var e=this,t=this.model.toJSON(!0),r=t.items,i=this.getOption("rowCollection");_.each(r,function(t){var r=d[t.type]||l,o=s.createView({View:r,Model:n,modelAttributes:t,rowCollection:i,parentView:e});o.$el.appendTo(e.$el)})}}),g=t.extend({tagName:"tr",className:"table-row no-data-row",template:'<td colspan="{{colspan}}">{{value}}</td>'}),y=function(){var t=this,r={},o=this.$el,u=this.getOption("rowCollection"),a=this.getOption("columns");t.addItem=function(o,f,l){var c=u.getConfig("sortOrder"),h=u.getConfig("sortKey"),p=_.map(a,function(t){var n=["cell"];h===t.key&&(n.push("sorted"),n.push("order-"+c)),f%2===0&&n.push("even");var r=o.toJSON();return{key:t.key,type:t.type||"value",classNames:n.join(" "),value:e.getFormatted(r[t.key],t.formatter,r),align:t.align||"left",width:t.width?t.width+"px":"auto",renderHTML:t.renderHTML}}),d=new n({items:new i(p)}),m=s.createView({model:d,View:v,parentView:t,rowModel:o});r[m.cid]=m,m.$el.appendTo(l)},t.addHeaderItem=function(o){var f=u.getConfig("sortOrder"),l=u.getConfig("sortKey"),c=_.map(a,function(t){var n=["header-cell"];return t.sortable!==!1&&n.push("sortable"),l===t.key&&(n.push("sorted"),n.push("order-"+f)),{key:t.key,type:t.type||"value",classNames:n.join(" "),label:t.label||e.beautifyId(t.key),align:t.align||"left",width:t.width?t.width+"px":"auto"}}),h=new n({items:new i(c)}),p=s.createView({View:m,model:h,parentEl:o,parentView:t,rowCollection:u});r[p.cid]=p},t.renderNoData=function(){var e=s.createView({View:g,parentEl:".row-list",parentView:t,model:new n({colspan:a.length,value:t.getOption("noDataTemplate")||"No Records"})});r[e.cid]=e},t.removeItem=function(e){var n=t.getModelViewAt(e.id);n.remove()},t.removeAllRows=function(){_.each(r,function(e){console.log(e.el,e.cid),e.remove()})},t.getModelViewAt=function(e){return r[e]},t.removeReferences(function(){t=null,r=null,o=null,u=null})},b=t.extend({template:'<div class="table-header"></div> <table class="row-list"></table><div class="table-footer"></div>',className:"data-table",events:{"click th.sortable":"toggleSort"},constructor:function(e){var n=this;t.call(n,e),_.each([y],function(t){t.call(n,e)});var r=this.getOption("rowCollection");n.listenTo(r,"config_change",n.loadRows),n.listenTo(r,"reset",function(){n.redrawTable()})},redrawTable:function(){this.removeAllRows(),this.renderHeader(),this.renderRows()},postRender:function(){this.loadRows()},loadRows:function(){var e=this,t=this.$el,n=this.getOption("rowCollection");t.hide();var r=n.getConfigs();if(r.requestId){var i=e.addRequest({id:r.requestId,params:r});i.done(function(e){n.setConfig("totalRecords",e.totalRecords),n.reset(e.results)})}else n.url?n.fetch({processData:!0,reset:!0}):e.redrawTable();t.show()},renderRows:function(){var e=this,t=e.getOption("rowCollection"),n=t.getProcessedRecords(),r=this.$(".row-list");n.length===0?e.renderNoData():_.each(n,function(t,n){e.addItem(t,n,r)})},renderHeader:function(){var e=this,t=this.$(".row-list");e.addHeaderItem(t)},loadingHandler:function(e){t.prototype.loadingHandler.call(this,e)},toggleSort:function(e){if(this.$(".no-data-row").length>0){e.preventDefault();return}var t=$(e.currentTarget),n=t.data("key");this.getOption("rowCollection").setSortKey(n)}});return{View:b,RowCollection:o,Model:a}}),define("widgets",["require","widgets/form","widgets/calendar","widgets/header","widgets/messageStack","widgets/tab","widgets/table"],function(e){return{Form:e("widgets/form"),Calender:e("widgets/calendar"),Header:e("widgets/header"),MessageStack:e("widgets/messageStack"),Tab:e("widgets/tab"),Table:e("widgets/table")}});