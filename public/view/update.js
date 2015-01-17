var Color = (function(){
	var RATIO = 222.49223595; // 1/phi*360
	var colorIndex = 0;

	return {
		nextColor: function() {
			var h = RATIO*colorIndex % 360;
			colorIndex++;
			return 'hsl(' + h + ', 60%, 70%)';
		}
	}
})();

var GroupMananger = Class.create({
	initialize: function() {
		this.groups = {};
	},
	isRegistered: function(id) {
		if((id in this.groups)) return true;
		return false;
	},
	addGroup: function(id) {
		var color = Color.nextColor();
		this.groups[id] = color;
		document.styleSheets[0].addRule('.g' + id, 'color: ' + color + ' !important');
	}
});

var Topic = Class.create({
	initialize: function(timestamp, group, text) {
		this.timestamp = timestamp;
		this.group = group;
		this.text = text;
	}
})

var TopicManager = Class.create({
	initialize: function() {
		this.elementID = 0;
		this.topics = {};
	},
	addTopic: function(timestamp, group, text) {
		this.topics[this.elementID] = new Topic(timestamp, group, text);
		var topicDiv = new Element('div', {	class: 'topic' }).insert(
			new Element('div', { class: 'g' + group, id: 't' + this.elementID }).insert(new Element('p').update(text))
		);
		$('topics').insert(topicDiv);
		$('t' + this.elementID).scrollIntoView();
		this.elementID++;
	},
	getTopic: function(elementID) {
		return this.topics[elementID];
	}
});

var topicManager = new TopicManager();

var groupMananger = new GroupMananger();

var socket = io.connect('/approved');
socket.on('connect_failed', function(reason) {
	console.error('Unable to connect to a namespace', reason);
});
socket.on('connect', function() {
	console.log('Connected!');
	socket.on('approved', function(data) {
		var addData = function(data) {
			if(!groupMananger.isRegistered(data.group)) groupMananger.addGroup(data.group);
			topicManager.addTopic(data.timestamp, data.group, data.message);
		}
		if(data instanceof Array) {
			for (var i = data.length - 1; i >= 0; i--) {
				addData(data[i]);
			}
		} else {
			addData(data);
		}
	});
});
