var  request = require('request'),
	 url = require('url'),
	 $ = require('jquery'),
	 jsdom = require('jsdom'),
	 util = require('util');


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

	var postcode = req.params.postcode;
	
	console.log("results for " + postcode);
	
	if(!postcode){
		throw new Error('Postcode is missing!');
	}
	
	if(postcode.indexOf(" ")!=-1){
		res.redirect("/"+postcode.replace(/\s+/g,"-"));
		return;
	}
	
	var postcode = postcode.replace(/\-+/g," "),
		url = "http://mapit.mysociety.org/postcode/"+ postcode.replace(/\s+/g,"");
		
	console.log(postcode);

	request({ uri: url, timeout:10000}, function (error, response, body) {
	
		if (!error && response.statusCode == 200) {
			
			body = JSON.parse(body);
			var easting = Math.round(body.easting/100),
				northing = Math.round(body.northing/100);
			console.log(easting);
			console.log(northing);
		
			url = "http://www.nhs.uk/Scorecard/Pages/Results.aspx?OrgType=1&TreatmentID=0&PageNumber=1&PageSize=0&TabId=31&SortType=1&LookupType=1&LocationType=1&SearchTerm=n44eb&DistanceFrom=5&SortByMetric=0&TrustCode=&TrustName=&DisambiguatedSearchTerm=&LookupTypeWasSwitched=False&MatchedOrganisationPostcode=&MatchedOrganisationCoords=&ServiceIDs=&ScorecardTypeCode=&NoneEnglishCountry=&HasMultipleNames=False&OriginalLookupType=1&ServiceLaunchFrom=&Filters=&TopLevelFilters=";
			url += "&Coords="+northing +"%2c" + easting;
		
			request({ uri: url, timeout:10000 }, function (error, response, body) {

				if (error || response.statusCode !== 200) {
					console.log('Error:' + error);
					res.send(500);
					return;
				}

				jsdom.env({
					html: body,
					scripts: [
					  'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'
					]
				}, function (err, window) {
					var $ = window.jQuery;
			
					// get info
					console.log("scraping...");
			
					var names = $('[headers*="gporganisationheader-0"]'),
						addresses = $('[headers*="gpcoreaddress-1"]'),
						GPs = $('.standard[headers*="gpgenderlanguage-6"]'),
						feedbacks = $('.standard[headers*="gppatientfeedbackrecommend-8"]'),
						satisfactions = $('.standard[headers*="satisfcationoverallcare-10"]'),
						extendedAppointments = $('.standard[headers*="gpextendedappointments-15"]'),
						patients = $('.standard[headers*="gp-registered-list-size-37"]');
						
					var doctors = [];
			
					for(var i = 0; i<names.length; i++){
						doctors.push({
							"name": $(names[i]).text(),
							"address": $.trim($(addresses[i]).text()).replace(/\n/g,"<br/>").replace(/(\+?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d?[ -]?\d?[ -]?\d)/g,"<a href=\"tel:$1\">$1</a>"),
							"GPs": $(GPs[i]).text().replace(/Data not available/, ""),
							"feedback": $(feedbacks[i]).text().replace(/Read\/add comments about this practice/, ""),
							"satisfaction": $(satisfactions[i]).text(),
							"extendedAppointments": $(extendedAppointments[i]).text(),
							"patients": $(patients[i]).text()
						});
					}
					window.close();
					res.render('results', {'location':postcode, 'doctors':doctors});
				});
			});
			
		} else {
		
			console.log("ERROR: Location not found");
			res.send(500);
			
		}
		
		console.log(util.inspect(process.memoryUsage()));
		
	});
};

