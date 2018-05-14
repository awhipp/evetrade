var thiz;
var BUY_ORDER = "buy";
var SELL_ORDER = "sell";

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
    this.buyOrders.completedPages = 0;
    this.sellOrders = {};

    this.totalProgress = 0;
    this.pages = 20;
    this.itemIds = [];

    thiz = this;
}

/**
 * Begins the process for finding route information and displaying the best trades for the route.
 */
Route.prototype.startRoute = function() {
    var page;
    var regionId = parseInt(this.startLocation.region);
    var stationId = parseInt(this.startLocation.station);

    for(page = 1; page <= this.pages; page++){
        this.getBuyOrders(regionId, stationId, page, this.buyOrders);
    }

    for(var i = 0; i < this.endLocations.length; i++){
        this.sellOrders[i] = {};
        this.sellOrders[i].completedPages = 0;

        regionId = parseInt(this.endLocations[i].region);
        stationId = parseInt(this.endLocations[i].station);

        for(page = 1; page <= this.pages; page++){
            this.getSellOrders(regionId, stationId, page, this.sellOrders[i]);
        }
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
Route.prototype.marketEndpointBuilder = function(region, page, orderType) {
    var url = "https://esi.tech.ccp.is/latest/markets/" + region + "/orders/" +
        "?datasource=tranquility" +
        "&page=" + page +
        "&order_type=" + orderType +
        "&language=en-us";
    return url.replace(/\s/g, '');

};

/**
 * Helper function to increment order finding progress and paint it to the screen.
 *
 * @param composite The running buy or sell order list object.
 */
Route.prototype.incrementProgress = function(composite) {
    this.totalProgress += (100 / (this.endLocations.length + 1) / this.pages);
    this.totalProgress = this.totalProgress > 100 ? 100 : this.totalProgress;

    $(".loading").html("<b>Getting orders: " + this.totalProgress.toFixed(2) + "% complete</b>");

    composite.completedPages += 1;
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

    $.ajax({
        type: "get",
        url: url,
        dataType: "json",
        contentType: "application/json",
        async: true,
        cache: false,
        success: function(data) {
            thiz.incrementProgress(composite);

            if(composite.completedPages == thiz.pages){
                thiz.executeOrders(composite);
            }else{
                for(var i = 0; i < data.length; i++){
                    if(data[i]["location_id"] === station){
                        var id = data[i]["type_id"];
                        if(!composite[id]){
                            composite[id] = [];
                        }
                        composite[id].push(data[i]);
                    }
                }
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown){
            console.log(errorThrown);

            displayError();

            thiz.incrementProgress(composite);

            if(composite.completedPages == thiz.pages){
                executeOrders();
            }
        }
    });
};

Route.prototype.checkOrdersComplete = function() {
    var ordersComplete = (this.buyOrders.completedPages === this.pages);
    for (var i = 0; i < this.sellOrders.length; i++) {
        ordersComplete = ordersComplete && (this.sellOrders[i].completedPages === this.pages);
    }
    return ordersComplete;
};

Route.prototype.executeOrders = function() {
    if (this.checkOrdersComplete()) {
        hideError();

        this.totalProgress = 100;
        $(".loading").text("Getting orders: " + this.totalProgress.toFixed(2) + "% complete");

        for(itemid in this.buyOrders){
            this.itemIds.push(itemid);
        }

        console.log('finished');
        // this.executeNext();
    }
};