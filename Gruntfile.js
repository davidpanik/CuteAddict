module.exports = function(grunt) {
	// configure the tasks
	grunt.initConfig({
		"compress": {
			"main": {
				"options": {
					"archive": "app.zip"
				},
				"files": [
					{expand: true, cwd: 'src/', src: ['**'], dest: ''}
				]
			}
		},
	
		"phonegap-build": {
			"main": {
				"options": {
					"archive": "app.zip",
					"appId": "780918",
					"isRepository": false,
					"user": {
						"email": "david_storey@yahoo.com",
						"password": "monkey17"
					}
				}
			}
		},
		
		"cssmin": {
			combine: {
				files: {
					'dist/css/master.css': ['src/css/reset.css', 'src/css/main.css']
				}
			}
		},
		
		"uglify": {
			options: {
				mangle: false
			},
			my_target: {
				files: {
					"dist/js/master.min.js": ["src/js/*.js", "src/js/vendor/*.js"]
				}
			}
		},
		
		copy: {
			main: {
				files: [
					{expand: true, cwd: 'src/', src: ["**", "!js/**", "!css/**"], dest: 'dist/'}
				]
			}
		},
		
		clean: ["dist"]
	});

	// load the tasks
	grunt.loadNpmTasks("grunt-contrib-compress");
	grunt.loadNpmTasks("grunt-phonegap-build");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-clean");

	// TODO Delete unwanted files
	// TODO New compress task
	// TODO New PhoneGap submit task
	
	// define the tasks
	grunt.registerTask("default", ["compress", "phonegap-build"]);
	
	grunt.registerTask("release", ["cssmin", "uglify", "copy", "compress", "phonegap-build"]);
};