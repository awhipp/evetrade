var BUY_ORDER = "buy";
var SELL_ORDER = "sell";
var ALL_ORDER = "all";
var ESI_ENDPOINT = "https://esi.evetech.net";

var STATION_TRADE = 0;
var STATION_HAUL = 1;
var REGION_HAUL = 2;

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
var routeCache = {};
var page = 1;
var iteration = 1;
var rowAdded = false;

var orderTypeStart = "SELL";
var orderTypeEnd = "BUY";

var regionHeader = ["", "Buy Item", "From", "Quantity", "Buy Price", "Net Costs", "Take To", "Sell Price", "Net Sales",  "Gross Margin", "Sell Taxes", "Net Profit", "Jumps", "Profit per Jump", "R.O.I", "Total Volume (m3)"];
var routeHeader = ["", "Buy Item", "From", "Quantity", "Buy Price", "Net Costs", "Take To", "Sell Price", "Net Sales", "Gross Margin", "Sell Taxes", "Net Profit", "Profit Per Item", "R.O.I", "Total Volume (m3)"];
var stationHeader = ["Item", "Buy Price", "Sell Price", "Gross Margin", "Buy Fees", "Sell Fees", "Sell Taxes",  "Net Profit", "R.O.I", "24-Hour Volume", "14-Day Volume", "30-Day Volume"];

/**
* The keyword for known scam items
*/
var spamItems = [
    "ahremen's", "brokara's", "brynn's",
    "chelm's", "cormack's", "draclira's", "estamel's",
    "gotan's", "hakim's", "kaikka's", "mizuro's", "raysere's",
    "selynne's", "setele's", "shaqil's", "tairei's", "thon's", "tuvan's",
    "vizen's", "zor's"
];

/**
* Sets up the wording on the screen based on the order types selected
*/
function setCopyWording() {
  if (tradingStyle == STATION_HAUL) {
    orderTypeStart = $("#buying-type-station").val();
    orderTypeEnd = $("#selling-type-station").val();
  } else if (tradingStyle == REGION_HAUL) {
    orderTypeStart = $("#buying-type-region").val();
    orderTypeEnd = $("#selling-type-region").val();
  }

  if(orderTypeStart == "BUY") {
    regionHeader[1] = "Buy Order";
    regionHeader[4] = "Sell Price";
    routeHeader[1] = "Buy Order";
    routeHeader[4] = "Sell Price";
  } else {
    regionHeader[1] = "Sell Order";
    regionHeader[4] = "Buy Price";
    routeHeader[1] = "Sell Order";
    routeHeader[4] = "Buy Price";
  }

  if(orderTypeEnd == "BUY") {
    regionHeader[7] = "Sell Price";
    routeHeader[7] = "Sell Price";
  } else {
    regionHeader[7] = "Buy Price";
    routeHeader[7] = "Buy Price";
  }
}

/**
* Given a market data object this function determines the best prices
*/
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
* Given a null or empty value it will return the default
*/
function setDefaultVal(ele, def) {
  if (ele && ele.length > 0) {
      if(isNaN(ele)){
        return ele;
      } else {
        return parseFloat(ele);
      }
  }
  return def;
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
        var comparator = isRoute ? (sellOrderComparator) : buyOrderComparator;
        bestPrice = bestPrice.sort(comparator);
        saveSellOrderData(stationId, itemId, $.extend(true, [], bestPrice));
        /** Buying from Users at this price - ordered low to high **/
    } else {
        var comparator = isRoute ? (buyOrderComparator) : sellOrderComparator;
        bestPrice = bestPrice.sort(comparator);
        saveBuyOrderData(stationId, itemId, $.extend(true, [], bestPrice));
    }

    return bestPrice;
}

/**
* Saves the sell order data for a given station and itemId
*/
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

/**
* Saves the buy order data for a given station and itemId
*/
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

/**
* The comparator for a sellOrder (greater is better)
*/
function sellOrderComparator(a,b){
    if (a[0] > b[0]) return -1;
    if (a[0] < b[0]) return 1;
    return 0;
}

/**
* The comparator for a buyOrder (lesser is better)
*/
function buyOrderComparator(a,b){
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    return 0;
}

