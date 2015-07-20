#!/usr/local/bin/node

var api = require("./api.js")
var config = require("config")
var db = require("./db.js")
var moment = require('moment')
var exec = require('child_process').exec


var key = false,
	apiRequests = 0,
	totalApiRequests = 0
	apiRequestsAry = [0]
	totalRecords = 0;


var opts = {
    logDirectory: __dirname + '/log',
    fileNamePattern: 'log-<date>.log',
    dateFormat:'YYYY.MM.DD'
};

var log = require('simple-node-logger').createRollingFileLogger( opts );

log.info('[update_item] Starting up script')

//check to makesure we are inside our range of operation
var timeStart = config['API']['timeStart']
var timeEnd = config['API']['timeEnd']
var key
var repeatedId = ""
var repeatedIdCount = 0

//because of the logger we want to exit it and let the logger finish
var exit = function(){
	setTimeout(function(){process.exit()},2000)
}

var checkTime = function(){
	var date = new Date();
	var current_hour = date.getHours();

	if (current_hour >= timeStart && current_hour <= timeEnd ){
		return true
	}else{
		return false
	}

}


//see if this process is running already
var child;

child = exec("ps aux",
   function (error, stdout, stderr) {
      if (stdout.split('update_item_new.js').length > 3){

      	console.log("Already running ",stdout.split('update_item_new.js').length)
		log.info('[update_item] Already running instance count: ', stdout.split('update_item_new.js').length )


      	console.log("Already running")
      	process.exit()
      }
});








if (checkTime()){

	db.getMetadata(function(err,metadata){


		if (err){
			log.info('[update_item] error retriving metadata: ',err)
			exit()
		}else{
			metadata = metadata[0]
			log.info('[update_item] metadata response: ',metadata)

			log.info('[update_item] Starting API connection')


			var startingMoment = moment(metadata.itemLastUpdatedDate,"YYYY-MM-DD")
			

			console.log("-----------------")
			console.log(metadata)
			console.log("-----------------")


			api.init()

			api.authToken(function(keyValue){

				if (keyValue){

					key = keyValue;

					//if that worked then make sure our key stays up to date every 50 min
					setInterval(function(){
						api.authToken(function(keyValue){
							key = keyValue;
							console.log("\nnew key:",key)
							log.info('[update_item] Getting new Key')
						})
					},3000000)

					//if there is a letfover offset start up with that one
					var offset = metadata.itemLastUpdatedOffset


					//lets define a function we can pass as the callback of the api response, so when the data is ready
					var next = function(data){

						log.info('[update_item] Downloaded ' + data['entries'].length + " records")


						var totalRecords = -1
						if (data.total){
							totalRecords = data.total
							console.log("totalRecords:",totalRecords)
						}

						if (data.url){

							log.info('[update_item] ', data.url
						}


						// //find the last id to send back to the server + 1
						offset = offset + (data['entries'].length)



						api.saveData(data,"item");

						//save the current metdata incase we crash or something
						db.updateItemMetadata(metadata.itemLastUpdatedDate,offset, function(){
							log.info('[update_item] Saved metadata: ', metadata.itemLastUpdatedDate, " ", offset, " There are total: ", totalRecords)
						})



						if (data['entries'].length < 50){
							console.log("Looks like it is complete!")
							log.info('[update_item] Looks like it is complete!', data['entries'].length)



							//if the current date is = to the date we are working on then don't ++ the date
							if (metadata.itemLastUpdatedDate == moment().format("YYYY-MM-DD")){

								log.info('[update_item] Looks like we are up to date: ', metadata.itemLastUpdatedDate)
								exit()

							}else{


								//we need to update the metadata doc with the new date and set it here if we need to continue on
								startingMoment.add(1, 'days')
								metadata.itemLastUpdatedDate = startingMoment.format("YYYY-MM-DD")
								offset = 0

								log.info('[update_item] Continuing on to the next day: ', metadata.itemLastUpdatedDate)


								db.updateItemMetadata(metadata.itemLastUpdatedDate,offset, function(){
									log.info('[update_item] Saved metadata: ', metadata.itemLastUpdatedDate, offset)
								})

								api.downloadRecent(metadata.itemLastUpdatedDate + "T00:00:00Z",metadata.itemLastUpdatedDate + "T23:59:59Z",key,'items','createdDate',offset,next);


							}
							

						}else{

						
							//make sure it is not past bed time
							if (checkTime()){

								var lastTime = data['entries'][data['entries'].length-1]['createdDate']

								console.log(repeatedId, "~~", data['entries'][data['entries'].length-1]['id'])

								if (repeatedId!= data['entries'][data['entries'].length-1]['id'] ){
									repeatedId = data['entries'][data['entries'].length-1]['id']
								}else{
									repeatedIdCount++
									if (repeatedIdCount > 5){
										log.info('[update_item] Looks like we are in a download loop repeated id: ', repeatedId)
										exit()
									}
								}

								//we want to stay in this day range, but change the start time to the last update returned for this day
								api.downloadRecent(metadata.itemLastUpdatedDate + "T00:00:00Z",metadata.itemLastUpdatedDate + "T23:59:59Z",key,'items','createdDate',offset,next);

							}else{

								log.info('[update_item] It is past our bed time, stoping the script. ', repeatedId)

								exit()

							}

						}



					}

					log.info('[update_item] First one: ', metadata.itemLastUpdatedDate)

					//the first request, it is the date starting at midnight
					api.downloadRecent(metadata.itemLastUpdatedDate + "T00:00:00Z",metadata.itemLastUpdatedDate + "T23:59:59Z",key,'items','createdDate',offset,next);




				}else{
					console.log("Error authorizing and retriving token. Make sure your credentials are set in the config file.")
				}
			});


		}
		
		

	})


}else{

	log.info('[update_item] Not in run window: between', timeStart, " and ", timeEnd )


}




