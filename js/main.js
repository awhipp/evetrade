
const date = new Date();
const dateString = "Date=" + date.getFullYear() + date.getMonth() + date.getDate() + date.getHours();

const RESOURCE_ENDPOINT = 'https://evetrade.s3.amazonaws.com/resources/';

let universeList = {};
let stationList = [];
let regionList = [];
let functionDurations = {};
let global_config = {};

let page_loaded = false;

// If loadComplete has not been called after 10 seconds, show the page anyway
window.onload = function(){
    console.log('Page loaded. Waiting for loadComplete() to be called...');
    setTimeout(function() {
        if (!page_loaded) {
            clearLocalStorageAndRefresh();
        } else {
            console.log('Cache prepared before timeout.');
        }
    }, 10000);
};

function loadComplete() {
    page_loaded = true;
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
* Override the default console.log function to add a timestamp with milliseconds
*/
console.log = (function (orig) {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        const d = new Date()
        args.unshift(`[${d.toISOString(tz=0)}]`);
        orig.apply(this, args);
    };
})(console.log);


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
        
        $('.durationPercent').text((percent).toFixed(2));
        $('.durationRetry').text(retryText);
    }, 10);
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

            let json = await response.json();
            if (typeof(json) == 'string') {
                json = JSON.parse(json);
            }
            

            if (json.statusCode == 429) {
                window.alert(
                    msg = 'Please wait a few minutes and try again. IP Reference: ' + json.ip,
                    title = json.body,
                    type = 'error',
                    hasRefresh = true
                );
                return;
            }

            if (json.statusCode == 403) {
                window.alert(
                    msg = 'Banned for 1 week. Come back later. IP Reference: ' + json.ip,
                    title = json.body,
                    type = 'error',
                    hasRefresh = true
                );
                return;
            }

            if (json.statusCode == 401) {
                window.alert(
                    msg = 'Contact Support.',
                    title = `401 - ${json.body}`,
                    type = 'error',
                    hasRefresh = true
                );
                return;
            }

            if (url.indexOf('/resource') > 0 && Object.keys(json).length == 0) {
                console.log(`Empty JSON for ${url}. Retrying...`);
                errs.push(`No data returned from Resource API. Retrying...`);
            } else if(response.ok && !('error' in json)) {
                // print json size in mb
                console.log(`JSON size: ${JSON.stringify(json).length/1024/1024} megabytes`);
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
            console.log('Same Hour - Retrieving UniverseList Cache.');
            
            try {
                resolve(JSON.parse(window.localStorage.getItem(jsonCacheKey)));
            } catch(e) {
                console.log('Error Retrieving UniverseList Cache. Retrying.');
            }
        } else {
            console.log('New Hour - Retrieving UniverseList Cache.');
        
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
            console.log('Same Hour - Retrieving Function Durations Cache.');
            
            try {
                resolve(JSON.parse(window.localStorage.getItem(jsonCacheKey)));
            } catch(e) {
                console.log('Error Retrieving Function Durations Cache. Retrying.');
            }
        } else {
            console.log('New Hour - Retrieving Function Durations Cache.');
        
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
            console.log('Same Hour - Retrieving RegionList Cache.');
            
            try {
                resolve(JSON.parse(window.localStorage.getItem(jsonCacheKey)));
            } catch(e) {
                console.log('Error Retrieving RegionList Cache. Retrying.');
            }
        } else {
            console.log('New Hour - Retrieving RegionList Cache.');
        
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
            console.log('Same Hour - Retrieving StationList Cache.');
            
            try {
                resolve(JSON.parse(window.localStorage.getItem(jsonCacheKey)));
            } catch(e) {
                console.log('Error Retrieving StationList Cache. Retrying.');
            }
        } else {
            console.log('New Hour - Retrieving StationList Cache.');
        
            getResourceData('stationList.json').then(function(response) {
                console.log('Station List Loaded.');
                window.localStorage.setItem(jsonCacheKey, JSON.stringify(response));
                window.localStorage.setItem(dateCacheKey, dateString);
                resolve(response);
            });
        }
    });
}