/**
* The comparator for a row on a margin trade
*/
function bestRowComparator(a,b){
    if (a[5] < b[5]) return 1;
    if (a[5] > b[5]) return -1;
    return 0;
}

/**
* Given a station Id this function will provide the station name
*/
function getStationName(stationId){
    var stationFound = "";
    $.each(endCoordinates, function(){
        if(stationFound.length == 0 && this.station == stationId) {
            stationFound = this.name;
        }
    });
    return stationFound;
}

/**
* Displays the connection slow error
*/
function displayError(){
    if(!errorShown){
        $("#connectEVE").slideToggle(true);
        errorShown = true;
    }
}

/**
* Hides the connection slow error
*/
function hideError(){
    if(errorShown){
        $("#connectEVE").slideToggle();
        errorShown = false;
    }
}

/**
* Converts a numeric into a human readable string with commas.
*/
function numberWithCommas(val) {
    while (/(\d+)(\d{3})/.test(val.toString())){
        val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}

/**
* Increment progress helper
*/
function incrementProgress(composite, page) {
    getTotalProgress();
    composite.completePages[page] = true;
}

/**
* Determines progress based on completeness
*/
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

/**
* Generic refresh function which will clear and reinitialize the query
*/
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

    init(tradingStyle);
}

/**
* Given an item this helper determines if it is a scam
*/
function isSpamItem(name) {
    for(var i = 0; i < spamItems.length; i++) {
        if(name.toLowerCase().indexOf(spamItems[i]) >= 0) {
            return true;
        }
    }
    return false;
}

/**
* Market endpoint URI builder
*/
function marketEndpointBuilder(region, page, orderType) {
    var url = ESI_ENDPOINT + "/latest/markets/" + region + "/orders/" +
        "?datasource=tranquility" +
        "&page=" + page +
        "&order_type=" + orderType +
        "&language=en-us&iteration=" + iteration;
    return url.replace(/\s/g, '');
}

/**
* Item weight endpoint URI builder
*/
function getWeightEndpointBuilder(itemId) {
    var url = ESI_ENDPOINT + "/latest/universe/types/" + itemId + "/" +
        "?datasource=tranquility" +
        "&language=en-us" +
        "&iteration=" + iteration;
    return url.replace(/\s/g, '');
}

/**
* Market volume endpoint URI builder
*/
function getVolumeEndpointBuilder(region, itemId) {
    var url = ESI_ENDPOINT + "/latest/markets/" + region + "/history/" +
        "?datasource=tranquility" +
        "&type_id=" + itemId +
        "&language=en-us" +
        "&iteration=" + iteration;
    return url.replace(/\s/g, '');
}

