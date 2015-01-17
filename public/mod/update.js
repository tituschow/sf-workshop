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
			new Element('div', { id: 't' + this.elementID }).insert(
				new Element('p').update(text)).insert(
				new Element('div', { class: 'approval' }).insert(
					new Element('a', { href: '#', class: 'icon-approve'} )).insert(
					new Element('a', { href: '#', class: 'icon-deny'} ))
				));
		$('topics').insert(topicDiv);
		this.elementID++;
	},
	getTopic: function(elementID) {
		return this.topics[elementID];
	}
});

var topicManager = new TopicManager();

var parseIcon = function(element) {
	var approved = (element.className.substring(5) === 'approve') ? true : false;
	var elementID = element.parentNode.parentNode.id.substring(1);
	return {
		approved: approved,
		element: elementID
	}
}

var submitted = io.connect('/submit'),
	approve = io.connect('/approved'),
	authorized = false;

submitted.on('connect_failed', function(reason) {
	console.error('Unable to connect to "submitted"', reason);
});
submitted.on('connect', function() {
	console.log('Connected to submitted socket!');
	submitted.on('unverified', function(data) {
		console.dir(data);
		if(data instanceof Array) {
			for (var i = data.length - 1; i >= 0; i--) {
				topicManager.addTopic(data[i].timestamp, data[i].group, data[i].message);
			}
		} else {
			topicManager.addTopic(data.timestamp, data.group, data.message);
		}
	});
});

approve.on('connect_failed', function(reason) {
	console.error('Unable to connect to "approved"', reason);
});
approve.on('connect', function() {
	console.log('Connected to approval socket!');
	approve.on('authorized', function(data) {
		console.log('recieved authorization boolean');
		console.log(data);
		if(data.authorized === "true") {
			console.log('authorized!');
			authorized = true;
			$('footer').fade();
		} else {
			new Effect.Shake('code');
			new Effect.Highlight('code', {
				duration: 2.0,
				startcolor: '#F86C6C',
				endcolor: '#ffffff',
				restorecolor: '#ffffff'
			});
		}
	})
})

document.observe('dom:loaded', function() {
	$('submitCode').observe('submit', function(event) {
		event.preventDefault();
		approve.emit('authentication', {
			'code': $('code').getValue()
		});	
	});
	$('topics').on('click', 'a[class^="icon-"]', function(event, element) {
		event.preventDefault();
		if(authorized) {
			var approvalData = parseIcon(element);
			var topic = topicManager.getTopic(approvalData.element);
			$('t' + approvalData.element).parentNode.fade({ duration: 0.3 });
			console.dir(topic);
			approve.emit('approved', {
				timestamp: topic.timestamp,
				group: topic.group,
				message: topic.text,
				approved: approvalData.approved
			});
		}
	});
});

(function() {
	var columns = Math.round(document.viewport.getWidth()/350);
	$('topics').setStyle({
		'-webkit-column-count': columns
	});
})();

(function() {
	if(document.URL.toQueryParams().m !== undefined) {
		document.styleSheets[0].addRule('.approval', 'font-size: 130% !important');
		document.styleSheets[0].addRule('.approval a[class^="icon-"]', 'padding: 5px');
		document.styleSheets[0].addRule('.approval a.icon-deny', 'margin-left: 10px');
	}
})();