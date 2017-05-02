// Setting up node.js functionality
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
fs = require('fs');

app.use(bodyParser.urlencoded({ extended: true })); 
// Displays the homepage
app.get('/', function (req, res) {
	displayForm(res);
});
// When the form is submitted on the homepage, the algorithm is executed using the form's data and results are displayed
app.post('/metro', function (req, res){
	var from = req.body.from;
	var to = req.body.to;
	var transfers = req.body.dropdown;
	executeAlgorithm(from, to, res, transfers);
});
// Sets up the page to listen at port 8080
app.listen(8080, function () {
  console.log('Server running at http://127.0.0.1:8080/');
});
// Function that displays the homepage
function displayForm(res) {
    fs.readFile('betterform.html', function (err, data) {
        res.write(data);
        res.end();
    });
}
// Algorithm calculates the optimal route using Djikstra's algorithm
function executeAlgorithm(from, to, res, transfers){
	// Creates a transfer weight based on the preferences entered
	var transferWeight=0;
	if(transfers==='dontmind'){
		transferWeight=2;
	}
	else if(transfers==='dontlikeit'){
		transferWeight=4;
	}
	else if(transfers==='hateit'){
		transferWeight=8;
	}
	fs.readFile('fichiers_dm_pw6/metro_graphe.edges', 'utf8', function (err,data) {
	  if (err) {
	    return console.log(err);
	  }
	  var newData = data.split(/\s+/g);
	  neighbors = new Array(383);
	  // Loop to fill in neighbors 2D array, with each cell corresponding to one metro station and holding an array of the station's neighbors and weights
	  for(var i=0; i<newData.length; i+=3){
	  	var stationNumber=parseInt(newData[i]);
	  	var previousNeighbors=new Array();
	  	previousNeighbors=neighbors[stationNumber];
	  	if(previousNeighbors==null){
	  		if(parseInt(newData[i+2])===2){
	  			neighbors[stationNumber]=[[parseInt(newData[i+1]), transferWeight]];
	  		}
	  		else{
	  			neighbors[stationNumber]=[[parseInt(newData[i+1]), parseInt(newData[i+2])]];
	  		}
	  	}
	  	else{
	  		if(parseInt(newData[i+2])===2){
	  			neighbors[stationNumber]=neighbors[stationNumber].concat([[parseInt(newData[i+1]), transferWeight]]);
	  		}
	  		else{
	  			neighbors[stationNumber]=neighbors[stationNumber].concat([[parseInt(newData[i+1]), parseInt(newData[i+2])]]);
	  		}
	  	}
	  }
	  stations = new Array();
	  // Puts stations into array
	  fs.readFile('fichiers_dm_pw6/metro_graphe.labels', 'utf8', function (err,data) {
	  	if (err) {
		  return console.log(err);
		}
		var names = data.split("\n");
		for(var i=0; i<names.length; i++){
			var space=names[i].indexOf(" ");
			stations[i]=names[i].substring(space+1);
		}
		// Executes algorithm and displays the results
		var path=DjikstraNames(from, to);
		displayPath(from, to, path, res);
	  });
	});
}
// Writes an html form with css that displays the webpage with the optimal path written
function displayPath(from, to, path, res){
	res.writeHead(200, {"Content-Type" : "text/html"});
	res.write("<head> <meta charset='utf-8'> <style> { margin: 0; padding: 0; box-sizing: border-box; -webkit-box-sizing: border-box; -moz-box-sizing: border-box; } body { font-family: 'Roboto', Helvetica, Arial, sans-serif; font-weight: 100; font-size: 12px; background: url('//i0.wp.com/bonplangratos.fr/wp-content/media/Plan-metro-paris-RATP-mini.jpg?ssl=1') no-repeat center center fixed; background-size: cover; }  .container { max-width: 400px; width: 30%; position: absolute; background: #F9F9F9; padding: 25px; box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.2), 0 5px 5px 0 rgba(0, 0, 0, 0.24); left: 50%; transform: translateX(-50%); translateY(100px) } P { text-align: center } #button { text-align: center; } </style> </head>");
	res.write("<body>");
	res.write('<div class="container">');
	if(path==='undefined'){
		res.write('One or more of your metro stations does not exist');
		res.write('<br>');
	}
	else{
		var previous_station;
		for (var i=0; i<path.length; i++){
			var keepWriting=true;
			if(path[i]===previous_station){
				if(path[i]===from || path[i]===to){
					keepWriting=false;
				}
				else{
					res.write('<p> <i> TRANSFER METRO LINES </i> </p>');
				}
			}
			if(keepWriting){
				res.write('<p>');
				res.write(path[i]);
				res.write('</p>');
				previous_station=path[i];
			}

		}
	}
	res.write('<form id="button" action="http://localhost:8080" method="get"> <input type="submit" value="Plan another route" /> </form>');
	res.write('</div>');
	res.write("</body>");
	res.end();
}
// Helper function that converts names entered to indicies in an array, including error checking 
function DjikstraNames(source, target){
	var newSource = stations.indexOf(source);
	var newTarget = stations.indexOf(target);
	if(newSource===-1 || newTarget === -1 || source==='' || target===''){
		return 'undefined';
	}
	else{
		return DjikstraNumbers(newSource, newTarget);
	}
}
// Function that performs Djikstra's algorithm given 2 array indices representing metro stations
function DjikstraNumbers(source, target){
	distance=[];
	previous=[];
	unvisited=new Set();
	for (var i=0; i<neighbors.length; i++){
		distance[i]=100000;
		unvisited.add(i);
	}
	distance[source]=0;
	while(unvisited.size>0){
		var leastDistanceNode = findSmallestDistance();
		if(leastDistanceNode==target){
			return getStationNames(target);
			break;
		}
		unvisited.delete(leastDistanceNode);
		var nodeNeighbors = neighbors[leastDistanceNode];
		for (var i = 0; i < nodeNeighbors.length; i++){
			var neighborNumber = parseInt(nodeNeighbors[i][0]);
			if(unvisited.has(neighborNumber)){
				var edgeLength = parseInt(nodeNeighbors[i][1]);
				var altDistance = distance[leastDistanceNode] + edgeLength;
				if(altDistance<distance[neighborNumber]){
					distance[neighborNumber]=altDistance;
					previous[neighborNumber]=leastDistanceNode;
				}
			}
		}
	}
}
// Helper function that finds the station in the array with the smallest weight
function findSmallestDistance(){
	var minimum=100000;
	var node=-1;
	unvisited.forEach(function(item){
		if(distance[item]<=minimum){
			minimum=distance[item];
			node=item;
		}
	})
	if(node==-1){
		console.log("this should never happen");
	}
	return node;
}
// Helper function that returns an array of the station names in the shortest path given the target index
function getStationNames(target){
		var numberPath = findPath(target);
		var stationPath = new Array();
		for (var i=0; i<numberPath.length; i++){
			stationPath=stationPath.concat(stations[numberPath[i]]);
		}
		return stationPath;
}
// Helper function that returns an array of station indicies in shortest path given target index
function findPath(target){
	var numberPath = new Array();
	var node = target;
	while(typeof previous[node] !== 'undefined'){
		numberPath = [node].concat(numberPath);
		node = previous[node];
	}
	numberPath = [node].concat(numberPath);
	return numberPath;
}

