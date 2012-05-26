var http = require('http');


/*
 * GET home page.
 */

exports.index = function(req, res){

	var options = {
	  host: 'www.nhs.uk',
	  port: 80,
	  path: '/servicedirectories/Pages/ServiceSearch.aspx'
	};

	http.get(options, function(res) {
		
		res.on('data', function (chunk) {
			console.log('BODY: ' + chunk);
		});
	}).on('error', function(e) {
	  console.log("Got error: " + e.message);
	});

};
