var conf = require('./conf.json'),
	express = require('express'),
	app = express(),
	io = require('socket.io').listen(app.listen(conf.port)),
	MongoStore = require('connect-mongo')(express),
	db = require('./lib/database.js'),
	cookie = require('cookie'),
	parseSignedCookie = require('connect').utils.parseSignedCookie,
	sessionStore = new MongoStore(conf.db);

//app.set('env', 'development');

app.configure(function() {
	app.use(express.cookieParser());
	app.use(express.session({
		secret: conf.secret,
		key: conf.key,
		cookie: {maxAge: 86400000},
		store: sessionStore,
		secret: conf.secret
	}));	
	app.use('/', express.static(__dirname + '/views'));
	app.use('/static', express.static(__dirname + '/public'));
	io.set('log level', 2);
});

app.configure('development', function() {
	app.use(express.errorHandler());
	app.set('view cache', false);
});

io.set('authorization', function(handshake, accept) {
	if(handshake.headers.cookie) {
		handshake.cookies = cookie.parse(handshake.headers.cookie);
		var sessionID = parseSignedCookie(handshake.cookies['group'], conf.secret);
		sessionStore.load(sessionID, function(err, session) {
			if(err || !session) {
				return accept('error', false);
			} else {
				handshake.session = session;
				return accept(null, true);
			}
		});
	} else {
		return accept('No cookie transmitted.', false)
	}
});

/*String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}*/

//main connection
var main = io.of('/submit')
	.on('connection', function(socket) {
		db.Topic.find({approved: false}).sort('-timestamp').exec(function(err, topics) {
			socket.emit('unverified', topics);
		});

		var generateID = function() {
			return socket.handshake.cookies['group'].hashCode();
		}
		var group = socket.handshake.session.group;
		if(group === undefined) {
			socket.handshake.session.group = socket.handshake.cookies['group'].substring(3, 15);
			socket.handshake.session.save();
			group = socket.handshake.session.group;
		}

		db.Topic.find({group: group}).sort('-timestamp').exec(function(err, topics) {
			socket.emit('previous', topics);
		});

		//var group = socket.handshake.cookies['group'];
		socket.on('unverified', function(data) {
			console.dir(data);
			var unverifiedTopic = new db.Topic({
				timestamp: Date.now(),
				group: group,
				message: data.message,
				approved: false
			});
			unverifiedTopic.save();
			socket.broadcast.emit('unverified', unverifiedTopic.toMessage());
		});
	});

//approved messages
var approved = io.of('/approved')
	.on('connection', function(socket) {
		db.Topic.find({approved: true}).sort('-timestamp').exec(function(err, topics) {
			socket.emit('approved', topics);
		});
		var parseApprovals = function() {
			socket.on('approved', function(data) {
				console.log(data);
				if(data.approved) {
					db.Topic.findOneAndUpdate({timestamp: data.timestamp, group: data.group}, {approved: true}, function(){});
					socket.broadcast.emit('approved', {
						timestamp: data.timestamp,
						group: data.group,
						message: data.message
					});
				}
			});
		}
		if(socket.handshake.session.authorized !== undefined && socket.handshake.session.authorized === true) {
			socket.emit('authorized', { 'authorized': 'true' });
			parseApprovals();
		} else {
			socket.on('authentication', function(data) {
				if(data.code == conf.password) {
					socket.handshake.session.authorized = true;
					socket.handshake.session.save();
					console.log('editor authorized');

					socket.emit('authorized', { 'authorized': 'true' });
					parseApprovals();
				} else {
					socket.emit('authorized', { 'authorized': 'false' });
				}
			});
		}
	});