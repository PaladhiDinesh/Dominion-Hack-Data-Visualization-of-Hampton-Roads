var months = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function daysInMonth(month,year) {
    return new Date(year, month, 0).getDate();
}


function init_days_dic_count(month, year) {
	var num_of_days = daysInMonth(month, year);
	var days_dic = {}
	for(i=1;i<=num_of_days;i++) {
		days_dic[i] = 0;
	}
	return days_dic;
}

function init_months_count_dic(year) {
	var months_dic = {};
	$.each(months, function(key, month) {
		var month_number = $.inArray(month, months) + 1;
		months_dic[month] = {"count": 0, "days": init_days_dic_count(month_number, year)}
	});
	return months_dic;
} 

function get_year(date) {
	return date.split('/')[2];
}

function get_month(date) {
	return months[date.split('/')[0]-1] 
}

function get_day(date) {
	return date.split('/')[1]; 
}

function get_highcharts_month_wise_count (year, array) {			
	var months_count = $.map(array, function(key, value) {
		return [{
			name: value,
			y: key['count'],
			drilldown: year + '-' + value
		}]
	});
	return months_count;
}

function get_highcharts_day_wise_count(array) {
	var days_count = $.map(array, function(key, value) {
		return [{
			name: value,
			y: key,
			drilldown: value
		}]
	});
	return days_count;		
}

function get_spline_chart_data (array, place) {
	var data = [];
	$.each(array, function(key, value) {
		var flag = 0;
		$.each(value, function(place_name, count) {
			if(place_name == place) {
				flag = 1;
				data.push(count);
			}
		});
		if(flag == 0) {
			data.push(0);
		}
	});
	return data;	
}

function filter_location_by_year(lat_long_by_year, year) {
	return lat_long_by_year[year];
}

function get_pie_chart_data(array, year) {
	var data = [];
	var places_count = {};
	if(year) {
		$.each(array[year], function(key, value) {
			data.push({name: key, y:value});
		});
	}
	else {
		$.each(array, function(key, value) {
			$.each(value, function(place_name, count) {
				if(!(place_name in places_count)) {
					places_count[place_name] = count;
				}
				else {
					places_count[place_name] += count;
				}
			});
		});
		$.each(places_count, function(key, value) {
			data.push({name: key, y:value});
		});
	}
	return data;
}

window.pie_chart = null;
window.spline_chart = null;
var dates_count = [];
var months_count = [];
var days_count = [];
var years = [];

var complete_data = [];
var series_data = [];

var highcharts_years = [];
var highcharts_months = [];
var highcharts_days = [];

var lat_long_by_year = {};
var locations = [];

var places_count = {};

$(function () {

	$('#select_map').change(function() {
		$('#map').toggleClass('no_display');
		$('#google_map').toggleClass('no_display');
	});

	/*Menu-toggle*/
    $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("active");
    });

	
	var year_selector = false;

	$('#year_selector').change(function() {
		var year = $('#year_selector').val();
		var highcharts_pie_data = get_pie_chart_data(places_count, year);
		window.pie_chart.series[0].setData(highcharts_pie_data,true);
	});

	$.get('./hackdata.json', function(response) {

		$.each(response, function(key,value) {
			var date = value['Crash Dt'];
			var lat = value['LAT'];
			var longitute = value['LON'];
			var place_name = value['Juris Name Used'];

			var year = get_year(date);
			var month = get_month(date);
			var day = get_day(date);

			if(!(year in places_count)) {
				places_count[year] = {};
				places_count[year][place_name] = 0;
			}
			if(!(place_name in places_count[year])) {
				places_count[year][place_name] = 0;
			}

			if( !(year in lat_long_by_year) ) {
				lat_long_by_year[year] = [[lat, longitute]];
			}
			else {
				lat_long_by_year[year].push([lat, longitute]);
			}

			locations.push([lat, longitute]);

			places_count[year][place_name] += 1;
			    			
			if($.inArray(year, years) == -1) {
				years.push(year);
				complete_data[year] = {"count": 0, "months": init_months_count_dic(year)}
			}
			complete_data[year]["count"] += 1;
			complete_data[year]["months"][month]["count"] += 1;
			complete_data[year]["months"][month]["days"][day] += 1;
		
		});

		years.sort();

		var highcharts_pie_data = get_pie_chart_data(places_count, false);

		var highcharts_spline_data = get_spline_chart_data(places_count, 'Virginia Beach');

		draw_spline_chart('Virginia Beach', highcharts_spline_data);

		$.each(years, function(key, year) {
			highcharts_years.push({name: year, y: complete_data[year]["count"], drilldown: year});
			series_data.push({name:year, id: year, data: get_highcharts_month_wise_count(year, complete_data[year]["months"])});
			$.each(months, function(month_key, month_value) {
				series_data.push({name: month_value, id:year+'-'+month_value, data: get_highcharts_day_wise_count(complete_data[year]["months"][month_value]["days"])})
			});
		});


		window.pie_chart = Highcharts.chart('pie_chart', {
		        chart: {
		            plotBackgroundColor: null,
		            plotBorderWidth: null,
		            plotShadow: false,
		            type: 'pie'
		        },
		        title: {
		            text: 'Area wise accident statistics'
		        },
		        tooltip: {
		            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
		        },
		        plotOptions: {
		            pie: {
		                allowPointSelect: true,
		                cursor: 'pointer',
		                dataLabels: {
		                    enabled: true,
		                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
		                    style: {
		                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
		                    }
		                }
		            }
		        },
		        series: [{
		            name: 'Brands',
		            colorByPoint: true,
		            data: highcharts_pie_data
		        }]
		    });
	
		function draw_spline_chart(name, data) {

			var series_data = [{'name': name, 'data': data}]

			window.spline_chart = Highcharts.chart('spline', {
			        title: {
			            text: name+ ' accidents from 2011 - 2016',
			            x: -20 //center
			        },
			        subtitle: {
						text: 'Source: <a href="http://https://github.com/NorfolkDataSci/carCrashesWithBikes/blob/master/Summary_O_data.csv">Norfolk Data Science </a>',				            
						x: -20
			        },
			        xAxis: {
			            categories: years
			        },
			        yAxis: {
			            title: {
			                text: 'Total number of accidents'
			            },
			            plotLines: [{
			                value: 0,
			                width: 1,
			                color: '#808080'
			            }]
			        },
			        series: series_data
			    });
		}

		 Highcharts.chart('drilldown', {
	        chart: {
	            type: 'column'
	        },
	        title: {
	            text: 'Haptom roads accident statistics'
	        },
	        subtitle: {
	            text: 'Source: <a href="http://https://github.com/NorfolkDataSci/carCrashesWithBikes/blob/master/Summary_O_data.csv">Norfolk Data Science </a>'
	        },
	        xAxis: {
	            type: 'category'
	        },
	        yAxis: {
	            title: {
	                text: 'Total number of accidents'
	            }

	        },
	        legend: {
	            enabled: false
	        },
	        plotOptions: {
	            series: {
	                borderWidth: 0,
	                dataLabels: {
	                    enabled: true
	                }
	            }
	        },
	        tooltip: {
	            headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
	            pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y}</b> accidents<br/>'
	        },
	        series: [{
	            name: 'Year',
	            colorByPoint: true,
	            data: highcharts_years
	        }],
	        drilldown: {
	            series: series_data		        
	        }
	    });
	},'json');
});