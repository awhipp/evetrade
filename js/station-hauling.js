
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
        filter: Awesomplete.FILTER_STARTSWITH,
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

function createTradeHeader(request) {

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
    subHeader += `<br><br>Budget: ${maxBudget} | Sales Tax: ${tax} | Security: ${systemSecurity} | Route: ${routeSafety}`

    $('main h1').hide();
    $('main h2').html(`Buying from: ${$("#from").val()}<br>Selling to: ${$("#to").val()}`);
    $('main h3').html(subHeader);

}

/**
 * Pulls data from form HTML element and creates JSON
 */
async function getHaulingData() {
    let from = universeList[$("#from").val().toLowerCase()];
    let to = universeList[$("#to").val().toLowerCase()];

    hauling_request = {
        from: `${from.region}:${from.station}`,
        to: `${to.region}:${to.station}`,
        maxBudget: parseInt($("#maxBudget").val()) || Number.MAX_SAFE_INTEGER,
        maxWeight: parseInt($("#maxWeight").val()) || Number.MAX_SAFE_INTEGER,
        minProfit: parseInt($("#minProfit").val()) >= 0 ? parseInt($("#minProfit").val()) : 500000,
        minROI: parseFloat((parseFloat($("#minROI").val()) || 0.04).toFixed(2)),
        routeSafety: $("#routeSafety").val() || "shortest",
        systemSecurity: $("#systemSecurity").val() || "high_sec,low_sec,null_sec",
        tax: parseFloat((parseFloat($("#tax").val()) || 0.08).toFixed(2))
    }

    console.log(hauling_request);

    createTradeHeader(hauling_request);

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
    $('#noselect').html('<table id="dataTable" class="display"></table>');
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
        case "Rens V - Moon 1 - Caldari Navy Assembly Plant":
            return "Rens";
        case "Hek VIII - Moon 1 - Caldari Navy Assembly Plant":
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
        row['From'] = `<span class='${row['From']['security_code']}'>${swapTradeHub(row['From']['name'])}</span>`;
        row['Take To'] = `<span class='${row['Take To']['security_code']}'>${swapTradeHub(row['Take To']['name'])}</span>`;
        row['View'] = `<span 
        data-itemid="${row['Item ID']}" 
        data-itemname="${row['Item']}"
        data-initialstation="${hauling_request['From']}"
        data-closingstation="${hauling_request['To']}">
        <i class="fa fa-search-plus"></i></span>`;
    });

    createTable(data);
}

function executeHauling() {
    $(".tableLoadingIcon").show();
    // createTradeHeader();

    getHaulingData().then((data) => {
        if (data.length == 0) {
            $(".tableLoadingIcon").html(`No Results Found<br><a class="btn btn-grey btn-border btn-effect" href="javascript:location.reload(true)">Refresh this page</a>`);
        } else {
            displayData(data);
        }
    });
}

/**
 * Initializes on window load
 */
function loadNext() {
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
        if ($("#from").val() == "" || $("#to").val() == "") {
            alert("Please select a valid from and to station.");
        } else {
            $("#submit"). attr("disabled", true);
            executeHauling();
        }
    });
}
