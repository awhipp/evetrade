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
    this.itemCache = {};

    this.totalProgress = 0;
    this.itemIds = [];
    this.executingCount = 0;
    this.secondsToRefresh = 60;
    this.tableCreated = false;

    this.asyncChecker = null;
    this.asyncCalculator = null;
    this.asyncRefresher = null;
}

Route.prototype.className = function() {
    return "Route";
};


/**
 * Begins the process for finding route information and displaying the best trades for the route.
 */
Route.prototype.startRoute = function() {
    thiz = this;

    var page;
    var regionId = parseInt(this.startLocation.region);
    var stationId = parseInt(this.startLocation.station);

    for(page = 1; page <= PAGE_MULTIPLE; page++){
        this.getSellOrders(regionId, stationId, page, this.buyOrders);
    }

    for(var i = 0; i < this.endLocations.length; i++){
        this.sellOrders[i] = {};
        this.sellOrders[i].completePages = [];
        this.sellOrders[i].complete = false;
        this.sellOrders[i].pageBookend = PAGE_MULTIPLE;

        regionId = parseInt(this.endLocations[i].region);
        stationId = parseInt(this.endLocations[i].station);

        for(page = 1; page <= PAGE_MULTIPLE; page++){
            this.getBuyOrders(regionId, stationId, page, this.sellOrders[i]);
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
        "&language=en-us&iteration=" + iteration;
    return url.replace(/\s/g, '');
};

/**
 * The builder for the weight/itemtype endpoint
 *
 * @param itemId The item ID in question.
 * @returns {string} Returns a URL for the ESI EVE Item Type Endpoint.
 */
Route.prototype.getWeightEndpointBuilder = function(itemId) {
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
Route.prototype.recalculateProgress = function() {
    var progressUpdate = this.getNumberOfCompletePages(this.buyOrders);

    for (var i = 0; i < this.endLocations.length; i++) {
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

                if(!composite.complete && thiz.getNumberOfCompletePages(composite) === composite.pageBookend) {
                    var _page = page + 1;
                    composite.pageBookend = (composite.pageBookend + PAGE_MULTIPLE);

                    for (var newBookend = composite.pageBookend; _page <= newBookend; _page++) {
                        thiz.getOrders(region, station, _page, composite, orderType);
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

    for (var i = 0; i < this.endLocations.length; i++) {
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

        for(itemId in this.buyOrders){
            if(itemId !== "completePages" && itemId !== "complete" && itemId !== "pageBookend")
                this.itemIds.push(itemId);
        }

        this.totalProgress = 100;
        $(".loading").text("Getting orders: " + this.totalProgress.toFixed(2) + "% complete");

        this.asyncCalculate();
    }
};

/**
 * Refreshes and re-reruns the query.
 */
Route.prototype.refresh = function() {
    $('#noselect-object').html('<table id="dataTable" class="display"></table>');
    $(".dataTables_filter").remove();
    $(".dt-buttons").remove();
    $("#refresh-button").remove();
    iteration += 1;
    this.clear();
    init();
};

Route.prototype.clear = function() {
    this.startLocation = null;
    this.endLocations = null;

    this.buyOrders = {};
    this.buyOrders.completePages = [];
    this.buyOrders.complete = false;
    this.buyOrders.pageBookend = PAGE_MULTIPLE;

    this.sellOrders = {};
    this.itemCache = {};

    this.totalProgress = 0;
    this.itemIds = [];
    this.executingCount = 0;
    this.secondsToRefresh = 60;
    this.tableCreated = false;

    clearInterval(this.asyncChecker);
    clearInterval(this.asyncCalculator);
    clearInterval(this.asyncRefresher);
};

/**
 * The asynchronous function that calculated when a refresh can occur.
 */
Route.prototype.asyncRefresh = function() {
    this.asyncRefresher = setInterval(function(){
        if(thiz.secondsToRefresh <= 0){
            clearInterval(thiz.asyncRefresher);
            $("#refresh-timer").remove();
            $("#buyingFooter").append('<div id="refresh-button">' +
                '<input type="button" class="btn btn-default" onclick="thiz.refresh()" value="Refresh Table with Last Query"/>' +
                '</div>');
        } else {
            $("#refresh-timer").html("<br><p>Refresh allowed in: " + thiz.secondsToRefresh + " seconds.");
            thiz.secondsToRefresh--;
        }
    }, 1000);
};

/**
 * The function that asynchronously calculates trades.
 */
Route.prototype.asyncCalculate = function() {
    this.asyncCalculator = setInterval(function(){
        while(thiz.itemIds.length != 0 && thiz.executingCount < 1500){
            thiz.executingCount++;
            var itemId = thiz.itemIds.splice(0, 1)[0];
            thiz.calculateNext(itemId);
        }

        if(thiz.itemIds.length == 0 && thiz.executingCount <= 0) {
            clearInterval(thiz.asyncCalculator);

            $(".loading").text("No trades found for your filters.");
            $("#buyingFooter").append('<div id="refresh-timer"></div>');

            thiz.asyncRefresh();
        }
    }, 1000);
};

/**
 * Calculates the trades for the given itemId.
 *
 * @param itemId The itemId to calculate for.
 */
Route.prototype.calculateNext = function(itemId) {

    var buyPrice = getMarketData(this.buyOrders[itemId], this.startLocation.station, SELL_ORDER, itemId);

    if (buyPrice.length > 0) {
        var executed = false;

        for(var i = 0; i < this.endLocations.length; i++){
            var sellOrder = this.sellOrders[i];
            var endLocation = this.endLocations[i];

            if(sellOrder[itemId]){
                var sellPrice = getMarketData(sellOrder[itemId], endLocation.station, BUY_ORDER, itemId);
                if(sellPrice.length > 0){
                    var locationInfo = {};
                    locationInfo.region = endLocation.region;
                    locationInfo.station = endLocation.station;
                    executed = true;

                    this.getItemInfo(itemId, buyPrice, sellPrice, locationInfo);
                }
            }
        }

        if(!executed){
            this.executingCount--;
        }
    } else {
        this.executingCount--;
    }
};

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
        this.executingCount--;
    }
};

Route.prototype.calculateRow = function(itemId, buyPrice, buyVolume, sellPrice, sellVolume, locationInfo){
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
            return [itemId, buyPrice, volume, buyCost, locationInfo, profit, iskRatio, sellPrice, itemProfit];
        }else{
            return [];
        }
    }
    return [];
};

Route.prototype.getItemWeight = function(itemId, row){

    if(this.itemCache[itemId]){
        var name = this.itemCache[itemId].name;
        var weight = this.itemCache[itemId].weight;

        row.itemName = name;
        row.itemWeight = weight;

        this.addRow(row);

        this.executingCount--;
    }else{
        var url = this.getWeightEndpointBuilder(itemId);
        $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            async: true,
            cache: false,
            contentType: "application/json",
            success: function(weightData) {
                thiz.executingCount--;

                var name = weightData.name;
                var weight = weightData.packaged_volume;

                thiz.itemCache[itemId] = {};
                thiz.itemCache[itemId].name = name;
                thiz.itemCache[itemId].weight = weight;

                row.itemName = name;
                row.itemWeight = weight;

                thiz.addRow(row);
            },
            error: function (request, error) {
                if(request.status != 404 && request.statusText !== "parsererror") {
                    thiz.getItemWeight(itemId, row);
                } else {
                    thiz.executingCount--;
                }
            }
        });
    }
};

