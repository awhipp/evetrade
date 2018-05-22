var routes = [];

/**
 * Creates a Region object
 *
 * @param startLocation a json object that contains the region and station of the start location
 * @param endLocation a json object array that contains the region and station of the end locations
 * @constructor
 */
function Region(startLocation, endLocation) {
    this.startLocation = startLocation;
    this.endLocations = endLocation;

    this.buyOrders = {};
    this.buyOrders.completePages = [];
    this.buyOrders.complete = false;
    this.buyOrders.pageBookend = PAGE_MULTIPLE;


    this.sellOrders = {};
    this.sellOrders.completePages = [];
    this.sellOrders.complete = false;
    this.sellOrders.pageBookend = PAGE_MULTIPLE;

    this.totalProgress = 0;
    this.regionRoutes = [];
    this.secondsToRefresh = 60;

    this.asyncRefresher = null;
    this.asyncProgressUpdate = null;
    this.routesExecutor = null;

    this.completed = false;

    routes.push(this);
}

Region.prototype.className = function() {
    return "Route";
};


/**
 * Begins the process for finding route information and displaying the best trades for the route.
 */
Region.prototype.startRoute = function() {
    var page;
    var regionId = parseInt(this.startLocation.id);

    for(page = 1; page <= PAGE_MULTIPLE; page++){
        this.getSellOrders(regionId, page, this.buyOrders);
    }

    regionId = parseInt(this.endLocations.id);

    for(page = 1; page <= PAGE_MULTIPLE; page++){
        this.getBuyOrders(regionId, page, this.sellOrders);
    }

    $("#selection").hide();
};

/**
 * The builder for the market endpoint
 *
 * @param region The region ID in question.
 * @param page The page in question.
 * @param orderType The order type to get orders for.
 * @returns {string} Returns a URL for the ESI EVE Market Endpoint.
 */
Region.prototype.marketEndpointBuilder = function(region, page, orderType) {
    var url = ESI_ENDPOINT + "/latest/markets/" + region + "/orders/" +
        "?datasource=tranquility" +
        "&page=" + page +
        "&order_type=" + orderType +
        "&language=en-us&iteration=" + iteration;
    return url.replace(/\s/g, '');
};

/**
 * The builder for the weight/itemtype endpoint
 *
 * @param itemId The item ID in question.
 * @returns {string} Returns a URL for the ESI EVE Item Type Endpoint.
 */
Region.prototype.getWeightEndpointBuilder = function(itemId) {
    var url = ESI_ENDPOINT + "/latest/universe/types/" + itemId + "/" +
        "?datasource=tranquility" +
        "&language=en-us" +
        "&iteration=" + iteration;
    return url.replace(/\s/g, '');
};

/**
 * Calculates the progress using a logarithmic function
 *
 * @returns {number}
 */
Region.prototype.recalculateProgress = function() {
    var progressUpdate = this.getNumberOfCompletePages(this.buyOrders);
    progressUpdate += this.getNumberOfCompletePages(this.sellOrders);

    return progressUpdate <= 0 ? 1 : 35.0 * Math.log10(progressUpdate);
};

/**
 * Helper function to increment order finding progress and paint it to the screen.
 *
 * @param composite The running buy or sell order list object.
 * @param page The page that is now completed.
 */
Region.prototype.incrementProgress = function(composite, page) {

    getTotalProgress();

    composite.completePages[page] = true;
};

/**
 * Helper function that gets buy orders only.
 *
 * @param region The region ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 */
Region.prototype.getBuyOrders = function(region, page, composite) {
    this.getOrders(region, page, composite, BUY_ORDER);
};

/**
 * Helper function that gets sell orders only.
 *
 * @param region The region ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 */
Region.prototype.getSellOrders = function(region, page, composite) {
    this.getOrders(region, page, composite, SELL_ORDER);
};

/**
 * Getting the orders for a specific region, station, and page number.
 *
 * @param region The region ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 * @param orderType The order type to get orders for.
 */
