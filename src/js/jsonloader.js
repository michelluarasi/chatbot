//load json content from spreadsheet
//then convert them in json object adapted for the chat bot.
var JsonLoader = (function(){

	var JsonLoader = function() {


		//File infos
		this.bot;
		this.bot_length 		= 5;
		this.total_length 		= this.bot_length;
		this.count 				= 0;
		this.key 				= '1FfS0Z38143gG5ktu-KgrSxFlPnllw7_SMg13I7MXfj4';
		//1FfS0Z38143gG5ktu-KgrSxFlPnllw7_SMg13I7MXfj4 = german
		//12g3hKtPXVXiJ_uiemGKtve4ngvX44tGONGPDAcxzK-0 = english

		//JSON Personal DB related objects
		this.bot_db 					= {};
		this.bot_variables 				= {};
		this.bot_content 				= {};
		this.bot_medias 				= {};
		this.bot_user_questions 		= {};
		this.bot_special_structure 		= {};


		this.jsons		= [];
		this.sheets 	= [];
		this.theSheet;
		this.local 		= localStorage;

	};


	JsonLoader.prototype = {

		init: function(){
			console.log('JsonLoader.js initiated');
			this.start();
		},

		start: function(){
			this.generate_links(this.bot, this.bot_length);
			this.load_spreadsheets();
		},


		//retrieve the spreadsheet file.
		//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		//IMPORTANT IMPORTANT IMPORTANT IMPORTANT IMPORTANT IMPORTANT IMPORTANT
		//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		//
		//1. this function should be different according
		//to the language of the user
		//
		//2. for better loading performances and the safety of the chat experience, it could be nice for
		//the live version of the chat to have the files saved locally.
		//
		generate_links: function(src, length){

			for(var i = 1; i <= length; i++){
				var thisLink = "https://spreadsheets.google.com/feeds/list/"+ this.key +"/"+i+"/public/values?alt=json";

				//push the links in the same array (which will be used in load_spreadsheets)
				this.jsons.push(thisLink);
			}
		},


		//load via ajax the file
		load_spreadsheets: function() {
			for(var i = 0; i < this.jsons.length; i++){
				var thisJSON = this.jsons[i];
				var self = this;
				$.ajax({
					type: 'GET',
					url: thisJSON,
					dataType: 'json',
					error: function(data){
						console.log('loading error');
					},
					success: function(data) {

						//On success get title and content
						//then send to pushTo()
						this.theSheet = data;
						var title = data.feed.title.$t;
						var content = data.feed.entry;
						var thisSheet = [title, content];

						self.pushTo(thisSheet, self.sheets);
					}
				});
			}
		},


		//Wait that all the JSON files are loaded,
		//then launch sendToStructure
		//@param {obj} src - the JSON datas
		//@param {obj} dest - equal to this.sheets which contains all the content
		pushTo: function(src, dest){

			//Stock datas in this.sheets
			dest.push(src);

			//test if all the files are ready according to this.total_length
			if (dest.length == this.total_length){
				this.sendToStructure(dest);
			}
		},


		//Send the content to the right function by testing its name.
		//Need this function because each sheets have little bit different structure
		//@param {obj} src - all the content
		sendToStructure: function(src){
			for(var i = 0; i < src.length; i++){
				switch (src[i][0]) {
					case 'variables':
						this.set_variables(src[i][1], 'variables');
						break;
					case 'user_questions':
						this.set_questions(src[i][1], 'user_questions');
						break;
					case 'content':
						this.set_content(src[i][1], 'content');
						break;
					case 'medias':
						this.set_medias(src[i][1], 'medias');
						break;
					case 'special_structure':
						this.set_special_str(src[i][1], 'special_structure');
						break;
					default:
						console.log('none');
						return false;
				}
			}
		},


		//Simplify the JSON from the sheet variables_db
		//@param {obj} src - the datas
		//@param {string} name - the name of the future JSON object which will
		//contains the optimized JSON from this sheet for the chat
		set_variables: function(src, name){
			var variables = [];

			//saving content in variables
			$.each(src, function( key, val ) {
				var item 			= [];
				var references 		= val.gsx$references.$t;
				var content  		= val.gsx$content.$t;


				//extend the saved content in arrays
				item.push(references, content);
				variables.push(item);
			});


			//ready extend content to a new json object
			var object 		= {};
			var self 		= this;


			//create the object
			$.each(variables, function(index){
				var key 	=  variables[index][0];
				var obj 	= {};
				obj[key] 	= {
					content  	: variables[index][1]
				}


				// extend the content in the object
				// and attribute this.personal_variables_db
				$.extend(object, obj);
				this.bot_variables = object;


				//once all the variables are okay,
				//extend the object to the global object.
				if(index >= variables.length - 1){
					self.extendGlobal(this.bot_variables, self.bot_db, name);
				}
				index++;
			});
		},


		//Simplify the JSON from the sheet medias
		//@param {obj} src - the datas
		//@param {string} name - the name of the future JSON object which will
		//contains the optimized JSON from this sheet for the chat
		set_medias: function(src, name){
			var variables = [];

			//saving content in variables
			$.each(src, function( key, val ) {
				var message 		= [];
				var ref 			= val.gsx$reference.$t;
				var type 			= val.gsx$type.$t;
				var url 			= val.gsx$url.$t;
				var title 			= val.gsx$titlemedia.$t;
				var sub 			= val.gsx$subtitlemedia.$t;
				var thumbnail 		= val.gsx$thumbnail.$t;


				//extend the saved content in arrays
				message.push(ref, type, url, title, sub, thumbnail);
				variables.push(message);
			});


			//ready extend content to a new json object
			var object = {};
			var self = this;


			//create the object
			$.each(variables, function(index){
				var key = variables[index][0];
				var obj = {};
				obj[key] = {
					type 		: variables[index][1],
					url 		: variables[index][2],
					title 		: variables[index][3],
					sub 		: variables[index][4],
					thumbnail 	: variables[index][5]
				}


				// extend the content in the object
				// and attribute this.personal_variables_db
				$.extend(object, obj);
				this.bot_medias = object;


				//once all the variables are okay,
				//extend the object to the global object.
				if(index >= variables.length - 1){
					self.extendGlobal(this.bot_medias, self.bot_db, name);
				}
				index++;
			});
		},


		//Simplify the JSON from the sheet user_questions
		//@param {obj} src - the datas
		//@param {string} name - the name of the future JSON object which will
		//contains the optimized JSON from this sheet for the chat
		set_questions: function(src, name){
			var variables = [];

			//saving content in variables
			$.each(src, function( key, val ) {
				var message 		= [];
				var ref 			= val.gsx$references.$t;
				var tag 			= val.gsx$tag.$t;
				var question 		= val.gsx$questions.$t;
				var redirection 	= val.gsx$redirections.$t;


				//extend the saved content in arrays
				message.push(ref, tag, question, redirection);
				variables.push(message);
			});


			//ready extend content to a new json object
			var object = {};
			var self = this;


			//create the object
			$.each(variables, function(index){
				var key = variables[index][0];
				var obj = {};
				obj[key] = {
					tag : variables[index][1],
					question : variables[index][2],
					redirect : variables[index][3]
				}


				// extend the content in the object
				// and attribute this.personal_variables_db
				$.extend(object, obj);
				this.bot_user_questions = object;


				//once all the variables are okay,
				//extend the object to the global object.
				if(index >= variables.length - 1){
					self.extendGlobal(this.bot_user_questions, self.bot_db, name);
				}
				index++;
			});
		},


		//Simplify the JSON from the sheet special_structure
		//@param {obj} src - the datas
		//@param {string} name - the name of the future JSON object which will
		//contains the optimized JSON from this sheet for the chat
		set_special_str: function(src, name){
			var variables = [];


			//saving content in variables
			$.each(src, function( key, val ) {
				var message = [];
				var ref 	= val.gsx$reference.$t;
				var msg1 	= val.gsx$msg1.$t;
				var msg2 	= val.gsx$msg2.$t;


				//extend the saved content in arrays
				message.push(ref, msg1, msg2);
				variables.push(message);
			});


			//ready extend content to a new json object
			var object 		= {};
			var self 		= this;


			//create the object
			$.each(variables, function(index){
				var key 	= variables[index][0];
				var obj 	= {};
				obj[key] 	= {
					msg1 : variables[index][1],
					msg2 : variables[index][2],
					redirect: 'employee_db'
				}


				// extend the content in the object
				// and attribute this.personal_variables_db
				$.extend(object, obj);
				this.bot_special_structure = object;


				//once all the variables are okay,
				//send the content to be cleaned
				//(because of the possible empty cells of the spreadsheets)
				if(index >= variables.length - 1){
					self.clean_str(this.bot_special_structure, self.bot_db, name);
				}
				index++;
			});
		},


		//Remove empty cells from content like clean_db but on smaller structure.
		//@param {obj} src 	- the content
		//@param {obj} dest 	- where the content is going to be saved after be cleaned
		//@param {string} name - the name of the object
		clean_str: function(src, dest, name){
			$.each(src, function(key, block){
				$.each(block, function(key, content){
					if (content === "" || content === null){
						delete block[key];
					}
				});
			});
			//everything is clean now, can extend the content to the final object.
			this.extendGlobal(src, dest, name);
		},


		//Simplify the JSON from the sheet content
		//@param {obj} src - the datas
		//@param {string} name - the name of the future JSON object which will
		//contains the optimized JSON from this sheet for the chat
		set_content: function(src, name){
			var variables = [];

			//saving content in variables
			$.each(src, function( key, val ) {
				var message 			= [];
				var ref 				= val.gsx$topicreference.$t;
				var tag 				= val.gsx$tag.$t;
				var msg_01_bot 			= val.gsx$botmsg1.$t;
				var msg_02_bot 			= val.gsx$botmsg2.$t;
				var msg_03_bot 			= val.gsx$botmsg3.$t;
				var msg_04_bot			= val.gsx$botmsg4.$t;
				var msg_05_bot			= val.gsx$botmsg5.$t;
				var answer_01 			= val.gsx$answer1.$t;
				var answer_01_redirect 	= val.gsx$answer1redirect.$t;
				var answer_02 			= val.gsx$answer2.$t;
				var answer_02_redirect 	= val.gsx$answer2redirect.$t;
				var answer_03 			= val.gsx$answer3.$t;
				var answer_03_redirect 	= val.gsx$answer3redirect.$t;
				var answer_04 			= val.gsx$answer4.$t;
				var answer_04_redirect 	= val.gsx$answer4redirect.$t;
				var callbackmsg 		= val.gsx$callbackmsg.$t;
				var callback_1 			= val.gsx$callbackanswer1.$t;
				var callback_2 			= val.gsx$callbackanswer2.$t;

				//extend the saved content in arrays
				message.push(ref, tag, msg_01_bot, msg_02_bot, msg_03_bot, msg_04_bot, msg_05_bot, answer_01, answer_01_redirect, answer_02, answer_02_redirect, answer_03, answer_03_redirect, answer_04, answer_04_redirect, callbackmsg, callback_1, callback_2);
				variables.push(message);

			});


			//ready extend content to a new json object
			var object = {};
			var self = this;


			//create the object
			$.each(variables, function(index){

				if(variables[index][1] == ''){
					variables[index][1] = 'other';
				}

				var key = variables[index][0];
				var obj = {};
				obj[key] = {
					tag: {
						tag: variables[index][1]
					},
					messages : {
						msg_01_bot 			: variables[index][2],
						msg_02_bot 			: variables[index][3],
						msg_03_bot 			: variables[index][4],
						msg_04_bot 			: variables[index][5],
						msg_05_bot 			: variables[index][6]
					},
					answers : {
						answer_01: {
							answer   		: variables[index][7],
							answer_redirect : variables[index][8]
						},
						answer_02: {
							answer   		: variables[index][9],
							answer_redirect : variables[index][10]
						},
						answer_03: {
							answer   		: variables[index][11],
							answer_redirect : variables[index][12]
						},
						answer_04: {
							answer   		: variables[index][13],
							answer_redirect : variables[index][14]
						}
					},
					callback: {
						messages: {
							msg_01_bot 		: variables[index][15]
						},
						answers: {
							answer_01: {
								answer   		: variables[index][16],
								answer_redirect : 'reaction_positive'
							},
							answer_02: {
								answer   		: variables[index][17],
								answer_redirect : 'reaction_negative'
							}
						}
					}
				}


				// extend the content in the object
				// and attribute this.personal_variables_db
				$.extend(object, obj);
				this.bot_content = object;


				//once all the variables are okay,
				//send content to be cleaned
				if(index >= variables.length - 1){
					self.clean_db(this.bot_content, self.bot_db, name);
				}
				index++;
			});
		},


		//What the fuck is this ? Well it basically remove the empty objects
		//from some sheets before send them to the final object.
		//It's uncool but it works and we need to avoid getting empty messages
		//@param {obj} src 	- the content
		//@param {obj} dest 	- where the content is going to be saved after be cleaned
		//@param {string} name - the name of the object
		clean_db: function(src, dest, name){

			//add the "seen" args to each topic's blocks.
			var seen = {seen : false};


			//loop in JSON Structure to find empty messages cells and remove them
			$.each(src, function(key, block){

				if(block.messages.msg_01_bot == '' || block.messages.msg_01_bot == null){
					delete src[key];
				}
				$.each(block, function(key, value){
					if (value.msg_01_bot === "" || value.msg_01_bot === null){
						delete block[key];
					}
					else {
						$.each(value, function(key, content){
							if (content === "" || content === null){
								delete value[key];
							}
							if (content.answer === "" || content.answer === null){
								delete value[key];
							}
						});
					}
				});
			});
			$.each(src, function(key, block){
				$.each(block, function(key, value){
					$.extend(block, seen);
					var count = Object.keys(value).length;
					if(count == 0){
						delete block[key];
					}
				});
			});

			//adding tag end to last block of the topic to make sure the bot send the end of the chat at the right time.
			var previous, current;
			var currentblock, previousblock;
			var prevlength, curlength;
			var prev3, cur3;

			var total = 0;
			var index = 0;

			var end = {end : true};

			$.each(src, function(){
				total++;
			});

			$.each(src, function(key, block){
				previous = current;
				previousblock = currentblock;
				current = key;
				currentblock = block;
				index++;
				//console.log(previous, current);

				if(previous != undefined){
					prevlength = previous.length;
				}
				curlength = current.length;
				//console.log(prevlength, curlength);

				if(previous != undefined){
					prev3 = previous[previous.length - 3];
				}
				cur3 = current[current.length - 3];
				//console.log(prev3, cur3);


				if(previous != undefined && cur3 != prev3){
					//console.log(previous, 'was end.');
					$.extend(previousblock, end);
				}

				if(index == total){
					//console.log(current, 'was end.');
					$.extend(currentblock, end);
				}



			});

			//everything is clean now, can extend the content to the final object.
			this.extendGlobal(src, dest, name);
		},


		//Once all the JSON has been optimized and cleaned, save it in the
		//localStorage as a string
		//@param {obj} src 	- the content
		//@param {obj} dest 	- where the content is going to be saved after be cleaned
		//@param {string} name - the name of the object
		//@return the content of the localStorage
		extendGlobal: function(src, dest, name){
			dest[name] = src;
			this.local.setItem('content', JSON.stringify(this.bot_db));
			this.count++;
			if(this.count == this.total_length){
				return this.local;
			}
		}
	};
	return JsonLoader;
})();
