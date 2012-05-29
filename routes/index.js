var  request = require('request'),
	 url = require('url'),
	 $ = require('jquery'),
	 jsdom = require('jsdom');



exports.home = function(req, res){

	console.log("home");
	res.render('home');
	
};

exports.about = function(req, res){

	console.log("about");
	res.render('about');
	
};

exports.index = function(req, res){
	
	request('http://www.nhs.uk/servicedirectories/Pages/ServiceSearch.aspx', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			res.render('index', {'body':body});
		}
	})

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

exports.oldSearch = function(req, res){
	
	console.log("search");
	
	var requestObj = {method: "POST",
					  url:'http://www.nhs.uk/servicedirectories/Pages/ServiceSearch.aspx',
					  form: req.body,
					  followRedirect: false};
	request(requestObj, function (error, response, body) {
		console.log("statusCode: " + response.statusCode);
			if (!error && response.statusCode == 302) {
				console.log("Location: " + response.headers.location);
				res.redirect(response.headers.location.replace("/Scorecard/Pages",""));
			} else {
				res.render('index', {'body':body});
			}
		})

};

exports.results = function(req, res){

	console.log("results");
	
	var url = 'http://www.nhs.uk/Scorecard/Pages'+req.url;
	console.log("url: " + url);
	/*
	request(url, function (error, response, body) {
		console.log("statusCode: " + response.statusCode);
		
		var body = $(body).find('body').html();
		
		var removals = $("img, script, link", body);
		console.log(removals.length);
		removals.remove();
		res.render('index', {'body':body});
	})
	*/
	
	request({ uri: url }, function (error, response, body) {

		if (error && response.statusCode !== 200) {
			console.log('Error when contacting google.com')
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
			
			var names = $('[headers*="gporganisationheader-0"]');
			var addresses = $('[headers*="gpcoreaddress-1"]');
			var GPs = $('.standard[headers*="gpgenderlanguage-6"]');
			var feedbacks = $('.standard[headers*="gppatientfeedbackrecommend-8"]');
			var satisfactions = $('.standard[headers*="satisfcationoverallcare-10"]');
			var extendedAppointments = $('.standard[headers*="gpextendedappointments-15"]');
			var patients = $('.standard[headers*="gp-registered-list-size-37"]');
			
			console.log("name: " + $(names[0]).text());
			console.log("address: " + $(addresses[0]).text());
			console.log("GPs: " + $(GPs[0]).text());
			console.log("feedbacks: " + $(feedbacks[0]).text());
			console.log("satisfactions: " + $(satisfactions[0]).text());
			console.log("extendedAppointments: " + $(extendedAppointments[0]).text());
			console.log("patients: " + $(patients[0]).text());
			
			var doctors = [];
			
			for(var i =0;i<names.length;i++){
				doctors.push({
					"name": $(names[i]).text(),
					"address": $.trim($(addresses[i]).text()).replace(/\n/g,"<br/>").replace(/([0-9 -]{6,20})/,"<a href=\"tel:$1\">$1</a>"),
					"GPs": $(GPs[i]).text().replace(/Data not available/, ""),
					"feedback": $(feedbacks[i]).text().replace(/Read\/add comments about this practice/, ""),
					"satisfaction": $(satisfactions[i]).text(),
					"extendedAppointments": $(extendedAppointments[i]).text(),
					"patients": $(patients[i]).text()
				});
			}
			
			$("img, script, link").remove();
			
			var body = $('body').html();
			
			res.render('results', {'doctors':doctors});
		});
	});

};

exports.browse = function(req, res){

	if(req.param('region')){
		res.render('countries/' + req.param('country') + "/"+req.param('region'));
	} else if (req.param('country')){
		res.render('countries/' + req.param('country'));
	} else {
		res.render('countries');
	}

}

exports.restResults = function(req, res){

	var postcode = req.params.postcode,
		url = "http://mapit.mysociety.org/postcode/"+ postcode.replace(/\s/,"");
		
	if(!postcode){
		throw new Error('Postcode is missing!');
	}
	
	console.log(postcode);

	request({ uri: url}, function (error, response, body) {
	
		if (!error && response.statusCode == 200) {
			
			body = JSON.parse(body);
			var easting = Math.round(body.easting/100),
				northing = Math.round(body.northing/100);
			console.log(easting);
			console.log(northing);
		
			url = "http://www.nhs.uk/Scorecard/Pages/Results.aspx?OrgType=1&TreatmentID=0&PageNumber=1&PageSize=0&TabId=31&SortType=1&LookupType=1&LocationType=1&SearchTerm=n44eb&DistanceFrom=5&SortByMetric=0&TrustCode=&TrustName=&DisambiguatedSearchTerm=&LookupTypeWasSwitched=False&MatchedOrganisationPostcode=&MatchedOrganisationCoords=&ServiceIDs=&ScorecardTypeCode=&NoneEnglishCountry=&HasMultipleNames=False&OriginalLookupType=1&ServiceLaunchFrom=&Filters=&TopLevelFilters=";
		
			url += "&Coords="+northing +"%2c" + easting;
		
			request({ uri: url }, function (error, response, body) {

				if (error && response.statusCode !== 200) {
					console.log('Error when contacting google.com')
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
			
					var names = $('[headers*="gporganisationheader-0"]');
					var addresses = $('[headers*="gpcoreaddress-1"]');
					var GPs = $('.standard[headers*="gpgenderlanguage-6"]');
					var feedbacks = $('.standard[headers*="gppatientfeedbackrecommend-8"]');
					var satisfactions = $('.standard[headers*="satisfcationoverallcare-10"]');
					var extendedAppointments = $('.standard[headers*="gpextendedappointments-15"]');
					var patients = $('.standard[headers*="gp-registered-list-size-37"]');
			
					console.log("name: " + $(names[0]).text());
					console.log("address: " + $(addresses[0]).text());
					console.log("GPs: " + $(GPs[0]).text());
					console.log("feedbacks: " + $(feedbacks[0]).text());
					console.log("satisfactions: " + $(satisfactions[0]).text());
					console.log("extendedAppointments: " + $(extendedAppointments[0]).text());
					console.log("patients: " + $(patients[0]).text());
			
					var doctors = [];
			
					for(var i =0;i<names.length;i++){
						doctors.push({
							"name": $(names[i]).text(),
							"address": $.trim($(addresses[i]).text()).replace(/\n/g,"<br/>").replace(/(\+?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d[ -]?\d?[ -]?\d?[ -]?\d)/,"<a href=\"tel:$1\">$1</a>"),
							"GPs": $(GPs[i]).text().replace(/Data not available/, ""),
							"feedback": $(feedbacks[i]).text().replace(/Read\/add comments about this practice/, ""),
							"satisfaction": $(satisfactions[i]).text(),
							"extendedAppointments": $(extendedAppointments[i]).text(),
							"patients": $(patients[i]).text()
						});
					}
			
					$("img, script, link").remove();
			
					var body = $('body').html();
			
					res.render('results', {'location':postcode, 'doctors':doctors});
				});
			});
		} else {
			console.log("ERROR: Location not found");
			res.send(500);
		}
		
	});
};

