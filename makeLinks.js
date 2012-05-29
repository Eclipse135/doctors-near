// node samples/sample.js
var csv = require('csv');
var fs = require('fs');

var writeViews = function(countries){

	console.log("writing views ...");
	
	var stream = fs.createWriteStream("views/browse.jade");
	
	stream.write("meta(name=\"robots\",content=\"NOINDEX\")\n");
	stream.write("ul.locations\n");
	
	for(country in countries){
			
		for (region in countries[country]){
		
			console.log("region: " + region);
			stream.write("  li\n");
			stream.write("    a(href=\"/browse/" + region + "\") " + region + "\n");
			
			var regionStream = fs.createWriteStream("views/locations/"+ region + ".jade");
			regionStream.write("meta(name=\"robots\",content=\"NOINDEX\")\n");
			regionStream.write("ul.locations\n");
			
			for (postcodeArea in countries[country][region]){
			
				console.log("postcodeArea: " + postcodeArea);
				regionStream.write("  li\n");
				regionStream.write("    a(href=\"/browse/"+ postcodeArea + "\") " + postcodeArea + "\n");
			
				var postcodeView = "";
				
				postcodeView += "meta(name=\"robots\",content=\"NOINDEX\")\n";
				postcodeView += "ul.locations\n";
			
				var postcodes = countries[country][region][postcodeArea];
				
				if (postcodes){
				
					console.log("postcodes: " + postcodes.length);
					for (var i = 0; i < postcodes.length; i++){
						var postcode = postcodes[i];
						postcodeView += "  li\n";
						postcodeView +="    a(href=\"/" + postcode.replace(/^\s+|\s+$/,"").replace(/\s+/g,"-") + "\") Doctors near " + postcode + "\n";
				
					}
				}
				fs.writeFileSync("views/locations/"+ postcodeArea + ".jade", postcodeView);
							
			}
			
			regionStream.end();
			
		}
		
	}
	stream.end();
};

var countries = {};
var postcodes = {};
/*
var getPostcodes = function(){

	csv()
	.fromPath(__dirname+'/resources/postcodes.csv')
	.on('data',function(data,index){

		if(index === 0)
			return;

		var postcode = data[0];
		
		var postcodeArea = postcode.split(" ")[0];
		
		if (!postcodes[postcodeArea]){
			console.log(postcodeArea);
			postcodes[postcodeArea] = [];
		}
			
		postcodes[postcodeArea].push(postcode);

	})
	.on('end',function(count){
		console.log('Number of lines: '+count);
		var jsonPostcodes = JSON.stringify(postcodes);
		
		var stream = fs.createWriteStream("resources/postcodes.json");
		stream.write(jsonPostcodes);
		//getAreas(postcodes);
	})
	.on('error',function(error){
		console.log(error.message);
	});
		
}
*/

var getPostcodes = function(){

	console.log("reading postcodes ...");
	fs.readFile('resources/postcodes.json', function (err, data) {
		var postcodes = JSON.parse(data);
		getAreas(postcodes);
	});

}

var getAreas = function(postcodes){

	console.log("reading postcode area data ...");

	csv()
	.fromPath(__dirname+'/resources/postcode-areas/uk_postcode_05.csv')
	.on('data',function(data,index){

		if(index === 0)
			return;

		var country = data[8];
		if (!countries[country]){
			console.log(country);
			countries[country] = {};
		}
		var region = data[6];
		if (!countries[country][region]){
			console.log(" " + region);
			countries[country][region] = {};
		}
		var postcodeArea = data[0];
		if (!countries[country][region][postcodeArea]){
			console.log("   " + postcodeArea);
			if(postcodes[postcodeArea]){
				countries[country][region][postcodeArea] = postcodes[postcodeArea];
			}
		}
	})
	.on('end',function(count){
		console.log('Number of lines: '+count);
		
		writeViews(countries);
	})
	.on('error',function(error){
		console.log(error.message);
	});

};

getPostcodes();
