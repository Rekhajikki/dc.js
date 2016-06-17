dc.dependencywheelChart = function(parent, chartGroup) {

    var _chart = dc.baseMixin({});
    _chart.WHEEL_NODE_CLASS = 'node';
    var svg, cluster, bundle, line, link, node;
    var diameter = 700,
        radius = diameter / 2,
        innerRadius = radius - 200;
    _chart._doRedraw = function() {
        drawChart();
        highlightFilter();
        return _chart;
    };
    _chart._doRender = function() {
        drawChart();
        highlightFilter();
        return _chart;
    };

    function drawChart() {
        createElements();
        var chartData = _chart.data();
        var nodesDetails = packageHierarchy(chartData)
        var nodes = cluster.nodes(nodesDetails),
            links = packageImports(nodes);
        var unique_links = links.reduce(function(p, c) {
            var index = p.map(function(d, i) {
                if (d.source === c.target && d.target ===
                    c.source) return i;
            }).shift();
            if (!isNaN(index)) p[index].both = true;
            else p.push(c);
            return p;
        }, []);

        link = link
            .data(bundle(unique_links))
            .enter().append("path")
            .each(function(d) {
                d.source = d[0],
                    d.target = d[d.length - 1],
                    d.both = unique_links.filter(function(v) {
                        if (v.source === d.source && v.target ===
                            d.target) return v.both;
                    }).shift();
            })
            .attr("class", "link")
            .attr("d", line);
        node = node
            .data(nodes.filter(function(n) {
                return !n.children;
            }))
            .enter().append("text")
            .attr("class", "node")
            .attr("dy", ".31em")
            .attr("transform", function(d) {
                return "rotate(" + (d.x - 90) + ")translate(" + (d.y +
                    8) + ",0)" + (d.x < 180 ? "" :
                    "rotate(180)");
            })
            .style("text-anchor", function(d) {
                return d.x < 180 ? "start" : "end";
            })
            .text(function(d) {
                return d.key;
            })
            .on("mouseover", mouseovered)
            .on("mouseout", mouseouted)
            .on('click', onClick);

    }


    function onClick(clickedNode) {

        var filter = clickedNode.key;
        dc.events.trigger(function() {
            _chart.filter(filter);
            _chart.redrawGroup();
        });
    }

    function highlightFilter() {
        if (_chart.hasFilter()) {
            _chart.selectAll(".node").each(function(d) {
                if (isSelectedSlice(d)) {
                    $(this).addClass('nodeActive');
                    highdependencies(d)
                }
            });
        }
    }

    function isSelectedSlice(d) {
        return _chart.hasFilter(d.key);
    }

    function highdependencies(d) {
        node.each(function(n) {
            n.target = n.source = false;
        });

        link
            .classed("link--both", function(l) {
                if ((l.target === d || l.source === d ||
                        isSelectedSlice(l.target) || isSelectedSlice(l.source)
                    ) && l.both) {

                    return l.source.source = l.source.target =
                        l.target.source = l.target.target =
                        true;
                }
            })
            .classed("link--target", function(l) {
                if ((l.target === d || isSelectedSlice(l.target)) && !l
                    .both) {

                    return l.source.source = true;
                }

            })
            .classed("link--source", function(l) {
                if ((l.source === d || isSelectedSlice(l.source)) && !l
                    .both) {

                    return l.target.target = true;
                }
            })
            .filter(function(l) {
                return (l.target === d || l.source === d ||
                    isSelectedSlice(l.target) || isSelectedSlice(l.source)
                );
            })
            .each(function() {
                this.parentNode.appendChild(this);
            });

        node
            .classed("node--both", function(n) {
                return n.target && n.source;
            })
            .classed("node--target", function(n) {
                return n.target;
            })
            .classed("node--source", function(n) {
                return n.source;
            });

    }

    function mouseouted(d) {


        link
            .classed("link--both--clicked ", false)
            .classed("link--target--clicked ", false)
            .classed("link--source--clicked ", false);

        node
            .classed("node--both--clicked", false)
            .classed("node--target--clicked", false)
            .classed("node--source--clicked", false);


    }

    function mouseovered(d) {
        node
            .each(function(n) {
                n.target = n.source = false;
            });

        link
            .classed("link--both--clicked ", function(l) {
                if ((l.target === d || l.source === d) && l.both) return l
                    .source.source = l.source.target = l.target.source =
                    l.target.target = true;
            })
            .classed("link--target--clicked ", function(l) {
                if (l.target === d && !l.both) return l.source.source =
                    true;
            })
            .classed("link--source--clicked ", function(l) {
                if (l.source === d && !l.both) return l.target.target =
                    true;
            })
            .filter(function(l) {
                return l.target === d || l.source === d;
            })
            .each(function() {
                this.parentNode.appendChild(this);
            });

        node
            .classed("node--both--clicked ", function(n) {
                return n.target && n.source;
            })
            .classed("node--target--clicked ", function(n) {
                return n.target;
            })
            .classed("node--source--clicked ", function(n) {
                return n.source;
            });
    }


    function createElements() {
        _chart.resetSvg();
        svg = _chart.svg().attr("width", diameter)
            .attr("height", diameter)
            .append("g")
            .attr("transform", "translate(" + radius + "," + radius +
                ")");
        link = svg.append("g").selectAll(".link"),
            node = svg.append("g").selectAll(".node");
        cluster = d3.layout.cluster()
            .size([360, innerRadius])
            .sort(null)
            .value(function(d) {
                return d.size;
            });
        bundle = d3.layout.bundle();
        line = d3.svg.line.radial()
            .interpolate("bundle")
            .tension(.85)
            .radius(function(d) {
                return d.y;
            })
            .angle(function(d) {
                return d.x / 180 * Math.PI;
            });
    }


    function packageHierarchy(classes) {
        var map = {};

        function find(name, data) {
            var node = map[name],
                i;
            if (!node) {
                node = map[name] = data || {
                    name: name,
                    children: []
                };
                if (name.length) {
                    node.parent = find(name.substring(0, i = name.lastIndexOf(
                        "#")));
                    node.parent.children.push(node);
                    node.key = name.substring(i + 1);
                }
            }
            return node;
        }

        classes.forEach(function(d) {
            find(d.name, d);
        });

        return map[""];
    }

    // Return a list of imports for the given array of nodes.
    function packageImports(nodes) {
        var map = {},
            imports = [];

        // Compute a map from name to node.
        nodes.forEach(function(d) {
            map[d.name] = d;
        });

        // For each import, construct a link from the source to target node.
        nodes.forEach(function(d) {
            if (d.imports) d.imports.forEach(function(i) {
                imports.push({
                    source: map[d.name],
                    target: map[i]
                });
            });
        });


        return imports;
    }
    return _chart.anchor(parent, chartGroup);

};