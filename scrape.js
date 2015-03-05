var api = require("./api.js")
var config = require("config")

var key = false,
	apiRequests = 0,
	totalApiRequests = 0
	apiRequestsAry = [0]
	totalRecords = 0;

api.init()

api.authToken(function(keyValue){

	if (keyValue){
		
		key = keyValue;

		//if that worked then make sure our key stays up to date every 50 min
		setInterval(function(){
			api.authToken(function(keyValue){
				key = keyValue;
			})
		},3000000)


		//lets keep track of how many requests per min we do
		setInterval(function(){
			apiRequestsAry.push(apiRequests)
			apiRequests = 0
		},60000)




		var next = function(data){

			//process the results

			//find the last id to send back to the server + 1
			var lastId = parseInt(data['entries'][data['entries'].length-1]['id'])

			api.saveData(data);

			if (data['entries'].length < config['API']['perRequest']){
				console.log("Looks like it is complete! Last ID:",lastId)
				process.exit()
			}

			totalRecords=totalRecords+config['API']['perRequest']
			totalApiRequests++
			apiRequests++

			var sum = apiRequestsAry.reduce(function(a, b) { return a + b; });
			var avg = sum / apiRequestsAry.length;



			process.stdout.write("Status: " + totalRecords.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " total records. " + totalApiRequests.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " total requests. " + Math.floor(avg).toString() + " requests per min. " + "Last Id: " + lastId + "\r");

			//recursive requests 
			api.downloadData(String(lastId+1),key,next);




		}


		//the first request, change the start id in the config file
		api.downloadData(config['API']['IdStart'],key,next);




	}else{
		console.log("Error authorizing and retriving token. Make sure your credentials are set in the config file.")
	}
});

