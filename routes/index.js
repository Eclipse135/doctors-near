var request = require('request');


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
