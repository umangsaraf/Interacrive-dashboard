/* load data on backend:*/
'use strict';



var jsonData = new Array();
$.getJSON('https://raw.githubusercontent.com/umangsaraf/dsc106hw3/master/springfield.json' , function(data) {
    var length = data.length
    for (var i = 0; i < length; i++) {

        jsonData.push(data[i])
    }
    onSuccessCb(jsonData);
})

var colorsMap = {
    'black_coal': '#121212', 
    'distillate': '#C74523', 
    'gas_ccgt': '#FDB462',
    'hydro': '#4582B4',
    'wind': '#437607',
    'exports': '#977AB1',
    'pumps': '#88AFD0'
};

var globalEnergyData = {
    name: [],
    data: []
}

function updateEnergyData(data) {
    // data = data.filter(function(elm) {
    //     return (elm.name !== 'pumps' & elm.name !== 'exports')
    // })
    globalEnergyData.data = [];
    for (var idx = 0; idx < data[0]['data'].length; idx ++) {
        var energyBreakup = data.map(elm => {return elm['data'][idx]});
        globalEnergyData['data'].push(energyBreakup);
      }
      globalEnergyData['name'] = data.map(elm => elm['name']);
}

function renderPieChart(nodeId) {
    var pieData = globalEnergyData['name'].map(function(elm, idx) {
        if (globalEnergyData['name'] !== 'pumps' & globalEnergyData['name'] !== 'exports') {
            return {
                name: elm.split('.')[elm.split('.').length - 1],
                y: globalEnergyData['data'][nodeId][idx],
                color: colorsMap[elm.split('.')[elm.split('.').length - 1]]
            }
        }
    });
    pieOptions.series[0].data = pieData;
    var total = 0;
    for (var i = 0; i < pieOptions.series[0].data.length; i++) {
        total = total + pieOptions.series[0].data[i].y
    }
    pieOptions.title.text = Math.round(total) + ' MW';
    Highcharts.chart(pieOptions)
    updateLegend(pieData, total)
  }

function onSuccessCb(jsonData) {
    var energyData = jsonData.filter(function(elm) {
        if (elm.fuel_tech !== 'rooftop_solar'){
            return elm['type'] === 'power';
        };
    }).map(function(elm) {
        var energyVals = new Array();
        if (elm.fuel_tech === 'pumps' || elm.fuel_tech === 'exports') {
            for (var i = 1; i < elm.history.data.length; i = i+6) {
                energyVals.push(elm.history.data[i]*(-1));
            };
        } else {
            for (var i = 1; i < elm.history.data.length; i = i+6) {
                energyVals.push(elm.history.data[i]);
            };
        }
        return {
            data: energyVals,
            name: elm.fuel_tech,
            pointStart: (elm.history.start + 5*60) * 1000,
            pointInterval: 1000 * 60 * 30,
            color: colorsMap[elm.fuel_tech],
            fillOpacity: 1,
            tooltip: {
                valueSuffix: ' ' + elm.units
            }
        };
    });

    
    updateEnergyData(energyData)
    var tempData = jsonData.filter(function(elm) {
        return elm.type === 'temperature';
    }).map(function(elm) {
        var tempVals = new Array();
        for (var i = 1; i < elm.history.data.length; i++) {
            tempVals.push(elm.history.data[i]);
        };
        return {
            data: tempVals,
            name: elm.type,
            pointStart: (elm.history.start + 30*60) * 1000,
            pointInterval: 1000 * 60 * 30,
            color: 'Red',
            tooltip: {
                valueSuffix: ' ' + elm.units
            }
        };
    })
    var priceData = jsonData.filter(function(elm) {
        return elm.type === 'price';
    }).map(function(elm) {
        var priceVals = new Array();
        for (var i = 1; i < elm.history.data.length; i++) {
            priceVals.push(elm.history.data[i]);
        };
        return {
            data: priceVals,
            name: elm.type,
            pointStart: (elm.history.start + 30*60) * 1000,
            pointInterval: 1000 * 60 * 30,
            color: 'Red',
            tooltip: {
                valueSuffix: ' ' + elm.units
            }
        };
    })

    EnergyFeatures.series = energyData.reverse();
    PriceFeatures.series = priceData;
    TempFeatures.series = tempData;
    
    Highcharts.chart(TempFeatures);
    Highcharts.chart(PriceFeatures);
    Highcharts.chart(EnergyFeatures);
    renderPieChart(0)
}

