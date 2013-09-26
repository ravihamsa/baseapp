({
    appDir: '../',
    baseUrl: './js',
    paths: {
        jquery: "empty:",
        underscore: "empty:",
        backbone: "empty:",
        text:'plugins/requirejs-text-plugin',
        libs:'../libs'

    },
    dir: '../dist',
    //optimize: 'none',
    fileExclusionRegExp: /(build|idea|libs|dist|less|bower|README|nbproject|.gitignore|.git)/,
    modules: [
        {
            name: 'base',
            include: ['jquery',
                'backbone',
                'underscore',
                'text'
            ]
        },
        {
            name: 'list',
            exclude:['base']
        },
        {
            name: 'widgets',
            exclude:['base', 'list']
        },
        {
            name: 'base-list',
            include:['list']
        },
        {
            name: 'base-list-widgets',
            include:['base', 'list']
        }


    ]
})
