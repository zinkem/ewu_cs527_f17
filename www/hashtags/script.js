function new_div(classname){
  var div = document.createElement('div');
  div.className = classname;
  return div;
}


function create_table(sql_data){

  var table_view = new_div('table_view');
  var keys = [];

  var row_div = new_div('table_row');
  var div;

  for( var i in sql_data.fields ){
    var col_name = sql_data.fields[i].name;
    keys.push(col_name);
    div = new_div('table_cell table_title ' + col_name);
    div.innerHTML = col_name;
    row_div.appendChild(div);
  }
  div.style.float = 'initial';
  table_view.appendChild(row_div);

  for( var i in sql_data.table ){

    var row = sql_data.table[i];
    row_div = new_div('table_row');

    for( var k in keys ){
      var value = row[keys[k]];
      var div = new_div('table_cell ' + keys[k]);
      div.innerHTML = value;
      table_view.appendChild(div);
    }
    table_view.appendChild(row_div);
  }

  return table_view;
}

function place_content(source, dest_div, cb) {

  var hreq = new XMLHttpRequest(),
      method = 'GET',
      url = source;
  hreq.onreadystatechange = function() {
    if(hreq.readyState === XMLHttpRequest.DONE &&
       hreq.status === 200) {
      dest_div.appendChild(create_table(JSON.parse(hreq.responseText)));

      if(cb) cb();
    }
  };

  hreq.open(method, url, true);

  hreq.send();
}


function init() {
  var searchParams = new URLSearchParams(window.location.search);
  var tag = searchParams.get('tag');

  var content_div = new_div('content');

  place_content('/api/hashtags/stats/'+tag, content_div,
                function(){
                  place_content('/api/hashtags/tweets/'+tag, content_div);
                });

  var top_div = new_div('header');
  top_div.innerHTML = '#'+tag;

  var meta_div = new_div('header_button');
  meta_div.innerHTML = '<a href="/">Home</a>';
  top_div.append(meta_div);

  var meta_div = new_div('header_button');
  meta_div.innerHTML = '<a href="/timeseries/?timespan=14400&tags=' + tag + '">Chart</a>';
  top_div.append(meta_div);

  var bottom_div = new_div('footer');
  bottom_div.innerHTML = "cs527. Authors: Raymond Swannack, Matthew Zinke";

  document.body.appendChild(top_div);
  document.body.appendChild(content_div);
  document.body.appendChild(bottom_div);

}
