var width = 1000,
    height = 400;

var albersProjection = d3.geo.albers()
                        .center([0, 36.85])
                        .rotate([76.5, 0])
                        .parallels([36.5, 37.5])
                        .scale(25000)
                        .translate([width/4,height/2+60]);

var svg = d3.select("#map").append("svg").attr("id", "worldmap")
            .attr("width", width)
            .attr("height", height);

var zoom = d3.behavior.zoom()
              .on("zoom",function() {
                 neighborhoods.attr("transform","translate("+ 
                    d3.event.translate.join(",")+")scale("+d3.event.scale+")");
                 neighborhoods.selectAll("circle")
                  .attr("r", function(){
                    var self = d3.select(this);
                //console.log(self)
                    var r = 2 / d3.event.scale;  // set radius according to scale
                      // scale stroke-width
                    return r;
            	});
            });

var neighborhoods = svg.append( "g" ).call(zoom);

var geoPath = d3.geo.path()
    .projection(albersProjection);

var map = neighborhoods.selectAll("path")
                      .data(neighborhoods_json.features)
                      .enter()
                      .append( "path" )
                      .attr( "fill", "#ccc" )
                      .attr( "d", geoPath )
                      .attr("class", "country")
                      .attr("id", function(d,i) { return d.properties['NAME']});
colorMap('o');

var tooltip = d3.select("#map").append("div")
                .attr("class", "tooltip_map");

d3.csv("Summary_O_data.csv", function(error, data) {

    d3.select('#slider6').call(d3.slider().axis(true).value(2016).min(2011).max(2016).step(1).on("slide", function(evt, year) {
            d3.select('#year').text(year);

            var updated_lat_long = filter_location_by_year(lat_long_by_year, year);
            //initMap(updated_lat_long);
            var highcharts_pie_data = get_pie_chart_data(places_count, year);
			window.pie_chart.series[0].setData(highcharts_pie_data,true);
		    document.getElementById('oneyear').checked = true;
		    colorMap('o');
            //univcolor(year);
        }));
})

function univcolor(data){
    d3.select("#univcircle").remove();
    circ = neighborhoods.append("g")
                        .attr("id","univcircle").selectAll("circle")
                        .data(data)
                        .enter()
                        .append("circle")
                        .attr("cx", function(d) { return albersProjection([d.LON, d.LAT])[0]; })
                        .attr("cy", function(d) { return albersProjection([d.LON, d.LAT])[1]; })
                        .attr("r", "1px")
                        .attr("fill", "red")
                        .attr("id", function(d) { return d.Document_Nbr;})
                        //accident-mouse hovering           
    circ.on("mousemove", function(d) {
        var mouse = d3.mouse(svg.node()).map( function(d) { return parseInt(d); } );
    tooltip
        .classed("hidden", false)
        .html("Document Number: "+parseInt(d['Document_Nbr'])
        +"<br>Crash Date: "+d['Crash Dt']
        +"<br>Place: "+d['Juris Name Used']
        +"<br>Time: "+d['Time Slicing Used']
        +"<br>Day of Week: "+d['Day Of Week']
        +"<br>Driver age: "+d['Driverage']
        +"<br>Driver Gender: "+d['Drivergen']
        //+"<br>"+'<a href= "'+d.Website+'" target="_blank">'+d.Website+"</a>"
        )
    .style("left", (d3.event.pageX - 178) + "px")
    .style("top", (d3.event.pageY - 106) + "px");
      })
      .on("mouseout",  function(d) {
        tooltip.classed("hidden", true);
    })

}


