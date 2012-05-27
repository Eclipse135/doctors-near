var  request = require('request'),
	 url = require('url'),
	 $ = require('jquery');


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

	var url = 'http://www.nhs.uk/Scorecard/Pages'+req.url;
	console.log("url: " + url);
	request(url, function (error, response, body) {
		console.log("statusCode: " + response.statusCode);
		res.render('index', {'body':body});
	})
};