['mouseleave'].forEach(function (eventType) {
    document.getElementById('ChartSpace').addEventListener(
        eventType,
        function (e) {
            var chart,
                point,
                i,
                event;
            
                for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                    chart = Highcharts.charts[i];
                    event = chart.pointer.normalize(e);
                    point = chart.series[0].searchPoint(event, true);
                    
                    if (point) {
                        point.onMouseOut(); 
                        chart.tooltip.hide(point);
                        chart.xAxis[0].hideCrosshair(); 
                    }
                }
            }
    )
});

['mousemove', 'touchmove', 'touchstart'].forEach(function (eventType) {
    document.getElementById('ChartSpace').addEventListener(
        eventType,
        function (e) {
            var chart,
                point,
                i,
                event,
                idx;

            for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                chart = Highcharts.charts[i];
                // Find coordinates within the chart
                event = chart.pointer.normalize(e);
                // Get the hovered point
                point = chart.series[0].searchPoint(event, true);
                idx = chart.series[0].data.indexOf( point );

                if (point) {
                    point.highlight(e);
                    renderPieChart(idx);
                }
            }
        }
    );
});

/**
 * Highlight a point by showing tooltip, setting hover state and draw crosshair
 */
Highcharts.Point.prototype.highlight = function (event) {
    event = this.series.chart.pointer.normalize(event);
    this.onMouseOver(); // Show the hover marker
    this.series.chart.tooltip.refresh(this); // Show the tooltip
    this.series.chart.xAxis[0].drawCrosshair(event, this); // Show the crosshair
    this.series.chart.yAxis[0].drawCrosshair(event, this);
};


/**
 * Synchronize zooming through the setExtremes event handler.
 */
function syncExtremes(e) {
    var thisChart = this.chart;

    if (e.trigger !== 'syncExtremes') { // Prevent feedback loop
        Highcharts.each(Highcharts.charts, function (chart) {
            if (chart !== thisChart) {
                if (chart.xAxis[0].setExtremes) { // It is null while updating
                    chart.xAxis[0].setExtremes(
                        e.min,
                        e.max,
                        undefined,
                        false,
                        { trigger: 'syncExtremes' }
                    );
                }
            }
        });
    }
}

function updateLegend(data, grandTotal) {
    
    console.log(grandTotal);

    var sourcesCell = document.querySelector('#sources').querySelector('.cell-total');
    sourcesCell.innerHTML = Math.round(grandTotal);
    var loadsCell = document.querySelector('#loads').querySelector('.cell-total');
    for(var i = 0; i < data.length; i++) {
        var name = '#' + data[i].name;
       
        var cellTotal = document.querySelector(name).querySelector('.cell-total');
        var cellPercent = document.querySelector(name).querySelector('.cell-percent');
        var per = (100*(data[i].y / grandTotal));
        cellPercent.innerHTML = per;
        if (data[i].y < 1) {
            cellTotal.innerHTML = data[i].y.toFixed(2);
        } else {
            cellTotal.innerHTML = Math.round(data[i].y);
        }
        if (per < 1) {
            cellPercent.innerHTML = per.toFixed(4)+'%';
        } else {
            cellPercent.innerHTML = per.toFixed(2)+'%';
        }
    }
    var pumpsCell = document.querySelector('#pumps').querySelector('.cell-total');
    var exportsCell = document.querySelector('#exports').querySelector('.cell-total');
    loadsCell.innerHTML = Math.round(Number(pumpsCell.innerHTML) + Number(exportsCell.innerHTML));

    var netCell = document.querySelector('#net').querySelector('.cell-total');
    netCell.innerHTML = Math.round(Number(sourcesCell.innerHTML) + Number(loadsCell.innerHTML));

}

var EnergyFeatures = {
    chart: {
        renderTo: 'EnergyArea',
        type: 'areaspline',
        backgroundColor: 'transparent'
    },


    title: {
        text: 'Generation MW',
        align: 'left',
        style: { 
            fontSize: "12px"
        }
    },
    xAxis: {
        type: 'datetime',
        minorTickInterval: 30 * 60 * 1000,
        dateTimeLabelFormats: {
            month: '%b \'%y'
        },
        crosshair: {
            width: 1,
            zIndex: 5,
            color: '#CA5131'
        },
        events: {
            setExtremes: syncExtremes
        }
    },
    yAxis: {
        title: {
            enabled: false
        },
       
        labels: {
            formatter: function (){
                return this.value;
            },
            align: 'left',
            reserveSpace: false,
            x: 4,
            y: -3.5
        },
        tickInterval: 1000,
        showLastLabel: false,
        min: -300
    },
    tooltip: {
        formatter: function () {
            return Highcharts.dateFormat('%e %b. %I:%M %P',
            new Date(this.points[0].x)) + ' Total '+ this.points[0].total + ' MW'
        },
        positioner: function () {
            return {
                x: this.chart.chartWidth - this.label.width,
                y: 10
            };
        },
        shared: true,
        borderWidth: 0,
        backgroundColor: 'none',
        shadow: false,
        style: {
            fontSize: '10px'
        },
        snap: 100
    },
    legend: {
        enabled: true
    },
    plotOptions: {
        areaspline: {
            stacking: 'normal',
            lineColor: '#666666',
            lineWidth: 1,
            marker: {
                lineWidth: 1,
                lineColor: '#666666'
            }
        },
        series: {
            states: {
                hover: {
                    enabled: false
                }
            }
        }
    },
    series: []
};

