// we have a mongo instance running in container named 'mongo'.

// we link that to this container with:
// docker run -d -p 49160:8001 -v ~/Coding/Docker/nodemongo:/nodemongo --name nodemongo --link mongo:alias node node /nodemongo/src/nodemongo.js
//
// So, we have the following env variables:
//
// PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
// HOSTNAME: '24b0106e089d',
// ALIAS_PORT: 'tcp://172.17.0.43:27017',
// ALIAS_PORT_27017_TCP: 'tcp://172.17.0.43:27017',
// ALIAS_PORT_27017_TCP_ADDR: '172.17.0.43',
// ALIAS_PORT_27017_TCP_PORT: '27017',
// ALIAS_PORT_27017_TCP_PROTO: 'tcp',
// ALIAS_NAME: '/nodemongo/alias',
//
// We have a console.log(process.env), so you can check the above local variables with 
// docker logs nodemongo

var express = require('express'),
    app = express(),
    cons = require('consolidate'),
    MongoClient = require('mongodb').MongoClient;

console.log( process.env );

app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

var mongohost = process.env.ALIAS_PORT || 'mongodb://localhost:27017';
mongohost = mongohost.replace('tcp:', 'mongodb:') + '/docker';
console.log('MongoHost: ', mongohost);

MongoClient.connect(mongohost, function(err, db) {

	app.get('/', function(req, res){
		res.render('badRequest');
	});

	app.get('/:name', function(req, res){

	    // Find one document in our collection
	    db.collection('people').findOne({name: req.params['name']}, function(err, doc) {

	        if(err) throw err;
	        if (!doc) {
	        	return res.render('notfound', {name: req.params['name']});
	        }
	        res.render('hello', doc);
	    });
	});

	app.get('*', function(req, res){
	    res.send('Page Not Found', 404);
	});

	app.listen(8001);
});
