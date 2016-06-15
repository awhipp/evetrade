var JUMPS = 75;
var SECOND_DELAY = 900;
var PROFIT_INDEX = 6;
var UPDATING_TIMEOUT = 25000;
var UPDATING_CHECK = [];
var length;
var created = false;
var dt;

var station_buy, station_sell1, station_sell2, station_sell3, station_sell4;

function numberWithCommas(val) {
    while (/(\d+)(\d{3})/.test(val.toString())){
        val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}

function getData(data, stationId, orderType, itemId){
    if (typeof(data) == "string")  {
        return [data];
    }
    else if (data != null){
        return getPrice(data, stationId, orderType, itemId)
    }
}

function goAgain(){
    if(routeTrading){
        getRowsRoute();
    }else{
        getRowsStation();
    }
}

function beginRoute(s_buy, s_sell1, s_sell2, s_sell3, s_sell4){
    station_buy = s_buy;
    station_sell1 = s_sell1;
    station_sell2 = s_sell2;
    station_sell3 = s_sell3;
    station_sell4 = s_sell4;

    getRowsRoute();
}

function getRowsRoute(){
    $("#selection").hide();
    var i;
    for(i = 0; i < itemIds.length && i < JUMPS; i++){
        var itemId = itemIds[i];
        getBuyPrice(itemId, false);
        length = itemIds[i];
    }
    if(i >= itemIds.length){
        $('#stop').val('Finished');
        $('#stop').prop('disabled', true);
        itemIds = [];
    }
    itemIds = itemIds.splice(JUMPS, itemIds.length);
}

function getBuyPrice(itemId, isUpdate){
    var buyMarketUrl = ENDPOINT + "/market/" + station_buy[0] + "/orders/sell/";
    var buyTypeUrl = "?type=" + ENDPOINT + "/inventory/types/" + itemId + "/";
    try{
        $.ajax({
            type: "get",
            url: buyMarketUrl + buyTypeUrl,
            success: function(buyData) {
                var buyPrice = getData(buyData, station_buy[1], "sell", itemId);
                if(buyPrice.length > 0 && (buyPrice[0][0] > 0 || buyPrice[1][0] > 0 || buyPrice[2][0] > 0)){
                    var itemName = buyData.items[0].type.name;
                    getSellPrice1(itemId, buyPrice, itemName, isUpdate);
                }else{
                    if(itemId === length){
                        window.setTimeout(goAgain(), SECOND_DELAY);
                    }
                }
            },
            error: function (request, error) {
                unreachable();
            }
        });
    }catch (unknownError){
        getBuyPrice(itemId, isUpdate);
    }

}

function getSellPrice1(itemId, buyPrice, itemName, isUpdate){
    if(station_sell1[0] !== -1){
        var sellMarketUrl_1 = ENDPOINT + "/market/" + station_sell1[0] + "/orders/buy/";
        var sellTypeUrl_1 = "?type=" + ENDPOINT + "/inventory/types/" + itemId + "/";
        try{
            $.ajax({
                type: "get",
                url: sellMarketUrl_1 + sellTypeUrl_1,
                success: function(sellData1) {
                    var sellPrice1 = getData(sellData1, station_sell1[1], "buy", itemId);
                    getSellPrice2(itemId, buyPrice, itemName, sellPrice1, isUpdate);
                },
                error: function (request, error) {
                    unreachable();
                }
            });
        }catch (unknownError){
            getSellPrice1(itemId, buyPrice, itemName, isUpdate);
        }
    }else{
        getSellPrice2(itemId, buyPrice, itemName, -1, isUpdate);
    }
}

function getSellPrice2(itemId, buyPrice, itemName, sellPrice1, isUpdate){
    if(station_sell2[0] !== -1){
        var sellMarketUrl_2 = ENDPOINT + "/market/" + station_sell2[0] + "/orders/buy/";
        var sellTypeUrl_2 = "?type=" + ENDPOINT + "/inventory/types/" + itemId + "/";
        try{
            $.ajax({
                type: "get",
                url: sellMarketUrl_2 + sellTypeUrl_2,
                success: function(sellData2) {
                    var sellPrice2 = getData(sellData2, station_sell2[1], "buy", itemId);
                    getSellPrice3(itemId, buyPrice, itemName, sellPrice1, sellPrice2, isUpdate);
                },
                error: function (request, error) {
                    unreachable();
                }
            });
        }catch (unknownError){
            getSellPrice2(itemId, buyPrice, itemName, sellPrice1, isUpdate);
        }
    }else{
        getSellPrice3(itemId, buyPrice, itemName, sellPrice1, -1, isUpdate);
    }
}

function getSellPrice3(itemId, buyPrice, itemName, sellPrice1, sellPrice2, isUpdate){
    if(station_sell3[0] !== -1){
        var sellMarketUrl_3 = ENDPOINT + "/market/" + station_sell3[0] + "/orders/buy/";
        var sellTypeUrl_3 = "?type=" + ENDPOINT + "/inventory/types/" + itemId + "/";
        try{
            $.ajax({
                type: "get",
                url: sellMarketUrl_3 + sellTypeUrl_3,
                success: function(sellData3) {
                    var sellPrice3 = getData(sellData3, station_sell3[1], "buy", itemId);
                    getSellPrice4(itemId, buyPrice, itemName, sellPrice1, sellPrice2, sellPrice3, isUpdate);
                },
                error: function (request, error) {
                    unreachable();
                }
            });
        }catch (unknownError){
            getSellPrice3(itemId, buyPrice, itemName, sellPrice1, sellPrice2, isUpdate);
        }
    }else{
        getSellPrice4(itemId,buyPrice, itemName, sellPrice1, sellPrice2, -1, isUpdate);
    }
}

function getSellPrice4(itemId, buyPrice, itemName, sellPrice1, sellPrice2, sellPrice3, isUpdate){
    if(station_sell4[0] !== -1){
        var sellMarketUrl_4 = ENDPOINT + "/market/" + station_sell4[0] + "/orders/buy/";
        var sellTypeUrl_4 = "?type=" + ENDPOINT + "/inventory/types/" + itemId + "/";
        try{
            $.ajax({
                type: "get",
                url: sellMarketUrl_4 + sellTypeUrl_4,
                success: function(sellData4) {
                    var sellPrice4 = getData(sellData4, station_sell4[1], "buy", itemId);
                    getItemName(itemId, buyPrice, itemName, sellPrice1, sellPrice2, sellPrice3, sellPrice4, isUpdate);
                },
                error: function (request, error) {
                    unreachable();
                }
            });
        }catch (unknownError){
            getSellPrice4(itemId, buyPrice, itemName, sellPrice1, sellPrice2, sellPrice3, isUpdate);
        }
    }else{
        getItemName(itemId, buyPrice, itemName, sellPrice1, sellPrice2, sellPrice3, -1, isUpdate);
    }
}

function rowComparator(a,b){
    if (a[PROFIT_INDEX] < b[PROFIT_INDEX]) return 1;
    if (a[PROFIT_INDEX] > b[PROFIT_INDEX]) return -1;
    return 0;
}

function getItemName(itemId, buyPrice, itemName, sellPrice1, sellPrice2, sellPrice3, sellPrice4, isUpdate){
    var rows = [];

    for(var i = 0; i < buyPrice.length; i++){
        for(var j = 0; j < sellPrice1.length; j++){
            var row = calculateRow(itemId, itemName, buyPrice[i][0], buyPrice[i][1], sellPrice1[j][0], sellPrice1[j][1], station_sell1, isUpdate);
            if(row.length > 0){
                rows.push(row);
            }
        }
    }

    for(var i = 0; i < buyPrice.length; i++){
        for(var j = 0; j < sellPrice2.length; j++){
            var row = calculateRow(itemId, itemName, buyPrice[i][0], buyPrice[i][1], sellPrice2[j][0], sellPrice2[j][1], station_sell2, isUpdate);
            if(row.length > 0){
                rows.push(row);
            }
        }
    }

    for(var i = 0; i < buyPrice.length; i++){
        for(var j = 0; j < sellPrice3.length; j++){
            var row = calculateRow(itemId, itemName, buyPrice[i][0], buyPrice[i][1], sellPrice3[j][0], sellPrice3[j][1], station_sell3, isUpdate);
            if(row.length > 0){
                rows.push(row);
            }
        }
    }

    for(var i = 0; i < buyPrice.length; i++){
        for(var j = 0; j < sellPrice4.length; j++){
            var row = calculateRow(itemId, itemName, buyPrice[i][0], buyPrice[i][1], sellPrice4[j][0], sellPrice4[j][1], station_sell4, isUpdate);
            if(row.length > 0){
                rows.push(row);
            }
        }
    }

    rows = rows.sort(rowComparator);
    for(var i = 0; i < rows.length && i < NUMBER_RETURNED; i++){
        addRow(rows[i][0],rows[i][1],rows[i][2],rows[i][3],rows[i][4],rows[i][5],rows[i][6],rows[i][7],rows[i][8],rows[i][9],rows[i][10]);
    }

    if(itemId === length){
        window.setTimeout(goAgain(), SECOND_DELAY);
    }
}

function calculateRow(itemId, itemName,  b_price, b_volume, s_price, s_volume, station, isUpdate){
    if(b_price < s_price && s_price > 0){
        var itemProfit = s_price - b_price;
        var profit;
        var buyCost;
        var volume;
        if(b_volume >= s_volume){
            volume = numberWithCommas(b_volume.toFixed()) + "-<span class='selected_volume'>" + numberWithCommas(s_volume.toFixed()) + "</span>";
            profit = s_volume * itemProfit;
            buyCost = b_price * s_volume;
        }else{
            volume = "<span class='selected_volume'>" + numberWithCommas(b_volume.toFixed()) + "</span>-" + numberWithCommas(s_volume.toFixed());
            profit = b_volume * itemProfit;
            buyCost = b_price * b_volume;
        }
        var location = getLocation(station[0]);
        var iskRatio = (s_price-b_price)/b_price;
        return [itemId, itemName, b_price, volume, buyCost, location, profit, iskRatio, s_price, itemProfit, isUpdate];
    }
    return [];
}

function getLocation(location){
    return (location === JITA[0] ? "Jita" : location === AMARR[0] ? "Amarr" : location === DODIXIE[0] ? "Dodixie" : location === RENS[0] ? "Rens" : "Hek");
}

function checkRow(row_id){
    var next = UPDATING_CHECK[UPDATING_CHECK.length-1];
    if($("#"+next).hasClass("updating")){
        $("#"+next).remove();
    }
}

function addRow(itemId, itemName, buyPrice, buyVolume, buyCost, location, profit, iskRatio, sellPrice, itemProfit, isUpdate){
    var id = itemId + "-" + location;

    if(!created){
        created = true;
        dt = $('#dataTable').DataTable({
            "order": [[ PROFIT_INDEX, "desc" ]],
            "lengthMenu": [[-1], ["All"]]
        });

        // for each column in header add a togglevis button in the div
        var li_counter = 0;
        $("#dataTable thead th").each( function ( i ) {
            var name = dt.column( i ).header();
            var spanelt = document.createElement( "button" );
            var initial_removed = [];
            if($(document).width() < 768){
                initial_removed = ["Total Cost", "R.O.I.", "Sell Price", "Profit Per Item"];
            }
            spanelt.innerHTML = name.innerHTML;

            $(spanelt).addClass("colvistoggle");
            $(spanelt).addClass("btn");
            $(spanelt).addClass("btn-default");
            $(spanelt).attr("colidx",i);		// store the column idx on the button

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
                if(event.ctrlKey){
                    var classToFind = $(this).attr('id').split("-")[0] + "-" + $(this).attr('id').split("-")[1];
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
                    open_popup($(this).attr('id').split("-")[0], $(this).children()[0].textContent,$(this).attr('id').split("-")[1]);
                }else{
                    if(!$(this).hasClass("row-selected")){
                        $(this).addClass("row-selected");
                    }else{
                        $(this).removeClass("row-selected");
                    }
                }
            }else if(event.which === 3){
                var classToFind = $(this).attr('id').split("-")[0] + "-" + $(this).attr('id').split("-")[1];
                if(document.getElementsByClassName(id)){
                    var row = $("." + classToFind);
                    $.each(row, function(){
                        $(this).addClass("updating");
                        window.setTimeout(function(){ UPDATING_CHECK.push($(this).attr('id')); checkRow(); }, UPDATING_TIMEOUT);
                    });
                }

                getBuyPrice($(this).attr('id').split("-")[0], true);
            }
        } );
        $("label > input").addClass("form-control").addClass("minor-text");
        $("label > input").attr("placeholder", "Search Results...");
        $(".loading").hide();
        $('#dataTable').show();
    }

    var row_data = [
        itemName,
        numberWithCommas(buyPrice.toFixed(2)),
        numberWithCommas(buyCost.toFixed(2)),
        buyVolume.split("-")[0],
        location,
        buyVolume.split("-")[1],
        numberWithCommas(profit.toFixed(2)),
        (iskRatio.toFixed(3)*100).toFixed(1)+"%",
        numberWithCommas(sellPrice.toFixed(2)),
        numberWithCommas(itemProfit.toFixed(2))
    ];

    if(isUpdate && document.getElementsByClassName(id).length > 0){
        var row = $("." + id);
        var found = false;
        $.each(row, function(){
            if(!found && $(this).hasClass("updating")){
                found = true;
                var counter = 0;
                $.each($(this).children(), function(){
                    $(this).html(row_data[counter]);
                    counter++;

                });
                $(this).removeClass("updating");
            }
        });
    }else{
        var rowIndex = $('#dataTable').dataTable().fnAddData(row_data);
        var row = $('#dataTable').dataTable().fnGetNodes(rowIndex);
        $(row).attr('id', id + "-" + $("." + id).length);
        $(row).addClass(id);
    }
}

