var config = require("config")
var request = require('request');
var fs = require('fs')

var exports = module.exports = {};


//just make sure the data directory is there on startup
exports.init = function(){
	try {
		fs.mkdirSync("./data/");
	} catch(e) {
		if ( e.code != 'EEXIST' ) throw e;
	}


}


exports.authToken = function(cb){

	//uses the basic auth method to ask for the token
	request.post(config['API']['base'] + "token", {
			'auth': {
				'user': config['API']['key'],
				'pass': config['API']['secret']
		}
	},

	function (error, response, body) {

		if (!response){
			console.log("Error: Make sure you set the correct base path to the API.")
			process.exit()
		}


		if(response.statusCode == 200){
			cb(JSON.parse(body)['access_token'])
		} else {
			console.log(response)
			console.log('error: '+ response.statusCode)
			cb(false)
		}
    })



}



exports.downloadRecent = function(timeStart,timeEnd,token,type,field,offset,cb){



	//build the URL we are only intrested in non-deleted records, all possible fields from this endpoint
	var url = config['API']['base'] + type + "?" + field + "=[" + timeStart + "," + timeEnd + "]" + "&deleted=false"  + "&fields=default,fixedFields,varFields" + "&limit=50&offset="+offset   

	console.log(url)
	//use the bearer auth token
	request.get(url , {
			'auth': {
				'bearer': token
		}
	},

	function (error, response, body) {

      if(response.statusCode == 200){
      	//parse and send to the callback funtion
        var data = JSON.parse(body)
        cb(data);
      } else {
        console.log('error: '+ response.statusCode)
        console.log("URL:", url)
        console.log(body)

        console.log('last id:', id)
        process.exit()
      }
    })




}

exports.downloadData = function(id,token,type,cb){


	if (typeof type == 'function'){
		//overwrite the type with cb since no type was provided
		var cb = type
		var type = 'bibs/?'

	}else if (type == 'bibs'){
		var type = 'bibs/?'	

	}else if (type == 'items'){
		var type = 'items/?'
	}

	//build the URL we are only intrested in non-deleted records, all possible fields from this endpoint
	var url = config['API']['base'] + type + "id=[" + id + ",]" + "&deleted=false"  + "&fields=default,fixedFields,varFields" + "&limit=" + config['API']['perRequest']



	//use the bearer auth token
	request.get(url , {
			'auth': {
				'bearer': token
		}
	},

	function (error, response, body) {

      if(response.statusCode == 200){
      	//parse and send to the callback funtion
        var data = JSON.parse(body)
        cb(data);
      } else {
        console.log('error: '+ response.statusCode)
        console.log("URL:", url)
        console.log(body)

        console.log('last id:', id)
        process.exit()
      }
    })


}

//simply write the data passed to a file in the data dir
exports.saveData = function(data,type){

		if (!type){
			type = ""
		}else{
			type = type + "_"
		}


		filename = data['entries'][data['entries'].length-1]['id'] + ".json"

		fs.writeFile(__dirname + "/data/" + type + filename, JSON.stringify(data), function(err) {
			if(err) {
				console.log("Error: could not write file")
				console.log(err)
			}
		});


}

