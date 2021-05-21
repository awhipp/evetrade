/**
 * Creates a Station object
 *
 * @param stationLocation a json object that contains the region and station of the start location
 * @constructor
 */
function Station(stationLocation) {
    this.stationLocation = stationLocation;

    this.allOrders = {};
    this.allOrders.completePages = [];
    this.allOrders.complete = false;
    this.allOrders.pageBookend = null;

    this.itemIds = [];
    this.secondsToRefresh = 60;
    this.filtered = false;
    this.completed = false;
    this.filterCount = 0;

    this.asyncChecker = null;
    this.asyncCalculator = null;
    this.asyncFilter = null;
    this.asyncRefresher = null;

    routes.push(this);
}

Station.prototype.className = function() {
    return "Station";
};

/**
 * Begins the process for finding station information and displaying the best trades for the station.
 */
Station.prototype.startStation = function() {
    var regionId = parseInt(this.stationLocation.region);
    var stationId = parseInt(this.stationLocation.station);

    this.getOrders(regionId, stationId, this.allOrders, ALL_ORDER);

    $("#selection").hide();
};

/**
 * Calculates the progress using a logarithmic function
 *
 * @returns {number}
 */
Station.prototype.recalculateProgress = function() {
    var progressUpdate = this.getNumberOfCompletePages(this.allOrders);
    return progressUpdate <= 0 ? 1 : 35.0 * Math.log10(progressUpdate);
};


/**
 * Getting the orders for a specific region, station, and page number.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param composite The running buy or sell order list object.
 * @param orderType The order type to get orders for.
 */
Station.prototype.getOrders = function(region, station, composite, orderType) {
    var thiz = this;

    this.getOrder(region, station, composite, orderType, 1)
    .then(function(){
        for (var page = 2; page <= composite.pageBookend; page++) {
            thiz.getOrder(region, station, composite, orderType, page)
        }
    })
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
Station.prototype.getOrder = function(region, station, composite, orderType, page) {
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
Station.prototype.getNumberOfCompletePages = function(order) {
    var numberOfCompletedPages = 0;
    for(var i = 0; i < order.completePages.length; i++) {
        if (order.completePages[i]) {
            numberOfCompletedPages++;
        }
    }
    return numberOfCompletedPages;
};

/**
 * If all the active orders are complete then it begins processing them
 */
Station.prototype.executeOrders = function() {
    hideError();

    for(itemId in this.allOrders){
        if(itemId !== "completePages" && itemId !== "complete" && itemId !== "pageBookend")
            this.itemIds.push(itemId);
    }

    this.asyncCalculate();
};

/**
* Clears the entire class including asynchronous timers.
*/
Station.prototype.clear = function() {
    this.stationLocation = null;

    this.allOrders = {};
    this.allOrders.completePages = [];
    this.allOrders.complete = false;
    this.allOrders.pageBookend = null;

    this.itemIds = [];
    this.secondsToRefresh = 60;
    this.filtered = false;
    this.filterCount = 0;
    this.completed = false;

    clearInterval(this.asyncChecker);
    clearInterval(this.asyncCalculator);
    clearInterval(this.asyncFilter);
    clearInterval(this.asyncRefresher);
};

/**
 * The asynchronous function that calculated when a refresh can occur.
 */
Station.prototype.asyncRefresh = function() {
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

            $(".tableLoadingIcon").hide();

            $("#refresh_timer").html("<p>Refresh allowed in: " + thiz.secondsToRefresh + " seconds.");
            thiz.secondsToRefresh--;
        }
    }, 1000);
};

/**
 * The function that asynchronously calculates trades.
 */
Station.prototype.asyncCalculate = function() {
    var thiz = this;
    this.asyncCalculator = setInterval(function(){
        if(!thiz.filtered){
            thiz.filtered = true;
            $("#buying_footer").append("<div id='filtering-data'>Filtering Results. Please wait.</br>If it takes too long try a smaller margin range.</div>");
            thiz.asyncFiltering();
        }

        while(thiz.itemIds.length != 0 && executingCount < 1500){
            executingCount++;
            var itemId = thiz.itemIds.splice(0, 1)[0];
            thiz.calculateNext(itemId);
        }

        if(thiz.itemIds.length == 0 && executingCount <= 0) {
            clearInterval(thiz.asyncCalculator);

            $(".tableLoadingIcon").hide();

            if (rowAdded) {
                $(".loading").hide();
            }

            $("#buying_footer").append('<div id="refresh_timer"></div>');

            thiz.asyncRefresh();
        }
    }, 1000);
};

/**
 * Calculates the trades for the given itemId.
 *
 * @param itemId The itemId to calculate for.
 */