var PriceFeatures = {
    chart: {
        renderTo: 'PriceLine',
        type: 'line',
        backgroundColor: 'transparent'
    },
    title: {
        text: 'Price $/MWh',
        align: 'left',
        style: {
            color: "#333333", 
            fontSize: "12px"
        }
    },
    xAxis: {
        type: 'datetime',
        tickInterval: 30 * 60 * 1000,
        dateTimeLabelFormats: {
            day: '%e. %b',
            month: '%b \'%y'
        },
        crosshair: {
            width: 1,
            color: '#CA5131'
        },
        visible: false,
        events: {
            setExtremes: syncExtremes
        }
    },
    yAxis: {
        title: {
            enabled: false
        },
        labels: {
            align: 'left',
            reserveSpace: false,
            x: 4,
            y: -3.5
        },
        tickInterval: 100,
        showLastLabel: false,
        max: 350
    },
    tooltip: {
        formatter: function () {
            return Highcharts.dateFormat('%e %b. %I:%M %P',
            new Date(this.point.x)) + ' $'+ this.point.y + '.00'
        },
        positioner: function () {
            return {
                x: this.chart.chartWidth - this.label.width,
                y: 10 
            };
        },
        borderWidth: 0,
        backgroundColor: 'none',
        shadow: false,
        style: {
            fontSize: '10px'
        },
        snap: 100
    },
    plotOptions: {
        line: {
            step: 'center',
            lineWidth: 1
        },
        series: {
            states: {
                hover: {
                    enabled: false
                }
            }
        }
    },
    legend: {
        enabled: false
    },
    series: []
};

var TempFeatures = {
    chart: {
        renderTo: 'TempLine',
        type: 'spline',
        backgroundColor: 'transparent'
    },
    title: {
        text: 'Temperature °F',
        align: 'left',
        style: {
            color: "#333333", 
            fontSize: "12px"
        }
    },
    xAxis: {
        type: 'datetime',
        tickInterval: 30 * 60 * 1000,
        dateTimeLabelFormats: {
            day: '%e. %b',
            month: '%b \'%y'
        },
        crosshair: {
            width: 1,
            color: '#CA5131'
        },
        visible: false,
        events: {
            setExtremes: syncExtremes
        }
    },
    yAxis: {
        title: {
            enabled: false
        },
        tickInterval: 20,
        maxPadding: 0.001,
        min: 0, 
        max: 100,
        labels: {
            align: 'left',
            reserveSpace: false,
            x: 4,
            y: -3.5
        },
        showLastLabel: false
    },
    tooltip: {
        formatter: function () {
            return Highcharts.dateFormat('%e %b. %I:%M %P',
            new Date(this.point.x)) + ' ' + this.point.y + ' °F'
        },
        positioner: function () {
            return {
                // right aligned
                x: this.chart.chartWidth - this.label.width,
                y: 10 // align to title
            };
        },
        borderWidth: 0,
        backgroundColor: 'none',
        shadow: false,
        style: {
            fontSize: '10px'
        },
        snap: 100
    },
    plotOptions: {
        spline: {
            lineWidth: 1
        },
        series: {
            states: {
                hover: {
                    enabled: false
                }
            }
        }
    },
    legend: {
        enabled: false
    },
    series: []
};

var pieOptions = {
    chart: {
        renderTo: 'donutChart',
        type: 'pie',
        backgroundColor: 'transparent',
        animation: false
    },
    plotOptions: {
        pie: {
            innerSize: '50%',
            size: '75%',
            dataLabels: {
                enabled: false
            }
        },
        series: {
            animation: false
        }
    },
    title: {
        align: 'center',
        verticalAlign: 'middle',
        text: '',
        style: {
            fontSize: '13px'
        }
    },
    series: [{
        name: 'Energy',
        colorByPoint: true,
        data: []
    }]
}
