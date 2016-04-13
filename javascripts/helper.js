var JUMPS = 25;
var SECOND_DELAY = 750;
// var start;
var length;
var created = false;
var dt;

var init_itemIds, init_station_buy, init_station_sell1, init_station_sell2, init_station_sell3, init_station_sell4;

function numberWithCommas(val) {
  while (/(\d+)(\d{3})/.test(val.toString())){
    val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
  }
  return val;
}

function getData(data, stationId, orderType, itemId){
    if (typeof(data) == "string")  {
        return data;
    }
    else if (data != null){
        return getPrice(data, stationId, orderType, itemId)
    }
}

function goAgain(){
    $(".more").val("Loading...");
    $(".more").prop('disabled', true);
    getRows(init_itemIds, init_station_buy, init_station_sell1, init_station_sell2, init_station_sell3, init_station_sell4);
}

function getRows(itemIds, station_buy, station_sell1, station_sell2, station_sell3, station_sell4){

    $("#selection").hide();
    //  start = new Date().getTime();
    var i;
    for(i = 0; i < itemIds.length && i < JUMPS; i++){
        var itemId = itemIds[i];
        getBuyPrice(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4);
        length = itemIds[i];
    }
    if(i >= itemIds.length){
        $(".more").val("No More Deals");
        $(".more").prop('disabled', true);
        itemIds = [];
    }
    itemIds = itemIds.splice(JUMPS, itemIds.length);
    init_itemIds = shuffle(itemIds); // shuffle after the initial search
    init_station_buy = station_buy;
    init_station_sell1 = station_sell1;
    init_station_sell2 = station_sell2;
    init_station_sell3 = station_sell3;
    init_station_sell4 = station_sell4;
}

function getBuyPrice(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4){
    var buyMarketUrl = "https://public-crest.eveonline.com/market/" + station_buy[0] + "/orders/sell/";
    var buyTypeUrl = "?type=https://public-crest.eveonline.com/types/" + itemId + "/";
    try{
        $.get(buyMarketUrl + buyTypeUrl, function(buyData) {
            var buyPrice = getData(buyData, station_buy[1], "sell", itemId);
            if(buyPrice[0] > 0){
                var itemName = buyData.items[0].type.name;
                getSellPrice1(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName);
            }else{
                if(itemId === length){
                    //  var end = new Date().getTime();
                    //  var time = end - start;
                    //  console.log('Execution time: ' + time);
                    window.setTimeout(goAgain(), SECOND_DELAY);
                }
            }
        });
    }catch (unknownError){
        getBuyPrice(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4);
    }

}

function getSellPrice1(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName){
    var sellMarketUrl_1 = "https://public-crest.eveonline.com/market/" + station_sell1[0] + "/orders/buy/";
    var sellTypeUrl_1 = "?type=https://public-crest.eveonline.com/types/" + itemId + "/";
    try{
        $.get(sellMarketUrl_1 + sellTypeUrl_1, function(sellData1) {
            var sellPrice1 = getData(sellData1, station_sell1[1], "buy", itemId);
            getSellPrice2(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName, sellPrice1);
        });
    }catch (unknownError){
        getSellPrice1(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName);
    }
}

function getSellPrice2(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName, sellPrice1){
    var sellMarketUrl_2 = "https://public-crest.eveonline.com/market/" + station_sell2[0] + "/orders/buy/";
    var sellTypeUrl_2 = "?type=https://public-crest.eveonline.com/types/" + itemId + "/";
    try{
        $.get(sellMarketUrl_2 + sellTypeUrl_2, function(sellData2) {
            var sellPrice2 = getData(sellData2, station_sell2[1], "buy", itemId);
            getSellPrice3(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName, sellPrice1, sellPrice2);
        });
    }catch (unknownError){
        getSellPrice2(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName, sellPrice1);
    }
}

function getSellPrice3(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName, sellPrice1, sellPrice2){
    var sellMarketUrl_3 = "https://public-crest.eveonline.com/market/" + station_sell3[0] + "/orders/buy/";
    var sellTypeUrl_3 = "?type=https://public-crest.eveonline.com/types/" + itemId + "/";
    try{
        $.get(sellMarketUrl_3 + sellTypeUrl_3, function(sellData3) {
            var sellPrice3 = getData(sellData3, station_sell3[1], "buy", itemId);
            getSellPrice4(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName, sellPrice1, sellPrice2, sellPrice3);
        });
    }catch (unknownError){
        getSellPrice3(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName, sellPrice1, sellPrice2);
    }
}

