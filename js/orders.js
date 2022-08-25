let startTime = 0;
let runTime = 0;

/**
* Generic function to get JSON data from API endpoint
* @param {*} fileName 
* @returns The Data from the API.
*/
function getOrdersData(itemId, from, to) {
    return fetchWithRetry(
        url = `${API_ENDPOINT}/orders?itemId=${itemId}&from=${from}&to=${to}`,
        tries = 3,
        errorMsg = `Unable to retrieve orders from API for given itemId (${itemId}). Please try refreshing this page.`
    ).then(function(response) {
        return response;
    });
}

function setStationNames() {
    let startSet = '';
    let endSet = '';

    for (const stationName in universeList) {
        if (startSet.length == 0 && universeList[stationName].name.indexOf('-') > 0 && universeList[stationName].station == thr.from.split(':')[1]) {
            console.log(universeList[stationName]);
            $("#starting-station").text(universeList[stationName].name);
            startSet = universeList[stationName].name;
        }
        if (endSet.length == 0 && universeList[stationName].name.indexOf('-') > 0 && universeList[stationName].station == thr.to.split(':')[1]) {
            $("#ending-station").text(universeList[stationName].name);
            endSet = universeList[stationName].name;
        }
    }

    if (startSet == endSet) {
        $("#stationsRow").text(startSet);
    }
}

function getInvTypes() {
    return new Promise (function(resolve, reject) {
        const dateCacheKey = 'evetrade_inv_types_last_retrieved';
        const jsonCacheKey = 'invTypes';
        const lastRetrieved = window.localStorage.getItem(dateCacheKey);
        
        if(dateString == lastRetrieved) {
            console.log('Same Day - Retrieving InvType Cache.');
            
            try {
                resolve(JSON.parse(window.localStorage.getItem(jsonCacheKey)));
            } catch(e) {
                console.log('Error Retrieving invTypes Cache. Retrying.');
            }
        } else {
            console.log('New Day - Retrieving InvType Cache.');
        
            getResourceData('invTypes.json').then(function(response) {
                console.log('InvTypes Loaded.');
                window.localStorage.setItem(jsonCacheKey, JSON.stringify(response));
                window.localStorage.setItem(dateCacheKey, dateString);
                resolve(response);
            });
        }
        
    });
}

function setItemName() {   
    return new Promise (function(resolve, reject) {     
        getInvTypes().then(function(response) {
            for (const invType of response) {
                if (invType.typeID == thr.itemId) {
                    $("#item-name").text(invType.typeName);
                    resolve();
                }
            }
        });
    });

}

function createTable(domId, data, tableTitle) {
    return new Promise (function(resolve, reject) {    
        let tableHTML = `<table id="${domId}_dt" class="display"><h3>${tableTitle}</h3></table>`;
        $(`#${domId}`).html(tableHTML);
        $(".dataTableFilters").html("");
        
        var dataTableDOM = $(`#${domId}_dt`);
        
        const columns = [
            {data: 'price', title: domId.indexOf('start') >= 0 ? 'Sell Price' : 'Buy Price'},
            {data: 'quantity', title: 'Quantity'}
        ];
        
        const dt = dataTableDOM.DataTable({
            "order": [[0, domId.indexOf('start') >= 0 ? 'asc' : 'desc']],
            "lengthMenu": [[10], ["10"]],
            responsive: true,
            dom: 'frtipB',
            buttons: [
                'copy', 'csv', 'excel', 'pdf'
            ],
            columns: columns,
            data: data
        });
        
        $("label").hide();
        $("input").hide();

        $(".dataTableFilters").append($(".dt-buttons"));
        $(".dt-button").addClass("btn btn-effect");
        
        $(".dataTables_paginate").on("click", function(){
            $(this)[0].scrollIntoView();
        });
        
        $(".dataTable tr").on('click',function() {
            $(this).toggleClass('row_selected');
        });

        resolve();
    });
}

let thr = {};

/**
* Initializes on window load
*/
function loadNext() {
    countDownDivText(functionDurations['evetrade-get-orders']);
    $(".tableLoadingIcon").show();
    
    try {
        if (window.location.search.length > 0) {
            var search = window.location.search.substring(1);
            thr = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');

            startTime = new Date();
            
            if (thr.from && thr.to && thr.itemId) {
                hauling_request = thr;
                
                getUniverseList().then(function(data) {
                    universeList = data;
                    getOrdersData(thr.itemId, thr.from, thr.to).then(function(data) {
                        const orders = data;
                        setStationNames();
                        setItemName().then(function() {
                            createTable('starting-station-table', orders['from'], 'Sell Orders').then(function() {
                                createTable('ending-station-table', orders['to'], 'Buy Orders').then(function() {

                                    $('#main').fadeTo('slow', 1, function() {});

                                    runTime = new Date() - startTime;
                                    console.log(`Request took ${runTime}ms`);
                                    $("#time_taken").html(`Request took ${runTime/1000} seconds.`);
                                    $(".tableLoadingIcon").hide();
                                });
                            });
                        })

                    });
                });
                return;
            } 
            
            console.log(`Invalid search parameters: ${search}`);
        }
        
    } catch(e) {
        console.log(`Error parsing query params ${location.search}.`);
    }
    
    $('#main').fadeTo('slow', 1, function() {});
    $("h2").text("Invalid search parameters. No results.");
    $("h3").text("");

}
