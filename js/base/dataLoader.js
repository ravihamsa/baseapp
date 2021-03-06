define(['require'], function(require) {

    var requestIndex = {};
    var dataLoader = {};
    var requestDefaults = {
        type: 'get',
        params: {},
        url: '',
        parser: _.identity,
        cache: 'session'
    };

    var serviceRoot = '';

    dataLoader.define = function(id, config) {
        var requestConfig = _.extend({}, requestDefaults, config);
        requestIndex[id] = requestConfig;
    };

    var getConfig = dataLoader.getConfig = function(id) {
        if (requestIndex[id]) {
            return _.clone(requestIndex[id]);
        } else {
            throw Error('Undefined request by Id: ' + id);
        }
    };

    dataLoader.getRequest = function(id, dataObj) {
        var requestSettings = getConfig(id, dataObj);
        var settings = $.extend(true, {}, requestSettings);

        settings.url = serviceRoot + settings.url;

        if (settings.paramParser) {
            dataObj = settings.paramParser.call(null, dataObj);
        }

        if (settings.mockData) {
            var delay = settings.mockDelay || 1000;
            var def = $.Deferred();
            setTimeout(function() {
                console.warn('request '+settings.id + ' is being resolved with mock data');
                def.resolve(settings.mockData);
            }, delay);

            return def;
        }

        if (requestSettings.type.toLowerCase() === 'post') {
            settings.data = JSON.stringify(dataObj);
            return $.ajax(settings);
        } else if (requestSettings.type.toLowerCase() === 'form_post') {
            return $.post(settings.url, dataObj);
        } else {
            if (!_.isEmpty(dataObj)) {
                settings.url += '?' + $.param(dataObj);
            }
            return $.ajax(settings);
        }
    };

    dataLoader.setServiceRoot = function(root) {
        serviceRoot = root;
    };

    return dataLoader;

});
