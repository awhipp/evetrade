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
        }
        
        getResourceData('stationList.json').then(function(response) {
            console.log('Station List Loaded.');
            window.localStorage.setItem(jsonCacheKey, JSON.stringify(response));
            window.localStorage.setItem(dateCacheKey, dateString);
            resolve(response);
        });
    });
    
}

function addStationToList(stationName, domId) {
    const data = universeList[stationName.toLowerCase()];
    const dataAttribute = `#${domId} li[data-station="${data.station}"]`;
    
    let stationList = $(`#${domId}`);
    
    if ($(dataAttribute).length == 0) {
        stationList.show();
        stationList.append(`<li data-region="${data.region}" data-station="${data.station}"><span class="stationName">${stationName}</span><span class="remove-item">x</span></li>`);
        
        $(`#${domId} li`).on("click", function() {
            const parent = $(this.parentElement);
            $(this).remove();
            const children = parent.children().length;
            
            if(children <= 1) {
                parent.hide();
            } else {
                parent.show();
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
        stations.push(`${$(this).attr('data-region')}:${$(this).attr('data-station')}`);
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
    new Awesomplete(input, {
        list: "#" + list,
        minChars: 1,
        maxItems: 5,
        autoFirst: true,
        tabSelect: true,
        filter: Awesomplete.FILTER_STARTSWITH,
        sort: false,
    });
}

function createTradeHeader(request, from) {

    const profit = request.profit;
    const tax = (request.tax * 100).toFixed(2) + "%";
    const minVolume = request.min_volume;
    const volumeFilter = request.volume_filter == 1 ? '24-Hour Average' : `${request.volume_filter}-Day Average`;
    const fee = request.fee;
    const margins = `${(request.margins.split(',')[0]*100).toFixed(2)}%&nbsp;and&nbsp;${(request.margins.split(',')[1]*100).toFixed(2)}%`;
        
    let subHeader = `<b>Profit&nbsp;Above:</b>&nbsp;${profit} | <b>Sales&nbsp;Tax:</b>&nbsp;${tax} | <b>Broker&nbsp;Fee:</b>&nbsp;${fee}`;
    subHeader += `<br><b>Min&nbsp;Volume:</b>&nbsp;${minVolume} | <b>Filter&nbsp;By:</b>&nbsp;${volumeFilter} | <b>Margins:</b>&nbsp;${margins}`;
    
    $('main h1').hide();

    $('main h2').html(`
        <div class="row header-row">
            <div class="col-sm-12">
                <ul id="fromStations" class="hauling-list header-list">
                    <p> Station Trading at: </p>
                    ${from}
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
* Pulls data from form HTML element and creates JSON
*/
async function getTradingData(hasQueryParams) {
    let from = [];
    
    if (hasQueryParams) {
        // Converting From/To Query Params back to station names.
        fromLocations = trading_request.from.split(',');
        for(const flocation of fromLocations) {
            from.push(getNameFromUniverseStations(flocation.split(':')[1]).name)
        }
        
        from = from.join(',');
    } else {
        console.log('Pulling from Form');
        from = $('#from').val();
        
        trading_request = {
            from: from,
            profit: parseInt($("#profit").val()) >= 0 ? parseInt($("#profit").val()) : 1000,
            tax: parseFloat((parseFloat($("#tax").val()/100) || 0.08).toFixed(4)),
            min_volume: parseInt($("#minVolume").val()) >= 0 ? parseInt($("#minVolume").val()) : 1000,
            volume_filter: $("#volumeFilter").val() || "1",
            fee: parseFloat((parseFloat($("#fee").val()/100) || 0.03).toFixed(4)),
            margins: parseFloat((parseFloat($("#marginAbove").val()/100) || 0.02).toFixed(4)) + ',' +
                parseFloat((parseFloat($("#marginBelow").val()/100) || 0.04).toFixed(4))
        }
    }
    
    console.log(trading_request);
    
    const qs = Object.keys(trading_request)
    .map(key => `${key}=${trading_request[key]}`)
    .join('&');
    
    if (history.pushState) {
        var newurl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${qs}`;
        window.history.pushState({path:newurl},'',newurl);
    }
    
    createTradeHeader(trading_request, from);
    
    const qp = new URLSearchParams(trading_request).toString();
    const requestUrl = `${API_ENDPOINT}/station?${qp}`;
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

    let tableHTML = `<span class='dropdown-holder'><button class="btn btn-grey btn-border btn-effect small-btn show-hide dropdown-toggle" type="button" data-toggle="dropdown"> Show/Hide Columns <span class="caret"></span> </button>`
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

/**
* Creates the datatable based on the trading style that is being queried
*/
function displayData(data) {
    
    data.forEach(function(row) {      
        from = swapTradeHub(row['From']);
        to = swapTradeHub(row['Take To']);
        
        row['From'] = from;
        row['Take To'] = to;
        row['View'] = `<a class="investigate" title="View Market Depth for ${row['Item']}"  href=
        '/orders.html?itemId=${row['Item ID']}&from=${trading_request['from']}&to=${trading_request['from']}' 
        target='_blank'><i class="fa fa-search-plus"></i></a>`;
    });
    
    createTable(data);
}

function executeTrading(hasQueryParams) {
    $(".tableLoadingIcon").show();
    
    getTradingData(hasQueryParams).then((data) => {
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
    });
    
    getUniverseList().then(function(data) {
        universeList = data;
    });
    
    
    $("#submit").click(function(){
        // Form Validation
        if ($('#from').val().length <= 0) {
            window.alert("Please select a valid starting station.");
            return false;
        } else {
            $("#submit"). attr("disabled", true);
            executeTrading(false);
        }
    });
    
    const formElements = ['profit', 'tax', 'minVolume', 'volumeFilter', 'fee', 'marginAbove', 'marginBelow'];
    for (let i = 0; i < formElements.length; i++) {
        $(`#${formElements[i]}`).inputStore({
            name: 'station-' + formElements[i]
        });
    }
}
