let hauling_request = {};
let startTime = 0;
let runTime = 0;

let fromPreference = 'sell';
let toPreference = 'buy';

let API_ENDPOINT = '';

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
        filter: Awesomplete.FILTER_CONTAINS,
        sort: false,
    });
    
    $(input).on('awesomplete-select', function(selection) {
        console.log(`Added (select): ${selection.originalEvent.text.value}`);
        $(input).blur();
        setTimeout(function() {
            updateNearbyCount();
        }, 500);
    });
    $(input).on('awesomplete-close', function() {
        setTimeout(function() {
            updateNearbyCount();
        }, 500);
    });


}

function createTradeHeader(request, from, to) {
    
    const minProfit = round_value(request.minProfit, 0);
    const maxWeight = request.maxWeight == Number.MAX_SAFE_INTEGER ? "Infinite" : round_value(request.maxWeight, 0);
    const minROI = (request.minROI * 100).toFixed(2) + "%";
    const maxBudget = request.maxBudget == Number.MAX_SAFE_INTEGER ? "Infinite" : round_value(request.maxBudget, 0);
    const tax = round_value(request.tax * 100, 2) + "%";

    let structureType = request.structureType;
    switch(structureType) {
        case "citadel":
            structureType = "Player Only";
            break;
        case "npc":
            structureType = "NPC Only";
            break;
        default:
            structureType = "NPC and Player";
            break;
    }

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
    subHeader += `<br><b>Trade Preference:</b>&nbsp;${cap(fromPreference)} Orders to ${cap(toPreference)} Orders | <b>Structures:</b>&nbsp;${structureType}`;
    
    $('main h1').hide();

    $('main h2').html(`
        <div class="row header-row">
            <div class="col-sm-12 col-md-6">
                <ul id="fromRegion" class="hauling-list header-list">
                    <p> Buying From </p>
                    <li>${from}</li>
                </ul>
            </div>
            <div class="col-sm-12 col-md-6">
                <ul id="toRegion" class="hauling-list header-list">
                    <p> Selling To </p>
                    <li>${to}</li>
                </ul>
            </div>
        </div>`
    );
    $('.header-list').show();
    $('main h3').html(subHeader);

}


function getNameFromUniverseRegionName(regionName) {
    regionName = regionName.toLowerCase();
    if (regionName.toLowerCase().indexOf('nearby regions') >= 0) {
        return {
            'id': 'nearby'
        };
    } 
    
    for (const name in universeList) {
        if (universeList[name].name.toLowerCase() == regionName) {
            return universeList[name];
        }
    }
    $(".tableLoadingIcon").hide();
    $("#submit").attr("disabled", false);
    window.alert(`Region name (${regionName}) not found in universe list. Retry query parameters. (Error Code: ${Object.values(universeList).length})`);
    throw 'RegionName not found in universe list. Retry query parameters.';
}


function getNameFromUniverseRegionId(regionId) {  
    if (regionId.toLowerCase().indexOf('nearby') >= 0) {
        return 'nearby';
    } 
    for (const name in universeList) {
        if (universeList[name].id !== undefined && universeList[name].id == regionId) {
            return universeList[name];
        }
    }
    $(".tableLoadingIcon").hide();
    $("#submit").attr("disabled", false);
    window.alert(`Region ID (${regionId}) not found in universe list. Retry query parameters. (Error Code: ${Object.values(universeList).length})`);
    throw 'RegionId not found in universe list. Retry query parameters.';
}

function getFromTradePreference(req) {
    if (req.indexOf('buy-') >= 0) {
        fromPreference = 'buy';
    } else if (req.indexOf('sell-') >= 0) {
        fromPreference = 'sell';
    }
    
    req = req.replace('buy-', '').replace('sell-', '');
    return req;
}

function getToTradePreference(req) {
    if (req.indexOf('buy-') >= 0) {
        toPreference = 'buy';
    } else if (req.indexOf('sell-') >= 0) {
        toPreference = 'sell';
    }
    
    req = req.replace('buy-', '').replace('sell-', '');
    return req;
}

