var chart = null; //modify this and it will change the plot

//ScatterPlot: constructor for the scatter plot. Initializes 
function ScatterPlot(points) {

    // Give the points a 3D feel by adding a radial gradient
    Highcharts.getOptions().colors = $.map(Highcharts.getOptions().colors, function (color) {
        return {
            radialGradient: {
                cx: 0.4,
                cy: 0.3,
                r: 0.5
            },
            stops: [
                [0, color],
                [1, Highcharts.Color(color).brighten(-0.2).get('rgb')]
            ]
        };
    });

    // Set up the chart
    chart = new Highcharts.Chart({
        chart: {
            renderTo: 'container',
            margin: 100,
            type: 'scatter',
            options3d: {
                enabled: true,
                alpha: 5,
                beta: 10,
                depth: 400,   //Z index size
                viewDistance: 10, //how far we're viewing the plot?

                frame: {
                    bottom: { size: 1, color: 'rgba(0,0,0,0.01)' },
                    back: { size: 1, color: 'rgba(0,0,0,0.01)' },
                    side: { size: 1, color: 'rgba(0,0,0,0.01)' }
                }
            }
        },
        title: {
            text: 'Gesture Points Visualization'
        },
        subtitle: {
            text: 'Click and drag the plot area to rotate in space'
        },
        plotOptions: {
            scatter: {
                width: 1,
                height: 1,
                depth: 1
            }
        },
        yAxis: {
            min: -1,
            max: 1
        },
        xAxis: {
            min: -1,
            max: 1
        },
        zAxis: {
            min: -1,
            max: 1
        },
        legend: {
            enabled: false
        },
        series: [{
            // [X, Y, Z] format
            name: 'Reading',
            colorByPoint: true,
            data: points
        }]
    });
    setUpInteraction();
};

function setChart(points){
  chart = new Highcharts.Chart({
        chart: {
            renderTo: 'container',
            margin: 100,
            type: 'scatter',
            options3d: {
                enabled: true,
                alpha: 5,
                beta: 10,
                depth: 400,   //Z index size
                viewDistance: 10, //how far we're viewing the plot?

                frame: {
                    bottom: { size: 1, color: 'rgba(0,0,0,0.01)' },
                    back: { size: 1, color: 'rgba(0,0,0,0.01)' },
                    side: { size: 1, color: 'rgba(0,0,0,0.01)' }
                }
            }
        },
        title: {
            text: 'Gesture Points Visualization'
        },
        subtitle: {
            text: 'Click and drag the plot area to rotate in space'
        },
        plotOptions: {
            scatter: {
                width: 1,
                height: 1,
                depth: 1
            }
        },
        yAxis: {
            min: -1,
            max: 1
        },
        xAxis: {
            min: -1,
            max: 1
        },
        zAxis: {
            min: -1,
            max: 1
        },
        legend: {
            enabled: false
        },
        series: [{
            // [X, Y, Z] format
            name: 'Reading',
            colorByPoint: true,
            data: points
        }]
    });

    setUpInteraction();
}

function setUpInteraction(){
  // Add mouse events for rotation
    $(chart.container).bind('mousedown.hc touchstart.hc', function (e) {
        e = chart.pointer.normalize(e);

        var posX = e.pageX,
            posY = e.pageY,
            alpha = chart.options.chart.options3d.alpha,
            beta = chart.options.chart.options3d.beta,
            newAlpha,
            newBeta,
            sensitivity = 5; // lower is more sensitive

        $(document).bind({
            'mousemove.hc touchdrag.hc': function (e) {
                // Run beta
                newBeta = beta + (posX - e.pageX) / sensitivity;
                newBeta = Math.min(100, Math.max(-100, newBeta));
                chart.options.chart.options3d.beta = newBeta;

                // Run alpha
                newAlpha = alpha + (e.pageY - posY) / sensitivity;
                newAlpha = Math.min(100, Math.max(-100, newAlpha));
                chart.options.chart.options3d.alpha = newAlpha;

                chart.redraw(false);
            },
            'mouseup touchend': function () {
                $(document).unbind('.hc');
            }
        });
    });
}