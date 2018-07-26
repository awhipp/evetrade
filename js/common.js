var BUY_ORDER = "buy";
var SELL_ORDER = "sell";
var ALL_ORDER = "all";
var ESI_ENDPOINT = "https://esi.evetech.net";

var PAGE_MULTIPLE = 50;

var tableCreated = false;
var createdRefresher = false;
var totalProgress = 0;
var executingCount = 0;
var customBuy = {};
var customSell = {};
var itemCache = {};
var citadelCache = {};
var systemSecurity = {};
var page = 1;
var iteration = 1;
var rowAdded = false;

var regionHeader = ["", "Buy Item", "From", "Quantity", "At Sell Price", "Total Cost", "Take To", "At Buy Price", "Total Profit", "Profit Per Item", "R.O.I", "Total Volume (m3)"];
var routeHeader = ["", "Buy Item", "From", "Quantity", "At Sell Price", "Total Cost", "Take To", "At Buy Price", "Total Profit", "Profit Per Item", "R.O.I", "Total Volume (m3)"];
var stationHeader = ["Item", "Buy Order", "Sell Order", "Profit Per Item", "Margin", "Volume"];

var spamItems = ["ahremen's", "brokara's", "brynn's",
    "chelm's", "cormack's", "draclira's", "estamel's",
    "gotan's", "hakim's", "kaikka's", "mizuro's", "raysere's",
    "selynne's", "setele's", "shaqil's", "tairei's", "thon's", "tuvan's",
    "vizen's", "zor's"
];

function getMarketData(data, stationId, orderType, itemId, isRoute){
    var tempArray;
    if (typeof(data) == "string")  {
        tempArray = [data];
    } else if (data != null){
        tempArray = getBestMarketPrice(data, stationId, orderType, itemId, isRoute)
    }

    var returningArray = [];
    if(tempArray){
        for(var i = 0; i < tempArray.length; i++){
            if(tempArray[i][0] > 0){
                returningArray.push(tempArray[i]);
            }
        }
    }
    return returningArray;
}

/**
 * Private helper method that will determine the best price for a given item from the
 * market data provided.
 *
 * @param orders The market data
 * @param stationId The station that this is for
 * @param orderType The orderType
 * @param itemId The itemId in question
 * @returns {Array} The best price
 */
function getBestMarketPrice(orders, stationId, orderType, itemId, isRoute) {
    var bestPrice = [];

    // Pull all orders found and start iteration
    for (var orderIdx = 0; orderIdx < orders.length; orderIdx++) {
        var order = orders[orderIdx];

        var orderAlignsWithType = (order['is_buy_order'] && orderType === BUY_ORDER)
            || (!order['is_buy_order'] && orderType === SELL_ORDER);

        if (stationId == order['location_id']
            && order['min_volume'] === 1
            && orderAlignsWithType ){
            // This is the station market we want
            var price = order['price'];
            var volume = order['volume_remain'];
            bestPrice.push([price, volume]);
        }
    }


    /** Selling to Users at this price - ordered high to low **/
    if (orderType == SELL_ORDER){
        var comparator = isRoute ? sellOrderComparator : buyOrderComparator;
        bestPrice = bestPrice.sort(comparator);
        saveSellOrderData(stationId, itemId, $.extend(true, [], bestPrice));
        /** Buying from Users at this price - ordered low to high **/
    } else {
        var comparator = isRoute ? buyOrderComparator : sellOrderComparator;
        bestPrice = bestPrice.sort(comparator);
        saveBuyOrderData(stationId, itemId, $.extend(true, [], bestPrice));
    }

    return bestPrice;
}

function saveSellOrderData(stationId, itemId, data){
    if(data && data.length > 0) {
        if (!customBuy[stationId]) {
            customBuy[stationId] = [];
        }
        if (!customBuy[stationId][itemId] && data.length > 0) {
            customBuy[stationId][itemId] = data;
        }
    }
}

function saveBuyOrderData(stationId, itemId, data){
    if(data && data.length > 0) {
        if(!customSell[stationId]){
            customSell[stationId] = [];
        }
        if(!customSell[stationId][itemId] && data.length > 0) {
            customSell[stationId][itemId] = data;
        }
    }
}

function sellOrderComparator(a,b){
    if (a[0] > b[0]) return -1;
    if (a[0] < b[0]) return 1;
    return 0;
}

function buyOrderComparator(a,b){
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    return 0;
}

function bestRowComparator(a,b){
    if (a[5] < b[5]) return 1;
    if (a[5] > b[5]) return -1;
    return 0;
}

function getStationName(stationId){
    var stationFound = "";
    $.each(endCoordinates, function(){
        if(stationFound.length == 0 && this.station == stationId) {
            stationFound = this.name;
        }
    });
    return stationFound;
}

