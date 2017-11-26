function init(){
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange=function(){
		if(this.readyState == 4 && this.status == 200){
			var node = document.createElement("div");
      node.style = 'width: 200px; float: left;';
			node.innerHTML = '<tt>'+xhttp.responseText.replace(/\n/g, '<br>') +'</tt>';
			document.body.prepend(node);
		}
	}
	
	xhttp.open("GET", "api/stats", true);
	xhttp.send();



  var top_tags_api_req = new XMLHttpRequest();
  top_tags_api_req.onreadystatechange = function() {
    if(this.readyState == 4 && this.status == 200){

      var data = JSON.parse(top_tags_api_req.responseText);

      var tag_csv = '';

			var node = document.createElement("div");
      node.innerHTML = '<h3>Trending</h3>';

      for( var i in data.table ){
        var row = data.table[i];

        node.innerHTML += '<a href="hashtags/?tag=' + row.label + '">' + row.label + '</a> ';
        node.innerHTML += row.frequency + '<br>';

        tag_csv += row.label + ',';
      }

      node.innerHTML +='<p><a href="timeseries/?timespan=14400&tags=' + tag_csv.slice(0,-1) +
        '">See All Activity</a> ';

      node.style = 'width: 200px; float: right;';
			document.body.appendChild(node);

		}
  }

  top_tags_api_req.open('GET', 'api/hashtags/trending', true);
  top_tags_api_req.send();

}
