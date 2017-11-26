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

			var node = document.createElement("div");
      node.innerHTML = '<h3>Trending</h3>';

      for( var i in data.table ){
        var row = data.table[i];

        node.innerHTML += '<a href="hashtags/?tag=' + row.label + '">' + row.label + '</a> ';
        node.innerHTML += row.frequency + '<br>';
      }

      node.style = 'width: 200px; float: right;';
			document.body.appendChild(node);

		}
  }

  top_tags_api_req.open('GET', 'api/hashtags/top', true);
  top_tags_api_req.send();

}