function numberWithCommas(val) {
    while (/(\d+)(\d{3})/.test(val.toString())){
        val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}

function incrementProgress(composite, page) {
    getTotalProgress();
    composite.completePages[page] = true;
}

function getTotalProgress() {
    var progressUpdate = 0;
    var allComplete = true;

    for (var i = 0; i < routes.length; i++) {
        allComplete = (allComplete && routes[i].completed);

        var routeProgress = routes[i].recalculateProgress();
        progressUpdate += routeProgress / routes.length;
    }

    if(allComplete) {
        totalProgress = 100;
    } else {
        totalProgress = progressUpdate > 100 ? 100 : progressUpdate;
    }

    $(".loading").html("Fetching orders: " + (totalProgress-0.01).toFixed(2) + "% complete");
    $(".loadingContent").text((totalProgress-0.01).toFixed(2) + "%");
}

function refresh() {
    $("#refresh-button").remove();
    iteration += 1;
    for (var i = 0; i < routes.length; i++) {
        routes[i].clear();
    }

    customBuy = [];
    customSell = [];
    startCoordinates = [];
    endCoordinates = [];
    startLocation = "";
    addedToStartList = [];
    addedToEndList = [];
    endLocations = [];
    page = 1;
    totalProgress = 0;
    createdRefresher = false;
    tableCreated = false;
    routes=[];

    init();
}

function isSpamItem(name) {
    for(var i = 0; i < spamItems.length; i++) {
        if(name.toLowerCase().indexOf(spamItems[i]) >= 0) {
            return true;
        }
    }
    return false;
}

function marketEndpointBuilder(region, page, orderType) {
    var url = ESI_ENDPOINT + "/latest/markets/" + region + "/orders/" +
        "?datasource=tranquility" +
        "&page=" + page +
        "&order_type=" + orderType +
        "&language=en-us&iteration=" + iteration;
    return url.replace(/\s/g, '');
}

function getWeightEndpointBuilder(itemId) {
    var url = ESI_ENDPOINT + "/latest/universe/types/" + itemId + "/" +
        "?datasource=tranquility" +
        "&language=en-us" +
        "&iteration=" + iteration;
    return url.replace(/\s/g, '');
}

function getVolumeEndpointBuilder(region, itemId) {
    var url = ESI_ENDPOINT + "/latest/markets/" + region + "/history/" +
        "?datasource=tranquility" +
        "&type_id=" + itemId +
        "&language=en-us" +
        "&iteration=" + iteration;
    return url.replace(/\s/g, '');
}

function createTradeHeader() {
    var buyingFooter = "";
    var buyingFrom = "";
    var sellingTo = "";
    var buyingHeaderDOM = $("#buyingHeader");
    var buyingFooterDOM = $("#buyingFooter");
    var coreDOM = $("#core");

    if (tradingStyle == 1) {
        $.each(startLocations, function () {
            if(this) {
                buyingFrom += this + ", ";
            }
        });
        buyingFrom = buyingFrom.substring(0, buyingFrom.length - 2);

        $.each(endLocations, function () {
            if(this) {
                sellingTo += this + ", ";
            }
        });
        sellingTo = sellingTo.substring(0, sellingTo.length - 2);
    } else if (tradingStyle == 2) {
        buyingFrom = startLocations;
        sellingTo = endLocations;
    }

    if (tradingStyle >= 1) {
        buyingHeaderDOM.text("Buying Sell Orders from " + buyingFrom);

        var extraData = "<div id='route-to'>Selling to the Buy Orders at " + sellingTo + "</div> " +
            "ROI&nbsp;Greater&nbsp;Than&nbsp;" + threshold_roi + "% " +
            "|&nbsp;Profits&nbsp;Greater&nbsp;Than&nbsp;" + numberWithCommas(threshold_profit) + "&nbsp;ISK";
        if (tradingStyle == 2) {
            extraData += "<br>* Indicates that the station is a citadel (confirm access at your own risk)."
            extraData += "<br>System Security status defined by the Station's color. (blue = high sec, red = low sec)."
        }

        if(threshold_cost !== 999999999999999999){
            extraData += " |&nbsp;Buy&nbsp;Costs&nbsp;Less&nbsp;Than&nbsp;" + numberWithCommas(threshold_cost) + "&nbsp;ISK";
        }
        if(threshold_weight !== 999999999999999999){
            extraData += " |&nbsp;Total&nbsp;Volume&nbsp;Under&nbsp;" + numberWithCommas(threshold_weight) + "&nbsp;m3";
        }

        buyingHeaderDOM.show();

        buyingFooter = extraData +
            "<br/>" +
            "<div class='loading'></div>";

        buyingFooterDOM.html(buyingFooter);
        buyingFooterDOM.show();
        
        gtag('event', 'User Route Campaign', {
            'event_category': 'Route Trade Locations',
            'event_label': buyingFrom + " -> " + sellingTo,
            'value': 1
        });
    } else {
        buyingHeaderDOM.text("Station Trading at " + startLocations);
        buyingHeaderDOM.show();

        buyingFooter = "Volume greater than: " + numberWithCommas(volume_threshold) +
            " | Margins between " + threshold_margin_lower + "% and " + threshold_margin_upper + "%" +
            "<div class='loading'>Loading. Please wait...</div>";
        buyingFooterDOM.html(buyingFooter);
        buyingFooterDOM.show();

        gtag('event', 'User Route Campaign', {
            'event_category': 'Station Trade Locations',
            'event_label': startLocations,
            'value': 1
        });
    }
    coreDOM.show();
}

function createDataTable() {
    if(!tableCreated) {
        tableCreated = true;

        $('#noselect-object').html('<table id="dataTable" class="display"></table>');
        $(".dataTableFilters").html("");

        var dataTableDOM = $("#dataTable");
        dataTableDOM.html("");

        var dtHTML = "<thead>";
        var headers = tradingStyle === 0 ? stationHeader : tradingStyle === 1 ? routeHeader : regionHeader;
        for (var i = 0; i < headers.length; i++) {
            dtHTML += ("<th>" + headers[i] + "</th>");
        }
        dtHTML += "</thead><tbody id='tableBody'></tbody>";
        dataTableDOM.append(dtHTML);

        var dt;
        if (tradingStyle >= 1) {
            // sorting on margin index
            dt = dataTableDOM.DataTable({
                "order": [[8, "desc"]],
                "lengthMenu": [[50], ["50"]],
                //"lengthMenu": [[-1], ["All"]],
                responsive: true,
                dom: 'Bfrtip',
                buttons: [
                    'copy', 'csv', 'excel', 'pdf'
                ],
                "columnDefs": [{
                    "targets": 0,
                    "orderable": false
                }]
            });
        } else {
            // sorting on margin index
            dt = dataTableDOM.DataTable({
                "order": [[5, "desc"]],
                "lengthMenu": [[50], ["50"]],
                // "lengthMenu": [[-1], ["All"]],
                responsive: true,
                dom: 'Bfrtip',
                buttons: [
                    'copy', 'csv', 'excel', 'pdf'
                ]
            });
        }


        $("#dataTable thead th").each(function (i) {
            if( i > 0 || tradingStyle == 0) {
                var name = dt.column(i).header();
                var spanelt = document.createElement("button");

                var initial_removed = [];

                spanelt.innerHTML = name.innerHTML;

                $(spanelt).addClass("colvistoggle");
                $(spanelt).addClass("btn");
                $(spanelt).addClass("btn-default");
                $(spanelt).attr("colidx", i);    // store the column idx on the button

                $(spanelt).addClass("is-true");
                var column = dt.column($(spanelt).attr('colidx'));
                column.visible(true);

                for (var i = 0; i < initial_removed.length; i++) {
                    if (spanelt.innerHTML === initial_removed[i]) {
                        $(spanelt).addClass("is-false");
                        var column = dt.column($(spanelt).attr('colidx'));
                        column.visible(false);
                        break;
                    }
                }

                $(spanelt).on('click', function (e) {
                    e.preventDefault();
                    // Get the column API object
                    var column = dt.column($(this).attr('colidx'));
                    // Toggle the visibility
                    $(this).removeClass("is-" + column.visible());
                    column.visible(!column.visible());
                    $(this).addClass("is-" + column.visible());

                });
                var li = document.createElement("li");
                $(li).append($(spanelt));
                $("#colvis").append($(li));
            }
        });

        // ADD SLIDEDOWN ANIMATION TO DROPDOWN //
        $('.dropdown').on('show.bs.dropdown', function (e) {
            $(this).find('.dropdown-menu').first().stop(true, true).slideDown();
        });

        // ADD SLIDEUP ANIMATION TO DROPDOWN //
        $('.dropdown').on('hide.bs.dropdown', function (e) {
            $(this).find('.dropdown-menu').first().stop(true, true).slideUp();
        });

        $('#dataTable tbody').on('mousedown', 'tr', function (event) {
            var investigateButton = (event.target.id.indexOf("investigate") >= 0
            || (event.target.children[0] && event.target.children[0].id.indexOf("investigate") >= 0)
            || (event.target.classList.contains("fa")));

            if (event.which === 1 && !investigateButton) {
                if (!$(this).hasClass("row-selected")) {
                    $(this).addClass("row-selected");
                } else {
                    $(this).removeClass("row-selected");
                }
            }
        });

        $("label > input").addClass("form-control").addClass("minor-text");
        $("label > input").attr("placeholder", "Filter by Station/Name...");

        $(".dataTableFilters").append($("#dataTable_filter"));
        $(".dataTableFilters").append($(".dt-buttons"));
        $(".dt-button").addClass("btn");
        $(".dt-button").addClass("btn-default");

        $(".deal_note").hide();
        $("#show-hide").show();
        $("#dataTable").show();

        $(".dataTables_paginate").on("click", function(){
           $(this)[0].scrollIntoView();
        });
    }
}