define(function() {

    var paramsToObject = function(params) {
        if (!params) {
            return {};
        }
        var paramsArray = _.map(params.split(';'), function(str) {return str.split('=');});
        var obj = {};
        _.each(paramsArray, function(arr) {
            obj[arr[0]] = arr[1];
        });
        return obj;
    };
    var objectToParams = function(obj) {
        var str = [];

        _.each(obj, function(value, index) {
            str.push(index + '=' + value);
        });

        return str.join(';');
    };


    var _each = function(arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function(arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function(x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error('Callback was already called.');
            called = true;
            fn.apply(null, arguments);
        }
    }

    var nextTick;

    if (typeof setImmediate === 'function') {
        nextTick = function(fn) {
            // not a direct alias for IE10 compatibility
            setImmediate(fn);
        };
    }
    else {
        nextTick = function(fn) {
            setTimeout(fn, 0);
        };
    }


    return {
        paramsToObject: paramsToObject,
        objectToParams: objectToParams,
        createView: function(config) {

            var view;
            var viewTye = 'model';

            if (config.collection || config.Collection) {
                viewTye = 'collection';
            }


            if (viewTye === 'model') {
                if (config.Model) {
                    config.model = new config.Model(config.attributes);
                }
            } else {
                if (config.Collection) {
                    config.collection = new config.Collection(config.items);
                }
            }



            var filteredConfig = _.omit(config, 'Collection', 'Model', 'parentEl', 'skipRender');
            view = new config.View(filteredConfig);

            if (view) {
                //skip render if skipRender is true
                if (!config['skipRender']) {
                    view.render();
                }

                //if parentEl
                if (config.parentEl) {
                    if (config['replaceHTML']) {
                        config.parentEl.empty();
                    }
                    view.$el.appendTo(config.parentEl);
                }
            }

            return view;
        },
        aSyncQueue: function(worker, concurrency) {
            if (concurrency === undefined) {
                concurrency = 1;
            }
            function _insert(q, data, pos, callback) {
                if (data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    var item = {
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    };

                    if (pos) {
                        q.tasks.unshift(item);
                    } else {
                        q.tasks.push(item);
                    }

                    if (q.saturated && q.tasks.length === concurrency) {
                        q.saturated();
                    }
                    nextTick(q.process);
                });
            }

            var workers = 0;
            var q = {
                tasks: [],
                concurrency: concurrency,
                saturated: null,
                empty: null,
                drain: null,
                added: null,
                push: function(data, callback) {
                    _insert(q, data, false, callback);
                    if (q.added && q.tasks.length !== 0) {
                        q.added();
                    }
                },
                unshift: function(data, callback) {
                    _insert(q, data, true, callback);
                },
                process: function() {
                    if (workers < q.concurrency && q.tasks.length) {
                        var task = q.tasks.shift();
                        if (q.empty && q.tasks.length === 0) {
                            q.empty();
                        }
                        workers += 1;
                        var next = function() {
                            workers -= 1;
                            if (task.callback) {
                                task.callback.apply(task, arguments);
                            }
                            if (q.drain && q.tasks.length + workers === 0) {
                                q.drain();
                            }
                            q.process();
                        };
                        var cb = only_once(next);
                        worker(task.data, cb);
                    }
                },
                length: function() {
                    return q.tasks.length;
                },
                running: function() {
                    return workers;
                }
            };
            return q;
        }
    };

});
