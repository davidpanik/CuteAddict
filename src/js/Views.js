// View an individual item (article) from an RSS feed
App.Views.Item = Backbone.View.extend({
	tagName:   "article",
	className: "item fullWidth fullHeight",
	template:  "#itemTemplate",

	initialize: function() {
		this.template = getTemplate(this.template);
		this.model.on("destroy", this.remove, this);
		this.render();
		this.$el.css("transform", "translatex(9999px)"); // This might not work
	},
	
	events: {
		"tap .largeItem":    "toggleDetail",
		"tap .itemDetail": "newWindow"
	},
	
	// Open/close the detail/credit overlay
	toggleDetail: function() {
		debug("Detail toggled");
		
		if (this.$el.find(".itemDetail").hasClass("active"))
			this.hideDetail();
		else
			this.showDetail();
		
		return false;
	},
	
	showDetail: function() {
		this.$el.find(".itemDetail").addClass("active");
		
		return false;
	},
	
	hideDetail: function() {
		this.$el.find(".itemDetail").removeClass("active");
		
		return false;
	},

	// Open a new window in default system browser
	newWindow: function(event) {
		try {
			navigator.app.loadUrl(this.model.attributes.link, { openExternal:true });
		} catch(e) {
			window.open(this.model.attributes.link, "_system", "location=yes");
		}
		
		return false;
	},
	
	destroy: function() {
		this.model.destroy();
	},
	
	// Render item for display
	render: function() {
		debug("Item rendered");

		this.$el.html(this.template(this.model.toJSON())); // Populate HTML template

		var self = this;

		function imageLoader(url, callback) {
			var img = $("<img/>") // Create a temporary image object
			.attr("src", url) // With our desired URL
			.load(function() { // Once it has loaded
				callback(img);
			});
		}

		imageLoader(this.model.get("image"), function(img) {
			self.imgLoaded(img);
		});
		
		this.position(10);
		
		return this;
	},
	
	imgLoaded: function(img) {
		this.$el.addClass("loaded");

		var
			width  = img[0].width,
			height = img[0].height,
			ratio  = width / height;
		
		// If the image is really narrow then we'll display it slightly differently
		if (ratio > 3 || ratio < 0.35) this.$el.addClass("cover");
		
		App.Events.trigger(
			"Item:imageLoaded",
			{}
		);
	},	
	
	remove: function() {
		this.$el.remove();
	},
	
	// Determine where to position this item on screen
	position: function(x) {
		
		
		// Hide items which are definitely off-screen so we don't waste time repainting them
		if (x < -2 || x > 2) {
			this.$el.css("visibility", "hidden");
		} else {
			var newPosition = (x * $(window).width() * -1); // Calculate position
		
			this.$el.css("transform", "translatex(" + newPosition + "px)"); // Set new position using CSS3 transform		
		
			this.$el.css("visibility", "visible");
		}
	}
});


