// Template helper function
var getTemplate = function(id) {
	return _.template($(id).html());
};

// Sets content to match screen dimensions
var dynamicDimensions = function() {
	// Set content to fill width/height
	$(".fullWidth").width($(window).width());
	$(".fullHeight").height($(window).height());
	
	// Work out best font-size to use
	var
		targetWidth   = 800,
		targetHeight  = 480,
		modifier      = 0.2;
		widthPercent  = ($(window).width()  / targetWidth)  * 100,
		heightPercent = ($(window).height() / targetHeight) * 100,
		newFontSize   = (widthPercent > heightPercent) ? widthPercent : heightPercent;
	
	newFontSize *= modifier;
	
	if (newFontSize < 20) newFontSize = 20; // Enforce a minimum size
	
	$("body").css("font-size", parseInt(newFontSize) + "%");
};

// Control loading animation
var Loading = {
	active: true,
	
	hide: function() {
		$("#loading").hide();
		this.active = false;
	},
	
	show: function() {
		$("#loading").show();
		this.active = true;
	}
};

var AboutScreen = {
	active: false,
	
	hide: function() {
		if (Loading.active) return false;

		$("#content").show();
		$("#about").hide();
		
		AboutScreen.active = false;
	},
	
	show: function() {
		if (Loading.active) return false;

		$("#content").hide();
		$("#help").hide();
		$("#about").show();

		if (ga) ga("send", "pageview", {"page": "/about"});
		
		AboutScreen.active = true;
	},
	
	toggle: function() {
		if (Loading.active) return false;

		if (AboutScreen.active)
			AboutScreen.hide();
		else
			AboutScreen.show();
	}
};

var ErrorScreen = {
	active: false,
	
	hide: function() {
		ErrorScreen.active = false;
	},
	
	show: function() {
		$("#error").show();
		$("#content").hide();
		$("#help").hide();
		$("#about").hide();
		$("#loading").hide();

		if (ga) ga("send", "pageview", {"page": "/error"});
		
		ErrorScreen.active = true;
	}
};

var HelpScreen = {	
	show: function() {
		if (store("helpScreenShown") === "true") return false;
		
		$("#help").show();
		
		if (ga) ga("send", "pageview", {"page": "/help"});
		
		Hammer(
			$("#help")[0]
		)
		.on("touch",  function(event) { event.preventDefault(); HelpScreen.hide();  });
	},
	
	hide: function() {
		store("helpScreenShown", "true");

		$("#help").remove();
	}
};

var backButton = function() {
	if (Loading.active) quitApp(); // Still loading
	else if (AboutScreen.active) AboutScreen.hide(); // Viewing about screen
	else if ($(".itemDetail.active").length > 0) $(".itemDetail.active").removeClass("active"); // Viewing item detail
	else quitApp(); // Normal view
};

var quitApp = function() {
	navigator.app.exitApp();
};

// Debug helper
var debug = function(str) {
	if (window.console)
		console.log(str);
};

// Local storage helper
var store = function(name, value) {
	if (!window.localStorage) return false;
	
	if (value) {
		localStorage.setItem(name, value);
	} else {
		return localStorage.getItem(name);
	}
};