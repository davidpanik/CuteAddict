window.App = {
	Models:       {},
	Views:        {},
	Collections:  {},
	Router:       {},
	
	Events: _.extend({}, Backbone.Events)
};

var feedCollection, itemCollection, itemsView;


var init = function() {
	debug("init");

	// Add hardware button listeners
	document.addEventListener("deviceready", function() {
		document.addEventListener("backbutton", backButton, false);
		document.addEventListener("menubutton", AboutScreen.toggle, false);
	}, false);
	
	// Initialise dynamic content sizing
	dynamicDimensions();
	$(window).on("resize", dynamicDimensions);
	
	// Initialise our collections
	feedCollection = new App.Collections.Feed(feeds);
	itemCollection = new App.Collections.Item();

	feedCollection.process(); // Start aggregatting in feeds
	
	// Once all feeds have been aggregated
	App.Events.on(
		"Feeds:processed",
		function() {
			debug("All feeds processed");
			
			itemCollection
			.trimOld() // Get rid of old items
			.trimEmpty(); // Remove items with no image
			
			itemsView = new App.Views.Items({ collection: itemCollection }); // Create our view
			
			debug("Everything ready to go");
		}
	);
	
	// No feeds loaded
	App.Events.on(
		"Feeds:failed",
		function() {
			debug("All feeds failed");	
			
			ErrorScreen.show();
		}
	);
};

$(document).ready(init); // Let the games begin!