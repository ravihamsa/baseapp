({
    baseUrl: '../js',
    paths: {
        jquery: "empty:",
        underscore: "empty:",
        backbone: "empty:",
        text:'plugins/requirejs-text-plugin',
        libs:'../libs'

    },
    out:'../dist/widget.js',
    name:'widgets',
    exclude:['base', 'list'],
    optimize: 'none'
})
