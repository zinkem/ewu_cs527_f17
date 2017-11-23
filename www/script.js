function init(){
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange=function(){
		if(this.readyState == 4 && this.status == 200){
			var node = document.createElement("div");
			node.innerHTML = xhttp.responseText;
			document.body.appendChild(node);
		}
	}
	
	xhttp.open("GET", "api/foo", true);
	xhttp.send();
}