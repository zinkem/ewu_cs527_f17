function init() {
  var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange=function(){
		if(this.readyState == 4 && this.status == 200){

      var data = JSON.parse(xhttp.responseText);

      var rank = [];

      console.log(data.total_docs);
      for( k in data.term ){
        var idfval = Math.log(data.total_docs/data.doc[k]) * data.term[k];
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
        h += '<a href="/hashtags/?tag='+rank[k].term+'">See</a>    ';
        h += rank[k].term + " " + rank[k].idf;
        n.innerHTML = h;
        node.append(n);
      }
      
			document.body.prepend(node);
      
		}
	}
	
	xhttp.open("GET", "/api/text/json", true);
	xhttp.send();

}
