define(['base/model'],function(BaseModel) {

    var ConfigurableModel = BaseModel.extend({
         constructor:function(attributes, options){
             var _this = this;

             BaseModel.call(this, attributes, options);

             _.each([configureMixin], function(func){
                func(_this);
             })

             var configModel = this.getConfigModel();
             this.setConfigs(_.extend({}, options.config));
             this.listenTo(this.getConfigModel(),'all',function(sourceEventName){
                 this.trigger.apply(this, ['config_'+sourceEventName].concat(_.rest(arguments)));
             })
         }
    });


    var configureMixin = function(context){
        var config = new BaseModel();

        var methods =  {
            setConfig:function(key, value){
                config.set(key, value);
            },
            getConfig:function(key){
                return config.get(key);
            },
            setConfigs:function(obj){
                config.set(obj)
            },
            getConfigs:function(useDeep){
                return config.toJSON(useDeep);
            },
            getConfigModel:function(){
                return config;
            }
        }

        _.extend(context, methods);



    }




    return ConfigurableModel;
});
