var global_context;
var global_data = [];
var tags = [];
var num_rows = 1;

var default_timespan = 7200;
var timespan;
var data_density = 40;
var step_size = 5000;

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

  step_size = Math.round(timespan*1000/1440);

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
      .step(step_size)
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

function add_data(x) {
  var values = [];
  var i = 0;
  var last;
  var last_val = 0;
  return global_context.metric(function(start, stop, step, callback) {
    start = +start, stop = +stop;
    step = step;
    if( isNaN(last)) last = start;
    var count = 0;
    while( last < stop ){
      last += step;
      count++;
      var row;
      var cur_val = 0;
      while ((row = global_data[x].table[i]) != null ){

        var utime = row.create_time * 1000;
        if( utime < last ){
          i++;
          cur_val++;
        } else {
          break;
        }
      }
      var push_val = Math.round((cur_val + last_val)/2);
      values.push(push_val);
      last_val = cur_val;
    }
    callback(null, values)
  }, "#"+tags[x]);
}


