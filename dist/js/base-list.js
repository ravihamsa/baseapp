/**
 * @license RequireJS text 2.0.5+ Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */

define("base/util",[],function(){function i(e){var t=!1;return function(){if(t)throw new Error("Callback was already called.");t=!0,e.apply(null,arguments)}}var e=function(e){if(!e)return{};var t=_.map(e.split(";"),function(e){return e.split("=")}),n={};return _.each(t,function(e){n[e[0]]=e[1]}),n},t=function(e){var t=[];return _.each(e,function(e,n){t.push(n+"="+e)}),t.join(";")},n=function(e,t){if(e.forEach)return e.forEach(t);for(var n=0;n<e.length;n+=1)t(e[n],n,e)},r=function(e,t){if(e.map)return e.map(t);var r=[];return n(e,function(e,n,i){r.push(t(e,n,i))}),r},s;return typeof setImmediate=="function"?s=function(e){setImmediate(e)}:s=function(e){setTimeout(e,0)},{paramsToObject:e,objectToParams:t,createView:function(e){var t,n="model";if(e.collection||e.Collection)n="collection";n==="model"?e.Model&&(e.model=new e.Model(e.attributes)):e.Collection&&(e.collection=new e.Collection(e.items));var r=_.omit(e,"Collection","Model","parentEl","skipRender");return t=new e.View(r),t&&(e.skipRender||t.render(),e.parentEl&&(e.replaceHTML&&e.parentEl.empty(),t.$el.appendTo(e.parentEl))),t},aSyncQueue:function(e,t){function r(e,r,i,o){r.constructor!==Array&&(r=[r]),n(r,function(n){var r={data:n,callback:typeof o=="function"?o:null};i?e.tasks.unshift(r):e.tasks.push(r),e.saturated&&e.tasks.length===t&&e.saturated(),s(e.process)})}t===undefined&&(t=1);var o=0,u={tasks:[],concurrency:t,saturated:null,empty:null,drain:null,added:null,push:function(e,t){r(u,e,!1,t),u.added&&u.tasks.length!==0&&u.added()},unshift:function(e,t){r(u,e,!0,t)},process:function(){if(o<u.concurrency&&u.tasks.length){var t=u.tasks.shift();u.empty&&u.tasks.length===0&&u.empty(),o+=1;var n=function(){o-=1,t.callback&&t.callback.apply(t,arguments),u.drain&&u.tasks.length+o===0&&u.drain(),u.process()},r=i(n);e(t.data,r)}},length:function(){return u.tasks.length},running:function(){return o}};return u}}}),define("base/router",["require","base/util"],function(e){var t=e("base/util"),n=Backbone.Router.extend({routes:{"":"index",":appId/:pageId/*params":"loadAppPage",":appId/":"loadApp",":appId":"loadApp",":appId/:pageId":"loadAppPage",":appId/:pageId/":"loadAppPage"},index:function(){e(["base/app"],function(e){e.router.navigate("#"+e.defaultApp,{trigger:!0})})},loadAppPage:function(n,r,i){e(["base/app"],function(e){var s=t.paramsToObject(i);s.appId=n,s.pageId=r,e.appModel.set(s)})},loadApp:function(n,r,i){e(["base/app"],function(e){var s=t.paramsToObject(i);s.appId=n,s.pageId=r,e.appModel.set(s)})}});return n}),define("base/dataLoader",["require"],function(e){var t={},n={};n.define=function(e,n){t[e]=n};var r=n.getConfig=function(e){if(t[e])return _.clone(t[e]);throw Error("Undefined request by Id: "+e)};return n.getRequest=function(e,t){var n=r(e,t),i=$.extend(!0,{},n);return n.type.toLowerCase()==="post"?(i.data=JSON.stringify(t),$.ajax(i)):n.type.toLowerCase()==="form_post"?$.post(i.url,t):(_.isEmpty(t)||(i.url+="?"+$.param(t)),$.ajax(i))},n}),define("base/app",["require","base/router","base/dataLoader"],function(e,t,n){var r=window.hex_md5,i=function(e){return r(e.toString())},s=function(e){return u[e]},o=function(e){return a[e]},u={},a={},f={root:"/",baseUrl:"js/",defaultApp:"default",appBody:"#app-body",compileTemplate:function(e){return Handlebars.compile(e)},router:new t,getTemplateDef:function(t){var n=this;t=t||"";var r=i(t),o=s(r);return o||(o=$.Deferred(),n.cacheTemplate(o,r),typeof t=="function"?o.resolve(t):typeof t=="string"&&(/html$/.test(t)?e(["text!"+t],function(e){o.resolve(n.compileTemplate(e))}):t.indexOf("#")===0?o.resolve(n.compileTemplate($(t).html())):o.resolve(n.compileTemplate(t)))),o},cacheTemplate:function(e,t){u[t]=e},cacheData:function(e,t){a[t]=e},log:function(){console.log.apply(console,arguments)},getString:function(e){return e},parseSuccessResponse:function(e){return e},parseFailureResponse:function(e){return e},appModel:new Backbone.Model,getRequestDef:function(e){var t=this,r=n.getConfig(e.id),s=t.parseSuccessResponse,u=t.parseFailureResponse;r.parser&&(s=u=r.parser);var a=i(JSON.stringify(_.pick(e,"id","params"))),f=o(a);if(!f){f=$.Deferred();var l=n.getRequest(e.id,e.params);l.done(function(e){var n=s(e);n.errors?f.resolve(n.errors):(t.cacheData(f,a),f.resolve(n))}),l.fail(function(e){f.resolve({errors:[{errorCode:"network issue",message:"Network failure try again later"}]})})}return f},beautifyId:function(e){return e=e.replace(/([A-Z])/g,function(e){return" "+e}),e.replace(/(^.)/g,function(e){return e.toUpperCase()})},getDataIndex:function(){return a},getTemplateIndex:function(){return u},getHash:i};return f}),define("base/model",[],function(){var e=Backbone.Model.extend({is:function(e){return this.get(e)===!0},isNot:function(e){return this.get(e)===!1},isEqual:function(e,t){return this.get(e)===t},isNotEqual:function(e,t){return this.get(e)!==t},removeSelf:function(){this.collection&&this.collection.remove(this)},moveUp:function(){var e=this.collection;if(!e)return;var t=e.indexOf(this);if(t===0)return;this.removeSelf(),e.add(this,{at:t-1})},moveDown:function(){var e=this.collection;if(!e)return;var t=e.indexOf(this);if(t===e.length-1)return;this.removeSelf(),e.add(this,{at:t+1})},getClosest:function(){var e=this.collection;if(!e||e.length<2)return;var t=e.indexOf(this),n=e.at(t-1);return n?n:e.at(t+1)},toJSON:function(e){var t=_.clone(this.attributes);return e&&_.each(t,function(e,n){e.toJSON&&(t[n]=e.toJSON())}),t},checkFilters:function(e){if(e.length===0)return!0;var n=this,r=n.toJSON(),i=_.every(e,function(e){return t[e.expr].call(n,e,r[e.column])});return i}}),t={eq:function(e,t){return e.value===t},startsWith:function(e,t){return(new RegExp("^"+t,"i")).test(e.value)},endsWith:function(e,t){return(new RegExp(t+"$","i")).test(e.value)},has:function(e,t){return(new RegExp(t,"i")).test(e.value)}};return e}),define("base/view",["base/app","base/model","base/util"],function(e,t,n){var r=Backbone.View.extend({constructor:function(e){var t=this;Backbone.View.call(t,e),_.each(d,function(n){n.call(t,e)}),_.each(t.extensions,function(n){n.call(t,e)});var n=t.getOption("addOns");n&&n.length>0&&_.each(n,function(n){n.call(t,e)})},extensions:[],render:function(){var n=this;n.beforeRender();var r=function(){e.getTemplateDef(n.getTemplate()).done(function(e){n.model||(n.model=new t),n.renderTemplate(e),u.call(n);if(n.setState){var r=_.keys(n.getOption("states"))[0];n.setState(n.getState()||n.getOption("state")||r)}n.postRender()})},i=function(){r()},s=n.loadMeta();return s.done(i),n},postRender:function(){},beforeRender:function(){},renderTemplate:function(e){var t=this.getOption("useDeepJSON");this.$el.html(e(this.model.toJSON(t)))},getOption:function(e){return this.options[e]||this[e]},loadingHandler:function(e){this.$el.toggleClass("loading",e)},metaLoadErrorHandler:function(){this.$el.html("Error Loading Meta Data")},addMethod:function(e,t){this[e]||(this[e]=t)}}),i=function(){var e=this,t=e.model||e.collection,n,e;n=e.dataEvents,_.each(n,function(n,r){var i,s,o;o=/\s+/,s=n.split(o),i=r.split(o),_.each(s,function(n){_.each(i,function(r){t.on(r,function(){if(!e[n])throw n+" Not Defined";var t=Array.prototype.slice.call(arguments);t.unshift(r),e[n].apply(e,t)})})})})},s=function(){var e=this,t=e.getOption("states");if(!t)return;var r,i,s=function(){i&&(i.off(),i.remove())},o=function(t){i=n.createView({View:t,model:e.model,parentEl:e.$(".state-view")})};e.setState=function(e){if(typeof e!="string")throw new Error("state should be a string");if(r===e)return;r=e;var n=t[e];if(!n)throw new Error("Invalid State");s(),o(n)},e.getState=function(){return r}},o=function(){(function(e){var t=e.getOption("template")||e.template;e.setTemplate=function(n){t=n,e.render()},e.getTemplate=function(){return t}})(this)},u=function(){var e=this,t={},r=e.getOption("views");if(!r)return;_.each(r,function(r,i){r.parentEl&&typeof r.parentEl=="string"&&(r.parentEl=e.$(r.parentEl)),t[i]=n.createView(r)}),e.getSubView=function(e){var n=t[e];if(n)return n;throw new Error("No View Defined for id :"+e)},e.getSubModel=function(t){return e.getSubView(t).model},e.getSubAttribute=function(t,n){return e.getSubModel(t).get(n)}},a=function(){var e=this,t=e.model;t&&(t.on("change",_.bind(f,e)),l.call(e,t))},f=function(e){var t=e.changedAttributes();_.each(t,function(e,t){var n=this[t+"ChangeHandler"];n&&typeof n=="function"&&n.call(this,e)},this);var n=this.changeHandler;n&&typeof n=="function"&&n.call(this,t)},l=function(e){var t=e.toJSON();_.each(t,function(e,t){var n=this[t+"ChangeHandler"];n&&typeof n=="function"&&n.call(this,e)},this);var n=this.changeHandler;n&&typeof n=="function"&&n.call(this,t)},c=function(){var e=this,t=function(e){e.actionHandled&&(e.stopPropagation(),$("body").trigger("click"))};e.actionHandler&&e.$el.on("click",".action",function(n){n.preventDefault();var r=$(n.currentTarget),i=r.attr("href").substr(1);e.actionHandler.call(e,i,n),t(n)}),e.$el.on("click",".dummy",function(e){e.preventDefault()})},h=function(){var e=this,t=this.getOption("renderEvents")||this.renderEvents;t&&t.length>0&&e.model.on(t.join(" "),function(){e.render.call(e)})},p=function(){var t=this,n=t.getOption("requests")||t.requests,r=0,i=function(){r++,t.loadingHandler.call(t,!0)},s=function(){r--,r===0&&t.loadingHandler.call(t,!1)};t.addRequest=function(t,n){var r=t;_.isArray(r)||(r=[r]);var o=_.map(r,function(t){var n=e.getRequestDef(t);return n.always(s),t.callback&&n.always(t.callback),i(),n}),u=$.when.apply(null,o);return n&&u.then(n),u},t.loadMeta=function(){if(!t.metaDef){var e=n?t.addRequest(n,function(){var e=t.getOption("requestsParser");e&&e.apply(t,arguments)}):$.when({});t.metaDef=e}return t.metaDef}},d=[i,p,o,a,c,h,s];return r}),define("text",["module"],function(e){var t,n,r,i,s=["Msxml2.XMLHTTP","Microsoft.XMLHTTP","Msxml2.XMLHTTP.4.0"],o=/^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,u=/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,a=typeof location!="undefined"&&location.href,f=a&&location.protocol&&location.protocol.replace(/\:/,""),l=a&&location.hostname,c=a&&(location.port||undefined),h=[],p=e.config&&e.config()||{};t={version:"2.0.5+",strip:function(e){if(e){e=e.replace(o,"");var t=e.match(u);t&&(e=t[1])}else e="";return e},jsEscape:function(e){return e.replace(/(['\\])/g,"\\$1").replace(/[\f]/g,"\\f").replace(/[\b]/g,"\\b").replace(/[\n]/g,"\\n").replace(/[\t]/g,"\\t").replace(/[\r]/g,"\\r").replace(/[\u2028]/g,"\\u2028").replace(/[\u2029]/g,"\\u2029")},createXhr:p.createXhr||function(){var e,t,n;if(typeof XMLHttpRequest!="undefined")return new XMLHttpRequest;if(typeof ActiveXObject!="undefined")for(t=0;t<3;t+=1){n=s[t];try{e=new ActiveXObject(n)}catch(r){}if(e){s=[n];break}}return e},parseName:function(e){var t,n,r,i=!1,s=e.indexOf("."),o=e.indexOf("./")===0||e.indexOf("../")===0;return s!==-1&&(!o||s>1)?(t=e.substring(0,s),n=e.substring(s+1,e.length)):t=e,r=n||t,s=r.indexOf("!"),s!==-1&&(i=r.substring(s+1)==="strip",r=r.substring(0,s),n?n=r:t=r),{moduleName:t,ext:n,strip:i}},xdRegExp:/^((\w+)\:)?\/\/([^\/\\]+)/,useXhr:function(e,n,r,i){var s,o,u,a=t.xdRegExp.exec(e);return a?(s=a[2],o=a[3],o=o.split(":"),u=o[1],o=o[0],(!s||s===n)&&(!o||o.toLowerCase()===r.toLowerCase())&&(!u&&!o||u===i)):!0},finishLoad:function(e,n,r,i){r=n?t.strip(r):r,p.isBuild&&(h[e]=r),i(r)},load:function(e,n,r,i){if(i.isBuild&&!i.inlineText){r();return}p.isBuild=i.isBuild;var s=t.parseName(e),o=s.moduleName+(s.ext?"."+s.ext:""),u=n.toUrl(o),h=p.useXhr||t.useXhr;!a||h(u,f,l,c)?t.get(u,function(n){t.finishLoad(e,s.strip,n,r)},function(e){r.error&&r.error(e)}):n([o],function(e){t.finishLoad(s.moduleName+"."+s.ext,s.strip,e,r)})},write:function(e,n,r,i){if(h.hasOwnProperty(n)){var s=t.jsEscape(h[n]);r.asModule(e+"!"+n,"define(function () { return '"+s+"';});\n")}},writeFile:function(e,n,r,i,s){var o=t.parseName(n),u=o.ext?"."+o.ext:"",a=o.moduleName+u,f=r.toUrl(o.moduleName+u)+".js";t.load(a,r,function(n){var r=function(e){return i(f,e)};r.asModule=function(e,t){return i.asModule(e,f,t)},t.write(e,a,r,s)},s)}};if(p.env==="node"||!p.env&&typeof process!="undefined"&&process.versions&&!!process.versions.node)n=require.nodeRequire("fs"),t.get=function(e,t){var r=n.readFileSync(e,"utf8");r.indexOf("﻿")===0&&(r=r.substring(1)),t(r)};else if(p.env==="xhr"||!p.env&&t.createXhr())t.get=function(e,n,r,i){var s=t.createXhr(),o;s.open("GET",e,!0);if(i)for(o in i)i.hasOwnProperty(o)&&s.setRequestHeader(o.toLowerCase(),i[o]);p.onXhr&&p.onXhr(s,e),s.onreadystatechange=function(t){var i,o;s.readyState===4&&(i=s.status,i>399&&i<600?(o=new Error(e+" HTTP status: "+i),o.xhr=s,r(o)):n(s.responseText))},s.send(null)};else if(p.env==="rhino"||!p.env&&typeof Packages!="undefined"&&typeof java!="undefined")t.get=function(e,t){var n,r,i="utf-8",s=new java.io.File(e),o=java.lang.System.getProperty("line.separator"),u=new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(s),i)),a="";try{n=new java.lang.StringBuffer,r=u.readLine(),r&&r.length()&&r.charAt(0)===65279&&(r=r.substring(1)),n.append(r);while((r=u.readLine())!==null)n.append(o),n.append(r);a=String(n.toString())}finally{u.close()}t(a)};else if(p.env==="xpconnect"||!p.env&&typeof Components!="undefined"&&Components.classes&&Components.interfaces)r=Components.classes,i=Components.interfaces,Components.utils["import"]("resource://gre/modules/FileUtils.jsm"),t.get=function(e,t){var n,s,o={},u=new FileUtils.File(e);try{n=r["@mozilla.org/network/file-input-stream;1"].createInstance(i.nsIFileInputStream),n.init(u,1,0,!1),s=r["@mozilla.org/intl/converter-input-stream;1"].createInstance(i.nsIConverterInputStream),s.init(n,"utf-8",n.available(),i.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER),s.readString(n.available(),o),s.close(),n.close(),t(o.value)}catch(a){throw new Error((u&&u.path||"")+": "+a)}};return t}),define("text!widgets/header/header.html",[],function(){return'<div class="navbar navbar-dark navbar-static-top">\n    <a class="navbar-brand" href="#">Project name</a>\n    <ul class="nav nav-pills">\n        <li class="examples"><a href="#examples/landing">Examples</a></li>\n    </ul>\n</div>'}),define("widgets/header",["base/view","base/model","text!./header/header.html"],function(e,t,n){var r=e.extend({template:n,appIdChangeHandler:function(e){this.$(".active").removeClass("active"),this.$("."+e).addClass("active")}});return{View:r,Model:t}}),define("base/root",["base/view","base/model","widgets/header"],function(e,t,n){var r=e.extend({postRender:function(){var e=new n.View({el:this.$("#header"),model:this.model});e.render()},changeHandler:function(e){var t=this.model.toJSON();e.appId?require(["apps/"+t.appId],function(){require(["apps/"+t.appId+"/app"],function(e){e.renderPage(t.pageId,t)})}):e.pageId&&require(["apps/"+t.appId+"/app"],function(e){e.renderPage(t.pageId,t)})}});return{View:r}}),define("base/itemView",["base/view"],function(e){var t=e.extend({tagName:"li",template:"{{name}}"});return t}),define("base/collectionView",["base/view","base/itemView","base/util"],function(e,t,n){var r=function(){var e=this,r={},i=this.$el,s=this.collection;e.addItem=function(o,u){u||(u=i);var a=s.indexOf(o),f=e.getOption("itemView")||t,l=n.createView({model:o,className:"id-"+o.id,View:f});r[o.id]=l;var a=s.indexOf(o);if(a===0)l.$el.prependTo(u);else if(a>=s.length-1)l.$el.appendTo(u);else{var c=e.getModelViewAt(s.at(a-1).id);l.$el.insertAfter(c.$el)}},e.removeItem=function(t){var n=e.getModelViewAt(t.id);n.remove()},e.getModelViewAt=function(e){return r[e]}},i=e.extend({tagName:"ul",dataEvents:{add:"addHandler",remove:"removeHandler"},extensions:[r],postRender:function(){var e=this,t=this.$el,n=this.collection;t.hide(),n.each(function(n){e.addItem(n,t)}),t.show()},addHandler:function(e,t){this.addItem(t)},removeHandler:function(e,t){this.removeItem(t)}});return i}),define("base/collection",["base/app","base/model"],function(e,t){var n=Backbone.Collection.extend({model:t}),r=function(){var t=this,n={};t.addFilter=function(t){var r=e.getHash(t);n[r]=t},t.removeFilter=function(t){var r=e.getHash(t),i=n[r];if(!i)throw new Error("Filter missing");delete n[r]},t.filteredEach=function(e,t,r){var i=_.values(n);for(var s=0,o=e.length;s<o;s++){var u=e.at(s);u.checkFilters(i)&&t.call(r||u)}}},i=function(){var e=this,t=0};return n}),define("base/helpers",["base/app"],function(e){Handlebars.registerHelper("elementLabel",function(e){return e.label||e.name}),Handlebars.registerHelper("stringify",function(e){return JSON.stringify(e)}),Handlebars.registerHelper("toggleClass",function(e){if(this[e])return e}),Handlebars.registerHelper("ifEqual",function(e,t,n){if(e===t)return n.fn(this);if(n.inverse)return n.inverse(this)})}),define("base",["require","base/view","base/root","base/collectionView","base/itemView","base/model","base/collection","base/util","base/app","base/dataLoader","base/router","base/helpers"],function(e){return{View:e("base/view"),Root:e("base/root"),CollectionView:e("base/collectionView"),ItemView:e("base/itemView"),Model:e("base/model"),Collection:e("base/collection"),util:e("base/util"),app:e("base/app"),dataLoader:e("base/dataLoader"),Router:e("base/router"),helpers:e("base/helpers")}}),define("list/singleSelect",["base"],function(e){function a(){var e=this,t,n,r=e.get("items");r||(r=new s,e.set("items",r));var i=r.findWhere({selected:!0});i&&(t=i,n=i);var o=function(){e.set("selectedItem",t)};e.getSelected=function(){return t},e.prevSelected=function(){return n},e.setSelectedById=function(e){var i=r.get(e);if(!t){t=i,i.select(),o();return}if(i.id===t.id)return;n=t,t=i,n.deselect(),i.select(),o()},e.setSelected=function(e){if(!t){t=e,e.select(),o();return}if(e.id===t.id)return;n=t,t=e,n.deselect(),e.select(),o()},e.clearSelection=function(){n=t,t=null,n.deselect(),o()},e.selectFirst=function(){e.setSelected(r.first())}}var t=e.util,n=e.View.extend({template:'<div class="list-view"></div>',postRender:function(){var n=this.model.get("items"),r=t.createView({View:e.CollectionView,collection:n,parentEl:this.$(".list-view"),itemView:this.getOption("ItemView")||i})},actionHandler:function(e){this.model.setSelectedById(e)}}),r=e.Model.extend({defaults:{selected:!1},select:function(){this.set("selected",!0)},deselect:function(){this.set("selected",!1)},toggleSelect:function(){var e=this.is("selected");this.set("selected",!e)}}),i=e.View.extend({tagName:"li",className:"single-select-item",template:'<a href="#{{id}}" class="action">{{name}}</a>',changeHandler:function(){this.render(),this.$el.toggleClass("active",this.model.is("selected"))}}),s=e.Collection.extend({model:r}),o=[a],u=e.Model.extend({constructor:function(t){var n=this;e.Model.call(n,t),_.each(o,function(e){e.call(n,t)})}});return{View:n,Model:u,ItemModel:r,ItemView:i,ItemCollection:s}}),define("list/multiSelect",["base","list/singleSelect"],function(e,t){function i(){var e=this,t=[],n=e.get("items");e.getSelected=function(){return t},e.setSelectedById=function(e){var t=n.get(e);t.toggleSelect(),r()},e.setSelected=function(e){e.toggleSelect(),r()},e.selectAll=function(){n.each(function(e){e.select()}),r()},e.selectNone=function(){n.each(function(e){e.deselect()}),r()};var r=function(){t=n.where({selected:!0}),e.set("selectedCount",t.length)};r()}var n=[i],r=e.Model.extend({constructor:function(t){var r=this;e.Model.call(r,t),_.each(n,function(e){e.call(r,t)})}});return{View:t.View,Model:r,ItemView:t.ItemView,ItemCollection:t.ItemCollection}}),define("base-list",["require","list/singleSelect","list/multiSelect"],function(e){return{SingleSelect:e("list/singleSelect"),MultiSelect:e("list/multiSelect")}}),define("list",["require","list/singleSelect","list/multiSelect"],function(e){return{SingleSelect:e("list/singleSelect"),MultiSelect:e("list/multiSelect")}});