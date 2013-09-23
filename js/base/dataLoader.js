define(['require'],function(require){

    var requestIndex = {};
    var dataLoader = {};

    dataLoader.define = function(id, config){
        requestIndex[id]=config
    }

    var getConfig = dataLoader.getConfig=function(id){
        if(requestIndex[id]){
            return _.clone(requestIndex[id]);
        }else{
            throw Error('Undefined request by Id: '+id);
        }
    }

    dataLoader.getRequest = function(id,dataObj){
        var requestSettings = getConfig(id, dataObj);
        var settings = $.extend(true, {}, requestSettings);

        if (requestSettings.type.toLowerCase() === "post") {
            settings.data = JSON.stringify(dataObj);
            return $.ajax(settings);
        } else if (requestSettings.type.toLowerCase() === "form_post") {
            return $.post(settings.url, dataObj);
        } else {
            if (!_.isEmpty(dataObj)) {
                settings.url += "?" + $.param(dataObj);
            }
            return $.ajax(settings);
        }
    }

    return dataLoader;

});