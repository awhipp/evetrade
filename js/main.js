
const date = new Date();
const dateString = "Date=" + date.getFullYear() + date.getMonth() + date.getDate();

const RESOURCE_ENDPOINT = 'https://evetrade.s3.amazonaws.com/resources/';

let universeList = {};
let stationList = [];
let regionList = [];
let functionDurations = {};
let global_config = {};

function loadComplete() {
    $('main').fadeTo('slow', 1, function() {});
}

function cap(s){
    return s && s[0].toUpperCase() + s.slice(1);
}

/**
* Round value to 2 decimal and add commas
*/
function round_value(value, amount) {
    return parseFloat(value).toLocaleString("en-US", {
        minimumFractionDigits: amount, 
        maximumFractionDigits: amount
    });
}

/**
 * Overrides the default window.alert function with a better UI/UX
 * @param {*} msg Alert message
 * @param {*} title Alert title
 * @param {*} type Type of alert
 * @param {*} hasRefresh If it allows refresh on the page
 */
window.alert = function(msg='An unknown error has occurred. Try refreshing this page.', title='Error has occurred', type='error', hasRefresh=false) {
    if (hasRefresh) {
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
    } else {
        swal(title, msg, type);
    }
}

/**
 * Every 100ms updates the div text with the new time
 */
let storedTime = 0;
let interval = undefined;

function countDownDivText(initialTime, retryCount = 0) {
    storedTime = initialTime;
    let startTime = new Date();
    let retryText = ''

    if (interval || retryCount > 0) {
        clearInterval(interval);
        retryText = `Request Failed. Attempt #${retryCount}.`;
    }

    interval = setInterval(function() {
        let timeLeft = initialTime - (new Date() - startTime);
        if(timeLeft < 0) {
            clearInterval(interval);
            return;
        }

        const percent = (1 - (timeLeft / initialTime)) * 100;
        
        $('.durationPercent').text((percent).toFixed(1));
        $('.durationRetry').text(retryText);
    }, 100);
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
            const response = await fetch(url);

            const json = await response.json();

            if (url.indexOf('/resource') > 0 && Object.keys(json).length == 0) {
                console.log(`Empty JSON for ${url}. Retrying...`);
                errs.push(`No data returned from Resource API. Retrying...`);
            } else if(response.ok && !('error' in json)) {
                return json;
            } else {
                countDownDivText(storedTime, i+2);
                errs.push(json.error);
            }

        }catch (err) {
            countDownDivText(storedTime, i+2);
            errs.push(err);
        }
    }
    
    window.alert(
        msg = errorMsg,
        title = 'Error has occurred',
        type = 'error',
        hasRefresh = true
    );
    
    throw errs;
};
    
    
/**
* Generic function to get JSON data from API endpoint
* @param {*} fileName 
* @returns The Data from the API.
*/
function getResourceData(fileName) {
    return fetchWithRetry(
            url = `${RESOURCE_ENDPOINT}${fileName}`,
            tries = 3,
            errorMsg = `Unable to retrieve ${fileName} from the API.\n\n Would you like to refresh this page?`
        ).then(function(response) {
            return response;
        });
}

/**
 * Clears local storage and refreshes the page.
 */
function clearLocalStorageAndRefresh() {
    window.localStorage.clear();
    window.location = '/';
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
        
            getResourceData('universeList.json').then(function(response) {
                console.log('Universe List Loaded.');
                window.localStorage.setItem(jsonCacheKey, JSON.stringify(response));
                window.localStorage.setItem(dateCacheKey, dateString);
                resolve(response);
            });
        }
    });
    
}

/**
 * Get Function durations
* Used by multiple pages.
* @returns {Promise<void>}
    */
