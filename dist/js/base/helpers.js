define(["base/app"],function(e){Handlebars.registerHelper("elementLabel",function(e){return e.label||e.name}),Handlebars.registerHelper("string",function(t){return e.getString(t)}),Handlebars.registerHelper("stringify",function(e){return JSON.stringify(e)}),Handlebars.registerHelper("toggleClass",function(e){if(this[e])return e}),Handlebars.registerHelper("ifEqual",function(e,t,n){if(e===t)return n.fn(this);if(n.inverse)return n.inverse(this)})});