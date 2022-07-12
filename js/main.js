/* ========================================================================= */
/*	Preloader
/* ========================================================================= */

jQuery(window).load(function(){
	$("#preloader").fadeOut();
});



$(document).ready(function(){
	/* ========================================================================= */
	/*	Fix Slider Height
	/* ========================================================================= */	

    // Slider Height
    var slideHeight = $(window).height();
    
    $('#main, .main, #slider, .sl-slider, .sl-content-wrapper').css('height', slideHeight);

	
});
