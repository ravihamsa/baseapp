define(["base/app","base/model","base/util"],function(e,t,n){var r=Backbone.View.extend({constructor:function(e){var t=this;Backbone.View.call(t,e),_.each(d,function(n){n.call(t,e)}),_.each(t.extensions,function(n){n.call(t,e)});var n=t.getOption("addOns");n&&n.length>0&&_.each(n,function(n){n.call(t,e)})},extensions:[],render:function(){var n=this;n.beforeRender();var r=function(){e.getTemplateDef(n.getTemplate()).done(function(e){n.model||(n.model=new t),n.renderTemplate(e),u.call(n);if(n.setState){var r=_.keys(n.getOption("states"))[0];n.setState(n.getState()||n.getOption("state")||r)}n.postRender()})},i=function(){r()},s=n.loadMeta();return s.done(i),n},postRender:function(){},beforeRender:function(){},renderTemplate:function(e){var t=this.getOption("useDeepJSON");this.$el.html(e(this.model.toJSON(t)))},getOption:function(e){return this.options[e]||this[e]},loadingHandler:function(e){this.$el.toggleClass("loading",e)},metaLoadErrorHandler:function(){this.$el.html("Error Loading Meta Data")},addMethod:function(e,t){this[e]||(this[e]=t)}}),i=function(){var e=this,t=e.model||e.collection,n,e;n=e.dataEvents,_.each(n,function(n,r){var i,s,o;o=/\s+/,s=n.split(o),i=r.split(o),_.each(s,function(n){_.each(i,function(r){t.on(r,function(){if(!e[n])throw n+" Not Defined";var t=Array.prototype.slice.call(arguments);t.unshift(r),e[n].apply(e,t)})})})})},s=function(){var e=this,t=e.getOption("states");if(!t)return;var r,i,s=function(){i&&(i.off(),i.remove())},o=function(t){i=n.createView({View:t,model:e.model,parentEl:e.$(".state-view")})};e.setState=function(e){if(typeof e!="string")throw new Error("state should be a string");if(r===e)return;r=e;var n=t[e];if(!n)throw new Error("Invalid State");s(),o(n)},e.getState=function(){return r}},o=function(){(function(e){var t=e.getOption("template")||e.template;e.setTemplate=function(n){t=n,e.render()},e.getTemplate=function(){return t}})(this)},u=function(){var e=this,t={},r=e.getOption("views");if(!r)return;_.each(r,function(r,i){r.parentEl&&typeof r.parentEl=="string"&&(r.parentEl=e.$(r.parentEl)),t[i]=n.createView(r)}),e.getSubView=function(e){var n=t[e];if(n)return n;throw new Error("No View Defined for id :"+e)},e.getSubModel=function(t){return e.getSubView(t).model},e.getSubAttribute=function(t,n){return e.getSubModel(t).get(n)}},a=function(){var e=this,t=e.model;t&&(t.on("change",_.bind(f,e)),l.call(e,t))},f=function(e){var t=e.changedAttributes();_.each(t,function(e,t){var n=this[t+"ChangeHandler"];n&&typeof n=="function"&&n.call(this,e)},this);var n=this.changeHandler;n&&typeof n=="function"&&n.call(this,t)},l=function(e){var t=e.toJSON();_.each(t,function(e,t){var n=this[t+"ChangeHandler"];n&&typeof n=="function"&&n.call(this,e)},this);var n=this.changeHandler;n&&typeof n=="function"&&n.call(this,t)},c=function(){var e=this,t=function(e){e.actionHandled&&(e.stopPropagation(),$("body").trigger("click"))};e.actionHandler&&e.$el.on("click",".action",function(n){n.preventDefault();var r=$(n.currentTarget),i=r.attr("href").substr(1);e.actionHandler.call(e,i,n),t(n)}),e.$el.on("click",".dummy",function(e){e.preventDefault()})},h=function(){var e=this,t=this.getOption("renderEvents")||this.renderEvents;t&&t.length>0&&e.model.on(t.join(" "),function(){e.render.call(e)})},p=function(){var t=this,n=t.getOption("requests")||t.requests,r=0,i=function(){r++,t.loadingHandler.call(t,!0)},s=function(){r--,r===0&&t.loadingHandler.call(t,!1)};t.addRequest=function(t,n){var r=t;_.isArray(r)||(r=[r]);var o=_.map(r,function(t){var n=e.getRequestDef(t);return n.always(s),t.callback&&n.always(t.callback),i(),n}),u=$.when.apply(null,o);return n&&u.then(n),u},t.loadMeta=function(){if(!t.metaDef){var e=n?t.addRequest(n,function(){var e=t.getOption("requestsParser");e&&e.apply(t,arguments)}):$.when({});t.metaDef=e}return t.metaDef}},d=[i,p,o,a,c,h,s];return r});