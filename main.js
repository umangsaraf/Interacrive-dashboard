function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

//usage:
readTextFile("springfield_converted.json", function(text){
    var data = JSON.parse(text);
    


var fuel_tech = new Array();
var id = new Array();
var data_plot = new Array(); 
var interval = new Array();
var type = new Array();
var test = data[0].type;
for(var i = 0; i < 11; i++){
    fuel_tech.push(data[i]['fuel_tech']);
    id.push(data[i].id.split('.')[2]);
    data_plot.push(data[i].history.data);
    interval.push(data[i].history.interval);
    type.push(data[i].type);
}
console.log(id);
var data_plot_new = new Array();
for(var i = 0; i < 7; i++){
    console.log(i);
    var m_interval = new Array();
    //m_interval.push(data_plot[i].slice(0, 0+6).reduce((a, b) => a + b, 0));
    for(var j = 0; j < 2016; j+=6){
         m_interval.push(data_plot[i].slice(j, j+6).reduce((a, b) => a + b, 0));
    }
    data_plot_new.push(m_interval);
}
console.log(data_plot[6]);
Highcharts.chart('container', {
    chart: {
        type: 'area'
    },
    title: {
        text: 'Historic and Estimated Worldwide Population Growth by Region'
    },
    subtitle: {
        text: 'Source: Wikipedia.org'
    },
    xAxis: {
  
        categories: ['Monday', 'Tuesdau', 'wednesday', 'thur', 'friday', 'sat', 'sun' ],
        tickmarkPlacement: 'on',
        title: {
            enabled: false
        }
    },
    yAxis: {
        title: {
            text: 'Billions'
        },
        labels: {
            formatter: function () {
                return this.value / 1000;
            }
        }
    },
    tooltip: {
        split: true,
        valueSuffix: ' millions'
    },
    plotOptions: {
        area: {
            stacking: 'normal',
            lineColor: '#666666',
            lineWidth: 1,
            marker: {
                lineWidth: 1,
                lineColor: '#666666'
            }
        }
    },
    series: [{
        name: 'distillate',
        data: data_plot_new[1]
    }, {
        name: 'gas_ccgt',
        data: data_plot_new[2]
    }, {
        name: 'hydro',
        data: data_plot_new[3]
    }, {
        name: 'pumps',
        data: data_plot_new[4]
    }, {
        name: 'wind',
        data: data_plot_new[5]
    }, {
        name: 'exports',
        data: data_plot_new[6]
    },{
        name: 'black coal',
        data: data_plot_new[0]
    }



]



});

});