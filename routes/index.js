var  request = require('request'),
	 url = require('url'),
	 $ = require('jquery'),
	 jsdom = require('jsdom');



exports.home = function(req, res){

	console.log("home");

	request('http://www.nhs.uk/servicedirectories/Pages/ServiceSearch.aspx', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var $inputs = $("#aspnetForm input[type=hidden], #aspnetForm input[type=Hidden]", body);
			console.log($inputs.length);
			var $inputWrap = $('<div/>').append($inputs);
			var inputHTML = $inputWrap.html();
			res.render('home', {'inputs':inputHTML});
		}
	})
	
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
			
			for(var i =0;i<5;i++){
				doctors.push({
					"name": $(names[i]).text(),
					"address": $.trim($(addresses[i]).text()).replace(/\n/g,"<br/>").replace(/([0-9 ]{6,20})/,"<a href=\"tel:$1\">$1</a>"),
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