Region.prototype.getOrders = function(region, page, composite, orderType) {

    var url = this.marketEndpointBuilder(region, page, orderType);
    var thiz = this;

    if(!composite.completePages[page]) {
        $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            contentType: "application/json",
            async: true,
            success: function(data) {
                thiz.incrementProgress(composite, page);

                if (data.length === 0 && !composite.complete) {
                    composite.complete = true;
                    console.log("Completed " + region + " order fetch at " + page);
                } else {
                    for (var i = 0; i < data.length; i++) {
                        var stationId = data[i]["location_id"];
                        var id = data[i]["type_id"];


                        if (!composite[stationId]) {
                            composite[stationId] = {};
                        }

                        if (!composite[stationId][id]) {
                            composite[stationId][id] = [];
                        }

                        composite[stationId][id].push(data[i]);
                    }

                    if (!composite.complete && thiz.getNumberOfCompletePages(composite) === composite.pageBookend) {
                        var _page = page + 1;
                        composite.pageBookend = (composite.pageBookend + PAGE_MULTIPLE);

                        for (var newBookend = composite.pageBookend; _page <= newBookend; _page++) {
                            thiz.getOrders(region, _page, composite, orderType);
                        }
                    } else {
                        thiz.executeOrders();
                    }
                }

            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                displayError();
                thiz.incrementProgress(composite, page);

                if(!composite.complete && thiz.getNumberOfCompletePages(composite) === composite.pageBookend) {
                    var _page = page + 1;
                    composite.pageBookend = (composite.pageBookend + PAGE_MULTIPLE);

                    for (var newBookend = composite.pageBookend; _page <= newBookend; _page++) {
                        thiz.getOrders(region, _page, composite, orderType);
                    }
                }
            }
        });
    }
};

/**
 * Gets the number of completed pages for a specific order
 *
 * @param order The specific buy or sell order
 * @returns {number} The number of completed pages
 */
