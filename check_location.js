#!/usr/local/bin/node

var db = require("./db.js")

var counter = 0


db.allItems(function(doc,cursor,mongoConnection){

	process.stdout.clearLine()
	process.stdout.cursorTo(0)
	process.stdout.write( counter + "" )

	counter++

	if (doc.location){

		if ( ['sla01','sla0f','sla0n','sla0v','slafn'].indexOf(doc.location.code)  > -1){


			if (doc.bibIds[0]){
				

				db.returnBib(doc.bibIds[0],function(err,docs){

					if (docs[0]){
						console.log("--->",doc.location.code, doc.location.name, docs[0].id, docs[0].title)
					}
					
					cursor.resume()

				}, mongoConnection)

				

			}


		}else{

			cursor.resume()

		}

	}else{
		cursor.resume()
	}

	





})

