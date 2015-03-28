var config = require("config")
var fs = require('fs')

var exports = module.exports = {}


//just make sure the data directory is there on startup
exports.convert = function(){

	var inputDir = config['Dump']['in']
	var outputDir = config['Dump']['out']


	var files = fs.readdirSync(inputDir)

	//var wstream = fs.createWriteStream(outputDir, { flags: 'w'});

	for (var x in files){

		//if (x > 100) break

		var file = files[x]


		var stats = fs.statSync(inputDir + file)


		if (!stats.isDirectory()){

			var path = inputDir + file;

			//there are too many files to do this async on my system
			var data = fs.readFileSync(path, "utf8")

			console.log("("+x+")",path)

			data = JSON.parse(data)
			

			if (data['entries']){

				for (var aBib in data['entries']){

					var bib = data['entries'][aBib]

					var aline = JSON.stringify(bib)


					//wstream.write(aline + '\n')

					fs.appendFileSync(outputDir, aline + "\n");



				}

			}


		}



	}

		

	



}