Route.prototype.createRowObject = function(row) {
    var rowObject = {};
    rowObject.itemId = row[0];
    rowObject.buyPrice = row[1];
    rowObject.quantity = row[2];
    rowObject.buyCost = row[3];
    rowObject.sellToStation = row[4];
    rowObject.totalProfit = row[5];
    rowObject.roi = row[6];
    rowObject.sellPrice = row[7];
    rowObject.perItemProfit = row[8];
    return rowObject;
};

Route.prototype.addRow = function(row) {

    var storageVolume = row.itemWeight * row.quantity;

    if(storageVolume > threshold_weight) {
        return;
    }

    var uniqueRowId = row.itemId + "_" + row.sellToStation.station;

    if(!this.tableCreated) {
        this.createTable();
    }

    var investigateId = uniqueRowId + "_investigate";

    var row_data = [
        "<span id='"+ investigateId +"' title='All Orders for " + row.itemName + "'><i class='fa fa-search-plus'></i></span>",
        row.itemName,
        numberWithCommas(row.quantity),
        numberWithCommas(row.buyPrice.toFixed(2)),
        numberWithCommas(row.buyCost.toFixed(2)),
        getStationName(row.sellToStation.station),
        numberWithCommas(row.sellPrice.toFixed(2)),
        numberWithCommas(row.totalProfit.toFixed(2)),
        numberWithCommas(row.perItemProfit.toFixed(2)),
        (row.roi.toFixed(3)*100).toFixed(1)+"%",
        numberWithCommas(storageVolume.toFixed(2))
    ];

    var rowIndex = $('#dataTable').dataTable().fnAddData(row_data);
    var tableRow = $('#dataTable').dataTable().fnGetNodes(rowIndex);

    $(tableRow).attr('id', uniqueRowId + "_" + $("." + uniqueRowId).length);
    $(tableRow).addClass(uniqueRowId);

    $("#" + investigateId).on('click', function(){
        open_popup(row.itemId, row.itemName, row.sellToStation.station);
    });
};

