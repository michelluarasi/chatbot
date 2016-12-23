'use strict';

function getIndexOfElementInParent(element){
	var parent = element.parentNode;
	for (var index = 0; index <= parent.children.length - 1; index++){
		if(parent.children[index] === element){
			return element;
		}
	}
};

function newEvent(selected_element_class, _event){
	var items = document.querySelectorAll(selected_element_class);
	for (var i = 0; i <= items.length-1; i++){
		items.item(i).addEventListener(_event, function(event) {
			var currentItemIndex = getIndexOfElementInParent(event.target);
			resize(currentItemIndex);
		}, false);
	}
};

function resize(elem){
	var size = elem.getAttribute('data-size');
	document.querySelector(".wrapper-resizable").style.transition = '.3s ease all';
	document.querySelector(".wrapper-resizable").style.width = size;
	setTimeout(function() {
		document.querySelector(".wrapper-resizable").style.transition = '0s ease all';
		setFrameSize();
	}, 350);
}



$( ".wrapper-resizable" ).resizable({
	handles: {'e': '#handle'},
	minWidth: 320,
	containment: "document",
	distance: -500
});

newEvent('.size','click');

function setFrameSize(){
	$('.size--input').val('');
	$('.size--input').attr('placeholder', $('.wrapper-resizable').width());
}

setFrameSize();
$(window).resize(setFrameSize);


$('.size--input').on('change', function(){
	var width = $('.size--input').val();
	if(width >= 320 && width <= 1920){
		$( ".wrapper-resizable" ).css('width', width);
	} else if($('.size--input').val() == ''){
		$('.size--input').val(1024);
		$( ".wrapper-resizable" ).css('width', 1024);
	}
});
