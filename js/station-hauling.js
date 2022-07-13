
const date = new Date();
const dateString = "Date=" + date.getFullYear() + date.getMonth() + date.getDate();

const API_ENDPOINT = window.location.href.indexOf("localhost") > 0 ? "https://evetrade.space/api":"/api";

/**
 * Generic function to get JSON data from API endpoint
 * @param {*} fileName 
 * @returns The Data from the API.
 */
function getResourceData(fileName) {
    return fetch(API_ENDPOINT + '/resource?file=' + fileName)
    .then(response => response.json())
    .then(function(response) {
        return response;
    });
}

/**
 * Get's the station list data for the EVE universe.
 * @returns {Promise<void>}
 */
function getStationList(){
    return new Promise (function(resolve, reject) {
        const lastRetrieved = window.localStorage.getItem('evetrade_station_list_last_retrieved');

        if(dateString == lastRetrieved) {
            console.log('Same Day - Retrieving Resource Cache.');

            try {
                resolve(JSON.parse(window.localStorage.getItem('stationList')));
            } catch(e) {
                console.log('Error Retrieving StationList Cache. Retrying.');
            }
        } else {
            console.log('New Day - Retrieving StationList Cache.');
        }

        window.localStorage.removeItem('evetrade_station_list_last_retrieved')

        getResourceData('stationList.json').then(function(response) {
            console.log('Station List Loaded.');
            window.localStorage.setItem('stationList', JSON.stringify(response));
            resolve(response);
        });
    });

}


/**
 * Initializes the auto complete function for the given input.
 * @param {} domId The id of the input to initialize. 
 * @param {*} list  The list of options to use for the auto complete.
 */
function initAwesomplete(domId, list) {
    var input = document.querySelector("#" + domId);
    var inputPlete  = new Awesomplete(input, {
        list: "#" + list,
        minChars: 0,
        maxItems: 10,
        autoFirst: true,
        filter: Awesomplete.FILTER_CONTAINS,
        sort: false,
    });

    $(input).on('focus', function(){
        inputPlete.evaluate();
    });
        
    $(input).on('awesomplete-select', function(selection) {
        console.log(selection.originalEvent.text.value);
    });

    $(input).on("change", function(selection) {
        console.log($(selection).val());
    });

}

/**
 * Initializes on window load
 */
(function () {
    getStationList().then(function(stationList) {        
        stationList.forEach(function(station){
            var option = document.createElement("option");
            option.innerHTML = station;
            $("#stationList").append(option);
        });

        initAwesomplete("station-from", "stationList");

        $('#hauling-form').fadeTo('fast', 1, function() {
            console.log("Ready to search.");
        });
    });
})();