function getSellPrice4(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName, sellPrice1, sellPrice2, sellPrice3){
    var sellMarketUrl_4 = "https://public-crest.eveonline.com/market/" + station_sell4[0] + "/orders/buy/";
    var sellTypeUrl_4 = "?type=https://public-crest.eveonline.com/types/" + itemId + "/";
    try{
        $.get(sellMarketUrl_4 + sellTypeUrl_4, function(sellData4) {
            var sellPrice4 = getData(sellData4, station_sell4[1], "buy", itemId);
            getItemName(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName, sellPrice1, sellPrice2, sellPrice3, sellPrice4);
        });
    }catch (unknownError){
        getSellPrice4(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName, sellPrice1, sellPrice2, sellPrice3);
    }
}

function getItemName(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, itemName, sellPrice1, sellPrice2, sellPrice3, sellPrice4){

    var buyVolume = buyPrice[1];
    buyPrice = buyPrice[0];
    var sellVolume1 = sellPrice1[1];
    sellPrice1 = sellPrice1[0];
    var sellVolume2 = sellPrice2[1];
    sellPrice2 = sellPrice2[0];
    var sellVolume3 = sellPrice3[1];
    sellPrice3 = sellPrice3[0];
    var sellVolume4 = sellPrice4[1];
    sellPrice4 = sellPrice4[0];

    if(buyPrice < sellPrice1 && sellPrice1 > 0){
        var itemProfit = sellPrice1 - buyPrice;
        var profit;
        var buyCost;
        var volume;
        if(buyVolume >= sellVolume1){
            volume = sellVolume1;
            profit = sellVolume1 * itemProfit;
            buyCost = buyPrice * sellVolume1;
        }else{
            volume = buyVolume;
            profit = buyVolume * itemProfit;
            buyCost = buyPrice * buyVolume;
        }
        var location = getLocation(station_sell1[0]);
        var iskRatio = (sellPrice1-buyPrice)/buyPrice;
        addRow(itemId, itemName, buyPrice, volume, buyCost, location, profit, iskRatio, sellPrice1, itemProfit)
    }

    if(buyPrice < sellPrice2 && sellPrice2 > 0){
        var itemProfit = sellPrice2 - buyPrice;
        var profit;
        var buyCost;
        var volume;
        if(buyVolume >= sellVolume2){
            volume = sellVolume2;
            profit = sellVolume2 * itemProfit;
            buyCost = buyPrice * sellVolume2;
        }else{
            volume = buyVolume;
            profit = buyVolume * itemProfit;
            buyCost = buyPrice * buyVolume;
        }
        var location = getLocation(station_sell2[0]);
        var iskRatio = (sellPrice2-buyPrice)/buyPrice;
        addRow(itemId, itemName, buyPrice, volume, buyCost, location, profit, iskRatio, sellPrice2, itemProfit)
    }

    if(buyPrice < sellPrice3 && sellPrice3 > 0){
        var itemProfit = sellPrice3 - buyPrice;
        var profit;
        var buyCost;
        var volume;
        if(buyVolume >= sellVolume3){
            volume = sellVolume3;
            profit = sellVolume3 * itemProfit;
            buyCost = buyPrice * sellVolume3;
        }else{
            volume = buyVolume;
            profit = buyVolume * itemProfit;
            buyCost = buyPrice * buyVolume;
        }
        var location = getLocation(station_sell3[0]);
        var iskRatio = (sellPrice3-buyPrice)/buyPrice;
        addRow(itemId, itemName, buyPrice, volume, buyCost, location, profit, iskRatio, sellPrice3, itemProfit)
    }

    if(buyPrice < sellPrice4 && sellPrice4 > 0){
        var itemProfit = sellPrice4 - buyPrice;
        var profit;
        var buyCost;
        var volume;
        if(buyVolume >= sellVolume4){
            volume = sellVolume4;
            profit = sellVolume4 * itemProfit;
            buyCost = buyPrice * sellVolume4;
        }else{
            volume = buyVolume;
            profit = buyVolume * itemProfit;
            buyCost = buyPrice * buyVolume;
        }
        var location = getLocation(station_sell4[0]);
        var iskRatio = (sellPrice4-buyPrice)/buyPrice;
        addRow(itemId, itemName, buyPrice, volume, buyCost, location, profit, iskRatio, sellPrice4, itemProfit)
    }

    if(itemId === length){
        // var end = new Date().getTime();
        // var time = end - start;
        // console.log('Execution time: ' + time);
        window.setTimeout(goAgain(), SECOND_DELAY);
    }
}

