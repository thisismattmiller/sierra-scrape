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
				bibLastUpdatedDate : datetime,
				bibLastUpdatedOffset: 0,
				itemLastUpdatedDate : datetime,
				itemLastUpdatedOffset : 0

			}

			collection.insert(baseData, function(err, result) {

				db.close()
			})
		});

	});	


}


exports.getMetadata = function(cb){

	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('meta')		
		collection.find({name : "metadata"}).toArray(function(err, docs) {
			db.close()
			cb(err,docs)
		});
	});	
}





exports.updateBibMetadata = function(date,offset,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('meta')
		collection.update({ name : "metadata" }
			, { $set: { bibLastUpdatedDate : date, bibLastUpdatedOffset : offset } }, function(err, result) {
			if (cb) cb(result);
		})

	})

}



exports.updateBibRecord = function(bib,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('bib')
		collection.update({ _id : bib.id }
			, { $set: bib }, function(err, result) {
			db.close()
			if (cb) cb(err,result);
		})

	})

}


exports.insertBibRecord = function(bib,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('bib')
		collection.insert(bib, function(err, result) {
			if (cb) cb(err,result);
			db.close()
		})
	})
}








exports.updateItemMetadata = function(date,offset,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('meta')
		collection.update({ name : "metadata" }
			, { $set: { itemLastUpdatedDate : date, itemLastUpdatedOffset : offset } }, function(err, result) {
			if (cb) cb(result);
		})
	})
}



exports.updateItemRecord = function(item,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('item')
		collection.update({ _id : item.id }
			, { $set: item }, function(err, result) {
			db.close()
			if (cb) cb(err,result);
		})

	})

}


exports.insertItemRecord = function(item,cb){
	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('item')
		collection.insert(item, function(err, result) {
			if (cb) cb(err,result);
			db.close()
		})
	})
}


exports.returnBib = function(id,cb,db){


	//if a db is already active 
	if (db){

		var collection = db.collection('bib')		
		collection.find({_id : id}).toArray(function(err, docs) {
			cb(err,docs)
		});

	}else{

		MongoClient.connect(mongoConnectURL, function(err, db) {
			var collection = db.collection('bib')		
			collection.find({_id : id}).toArray(function(err, docs) {
				db.close()
				cb(err,docs)
			});
		});	

	}




}


exports.allItems = function(cb){



	MongoClient.connect(mongoConnectURL, function(err, db) {
		var collection = db.collection('item')


		var cursor = collection.find({}).sort({ $natural: -1 });
		
		cursor.on('data', function(doc) {

			cursor.pause()

			//send the data to the calling function with the cursor

			cb(doc,cursor,db)


		});



		cursor.once('end', function() {
			db.close();
		});




	})


}










