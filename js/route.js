var thiz;

var BUY_ORDER = "buy";
var SELL_ORDER = "sell";
var ESI_ENDPOINT = "https://esi.evetech.net";

var PAGE_MULTIPLE = 50;

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
    this.buyOrders.pageBookend = PAGE_MULTIPLE;

    this.sellOrders = {};

    this.totalProgress = 0;
    this.itemIds = [];
    this.asyncChecker = null;
}

/**
 * Begins the process for finding route information and displaying the best trades for the route.
 */
Route.prototype.startRoute = function() {
    thiz = this;

    var page;
    var regionId = parseInt(this.startLocation.region);
    var stationId = parseInt(this.startLocation.station);

    for(page = 1; page <= PAGE_MULTIPLE; page++){
        this.getBuyOrders(regionId, stationId, page, this.buyOrders);
    }

    for(var i = 0; i < this.endLocations.length; i++){
        this.sellOrders[i] = {};
        this.sellOrders[i].completePages = [];
        this.sellOrders[i].complete = false;
        this.sellOrders[i].pageBookend = PAGE_MULTIPLE;

        regionId = parseInt(this.endLocations[i].region);
        stationId = parseInt(this.endLocations[i].station);

        for(page = 1; page <= PAGE_MULTIPLE; page++){
            this.getSellOrders(regionId, stationId, page, this.sellOrders[i]);
        }
    }

    $("#selection").hide();
    this.asyncCheck();
};

/**
 * Asynchronous checking function that periodically checks all of the orders to ensure they are still running
 */
Route.prototype.asyncCheck = function() {
    this.asyncChecker = setInterval(function(){
        thiz.executeOrders();
    }, 1000);
};

/**
 * The builder for the market endpoint
 *
 * @param region The region ID in question.
 * @param page The page in question.
 * @param orderType The order type to get orders for.
 * @returns {string} Returns a URL for the ESI EVE Market Endpoint.
 */
Route.prototype.marketEndpointBuilder = function(region, page, orderType) {
    var url = ESI_ENDPOINT + "/latest/markets/" + region + "/orders/" +
        "?datasource=tranquility" +
        "&page=" + page +
        "&order_type=" + orderType +
        "&language=en-us";
    return url.replace(/\s/g, '');

};

/**
 * Calculates the progress using a logarithmic function
 *
 * @returns {number}
 */
Route.prototype.recalculateProgress = function() {
    var progressUpdate = this.getNumberOfCompletePages(this.buyOrders);

    for (var i = 0; i < this.sellOrders.length; i++) {
        progressUpdate += this.getNumberOfCompletePages(this.sellOrders[i]);
    }

    return progressUpdate === 0 ? 1 : progressUpdate;
};

/**
 * Helper function to increment order finding progress and paint it to the screen.
 *
 * @param composite The running buy or sell order list object.
 * @param page The page that is now completed.
 */
Route.prototype.incrementProgress = function(composite, page) {

    if(this.totalProgress !== 100) {
        this.totalProgress = 35.0 * Math.log10(this.recalculateProgress());
        this.totalProgress = this.totalProgress > 100 ? 100 : this.totalProgress;

        $(".loading").html("<b>Getting orders: " + this.totalProgress.toFixed(2) + "% complete</b>");
    }

    composite.completePages[page] = true;
};

/**
 * Helper function that gets buy orders only.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 */
Route.prototype.getBuyOrders = function(region, station, page, composite) {
    this.getOrders(region, station, page, composite, BUY_ORDER);
};

/**
 * Helper function that gets sell orders only.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 */
Route.prototype.getSellOrders = function(region, station, page, composite) {
    this.getOrders(region, station, page, composite, SELL_ORDER);
};

/**
 * Getting the orders for a specific region, station, and page number.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 * @param orderType The order type to get orders for.
 */
Route.prototype.getOrders = function(region, station, page, composite, orderType) {
    var url = this.marketEndpointBuilder(region, page, orderType);

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
                    console.log("Completed " + station + " order fetch at " + page);
                } else {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i]["location_id"] === station) {
                            var id = data[i]["type_id"];
                            if (!composite[id]) {
                                composite[id] = [];
                            }
                            composite[id].push(data[i]);
                        }
                    }

                    if (!composite.complete && thiz.getNumberOfCompletePages(composite) === composite.pageBookend) {
                        var _page = page + 1;
                        composite.pageBookend = (composite.pageBookend + PAGE_MULTIPLE);

                        for (var newBookend = composite.pageBookend; _page <= newBookend; _page++) {
                            thiz.getOrders(region, station, _page, composite, orderType);
                        }
                    }
                }

            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                displayError();
                thiz.incrementProgress(composite, page);
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
    var orderFull = (this.getNumberOfCompletePages(this.buyOrders) === this.buyOrders.pageBookend);
    var ordersComplete = this.buyOrders.complete;

    for (var i = 0; i < this.sellOrders.length; i++) {
        orderFull = orderFull && (this.getNumberOfCompletePages(this.sellOrders[i]) === this.sellOrders[i].pageBookend);
        ordersComplete = ordersComplete && this.sellOrders[i].complete;
    }

    return (orderFull && ordersComplete);
};

/**
 * If all the active orders are complete then it begins processing them
 */
Route.prototype.executeOrders = function() {
    if (this.checkOrdersComplete()) {

        clearInterval(this.asyncChecker);
        hideError();

        for(itemid in this.buyOrders){
            this.itemIds.push(itemid);
        }

        this.totalProgress = 100;
        $(".loading").text("Getting orders: " + this.totalProgress.toFixed(2) + "% complete");
        console.log('finished');
    }
};