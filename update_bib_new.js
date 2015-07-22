#!/usr/local/bin/node

var api = require("./api.js")
var config = require("config")
var db = require("./db.js")
var moment = require('moment')
var exec = require('child_process').exec


var key = false

var opts = {
    logDirectory: __dirname + '/log',
    fileNamePattern: 'log-<date>.log',
    dateFormat:'YYYY.MM.DD'
};

var log = require('simple-node-logger').createRollingFileLogger( opts );

log.info('[update_bib] Starting up script')

//check to makesure we are inside our range of operation
var runWindow = config['API']['runWindow']
var repeatedId = ""
var repeatedIdCount = 0

//because of the logger we want to exit it and let the logger finish
var exit = function(){
	setTimeout(function(){process.exit()},2000)
}

//se if the current hour is in our defined run window
var checkTime = function(){
	var date = new Date();
	var currentHour = date.getHours();

	if (runWindow.indexOf(parseInt(currentHour)) == -1 ){
		return false
	}else{
		return true
	}

}


//see if this process is running already
//doing this from cron on the server so 1 = the PS, 2 = the shell script running the cron job, 3 = the node job

var child = exec("ps aux",
   function (error, stdout, stderr) {
      if (stdout.split('update_bib_new.js').length > 3){
      	console.log("Already running ",stdout.split('update_bib_new.js').length)
		log.info('[update_bib] Already running instance count: ', stdout.split('update_bib_new.js').length )
      	console.log("Already running")
      	process.exit()
      }
});

if (checkTime()){


	db.getMetadata(function(err,metadata){

		if (err){
			log.info('[update_bib] error retriving metadata: ',err)
			exit()
		}else{

			metadata = metadata[0]
			log.info('[update_bib] metadata response: ',metadata)

			log.info('[update_bib] Starting API connection')

			var startingMoment = moment(metadata.bibLastUpdatedDate,"YYYY-MM-DD")

			api.init()

			api.authToken(function(keyValue){

				if (keyValue){

					key = keyValue;

					//if that worked then make sure our key stays up to date every 50 min
					setInterval(function(){
						api.authToken(function(keyValue){
							key = keyValue;
							console.log("\nnew key:",key)
							log.info('[update_bib] Getting new Key')
						})
					},3000000)

					//if there is a letfover offset start up with that one
					var offset = metadata.bibLastUpdatedOffset

					//lets define a function we can pass as the callback of the api response, so when the data is ready
					var next = function(data){

						log.info('[update_bib] Downloaded ' + data['entries'].length + " records")


						var totalRecords = -1
						if (data.total){
							totalRecords = data.total
						}

						if (data.url){

							log.info('[update_bib] ', data.url)
						}



						// move the offset ahead based on how many we got back
						offset = offset + (data['entries'].length)

						api.saveData(data,"bib");

						//save the current metdata incase we crash or something
						db.updateBibMetadata(metadata.bibLastUpdatedDate,offset, function(){
							log.info('[update_bib] Saved metadata: ', metadata.bibLastUpdatedDate, " ", offset, " There are total: ", totalRecords)
						})


						//the 50 is hardcoded, optimal number of records to get back
						//if it is less than 50 then we are done with this day and we should move on
						if (data['entries'].length < 50){
							console.log("Looks like it is complete!")
							log.info('[update_bib] Looks like it is complete!', data['entries'].length, " ", metadata.bibLastUpdatedDate)



							var testDate = moment(metadata.bibLastUpdatedDate,"YYYY-MM-DD")
							testDate.add(1, 'days')


							//if the date we are about to increment to is beyond today, stop.
							if (testDate.isAfter(moment().format("YYYY-MM-DD"))){

								log.info('[update_bib] Looks like we are up to date: ', metadata.bibLastUpdatedDate)
								exit()

							}else{


								//we need to update the metadata doc with the new date and set it here if we need to continue on
								startingMoment.add(1, 'days')
								metadata.bibLastUpdatedDate = startingMoment.format("YYYY-MM-DD")
								offset = 0

								log.info('[update_bib] Continuing on to the next day: ', metadata.bibLastUpdatedDate)


								db.updateBibMetadata(metadata.bibLastUpdatedDate,offset, function(){
									log.info('[update_bib] Saved metadata: ', metadata.bibLastUpdatedDate, offset)
								})

								api.downloadRecent(metadata.bibLastUpdatedDate + "T00:00:00Z",metadata.bibLastUpdatedDate + "T23:59:59Z",key,'bibs','updatedDate',offset,next);


							}
							

						}else{

						
							//make sure it is not past bed time
							if (checkTime()){

								if (repeatedId!= data['entries'][data['entries'].length-1]['id'] ){
									repeatedId = data['entries'][data['entries'].length-1]['id']
								}else{
									repeatedIdCount++
									if (repeatedIdCount > 5){
										log.info('[update_bib] Looks like we are in a download loop repeated id: ', repeatedId)
										exit()
									}
								}

								//we want to stay in this day range, but change the start time to the last update returned for this day
								api.downloadRecent(metadata.bibLastUpdatedDate + "T00:00:00Z",metadata.bibLastUpdatedDate + "T23:59:59Z",key,'bibs','updatedDate',offset,next);

							}else{

								log.info('[update_bib] It is past our bed time, stoping the script. ', repeatedId)

								exit()

							}

						}



					}

					log.info('[update_bib] First one: ', metadata.bibLastUpdatedDate)

					//the first request, it is the date starting at midnight
					api.downloadRecent(metadata.bibLastUpdatedDate + "T00:00:00Z",metadata.bibLastUpdatedDate + "T23:59:59Z",key,'bibs','updatedDate',offset,next);




				}else{
					console.log("Error authorizing and retriving token. Make sure your credentials are set in the config file.")
				}
			});


		}
		
		

	})


}else{

	log.info('[update_bib] Not in run window: ', runWindow )
	exit()


}




