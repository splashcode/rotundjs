;(function() {
    var xmlns = 'http://www.w3.org/2000/svg';  
    
    
    // object contains helper function
    var helper = {
        
        // for each works with array and object
        each : function(obj, callback, context) {
            if (helper.isArray(obj)) {
                if (Array.prototype.forEach ) {
                    obj.forEach(callback, context);
                } else {
                    for (var i = 0, length = obj.length; i < length; i++) {
                        callback.call(context, obj[i], i);
                    }
                }
            } else if (this.isObject(obj)) {
                for (var o in obj) {
                    callback.call(context, obj[o], o);
                }
            }
        },
        
        // extend an object with another or more
        extend : function(ref) {
            helper.each(Array.prototype.slice.call(arguments).slice(1), function(obj) {
                helper.each(obj, function(value, property) {
                    if (helper.isObject(value)) {
                        // recursive extend
                        ref[property] = helper.extend(ref[property], value);
                    } else {
                        ref[property] = value;
                    }
                });
            });
            
            return ref;
        },
        
        // filter an array
        filter : function(array, fnFilter) {
            var newArray = [];
            
            helper.each(array, function(obj) {
                if (fnFilter(obj)) {
                    newArray.push(obj);
                }
            });
            
            return newArray;
        },
        
         // param is an array ?
        isArray : Array.isArray || function(array) {
            return (array && (Object.prototype.toString.call(array) === '[object Array]'));
        },

        // param is a function ?
        isFunction : function(fn) {
            return (fn && (typeof fn === 'function'));
        },

        // param is an object ?
        isObject : function(obj) {
            return (obj && (Object.prototype.toString.call(obj) === '[object Object]'));
        },

        // param is a string ?
        isString : function(string) {
            return typeof string === 'string';
        },
        
        // take a template and replace each variable by their value
        compileTemplate : function(template, args) {
            helper.each(args, function(value, arg) {
                template = template.replace('{{' + arg + '}}', value, 'gi');
            });
            
            return template;
        }
    };
    
    
    /**
     * Collection is an array with some usefull function like ; each, filter, sum ...
     */
    var Collection = function() {
        this.list = [];
    };
    
    Collection.prototype = {
        
        // add an element to the collection
        add : function(obj) {
            this.list.push(obj);
        },

        // browse the collection
        each : function(callback, context) {
            helper.each(this.list, callback, context);
        },

        // return the collection filtered
        filter : function(fnFilter) {
            return helper.filter(this.list, fnFilter);
        },

        // calculate the sum for a property of each element
        sum : function(property) {
            var sum = 0;

            this.each(function(obj) {
                sum += obj[property];
            });

            return sum;
        },

        // return the collection length 
        length : function() {
            return this.list.length;
        }
    };    
    
    
    /**
     * publish / suscribe system
     */
    var PubSub = function() {
        this.subscribers = [];
    };
    
    PubSub.prototype = {
        
        // trigger un event
        publish : function(topic, args) {
            helper.each(this.subscribers[topic], function(subscriber) {
                subscriber(args);
            });
        },

        // suscribe to an event
        subscribe : function(topic, callback) {   
            if (this.subscribers[topic] === undefined) {
                this.subscribers[topic] = [];
            }

            this.subscribers[topic].push(callback);
        }
    };
    
    
    /**
     * chart object
     */
    var Rotund = function(options) { 
        
        /**
         * def of the collection of serie
         */
        var SerieCollection = function() {
            Collection.call(this);
        };

        SerieCollection.prototype = new Collection();
        SerieCollection.prototype.constructor = SerieCollection;


        /**
         * def of a serie (collection of arc)
         */
        var Serie = function(name, id) {
            Collection.call(this);
            
            this.id = id;
            this.name = name || 'A serie';
            this.percentage = null;
            this.prettyPercentage = null;
            this.list = [];
        };

        Serie.prototype = helper.extend(new Collection(), {
            constructor : Serie,
            
            // get the radius for the skeleton circle
            getRadius : function() {
                return (((options.width < options.height)? options.width : options.height) / 2) - (((options.seriesOptions.size + options.seriesOptions.margin) * (this.id + 1)) - (options.seriesOptions.size / 2));
            }
        });


        /**
         * def of an arc
         */
        var Arc = function(name, value, color) {
            if (name === null || value === null) {
                throw new Error('Name and value must be define for every point.');
            }

            this.name = name;
            this.value = value;
            this.percentage = null;
            this.prettyPercentage = null;
            this.color = color || this.generateColor();
        };

        Arc.prototype = {
            
            // generate hsl color
            generateColor : function() {
                // is combinaison of name and color is already defined ?
                var color = listColorUsed[this.name];

                if (color === undefined) {
                    
                    // 16 colors to cover the spectre's hues
                    var h = Math.floor((colorId * 360) / 16),
                        // change of light every 16 colors used
                        l = 65 - (10 * (Math.floor(colorId / 16))); 

                    colorId++;     

                    color = 'hsl(' + h + ', 90%, ' + l + '%)';

                    listColorUsed[this.name] = color;
                }

                return color;
            }
        };



        /**
         * def of a form (any svg form : rect, pathName, ...)
         */
        var Form = function(form) {
            this.form = form;
            this.elt = document.createElementNS(xmlns, form);
            this.style = {};
        }; 

        Form.prototype = {
            
            // define the style of the form
            setStyle : function(options) {
                this.style = helper.extend(this.style, options);

                this.elt.setAttribute('style', this._styleToString());
            },

            // translate object style to string
            _styleToString : function() {
                var string = '';

                helper.each(this.style, function(value, property) {
                    if (value !== null) {
                        string += property + ':' + value + ';';
                    }
                });

                return string;
            }
        };


        /**
         * drawer paint form in his canvas (svg markup)
         */
        var Drawer = function(width, height) {
            this.container = document.createElementNS(xmlns, 'svg');

            this.container.setAttribute('xmlns', xmlns);

            this.container.setAttribute('width', width);
            this.container.setAttribute('height', height);
            
            this.container.style.position = 'relative';

            this.center = {
                x : width / 2,
                y : height / 2
            };
        };

        Drawer.prototype = {
            
            // paint a form
            paint : function(options) {
                var form = new Form(options.markup, options.type);
                form.setStyle(options.style);

                helper.each(options.attributes, function(value, attribute) {
                    form.elt.setAttribute(attribute, value);
                });

                if (helper.isFunction(options.mouseover)) {
                    form.elt.addEventListener('mouseover', options.mouseover, false);
                }

                if (helper.isFunction(options.mouseout)) {
                    form.elt.addEventListener('mouseout', options.mouseout, false);
                }

                this.container.appendChild(form.elt);
                
                return form;
            }
        };
        
        // static function
        // test if browser support svg
        Drawer.isSvgSupported = function() {
            return (document.createElementNS && document.createElementNS(xmlns, 'svg'))? true : false;
        };
        
        
        /**
         * tooltip
         */
        var Tooltip = function() {
            this.bkgCircle = null;
            this.text = document.createElement('div');
            this.radius = null;
            
            this.text.setAttribute('class', 'rotundTooltipText');
            this.text.style.font = options.tooltip.font;
            this.text.style.color = options.tooltip.color;
            container.appendChild(this.text);
            
            var self = this;
            
            pubSub.subscribe('tooltipShowMyText', function(text) {
                self.setText(text);
            });
        };
        
        Tooltip.prototype = {
            
            // init
            init : function(bkgCircle, isVisible) {
                this.bkgCircle = bkgCircle;
                
                this.setText(options.tooltip.defaultText);
                
                if (!isVisible) {
                    this.bkgCircle.setStyle({display : 'none'});
                    this.text.style.display = 'none';
                }
            },
            
            // get the radius for the circle
            getRadius : function() {
                if (this.radius === null) {
                    this.radius = (((options.width < options.height)? options.width : options.height) / 2) - (((options.seriesOptions.size + options.seriesOptions.margin) * serieCollection.length()) + options.seriesOptions.margin);
                }
                
                return this.radius;
            },
            
            // set the text
            setText : function(text) {                
                this.text.innerHTML = text;
                
                // update text position
                this.text.style.maxWidth = this.text.style.maxHeight = this.getRadius() * 2 + 'px';
                
                this.text.style.marginTop = '-' + (this.text.offsetHeight / 2) + 'px';
                this.text.style.marginLeft = '-' + (this.text.offsetWidth / 2) + 'px';
            }
        };
        
        
        
        
        // defaults options
        var defaults = {
            container : null,
            width : 300,
            height : 300,
            tooltip : {
                visible : true,
                template : '<b>{{name}}</b><hr/>{{value}}',
                defaultText : null,
                backgroundColor : 'none',
                font : "1em/1.4em 'Trebuchet MS', 'Lucida San', 'Lucida Grande', 'Lucida Sans Unicode', sans-sherif",
                color : '#444'
            }, 
            series : [[]],
            seriesOptions : {
                colors : [],
                size : 20,
                margin : 5
            }
        };
        
        // merge options with defaults
        options = helper.extend(defaults, options, 10);    
        options.width = parseInt(options.width, 10);
        options.height = parseInt(options.height, 10);
        options.seriesOptions.size = parseInt(options.seriesOptions.size, 10);
        options.seriesOptions.margin = parseInt(options.seriesOptions.margin, 10);
        
        // select and save the chart container
        var container = document.getElementById(options.container);
        container.style.position = 'relative';
        container.style.width = options.width + 'px';
        container.style.height = options.height + 'px';
            
        if (Drawer.isSvgSupported()) {
            
            // TODO : please use inline css
            container.innerHTML = '<style>'
                                +   '#' + options.container + ' .rotundArc{'
                                +       '-moz-transition : opacity 0.4s ease;'
                                +       '-webkit-transition : opacity 0.4s ease;'
                                +       '-o-transition : opacity 0.4s ease;'
                                +       '-ms-transition : opacity 0.4s ease;'
                                +       'transition : opacity 0.4s ease;'
                                +   '}'
                                +   '#' + options.container + ' .rotundTooltipText{'
                                +       'position : absolute;'
                                +       'top : 50%;'
                                +       'left : 50%;'
                                +       'text-align : center;'
                                +       'z-index : 2;'
                                +   '}'
                                + '</style>';

            

            var listColorUsed = {};

            var colorId = 0;


            var pubSub = new PubSub();

            // populate collections
            var serieCollection = new SerieCollection();

            var serieCollectionSum = 0;

            helper.each(options.series, function(dataSerie, idSerie) {
                var serie = new Serie(dataSerie.name, idSerie);

                helper.each(dataSerie.data, function(dataArc) {
                    var color = dataArc.color;
                    
                    if (color == null && options.seriesOptions.colors.length > 0) {
                        color = options.seriesOptions.colors[0];
                        options.seriesOptions.colors.shift();
                    }
                    
                    var arc = new Arc(dataArc.name, dataArc.value, color);

                    serieCollectionSum += arc.value;

                    serie.add(arc);
                });

                serieCollection.add(serie);
            });


            serieCollection.each(function(serie) {
                var serieSum = serie.sum('value');

                serie.percentage = Math.min((serieSum / serieCollectionSum) * 100, 100);
                serie.prettyPercentage = Math.round(serie.percentage);

                serie.each(function(arc) {
                    arc.percentage = Math.min((arc.value / serieCollectionSum) * 100, 100);
                    arc.prettyPercentage = Math.round(arc.percentage);
                });
            });

        
            // init of drawer
            var drawer = new Drawer(options.width, options.height);


            // draw the graph
            serieCollection.each(function(serie) {
                var radius = serie.getRadius();

                var angleStart = (-90 / 180) * Math.PI;

                serie.each(function(arc) {
                    arc.textTooltip = helper.compileTemplate(options.tooltip.template, {
                        serie : serie.name,
                        name : arc.name,
                        value : arc.value,
                        percentage : arc.prettyPercentage
                    });

                    var angle = (((360 * arc.percentage) / 100) / 180) * Math.PI;

                    var pathOption = {
                        sx : drawer.center.x + (Math.cos(angleStart) * radius),
                        sy : drawer.center.y + (Math.sin(angleStart) * radius),
                        ex : drawer.center.x + (Math.cos(angleStart + angle) * radius),
                        ey : drawer.center.y + (Math.sin(angleStart + angle) * radius)
                    };

                    arc.form = drawer.paint({
                        markup : 'path',
                        style : {
                            fill : 'none',
                            stroke : arc.color,
                            'stroke-width' : options.seriesOptions.size                        
                        },
                        attributes : {
                            d : 'M' + pathOption.sx + ',' + pathOption.sy + ' A' + radius + ',' + radius + ' 0 ' + ((arc.percentage > 50)? 1 : 0) + ',1 ' + pathOption.ex + ',' + pathOption.ey,
                            'class' : 'rotundArc'
                        },
                        mouseover : function() {
                            arc.overMe = true;

                            pubSub.publish('mouseoverForArc');
                            pubSub.publish('tooltipShowMyText', arc.textTooltip);
                        },
                        mouseout : function() {
                            arc.overMe = false;
                            setTimeout(function() {
                                if (serieCollection.filter(function(cSerie) {
                                    return cSerie.filter(function(cArc) {
                                        return cArc.overMe;
                                    }).length > 0;
                                }).length === 0) {                                
                                    pubSub.publish('mouseoutForArc');
                                    pubSub.publish('tooltipShowMyText', options.tooltip.defaultText);
                                }
                            }, 250);
                        }
                    });

                    pubSub.subscribe('mouseoverForArc', function() {
                        if (!arc.overMe) {
                            arc.form.setStyle({
                                opacity : 0.5
                            });
                        } else {
                            arc.form.setStyle({
                                opacity : 1
                            });
                        }
                    });

                    pubSub.subscribe('mouseoutForArc', function() {
                        if (!arc.overMe) {
                            arc.form.setStyle({
                                opacity : 1
                            });
                        }
                    });

                    angleStart += angle;
                });
            });

            var tooltip = new Tooltip();

            tooltip.init(drawer.paint({
                markup : 'circle',
                style : {
                    fill : options.tooltip.backgroundColor
                },
                attributes : {
                    cx : drawer.center.x,
                    cy : drawer.center.y,
                    r : tooltip.getRadius()
                }
            }), options.tooltip.visible);
            
            container.appendChild(drawer.container);
        } else {
            container.innerHTML = "Your browser doesn't support SVG";
        }
        
        

        // public function
        return {            
            // return a JSON based data
            getSeries : function() {
                var series = [];
                
                helper.each(serieCollection.list, function(currentSerie) {
                    var serie = {
                        name : currentSerie.name,
                        percentage : currentSerie.percentage,
                        prettyPercentage : currentSerie.prettyPercentage,
                        list : []
                    };
                    
                    helper.each(currentSerie.list, function(currentArc) {
                        serie.list.push({
                            name : currentArc.name,
                            color : currentArc.color,
                            value : currentArc.value,
                            percentage : currentArc.percentage,
                            prettyPercentage : currentArc.prettyPercentage
                        });
                    });
                    
                    series.push(serie);
                });
                
                return series;
            }
        };
    };   
    
    window.Rotund = Rotund;
}());