/**
* Builds the textual trade header while query
* is running which gives context on what the query is executing
*/
function createTradeHeader() {
    var buyingFooter = "";
    var buyingFrom = "";
    var sellingTo = "";
    var buyingHeaderDOM = $("#buyingHeader");
    var buyingFooterDOM = $("#buyingFooter");
    var coreDOM = $("#core");

    if (tradingStyle == STATION_HAUL) {
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
    } else if (tradingStyle == REGION_HAUL) {
        buyingFrom = startLocations;
        sellingTo = endLocations;
    }

    if (tradingStyle == STATION_HAUL || tradingStyle == REGION_HAUL) {
        if(orderTypeStart == "SELL") {
          buyingHeaderDOM.text("Buying Sell Orders from " + buyingFrom);
        } else {
          buyingHeaderDOM.text("Placing Buy Orders at " + buyingFrom);
        }

        var extraData = "";
        if(orderTypeEnd == "SELL") {
          extraData = "<div id='route-to'>Selling as Sell Orders at " + sellingTo + " with " + sales_tax + "% tax</div> " +
            "ROI&nbsp;Greater&nbsp;Than&nbsp;" + threshold_roi + "% " +
            "|&nbsp;Profits&nbsp;Greater&nbsp;Than&nbsp;" + numberWithCommas(threshold_profit) + "&nbsp;ISK";
        } else {
          extraData = "<div id='route-to'>Selling to Buy Orders at " + sellingTo + " with " + sales_tax + "% tax</div> " +
            "ROI&nbsp;Greater&nbsp;Than&nbsp;" + threshold_roi + "% " +
            "|&nbsp;Profits&nbsp;Greater&nbsp;Than&nbsp;" + numberWithCommas(threshold_profit) + "&nbsp;ISK";
        }
        if (tradingStyle == REGION_HAUL) {
            extraData += "<span id='citadelsLine'><br>* Indicates that the station is a citadel (confirm access at your own risk).</span>"
            extraData += "<br>Only showing system security status of " + $("#security-threshold").val() + " SEC or better.";
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
    } else if (tradingStyle == STATION_TRADE){
        buyingHeaderDOM.text("Station Trading at " + startLocations);
        buyingHeaderDOM.show();

        buyingFooter = "With Sales Tax at " + numberWithCommas(sales_tax) + "% and Broker Fee at " + numberWithCommas(broker_fee) + "%<br />" +
            "Volume greater than: " + numberWithCommas(volume_threshold) +
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


/**
* Creates the datatable based on the trading style that is being queried
*/
function createDataTable() {
    if(!tableCreated) {
        tableCreated = true;
        $('#noselect-object').html('<table id="dataTable" class="display"></table>');
        $(".dataTableFilters").html("");

        var dataTableDOM = $("#dataTable");
        dataTableDOM.html("");

        var dtHTML = "<thead>";
        var headers = tradingStyle === STATION_TRADE ? stationHeader : tradingStyle === STATION_HAUL ? routeHeader : regionHeader;
        for (var i = 0; i < headers.length; i++) {
            dtHTML += ("<th>" + headers[i] + "</th>");
        }
        dtHTML += "</thead><tbody id='tableBody'></tbody>";
        dataTableDOM.append(dtHTML);

        var dt;
        if (tradingStyle == STATION_HAUL) {
            // sorting on total profit index
            dt = dataTableDOM.DataTable({
                "order": [[12, "desc"]],
                "lengthMenu": [[50], ["50"]],
                // "lengthMenu": [[-1], ["All"]],
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
        } else if (tradingStyle == REGION_HAUL) {
            // sorting on profit per jump index
            dt = dataTableDOM.DataTable({
                "order": [[13, "desc"]],
                "lengthMenu": [[50], ["50"]],
                // "lengthMenu": [[-1], ["All"]],
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

        } else if (tradingStyle == STATION_TRADE) {
            // sorting on margin index
            dt = dataTableDOM.DataTable({
                "order": [[7, "desc"]],
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
            if( i > 0 || tradingStyle == STATION_TRADE) {
                var name = dt.column(i).header();
                var spanelt = document.createElement("button");

                var initial_removed = ["Net Costs", "Net Sales", "Gross Margin", "Buy Fees", "Sell Fees", "Sell Taxes"];

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

/**
* Change the URL to be able to bookmark the search based on the trading style that is being queried
*/
function createBookmarks() {
    var trade;
    if ($("#station_haul_bookmark").is(":checked")) {
        trade = "s2s";
    } else if ($("#region_haul_bookmark").is(":checked")) {
        trade = "r2r";
    }

    if (trade !== undefined) {
        var other = "N";

        var bookmarkURL = window.location.pathname + "?trade=" + trade;

        switch (trade) {
            case "s2s":
                bookmarkURL += "&start=";
                startLocations.forEach(function(startLocation) {
                    bookmarkURL += startLocation + ",";
                });
                bookmarkURL = bookmarkURL.slice(0, -1);
                bookmarkURL += "&end=";
                endLocations.forEach(function(endLocation) {
                    bookmarkURL += endLocation + ",";
                });
                bookmarkURL = bookmarkURL.slice(0, -1);
                if ($("#route_sales_tax").val() === "Other") other="Y";
                break;
            case "r2r":
                bookmarkURL += "&start=" + startLocations;
                bookmarkURL += "&end=" + endLocations ;
                if ($("#region_sales_tax").val() === "Other") other="Y";
                if ($("#include-citadels").is(":checked")) {
                    bookmarkURL += "&citadels=Y";
                } else {
                    bookmarkURL += "&citadels=N";
                }
                break;
        }

        bookmarkURL += "&other=" + other;

        bookmarkURL += "&sales_tax=" + sales_tax + "&threshold_profit=" + threshold_profit;
        bookmarkURL += "&threshold_roi=" + threshold_roi + "&threshold_cost=" + threshold_cost;
        bookmarkURL += "&threshold_weight=" + threshold_weight;
    }
}

