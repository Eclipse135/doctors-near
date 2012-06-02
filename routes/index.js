var  request = require('request'),
	 url = require('url'),
	 $ = require('../lib/jquery'),
	 jsdom = require('jsdom'),
	 util = require('util'),
	 csv = require('csv'),
	 fs = require('fs');

if(!String.prototype.trim) {
  String.prototype.trim = function () {
    return this.replace(/^\s+|\s+$/g,'');
  };
}

var postcodes = {},
	telRegex = /\+?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d?[ -]?\d?[ -]?\d/g,
	metresPerMile = 1609;

var getPostcodes = function(){

	fs.readFile('resources/postcodeCoords.json', function (err, data) {
		postcodes = JSON.parse(data);
	});
}

//getPostcodes();

exports.home = function(req, res){

	console.log("home");
	res.render('home');
	
};

exports.about = function(req, res){

	console.log("about");
	res.render('about');
	
};

exports.geolocationToPostcode = function(req, res){
	
	console.log("geolocationToPostcode");
	
	var lat = req.params.lat,
		long = req.params.long;
		
	var url = 'http://www.streetmap.co.uk/streetmap.dll?GridConvert?name='+lat+','+long+'&type=LatLong';
	console.log("url: " + url);
	request(url, function (error, response, body) {
		var postcode = $('td:contains("Nearest Post Code")', body).next('td').text();
		console.log("postcode: " + postcode);
		res.json({'postcode':postcode});
	})
	

};

exports.search = function(req, res){
	
	console.log("search");
	
	res.redirect("/"+req.param("location"));

};

exports.browse = function(req, res){

	console.log("browse");
	
	var location = req.param('location');	
	if(location){
		console.log("location: " + location);
		res.render('locations/' + location);
	} else {
		res.render('browse');
	}
	
	console.log(util.inspect(process.memoryUsage()));

};


exports.restResults = function(req, res){

	var start = Date.now();

	var getDoctors = function(easting, northing){

		console.log("Getting doctors for: " + easting + ", " + northing, Date.now() - start);

		url = "http://www.nhs.uk/Scorecard/Pages/Results.aspx?OrgType=1&TreatmentID=0&PageNumber=1&PageSize=0&TabId=31&SortType=1&LookupType=1&LocationType=1&SearchTerm=n44eb&DistanceFrom=5&SortByMetric=0&TrustCode=&TrustName=&DisambiguatedSearchTerm=&LookupTypeWasSwitched=False&MatchedOrganisationPostcode=&MatchedOrganisationCoords=&ServiceIDs=&ScorecardTypeCode=&NoneEnglishCountry=&HasMultipleNames=False&OriginalLookupType=1&ServiceLaunchFrom=&Filters=&TopLevelFilters=";
		url += "&Coords="+northing +"%2c" + easting;

		request({ uri: url, timeout:10000 }, function (error, response, body) {

			if (error || response.statusCode !== 200) {
				console.log('Error:' + error);
				res.send(500);
				return;
			}

			// get info
			console.log("Scraping", Date.now() - start);
			
			var begin = body.indexOf('<div class="comparison-view">'),
				end = body.indexOf('<div id="ctl00_PlaceHolderMain_MainContent_ctl00_divPagination"') ;
			body = body.substring(begin, end);
						
			var jquery = fs.readFileSync(__dirname+'/../public/js/jquery-1.7.2.min.js').toString();
						
			console.log("Doc loading", Date.now() - start);
			
			var $body = $(body);
			
			console.log("body parsed", Date.now() - start);
			
			var $table = $body.find('#ctl00_PlaceHolderMain_MainContent_ctl00_comparisonView').parent();
					
			console.log("Got table", Date.now() - start);

			var names = $table.find('td[headers*="gporganisationheader-0"]');
			var addresses = $table.find('td[headers*="gpcoreaddress-1"]');
			var GPs = $table.find('td.standard[headers*="gpgenderlanguage-6"]');
			var feedbacks = $table.find('td.standard[headers*="gppatientfeedbackrecommend-8"]');
			var satisfactions = $table.find('td.standard[headers*="satisfcationoverallcare-10"]');
			var extendedAppointments = $table.find('td.standard[headers*="gpextendedappointments-15"]');
			var patients = $table.find('td.standard[headers*="gp-registered-list-size-37"]');
	
			var doctors = [];
		
			console.log("Done scraping: ", Date.now() - start);

			for(var i = 0; i<names.length; i++){
			
				var addressText = $(addresses[i]).text();
				
				console.log(addressText);
				
				var phoneNumbers = telRegex.exec(addressText);
				
				console.log(JSON.stringify(phoneNumbers));
				
				if(phoneNumbers && phoneNumbers.length){
				
					var addressString = addressText.substring(0, phoneNumbers.index).trim(),
						address = addressString.replace(/\n+/g,"<br/>"),
						addressString = addressString.replace(/\n+/g,""),
						distance = Number(addressText.substring(telRegex.lastIndex).replace(" miles away", "")),
						distanceUnits = "mile";
				} else {
				
					phoneNumbers = [];
					
					var addressString = addressText.trim(),
						address = addressString.replace(/\n+/g,"<br/>"),
						addressString = addressString.replace(/\n+/g,""),
						distance = 0,
						distanceUnits = "mile";
				}
					
				if(distance<0.5){
					distance = Math.round(distance*metresPerMile);
					distanceUnits = "metre"
				}
				
				if(distance!=1){
					distanceUnits += "s";
				}
				
				telRegex.lastIndex = 0;
			
				doctors.push({
					"name": $(names[i]).text(),
					"phoneNumbers": phoneNumbers,
					"distance": distance,
					"distanceUnits": distanceUnits,
					"address": address,
					"addressString": addressString,
					"GPs": $(GPs[i]).text().replace(/Data not available/, ""),
					"feedback": $(feedbacks[i]).text().replace(/Read\/add comments about this practice/, ""),
					"satisfaction": $(satisfactions[i]).text(),
					"extendedAppointments": $(extendedAppointments[i]).text(),
					"patients": $(patients[i]).text()
				});
			}
		
			console.log("Done with controller: ", Date.now() - start);

			res.render('results', {'location':postcode, 'doctors':doctors});
					
		});
	};

	var postcode = req.params.postcode;
	
	console.log("results for " + postcode);
	
	if(!postcode){
		throw new Error('Postcode is missing!');
	}
	
	if(postcode.indexOf(" ")!=-1){
		res.redirect("/"+postcode.replace(/\s+/g,"-"));
		return;
	}
	
	var postcode = postcode.replace(/\-+/g," ");
		
	if (postcodes[postcode]){
	
		console.log("got postcode in cache: " + postcode);
	
		var northing = postcodes[postcode].northing,
			easting = postcodes[postcode].easting;
			
		getDoctors(easting, northing);
		
	} else {
	
		console.log("getting postcode co-ords: " + postcode);
		
		var	url = "http://mapit.mysociety.org/postcode/"+ postcode.replace(/\s+/g,"");
	
		request({ uri: url, timeout:10000}, function (error, response, body) {
	
			if (!error && response.statusCode == 200) {
			
				body = JSON.parse(body);
				var easting = Math.round(body.easting/100),
					northing = Math.round(body.northing/100);
				console.log(easting);
				console.log(northing);
				
				getDoctors(easting, northing);
				
			} else {
		
				console.log("ERROR: Location not found");
				res.send(500);
			
			}
		});
				
	};
};

