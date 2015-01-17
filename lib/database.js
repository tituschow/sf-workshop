var mongoose = require('mongoose'),
	db = mongoose.connect('mongodb://localhost/workshop').connection;

var topicSchema = mongoose.Schema({
	timestamp: Number,
	group: String,
	message: String,
	approved: Boolean
});

topicSchema.methods.toMessage = function() {
	return {
		timestamp: this.timestamp,
		group: this.group,
		message: this.message
	};
}

topicSchema.methods.approve = function(approved) {
	this.approved = approved;
}
var Topic = mongoose.model('Topic', topicSchema);

exports.Topic = Topic;