Route.prototype.createTable = function() {
    this.tableCreated = true;

    // sorting on total profit
    var dt = $('#dataTable').DataTable({
        "order": [[ 7, "desc" ]],
        "lengthMenu": [[-1], ["All"]],
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

    // for each column in header add a togglevis button in the div
    var li_counter = 0;
    $("#dataTable thead th").each( function ( i ) {
        var name = dt.column( i ).header();
        var spanelt = document.createElement( "button" );
        spanelt.innerHTML = name.innerHTML;

        $(spanelt).addClass("colvistoggle");
        $(spanelt).addClass("btn");
        $(spanelt).addClass("btn-default");
        $(spanelt).attr("colidx",i);    // store the column idx on the button

        $(spanelt).addClass("is-true");
        var column = dt.column( $(spanelt).attr('colidx') );
        column.visible( true );

        $(spanelt).on( 'click', function (e) {
            e.preventDefault();
            // Get the column API object
            var column = dt.column( $(this).attr('colidx') );
            // Toggle the visibility
            $(this).removeClass("is-"+column.visible());
            column.visible( ! column.visible() );
            $(this).addClass("is-"+column.visible());

        });
        var li = document.createElement("li");
        $(li).append($(spanelt));
        $("#colvis").append($(li));
    });

    $("#show-hide").show();

    // ADD SLIDEDOWN ANIMATION TO DROPDOWN //
    $('.dropdown').on('show.bs.dropdown', function(e){
        $(this).find('.dropdown-menu').first().stop(true, true).slideDown();
    });

    // ADD SLIDEUP ANIMATION TO DROPDOWN //
    $('.dropdown').on('hide.bs.dropdown', function(e){
        $(this).find('.dropdown-menu').first().stop(true, true).slideUp();
    });

    $('#dataTable tbody').on('mousedown', 'tr', function (event) {
        var investigateButton = (event.target.id.indexOf("investigate") >= 0
        || (event.target.children[0] && event.target.children[0].id.indexOf("investigate") >= 0)
        || (event.target.classList.contains("fa")));

        if(event.which === 1 && !investigateButton){
            if(event.ctrlKey){
                var classToFind = $(this).attr('id').split("_")[0] + "_" + $(this).attr('id').split("_")[1]
                if(!$(this).hasClass("row-selected")){
                    $.each($("."+classToFind), function(){
                        $(this).addClass("row-selected");
                    })
                }else{
                    $.each($("."+classToFind), function(){
                        $(this).removeClass("row-selected");
                    })
                }
            }else if(event.shiftKey){
                open_popup($(this).attr('id').split("_")[0], $(this).children()[0].textContent, parseInt($(this).attr('id').split("_")[1]));
            }else{
                if(!$(this).hasClass("row-selected")){
                    $(this).addClass("row-selected");
                }else{
                    $(this).removeClass("row-selected");
                }
            }
        }
    } );
    $("label > input").addClass("form-control").addClass("minor-text");
    $("label > input").attr("placeholder", "Search Results...");
    $(".loading").hide();
    $('#dataTable').show();
    $(".data_options").append($("#dataTable_filter"));

    $(".data_options").append($(".dt-buttons"));
    $(".dt-button").addClass("btn");
    $(".dt-button").addClass("btn-default");
    $("#core").css('display','block');
};