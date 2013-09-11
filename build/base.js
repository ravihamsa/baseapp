({
    baseUrl: '../js',
    paths: {
        jquery: "empty:",
        underscore: "empty:",
        backbone: "empty:",
        text:'plugins/requirejs-text-plugin',
        libs:'../libs'

    },
    out:'../dist/base.js',
    name:'base',
    include:['text'],
    optimize: 'none'
})
