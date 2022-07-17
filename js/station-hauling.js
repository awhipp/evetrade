
const date = new Date();
const dateString = "Date=" + date.getFullYear() + date.getMonth() + date.getDate();

const API_ENDPOINT = window.location.href.indexOf("localhost") > 0 || window.location.href.indexOf("127.0.0.1") > 0 ? "https://evetrade.space/api":"/api";

let universeList = {};
let hauling_request = {};

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
 * Get's the universe list data for the EVE universe.
 * @returns {Promise<void>}
 */
function getUniverseList() {
    return new Promise (function(resolve, reject) {
        const lastRetrieved = window.localStorage.getItem('evetrade_universe_list_last_retrieved');

        if(dateString == lastRetrieved) {
            console.log('Same Day - Retrieving Resource Cache.');

            try {
                resolve(JSON.parse(window.localStorage.getItem('universeList')));
            } catch(e) {
                console.log('Error Retrieving UniverseList Cache. Retrying.');
            }
        } else {
            console.log('New Day - Retrieving UniverseList Cache.');
        }

        window.localStorage.removeItem('evetrade_universe_list_last_retrieved')

        getResourceData('universeList.json').then(function(response) {
            console.log('Universe List Loaded.');
            window.localStorage.setItem('universeList', JSON.stringify(response));
            resolve(response);
        });
    });

}

function addStationToList(stationName, domId) {
    console.time(stationName + domId);

    const data = universeList[stationName.toLowerCase()];
    const dataAttribute = `#${domId} li[data-station="${data.station}"]`;

    let stationList = $(`#${domId}`);

    if ($(dataAttribute).length == 0) {
        stationList.show();
        stationList.append(`<li data-region="${data.region}" data-station="${data.station}"><span class="stationName">${stationName}</span><span class="remove-item">x</span></li>`);

        $(`#${domId} li`).on("click", function() {
            const parent = $(this.parentElement);
            $(this).remove();
            
            if(parent.children().length == 0) {
                parent.hide();
            } else {
                parent.show();
            }
        });
    } else {
        console.log(`Station ${stationName} already added.`);
    }

    console.timeEnd(stationName + domId);
}

function getStationInfoFromList(domId) {
    const stations = [];
    const stationList = $(`#${domId} li`);
    stationList.each(function() {
        stations.push(`${$(this).attr('data-region')}:${$(this).attr('data-station')}`);
    });
    return stations.join(',');
}

function getStationNamesFromList(domId) {
    const stations = [];
    const stationList = $(`#${domId} li .stationName`);
    stationList.each(function() {
        stations.push(`${$(this).text()}`);
    });
    return stations.join(',');
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
        minChars: 1,
        maxItems: 5,
        autoFirst: true,
        tabSelect: true,
        filter: Awesomplete.FILTER_STARTSWITH,
        sort: false,
    });
        
    $(input).on('awesomplete-select', function(selection) {
        console.log(`Added (select): ${selection.originalEvent.text.value}`);
        addStationToList(selection.originalEvent.text.value, selection.target.id + 'Stations');
        selection.originalEvent.text.value = '';
        $(input).focus();
    });
}

function createTradeHeader(request, from, to) {

    const minProfit = request.minProfit;
    const maxWeight = request.maxWeight == Number.MAX_SAFE_INTEGER ? "Infinite" : request.maxWeight;
    const minROI = (request.minROI * 100) + "%";
    const maxBudget = request.maxBudget == Number.MAX_SAFE_INTEGER ? "Infinite" : request.maxBudget;
    const tax = (request.tax * 100) + "%";

    let systemSecurity = request.systemSecurity;
    switch(systemSecurity) {
        case "high_sec,low_sec,null_sec":
            systemSecurity = "High, Low, Null";
        case "high_sec,low_sec":
            systemSecurity = "High, Low";
        default:
            systemSecurity = "High";
    }

    const routeSafety = request.routeSafety.replace('secure', 'Safest').replace('insecure', 'Least Safe').replace('shortest', 'Shortest');

    let subHeader = `Profit Above: ${minProfit} | Capacity: ${maxWeight} | R.O.I.: ${minROI}`
    subHeader += `<br><br>Budget: ${maxBudget} | Sales Tax: ${tax} | Security: ${systemSecurity} | Route: ${routeSafety}`;

    $('main h1').hide();
    $('main h2').html(`Buying from: ${from} <br>Selling to: ${to}`);
    $('main h3').html(subHeader);
}