/**
* Pulls data from form HTML element and creates JSON
*/
async function getHaulingData(hasQueryParams) {
    let from = [];
    let to = [];
    
    if (hasQueryParams) {
         // Converting From/To Query Params back to station names.
        hauling_request.from = getFromTradePreference(hauling_request.from);
        from = getNameFromUniverseRegionId(hauling_request.from);
        hauling_request.from = `${fromPreference}-${hauling_request.from}`;
        
        hauling_request.to = getToTradePreference(hauling_request.to);
        to = getNameFromUniverseRegionId(hauling_request.to);
        hauling_request.to = `${toPreference}-${hauling_request.to}`;

        if (to.name === undefined) {
            to = {};
            to.name = getNumberNearbyRegions(from.name).join(", ");
        }

        createTradeHeader(hauling_request, from.name, to.name);
        
    } else {
        console.log('Pulling from Form...');
        from = $('#from').val();
        to = $('#to').val();

        tradePreference = $('#tradePreference').val();

        if (tradePreference.length > 0) {
            fromPreference = $('#tradePreference').val().split('-')[0];
            toPreference = $('#tradePreference').val().split('-')[1];
        }
        
        hauling_request = {
            from:`${fromPreference}-${getNameFromUniverseRegionName(from).id}`,
            to: `${toPreference}-${getNameFromUniverseRegionName(to).id}`,
            maxBudget: parseInt($("#maxBudget").val()) || Number.MAX_SAFE_INTEGER,
            maxWeight: parseInt($("#maxWeight").val()) || Number.MAX_SAFE_INTEGER,
            minProfit: parseInt($("#minProfit").val()) >= 0 ? parseInt($("#minProfit").val()) : 500000,
            minROI: parseFloat((parseFloat($("#minROI").val()/100) || 0.04).toFixed(2)),
            routeSafety: $("#routeSafety").val() || "shortest",
            structureType: $("#structureType").val() || "both",
            systemSecurity: $("#systemSecurity").val() || "high_sec,low_sec,null_sec",
            tax: parseFloat((parseFloat($("#tax").val()/100) || 0.045).toFixed(4))
        }

        if (to.indexOf('Nearby Regions') > -1) {
            to = getNumberNearbyRegions(from).join(", ");
        }

        createTradeHeader(hauling_request, from, to);
    }
        
    const qs = Object.keys(hauling_request)
    .map(key => `${key}=${hauling_request[key]}`)
    .join('&');
    
    if (history.pushState) {
        var newurl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${qs}`;
        window.history.pushState({path:newurl},'',newurl);
    }
    
    const qp = new URLSearchParams(hauling_request).toString();
    const requestUrl = `${API_ENDPOINT}?${qp}`;
    startTime = new Date();
    
    $("#hauling-form").remove();
    
    return fetchWithRetry(
        url = requestUrl,
        tries = 3,
        errorMsg = `Error retrieving orders for this region hauling request. Please try refreshing this page.`
    ).then(function(response) {
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
    tableHTML += `<table id="dataTable" class="display"></table><div class="request_time"><p><span id="time_taken"></span></p></div>`;
    $('#coreTable').html(tableHTML);
    $(".dataTableFilters").html("");
    
    var dataTableDOM = $("#dataTable");
    
    const columns = [{data: "View", name: "View"}];
    
    let sort_column = 1;
    let idx = 1;
    let hidden_columns = [];
    
    initial_hidden = window.localStorage.getItem('evetrade_region_col_preferences');
    if (initial_hidden == null) {
        initial_hidden = ["Item ID", "Net Costs", "Net Sales", "Gross Margin", "Sales Taxes"];
    } else {
        initial_hidden = initial_hidden.split(',');
    }
    
    $.each(data[0], function(name, value) {
        if (name != "View") {
            columns.push({data: name, title: name});
            $('.colvis').append(`<li><button class="colvistoggle btn btn-effect small-btn is-true" colidx="${idx}">${name}</button></li>`);
        }
        if (name == "Profit per Jump") sort_column = idx;
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
        
        window.localStorage.setItem('evetrade_region_col_preferences', initial_hidden.join(','));
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
    const stationRating = station['rating'] < 0 ? 0.0 : station['rating'];
    const stationSecurity = stationRating.toFixed(1).replace('.', '').replace('-', '');

    if (station['citadel']) {
        return `<span class='security-code${stationSecurity} citadel' title='Citadel // Security Rating: ${station['rating'].toFixed(2)}'>${stationName}*</span>`;
    }
    return `<span class='security-code${stationSecurity}' title='Security Rating: ${station['rating'].toFixed(2)}'>${stationName}</span>`;
}

/**
* Creates the datatable based on the trading style that is being queried
*/
function displayData(data) {
    
    data.forEach(function(row) {
        from = swapTradeHub(row['From']);
        to = swapTradeHub(row['Take To']);

        // Needs to be first before we replace the row values
        row['View'] = `<a class="investigate" title="View Market Depth for ${row['Item']}" href=
        '/orders.html?itemId=${row['Item ID']}&from=${hauling_request.from}:${row['From'].station_id}&to=${hauling_request.to}:${row['Take To'].station_id}' 
        target='_blank'><i class="fa fa-search-plus"></i></a>`;
        

        row['From'] = from;
        row['Take To'] = to;
    });
    
    createTable(data);
}

function executeHauling(hasQueryParams) {
    countDownDivText(functionDurations['evetrade_api']);
    $(".tableLoadingIcon").show();
    
    getHaulingData(hasQueryParams).then((data) => {
        if (data.length == 0) {
            $(".tableLoadingIcon").html(`No Results Found<br><a class="btn btn-grey btn-border btn-effect" href="javascript:window.location.replace(location.pathname);">Refresh this page</a>`);
        } else {
            try {
                displayData(data);
            } catch (e) {
                window.alert(`Unhandled Exception has occurred. Please try again.`);
                console.log(e);
            }
        }
    });
}

let disclaimer_shown = false;

function updateNearbyCount(){
    if ($("#nearbyOnly").is(":checked")) {
        $("#to").attr("disabled", true);
        if ($("#from").val() == "") {
            $("#to").val("<< Select a Starting Region >>");
            $("#nearbyList").text(``);
        } else {
            try{
                nearby = getNumberNearbyRegions($("#from").val());
                // TODO: Get nearby regions from API
                $("#to").val(`${nearby.length} Nearby Regions`);
                $("#nearbyList").text(`Regions Include: ${nearby.join(", ")}`);
            } catch(e) {
                $("#to").val("<< Select a Valid Starting Region >>");
                $("#nearbyList").text(``);
            }
        }
    } else {
        if ($("#to").val().indexOf("Nearby Regions") > -1 || $("#to").val().indexOf("<<") > -1) {
            $("#to").attr("disabled", false);
            $("#to").val("");
            $("#nearbyList").text(``);
        }
    }
}

function getNumberNearbyRegions(region_name) {
    nearbyIds = nearbyRegions[universeList[region_name.toLowerCase()].id];
    nearbyRegionNames = []
    for (universeObject in universeList) {
        if (nearbyIds.includes(universeList[universeObject].id)) {
            nearbyRegionNames.push(universeList[universeObject].name);
        }
    }
    nearbyRegionNames.push(region_name);
    return nearbyRegionNames.sort()
}

/**
* Initializes on window load
*/
function loadNext() { 
    API_ENDPOINT = `${global_config['api_gateway']}/hauling`;
    
    try {
        if (window.location.search.length > 0) {
            var search = window.location.search.substring(1);
            const thr = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
            
            if (thr.from && thr.to && thr.maxBudget && thr.maxWeight && thr.minProfit && thr.minROI && thr.routeSafety && thr.structureType && thr.systemSecurity && thr.tax) {
                hauling_request = thr;
                executeHauling(true);
                return;
            }
            
            console.log(`Invalid search parameters: ${search}`);
        }
        
    } catch(e) {
        console.log(`Error parsing query params ${location.search}.`);
    }

    regionList.forEach(function(region){
        var option = document.createElement("option");
        option.innerHTML = region;
        $("#regionList").append(option);
    });
    
    initAwesomplete("from", "regionList");
    initAwesomplete("to", "regionList");
    
    $("#submit").click(function(){
        // Form Validation
        if ($('#from').val() == "" || $('#to').val() == "" || $('#to').val().indexOf("<<") >= 0) {
            window.alert("Please select a valid starting AND ending regions.");
        } else {
            $("#submit").attr("disabled", true);
            executeHauling(false);
        }

        return false;
    });
    
    const formElements = ['minProfit', 'maxWeight', 'minROI', 'maxBudget', 'tax', 'systemSecurity', 'structureType', 'routeSafety', 'tradePreference'];
    for (let i = 0; i < formElements.length; i++) {
        $(`#${formElements[i]}`).inputStore({
            name: 'region-' + formElements[i]
        });
        updateNearbyCount();
    }
    
    if ($("#tradePreference").val() != "") {
        disclaimer_shown = true;
        $(".disclaimer").slideToggle();
    }

    $("#tradePreference").change(function(){
        if ($("#tradePreference").val() != "" && !disclaimer_shown) {
            disclaimer_shown = true;
            $(".disclaimer").slideToggle();
        }

        if ($("#tradePreference").val() == "" && disclaimer_shown) {
            disclaimer_shown = false;
            $(".disclaimer").slideToggle();
        }

    });

    $("#nearbyOnly").change(updateNearbyCount);
}
