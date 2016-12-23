//Main part of the chat.
//Do more or less everything in the conversations
var Chat = (function(){

	var Chat = function(){


		//you will understand them soon.
		this.local 					= localStorage;
		this.allowUserAnswer 		= false;
		this.loop 					= 0;
		this.delay 					= 0;
		this.answer_delay 			= 0;
		this.answered 				= 0;
		this.area_length 			= [];
		this.json 					= {};
		this.previous;
		this.source;
		this.bot_db;
		this.bot_db_json;
		this.length;
		this.topiclength;
		this.greetings;
		this.tag 					= null;
		this.scrolling 				= false;
		this.lastHeight;
		this.usecase;
		this.stop 					= 0;
		this.end 					= false;
		this.ask 					= true;
		this.animationEnd 			= true;
		this.loop 					= 0;
		this.callback 				= false;
		this.news 					= [];
		this.random_redirect		= 0;
		this.lastest 				= [];
		this.suggestionsRedirect 	= null;
		this.istype;
		this.wasend;


		//Possible usecase of the chat (1st + 2nd = 90% of case of use I think)
		this.usecases = ['1st', '2nd', 'specific', 'suggestions'];


		//will contain the data returned by ipinfo.io (called in the main.js)
		this.ipinfo;


		//the following arrays are useful for the function replace()
		//lists of variables to replace in the conversations
		this.replace_localStorage 	= 'username';
		this.replace_answer 		= ['_input', '_area', '_default'];
		this.media_type 			= ['image_link', 'image_simple'];
		this.replace_random = [
			'greets',
			'greeting_extended',
			'intro_question',
			'question_else',
			'answer_more',
			'answer_else',
			'answer_next',
			'name_intro',
			'name_question',
			'name_continue',
			'name_confirm',
			'bot_introsuggest',
			'bot_suggest'
		];
		this.greetings_pos = [
			'greeting_time',
			'greeting_global',
			'greetings_geo'
		];
	}


	Chat.prototype = {


		//Nothing special to say here.
		init: function(){
			console.log('Chat.js initated');
			this.getcontent_db();
		},


		//Retrieve the content which has been loaded with the
		//module jsonloader.js
		getcontent_db: function(){
			this.bot_db 		= localStorage.getItem('content');
			this.bot_db_json 	= JSON.parse(this.bot_db);
			$.extend(this.json, this.bot_db_json);


			//Set chat length
			this.length = this.setlength(8, 13);


			//If we are on a subpage, the chat starts
			//directly with the suggestions input.
			if($('.tamedia_chatbot').hasClass('small_chat')){
				console.log('Suggestions only');
				this.suggestions();
			}


			//Else the chat starts normally
			else {
				this.chooseEntryPoint();
				return this.json;
			}
		},


		//Choose the first messages to send
		chooseEntryPoint: function(){
			var self 		= this;
			var ref_json;


			//User comes for the first time on the website
			//(according to localStorage)
			if(localStorage.returning == 'false'){
				console.log('Usecase: first');


				//set the chat preferences
				//(default on first visit)
				if(this.tag == null){
					console.log('tag preference: unknown yet');
				}
				else {
					console.log('tag preference: ', this.tag);
				}


				//get the number of topics the bot has
				this.topiclength 	= parseInt(this.json.variables.topic_length.content);


				//get value which will be used to define if the bot
				//has a specific greeting or not (i.e for christmas)
				this.greetings 		= this.json.variables.general_greetings.content;


				//define is the bot has a specific greeting or not before
				//then get ready the first block to send


				//the bot has not a specific greeting
				if(this.greetings == 'TRUE'){
					var random 		= this.randomSelection(2);
					var redirect 	= 'content.bot_intro_firstvisit_'+random;
					var intro 		= this.contentTypeOf(redirect);
					intro.seen 		= false;
					this.usecase 	= '1st';
					this.topics(intro);
				}


				//the bot has a specific greetings.
				else {
					console.log('Specific greetings');
					var redirect 	= 'content.bot_intro_specific';
					var intro 		= this.contentTypeOf(redirect);
					intro.seen 		= false;
					this.usecase 	= 'specific';
					this.topics(intro);
				}
			}


			//User already had a chat
			//still according to the localStorage.
			else {
				console.log('Usecase: returning');


				//retrieve the tag of the last topic
				//of the previous conversation from localStorage
				this.tag 	= localStorage.tag;
				console.log('Tag preference: ', this.tag);


				//get the number of topics the employee has
				this.topiclength 	= parseInt(this.json.variables.topic_length.content);



				//Search for new topics (with tags news)
				//Those topics are the priority one to send in the returning case


				//saved content from previous chat.
				this.old = JSON.parse(localStorage.save);


				//comparing the old content with the new one to detect the new topics.
				//The new topics will be send after the greetings and eventually
				//after the callback if there is one.
				$.each(self.json.content, function(key){
					var test = false;
					$.each(self.old.content, function(keyOld){
						if(keyOld == key){
							test = true;
						}
					});


					//there is a new topic
					if(test == false){
						console.log(key, 'is new');


						//Check if it has a tag "news" then push in a specific array
						var newspath 	= 'content.'+key;
						var news 		= self.contentTypeOf(newspath);


						//Does have a tag news.
						if(news.tag != undefined && news.tag.tag == 'news'){
							console.log('and have a tag news');
							self.news.push(key);
						}

						//Does not have a tag news.
						else{
							console.log('but does not have a tag news');
						}
					}
				});


				//Check if there is a callback and retrieve it if true.

				//What is a callback here ?
				//For example in the previous chat, the user received a link
				//message in the chat to go visit the career page (because he asked the bot)
				//So he click on the link and leave the chat
				//when he returns on the chat the bot will remember with the callback
				//that he sent this link to the user and will ask him if he found what
				//he was looking for.
				if(localStorage.callback != ''){
					console.log('There is a callback ready to send');
					this.callback = JSON.parse(localStorage.callback);
				}


				//get value which will be used to define if the user has his own way to greet the user
				this.greetings 		= this.json.variables.general_greetings.content;


				//Send the greetings according to the specific greeting and callback
				//then get ready the content to send.
				if(this.greetings == 'TRUE' && this.callback == false){
					var random 		= this.randomSelection(2);
					var redirect 	= 'content.bot_intro_returning_'+random;
					var intro 		= this.contentTypeOf(redirect);
					intro.seen 		= false;
					this.usecase 	= '2nd';
					this.topics(intro);
					return false;
				}
				else if(this.greetings == 'TRUE' && this.callback != false){
					var redirect 	= 'content.bot_intro_returning_callback';
					var intro 		= this.contentTypeOf(redirect);
					intro.seen 		= false;
					this.usecase 	= '2nd';
					this.topics(intro);
					return false;
				}
				else {
					console.log('Specific greetings');
					var redirect 	= 'content.bot_intro_specific';
					var intro 		= this.contentTypeOf(redirect);
					intro.seen 		= false;
					this.usecase 	= 'specific';
					this.topics(intro);
					return false;
				}
			}
		},


		//Check is topic which is about to be send can be sent or not
		//@param {obj} src - the messages + answers + relatives args as json
		topics: function(src) {


			//redefining default tag if undefined
			//just in case.
			if(src.tag != undefined && src.tag.tag != 'other'){
				this.tag = src.tag.tag;
				console.log('Current tag is:', this.tag);
			}

			if(src.end != undefined){
				this.wasend = true;
			} else {
				this.wasend = false;
			}
			console.log(this.wasend);


			//if the content has not be seen, can be sent.
			if(src.seen === false){
				src.seen 		= true;
				var self 		= this;
				this.greetings 	= false;
				var messages 	= src.messages;


				//add new botcontainer to display messages
				this.getTemplate('#botContainer', '.wrapper-chat');


				//send the message to the replace function
				//which will replace the variables w/ real content
				//then display message
				$.each(messages, function(key, value) {
					self.replace(value, value, src, 'bot');
				});


				//check if user will be able or not to answer (yes 99% of the time.)
				if(src.answers){
					this.getAnswers(src.answers);
				}


				//Update the callback in localStorage
				//if the block of messages has one.
				if(src.callback.messages.msg_01_bot != ''){
					this.getCallback(src.callback);
				}


				//Remove the callback in localStorage if no callback
				if(src.callback.messages.msg_01_bot == ''){
					this.removeCallback();
				}


				//End of the chat.
				else if(this.end == true) {
					console.log('End of chat reached.');
					var random 		= this.randomSelection(2);
					redirect 	= 'content.bot_end_'+random;
					var next 	= this.contentTypeOf(redirect);
					next.seen 	= false;
					this.topics(next);
					return false;
				}

				return false;
			}


			//if the content has been seen already
			else {


				//the bot try to send 50 differents blocks topics,
				//there are all already seen
				this.stop++
				if(this.stop > 50){
					console.log('End of chat because there is no more content.');
					var random 		= this.randomSelection(2);
					redirect 	= 'content.bot_end_'+random;
					var next 	= this.contentTypeOf(redirect);
					next.seen 	= false;
					this.topics(next);
					return false;
				}


				//The bot will try to send a new block topic via content_define()
				else {
					console.log('Already seen, go to content define');
					this.random_redirect--;
					this.content_define();
					this.stop = 0;

				}
			}
		},


		//This function define the content to send when:
		//  - There is no specific redirection in the content
		//	- The content has been already seen.
		content_define: function(){
			var self = this;


			//Increment the number of time
			this.random_redirect++;


			//check for topics blocks with tag "news"
			if(this.news.length != 0){
				console.log('Display news');

				var random 		= this.randomSelection(self.news.length);
				var redirect 	= 'content.' + self.news[random-1];

				var index 		= self.news.indexOf(self.news[random-1]);
				self.news.splice(index, 1);

				var next 		= this.contentTypeOf(redirect);
				next.seen 		= false;
				this.topics(next);
				return false;
			}


			//the chat has reached the end.
			if(this.answered > this.length && this.istype == 'button' && this.wasend == true){
				console.log('normal ending.');
				var random 		= this.randomSelection(2);
				var redirect 	= 'content.bot_end_'+random;
				var end 		= this.contentTypeOf(redirect);
				end.seen 		= false;
				this.usecase 	= '1st';
				this.topics(end);
				return false;
			}


			//if the bot does not the name of the user
			//then ask.
			if(localStorage.username == ''){
				console.log('Ask username');
				this.ask_name();
				return false;
			}


			//Display suggestions after 3 answer
			//with a content_define redirection.
			if(this.random_redirect >= 3){
				console.log('Display the input suggestions');
				this.suggestions(true);
				return false;
			}


			//else find a topic with same tag.
			else {
				console.log('Search unseen topic with same tag');


				var random 		= this.randomSelection(self.topiclength);
				var redirect 	= 'content.bot_topic_' + random + '_1';
				var next 		= this.contentTypeOf(redirect);


				//unseen + same tag = get ready to send content
				if(next.seen == false && next.tag.tag == this.tag) {
					console.log('unseen and same tag');
					this.loop = 0;
					this.topics(next);
					return false;
				}


				//already seen but maybe the bot can find another one.
				else if(this.loop < 50){
					console.log('already seen');
					this.loop++;
					this.content_define();
					return false;
				}


				//The bot did not find the right topic after 50 essays
				//End of the chat.
				else if(this.loop >= 50){
					this.loop = 0;

					var redirect 	= 'content.bot_nomore';
					var next 		= this.contentTypeOf(redirect);


					//next.seen = false; is equal to force the bot to send the message
					next.seen = false;
					this.topics(next);
				}
			}
		},


		//Allow the user to write to the bot what we want.
		//@param {boolean} setStructure - send messages to alert user he can write what he wants or not.
		suggestions: function(setStructure){
			var self 	= this;
			var count 	= 0;

			this.istype = 'suggestions';

			//just make sure the answers container won't show up to early.
			setTimeout(function() {
				document.querySelector('.answerPurposal').classList.remove('chat-visible');
			}, 3300);


			//basically if defined/structure
			//send message before show input.
			//usually we don't need to send those messages before but for the content_define function, it helps.
			if(setStructure != false && setStructure != undefined){


				//add message container
				this.getTemplate('#botContainer', '.wrapper-chat');


				//Select the structure to send to announce the input suggestions
				this.contentTypeOf('special_structure.area_suggestion');
				this.getPath(this.source);
			}


			//Create the content which will be added in the DOM.
			//+ Animate it
			setTimeout(function() {
				var cnt = document.createElement('div');
				cnt.classList.add('input-content');
				document.querySelector('.answerPurposal').appendChild(cnt);

				var cnt = document.createElement('div');
				cnt.classList.add('input-content-suggestions');
				document.querySelector('.answerPurposal').appendChild(cnt);

				var submit = document.createElement('button');
				submit.classList.add('area-button-help');
				document.querySelector('.input-content').appendChild(submit);

				var input = document.createElement('input');
				input.classList.add('last-input');
				input.setAttribute('placeholder', "Type what you want!");
				input.setAttribute('maxlength', '60');
				input.setAttribute('type', 'text');
				document.querySelector('.input-content').appendChild(input);

				var submit = document.createElement('button');
				submit.classList.add('area-button');
				submit.innerHTML = 'send';
				document.querySelector('.input-content').appendChild(submit);
			}, 3500);

			setTimeout(function() {
				document.querySelector('.answerPurposal').classList.add('chat-visible');
				self.allowUserAnswer = true;
				self.answer('suggestions');
			}, 3630);
		},


		//Display the available suggestions depending on what the user is typing.
		//@param {dom} elem - the input where the user is typing.
		displaySuggestion: function(elem){
			var suggestions = this.json.user_questions;
			var content 	= elem.value.toLowerCase();


			//if user asks for some help by clicking on the button "?".
			document.querySelector('.area-button-help').addEventListener('click', function(){
				document.querySelector('.input-content-suggestions').innerHTML = '';


				//list all the suggestion in the db
				$.each(suggestions, function(key, value){
					var thisQuestion 	= value.question;
					var redirect 		= value.redirect;
					var tag 			= value.tag;


					//create suggestion item
					var button = document.createElement('span');


					//add redirection and content as data
					button.setAttribute('data-redirect', redirect);
					button.setAttribute('data-content', thisQuestion);
					button.classList.add('normal-button-suggestions');


					button.innerHTML = thisQuestion;
					document.querySelector('.input-content-suggestions').appendChild(button);
				});


				//fill input with suggestion by clicking on it.
				$('.normal-button-suggestions').click(function(e){
					console.log(e.target.getAttribute('data-content'));
					elem.value 					= e.target.getAttribute('data-content');
					self.suggestionsRedirect 	= e.target.getAttribute('data-redirect');
				});
			});


			//empty the suggestion container (each time we call the function)
			//to add the new ones.
			document.querySelector('.input-content-suggestions').innerHTML = '';


			//listing suggestion in db.
			$.each(suggestions, function(key, value){
				var thisQuestion 	= value.question;
				var redirect 		= value.redirect;
				var tag 			= value.tag;


				//if content in input is similar to a part of a suggestion
				//create a suggestion item.
				if(thisQuestion.toLowerCase().indexOf(content) !== -1 && content.length >= 1){


					//create button
					var button 			= document.createElement('span');

					button.setAttribute('data-redirect', redirect);
					button.setAttribute('data-content', thisQuestion);
					button.classList.add('normal-button-suggestions');


					//highlight common characters
					var startHiglight 	= thisQuestion.indexOf(content);
					var stopHighlight 	= thisQuestion.indexOf(content)+content.length;


					//basically by dividing the content
					//and highligthing content with the <strong> tag.
					if(startHiglight != -1){
						var pre 			= thisQuestion.slice(0, startHiglight);
						var highlight 		= thisQuestion.slice(startHiglight, stopHighlight);
						var post 			= thisQuestion.slice(stopHighlight, thisQuestion.length);
						var display 		= pre + '<strong>' + highlight + '</strong>' + post;
					}
					else{
						var highlight 		= thisQuestion.slice(0, stopHighlight);
						var post 			= thisQuestion.slice(stopHighlight, thisQuestion.length);
						var display 		= '<strong>' + highlight + '</strong>' + post;
					}

					//display item.
					button.innerHTML 	= display;
					document.querySelector('.input-content-suggestions').appendChild(button);

				}
			});


			//verify there is at least one suggestion before watching events.
			if(document.querySelector('.normal-button-suggestions') != null){

				var that = self;

				//UI behavior stuff.
				document.querySelector('.normal-button-suggestions').addEventListener('mouseover', function(e){
					document.querySelector('.last-input').blur();
				}, false);


				//fill input with clicked suggestions.
				$('.normal-button-suggestions').click(function(e){
					console.log(e.target.getAttribute('data-content'));
					elem.value 					= e.target.getAttribute('data-content');
					self.suggestionsRedirect 	= e.target.getAttribute('data-redirect');
				});
			}

			//UI behavior stuff.
			document.querySelector('.input-content-suggestions').addEventListener('mouseleave', function(){
				document.querySelector('body').style.overflow = 'scroll';
			});

			document.querySelector('.input-content-suggestions').addEventListener('mouseenter', function(){
				document.querySelector('body').style.overflow = 'hidden';
			});
		},


		//Leave the chat flow to ask the name of the user
		//@param {string} - the structure to send which relates a json object
		ask_name: function(){
			var self 	= this;
			var count 	= 0;

			setTimeout(function() {
				document.querySelector('.answerPurposal').classList.remove('chat-visible');
			}, 3300);


			//add message container
			this.getTemplate('#botContainer', '.wrapper-chat');


			//Select a structure to send to ask the name
			this.contentTypeOf('special_structure.ask_name');
			this.getPath(this.source);


			//Create the content which will be added in the DOM.
			//+ Animate it
			setTimeout(function() {
				var cnt = document.createElement('div');
				cnt.classList.add('input-content');
				document.querySelector('.answerPurposal').appendChild(cnt);

				var input = document.createElement('input');
				input.classList.add('last-input');
				input.setAttribute('placeholder', "What's your name?");
				input.setAttribute('maxlength', '24');
				input.setAttribute('type', 'text');
				document.querySelector('.input-content').appendChild(input);

				var submit = document.createElement('button');
				submit.classList.add('text-button');
				submit.innerHTML = 'send';
				document.querySelector('.input-content').appendChild(submit);
			}, 3500);

			setTimeout(function() {
				document.querySelector('.answerPurposal').classList.add('chat-visible');
				self.allowUserAnswer = true;
				self.answer('name');
			}, 3630);
		},


		//After answering, the bot can react and continue to talk by
		//returning in the chat flow.
		react_name: function(source){
			var self = this;
			this.contentTypeOf('special_structure.confirm_name');
			this.getPath(this.source);
			setTimeout(function() {
				self.content_define();
			}, 30);
		},


		//Usually, redirection are precise in the chat, but sometimes the bot need
		//to go out script to add a reaction message
		//This function is here for that more or less, when we need to add a message which is not
		//in a topic's block directly this function include a single message before the block is sent.
		//This function is usually called with topics(), content_define or getRedirectValue()
		//but never alone.
		//@param {obj} src - source of the content which will be added.
		getPath: function(src){
			var self = this;
			$.each(src, function(key, value) {
				var string = key, substring = 'msg';
				if(string.indexOf(substring) !== -1){
					self.replace(value, value, src, 'bot');
				}
			});
		},


		//Save callback in localStorage
		getCallback: function(content){
			console.log('Set a new callback in localStorage');
			var ls = JSON.stringify(content);
			localStorage.setItem('callback', ls);
		},


		//Remove callback from localStorage
		removeCallback: function(){
			console.log('Remove callback from localStorage');
			localStorage.setItem('callback', '');
		},


		//Retrieve the answers for the user
		//@param {obj} answers - the answers in json
		getAnswers: function(answers){
			var self = this;
			$.each(answers, function(key, value) {
				var content 		= value.answer;
				var redirect 		= value.answer_redirect;


				//answers == input suggestion
				if(content == '_suggestions'){
					self.suggestions(false);
					return false;
				}


				//prepare the answers to be displayed (multiple choice answer.)
				else {
					setTimeout(function() {
						setTimeout(function() {
							self.setAnswers(content, redirect);
							self.animationEnd 	= false;
							self.gobottom();
						}, self.answer_delay);
					}, self.delay);
				}
			});
		},


		//Display in the DOM the answers for the user
		//@param {obj} source - the content in json
		//@param {string } redirection - the name of the next topic to display
		setAnswers: function(source, redirect) {
			var self 			= this;
			var send 			= false;


			//replace content in answer (usually not need but can help sometimes)
			var replacedAnswer 	= this.replace(source, source, source, 'user');


			var type_of 		= 'button'; // = target to retrieve content
			var input_type 		= 'email';
			var input_type_selected;


			//define the type of answer (button, input or area)
			for (var i = 0; i < this.replace_answer.length; i++) {
				var string = replacedAnswer, substring = this.replace_answer[i];


				// if input
				if(string.indexOf(substring) !== -1 && substring === '_input'){
					send = true;
					replacedAnswer = replacedAnswer.replace(substring, '');


					//define input type, but usually equals to 'text'
					var content = replacedAnswer, type = input_type;
					if(content.indexOf(type) !== -1){
						input_type_selected = type;
					}
					else {
						input_type_selected = 'text';
					}


					//creating html answers to append in the dom
					//input container
					var cnt = document.createElement('div');
					cnt.classList.add('input-content');
					document.querySelector('.answerPurposal').appendChild(cnt);


					//input
					var input = document.createElement('input');
					input.classList.add('last-input');
					input.setAttribute('data-redirect', redirect);
					input.setAttribute('placeholder', replacedAnswer);
					input.setAttribute('type', input_type_selected);
					document.querySelector('.input-content').appendChild(input);


					//input submit button
					var submit = document.createElement('button');
					submit.classList.add('text-button');
					submit.setAttribute('data-redirect', redirect);
					submit.setAttribute('data-related', true);
					submit.innerHTML = 'send';
					document.querySelector('.input-content').appendChild(submit);


					//change type_of
					type_of = 'input';
				}


				//default, normal button
				else if(substring === '_default' && send === false){
					send = true;


					//create button
					var button = document.createElement('button');
					button.setAttribute('data-redirect', redirect);
					button.classList.add('normal-button');
					button.innerHTML = replacedAnswer;


					//detect if buttons contains an emoji
					//if true, add class has-emoji to remove padding from emojis
					var ranges = [
						'\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
						'\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F
						'\ud83d[\ude80-\udeff]' // U+1F680 to U+1F6FF
					];


					if (replacedAnswer.match(ranges.join('|'))) {
						button.classList.add('has-emoji');
					}


					//add in DOM the button
					document.querySelector('.answerPurposal').appendChild(button);
				}
			}

			//detect the type of the answer
			this.istype = type_of;

			//Once the answers are displayed, allow the user to answer.
			//allowUserAnswer must be equal to true to allow users to answer
			setTimeout(function() {
				self.allowUserAnswer 	= true;
				self.answer(type_of);
			}, 30);
		},


		//Once the user is able to answer, this function watch when the user
		//is sending the answer.
		//@param {string} type - the type of the answer (input, area, button)
		answer: function(type){
			setTimeout(function() {
				document.querySelector('.answerPurposal').classList.add('chat-visible');
			}, 100);


			type = type || 'button';
			var self = this;


			if(type == 'suggestions'){

				this.displaySuggestion(document.querySelector('.last-input'));

				document.querySelector('.last-input').addEventListener('keyup', function(){
					self.displaySuggestion(document.querySelector('.last-input'));
				}, false);
				document.querySelector('.last-input').addEventListener('change', function(){
					self.displaySuggestion(document.querySelector('.last-input'));
				}, false);
			}


			//Trigger the event
			$('.text-button, .normal-button, .area-button').bind('click', function(e){


				//if this is a button we start sending the answer here.
				if(self.allowUserAnswer == true && type == 'button'){
					self.refreshAnswerStatus(e);
				}


				//this is a input answer, we start sending the answer here.
				else if(self.allowUserAnswer == true && type == 'input'){


					//make sure the input has at least 3 characters
					if(document.querySelector('.last-input').value.length >= 1){
						self.refreshAnswerStatus(e, 'false');
					}


					//else we don't send the answer
					else {
						self.errortype();
					}
				}


				else if(self.allowUserAnswer == true && type == 'suggestions'){


					//make sure the input has at least 1 characters
					//else we don't send the answer
					if(document.querySelector('.last-input').value.length >= 1){


						//get redirection.
						if(self.suggestionsRedirect == null){
							console.log('redirect ko');
							$.each(self.json.user_questions, function(key, value){
								var redirect = value.redirect;
								var content  = value.question;
								if(content.toLowerCase() == document.querySelector('.last-input').value.toLowerCase()){
									self.suggestionsRedirect = redirect;
									console.log(self.suggestionsRedirect);

									//reset seen args of the topic to false
									self.contentTypeOf('content.'+self.suggestionsRedirect);
									console.log(self.source);
									self.source.seen = false;
								}
							});
							self.refreshAnswerStatus(e, 'false');
						}


						else{
							console.log('redirect ok');
							self.refreshAnswerStatus(e, 'false');
						}
					}


					else {
						self.errortype();
					}
				}



				//this is an input, but a special one
				//the input name save the username in localstorage
				else if(self.allowUserAnswer == true && type == 'name'){
					//make sure the input has at least 3 characters
					//else we don't send the answer
					if(document.querySelector('.last-input').value.length >= 1){
						self.refreshAnswerStatus(e, 'name');
					}
					else { self.errortype(); }
				}


				else{
					return false;
				}
			});


			//the possibility to send the answer with the enter
			//key for inputs and textarea
			if(document.querySelector('.last-input') != null){


				document.querySelector('.last-input').addEventListener('keypress', function(e){
					var code = e.keyCode || e.which;
					if(code == 13){


						if(self.allowUserAnswer == true && type == 'input' && document.querySelector('.last-input').value.length >= 1){
							self.refreshAnswerStatus(e, 'false');
						}
						else {
							self.errortype();
						}


						if(self.allowUserAnswer == true && type == 'suggestions' && document.querySelector('.last-input').value.length >= 1){

							//get redirection if input suggestion
							if(self.suggestionsRedirect == null){
								console.log('redirect ko');
								$.each(self.json.user_questions, function(key, value){
									var redirect = value.redirect;
									var content  = value.question;
									if(content.toLowerCase() == document.querySelector('.last-input').value.toLowerCase()){
										self.suggestionsRedirect = redirect;
									}
								});
								self.refreshAnswerStatus(e, 'false');
							}
							else{
								console.log('redirect ok');
								self.refreshAnswerStatus(e, 'false');
							}

						}
						else {
							self.errortype();
						}


						//name input
						if(self.allowUserAnswer == true && type == 'name' && document.querySelector('.last-input').value.length >= 1){
							self.refreshAnswerStatus(e, 'name');
						}
						else {
							self.errortype();
						}
					}
				});
			}


			//go to bottom chat section
			setTimeout(function(){
				self.autoslide();
			}, 50);
		},


		//Once the user clicked on the answer, update the informations of the chats
		//@param {obj} event - the click event from answer().
		//@param {string} args - true, false or name for _sendAnswer()
		refreshAnswerStatus: function(event, args){

			var self 	= this;
			args 		= args || 'true';


			//send answer in DOM
			this.sendAnswer(event.target, args);


			var save = JSON.stringify(this.json);
			localStorage.setItem('save', save);


			//this.length--;
			this.answered++;
			this.allowUserAnswer 	= false;
			this.scrolling 			= false;
			this.animationEnd 		= false;
			localStorage.returning 	= 'true';

			console.log(this.length, this.answered, this.istype);


			setTimeout(function() {
				self.hidePurposal();
			}, 100);


			//add padding-bottom to body if not already done
			if(document.querySelector('.wrapper-chat').className != 'wrapper-chat padding'){
				document.querySelector('.wrapper-chat').classList.add('chat-padding');
			}
		},


		//Hide the answer container once the user answered.
		hidePurposal: function(){
			document.querySelector('.answerPurposal').classList.remove('chat-visible');
			setTimeout(function(){
				document.querySelector('.answerPurposal').innerHTML = '';
				return false;
			}, 400);
		},


		//This function send and animate the answer in the DOM
		//@param {obj} element - the DOM element triggered by the function answer().
		//@param {string} normal - true, false or name, define the type of DOM element to create.
		sendAnswer: function(element, normal) {
			normal 		= normal || 'true';
			var self 	= this;


			//add userContainer which will contain the answer
			this.getTemplate('#userContainer', '.wrapper-chat');
			var last_container = this.getLastItemOf('userContainer');
			this.getTemplate('#userAnswer', last_container);


			//create answer in DOM
			//Normal button answer
			if(normal == 'true'){
				var content 			= element.innerHTML;
				var redirect 			= element.getAttribute('data-redirect');
				var last_element 		= this.getLastItemOf('answer--content');
				last_element.innerHTML 	= content;

				setTimeout(function() {
					last_element.parentNode.classList.add('chat-visible');
				}, 400);
			}


			//Input name answer
			else if(normal == 'name'){
				var content 			= document.querySelector('.last-input').value;
				localStorage.username 	= content;
				var last_element 		= this.getLastItemOf('answer--content');
				last_element.innerHTML 	= content;

				setTimeout(function() {
					self.react_name('confirm_name');
				}, 50);

				setTimeout(function() {
					last_element.parentNode.classList.add('chat-visible');
				}, 400);

				return false;
			}


			//Input or area answer
			else {
				var content 			= document.querySelector('.last-input').value;
				var redirect 			= element.getAttribute('data-redirect');

				if(this.suggestionsRedirect != null){
					redirect 					= this.suggestionsRedirect;
					this.suggestionsRedirect 	= null;
				}

				//if no redirect with input suggestion = the user write something wrong
				//bot asks user to repeat
				if(redirect == null || redirect == undefined){
					redirect = 'bot_repeat';
				}

				var last_element 		= this.getLastItemOf('answer--content');
				last_element.innerHTML 	= content;

				setTimeout(function() {
					last_element.parentNode.classList.add('chat-visible');
				}, 400);
			}


			//send new topic.
			if(redirect.indexOf('bot') !== -1){

				var next = this.contentTypeOf('content.'+redirect);


				//if the selected new topic doesn't exist, redefine content
				if(next == undefined){
					console.log('Does not exist in db, go to content define');
					this.content_define();
				}

				//Send the topic
				else {
					this.topics(next);
				}

				//save in localStorage new preferences
				localStorage.tag = this.tag;

			}
			else {
				console.log('Undefined, go to content define');
				this.content_define();
			}
		},


		//Send messages into the DOM.
		//@param {string} source - 		content as text
		//@param {string} template - 	type of message
		//@param {bj} content - 		content as json
		//@param {int} delay - 			time before displaying the message
		//@return {int} delay - 		time before displaying next message
		displayBotMessages: function(source, template, content, delay) {

			var self 				= this;
			var selected_template 	= '#'+template;
			var last_container 		= this.getLastItemOf('botContainer');

			var addVisible;
			this.delay 				= this.delay + delay + 500;


			//Text message
			if(template == 'normal_text'){


				//import the selected html template
				self.getTemplate(selected_template, last_container);
				var last_element = this.getLastItemOf('chat-normal_text');


				//add content in it
				last_element.querySelector('.chat-normal_text--overflow').innerHTML = source;


				//select DOM elements for message animations
				var type 	= last_element.querySelector('.istyping');
				addVisible 	= last_element.querySelector('.chat-normal_text--overflow');
			}


			//Image link message
			else if(template == 'image_link'){


				//import the selected html template
				self.getTemplate(selected_template, last_container);


				//add content in it
				var imageLink = this.getLastItemOf('img--link--image');
				imageLink.setAttribute('src', content.message_content.thumbnail);

				var messageLink = this.getLastItemOf('message--link');
				messageLink.setAttribute('href', content.message_content.url);

				if(content.message_content.title != ''){
					var textPreview 		= this.getLastItemOf('link--textContent');
					textPreview.innerHTML 	= content.message_content.title;
				}

				if(content.message_content.sub != ''){
					var textPreview 		= this.getLastItemOf('link--textContent--sub');
					textPreview.innerHTML 	= content.message_content.sub;
				}


				//select DOM elements for message animations
				var last_element 	= this.getLastItemOf('chat-image_link');
				var type 			= last_element.querySelector('.istyping');
				addVisible 			= last_element.querySelector('.chat-image_link--bubble');
			}


			//Image simple message
			else if(template == 'image_simple'){


				//import the selected html template
				self.getTemplate(selected_template, last_container);
				var last_image = this.getLastItemOf('image_simple--image');


				//add content in it
				last_image.setAttribute('src', content.message_content.thumbnail);


				//select DOM elements for message animations
				var last_element 	= this.getLastItemOf('chat-image_simple');
				var type 			= last_element.querySelector('.istyping');
				addVisible 			= last_element.querySelector('.image--bubble');
			}


			//Typing animations + Go to bottom page
			setTimeout(function() {
				type.classList.add('chat-visible');
				self.autoslide();
			}, this.delay - delay);


			//Display message
			setTimeout(function() {
				type.classList.remove('chat-visible');
				addVisible.classList.add('chat-visible');
			}, this.delay);


			//Return delay for next message
			this.answer_delay = this.delay + 500;
			return this.answer_delay;
		},


		/**
		 * Loop in the content which will be send to detect and also
		 * replace variables and media messages
		 *
		 * Always look for the same variables basename, count them and then
		 * choose randomly
		 * @param {source} json -		the text message as json
		 * @param {string} content - 	the text message as string
		 * @param {obj} json - 			all the content
		 * @param {string} type - 		bot or user
		 */
		replace: function(source, content, json, type){

			var self 					= this;
			var count 					= 0;
			var result 					= source;
			var template 				= 'normal_text';
			var message_content 		= [];
			var obj 					= {};
			var replacedContent;
			var replacedContentStorage;
			var reactions;


			//Loop with the global variables (majority of the variables)
			for(var i = 0; i < this.replace_random.length; i++){
				if(content.indexOf(this.replace_random[i]) !== -1){

					var toreplace = this.replace_random[i];

					$.each(this.bot_db_json.variables, function(key) {
						if(key.indexOf(toreplace) !== -1){ count++; }
					});


					//If the variable is equal to greets, call greets() to replace content
					if(toreplace == 'greets'){
						result = source.replace(toreplace, this.greets());
					}

					//Normal usage for all the other global variables.
					else {

						var index 			= this.randomSelection(count);
						var full 			= 'variables.' + toreplace + '_' + index;
						replacedContent 	= this.contentTypeOf(full);
						result 				= source.replace(toreplace, replacedContent.content);

					}
				}
			}


			//callbacks
			if(result.indexOf('callback_replace') !== -1){
				var toreplace 	= this.callback.messages.msg_01_bot;
				result 			= source.replace('callback_replace', toreplace);
			}

			if(result.indexOf('callback_1') !== -1){
				var toreplace 	= this.callback.answers.answer_01.answer;
				result 			= source.replace('callback_1', toreplace);
			}

			if(result.indexOf('callback_2') !== -1){
				var toreplace 	= this.callback.answers.answer_02.answer;
				result 			= source.replace('callback_2', toreplace);
			}


			//in localStorage (username, last chat employee's name)
			if(result.indexOf(this.replace_localStorage) !== -1){
				var toreplace 			= this.replace_localStorage;
				replacedContentStorage 	= this.localStoragePath(toreplace);
				result 					= result.replace(toreplace, replacedContentStorage);
			}


			//Loop in medias messages
			for(var l = 0; l < this.media_type.length; l++){
				if(result.indexOf(this.media_type[l]) !== -1){
					var template 	= this.media_type[l];

					replacedContent = this.contentTypeOf('medias.'+content);

					//prepare media message object
					obj['message_content'] = {
						type : 			replacedContent.type,
						url : 			replacedContent.url,
						title : 		replacedContent.title,
						sub : 			replacedContent.sub,
						thumbnail : 	replacedContent.thumbnail
					};
					result = result.replace(content, replacedContent.text_preview);
				}
			}


			//once the content has been replaced, a time out send the messages.
			var delay = result.length*25;
			this.delay = 500;


			//defining if the content is for the bot or the user (always bot actually)
			if(type == 'bot'){
				setTimeout(function() {


					//check if this is a text message or a media message
					if(template === 'normal_text'){
						self.displayBotMessages(result, template, '', delay);
					}

					else {
						self.displayBotMessages(result, template, obj, delay);
					}


				}, this.delay);
			}
			else {
				return result;
			}
		},


		//display an error message if the user
		//did not fill the input to answer.
		errortype: function(){
			if(document.querySelector('.required-field') == null){


				var info_msg 		= document.createElement('span');
				info_msg.innerHTML	= 'Please fill up the field';


				info_msg.classList.add('required-field');
				document.querySelector('.answerPurposal').firstChild.appendChild(info_msg);


				setTimeout(function() {
					document.querySelector('.required-field').classList.add('in');
				}, 100);
			}
		},


		//remove the error message
		removeErrorType: function(){
			if(document.querySelector('.required-field.in') != undefined){
				document.querySelector('.required-field').classList.remove('in');
			}
		},


		//If employee doesn't have a specific greetings, the bot will probably
		//use this function if the content has been written correctly.
		//This function choose between 3 kind of greetings :
		//Time
		//Localization
		//Random
		//.replace fn replace old content with new content
		//@return {string} the greetings.
		greets: function(){
			var toreturn;
			var count = 0;
			var self = this;


			//Choose randomly a greeting to return
			if(this.usecase == '1st' || this.usecase == 'specific' || this.usecase == '2nd'){
				var l 			= this.setlength(0, this.greetings_pos.length);
				var selected 	= this.greetings_pos[l];


				//localization
				if(selected == 'greetings_geo'){
					toreturn = this.geoGreeting();
				}


				//time
				else if(selected == 'greeting_time'){
					toreturn = this.timeGreeting();
				}


				//random
				else{
					$.each(this.bot_db_json.variables, function(key) {
						if(key.indexOf(selected) !== -1){ count++; }
					});
					var index = this.randomSelection(count);
					var full = 'variables.' + selected + '_' + index;
					toreturn = this.contentTypeOf(full).content;
				}
			}
			else {

				//Will normally never return that !
				toreturn = 'Hi there.';
			}
			return toreturn;
		},


		//Define what time it is and select the appropriate greetings.
		//@return {string} the message
		timeGreeting: function(){
			var d = new Date();
			var h = d.getHours();
			var message;
				 if (h >= 0 && h <= 4) 		{ message = 'Good night' }
			else if (h >= 5 && h <= 11) 	{ message = 'Good morning 🐔' }
			else if (h >= 12 && h <= 18) 	{ message = 'Good afternoon' }
			else if (h >= 19 && h <= 23) 	{ message = 'Good evening 🌙' }
			return message;
		},


		//check if there is a variable containing the way to say hi in the country of the user.
		//@return the appropriate greeting
		geoGreeting: function(){
			var count 	= 0;
			var self 	= this;
			var c;
			var int;


			if(localStorage.ip){

				this.ipinfo = JSON.parse(localStorage.ip);

				var country = this.ipinfo.country;
				$.each(this.bot_db_json.variables, function(key) {
					if(key.indexOf(country) !== -1){ count++; }
				});

				var index 	= this.randomSelection(count);
				var full 	= 'variables.greeting_' + country + '_' + index;
				c 			= this.contentTypeOf(full).content;

				clearInterval(int);
				return c;
			}


			else{
				c = this.timeGreeting();
				return c;
			}
		},


		//Thank stack overflow
		//Check the path and convert it into json to access the content
		//In the json objects.
		//@param {string or obj} - the path of the content
		//@return the content in JSON
		contentTypeOf: function(contentSource){
			if(typeof contentSource == 'string'){
				var n=this.json;
				var c=contentSource.split('.');
				var p=n;
				for(var j=0;j<c.length;j++){ p=p[c[j]]; }
				this.source = p;
				return this.source;
			} else if(typeof contentSource == 'object'){
				this.source = contentSource;
				return this.source;
			}
		},


		//Thank stack overflow
		//Check the path and convert it into json to access the content
		//in the localStorage.
		//@param {string or obj} - the path of the content
		//@return the content in JSON
		localStoragePath: function(contentSource){
			if(typeof contentSource == 'string'){
				var n= localStorage;
				var c=contentSource.split('.');
				var p=n;
				for(var j=0;j<c.length;j++){ p=p[c[j]]; }
				this.local = p;
				return this.local;
			} else if(typeof contentSource == 'object'){
				this.local = contentSource;
				return this.local;
			}
		},


		randomSelection: function(max){
			return Math.floor(Math.random()*max) + 1;
		},


		setlength: function(min, max){
			return Math.floor(Math.random()*(max-min)) + min;
		},


		//Equals to .last() in jquery
		//(I prefer plain JS, I don't know why.)
		getLastItemOf: function(element) {
			var c = document.getElementsByClassName(element);
			var last_element = c[c.length - 1];
			return last_element;
		},


		//Import the right template tag in the DOM
		getTemplate: function(template, locator) {
			var clone = document.querySelector(template).content;
			var container = document.importNode(clone, true);
			$(locator).last().append(container);
		},


		//Scroll to the bottom of the page
		//@param {obj} element - the dom element which allow the fn to scroll
		autoslide: function(){
			if(this.answered >= 1 && this.animationEnd == false){
				if(this.last < document.body.scrollHeight){
					this.scrolling = false;
				}

				var actual 	= $('.chat_is_fs').scrollTop();
				var plus 	= actual + 350;

				if(this.animationEnd == false){
					this.animationEnd = true;
					this.scrolling = false;
					$('.chat_is_fs').stop().animate({scrollTop:plus}, 1200, 'swing', function() {
						return false;
					});
				}

			} else {
				return false;
			}
		},


		//Similar to autoslide
		//useful because sometimes autoslide reacts in a strange way
		gobottom: function(){
			if(this.answered >= 1 && this.animationEnd == false){
				if(this.last < document.body.scrollHeight){
					this.scrolling = false;
				}

				var dest 		= this.getLastItemOf('botContainer');
				var bottom 		= dest.getBoundingClientRect().bottom;
				var top 		= dest.getBoundingClientRect().top;
				var actual 		= $('.chat_is_fs').scrollTop();
				var plus 		= actual + (bottom - top);

				if(this.animationEnd == false){
					this.animationEnd = true;
					this.scrolling = false;
					$('.chat_is_fs').stop().animate({scrollTop:plus}, 1200, 'swing', function() {
						return false;
					});
				}
			}
			else {
				return false;
			}
		}
	}
	return Chat;
})();
