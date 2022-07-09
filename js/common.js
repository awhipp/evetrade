var BUY_ORDER = "buy";
var SELL_ORDER = "sell";
var ALL_ORDER = "all";
var ESI_ENDPOINT = "https://esi.evetech.net";
var RES_ENDPOINT = "https://api.github.com/repos/awhipp/evetrade_resources/contents/resources";

// For local development otherwise hit backend route
const API_ENDPOINT = window.location.href.indexOf("localhost") > 0 ? "https://evetrade.space/api" : ""

var STATION_TRADE = 0;
var STATION_HAUL = 1;
var REGION_HAUL = 2;

var tableCreated = false;
var createdRefresher = false;
var totalProgress = 0;
var executingCount = 0;
var customBuy = {};
var customSell = {};
var citadelCache = {};
var systemSecurity = {};
var routeCache = {};
var page = 1;
var iteration = 1;
var rowAdded = false;

var orderTypeStart = "sell";
var orderTypeEnd = "buy";

var r2rHeader = ["", "Buy Item", "From", "Quantity", "Buy Price", "Net Costs", "Take To", "Sell Price", "Net Sales",  "Gross Margin", "Sell Taxes", "Net Profit", "Jumps", "Profit per Jump", "R.O.I", "Total Volume (m3)"];
var s2sHeader = ["", "Buy Item", "From", "Quantity", "Buy Price", "Net Costs", "Take To", "Sell Price", "Net Sales", "Gross Margin", "Sell Taxes", "Net Profit", "Profit Per Item", "R.O.I", "Total Volume (m3)"];
var sstHeader = ["Item", "Buy Price", "Sell Price", "Gross Margin", "Buy Fees", "Sell Fees", "Sell Taxes",  "Net Profit", "R.O.I", "24-Hour Volume", "14-Day Volume", "30-Day Volume"];

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

var universeList = {};
var stationIdToName = {};
var stationList = [];
var regionList = [];
var tablesReady = false;
var invTypes = [];

/**
 * Defaults values and parameters of forms inputs by trade style
 * + Predefined values taxes
 */
var defaultValues = [
    // Station trading
    {
        "sst_sales_tax": ["sales_tax", 8],
        "sst_broker_fee": ["broker_fee", 3],
        "sst_lower_margin": ["min_margin", 20],
        "sst_upper_margin": ["max_margin", 40],
        "sst_min_volume": ["min_volume", 1000]
    },
    // Station haul
    {
        "s2s_buying_type": ["buy_type", "sell"],
        "s2s_selling_type": ["sell_type", "buy"],
        "s2s_sales_tax": ["sales_tax", 8],
        "s2s_min_profit": ["min_profit", 500000],
        "s2s_max_cargo": ["max_cargo", 999999999999999999],
        "s2s_min_roi": ["min_roi", 4],
        "s2s_max_budget": ["max_budget", 999999999999999999]
    },
    // Region haul
    {
        "r2r_buying_type": ["buy_type", "sell"],
        "r2r_selling_type": ["sell_type", "buy"],
        "r2r_sales_tax": ["sales_tax", 8],
        "r2r_min_profit": ["min_profit", 500000],
        "r2r_max_cargo": ["max_cargo", 999999999999999999],
        "r2r_min_roi": ["min_roi", 4],
        "r2r_max_budget": ["max_budget", 999999999999999999],
        "r2r_min_security": ["min_security", "null"],
        "r2r_route_preference": ["route_type", "secure"]
    },
    // Taxes
    [8, 7.12, 6.24, 5.36, 4.48, 3.6]
]

