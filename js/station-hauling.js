let hauling_request = {};
let startTime = 0;
let runTime = 0;

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

function isRoman(string) {
    // regex pattern
    const pattern = /^(M{1,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})|M{0,4}(CM|C?D|D?C{1,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})|M{0,4}(CM|CD|D?C{0,3})(XC|X?L|L?X{1,3})(IX|IV|V?I{0,3})|M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|I?V|V?I{1,3}))$/
    return pattern.test(string);
};

function getSystemFromStation(station) {   
    if (station.indexOf('Entire System') >= 0) {
        return station;
    }   

    const stationSplit = station.split(' - ')[0].split(' ');
    let systemName = '';
    stationSplit.forEach(function(word) {
        if (!isRoman(word) && word[0] != '(') {
            systemName += word + ' ';
        }
    });

    return `${systemName.trim()} (Entire System)`;
}

function addStationToList(stationName, domId) {
    const data = universeList[stationName.toLowerCase()];
    const dataAttribute = `#${domId} li[data-station="${data.station}"]`;
    
    let stationList = $(`#${domId}`);
    
    if ($(dataAttribute).length == 0) {
        stationList.show();
        stationList.append(`<li data-region="${data.region}" data-system="${data.system}" data-station="${data.station}">` +
            `<span class="stationName">${stationName}</span>` + 
            `<span class="addSystem btn-grey btn-border btn-effect small-btn">Add System</span>` + 
            `<span class="remove-item">x</span></li>`
        );
        
        $(`#${domId} li`).on("click", function(evt) {
            const classes = evt.target.classList;
            if (classes.contains('addSystem')) {
                const label = $(this).children()[0];
                const systemName = getSystemFromStation(label.textContent);
                $(label).text(systemName);
                $(this).children()[1].remove();

                $(this).attr('data-system-list', getAllStationsForSystem($(this).attr('data-system')));
            } else {
                const parent = $(this.parentElement);
                $(this).remove();
                const children = parent.children().length;
                
                if(children <= 1) {
                    parent.hide();
                } else {
                    parent.show();
                }
            }
        });
    } else {
        console.log(`Station ${stationName} already added.`);
    }
}

