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
    this.allOrders.pageBookend = PAGE_MULTIPLE;

    this.itemCache = {};

    this.totalProgress = 0;
    this.itemIds = [];
    this.secondsToRefresh = 60;
    this.filtered = false;
    this.filterCount = 0;

    this.asyncChecker = null;
    this.asyncCalculator = null;
    this.asyncFilter = null
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
    var page;
    var regionId = parseInt(this.stationLocation.region);
    var stationId = parseInt(this.stationLocation.station);

    for(page = 1; page <= PAGE_MULTIPLE; page++){
        this.getOrders(regionId, stationId, page, this.allOrders, ALL_ORDER);
    }

    $("#selection").hide();
    this.asyncCheck();
};

/**
 * Asynchronous checking function that periodically checks all of the orders to ensure they are still running
 */
Station.prototype.asyncCheck = function() {
    var thiz = this;
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
Station.prototype.marketEndpointBuilder = function(region, page, orderType) {
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
Station.prototype.getWeightEndpointBuilder = function(itemId) {
    var url = ESI_ENDPOINT + "/latest/universe/types/" + itemId + "/" +
        "?datasource=tranquility" +
        "&language=en-us" +
        "&iteration=" + iteration;
    return url.replace(/\s/g, '');
};

/**
 * The builder for the volume endpoint
 *
 * @param itemId The item ID in question.
 * @returns {string} Returns a URL for the ESI EVE Volume History Endpoint.
 */
Station.prototype.getVolumeEndpointBuilder = function(itemId) {
    var url = ESI_ENDPOINT + "/latest/markets/" + this.stationLocation.region + "/history/" +
        "?datasource=tranquility" +
        "&type_id=" + itemId +
        "&language=en-us" +
        "&iteration=" + iteration;
    return url.replace(/\s/g, '');
};

/**
 * Calculates the progress using a logarithmic function
 *
 * @returns {number}
 */
Station.prototype.recalculateProgress = function() {
    var progressUpdate = this.getNumberOfCompletePages(this.allOrders);

    return progressUpdate === 0 ? 1 : progressUpdate;
};

/**
 * Helper function to increment order finding progress and paint it to the screen.
 *
 * @param composite The running buy or sell order list object.
 * @param page The page that is now completed.
 */
Station.prototype.incrementProgress = function(composite, page) {

    if(this.totalProgress !== 100) {
        this.totalProgress = 35.0 * Math.log10(this.recalculateProgress());
        this.totalProgress = this.totalProgress > 100 ? 100 : this.totalProgress;

        $(".loading").html("<b>Getting orders: " + this.totalProgress.toFixed(2) + "% complete</b>");
    }

    composite.completePages[page] = true;
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
Station.prototype.getOrders = function(region, station, page, composite, orderType) {
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
 * Checks all active order requests to verify whether they are complete or not
 *
 * @returns {boolean|*}
 */
Station.prototype.checkOrdersComplete = function() {
    var orderFull = (this.getNumberOfCompletePages(this.allOrders) === this.allOrders.pageBookend);
    var ordersComplete = this.allOrders.complete;

    return (orderFull && ordersComplete);
};

/**
 * If all the active orders are complete then it begins processing them
 */
Station.prototype.executeOrders = function() {
    if (this.checkOrdersComplete()) {

        clearInterval(this.asyncChecker);
        hideError();

        for(itemId in this.allOrders){
            if(itemId !== "completePages" && itemId !== "complete" && itemId !== "pageBookend")
                this.itemIds.push(itemId);
        }

        this.totalProgress = 100;
        $(".loading").text("Getting orders: " + this.totalProgress.toFixed(2) + "% complete");

        this.asyncCalculate();
    }
};

Station.prototype.clear = function() {
    this.stationLocation = null;

    this.allOrders = {};
    this.allOrders.completePages = [];
    this.allOrders.complete = false;
    this.allOrders.pageBookend = PAGE_MULTIPLE;

    this.itemCache = {};

    this.totalProgress = 0;
    this.itemIds = [];
    this.secondsToRefresh = 60;
    this.filtered = false;
    this.filterCount = 0;

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

/**
 * The function that asynchronously calculates trades.
 */
Station.prototype.asyncCalculate = function() {
    var thiz = this;
    this.asyncCalculator = setInterval(function(){
        while(thiz.itemIds.length != 0 && executingCount < 1500){
            executingCount++;
            var itemId = thiz.itemIds.splice(0, 1)[0];
            thiz.calculateNext(itemId);
        }

        if(thiz.itemIds.length == 0 && executingCount <= 0) {
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

    var profit_per_item = sellPrice-buyPrice;
    var margin = (sellPrice - buyPrice) / sellPrice;

    if(margin*100 >= threshold_margin_lower && margin*100 <= threshold_margin_upper && profit_per_item > 1000){
        row.buyPrice = buyPrice;
        row.sellPrice = sellPrice;
        row.itemId = itemId;
        this.getItemVolume(itemId, row);
    }else {
        executingCount--;
    }
};

Station.prototype.asyncFiltering = function() {
    var thiz = this;
    this.asyncFilter = setInterval(function(){
            thiz.filterCount += 1;
            var ellipses = "";
            for(var i = 0; i < ( thiz.filterCount % 5) ; i++){
                ellipses += ".";
            }

            $("#filtering-data").html("<b>Filtering Results. Please wait" + ellipses + "</b></br>If it takes too long try a smaller margin range.");

            if(executingCount == 0) {
                clearInterval(thiz.asyncFilter);
                $("#filtering-data").remove();
            }
        },
        1000);
};

Station.prototype.getItemVolume = function(itemId, row){
    if(!this.filtered){
        this.filtered = true;
        $("#buyingFooter").append("<div id='filtering-data'><b>Filtering Results. Please wait.</b></br>If it takes too long try a smaller margin range.</div>");
        this.asyncFiltering();
    }

    var url = this.getVolumeEndpointBuilder(itemId);
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
                if(row.volume >= volume_threshold){
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

Station.prototype.getItemWeight = function(itemId, row){

    if(this.itemCache[itemId]){
        row.itemName = this.itemCache[itemId].name;

        this.addRow(row);

        executingCount--;
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
                executingCount--;

                var name = weightData.name;

                thiz.itemCache[itemId] = {};
                thiz.itemCache[itemId].name = name;

                row.itemName = name;

                thiz.addRow(row);
            },
            error: function (request, error) {
                if(request.status != 404 && request.statusText !== "parsererror") {
                    thiz.getItemWeight(itemId, row);
                } else {
                    executingCount--;
                }
            }
        });
    }
};

Station.prototype.addRow = function(row) {

    var profitPerItem = row.sellPrice - row.buyPrice;
    var margin = (row.sellPrice - row.buyPrice) / row.sellPrice;
    margin = (margin.toFixed(3)*100).toFixed(1)+"%";

    if(!tableCreated) {
        this.createTable();
    }

    var row_data = [
        row.itemName,
        numberWithCommas(row.buyPrice.toFixed(2)),
        numberWithCommas(row.sellPrice.toFixed(2)),
        numberWithCommas(profitPerItem.toFixed(2)),
        margin,
        numberWithCommas(row.volume)
    ];

    $('#dataTable').dataTable().fnAddData(row_data);
};

Station.prototype.createTable = function() {
    tableCreated = true;

    $(".deal_note").hide();
    // sorting on margin index
    dt = $('#dataTable').DataTable({
        "order": [[ 5, "desc" ]],
        "lengthMenu": [[-1], ["All"]],
        responsive: true,
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf'
        ]
    });

    // for each column in header add a togglevis button in the div
    var li_counter = 0;
    $("#dataTable thead th").each( function ( i ) {
        var name = dt.column( i ).header();
        var spanelt = document.createElement( "button" );

        var initial_removed = [];
        // if($(document).width() < 768){
        //     initial_removed = ["Profit Per Item"];
        // }

        spanelt.innerHTML = name.innerHTML;

        $(spanelt).addClass("colvistoggle");
        $(spanelt).addClass("btn");
        $(spanelt).addClass("btn-default");
        $(spanelt).attr("colidx",i);    // store the column idx on the button

        $(spanelt).addClass("is-true");
        var column = dt.column( $(spanelt).attr('colidx') );
        column.visible( true );

        for(var i = 0; i < initial_removed.length; i++){
            if(spanelt.innerHTML === initial_removed[i]){
                $(spanelt).addClass("is-false");
                var column = dt.column( $(spanelt).attr('colidx') );
                column.visible( false );
                break;
            }
        }

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
        if(event.which === 1){
            if(!$(this).hasClass("row-selected")){
                $(this).addClass("row-selected");
            }else{
                $(this).removeClass("row-selected");
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

    $("#core input").css('display','block');
    $("#core a").css('display','inline-block');
    $("#core").css('display','block');
};