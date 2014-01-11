define("list/singleSelect",["base"],function(e){function s(e){var t,n,i=e.get("items");if(!i){var s=e.getOption("ItemCollection")||r;i=new s,e.set("items",i)}var o=i.findWhere({selected:!0});o&&(t=o,n=o);var u=function(){e.set("selectedItem",t),e.trigger("selectionChange",t,n)};e.getSelected=function(){return t},e.getSelectedId=function(){return t.id},e.getSelectedIndex=function(){return t!==undefined?i.indexOf(t):-1},e.prevSelected=function(){return n},e.setSelectedById=function(e){var r=i.get(e);if(!t){t=r,r.select(),u();return}if(r.id===t.id)return;n=t,t=r,n.deselect(),r.select(),u()},e.setSelected=function(e){if(!e){u();return}if(!t){t=e,e.select(),u();return}if(e.id===t.id)return;n=t,t=e,n.deselect(),e.select(),u()},e.clearSelection=function(){n=t,t=null,n&&n.deselect(),u()},e.selectFirst=function(){e.setSelected(i.first())},e.selectAt=function(t){i.at(t)?e.setSelected(i.at(t)):e.selectFirst()}}var t=e.Model.extend({defaults:{selected:!1},select:function(){this.set("selected",!0)},deselect:function(){this.set("selected",!1)},toggleSelect:function(){var e=this.is("selected");this.set("selected",!e)}}),n=e.View.extend({tagName:"li",className:"single-select-item",template:'<a href="#{{id}}" class="action">{{name}}</a>',changeHandler:function(){this.render(),this.$el.toggleClass("active",this.model.is("selected"))}}),r=e.Collection.extend({model:t}),i=e.View.extend({template:'<div class="list-view"></div>',views:{listView:function(){var t=this,r=this.model.get("items");return{View:e.CollectionView,collection:r,parentEl:".list-view",ItemView:t.getOption("ItemView")||n}}},actionHandler:function(e,t){if(e==="select"){var n=$(t.target).data("id");this.model.setSelectedById(n)}}}),o=[s],u=e.Model.extend({constructor:function(t){var n=this;e.Model.call(n,t),_.each(o,function(e){e(n,{})})}});return{View:i,Model:u,ItemModel:t,ItemView:n,ItemCollection:r}}),define("list/multiSelect",["base","list/singleSelect"],function(e,t){function i(e,t){t.selected=[],t.coll=e.get("items"),t.coll||(t.coll=new ItemCollection,e.set("items",t.coll)),e.getSelected=function(){return t.selected},e.setSelectedById=function(n){var r=t.coll.get(n);r.toggleSelect(),e.updateSelected()},e.setSelected=function(e){e.toggleSelect(),updateSelected()},e.selectAll=function(){t.coll.each(function(e){e.select()}),updateSelected()},e.selectNone=function(){t.coll.each(function(e){e.deselect()}),e.updateSelected()},e.updateSelected=function(){t.selected=t.coll.where({selected:!0}),e.set("selectedCount",t.selected.length)},e.updateSelected()}var n=[i],r=e.Model.extend({constructor:function(t){var r=this;e.Model.call(r,t),_.each(n,function(e){e(r,{})})}});return{View:t.View,Model:r,ItemView:t.ItemView,ItemCollection:t.ItemCollection}}),define("list",["require","list/singleSelect","list/multiSelect"],function(e){return{SingleSelect:e("list/singleSelect"),MultiSelect:e("list/multiSelect")}});