function getNameFromUniverseStations(stationId) {
    if (stationId.indexOf(':') >= 0) {
        stationId = stationId.split(':')[1];
    }

    for (const stationName in universeList) {
        if (universeList[stationName].station == stationId) {
            return universeList[stationName];
        }
    }
    window.alert("Station not found in universe list. Retry query parameters.");
    throw 'Station not found in universe list. Retry query parameters.';
}

/**
 * Pulls data from form HTML element and creates JSON
 */
async function getHaulingData(hasQueryParams) {
    let from = [];
    let to = [];

    if (hasQueryParams) {
        // Converting From/To Query Params back to station names.
        fromLocations = hauling_request.from.split(',');
        for(const flocation of fromLocations) {
            from.push(getNameFromUniverseStations(flocation.split(':')[1]).name)
        }

        toLocations = hauling_request.to.split(',');
        for(const tlocation of toLocations) {
            to.push(getNameFromUniverseStations(tlocation.split(':')[1]).name)
        }

        from = from.join(',');
        to = to.join(',');
    } else {
        console.log('Pulling from Form');
        from = getStationNamesFromList('fromStations');
        to = getStationNamesFromList('toStations');

        hauling_request = {
            from: getStationInfoFromList('fromStations'),
            to: getStationInfoFromList('toStations'),
            maxBudget: parseInt($("#maxBudget").val()) || Number.MAX_SAFE_INTEGER,
            maxWeight: parseInt($("#maxWeight").val()) || Number.MAX_SAFE_INTEGER,
            minProfit: parseInt($("#minProfit").val()) >= 0 ? parseInt($("#minProfit").val()) : 500000,
            minROI: parseFloat((parseFloat($("#minROI").val()/100) || 0.04).toFixed(2)),
            routeSafety: $("#routeSafety").val() || "shortest",
            systemSecurity: $("#systemSecurity").val() || "high_sec,low_sec,null_sec",
            tax: parseFloat((parseFloat($("#tax").val()) || 0.08).toFixed(2))
        }
    }

    console.log(hauling_request);

    const qs = Object.keys(hauling_request)
        .map(key => `${key}=${hauling_request[key]}`)
        .join('&');

    if (history.pushState) {
        var newurl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${qs}`;
        window.history.pushState({path:newurl},'',newurl);
    }

    createTradeHeader(hauling_request, from, to);

    const qp = new URLSearchParams(hauling_request).toString();
    const requestUrl = `${API_ENDPOINT}/hauling?${qp}`;
    const timerHandler = `${new Date().getTime()} Hauling Request.`;

    console.time(timerHandler);

    $("#hauling-form").fadeOut(function(){
        $("#hauling-form").remove();
    });

    return fetch(requestUrl)
    .then(response => response.json())
    .then(function(response) {
        console.timeEnd(timerHandler);
        return response;
    });
}

function createTable(data) {
    $(".tableLoadingIcon").hide();
    let tableHTML = `<table id="dataTable" class="display"></table>`;
    tableHTML += `<br><br><a class="btn btn-grey btn-border btn-effect small-btn" href="javascript:window.location.replace(location.pathname);">New Search</a>`
    $('#noselect').html(tableHTML);
    $(".dataTableFilters").html("");

    var dataTableDOM = $("#dataTable");

    const columns = [{data: "View", name: "View"}];

    let sort_column = 1;
    let idx = 1;

    $.each(data[0], function(name, value) {
        if (name != "View") columns.push({data: name, title: name});
        if (name == "Profit Per Item") sort_column = idx;
        idx += 1;
    });

    dataTableDOM.DataTable({
        "order": [[sort_column, "desc"]],
        "lengthMenu": [[50], ["50"]],
        responsive: true,
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf'
        ],
        "columnDefs": [{
            "targets": 0,
            "orderable": false
        }],
        columns: columns,
        data: data
    });

    $("label > input").addClass("form-control").addClass("minor-text");
    $("label > input").attr("placeholder", "Filter by Station or Item");

    $(".dataTableFilters").append($("#dataTable_filter"));
    $(".dataTableFilters").append($(".dt-buttons"));
    $(".dt-button").addClass("btn");
    $(".dt-button").addClass("btn-default");

    $(".dataTables_paginate").on("click", function(){
        $(this)[0].scrollIntoView();
    });
}

function swapTradeHub(stationName) {
    switch(stationName) {
        case "Jita IV - Moon 4 - Caldari Navy Assembly Plant":
            return "Jita";
        case "Rens VI - Moon 8 - Brutor Tribe Treasury":
            return "Rens";
        case "Hek VIII - Moon 12 - Boundless Creation Factory":
            return "Hek";
        case "Dodixie IX - Moon 20 - Federation Navy Assembly Plant":
            return "Dodixie";
        case "Amarr VIII (Oris) - Emperor Family Academy":
            return "Amarr";
        default:
            return stationName
    }
}

/**
* Creates the datatable based on the trading style that is being queried
*/
function displayData(data) {

    data.forEach(function(row) {      
        from = swapTradeHub(row['From']['name']);
        to = swapTradeHub(row['Take To']['name']);

        row['From'] = `<span class='${row['From']['security_code']}'>${from}</span>`;
        row['Take To'] = `<span class='${row['Take To']['security_code']}'>${to}</span>`;
        row['View'] = `<span 
        data-itemid="${row['Item ID']}" 
        data-itemname="${row['Item']}"
        data-initialstation="${hauling_request['From']}"
        data-closingstation="${hauling_request['To']}">
        <i class="fa fa-search-plus"></i></span>`;
    });

    createTable(data);
}

function executeHauling(hasQueryParams) {
    $(".tableLoadingIcon").show();
    // createTradeHeader();

    getHaulingData(hasQueryParams).then((data) => {
        if (data.length == 0) {
            $(".tableLoadingIcon").html(`No Results Found<br><a class="btn btn-grey btn-border btn-effect" href="javascript:window.location.replace(location.pathname);">Refresh this page</a>`);
        } else {
            displayData(data);
        }
    });
}

/**
 * Initializes on window load
 */
function loadNext() {
    
    try {
        if (window.location.search.length > 0) {
            var search = window.location.search.substring(1);
            const thr = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');

            if (thr.from && thr.to && thr.maxBudget && thr.maxWeight && thr.minProfit && thr.minROI && thr.routeSafety && thr.systemSecurity && thr.tax) {
                console.log("Found query params:");
                console.log(thr);
                hauling_request = thr;
    
                getUniverseList().then(function(data) {
                    universeList = data;
                    executeHauling(true);
                });
                return;
            }

            console.log(`Invalid search parameters: ${search}`);
        }

    } catch(e) {
        console.log(`Error parsing query params ${location.search}.`);
    }
    
    getStationList().then(function(stationList) {        
        stationList.forEach(function(station){
            var option = document.createElement("option");
            option.innerHTML = station;
            $("#stationList").append(option);
        });
        
        console.log(`${stationList.length} stations loaded.`);

        initAwesomplete("from", "stationList");
        initAwesomplete("to", "stationList");
    });
    
    getUniverseList().then(function(data) {
        universeList = data;
    });

        
    $("#submit").click(function(){
        // Form Validation
        if (getStationNamesFromList('fromStations') == "" || getStationNamesFromList('toStations') == "") {
            window.alert("Please select a valid from and to station.");
            return false;
        } else {
            $("#submit"). attr("disabled", true);
            executeHauling(false);
        }
    });

    const formElements = ['minProfit', 'maxWeight', 'minROI', 'maxBudget', 'tax', 'systemSecurity', 'routeSafety'];
    for (let i = 0; i < formElements.length; i++) {
        $(`#${formElements[i]}`).inputStore();
    }
}