function getLocation(location){
    return (location === JITA[0] ? "Jita" : location === AMARR[0] ? "Amarr" : location === DODIXIE[0] ? "Dodixie" : location === RENS[0] ? "Rens" : "Hek");
}

function addRow(itemId, itemName, buyPrice, buyVolume, buyCost, location, profit, iskRatio, sellPrice, itemProfit){
    if(!created){
        created = true;
        dt = $('#dataTable').DataTable({
            "order": [[ 6, "desc" ]],
            columnDefs: [
                {
                    targets: [6],//when sorting age column
                    orderData: [6,5] //sort by age then by salary
                },
                {
                    targets: [6],//when sorting age column
                    orderData: [6,4] //sort by age then by salary
                }
            ],
            "lengthMenu": [[-1], ["All"]]
        });
        $('#dataTable tbody').on('click', 'tr', function () {
            if(!$(this).hasClass("row-selected")){
                $(this).addClass("row-selected");
                var id = $(this).attr("id").split("-");
                var clickedItem = $(this).children()[0];
                clickedItem.textContent = clickedItem.textContent + " (updating)";
                getBuyPrice(id[0], init_station_buy, init_station_sell1, init_station_sell2, init_station_sell3, init_station_sell4);
            }else{
                $(this).removeClass("row-selected");
            }
        } );
        $(".more").show();
        $(".dataTables_length").remove();
        $(".dataTables_paginate").remove();
        $(".dataTables_filter > label").css("color", "white");
        $("label > input").addClass("form-control").addClass("minor-text");
        $("label > input").attr("placeholder", "Search Results...").css("width", "300px");
        $(".dataTables_info").css("width", "100%");
        $('#dataTable').show();
    }

    var id = itemId + "-" + location;
    var row_data = [
        itemName,
        numberWithCommas(buyPrice.toFixed(2)),
        numberWithCommas(buyVolume.toFixed()),
        numberWithCommas(buyCost.toFixed(2)),
        location,
        numberWithCommas(profit.toFixed(2)),
        (iskRatio.toFixed(3)*100).toFixed(1)+"%",
        numberWithCommas(sellPrice.toFixed(2)),
        numberWithCommas(itemProfit.toFixed(2))
    ];

    if(document.getElementById(id)){
        var row = $("#" + id);
        var counter = 0;
        $.each(row.children(), function(){
            $(this).text(row_data[counter]);
            counter++;
        })
    }else{
        var rowIndex = $('#dataTable').dataTable().fnAddData(row_data);
        var row = $('#dataTable').dataTable().fnGetNodes(rowIndex);
        $(row).attr('id', id);
    }
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
    var bestPrice = 0;
    var bestVolume = 0;

    // Pull all orders found and start iteration
    var orders = jsonMarket['items'];
    for (var orderIndex = 0; orderIndex < orders.length; orderIndex++)
    {
        var order = orders[orderIndex];
        if (stationId == order['location']['id'])
        {
            // This is the station market we want
            var price = order['price'];
            var volume = order['volume'];

            if (bestPrice > 0)
            {
                // We have a price from a previous iteration
                if (orderType == "sell" && price < bestPrice)
                {
                    bestPrice = price;
                    bestVolume = volume;
                }
                else if (orderType == "buy" && price > bestPrice)
                {
                    bestPrice = price;
                    bestVolume = volume;
                }
            }
            else
            {
                // This is the first price found, take it
                bestPrice = price;
                bestVolume = volume;
            }
        }
    }
    return [bestPrice, bestVolume];
}
