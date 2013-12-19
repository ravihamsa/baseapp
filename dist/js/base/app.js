define(["require","base/router","base/dataLoader","base/util","base/formatter"],function(e,t,n,r){function s(e){var t,n=305419896,r=1,i=e.length+1;for(t=r;t<i;t++)n+=e.charCodeAt(t-1)*t;return n}var i=window.hex_md5,o=function(e){return s(e.toString())},u=function(e){return l[e]},a=function(e,t){if(c[t]&&c[t][e])return c[t][e]},f=function(e){c[e]&&(console.log("clearing cache for id",e),delete c[e])},l={},c={},h={root:"/",baseUrl:"js/",defaultApp:"default",appBody:"#app-body",compileTemplate:function(e){return Handlebars.compile(e)},router:new t,getTemplateDef:function(t){var n=this;t=t||"";var r=o(t),i=u(r);return i||(i=$.Deferred(),n.cacheTemplate(i,r),typeof t=="function"?i.resolve(t):typeof t=="string"&&(/html$/.test(t)?e(["text!"+t],function(e){i.resolve(n.compileTemplate(e))}):t.indexOf("#")===0?i.resolve(n.compileTemplate($(t).html())):i.resolve(n.compileTemplate(t)))),i},cacheTemplate:function(e,t){l[t]=e},cacheData:function(e,t,n){c[n]||(c[n]=[]),c[n][t]=e},log:function(){console.log.apply(console,arguments)},getString:function(e){return e},escapeString:function(e){return Handlebars.Utils.escapeExpression(e)},parseSuccessResponse:function(e){return e},parseFailureResponse:function(e){return e},appModel:new Backbone.Model,getRequestDef:function(e){var t=this,r=n.getConfig(e.id);r.paramsParser=r.paramsParser||_.identity;var i=t.parseSuccessResponse,s=t.parseFailureResponse;r.responseParser&&(i=s=r.responseParser),r.cacheDependencies&&_.each(r.cacheDependencies,function(e){f(e)}),e.params=r.paramsParser(e.params);var u=o(JSON.stringify(_.pick(e,"id","params"))),l=a(u,e.id);if(!l){l=$.Deferred();var c=n.getRequest(e.id,e.params);c.done(function(n){var s=i(n);s.errors&&s.errors.length>0?l.resolve(s.errors):(r.cache==="session"&&t.cacheData(l,u,e.id),l.resolve(s))}),c.fail(function(e){l.resolve({errors:[{errorCode:"network issue",message:"Network failure try again later"}]})})}return l},beautifyId:function(e){return e=e.replace(/_([a-z])/g,function(e){return e.toUpperCase()}),e=e.replace(/_/g,""),e=e.replace(/([A-Z])/g,function(e){return" "+e}),e.replace(/(^.)/g,function(e){return e.toUpperCase()})},getDataIndex:function(){return c},getTemplateIndex:function(){return l},getFormatted:function(e,t,n){if(typeof t=="function")return t.apply(null,arguments);var r=p[t];return r?r(e,n):e},addFormatter:function(e,t){if(p[e])throw new Error("formatter already exist");this.setFormatter.apply(null,arguments)},setFormatter:function(e,t){p[e]=t},getUrl:function(e,t,n){return"#"+e+"/"+t+"/"+r.objectToParams(n)},navigateToPage:function(e,t,n){h.router.navigate(h.getUrl.apply(h,arguments),{trigger:!0})},getHash:o},p={};return h});