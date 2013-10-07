define(function(require) {
    return {
        View: require('base/view'),
        Root: require('base/root'),
        CollectionView: require('base/collectionView'),
        ItemView: require('base/itemView'),
        Model: require('base/model'),
        ConfigurableModel:require('base/configurableModel'),
        Collection: require('base/collection'),
        util: require('base/util'),
        app: require('base/app'),
        dataLoader:require('base/dataLoader'),
        Router: require('base/router'),
        helpers: require('base/helpers'),
        formatter:require('base/formatter')
    };

});