function colorMap(chkd) {
    d3.csv("Summary_O_data.csv", function(error, data) {

        data.forEach(function(d) {
            d['Crash Year'] = +d['Crash Year'];
            d['TOTAL CRASH'] = +d['TOTAL CRASH']
        });

        year = d3.select('#year').text();

        if(document.getElementById('allyears').checked == true){
            
            if(document.getElementById('alcohol').checked == true){
                
                var FiltData_alcohol = data.filter(function(d, i) { if(d['Alcohol Notalcohol'] == 'ALCOHOL') return d;})
                
            }
            else if(document.getElementById('notalcohol').checked == true){
                
                var FiltData_alcohol = data.filter(function(d, i) { if(d['Alcohol Notalcohol'] == 'Not ALCIHOL') return d;})
                
            }
            else if(document.getElementById('bothalcohol').checked == true) {
                
                var FiltData_alcohol = data
            }
            
            var split = [100, 200, 300, 400, 500, 600, 700, 800];
        }
        else if(document.getElementById('oneyear').checked == true){
            
            var FiltData = data.filter(function(d, i) { if(d['Crash Year'] == year) return d;})
            
            if(document.getElementById('alcohol').checked == true){
                
                var FiltData_alcohol = FiltData.filter(function(d, i) { if(d['Alcohol Notalcohol'] == 'ALCOHOL') return d;})
                
            }
            else if(document.getElementById('notalcohol').checked == true){
                
                var FiltData_alcohol = FiltData.filter(function(d, i) { if(d['Alcohol Notalcohol'] == 'Not ALCIHOL') return d;})
                
            }
            else if(document.getElementById('bothalcohol').checked == true) {
                
                var FiltData_alcohol = FiltData
            }
            
            var split = [10, 15, 20, 30, 35, 40, 50, 70];
        }
            
        if(document.getElementById('select_time').value != 'None'){
            FiltData_alcohol = FiltData_alcohol.filter(function(d, i) { if(d['Time Slicing Used'] == document.getElementById('select_time').value) return d;})
        }
        if(document.getElementById('select_light').value != 'None'){
            FiltData_alcohol = FiltData_alcohol.filter(function(d, i) { if(d['Light Condition'] == document.getElementById('select_light').value) return d;})
        }
        if(document.getElementById('select_weather').value != 'None'){
            FiltData_alcohol = FiltData_alcohol.filter(function(d, i) { if(d['Weather Condition'] == document.getElementById('select_weather').value) return d;})
        }
        
        
        univcolor(FiltData_alcohol)
        
        updated_lat_long = []
        for (var i = 0; i < FiltData_alcohol.length; i++){
            lat_lon = [FiltData_alcohol[i].LAT,FiltData_alcohol[i].LON]
            updated_lat_long.push(lat_lon)
        }

        if(updated_lat_long.length > 0) {
            initMap(updated_lat_long);
        }
        
        var data1 = d3.nest()
            .key(function(d) { return d['Juris Name Used'];})
            .rollup(function(d) { 
                    return d3.sum(d, function(g) {return g['TOTAL CRASH']; });
            }).entries(FiltData_alcohol);
        
        var colors = ["#ebebff","#c4c4ff","#9d9dff","#7676ff","#4e4eff","#2727ff","#0000ff","#000089","#00003b"];

        var color = d3.scale.threshold()
                            .domain(split)
                            .range(colors);

        map.transition().duration(1000).delay(function(d, i) {return i * 10;}).style("fill", colorize);

        function colorize(data) { 
            var m = data1.filter(function(data1) { return data1['key'] == data.properties['NAME']; } )
            if(m.length>0) {  return color(m[0].values) }
        }

        map.on("mousemove", function(d,i) { 

            var bodyNode = d3.select('body').node();
            var absoluteMousePos = d3.mouse(bodyNode);

            tooltip.classed("hidden", false)
                   .style("left", (d3.event.pageX - 178) + "px")
      				.style("top", (d3.event.pageY - 106) + "px");

            var cityName = d.properties['NAME']
            data2 = data1.filter(function(d, i) { if(d['key'] == cityName) return d;})
            if(data2.length > 0)
                tooltip.html(d.properties['NAME'] 
                    +"<br>Number of accidents: "+ data2[0].values)
            else
                tooltip.html(d.properties['NAME'] + ' ' + '0')
        })

         map.on("click",  function(d,i) {
         	var name = d.properties['NAME'];
			var highcharts_spline_data = get_spline_chart_data(places_count, name);
			window.spline_chart.setTitle({text: name + ' accidents from 2011 - 2016'});
			window.spline_chart.series[0].update({name:name}, false);
			window.spline_chart.series[0].setData(highcharts_spline_data,true);
        })


        map.on("mouseout",  function(d,i) {
                tooltip.classed("hidden", true);
                d3.select(".tooltip").html("");
        })
    });
}