function getStationInfoFromList(domId) {
    const stations = [];
    const stationList = $(`#${domId} li`);
    stationList.each(function() {
        if ($(this).attr('data-system-list') != undefined) {
            stations.push($(this).attr('data-system-list'));
        } else {
            stations.push(`${$(this).attr('data-region')}:${$(this).attr('data-station')}`);
        }
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

function getAllStationsForSystem(system_id) {
    const systemInformation = [];
    Object.values(universeList).forEach(function(item) {
        if ('system' in item && item.system == system_id) {
            systemInformation.push(`${item.region}:${item.station}`);
        }
    });
    return systemInformation.join(',');
}

/**
* Initializes the auto complete function for the given input.
* @param {} domId The id of the input to initialize. 
* @param {*} list  The list of options to use for the auto complete.
*/
function initAwesomplete(domId, list) {
    var input = document.querySelector("#" + domId);
    new Awesomplete(input, {
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

    const minProfit = round_value(request.minProfit, 0);
    const maxWeight = request.maxWeight == Number.MAX_SAFE_INTEGER ? "Infinite" : round_value(request.maxWeight, 0);
    const minROI = (request.minROI * 100).toFixed(2) + "%";
    const maxBudget = request.maxBudget == Number.MAX_SAFE_INTEGER ? "Infinite" : round_value(request.maxBudget, 0);
    const tax = round_value(request.tax * 100, 2) + "%";
    
    let systemSecurity = request.systemSecurity;
    switch(systemSecurity) {
        case "high_sec,low_sec,null_sec":
            systemSecurity = "High, Low, and Null";
            break;
        case "high_sec,low_sec":
            systemSecurity = "High and Low";
            break;
        default:
            systemSecurity = "Only High";
            break;
    }
    
    const routeSafety = request.routeSafety.replace('secure', 'Safest').replace('insecure', 'Least Safe').replace('shortest', 'Shortest');
    
    let subHeader = `<b>Profit&nbsp;Above:</b>&nbsp;${minProfit} | <b>Capacity:</b>&nbsp;${maxWeight} | <b>R.O.I.:</b>&nbsp;${minROI} | <b>Budget:</b>&nbsp;${maxBudget}`;
    subHeader += `<br><b>Sales&nbsp;Tax:</b>&nbsp;${tax} | <b>Security:</b>&nbsp;${systemSecurity} | <b>Route:</b>&nbsp;${routeSafety}`;
    
    $('main h1').hide();

    const fromList = from.split(',');
    let fromli = '';
    for (let i = 0; i < fromList.length; i++ ) {
        fromli += `<li>${fromList[i]}</li>`;
    }

    const toList = to.split(',');
    let toli = '';
    for (let i = 0; i < toList.length; i++ ) {
        toli += `<li>${toList[i]}</li>`;
    }

    $('main h2').html(`
        <div class="row header-row">
            <div class="col-sm-12 col-md-6">
                <ul id="fromStations" class="hauling-list header-list">
                    <p> Buying From </p>
                    ${fromli}
                </ul>
            </div>
            <div class="col-sm-12 col-md-6">
                <ul id="toStations" class="hauling-list header-list">
                    <p> Selling To </p>
                    ${toli}
                </ul>
            </div>
        </div>`
    );
    $('.header-list').show();
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
 * Collapse the given list of stations to a system if all stations are added
 * @param {*} locations 
 * @returns 
 */
function collapseStationsToSystems(locations) {
    const systemIdCount = {};
    // Count the number of systems across locations
    for (const location of locations) {
        const obj = universeList[location.toLowerCase()]
        systemIdCount[obj.system] = (systemIdCount[obj.system] || 0) + 1;
    }

    // If system count == total stations then mark as true
    for (const systemId in systemIdCount) {
        const systemCount = Object.values(universeList).filter(function(item) {
            return item.system == systemId
        }).length;
        if (systemCount == systemIdCount[systemId]) {
            systemIdCount[systemId] = true;
        }
    }

    // Collapse stations to systems if true
    const newLocations = new Set();
    for (const location of locations) {
        const obj = universeList[location.toLowerCase()];
        if (systemIdCount[obj.system] === true) {
            newLocations.add(`${getSystemFromStation(location)} (Entire System)`);
        } else {
            newLocations.add(location);
        }
    }

    return Array.from(newLocations);
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

        from = collapseStationsToSystems(from);
        
        toLocations = hauling_request.to.split(',');
        for(const tlocation of toLocations) {
            to.push(getNameFromUniverseStations(tlocation.split(':')[1]).name)
        }

        to = collapseStationsToSystems(to);

        from = from.join(',');
        to = to.join(',');
    } else {
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
            tax: parseFloat((parseFloat($("#tax").val()/100) || 0.08).toFixed(4))
        }
    }
        
    const qs = Object.keys(hauling_request)
    .map(key => `${key}=${hauling_request[key]}`)
    .join('&');
    
    if (history.pushState) {
        var newurl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${qs}`;
        window.history.pushState({urlPath:newurl}, '', newurl);
    }
    
    createTradeHeader(hauling_request, from, to);
    
    const qp = new URLSearchParams(hauling_request).toString();
    const requestUrl = `${API_ENDPOINT}/hauling?${qp}`;
    startTime = new Date();
    
    $("#hauling-form").fadeTo('fast', 0, function() {});
    
    return fetchWithRetry(
        url = requestUrl,
        tries = 3,
        errorMsg = `Error retrieving orders for this station hauling request. Please try refreshing this page.`
    ).then(response => response.json())
    .then(function(response) {
        return response;
    });
}

let initial_hidden = [];

function createTable(data) {
    $("#hauling-form").remove();
    $(".tableLoadingIcon").hide();

    let tableHTML = `<span class='dropdown-holder'><button class="btn btn-grey btn-border btn-effect small-btn show-hide dropdown-toggle" type="button" data-toggle="dropdown"> Show/Hide Columns </button>`
    tableHTML += `<ul id="colvis" class="colvis dropdown-menu" x-placement="bottom-start"></ul></span>`
    tableHTML += `<a class="btn btn-grey btn-border btn-effect small-btn" href="javascript:window.location.replace(location.pathname);">New Search</a>`;
    tableHTML += `<a class="btn btn-grey btn-border btn-effect small-btn" href="javascript:window.location.reload();">Refresh Data</a>`;
    tableHTML += `<table id="dataTable" class="display"></table></table><p><div class="request_time"><p><span id="time_taken"></span></p></div>`;
    $('#coreTable').html(tableHTML);
    $(".dataTableFilters").html("");
    
    var dataTableDOM = $("#dataTable");
    
    const columns = [{data: "View", name: "View"}];
    
    let sort_column = 1;
    let idx = 1;
    let hidden_columns = [];
    
    initial_hidden = window.localStorage.getItem('evetrade_station_col_preferences');
    if (initial_hidden == null) {
        initial_hidden = ["Item ID", "Net Costs", "Net Sales", "Gross Margin", "Sales Taxes", "Jumps", "Profit per Jump"];
    } else {
        initial_hidden = initial_hidden.split(',');
    }
    
    $.each(data[0], function(name, value) {
        if (name != "View") {
            columns.push({data: name, title: name});
            $('.colvis').append(`<li><button class="colvistoggle btn btn-effect small-btn is-true" colidx="${idx}">${name}</button></li>`);
        }
        if (name == "Profit Per Item") sort_column = idx;
        if (initial_hidden.includes(name)) hidden_columns.push(idx);
        idx += 1;
    });
    
    // Append to colvis as we loop
    // <li><button class="colvistoggle btn btn-default is-true" colidx="1">Sell Order</button></li>
    
    const dt = dataTableDOM.DataTable({
        "order": [[sort_column, "desc"]],
        "lengthMenu": [[50], ["50"]],
        responsive: true,
        dom: 'frtipB',
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
    $("label > input").attr("placeholder", "Search Table ...");
    
    $(".dataTableFilters").append($("#dataTable_filter"));
    $(".dataTableFilters").append($(".dt-buttons"));
    $(".dt-button").addClass("btn btn-effect");
    
    $(".dataTables_paginate").on("click", function(){
        $(this)[0].scrollIntoView();
    });
    
    $(".dataTable tr").on('click',function() {
        $(this).toggleClass('row_selected');
    });
    
    
    $(".colvistoggle").on('click',function(e) {
        e.preventDefault();
        // Get the column API object
        var column = dt.column($(this).attr('colidx'));
        // Toggle the visibility
        $(this).removeClass("is-" + column.visible());
        column.visible(!column.visible());
        $(this).addClass("is-" + column.visible());
        if (!column.visible()) {
            initial_hidden.push($(this).text());
        } else {
            initial_hidden.splice(initial_hidden.indexOf($(this).text()), 1);
        }
        
        window.localStorage.setItem('evetrade_station_col_preferences', initial_hidden.join(','));
    });
    
    for (let i = 0; i < hidden_columns.length; i++) {
        $(`[colidx="${hidden_columns[i]}"]`).removeClass('is-true');
        $(`[colidx="${hidden_columns[i]}"]`).addClass('is-false');
        dt.column(hidden_columns[i]).visible(false);
    }

    runTime = new Date() - startTime;
    console.log(`Request took ${runTime}ms`);
    $("#time_taken").html(`Request took ${runTime/1000} seconds.`);
}

function swapTradeHub(station) {
    const stationName = station['name'];
    const stationSecurity = station['rating'].toFixed(1).replace('.', '');

    return `<span class='security-code${stationSecurity}' title='Security Rating: ${station['rating'].toFixed(2)}'>${stationName}</span>`;
}

function getProperStationInformation(station_id, list) {
    if (list.indexOf(',') >= 0) {
        list = list.split(',');
        for (let i = 0; i < list.length; i++) {
            if (list[i].indexOf(station_id) >= 0) {
                return list[i];
            }
        }
    } else {
        return list;
    }
}

/**
* Creates the datatable based on the trading style that is being queried
*/
function displayData(data) {
    
    data.forEach(function(row) { 
        station_id_from = row['From']['station_id'];
        station_id_to = row['Take To']['station_id'];
        const properFromLocation = getProperStationInformation(station_id_from, hauling_request['from']);
        const propertToLocation = getProperStationInformation(station_id_to, hauling_request['to']);

        const from = swapTradeHub(row['From']);
        const to = swapTradeHub(row['Take To']);
        row['From'] = from;
        row['Take To'] = to;
        
        row['View'] = `<a class="investigate" title="View Market Depth for ${row['Item']}"  href=
        '/orders.html?itemId=${row['Item ID']}&from=${properFromLocation}&to=${propertToLocation}' 
        target='_blank'><i class="fa fa-search-plus"></i></a>`;
    });
    
    createTable(data);
}

function executeHauling(hasQueryParams) {
    countDownDivText(functionDurations['evetrade-get-hauling-orders']);
    $(".tableLoadingIcon").show();
    
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
    
    
    $("#submit").click(function(e){
        // Form Validation
        if (getStationNamesFromList('fromStations') == "" || getStationNamesFromList('toStations') == "") {
            window.alert("Please select a valid starting AND ending stations.");
        } else {
            $("#submit").attr("disabled", true);
            executeHauling(false);
        }

        return false;
    });
    
    const formElements = ['minProfit', 'maxWeight', 'minROI', 'maxBudget', 'tax', 'systemSecurity', 'routeSafety'];
    for (let i = 0; i < formElements.length; i++) {
        $(`#${formElements[i]}`).inputStore({
            name: 'station-' + formElements[i]
        });
    }
}
