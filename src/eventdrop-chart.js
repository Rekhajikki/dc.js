dc.eventdropChart = function(parent, chartGroup) {
    var _chart = dc.capMixin(dc.colorMixin(dc.baseMixin({})));
    var _endTime = Date.now();
    var month = 30 * 24 * 60 * 60 * 1000;
    var _startTime = _endTime - 6 * month;
    _chart._doRedraw = function() {
        _chart.resetSvg();
        drawChart();
        return _chart;
    };
    _chart._doRender = function() {

        _chart.resetSvg();
        drawChart();

        return _chart;
    };
    _chart.startTime = function(startTime) {
        if (!arguments.length) {
            return _startTime;
        }
        _startTime = startTime;
        return _chart;
    };
    _chart.endTime = function(endTime) {
        if (!arguments.length) {
            return _endTime;
        }
        _endTime = endTime;
        return _chart;
    };

    function drawChart() {

        var eventDropsData = _chart.data();
        var color = d3.scale.category20();
        var eventDropsChart = d3.chart.eventDrops();
        eventDropsChart
            .eventLineColor(function(datum, index) {
                return color(index);
            })
            .start(new Date(_startTime))
            .end(new Date(_endTime))
        var element = _chart.root().selectAll("svg").datum(eventDropsData);
        eventDropsChart(element);

    }
    

    return _chart.anchor(parent, chartGroup);
}