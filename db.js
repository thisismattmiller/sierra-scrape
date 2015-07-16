//this module works with the datastore to do things~

var MongoClient = require('mongodb').MongoClient,
	config = require("config")


var exports = module.exports = {}

var mongoConnectURL = config['DB']['mongoConnectURL']


exports.createBaseMetadata = function(datetime){

	//delete the existing metadata
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('meta')
		collection.remove({ name : "metadata" }, function(err, result) {
			var baseData = {

				name : "metadata",
				bibLastCreatedDate : datetime,
				bibLastUpdatedDate : datetime,
				itemLastCreatedDate : datetime,
				itemLastUpdatedDate : datetime
			}

			collection.insert(baseData, function(err, result) {
				console.log(result.result)
				db.close()
			})
		});

	});	


}


exports.getMetadata = function(cb){


	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('meta')
		
		collection.find({name : "metadata"}).toArray(function(err, docs) {


			cb(docs);
			db.close()

		});

		



	});	



}

