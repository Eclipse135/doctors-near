// node samples/sample.js
var csv = require('csv');
var fs = require('fs');

var writeViews = function(countries){

	console.log("writing views");
	
	var stream = fs.createWriteStream("views/countries.jade");
	
	for(country in countries){
	
		stream.write("a(href=\"/browse/" + country + "\") " + country + "\n");
		
		var countryStream = fs.createWriteStream("views/countries/"+country+".jade");
		
		for (region in countries[country]){
		
			countryStream.write("a(href=\"/browse/" + country + "/"+ region + "\") " + region + "\n");
			
			var regionStream = fs.createWriteStream("views/countries/"+country+"/"+ region + ".jade");
			
			for (town in countries[country][region]){
			
				for (postcode in countries[country][region][town]){
			
					regionStream.write("a(href=\"/" + postcode + "\") " + postcode + "\n");
				
				}
							
			}
			
		}
	}
};

var countries = {};

var oldCountry = "";

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
	var town = data[5];
	if (!countries[country][region][town]){
		console.log("  " + town);
		countries[country][region][town] = {};
	}
	var postcode = data[0];
	if (!countries[country][region][town][postcode]){
		console.log("   " + postcode);
		countries[country][region][town][postcode] = postcode;
	}
})
.on('end',function(count){
	console.log('Number of lines: '+count);
	writeViews(countries);
})
.on('error',function(error){
	console.log(error.message);
});
