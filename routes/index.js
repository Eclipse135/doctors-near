var request = require('request'),
 url = require('url');


/*
 * GET home page.
 */

exports.index = function(req, res){
	
	request('http://www.nhs.uk/servicedirectories/Pages/ServiceSearch.aspx', function (error, response, body) {
		if (!error && response.statusCode == 200) {
			res.render('index', {'body':body});
		}
	})

};

exports.search = function(req, res){
	var requestObj = {method: "POST",
					  url:'http://www.nhs.uk/servicedirectories/Pages/ServiceSearch.aspx',
					  form: req.body,
					  followRedirect: false};
	request(requestObj, function (error, response, body) {
	console.log("statusCode: " + response.statusCode);
		if (!error && response.statusCode == 302) {
			console.log("Location: " + response.headers.location);
			res.redirect(response.headers.location.replace("/Scorecard/Pages",""));
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
