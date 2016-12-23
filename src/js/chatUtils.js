//Manage all the events relative to the chat bot
//and the way we display in the page
var ChatUtils = (function(){


	var ChatUtils = function(){
		this.settings 		= $('.button_settings');
		this.chat 			= $('.tamedia_chatbot');
		this.preferences 	= ['preferenceDisplay', 'preferenceHistory'];
		this.loader 		= new JsonLoader();
		this.chatjs 		= new Chat();
		this.start 			= false;
		this.started 		= false;
	}


	//The message to display depending on the user language
	//
	//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	//IMPORTANT IMPORTANT IMPORTANT IMPORTANT IMPORTANT IMPORTANT IMPORTANT
	//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
	//
	//Create a function choose which one will be displayed.
	//
	var saveMessageEN 	= 'Your preferences has been saved for your next session. If you want to apply them now, reload the page.';
	var saveMessageFR 	= '';
	var saveMessageDE 	= '';
	var toDisplay 		= saveMessageEN;


	ChatUtils.prototype = {

		init: function(){
			console.log('ChatUtils.js initiated');


			//launch chat, load content (basic usage for homepage)
			if(this.chat.hasClass('chat_is_fs')){


				//this.start allow the chat to start.
				this.start = true;
				this.setStorage();
				this.watch();
			}


			//check in localstorage pref_displayChat which determines if
			//the chat is displayed or not.
			//This part of the function concerns only the subpages of the website.
			else {
				if(localStorage.pref_displayChat == 'false'){
					document.querySelector('.wrapper_chatbot').style.transition = '0s 0s ease all';
					document.querySelector('.wrapper_chatbot').style.visibility = 'hidden';
					document.querySelector('.wrapper_chatbot').classList.add('completely_hidden');
				}
				else{
					$('.wrapper_chatbot').addClass('hide_chat');
					$('.tamedia_chatbot_settings').removeClass('settings_closed');
					$('.tamedia_chatbot_settings').addClass('settings_opened');
					this.setStorage();
					this.watch();
				}
			}
		},


		//Set localStorage to welcome the chat.
		setStorage: function(){


			//the user never had a chat.
			if(localStorage.pref_displayChat == undefined){
				localStorage.setItem('pref_displayChat', true);
				localStorage.setItem('pref_keepChat', true);
				localStorage.setItem('username', '');
				localStorage.setItem('content', '');
				localStorage.setItem('tag', '');
				localStorage.setItem('callback', '');
				localStorage.setItem('returning', false);
			}


			//manage and update the localStorage
			//depending on the preferences.
			if(localStorage.pref_keepChat == 'true'){
				$('.setting_keepChat').attr('checked', false);
			}
			else {
				$('.setting_keepChat').attr('checked', true);
				localStorage.setItem('content', '');
				localStorage.setItem('username', '');
				localStorage.setItem('tag', '');
				localStorage.setItem('returning', false);
			}


			//manage and update the localStorage
			//depending on the preferences.
			if(localStorage.pref_displayChat == 'true'){
				$('.setting_displayChat').attr('checked', false);
				this.start = true;
			}
			else {
				$('.setting_displayChat').attr('checked', true);
				$('.wrapper_chatbot').addClass('hide_chat');
				$('.tamedia_chatbot_settings').removeClass('settings_closed');
				$('.tamedia_chatbot_settings').addClass('settings_opened');
				this.start = false;
			}


			//start the chat from the beginning
			//works usually only on homepage when the chat is displayed.
			if(this.start == true){
				this.load();
			}
		},


		//Launch jsonloader.js
		//wait until the content is loaded
		//then launch chat.js
		load: function(){

			this.started = true;
			this.loader.init();

			var int;
			var self = this;

			if(localStorage.content.length > 1){
				this.launchChat();
			}
			else {
				int = setInterval(function(){
					if(localStorage.content.length > 1){
						self.launchChat();
						clearInterval(int);
					} else {
						console.log('Loading content...');
					}
				},50);
			}
		},


		//Events during conversation
		//concerns mostly the event with the settings and to show/hide the chat.
		watch: function(){
			var self 			= this;
			var transitioned 	= false;
			var canBeSmall 		= false;


			//display or hide settings
			this.settings.click(function(event){
				var elem = $('.tamedia_chatbot_settings');


				self.settings.toggleClass('close');
				elem.toggleClass('settings_closed');
				elem.toggleClass('settings_opened');


				//manage the behavior of the displayed message
				//after a change in the settings
				if(document.querySelector('.settings_infos') != undefined || document.querySelector('.settings_infos') != null){
					document.querySelector('.settings_infos').classList.add('out');
					if($('.wrapper_chatbot').hasClass('small_chat')){
						document.querySelector('.settings_infos').style.transform = 'translateX(-320px)';
					}
					setTimeout(function() {
						document.querySelector('.settings_infos').remove();
					}, 1000);
				}
			});



			//Show hide chat
			$('.tamedia_chatbot_toggle').click(function(event){


				//on homepage
				if($('.wrapper_chatbot').hasClass('home_chat')){
					$('.tamedia_chatbot_settings').addClass('settings_closed');
					$('.wrapper_chatbot').toggleClass('hide_chat');
				}


				//on subpage
				else{
					$('.wrapper_chatbot').toggleClass('hide_chat');
					$('.wrapper_chatbot').toggleClass('small_chat');
				}


				//check if the chat was hidden or not
				//don't even think to remove this.
				if(canBeSmall == true){
					canBeSmall = false;
					console.log('chat closed');
				}
				else {
					canBeSmall = true;
					console.log('chat opened');
					if(self.started == false){
						self.load();
					}
				}
			});


			//display or hide the answer depending on the scroll position
			$('.chat_is_fs').scroll(function(event){
				if($('.chat_is_fs').scrollTop() + $('.chat_is_fs').height() >= $('.wrapper-chat').innerHeight() - 200){
					if(self.chatjs.allowUserAnswer == true){
						$('.answerPurposal').addClass('chat-visible');
					}
				} else {
					$('.answerPurposal').removeClass('chat-visible');
				}
			});



			//Scroll behavior on page
			$(window).scroll(function(event){
				if(window.scrollY > 10){
					if(document.querySelector('.chat_is_fs') != undefined){
						document.querySelector('.chat_is_fs').style.overflowY = 'hidden';
					}
				}
				else{
					if(document.querySelector('.chat_is_fs') != undefined){
						document.querySelector('.chat_is_fs').style.overflowY = 'scroll';
					}
				}
			});


			//Call the function to update the settings in the localStorage
			//when user click on a settings.
			$('.tamedia_settings_input').change(function(event){
				event.preventDefault();
				self.changeSettings(event.target);
			});

		},


		//Update the settings in the localStorage
		changeSettings: function(target){
			var toStore = target.getAttribute('data-storage');

			$.each(localStorage, function(key, value){
				if(key == toStore){
					if(value == 'true'){
						localStorage.setItem(key, false);
						return localStorage;
					}
					else if (value == 'false'){
						localStorage.setItem(key, true);
						return localStorage;
					}
				}
			});


			//display message info for the settings
			if(document.querySelector('.settings_infos') != undefined || document.querySelector('.settings_infos') != null){
				//basically do anything.
			}
			else {
				var infos = document.createElement('span');
				infos.classList.add('settings_infos');
				infos.innerHTML = toDisplay;
				document.querySelector('.wrapper_chatbot').appendChild(infos);


				//fadeout + remove message after 10seconds
				setTimeout(function() {
					if(document.querySelector('.settings_infos') != undefined || document.querySelector('.settings_infos') != null){
						document.querySelector('.settings_infos').classList.add('out');
					}
				}, 10000);
				setTimeout(function() {
					if(document.querySelector('.settings_infos') != undefined || document.querySelector('.settings_infos') != null){
						document.querySelector('.settings_infos').remove();
					}
				}, 11000);
			}

		},


		//Launch chat.
		launchChat: function(){
			this.chatjs.init();
		}

	}
	return ChatUtils;
})();
