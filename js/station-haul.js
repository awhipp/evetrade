var routes = [];

/**
 * Creates a Route object
 *
 * @param startLocation a json object that contains the region and station of the start location
 * @param endLocations a json object array that contains the region and station of the end locations
 * @constructor
 */
function Route(startLocation, endLocations) {
    this.startLocation = startLocation;
    this.endLocations = endLocations;

    this.buyOrders = {};
    this.buyOrders.completePages = [];
    this.buyOrders.complete = false;
    this.buyOrders.pageBookend = null;

    this.sellOrders = {};

    this.itemIds = [];
    this.secondsToRefresh = 60;

    this.asyncRefresher = null;
    this.asyncProgressUpdate = null;

    this.completed = false;

    routes.push(this);
    this.routeId = routes.length-1;
}

Route.prototype.className = function() {
    return "Route";
};


/**
 * Begins the process for finding route information and displaying the best trades for the route.
 */
Route.prototype.startRoute = function() {
    var regionId = parseInt(this.startLocation.region);
    var stationId = parseInt(this.startLocation.station);

    if (orderTypeStart == "sell") {
        this.getSellOrders(regionId, stationId, this.buyOrders);
    } else {
        this.getBuyOrders(regionId, stationId, this.buyOrders);
    }

    var rI = 0;
    for(var i = 0; i < this.endLocations.length; i++){
        if(this.endLocations[i].station !== this.startLocation.station) {
            this.sellOrders[rI] = {};
            this.sellOrders[rI].completePages = [];
            this.sellOrders[rI].complete = false;
            this.sellOrders[rI].pageBookend = null;

            regionId = parseInt(this.endLocations[i].region);
            stationId = parseInt(this.endLocations[i].station);

            if (orderTypeEnd == "buy") {
                this.getBuyOrders(regionId, stationId, this.sellOrders[rI]);
            } else {
                this.getSellOrders(regionId, stationId, this.sellOrders[rI]);
            }
            rI += 1;
        }
    }

    $("#selection").hide();
};

/**
 * Calculates the progress using a logarithmic function
 *
 * @returns {number}
 */
Route.prototype.recalculateProgress = function() {
    var progressUpdate = this.getNumberOfCompletePages(this.buyOrders);
    var rI = 0;
    for (var i = 0; i < this.endLocations.length; i++) {
        if(this.endLocations[i].station !== this.startLocation.station) {
            progressUpdate += this.getNumberOfCompletePages(this.sellOrders[rI]);
            rI += 1;
        }
    }
    return progressUpdate <= 0 ? 1 : 35.0 * Math.log10(progressUpdate);
};

/**
 * Helper function that gets buy orders only.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param composite The running buy or sell order list object.
 */
Route.prototype.getBuyOrders = function(region, station, composite) {
    this.getOrders(region, station, composite, BUY_ORDER);
};

/**
 * Helper function that gets sell orders only.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param composite The running buy or sell order list object.
 */
Route.prototype.getSellOrders = function(region, station, composite) {
    this.getOrders(region, station, composite, SELL_ORDER);
};

/**
 * Getting the orders for a specific region and station.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param composite The running buy or sell order list object.
 * @param orderType The order type to get orders for.
 */
Route.prototype.getOrders = function(region, station, composite, orderType) {
    var thiz = this;

    this.getOrder(region, station, composite, orderType, 1)
    .then(function() {
            for (var page = 2; page <= composite.pageBookend; page++) {
                thiz.getOrder(region, station, composite, orderType, page)
            }
    });
};

/**
 * Getting the order for a specific region, station, and page number.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param composite The running buy or sell order list object.
 * @param orderType The order type to get orders for.
 * @param page The market page number.
 */
