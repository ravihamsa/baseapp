define(["base/app"],function(e){Handlebars.registerHelper("elementLabel",function(e){return e.label||e.name});var t=["Jan","Feb","Mar","Apr","May","June","Jul","Aug","Sep","Oct","Nov","Dec"];Handlebars.registerHelper("string",function(t){return e.getString(t)}),Handlebars.registerHelper("monthName",function(e){return t[e]}),Handlebars.registerHelper("stringify",function(e){return JSON.stringify(e)}),Handlebars.registerHelper("toggleClass",function(e){if(this[e])return e}),Handlebars.registerHelper("ifEqual",function(e,t,n){if(e===t)return n.fn(this);if(n.inverse)return n.inverse(this)})});