var config = require("config")
var db = require("./db.js")
var exec = require('child_process').exec
var fs = require('fs')
var glob = require('glob')

var opts = {
    logDirectory: __dirname + '/log',
    fileNamePattern: 'log-<date>.log',
    dateFormat:'YYYY.MM.DD'
};

var log = require('simple-node-logger').createRollingFileLogger( opts );

log.info('[update_bib_db] Starting up DB script')

//because of the logger we want to exit it and let the logger finish
var exit = function(){
	setTimeout(function(){process.exit()},2000)
}


//see if this process is running already
var child;

child = exec("ps aux",
   function (error, stdout, stderr) {
      if (stdout.split('update_bib_new_db.js').length > 2){
      	console.log("Already running")
      	process.exit()
      }
});





var updateBibRecord = function(){

	if (!records[0]) {

		//drop the old files
		for (var x in sourceFiles){

			
			log.info('[update_bib_db] Deleting: ', sourceFiles[x])
			fs.unlinkSync(sourceFiles[x]);

		}


		exit()
		return
	}

	var bib = records.shift()
	

	db.updateBibRecord(bib, function(err,result){


		bib['_id'] = bib.id


		if (err){

			log.info('[update_bib_db] Error updating record', bib)
			log.info(err)
			console.log(err)

		}else{

			console.log(result.result)
			if (result.result.n == 0){

				//the record was not found, so we need to insert it
				
				db.insertBibRecord(bib, function(err,result){

					if (err){
						log.info('[update_bib_db] Error inserting record', bib)
						log.info(err)

						console.log(err)
					}else{
						console.log("inserted ",bib.id,result.result)
					}

					updateBibRecord()
				})


			}else{

				console.log("update",bib.id,result.result)
				updateBibRecord()

			}

		}

	})


}









var records = []
var sourceFiles = []

glob('./data/bib_*.json', {}, function (er, files) {

	sourceFiles = files

	log.info("[update_bib_db] Going to update records in ", files.length, " files.")


	console.log("Going to update records in ", files.length, " files.")

	//wait for any pending writes to complete from the download script
	setTimeout(function(){


		for (var file in files){

			file = files[file]

			var content = fs.readFileSync(file);

			content = JSON.parse(content)

			if (content.entries){

				log.info("[update_bib_db] Parsing: ", file)


				for (var x in content.entries){

					records.push(content.entries[x])
				}


			}else{
				log.info("[update_bib_db] Error parsing: ", file)
			}



		}


		log.info("[update_bib_db] Will update/insert ", records, " records.")

		//start the first one
		updateBibRecord()


	},5000)





})