/**
* Sets up the wording on the screen based on the order types selected
*/
function setCopyWording() {
  if (tradingStyle == STATION_HAUL) {
    orderTypeStart = $("#s2s_buying_type").val();
    orderTypeEnd = $("#s2s_selling_type").val();
  } else if (tradingStyle == REGION_HAUL) {
    orderTypeStart = $("#r2r_buying_type").val();
    orderTypeEnd = $("#r2r_selling_type").val();
  }

  if(orderTypeStart == "buy") {
    r2rHeader[1] = "Buy Order";
    r2rHeader[4] = "Sell Price";
    s2sHeader[1] = "Buy Order";
    s2sHeader[4] = "Sell Price";
  } else {
    r2rHeader[1] = "Sell Order";
    r2rHeader[4] = "Buy Price";
    s2sHeader[1] = "Sell Order";
    s2sHeader[4] = "Buy Price";
  }

  if(orderTypeEnd == "buy") {
    r2rHeader[7] = "Sell Price";
    s2sHeader[7] = "Sell Price";
  } else {
    r2rHeader[7] = "Buy Price";
    s2sHeader[7] = "Buy Price";
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
function setDefaultVal(input) {
  ele = $("#" + input).val();
  if (ele && ele.length > 0) {
      if(isNaN(ele)){
        return ele;
      } else {
        return parseFloat(ele);
      }
  }
  if(input.includes("_in")) {
    return defaultValues[tradingStyle][input.slice[0,-3]][1];
  }
  return defaultValues[tradingStyle][input][1];
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
    $("#refresh_button").remove();
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
* Return item weight from items DB
* TODO: Can be improved
*/
function getWeight(itemId) {
    for( var i = 0; i < invTypes.length; i++ ) {
        if( invTypes[i].typeID == itemId) {
            return invTypes[i];
        }
    }
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
    var buyingHeaderDOM = $("#buying_header");
    var buyingFooterDOM = $("#buying_footer");
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
        if ($.isArray(endLocations)) {
            sellingTo = endLocations.join(", ")
        } else {
            sellingTo = endLocations;
        }
    }

    if (tradingStyle == STATION_HAUL || tradingStyle == REGION_HAUL) {
        if(orderTypeStart == "sell") {
          buyingHeaderDOM.text("Buying Sell Orders from " + buyingFrom);
        } else {
          buyingHeaderDOM.text("Placing Buy Orders at " + buyingFrom);
        }

        var extraData = "";
        if(orderTypeEnd == "sell") {
          extraData = "<div id='route_to'>Selling as Sell Orders at " + sellingTo + " with " + salesTax + "% tax</div> " +
            "ROI&nbsp;Greater&nbsp;Than&nbsp;" + haulingMinRoi + "% " +
            "|&nbsp;Profits&nbsp;Greater&nbsp;Than&nbsp;" + numberWithCommas(haulingMinProfit) + "&nbsp;ISK";
        } else {
          extraData = "<div id='route_to'>Selling to Buy Orders at " + sellingTo + " with " + salesTax + "% tax</div> " +
            "ROI&nbsp;Greater&nbsp;Than&nbsp;" + haulingMinRoi + "% " +
            "|&nbsp;Profits&nbsp;Greater&nbsp;Than&nbsp;" + numberWithCommas(haulingMinProfit) + "&nbsp;ISK";
        }
        if (tradingStyle == REGION_HAUL) {
            extraData += "<span id='r2r_citadels_line'><br>* Indicates that the station is a citadel (confirm access at your own risk).</span>"
            extraData += "<br>Only showing system security status of " + $("#r2r_min_security").val() + " SEC or better.";
        }

        if(haulingMaxBudget !== 999999999999999999){
            extraData += " |&nbsp;Buy&nbsp;Costs&nbsp;Less&nbsp;Than&nbsp;" + numberWithCommas(haulingMaxBudget) + "&nbsp;ISK";
        }
        if(haulingMaxCargo !== 999999999999999999){
            extraData += " |&nbsp;Total&nbsp;Volume&nbsp;Under&nbsp;" + numberWithCommas(haulingMaxCargo) + "&nbsp;m3";
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

        buyingFooter = "With Sales Tax at " + numberWithCommas(salesTax) + "% and Broker Fee at " + numberWithCommas(sstBrokerFee) + "%<br />" +
            "Volume greater than: " + numberWithCommas(sstMinVolume) +
            " | Margins between " + sstLowerMargin + "% and " + sstUpperMargin + "%" +
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
        $('#noselect_object').html('<table id="dataTable" class="display"></table>');
        $(".dataTableFilters").html("");

        var dataTableDOM = $("#dataTable");
        dataTableDOM.html("");

        var dtHTML = "<thead>";
        var headers = tradingStyle === STATION_TRADE ? sstHeader : tradingStyle === STATION_HAUL ? s2sHeader : r2rHeader;
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
        $("#show_hide").show();
        $("#dataTable").show();

        $(".dataTables_paginate").on("click", function(){
           $(this)[0].scrollIntoView();
        });
    }
}

function setTitle() {
    if(tradingStyle == STATION_TRADE){
        trade = startLocations;
    } else if (tradingStyle == STATION_HAUL) {
        trade = startLocations.join("-") + " => " + endLocations.join("-");
    } else if (tradingStyle == REGION_HAUL) {
        if ($.isArray(endLocations)) {
            trade = startLocations + " => " + endLocations.join("-");
        } else {
            trade = startLocations + " => " + endLocations;
        }
    }
    document.title = trade + " | " + document.title
}

/**
* Given a selector it will return empty string if default otherwise the value
*/
function isDefaultInput(trade, ele) {
    var element = $("#" + ele);
    if (element.is(":checkbox")) {
        if (element.is(":checked") != trade[ele][1]) {
            return "Y";
        }
    } else {
        if (isNaN(element.val())) {
            if (element.val() !== trade[ele][1]) {
                return element.val();
            }
        } else {
            if (parseFloat(element.val()) !== trade[ele][1]) {
                return element.val();
            }
        }
    }
    return "";
}

/**
* Change the URL to be able to bookmark the search based on the trading style that is being queried
*/
function createBookmarks() {
        var tradeDefaultValues = defaultValues[tradingStyle];

        switch (tradingStyle) {
            case STATION_HAUL:
                bookmarkURL = window.location.pathname + "?trade=s2s";
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
                break;
            case REGION_HAUL:
                bookmarkURL = window.location.pathname + "?trade=r2r";
                bookmarkURL += "&start=" + startLocations;
                if ($.isArray(endLocations)) {
                    bookmarkURL += "&end=Sell nearby" ;
                } else {
                    bookmarkURL += "&end=" + endLocations ;
                }
                break;
            case STATION_TRADE:
                bookmarkURL = window.location.pathname + "?trade=sst";
                bookmarkURL += "&start=" + startLocations;
        }

        for (var key in tradeDefaultValues) {
            if(key.includes("sales_tax") & $("#" + key).val() === "other") {
                bookmarkURL += "&" + tradeDefaultValues[key][0] + "=" + $("#" + key + "_in").val();
                continue;
            }
            bookmarkURL += "&" + tradeDefaultValues[key][0] + "=" + isDefaultInput(tradeDefaultValues, key);
        };

        history.pushState({}, document.title, encodeURI(bookmarkURL));

        $("#bookmark").show();
}

/**
* Given a selector it will set it if not default
*/
function setDefaultInput(trade, ele, value) {
    var element = $("#" + ele);
    if (value != "") {
        if (element.is(":checkbox")) {
            element.prop("checked", !trade[ele][1]);
        } else if (element.is("select")) {
            $("#" + ele + " option[value=\"" + value + "\"]").prop('selected', true);
        } else {
            element.val(value);
        }
    } else {
        if (element.is(":checkbox")) {
            element.prop("checked", trade[ele][1]);
        } else if (element.is("select")) {
            $("#" + ele + " option[value=\"" + trade[ele][1] + "\"]").prop('selected', true);
        } else {
            element.val("");
        }
    }
}

function setupBookmark(urlParams) {
    if (urlParams.has("start")) {
        var tradeDefaultValues = defaultValues[tradingStyle];
        switch (tradingStyle) {
            case STATION_HAUL:
                // We have to wait for input element
                var waitForInputStation = setInterval(function () {
                    if ($("#s2s_start_station input").length) {
                        clearInterval(waitForInputStation);
                        urlParams.get("start").split(',').forEach(function(item) {
                            addStart(item);
                        });
                        urlParams.get("end").split(',').forEach(function(item) {
                            addEnd(item);
                        });
                    }
                }, 1000);

                break;
            case REGION_HAUL:
                // We have to wait for input element
                var waitForInputRegion = setInterval(function () {
                    if ($("#r2r_start_region input").length) {
                        clearInterval(waitForInputRegion);
                        addStart(urlParams.get("start"));
                        $("#r2r_start_region input")[0].value = urlParams.get("start");
                        if (urlParams.get("end") == "Sell nearby") {
                            $("#r2r_sell_nearby").prop("checked", true);
                            $("#adding_to_end_region_list").hide();
                        } else {
                            addEnd(urlParams.get("end"));
                            $("#r2r_end_region input")[0].value = urlParams.get("end");
                        }
                    }
                }, 1000);

                break;
            case STATION_TRADE:
                // We have to wait for input element
                var waitForInputTrade = setInterval(function () {
                    if ($("#sst_start_station input").length) {
                        clearInterval(waitForInputTrade);
                        addStart(urlParams.get("start"));
                        $("#sst_start_station input")[0].value = urlParams.get("start");
                    }
                }, 1000);

        }

        for (var key in tradeDefaultValues) {
            var paramValue = urlParams.get(tradeDefaultValues[key][0]);
            if(key.includes("sales_tax")) {
                if (!isNaN(parseFloat(paramValue))){
                    if (defaultValues[3].indexOf(parseFloat(paramValue)) == -1) {
                        $("#" + key + " option[value=\"other\"]").prop('selected', true);
                        $("#" + key + "_in").val(paramValue);
                        continue;
                    }
                }
            }
            setDefaultInput(tradeDefaultValues, key, paramValue);
        };
    }
}

// Generic function to get JSON data from API endpoin t
function getResourceData(fileName) {
    return fetch(API_ENDPOINT + '/resource?file=' + fileName)
    .then(response => response.json())
    .then(function(response) {
        return response;
    });
}

const resources_needed = 5;
let resources_loaded = 0;

const date = new Date();
const dateString = "Date=" + date.getFullYear() + date.getMonth() + date.getDate();

// Function gets all resource files needed from backend
function getResourceFiles(){
    const lastRetrieved = window.localStorage.getItem('evetrade_cache_retrieval_date');

    if(dateString == lastRetrieved) {
        console.log('Same Day - Retrieving Resource Cache.');

        try {
            universeList = JSON.parse(window.localStorage.getItem('universeList'));
            stationList = JSON.parse(window.localStorage.getItem('stationList'));
            stationIdToName = JSON.parse(window.localStorage.getItem('stationIdToName'));
            regionList = JSON.parse(window.localStorage.getItem('regionList'));
            invTypes = JSON.parse(window.localStorage.getItem('invTypes'));
            resources_loaded = 5;

            return;
        } catch(e) {
            console.log('Error Retrieving Resource Cache. Retrying.');
        }
    } else {
        console.log('New Day - Retrieving Resource Cache.');
    }

    window.localStorage.clear();

    getResourceData('stationList.json').then(function(response) {
        console.log('Station List Loaded.');
        stationList = response;
        window.localStorage.setItem('stationList', JSON.stringify(response));
        resources_loaded ++;
    });

    // TODO verify if universeList is needed after refactor
    getResourceData('universeList.json').then(function(response) {
        console.log('Universe List Loaded.');
        universeList = response;
        window.localStorage.setItem('universeList', JSON.stringify(response));
        resources_loaded ++;
    });

    // TODO verify if stationIdToName is needed after refactor 
    getResourceData('stationIdToName.json').then(function(response) {
        console.log('Station Id To Name Loaded.');
        stationIdToName = response;
        window.localStorage.setItem('stationIdToName', JSON.stringify(response));
        resources_loaded ++;
    });

    // TODO verify if regionList is needed after refactor
    getResourceData('regionList.json').then(function(response) {
        console.log('Region List Loaded.');
        regionList = response;
        window.localStorage.setItem('regionList', JSON.stringify(response));
        resources_loaded ++;
    });

    // TODO verify if invTypes is needed after refactor
    getResourceData('invTypes.json').then(function(response) {
        console.log('Inv Types Loaded.');
        invTypes = response;
        window.localStorage.setItem('invTypes', JSON.stringify(response));
        resources_loaded ++;
    });

}