Route.prototype.getOrder = function(region, station, composite, orderType, page) {
    var thiz = this;

    return $.ajax({
        type: "get",
        url: marketEndpointBuilder(region, page, orderType),
        dataType: "json",
        contentType: "application/json",
        async: true,
        success: function(data, textStatus, jqXHR) {
            composite.pageBookend = parseInt(jqXHR.getResponseHeader('x-pages'));
            page = (new URLSearchParams(this.url)).get('page');
            incrementProgress(composite, page);

            for (var i = 0; i < data.length; i++) {
                if (data[i]["location_id"] === station) {
                    var id = data[i]["type_id"];
                    if (!composite[id]) composite[id] = [];
                    composite[id].push(data[i]);
                }
            }
            if (thiz.getNumberOfCompletePages(composite) === composite.pageBookend) {
                composite.complete = true;
                console.log("Completed " + station + " order fetch at " + page);
                thiz.executeOrders();
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown){
            displayError();
            incrementProgress(composite, page);
        }
    });
}

/**
 * Gets the number of completed pages for a specific order
 *
 * @param order The specific buy or sell order
 * @returns {number} The number of completed pages
 */
Route.prototype.getNumberOfCompletePages = function(order) {
    var numberOfCompletedPages = 0;
    for(var i = 0; i < order.completePages.length; i++) {
        if (order.completePages[i]) {
            numberOfCompletedPages++;
        }
    }
    return numberOfCompletedPages;
};


/**
 * Checks all active order requests to verify whether they are complete or not
 *
 * @returns {boolean|*}
 */
Route.prototype.checkOrdersComplete = function() {
    var ordersComplete = this.buyOrders.complete;

    // running index
    var rI = 0;
    for (var i = 0; i < this.endLocations.length; i++) {
        if(this.endLocations[i].station !== this.startLocation.station) {
            ordersComplete = ordersComplete && this.sellOrders[rI].complete;
            rI += 1;
        }
    }

    return ordersComplete;
};

/**
 * If all the active orders are complete then it begins processing them
 */
Route.prototype.executeOrders = function() {
    if (this.checkOrdersComplete()) {
        hideError();

        for(itemId in this.buyOrders){
            if(itemId !== "completePages" && itemId !== "complete" && itemId !== "pageBookend")
                this.itemIds.push(itemId);
        }

        if (this.itemIds.length === 0) this.completed = true;

        this.calculate();
    }
};

/**
* Clears the entire object for a refresh call.
*/
Route.prototype.clear = function() {
    this.startLocation = null;
    this.endLocations = null;

    this.buyOrders = {};
    this.buyOrders.completePages = [];
    this.buyOrders.complete = false;
    this.buyOrders.pageBookend = null;

    this.sellOrders = {};

    this.itemIds = [];
    this.secondsToRefresh = 60;

    clearInterval(this.asyncRefresher);
    clearInterval(this.asyncProgressUpdate);
};

/**
 * The asynchronous function that calculated when a refresh can occur.
 */
Route.prototype.asyncRefresh = function() {
    var thiz = this;
    this.asyncRefresher = setInterval(function(){
        if(thiz.secondsToRefresh <= 0){
            clearInterval(thiz.asyncRefresher);
            $("#refresh_timer").remove();
            $("#buying_footer").append('<div id="refresh_button">' +
                '<input type="button" class="btn btn-default" onclick="refresh()" value="Refresh Table with Last Query"/>' +
                '</div>');
        } else {
            if (rowAdded) {
                $(".loading").hide();
            } else {
                $(".loading").text("No trades found for your filters.");
            }

            $("#refresh_timer").html("<p>Refresh allowed in: " + thiz.secondsToRefresh + " seconds.");
            thiz.secondsToRefresh--;
        }
    }, 1000);
};

/**
* Async function which determines the progress of the query
*/
Route.prototype.asyncProgress = function() {
    var thiz = this;
    this.asyncProgressUpdate = setInterval(function() {
        getTotalProgress();

        if (totalProgress == 100) {
            clearInterval(thiz.asyncProgressUpdate);

            $("#buying_footer").append('<div id="refresh_timer"></div>');

            $(".tableLoadingIcon").hide();

            if (!createdRefresher) {
                createdRefresher = true;
                thiz.asyncRefresh();
            }
        }
    }, 2500);
};

/**
 * The function that asynchronously calculates trades.
 */
Route.prototype.calculate = function() {
    this.asyncProgress();

    while(this.itemIds.length != 0){
        executingCount++;
        var itemId = this.itemIds.splice(0, 1)[0];
        if(this.itemIds.length == 0) {
            this.completed = true;
        }
        this.calculateNext(itemId);
    }
};

/**
 * Calculates the trades for the given itemId.
 *
 * @param itemId The itemId to calculate for.
 */
Route.prototype.calculateNext = function(itemId) {

    var buyPrice = getMarketData(this.buyOrders[itemId], this.startLocation.station, (orderTypeStart == "buy" ? BUY_ORDER : SELL_ORDER), itemId, true);

    if (buyPrice.length > 0) {
        if(orderTypeStart != "sell" || orderTypeEnd != "buy") {
          if(orderTypeStart=="buy"){
            buyPrice = [buyPrice[0]]
          } else {
            buyPrice = [buyPrice[buyPrice.length-1]]
          }
        }
        var executed = false;

        var rI = 0;
        for(var i = 0; i < this.endLocations.length; i++){
            if(this.endLocations[i].station !== this.startLocation.station) {
                var sellOrder = this.sellOrders[rI];
                var endLocation = this.endLocations[i];

                if (sellOrder[itemId]) {
                    var sellPrice = getMarketData(sellOrder[itemId], endLocation.station, (orderTypeEnd == "buy" ? BUY_ORDER : SELL_ORDER), itemId, true);
                    if (sellPrice.length > 0) {
                      if(orderTypeStart != "sell" || orderTypeEnd != "buy") {
                        if(orderTypeStart=="buy"){
                          sellPrice = [sellPrice[0]]
                        } else {
                          sellPrice = [sellPrice[sellPrice.length-1]]
                        }
                      }
                        var locationInfo = {};
                        locationInfo.region = endLocation.region;
                        locationInfo.station = endLocation.station;
                        executed = true;

                        this.getItemInfo(itemId, buyPrice, sellPrice, locationInfo);
                    }
                }
                rI += 1;
            }
        }

        if(!executed){
            executingCount--;
        }
    } else {
        executingCount--;
    }
};

/**
* Gets a particular item info given its itemId
*/
Route.prototype.getItemInfo = function(itemId, buyPrice, sellPrice, locationInfo){
    var rows = [];

    for(var i = 0; i < buyPrice.length; i++){
        for(var j = 0; j < sellPrice.length; j++){
            var row = this.calculateRow(itemId, buyPrice[i][0], buyPrice[i][1], sellPrice[j][0], sellPrice[j][1], locationInfo);
            if(row.length > 0){
                rows.push(row);
            }
        }
    }

    if(rows.length > 0){
        rows = rows.sort(bestRowComparator);
        this.getItemWeight(itemId, this.createRowObject(rows[0]));
    }else {
        executingCount--;
    }
};

/**
* Calculates the metrics behind a given row
*/
Route.prototype.calculateRow = function(itemId, buyPrice, buyVolume, sellPrice, sellVolume, locationInfo){
    if(buyPrice < sellPrice && sellPrice > 0){
        var itemSellTax = sellPrice * salesTax / 100;
        var itemProfit =  sellPrice - itemSellTax - buyPrice;

        if(itemProfit > 0){
            var volume;
    
            if(buyVolume >= sellVolume){
                volume = sellVolume;
            }else{
                volume = buyVolume;
            }

            var grossMargin = volume * (sellPrice - buyPrice)
            var sellTax = volume * itemSellTax;
            var netProfit = grossMargin - sellTax;
            var netCosts = volume * buyPrice;
            var netSales = volume * sellPrice;
    
            var iskRatio = itemProfit / buyPrice;

            if(netProfit >= haulingMinProfit && (iskRatio.toFixed(3)*100).toFixed(1) >= haulingMinRoi && netCosts <= haulingMaxBudget ){
                return [itemId, volume, buyPrice, netCosts, locationInfo, sellPrice, netSales, grossMargin, sellTax, netProfit, iskRatio, itemProfit];
            }
        }
    }
    return [];
};

/**
* Gets the itemweight of a given itemId (checks cache if it was already retrieved)
*/
Route.prototype.getItemWeight = function(itemId, row){
    var weightData = getWeight(itemId);
    if(weightData) {
        row.itemName = weightData.typeName;
        row.itemWeight = weightData.volume;
    
        this.addRow(row);
    } else {
        console.log('Item ID not found: ' + itemId)
    }
};

/**
* Creates the route row object for insertion into datatable
*/
Route.prototype.createRowObject = function(row) {
    var rowObject = {};
    rowObject.itemId = row[0];
    rowObject.quantity = row[1];
    rowObject.buyPrice = row[2];
    rowObject.netCosts = row[3];
    rowObject.sellToStation = row[4];
    rowObject.sellPrice = row[5];
    rowObject.netSales = row[6];
    rowObject.grossMargin = row[7];
    rowObject.sellTax = row[8];
    rowObject.netProfit = row[9];
    rowObject.roi = row[10];
    rowObject.perItemProfit = row[11];
    return rowObject;
};

/**
* Adds the row to the datatable if it passes all the conditions
*/
Route.prototype.addRow = function(row) {

    var storageVolume = row.itemWeight * row.quantity;

    if(storageVolume > haulingMaxCargo) {
        return;
    }

    if(isSpamItem(row.itemName)) {
        return;
    }

    createDataTable();

    var investigateId = row.sellToStation.station + this.startLocation.station + row.itemId + "_investigate";

    var row_data = [
        "<span id=\""+ investigateId +"\"" +
        "data-itemId=\"" + row.itemId + "\"" +
        "data-itemName=\"" + row.itemName + "\"" +
        "data-routeId=\"" + this.routeId + "\"" +
        "data-sellStationId=\"" + row.sellToStation.station + "\">" +
        "<i class=\"fa fa-search-plus\"></i>" +
        "</span>",
        row.itemName,
        this.startLocation.name,
        numberWithCommas(row.quantity),
        numberWithCommas(row.buyPrice.toFixed(2)),
        numberWithCommas(row.netCosts.toFixed(2)),
        getStationName(row.sellToStation.station),
        numberWithCommas(row.sellPrice.toFixed(2)),
        numberWithCommas(row.netSales.toFixed(2)),
        numberWithCommas(row.grossMargin.toFixed(2)),
        numberWithCommas(row.sellTax.toFixed(2)),
        numberWithCommas(row.netProfit.toFixed(2)),
        numberWithCommas(row.perItemProfit.toFixed(2)),
        (row.roi.toFixed(3)*100).toFixed(1)+"%",
        numberWithCommas(storageVolume.toFixed(2))
    ];

    var rowIndex = $('#dataTable').dataTable().fnAddData(row_data);
    $('#dataTable').dataTable().fnGetNodes(rowIndex);

    $("#" + investigateId).on('click', function(){
        var popId = parseInt(this.dataset.itemid);
        var popName = this.dataset.itemname;
        var popFrom = routes[parseInt(this.dataset.routeid)].startLocation;
        var popTo = parseInt(this.dataset.sellstationid);

        open_popup(popId, popName, popFrom, popTo);
    });

    rowAdded = true;
};
