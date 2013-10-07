define(function () {

    require(['base/app'], function (d3) {

        function d3_class(ctor, properties) {
            try {
                for (var key in properties) {
                    Object.defineProperty(ctor.prototype, key, {
                        value: properties[key],
                        enumerable: false
                    });
                }
            } catch (e) {
                ctor.prototype = properties;
            }
        }

        var d3_map_prefix = "\x00", d3_map_prefixCode = d3_map_prefix.charCodeAt(0);

        function d3_identity(d) {
            return d;
        }

        d3.map = function (object) {
            var map = new d3_Map();
            if (object instanceof d3_Map) object.forEach(function (key, value) {
                map.set(key, value);
            }); else for (var key in object) map.set(key, object[key]);
            return map;
        };

        function d3_Map() {
        }

        d3_class(d3_Map, {
            has: function (key) {
                return d3_map_prefix + key in this;
            },
            get: function (key) {
                return this[d3_map_prefix + key];
            },
            set: function (key, value) {
                return this[d3_map_prefix + key] = value;
            },
            remove: function (key) {
                key = d3_map_prefix + key;
                return key in this && delete this[key];
            },
            keys: function () {
                var keys = [];
                this.forEach(function (key) {
                    keys.push(key);
                });
                return keys;
            },
            values: function () {
                var values = [];
                this.forEach(function (key, value) {
                    values.push(value);
                });
                return values;
            },
            entries: function () {
                var entries = [];
                this.forEach(function (key, value) {
                    entries.push({
                        key: key,
                        value: value
                    });
                });
                return entries;
            },
            forEach: function (f) {
                for (var key in this) {
                    if (key.charCodeAt(0) === d3_map_prefixCode) {
                        f.call(this, key.substring(1), this[key]);
                    }
                }
            }
        });

        var d3_format_decimalPoint = ".", d3_format_thousandsSeparator = ",", d3_format_grouping = [ 3, 3 ], d3_format_currencySymbol = "$";
        var d3_formatPrefixes = [ "y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y" ].map(d3_formatPrefix);
        d3.formatPrefix = function (value, precision) {
            var i = 0;
            if (value) {
                if (value < 0) value *= -1;
                if (precision) value = d3.round(value, d3_format_precision(value, precision));
                i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
                i = Math.max(-24, Math.min(24, Math.floor((i <= 0 ? i + 1 : i - 1) / 3) * 3));
            }
            return d3_formatPrefixes[8 + i / 3];
        };
        function d3_formatPrefix(d, i) {
            var k = Math.pow(10, Math.abs(8 - i) * 3);
            return {
                scale: i > 8 ? function (d) {
                    return d / k;
                } : function (d) {
                    return d * k;
                },
                symbol: d
            };
        }

        d3.round = function (x, n) {
            return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
        };
        d3.format = function (specifier) {
            var match = d3_format_re.exec(specifier), fill = match[1] || " ", align = match[2] || ">", sign = match[3] || "", symbol = match[4] || "", zfill = match[5], width = +match[6], comma = match[7], precision = match[8], type = match[9], scale = 1, suffix = "", integer = false;
            if (precision) precision = +precision.substring(1);
            if (zfill || fill === "0" && align === "=") {
                zfill = fill = "0";
                align = "=";
                if (comma) width -= Math.floor((width - 1) / 4);
            }
            switch (type) {
                case "n":
                    comma = true;
                    type = "g";
                    break;

                case "%":
                    scale = 100;
                    suffix = "%";
                    type = "f";
                    break;

                case "p":
                    scale = 100;
                    suffix = "%";
                    type = "r";
                    break;

                case "b":
                case "o":
                case "x":
                case "X":
                    if (symbol === "#") symbol = "0" + type.toLowerCase();

                case "c":
                case "d":
                    integer = true;
                    precision = 0;
                    break;

                case "s":
                    scale = -1;
                    type = "r";
                    break;
            }
            if (symbol === "#") symbol = ""; else if (symbol === "$") symbol = d3_format_currencySymbol;
            if (type == "r" && !precision) type = "g";
            if (precision != null) {
                if (type == "g") precision = Math.max(1, Math.min(21, precision)); else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
            }
            type = d3_format_types.get(type) || d3_format_typeDefault;
            var zcomma = zfill && comma;
            return function (value) {
                if (integer && value % 1) return "";
                var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign;
                if (scale < 0) {
                    var prefix = d3.formatPrefix(value, precision);
                    value = prefix.scale(value);
                    suffix = prefix.symbol;
                } else {
                    value *= scale;
                }
                value = type(value, precision);
                var i = value.lastIndexOf("."), before = i < 0 ? value : value.substring(0, i), after = i < 0 ? "" : d3_format_decimalPoint + value.substring(i + 1);
                if (!zfill && comma) before = d3_format_group(before);
                var length = symbol.length + before.length + after.length + (zcomma ? 0 : negative.length), padding = length < width ? new Array(length = width - length + 1).join(fill) : "";
                if (zcomma) before = d3_format_group(padding + before);
                negative += symbol;
                value = before + after;
                return (align === "<" ? negative + value + padding : align === ">" ? padding + negative + value : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length) : negative + (zcomma ? value : padding + value)) + suffix;
            };
        };

        var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;
        var d3_format_types = d3.map({
            b: function (x) {
                return x.toString(2);
            },
            c: function (x) {
                return String.fromCharCode(x);
            },
            o: function (x) {
                return x.toString(8);
            },
            x: function (x) {
                return x.toString(16);
            },
            X: function (x) {
                return x.toString(16).toUpperCase();
            },
            g: function (x, p) {
                return x.toPrecision(p);
            },
            e: function (x, p) {
                return x.toExponential(p);
            },
            f: function (x, p) {
                return x.toFixed(p);
            },
            r: function (x, p) {
                return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p))));
            }
        });

        function d3_format_precision(x, p) {
            return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
        }

        function d3_format_typeDefault(x) {
            return x + "";
        }

        var d3_format_group = d3_identity;
        if (d3_format_grouping) {
            var d3_format_groupingLength = d3_format_grouping.length;
            d3_format_group = function (value) {
                var i = value.length, t = [], j = 0, g = d3_format_grouping[0];
                while (i > 0 && g > 0) {
                    t.push(value.substring(i -= g, i + g));
                    g = d3_format_grouping[j = (j + 1) % d3_format_groupingLength];
                }
                return t.reverse().join(d3_format_thousandsSeparator);
            };
        }

        d3.addFormatter('currency', d3.format('$0,000'))
        d3.addFormatter('integer', d3.format('0,000'))
    });



})