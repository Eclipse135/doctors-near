// node samples/sample.js
var csv = require('csv');
var fs = require('fs');

var postcodes = {};

var getPostcodes = function(){

	console.log('Getting postcodes... ');
			
	csv()
	.fromPath(__dirname+'/resources/postcodes.csv')
	.on('data',function(data,index){

		if(index === 0)
			return;
			
		postcodes[data[0]] = {'easting':  Math.round(data[3]/100),
							  'northing': Math.round(data[4]/100)};

	})
	.on('end',function(count){
	
		var stream = fs.createWriteStream("resources/postcodeCoords.json");
		stream.write(JSON.stringify(postcodes));
		console.log('Done getting postcodes, total: '+count);
	})
	.on('error',function(error){
		console.log(error.message);
	});
}

getPostcodes();
