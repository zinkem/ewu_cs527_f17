function init() {
  var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange=function(){
		if(this.readyState == 4 && this.status == 200){

      var data = JSON.parse(xhttp.responseText);

      var rank = [];

      console.log(data.total_docs);
      for( k in data.term ){
        console.log('k: ' + k);
        console.log(data.total_docs);
        console.log(data.doc[k]);
        console.log(data.term[k]);
        var idfval = Math.log2(data.term[k]) / (3+ data.doc[k]);
        rank.push({
          term: k,
          idf: idfval
        });
      }
      rank.sort((a, b) => {
        return b.idf - a.idf;
      });
      
      
      var node = document.createElement("div");

      for( k in rank ){
        var n = document.createElement("div");
        var h = '';
        h += '<input type="checkbox" name="select" value="'+rank[k].term+'"/>';
        h += '<a href="/hashtags/?tag='+rank[k].term+'">See</a>    ';
        h += '<span style="padding-right:200px;">'+rank[k].term + "</span>" + rank[k].idf + "\t" + data.doc[rank[k].term] + " / " + data.term[rank[k].term];
        n.innerHTML = h;
        node.append(n);
      }
      
			document.body.prepend(node);
      
		}
	}
	
	xhttp.open("GET", "/api/text/json", true);
	xhttp.send();

}


function see_selected() {
  const checkboxes = document.querySelectorAll('input[name=select]:checked')
  var tag_list = [];
  for( var i in checkboxes ) {
    if( checkboxes[i].value )
      tag_list.push(checkboxes[i].value)
  }
  console.log(tag_list)

  window.location = '/timeseries/?timespan=14400&tags='+tag_list.join(',');
}
