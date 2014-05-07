// An RSS feed
App.Models.Feed = Backbone.Model.extend({
	defaults: {
		"title": "Dealspwn",
		"url":   "http://feeds.dealspwn.com/Dealspwn?format=rss", // RSS URL
		"home":  "http://www.dealspwn.com/",                      // Homepage of feed
		"icon":  "http://g.etfv.co/http://www.dealspwn.com/"      // Favicon
	},
	
	validate: function(attrs) {
		if (!attrs.title || $.trim(attrs.title) === "") {
			return "Title cannot be empty";
		}
		
		if (!attrs.url || $.trim(attrs.url) === "") {
			return "URL cannot be empty";
		}
		
		if (!attrs.home || $.trim(attrs.home) === "") {
			return "Home cannot be empty";
		}
		
		if (!attrs.icon || $.trim(attrs.icon) === "") {
			return "Icon cannot be empty";
		}
	},
	
	// Load in the feed's content
	load: function() {
		var self = this;
		
		$.ajax({
			url: this.get("url"),
			timeout: 4000,
			success: function(data) {
				// Parse RSS
				$.each($(data).find("item"), function() {
					App.Events.trigger(
						"Item:add",
						{
							"source": self.get("title"),
							"icon":   self.get("icon"),
							"home":   self.get("home"),
							"title":  $(this).find("title").text(),
							"desc":   $(this).find("encoded").length ? $(this).find("encoded").text() : $(this).find("description").text(),
							"date":   new Date($(this).find("pubDate").text()),
							"link":   $(this).find("link").text(),
							"data":   this
						}
					);
				});
				
				// Parse Atom
				$.each($(data).find("entry"), function() {
					App.Events.trigger(
						"Item:add",
						{
							"source": self.get("title"),
							"icon":   self.get("icon"),
							"home":   self.get("home"),
							"title":  $(this).find("title").text(),
							"desc":   $(this).find("summary").text(),
							"date":   new Date($(this).find("updated").text()),
							"link":   $(this).find("link").attr("href"),
							"data":   this
						}
					);
				});

				debug("Feed loaded " + self.get("url"));
				App.Events.trigger("Feed:loaded");
			},
			error: function(data, error) {
				debug("Feed error " + self.get("url"));
				App.Events.trigger("Feed:error", data);
			}
		});
	
		return this;
	}
});


// An item/article within an RSS feed
App.Models.Item = Backbone.Model.extend({
	defaults: {
		"source": "",
		"icon":   "",
		"home":   "",
		"title":  "",
		"desc":   "",
		"date":   "",
		"time":   "",
		"link":   "",
		"image":  "",
		"data":   {}
	},
	
	initialize: function() {
		this
		.makeTime()
		.trimTitle()
		.extractImage()
		;
	},
	
	// Work out the age of this item
	getAge: function() {
		var now = new Date();
		var diff = Math.abs(this.get("date").getTime() - now.getTime());
		
		return {
			minutes: Math.floor(diff / (1000 * 60)),
			hours:   Math.floor(diff / (1000 * 60 * 60)),
			days:    Math.floor(diff / (1000 * 60 * 60 * 24))
		};
	},
	
	// Turn the item's age into a nice string
	makeTime: function() {
		var age = this.getAge();

		if (age.days > 2)
			this.set("time", age.days + " days ago");
		if (age.days > 1)
			this.set("time", age.days + " day ago");
		else if (age.hours > 1)
			this.set("time", age.hours + " hours ago");
		else if (age.hours > 0)
			this.set("time", age.hours + " hour ago");
		else if (age.minutes > 2)
			this.set("time", age.minutes + " minutes ago");
		else
			this.set("time", "Just now");
		
		return this;
	},
	
	// Ensure the item's title isn't too long
	trimTitle: function() {
		var maxLength = 140;

		var title = this.get("title");
		
		if (title.indexOf("brinkeg") > -1) title = title.substring(0, title.indexOf("brinkeg")); // Special match for weird Cute Overload "brinkeg" thing
		
		title = (title.length > maxLength) ? title.substring(0, maxLength) + "&#8230;" : title; // Trim title if need be
		
		this.set("title", title);
		
		return this;
	},
	
	// Attempt to parse an image URL from the item's content
	extractImage: function() {
		function replaceAll(find, replace, str) {
			return str.replace(new RegExp(find, 'g'), replace);
		}
		
		// Search through a bunch of HTML to find the first image tag
		function findImage(obj) {
			if (typeof(obj) === "undefined" || obj === "")
				return "";
			else {
				if (obj.indexOf("http") === 0)
					return obj;
				else {
					obj.replace("<![CDATA[", "").replace("]]>", ""); // Strip cdata tags
					obj = $("<p>" + obj + "</p>"); // Turn this into jQuery so we can search it
					
					if (obj.find("img").length > 0)
						return obj.find("img").first().attr("src"); // Then take the first one
					else
						return "";
				}
			}		
		}

		// Certain images we will never want to show (like share or comments images)
		function imageToBlock(obj) {
			var blacklist = ["feedburner.com", "twitter.png", "comments"];
			
			for (var x in blacklist) {
				if (obj.indexOf(blacklist[x]) > -1) return true;
			}
			
			return false;
		}
		
		// First of all check for YouTube videos to extract a thumbnail for
		if (this.get("desc").indexOf("youtube.com/embed/") > -1 || this.get("desc").indexOf("youtube.com/v/") > -1) {
			var id = this.get("desc");
			
			// Identify start of a YouTube ID
			if (id.indexOf("youtube.com/embed/") > -1) id = id.substring(id.indexOf("youtube.com/embed/") + 18);
			if (id.indexOf("youtube.com/v/"    ) > -1) id = id.substring(id.indexOf("youtube.com/embed/") + 14);
			
			// Identify end of a YouTube ID
			if (id.indexOf("?")  > -1 && id.indexOf("?")  < 15) id = id.substring(0, id.indexOf("?"));
			if (id.indexOf("\"") > -1 && id.indexOf("\"") < 15) id = id.substring(0, id.indexOf("\""));
			if (id.indexOf("'")  > -1 && id.indexOf("'")  < 15) id = id.substring(0, id.indexOf("'"));
			
			this.set("image", "http://img.youtube.com/vi/" + id + "/hqdefault.jpg"); // Build the YouTube thumbnail URL
		}
		
		// If we still don't have an image URL - try each of these different nodes in turn
		if (this.get("image") === "") this.set("image", findImage($(this.get("data")).find("thumbnail").last().attr("url")));
		if (this.get("image") === "") this.set("image", findImage($(this.get("data")).find("encoded").text()));
		if (this.get("image") === "") this.set("image", findImage($(this.get("data")).find("content").text()));
		if (this.get("image") === "") this.set("image", findImage($(this.get("data")).find("enclosure").last().attr("url")));
		if (this.get("image") === "") this.set("image", findImage(this.get("desc")));
		
		if (imageToBlock(this.get("image"))) this.set("image", ""); // Avoid certain images
		
		debug("Image extracted " + this.get("image"));
		
		return this;
	}
});