/**
* Get's the structure list data for the EVE universe.
* @returns {Promise<void>}
*/
function getStructureList(){
    return new Promise (function(resolve, reject) {
        const dateCacheKey = 'evetrade_structure_list_last_retrieved';
        const jsonCacheKey = 'structureList';

        const lastRetrieved = window.localStorage.getItem(dateCacheKey);
        
        if(dateString == lastRetrieved) {
            console.log('Same Hour - Retrieving StructureList Cache.');
            
            try {
                resolve(JSON.parse(window.localStorage.getItem(jsonCacheKey)));
            } catch(e) {
                console.log('Error Retrieving StructureList Cache. Retrying.');
            }
        } else {
            console.log('New Hour - Retrieving StructureList Cache.');
        
            getResourceData('structureList.json').then(function(response) {
                console.log('Structure List Loaded.');
                window.localStorage.setItem(jsonCacheKey, JSON.stringify(response));
                window.localStorage.setItem(dateCacheKey, dateString);
                resolve(response);
            });
        }
    });
}


/**
* Get's the structure info data for the EVE universe.
* @returns {Promise<void>}
*/
function getStructureInfo(){
    return new Promise (function(resolve, reject) {
        const dateCacheKey = 'evetrade_structure_info_last_retrieved';
        const jsonCacheKey = 'structureInfo';

        const lastRetrieved = window.localStorage.getItem(dateCacheKey);
        
        if(dateString == lastRetrieved) {
            console.log('Same Hour - Retrieving StructureInfo Cache.');
            
            try {
                resolve(JSON.parse(window.localStorage.getItem(jsonCacheKey)));
            } catch(e) {
                console.log('Error Retrieving StructureInfo Cache. Retrying.');
            }
        } else {
            console.log('New Hour - Retrieving StructureInfo Cache.');
        
            getResourceData('structureInfo.json').then(function(response) {
                console.log('Structure Info Loaded.');
                window.localStorage.setItem(jsonCacheKey, JSON.stringify(response));
                window.localStorage.setItem(dateCacheKey, dateString);
                resolve(response);
            });
        }
    });
}

PRODUCTION_ENDPOINT = "https://remy65obllca7kdbhp56q74l7m0ultyy.lambda-url.us-east-1.on.aws";
DEVELOPMENT_ENDPOINT = "https://ykojlvmo2vgjde53lye6nyst5y0irbdx.lambda-url.us-east-1.on.aws";
        
/* ========================================================================= */
/*	Preloader
/* ========================================================================= */
jQuery(window).load(function(){
    fetchWithRetry(
        url = './version.json',
        tries = 3,
        errorMsg = `Unable to retrieve version file. Try refreshing this page.`
        ).then((version) => {
            global_config = version;

            // If on https://evetrade.space, use the production API Gateway
            if (window.location.host == "evetrade.space") {
                console.log("Production Endpoint Loaded.");
                global_config["api_gateway"] = PRODUCTION_ENDPOINT;
            } else {
                console.log("Development Endpoint Loaded.");
                global_config["api_gateway"] = DEVELOPMENT_ENDPOINT;
            }
            console.log(`Version Loaded.`);

            for (const key in version) {
                const value = version[key];
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

                        getStructureList().then(function(structure_response) {
                            // Add asterisk to the end of every string in structure_response
                            structure_response = structure_response.map(function(item) {
                                return item + '*';
                            });
                            
                            stationList = stationList.concat(structure_response);
                            console.log(`${structure_response.length} items in structure list (added to stationList).`);

                            getStructureInfo().then(function(structure_info_response) {
                                for(structureId in structure_info_response) {
                                    structure = structure_info_response[structureId];
                                    universeList[structure['name'].toLowerCase()] = {
                                        constellation: structure['constellation'],
                                        name: structure['name'],
                                        region: structure['region_id'],
                                        security: structure['security'],
                                        system: structure['system_id'],
                                        station: structure['station_id'],
                                    }
                                }
                                console.log(`${Object.keys(structure_info_response).length} items in structure info (added to universeList).`);
        
                                getFunctionDurations().then(function(data) {
                                    functionDurations = data;
                                    console.log(`${Object.keys(functionDurations).length} items in functionDurations.`);
                    
                                    if (typeof loadNext !== 'undefined') {
                                        loadNext();
                                    }
                                    loadComplete();
                                    
                                    if (typeof set_announcement !== 'undefined') {
                                        set_announcement(version.release_date);
                                    }
                                });

                            });

                        });
                    });

                });
            });
            
    }).catch((err) => {
            console.log(err);
            window.alert(
                msg = 'Unable to retrieve version file. Try refreshing this page.',
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
            
