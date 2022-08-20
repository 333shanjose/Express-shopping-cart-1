const mongoClient=require('mongodb').MongoClient
const status={
    db:null
}
module.exports.connect=function(done){
    const url="mongodb://localhost:27017"
    const dbname="shopping"

 mongoClient.connect(url,(err,data)=>{
 if(err) return done(err)
 status.db=data.db(dbname)
 
 done()

 })
}
module.exports.get=function(){
    return status.db;
}