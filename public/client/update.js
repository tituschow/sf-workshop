var elementIndex = 0;
var addTopic = function(text, emit) {
	var topicDiv = new Element('div', {	class: 'topic' }).insert(
		new Element('div', { id: 't' + elementIndex }).insert(new Element('p').update(text))
	);
	$('topics').insert(topicDiv);
	$('t' + elementIndex).scrollIntoView(true);
	elementIndex++;
	if(emit) {
		socket.emit('unverified', {
			message: text
		});
	}
}

var socket = io.connect('/submit');
socket.on('error', function(reason) {
	console.error('Unable to connect to a namespace', reason);
});
socket.on('connect', function() {
	console.log('Connected!');
	socket.on('previous', function(data) {
		console.dir(data);
		for (var i = data.length - 1; i >= 0; i--) {
			addTopic(data[i].message, false);
		};
	});
});

var animationComplete = true;

Event.observe(window, 'resize', function() {
	if(animationComplete) {
		if(document.viewport.getHeight() < 300 && $('header').visible()) {
			animationComplete = false;
			$('topics').setStyle({
				paddingTop: 0
			});
			$('header').slideUp({ duration: 0.3, afterFinish: function(){ animationComplete = true } });
		}
		if (document.viewport.getHeight() > 300 && !$('header').visible()) {
			animationComplete = false;
			$('topics').setStyle({
				paddingTop: '6em'
			});
			$('header').slideDown({ duration: 0.3, afterFinish: function(){ animationComplete = true } });
		}
	}
});

document.observe('dom:loaded', function() {
	$('submitTopic').observe('submit', function(event) {
		event.preventDefault();
		var text = $('topic').getValue();
		if(text) {
			$('topic').value = '';
			addTopic(text, true);
		}
	});
});

(function() {
	var columns = Math.round(document.viewport.getWidth()/350);
	$('topics').setStyle({
		'-webkit-column-count': columns
	});
})();