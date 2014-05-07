// Gather all the RSS feeds here
App.Collections.Feed = Backbone.Collection.extend({
	model: App.Models.Feed,

	feedsProcessed: 0,
	feedsFailed:    0,
	
	// Main initialisation function
	process: function() {
		this.feedsProcessed = 0;
		this.feedsFailed    = 0;
		
		// Starting loading each of our models (RSS feeds)
		$.each(this.models, function() {
			this.load();
		});
		
		// Add event listeners
		App.Events.on("Feed:loaded", this.loaded, this);
		App.Events.on("Feed:error",  this.failed, this);
		
		return this;
	},
	
	// An RSS feed loaded okay
	loaded: function() {
		this.feedsProcessed++;
		this.processed();
		
		return this;
	},
	
	// An RSS feed failed to load
	failed: function() {
		this.feedsFailed++;
		this.processed();
		
		return this;
	},
	
	// An RSS feed has been processed (either failed or loaded)
	processed: function() {
		debug("Processed " + this.feedsProcessed + " out of " + this.models.length + " feeds");
		
		// If we have now processed all of our feeds
		if ((this.feedsProcessed + this.feedsFailed) >= this.models.length) {
			if (this.feedsProcessed === 0) // No feeds loaded );
				App.Events.trigger("Feeds:failed");
			else // Otherwise we are good to go
				App.Events.trigger("Feeds:processed");
		}
		
		return this;
	}
});


// Gather all items (articles) from within an RSS feed
App.Collections.Item = Backbone.Collection.extend({
	model: App.Models.Item,
	
	initialize: function() {
		App.Events.on("Item:add", this.add, this);
	},
	
	// Allow us to sort items by age
	comparator: function(item) {
		return item.getAge().minutes;
	},
	
	// Allow us to trim items older than X hours (default: 48)
	trimOld: function(maxAge) {
		maxAge = maxAge ? maxAge : 48;

		this.models = _.filter(this.models, function(item) {
			return (item.getAge().hours < maxAge);
		}, this);
		
		return this;	
	},
	
	// Remove any items that don't have an image set
	trimEmpty: function() {
		this.models = _.filter(this.models, function(item) {
			return (item.get("image") !== "");
		}, this);
		
		return this;		
	}
});