function getFunctionDurations() {
    return new Promise (function(resolve, reject) {
        const dateCacheKey = 'evetrade_function_durations_last_retrieved';
        const jsonCacheKey = 'functionDurations';
        
        const lastRetrieved = window.localStorage.getItem(dateCacheKey);
        
        if(dateString == lastRetrieved) {
            console.log('Same Day - Retrieving Function Durations Cache.');
            
            try {
                resolve(JSON.parse(window.localStorage.getItem(jsonCacheKey)));
            } catch(e) {
                console.log('Error Retrieving Function Durations Cache. Retrying.');
            }
        } else {
            console.log('New Day - Retrieving Function Durations Cache.');
        
            getResourceData('functionDurations.json').then(function(response) {
                console.log('Function Durations Loaded.');
                window.localStorage.setItem(jsonCacheKey, JSON.stringify(response));
                window.localStorage.setItem(dateCacheKey, dateString);
                resolve(response);
            });
        }
    });
    
}


/**
* Get's the region list data for the EVE universe.
* @returns {Promise<void>}
*/
function getRegionList(){
    return new Promise (function(resolve, reject) {
        const dateCacheKey = 'evetrade_region_list_last_retrieved';
        const jsonCacheKey = 'regionList';

        const lastRetrieved = window.localStorage.getItem(dateCacheKey);
        
        if(dateString == lastRetrieved) {
            console.log('Same Day - Retrieving RegionList Cache.');
            
            try {
                resolve(JSON.parse(window.localStorage.getItem(jsonCacheKey)));
            } catch(e) {
                console.log('Error Retrieving RegionList Cache. Retrying.');
            }
        } else {
            console.log('New Day - Retrieving RegionList Cache.');
        
            getResourceData('regionList.json').then(function(response) {
                console.log('Region List Loaded.');
                window.localStorage.setItem(jsonCacheKey, JSON.stringify(response));
                window.localStorage.setItem(dateCacheKey, dateString);
                resolve(response);
            });
        }
    });
    
}   

/**
* Get's the station list data for the EVE universe.
* @returns {Promise<void>}
*/
function getStationList(){
    return new Promise (function(resolve, reject) {
        const dateCacheKey = 'evetrade_station_list_last_retrieved';
        const jsonCacheKey = 'stationList';

        const lastRetrieved = window.localStorage.getItem(dateCacheKey);
        
        if(dateString == lastRetrieved) {
            console.log('Same Day - Retrieving StationList Cache.');
            
            try {
                resolve(JSON.parse(window.localStorage.getItem(jsonCacheKey)));
            } catch(e) {
                console.log('Error Retrieving StationList Cache. Retrying.');
            }
        } else {
            console.log('New Day - Retrieving StationList Cache.');
        
            getResourceData('stationList.json').then(function(response) {
                console.log('Station List Loaded.');
                window.localStorage.setItem(jsonCacheKey, JSON.stringify(response));
                window.localStorage.setItem(dateCacheKey, dateString);
                resolve(response);
            });
        }
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
        ).then((config) => {
            console.log(`Config Loaded.`);
            global_config = config;

            for (const key in config) {
                const value = config[key];
                document.body.innerHTML = document.body.innerHTML.replace(`{{${key}}}`, value);
            }

            getUniverseList().then(function(universe_response) {
                universeList = universe_response;
                console.log(`${Object.keys(universeList).length} items in universe list.`);

                getRegionList().then(function(region_response) {
                    regionList = region_response;
                    console.log(`${regionList.length} items in region list.`);

                    getStationList().then(function(station_response) {
                        stationList = station_response;
                        console.log(`${stationList.length} items in station list.`);
        
                        getFunctionDurations().then(function(data) {
                            functionDurations = data;
                            console.log(`${Object.keys(functionDurations).length} items in functionDurations.`);
            
                            if (typeof loadNext !== 'undefined') {
                                loadNext();
                            }
                            loadComplete();
                        });
                    });

                });
            });
            
    }).catch((err) => {
            console.log(err);
            window.alert(
                msg = 'Unable to retrieve configuration file. Try refreshing this page.',
                title = 'Error has occurred',
                type = 'error',
                hasRefresh = true
            )
    });
        
        
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
            
