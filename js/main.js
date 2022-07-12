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
        $("#preloader").fadeOut();
    })
    .catch(error => console.log(error));
});