function buyComparator(a,b){
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    return 0;
}

function sellComparator(a,b){
    if (a[0] < b[0]) return 1;
    if (a[0] > b[0]) return -1;
    return 0;
}

/**
* Private helper method that will determine the best price for a given item from the
* market data provided.
*
* @param {jsonMarket} jsonMarket the market data in JSON format
* @param {stationId} stationId the station ID to focus the search on
* @param {orderType} orderType the type of order is either "sell" or "buy"
* @param {itemId} the item id being bought/sold
*/
function getPrice(jsonMarket, stationId, orderType, itemId)
{
    var bestPrice = [];
    var bestVolume = [];

    // Pull all orders found and start iteration
    var orders = jsonMarket['items'];
    for (var orderIndex = 0; orderIndex < orders.length; orderIndex++)
    {
        var order = orders[orderIndex];
        if (stationId == order['location']['id']){
            // This is the station market we want
            var price = order['price'];
            var volume = order['volume'];
            bestPrice.push([price, volume]);
        }
    }

    /** Selling to Users at this price - ordered high to low **/
    if (orderType == "sell"){
        saveBuyData(stationId, itemId, $.extend(true, [], bestPrice));
        bestPrice = bestPrice.sort(buyComparator);
        if(bestPrice.length > NUMBER_RETURNED-1){
            return bestPrice.splice(0,NUMBER_RETURNED);
        }else{
            return bestPrice;
        }
        /** Buying from Users at this price - ordered low to high **/
    }else{
        saveSellData(stationId, itemId, $.extend(true, [], bestPrice))
        bestPrice = bestPrice.sort(sellComparator);
        if(bestPrice.length > NUMBER_RETURNED-1){
            return bestPrice.splice(0,NUMBER_RETURNED);
        }else{
            return bestPrice;
        }
    }
}

function saveBuyData(stationId, itemId, data){
    if (stationId == JITA[1]) {
        jitaBuy[itemId] = data;
    }else if(stationId == AMARR[1]){
        amarrBuy[itemId] = data;
    }else if(stationId == RENS[1]){
        rensBuy[itemId] = data;
    }else if(stationId == DODIXIE[1]){
        dodixieBuy[itemId] = data;
    }else if(stationId == HEK[1]){
        hekBuy[itemId] = data;
    }
}

function saveSellData(stationId, itemId, data){
    if (stationId == JITA[1]) {
        jitaSell[itemId] = data;
    }else if(stationId == AMARR[1]){
        amarrSell[itemId] = data;
    }else if(stationId == RENS[1]){
        rensSell[itemId] = data;
    }else if(stationId == DODIXIE[1]){
        dodixieSell[itemId] = data;
    }else if(stationId == HEK[1]){
        hekSell[itemId] = data;
    }
}