Station.prototype.calculateNext = function(itemId) {

    var buyPrice = getMarketData(this.allOrders[itemId], this.stationLocation.station, SELL_ORDER, itemId, false);

    if (buyPrice.length > 0) {
        var executed = false;

        if(this.allOrders[itemId]){
            var sellPrice = getMarketData(this.allOrders[itemId], this.stationLocation.station, BUY_ORDER, itemId, false);
            if(sellPrice.length > 0){
                executed = true;

                this.getItemInfo(itemId, buyPrice, sellPrice);
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
* Gets the best sell and buy price for a particular itemId
*
* @param itemId The itemId to calculate for.
* @param buyPrice The items buyPrice to compare.
* @param sellPrice The items sellPrice to compare.
*/
Station.prototype.getItemInfo = function(itemId, buyPrice, sellPrice){
    var bestBuyPrice = sellPrice[0][0];
    var bestSellPrice = buyPrice[0][0];

    for(var i = 0; i < buyPrice.length; i++){
        for(var j = 0; j < sellPrice.length; j++){
            if(sellPrice[j][0] > bestSellPrice) {
                bestSellPrice = sellPrice[j][0];
            }
            if(buyPrice[i][0] < bestBuyPrice) {
                bestBuyPrice = buyPrice[i][0];
            }
        }
    }

    var row = {};
    buyPrice = bestBuyPrice;
    sellPrice = bestSellPrice;

    var itemSellTax = sellPrice * salesTax / 100;
    var itemBuyFee = buyPrice * sstBrokerFee / 100;
    var itemSellFee = sellPrice * sstBrokerFee / 100;
    var grossMargin = sellPrice - buyPrice;
    var itemProfit = grossMargin - itemSellTax - itemBuyFee - itemSellFee;
    var itemMargin = itemProfit / buyPrice;

    if(itemMargin*100 >= sstLowerMargin && itemMargin*100 <= sstUpperMargin && itemProfit > 1000){
        row.buyPrice = buyPrice;
        row.sellPrice = sellPrice;
        row.itemId = itemId;
        this.getItemVolume(itemId, row);
        row.sellTax = itemSellTax;
        row.grossMargin = grossMargin;
        row.netProfit = itemProfit;
        row.margin = itemMargin;
        row.buyFee = itemBuyFee;
        row.sellFee = itemSellFee;
    }else {
        executingCount--;
    }
};

/**
* An async function which determines when filtering is occuring as well as when it has stopped.
*/
Station.prototype.asyncFiltering = function() {
    var thiz = this;
    this.asyncFilter = setInterval(function(){
            thiz.filterCount += 1;
            var ellipses = "";
            for(var i = 0; i < ( thiz.filterCount % 5) ; i++){
                ellipses += ".";
            }

            $("#filtering-data").html("Filtering Results. Please wait" + ellipses + "</br>If it takes too long try a smaller margin range.");

            if(executingCount == 0) {
                clearInterval(thiz.asyncFilter);
                $("#filtering-data").remove();
            }
        },
        250);
};

/**
* The rest function to get an item's market volume
*
* @param itemId the item id for the item in question
* @param row the data row that this will be applied to
*/
Station.prototype.getItemVolume = function(itemId, row){
    var url = getVolumeEndpointBuilder(this.stationLocation.region, itemId);
    var thiz = this;
    $.ajax({
        type: "get",
        url: url,
        dataType: "json",
        async: true,
        cache: false,
        contentType: "application/json",
        success: function(volumeData) {
            if(volumeData && volumeData[volumeData.length-1] && volumeData[volumeData.length-1].volume){
                row.volume = volumeData[volumeData.length-1].volume;
                row.volume14 = 0;
                row.volume30 = 0;
                for(var i = 1; i < 31; i++) {
                    if(volumeData[volumeData.length-i] && volumeData[volumeData.length-i].volume) {
                        if (i < 15) {
                            row.volume14 += volumeData[volumeData.length-i].volume;
                        }
                        row.volume30 += volumeData[volumeData.length-i].volume;
                    }
                }
                row.volume14 = parseInt(row.volume14 / 14);
                row.volume30 = parseInt(row.volume30 / 30);

                if(row.volume14 >= sstMinVolume){
                    thiz.getItemWeight(itemId, row);
                }else{
                    executingCount--;
                }
            }else{
                executingCount--;
            }
        },
        error: function (request, error) {
            if(request.status != 404 && request.statusText !== "parsererror") {
                thiz.getItemVolume(itemId, row);
            } else {
                executingCount--;
            }
        }
    });
};

/**
* The rest function to get an item's weightData
*
* @param itemId the item id for the item in question
* @param row the data row that this will be applied to
*/
Station.prototype.getItemWeight = function(itemId, row){
    var weightData = getWeight(itemId);
    if (weightData) {
        row.itemName = weightData.typeName;

        this.addRow(row);
    } else {
        console.log('Error: Cannot find itemId: ' + itemId)
    }
    executingCount--;
};

/**
* Adds the row to the datatable. This also creates the datatable if it has not been created yet.
*
* @param row the row to be added
*/
Station.prototype.addRow = function(row) {

    createDataTable();

    var row_data = [
        row.itemName,
        numberWithCommas(row.buyPrice.toFixed(2)),
        numberWithCommas(row.sellPrice.toFixed(2)),
        numberWithCommas(row.grossMargin.toFixed(2)),
        numberWithCommas(row.buyFee.toFixed(2)),
        numberWithCommas(row.sellFee.toFixed(2)),
        numberWithCommas(row.sellTax.toFixed(2)),
        numberWithCommas(row.netProfit.toFixed(2)),
        (row.margin.toFixed(3)*100).toFixed(1)+"%",
        numberWithCommas(row.volume),
        numberWithCommas(row.volume14),
        numberWithCommas(row.volume30)
    ];

    $('#dataTable').dataTable().fnAddData(row_data);

    rowAdded  = true;
};