// Overall slider carousel for all items
App.Views.Items = Backbone.View.extend({
	tagName:   "div",
	className: "items",
	
	initialItemsToLoad: 5,
	
	index: 0, // The item currently being viewed
	renderedIndex: 0, // The highest item that we have rendered to screen

	imagesLoaded: 0,
	
	itemViews: [],
	
	slidingInProgress: false,
	
	initialize: function() {
		debug("Items initialize");
		
		this.collection.on("add", this.addOne, this);
		
		// Set the intial renderedIndex (number of items to load in initially)
		this.renderedIndex = this.collection.models.length > this.initialItemsToLoad ? (this.initialItemsToLoad - 1) : this.collection.models.length - 1;
		
		this.render();
		
		var self = this;

		self.slide(0); // Reset the slider
		
		$(window).on("resize", function() {
			self.slide(0); // Reset the slider when the screen is resized or orientation change
		});
		
		this.userInputListeners(); // Listen for user interactions

		// Wait until at least one image has loaded before show the main content
		App.Events.on(
			"Item:imageLoaded",
			function() {
				if (++self.imagesLoaded == self.renderedIndex)
					App.Events.trigger(
						"Item:allImagesLoaded",
						{}
					);
			}
		);
		
		App.Events.on(
			"Item:allImagesLoaded",
			function() {
				// Show the content
				$("#content").show();
				HelpScreen.show();
				dynamicDimensions();
				Loading.hide();
			}
		);
	},
	
	events: {

	},
	
	userInputListeners: function() {
		var self = this;
		
		// Keyboard
		$("body").on("keydown", function(event) {
			if (event.which === 37) self.slideLeft(); // Left arrow pressed
			if (event.which === 39) self.slideRight(); // Right arrow pressed
		});

		Hammer(
			$("#content")[0],
			{
				drag: false,
				swipe_velocity: 0.05
			}
		)
		.on("swipeleft",  function(event) { event.preventDefault(); self.slideLeft();  }) // User swipes left
		.on("swiperight", function(event) { event.preventDefault(); self.slideRight(); }) // User swipes right
		.on("dragleft",   function(event) { event.preventDefault(); }) // Ignore dragging
		.on("dragright",  function(event) { event.preventDefault(); }) // Ignore dragging
		;
		
		// Double-check we're blocking default touch behaviours
		document.addEventListener("touchstart", function (e) { e.preventDefault(); }, false);		
		document.addEventListener("touchmove",  function (e) { e.preventDefault(); }, false);		
		document.addEventListener("touchend",   function (e) { e.preventDefault(); }, false);		
	},
	
	render: function() {
		debug("Items render");
		
		this.$el.empty();
		
		// Add our initial selection of items (don't do all at once to avoid hammering the user's bandwidth)
		for (var x = 0; x < this.renderedIndex; x++)
			this.addOne(this.collection.models[x]);

		$("#content").empty().html(this.$el); // Render carousel to screen
		
		this.slide(0);
		dynamicDimensions(); // Update screen dimensions
		
		return this;
	},
	
	addOne: function(item) {
		var itemView = new App.Views.Item({ model: item });

		this.$el.append(itemView.render().el);
		
		this.itemViews.push(itemView);
		
		dynamicDimensions();
		
		return this;
	},

	slideLeft: function() {
		debug("Slide left");
		
		if (!this.slidingInProgress)
			this.slide(1);
	},
	
	slideRight: function() {
		debug("Slide right");
		
		if (!this.slidingInProgress)
			this.slide(-1);
	},
	
	// Main carousel slide functionality (all used for resetting carousel)
	slide: function(direction) {
		if (direction !== 0) this.$el.find(".active").removeClass("active"); // Turn off any item detail views (if we're actually sliding)

		// If we're not actually moving and just resetting the carousel, then don't do any animation
		if (direction === 0)
			this.$el.addClass("instant");
		else {
			this.$el.removeClass("instant");

			this.index += direction; // Move the carousel in the requested direction

			//this.slidingInProgress = true;
			
			if (this.index < 0) { // We can't slide any further left
				this.index = 0;
				
				App.Events.trigger("Items:hitStart");
				
				// Perform bounce animation
				$(".item").first().addClass("bounceLeft")
				.one("webkitAnimationEnd oanimationend msAnimationEnd animationend", function(e) {
					$(".item").first().removeClass("bounceLeft");
				});
			}
			
			if (this.index > this.collection.models.length - 2) { // We can't slide any further right
				this.index = this.collection.models.length - 2;
				
				App.Events.trigger("Items:hitEnd");
				
				// Perform bounce animation
				$(".item").last().addClass("bounceRight")
				.one("webkitAnimationEnd oanimationend msAnimationEnd animationend", function(e) {
					$(".item").last().removeClass("bounceRight");
				});
			}			
		
			// If we are sliding right, then in the background load another item onto the page
			if (direction === 1) {
				this.renderedIndex++;
				
				// Avoid us going off the end of the items
				if (this.renderedIndex > this.collection.models.length - 1)
					this.renderedIndex = this.collection.models.length - 1;
				else
					this.addOne(this.collection.models[this.renderedIndex]); // Render a new item
			}
		}

		var self = this;
		
		// Now work out where to position all the items
		$.each(this.itemViews, function(x) {
			this.position(self.index - x);
		});
	}
});