Region.prototype.getNumberOfCompletePages = function(order) {
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
Region.prototype.checkOrdersComplete = function() {
    var orderFull = (this.getNumberOfCompletePages(this.buyOrders) === this.buyOrders.pageBookend);
    var ordersComplete = this.buyOrders.complete;

    orderFull = orderFull && (this.getNumberOfCompletePages(this.sellOrders) === this.sellOrders.pageBookend);
    ordersComplete = ordersComplete && this.sellOrders.complete;

    return (orderFull && ordersComplete);
};

/**
 * If all the active orders are complete then it begins processing them
 */
Region. regionRoutes = [];
Region.prototype.executeOrders = function() {
    if (this.checkOrdersComplete()) {
        hideError();

        for(startStationId in this.buyOrders) {
            var start = {};
            start.name = stationIdToName[startStationId];
            start.region = this.startLocation.id;
            start.station = startStationId;

            for(itemId in this.buyOrders[startStationId]) {
                if(itemId !== "completePages" && itemId !== "complete" && itemId !== "pageBookend") {
                    var buyPrice = getMarketData(this.buyOrders[startStationId][itemId], start.station, SELL_ORDER, itemId, true);

                    if (buyPrice.length > 0) {

                        for (endStationId in this.sellOrders) {
                            if (endStationId < 999999999 && endStationId !== startStationId) {
                                var end = {};
                                end.name = stationIdToName[endStationId];
                                end.region = this.endLocations.id;
                                end.station = endStationId;

                                var sellOrder = this.sellOrders[endStationId];

                                if (sellOrder && sellOrder[itemId]) {
                                    var sellPrice = getMarketData(sellOrder[itemId], end.station, BUY_ORDER, itemId, true);
                                    if (sellPrice.length > 0) {
                                        var route = {};
                                        route.itemId = itemId;
                                        route.buyPrice = buyPrice;
                                        route.sellPrice = sellPrice;
                                        route.start = start;
                                        route.end = end;
                                        this.regionRoutes.push(route);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        this.executeRoutes();

    }
};

Region.prototype.executeRoutes = function() {
    var thiz = this;
    var runningCount = 0;
    var originalCount = this.regionRoutes.length;
    var remainingProgress = 100 - totalProgress;
    var originalTotal = totalProgress;

    this.routesExecutor = setInterval(function(){

        if(thiz.regionRoutes.length == 0){
            totalProgress = 100;
            clearInterval(thiz.routesExecutor);
            if (rowAdded) {
                $(".loading").hide();
            }

            $("#buyingFooter").append('<div id="refresh-timer"></div>');

            thiz.asyncRefresh();
        }

        for(var i = 0; i < thiz.regionRoutes.length && i < 1000; i++ ) {
            var route = thiz.regionRoutes.splice(0, 1)[0];

            thiz.getItemInfo(route.itemId, route.buyPrice, route.sellPrice, route.start, route.end);
            runningCount += 1;
        }

        totalProgress = originalTotal + (remainingProgress * (runningCount/originalCount));

        $(".loading").html("Adding orders to table: " + totalProgress.toFixed(2) + "% complete");
    }, 1000);
};

Region.prototype.clear = function() {
    this.startLocation = null;
    this.endLocations = null;

    this.buyOrders = {};
    this.buyOrders.completePages = [];
    this.buyOrders.complete = false;
    this.buyOrders.pageBookend = PAGE_MULTIPLE;

    this.sellOrders = {};
    this.sellOrders.completePages = [];
    this.sellOrders.complete = false;
    this.sellOrders.pageBookend = PAGE_MULTIPLE;

    this.regionRoutes = [];
    this.secondsToRefresh = 120;

    clearInterval(this.asyncRefresher);
    clearInterval(this.asyncProgressUpdate);
    clearInterval(this.routesExecutor);

    this.completed = false;
};


/**
 * The asynchronous function that calculated when a refresh can occur.
 */
Region.prototype.asyncRefresh = function() {
    var thiz = this;
    this.asyncRefresher = setInterval(function(){
        if(thiz.secondsToRefresh <= 0){
            clearInterval(thiz.asyncRefresher);
            $("#refresh-timer").remove();
            $("#buyingFooter").append('<div id="refresh-button">' +
                '<input type="button" class="btn btn-default" onclick="refresh()" value="Refresh Table with Last Query"/>' +
                '</div>');
        } else {
            $("#refresh-timer").html("<br><p>Refresh allowed in: " + thiz.secondsToRefresh + " seconds.");
            thiz.secondsToRefresh--;
        }
    }, 1000);
};

Region.prototype.getItemInfo = function(itemId, buyPrice, sellPrice, start, end){
    var rows = [];

    for(var i = 0; i < buyPrice.length; i++){
        for(var j = 0; j < sellPrice.length; j++){
            var row = this.calculateRow(itemId, buyPrice[i][0], buyPrice[i][1], sellPrice[j][0], sellPrice[j][1], start, end);
            if(row.length > 0){
                rows.push(row);
            }
        }
    }

    if(rows.length > 0){
        rows = rows.sort(bestRowComparator);
        this.getItemWeight(itemId, this.createRowObject(rows[0]));
    }
};

Region.prototype.calculateRow = function(itemId, buyPrice, buyVolume, sellPrice, sellVolume, start, end){
    if(buyPrice < sellPrice && sellPrice > 0){
        var itemProfit = sellPrice - buyPrice;

        var profit;
        var buyCost;
        var volume;

        if(buyVolume >= sellVolume){
            volume = sellVolume;
            profit = sellVolume * itemProfit;
            buyCost = buyPrice * sellVolume;
        }else{
            volume = buyVolume;
            profit = buyVolume * itemProfit;
            buyCost = buyPrice * buyVolume;
        }

        var iskRatio = (sellPrice-buyPrice)/buyPrice;

        if(profit >= threshold_profit && (iskRatio.toFixed(3)*100).toFixed(1) >= threshold_roi && buyCost <= threshold_cost ){
            return [itemId, start, buyPrice, volume, buyCost, end, profit, iskRatio, sellPrice, itemProfit];
        }else{
            return [];
        }
    }
    return [];
};

Region.prototype.getItemWeight = function(itemId, row){
    if(itemCache[itemId]){
        var name = itemCache[itemId].name;
        var weight = itemCache[itemId].weight;

        row.itemName = name;
        row.itemWeight = weight;

        this.addRow(row);
    }else{
        var thiz = this;
        var url = this.getWeightEndpointBuilder(itemId);
        $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            async: true,
            cache: false,
            contentType: "application/json",
            success: function(weightData) {
                var name = weightData.name;
                var weight = weightData.packaged_volume;

                itemCache[itemId] = {};
                itemCache[itemId].name = name;
                itemCache[itemId].weight = weight;

                row.itemName = name;
                row.itemWeight = weight;

                thiz.addRow(row);
            },
            error: function (request, error) {
                if(request.status != 404 && request.statusText !== "parsererror") {
                    thiz.getItemWeight(itemId, row);
                }
            }
        });
    }
};

Region.prototype.createRowObject = function(row) {
    var rowObject = {};
    rowObject.itemId = row[0];
    rowObject.buyFromStation = row[1];
    rowObject.buyPrice = row[2];
    rowObject.quantity = row[3];
    rowObject.buyCost = row[4];
    rowObject.sellToStation = row[5];
    rowObject.totalProfit = row[6];
    rowObject.roi = row[7];
    rowObject.sellPrice = row[8];
    rowObject.perItemProfit = row[9];
    return rowObject;
};

Region.prototype.addRow = function(row) {

    var storageVolume = row.itemWeight * row.quantity;

    if(storageVolume > threshold_weight) {
        return;
    }

    if(isSpamItem(row.itemName)) {
        return;
    }


    if(!tableCreated) {
        this.createTable();
    }

    var investigateId = row.sellToStation.station + row.buyFromStation.station + row.itemId + "_investigate";

    var row_data = [
        "<span id=\""+ investigateId +"\"" +
        "data-itemId=\"" + row.itemId + "\"" +
        "data-itemName=\"" + row.itemName + "\"" +
        "data-fromStationId=\"" + row.buyFromStation.station + "\"" +
        "data-sellStationId=\"" + row.sellToStation.station + "\">" +
        "<i class=\"fa fa-search-plus\"></i>" +
        "</span>",
        row.itemName,
        row.buyFromStation.name,
        numberWithCommas(row.quantity),
        numberWithCommas(row.buyPrice.toFixed(2)),
        numberWithCommas(row.buyCost.toFixed(2)),
        row.sellToStation.name,
        numberWithCommas(row.sellPrice.toFixed(2)),
        numberWithCommas(row.totalProfit.toFixed(2)),
        numberWithCommas(row.perItemProfit.toFixed(2)),
        (row.roi.toFixed(3)*100).toFixed(1)+"%",
        numberWithCommas(storageVolume.toFixed(2))
    ];

    var rowIndex = $('#dataTable').dataTable().fnAddData(row_data);
    $('#dataTable').dataTable().fnGetNodes(rowIndex);

    $("#" + investigateId).on('click', function(){
        var popId = parseInt(this.dataset.itemid);
        var popName = this.dataset.itemname;
        var popFrom = parseInt(this.dataset.fromstationid);

        var fromStation = {};
        fromStation.name = stationIdToName[popFrom];
        fromStation.station = popFrom;

        var toStation = {};
        toStation.name = stationIdToName[this.dataset.sellstationid];
        toStation.station = parseInt(this.dataset.sellstationid);

        open_popup(popId, popName, fromStation, toStation);
    });

    rowAdded = true;
};

Region.prototype.createTable = function() {
    tableCreated = true;
    $("#show-hide").show();
    $('#dataTable').show();
    $(".data_options").append($("#dataTable_filter"));

    $(".data_options").append($(".dt-buttons"));
    $(".dt-button").addClass("btn");
    $(".dt-button").addClass("btn-default");

    $(".deal_note").hide();
    $("#core input").css('display','block');
    $("#core a").css('display','inline-block');
    $("#core").show();
};