function loadComplete() {
    $('main').fadeTo('slow', 1, function() {});
}

/* ========================================================================= */
/*	Preloader
/* ========================================================================= */
jQuery(window).load(function(){
    fetch('./config.json')
    .then(response => response.json())
    .then((config) => {
        console.log(`Config Loaded.`);
        for (const key in config) {
            const value = config[key];
            document.body.innerHTML = document.body.innerHTML.replace(`{{${key}}}`, value);
        }

        if (typeof loadNext !== 'undefined') {
            loadNext();
        }
        
        loadComplete();
    })
    .catch(error => console.log(error));

    

    $(function () {
        var tabIndex = 1;
        $('input,select').each(function () {
            if (this.type != "hidden") {
                var $input = $(this);
                $input.attr("tabindex", tabIndex);
                tabIndex++;
            }
        });
    });
});
