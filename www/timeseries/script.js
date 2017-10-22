var global_context;
var global_data = [];
var tags = [];
var num_rows = 1;

var default_timespan = 7200;
var timespan;
var data_density = 40;

function fetch_data(source, tag, cb) {
  console.log("begin fetch_data");
  var hreq = new XMLHttpRequest(),
      method = 'GET',
      url = source;
  hreq.onreadystatechange = function() {
    if(hreq.readyState === XMLHttpRequest.DONE &&
       hreq.status === 200) {
      console.log("retrieved fetch_data");
      //global_data = JSON.parse(hreq.responseText);
      global_data.push(JSON.parse(hreq.responseText));
      tags.push(tag);
      num_rows = global_data.length;
      if(cb) cb();
    }
  };

  hreq.open(method, url, true);

  hreq.send();
}

function init() {

  var searchParams = new URLSearchParams(window.location.search);
  var tag = searchParams.get('tags');

  timespan = searchParams.get('timespan');
  if( !timespan )
    timespan = default_timespan;

  if( timespan > 1e6 ){
    data_density = 10000;
  } else if( timespan > 1e5 ){
    data_density = 1000;
  } else if( timespan > 1e4 ){
    data_density = 100;
  }

  tag_list = tag.split(',');
  console.log(tag_list);
  for( var k in tag_list ){
    fetch_data('/api/hashtags/timeseries/'+tag_list[k]+'/?time='+timespan, tag_list[k], load_timeseries);
  }
}

function load_timeseries() {
  console.log("load_timeseries");
  if( tags.length != global_data.length ){
    return;
  }
  var context = cubism.context()
      .step(timespan)
      .size(1440);

  global_context = context;

  d3.select("body").selectAll(".axis")
    .data(["top", "bottom"])
    .enter().append("div")
    .attr("class", function(d) { return d + " axis"; })
    .each(function(d) { d3.select(this).call(context.axis().ticks(12).orient(d)); });

  d3.select("body").append("div")
    .attr("class", "rule")
    .call(context.rule());

  d3.select("body").selectAll(".horizon")
    .data(d3.range(0, num_rows).map(add_data))
    .enter().insert("div", ".bottom")
    .attr("class", "horizon")
    .call(context.horizon().extent([0, data_density]));

  context.on("focus", function(i) {
    d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
  });
}

// Replace this with context.graphite and graphite.metric!
function random(x) {
  var value = 0,
      values = [],
      i = 0,
      last;
  return global_context.metric(function(start, stop, step, callback) {
    console.log("start ---- "+ x);
    console.log(start + " " + stop + " " + step);
    start = +start, stop = +stop;
    console.log(start + " " + stop + " " + step);
    console.log("stop ---- "+ x);
    if (isNaN(last)) last = start;
    while (last < stop) {
      last += step;
      value = Math.random() * 10;
      //value = Math.max(-10, Math.min(10, value + .8 * Math.random() - .4 + .2 * Math.cos(i += x * .02)));
      values.push(value);
    }
    callback(null, values = values.slice((start - stop) / step));
  }, x);
}

function add_data(x) {
  var values = [];
  var i = 0;
  var last;
  console.log(global_data[x]);
  //var this_tag = global_data[x].table;
  
  return global_context.metric(function(start, stop, step, callback) {
    console.log(start + " -> " + stop);
    start = +start, stop = +stop;
    step = step;
    console.log(start + " to " + stop + " step " + step);
    if( isNaN(last)) last = start;
    var count = 0;
    while( last < stop ){
      //console.log(last);
      last += step;
      count++;
      var row;
      var cur_val = 0;
      while ((row = global_data[x].table[i]) != null ){
        //console.log("row " + i);

        var utime = row.create_time * 1000;
        if( utime < last ){
          i++;
          //console.log(last + " " + stop + " " + utime);
          cur_val++;
        } else {
          //console.log('breaking');
          break;
        }


      }
      values.push(cur_val);
    }
    console.log(count);
    callback(null, values)
  }, "#"+tags[x]);
}


