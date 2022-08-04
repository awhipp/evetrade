
const date = new Date();
const dateString = "Date=" + date.getFullYear() + date.getMonth() + date.getDate();

const API_ENDPOINT = window.location.href.indexOf("localhost") > 0 || window.location.href.indexOf("127.0.0.1") > 0 ? "https://evetrade.space/api":"/api";

let universeList = {};

function loadComplete() {
    $('main').fadeTo('slow', 1, function() {});
}

window.alert = function(msg='An unknown error has occurred. Try refreshing this page.', title='Error has occurred', type='error') {
    swal(title, msg, type,{
        buttons: {
            cancel: "Close",
            refresh: "Refresh"
        },
    })
    .then((value) => {
        switch (value) {
            
            case "refresh":
                window.location.reload();
                break;
            default:
                break;
        }
    });
}

/**
* Wrap the fetch call with a number of retries.
* @param {*} url 
* @param {*} tries 
* @returns 
*/
async function fetchWithRetry(url=url, tries=3, errorMsg='An unknown error has occurred. Try refreshing this page.') {
    const errs = [];
    
    for (let i = 0; i < tries; i++) {
        console.log(`Trying: GET '${url}' [${i + 1} of ${tries}]`);
        
        try { 
            return await fetch(url);
        }
        catch (err) {
            errs.push(err);
        }
    }
    
    window.alert(errorMsg);
    throw errs;
};
    
    
    /**
    * Generic function to get JSON data from API endpoint
    * @param {*} fileName 
    * @returns The Data from the API.
    */
    function getResourceData(fileName) {
        return fetchWithRetry(
            url = `${API_ENDPOINT}/resource?file=${fileName}`,
            tries = 3,
            errorMsg = `Unable to retrieve ${fileName} from the API.\n\n Would you like to refresh this page?`
            ).then(response => response.json())
            .then(function(response) {
                return response;
            });
        }
        
        /**
        * Get's the universe list data for the EVE universe.
        * Used by multiple pages.
        * @returns {Promise<void>}
        */
        function getUniverseList() {
            return new Promise (function(resolve, reject) {
                const dateCacheKey = 'evetrade_universe_list_last_retrieved';
                const jsonCacheKey = 'universeList';
                
                const lastRetrieved = window.localStorage.getItem(dateCacheKey);
                
                if(dateString == lastRetrieved) {
                    console.log('Same Day - Retrieving UniverseList Cache.');
                    
                    try {
                        resolve(JSON.parse(window.localStorage.getItem(jsonCacheKey)));
                    } catch(e) {
                        console.log('Error Retrieving UniverseList Cache. Retrying.');
                    }
                } else {
                    console.log('New Day - Retrieving UniverseList Cache.');
                }
                
                getResourceData('universeList.json').then(function(response) {
                    console.log('Universe List Loaded.');
                    window.localStorage.setItem(jsonCacheKey, JSON.stringify(response));
                    window.localStorage.setItem(dateCacheKey, dateString);
                    resolve(response);
                });
            });
            
        }
        
        
        /* ========================================================================= */
        /*	Preloader
        /* ========================================================================= */
        jQuery(window).load(function(){
            fetchWithRetry(
                url = './config.json',
                tries = 3,
                errorMsg = `Unable to retrieve configuration file. Try refreshing this page.`
                ).then(response => response.json())
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
            