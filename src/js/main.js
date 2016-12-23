console.log('Main.js | Welcome on Minima 🛠');


//dev'mode
//localStorage.clear();


//Detect if there is the chat container on the page
//if true - display the chat.
document.addEventListener('DOMContentLoaded', function(){
	if($('.tamedia_chatbot').length != 0){


		//Load the information with IPINFO.IO
		//@param {obj} data - The object containing the user infos
		//Loop 20 times per second until the info are stocked
		//in localStorage as a string.
		$.getJSON('http://ipinfo.io', function(data){
			var toSave = JSON.stringify(data);
			int = setInterval(function(){
				if(toSave != null || toSave != undefined || toSave != ''){
					localStorage.setItem('ip', toSave);
					clearInterval(int);
				}
			}, 50);
		});


		$('.wrapper_chatbot').on( 'webkitAnimationEnd mozAnimationEnd oAnimationEnd oanimationend animationend', function(){
			$(this).css('animation', 'none');
		});


		var chatutils = new ChatUtils();
		chatutils.init();
	}
});
