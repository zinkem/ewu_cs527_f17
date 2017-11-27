function init() {
  var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange=function(){
		if(this.readyState == 4 && this.status == 200){

      var data = JSON.parse(xhttp.responseText);

      var rank = [];

      console.log(data);
      
      for( k in data.channels ){
        var users = data.channels[k];
        
        var num_users = Object.keys(users).length;
        console.log(k + ' ' + num_users);
        rank.push({
          term: k,
          users: num_users
        });
      }
      rank.sort((a, b) => {
        return b.users - a.users;
      });

      var node = document.createElement("div");
      node
      for( k in rank ){
        var n = document.createElement("div");
        var h = '';
        h += '<input type="checkbox" name="select" value="'+rank[k].term+'"/>';
        h += '<a href="/hashtags/?tag='+rank[k].term+'">See</a>    ';
        h += '<span style="padding-right:75px">'+ rank[k].term + "</span>" + rank[k].users;
        n.innerHTML = h;
        node.append(n);
      }
			document.body.appendChild(node);
      
		}
	}
	
	xhttp.open("GET", "/api/members", true);
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
