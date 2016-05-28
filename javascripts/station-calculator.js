var MARGIN_INDEX = 4;

function beginStation(s_buy){
    station_buy = s_buy;

    getRowsStation();
}

function getRowsStation(){
    $("#selection").hide();
    var i;
    for(i = 0; i < itemIds.length && i < JUMPS; i++){
        var itemId = itemIds[i];
        getBuyStationPrice(itemId, false);
        length = itemIds[i];
    }
    if(i >= itemIds.length){
        $('#stop').val('Finished');
        $('#stop').prop('disabled', true);
        itemIds = [];
    }
    itemIds = itemIds.splice(JUMPS, itemIds.length);
}



function getSingleData(data, stationId, orderType, itemId){
    if (typeof(data) == "string")  {
        return data;
    }
    else if (data != null){
        return getBestSinglePrice(data, stationId, orderType, itemId)
    }
}

function getBuyStationPrice(itemId, isUpdate){
    var buyMarketUrl = ENDPOINT + "/market/" + station_buy[0] + "/orders/buy/";
    var buyTypeUrl = "?type=" + ENDPOINT + "/types/" + itemId + "/";
    try{
        $.ajax({
            type: "get",
            url: buyMarketUrl + buyTypeUrl,
            success: function(buyData) {
                var buyPrice = getSingleData(buyData, station_buy[1], "buy", itemId);
                if(buyPrice != -1){
                    var itemName = buyData.items[0].type.name;
                    getSellStationPrice(itemId, buyPrice, itemName, isUpdate);
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
        getBuyStationPrice(itemId, isUpdate);
    }

}

function getSellStationPrice(itemId, buyPrice, itemName, isUpdate){
    var sellMarketUrl = ENDPOINT + "/market/" + station_buy[0] + "/orders/sell/";
    var sellTypeUrl = "?type=" + ENDPOINT + "/types/" + itemId + "/";
    try{
        $.ajax({
            type: "get",
            url: sellMarketUrl + sellTypeUrl,
            success: function(sellData) {
                var sellPrice = getSingleData(sellData, station_buy[1], "sell", itemId);
                if(sellPrice != -1){
                    addMarginRow(itemId, itemName, sellPrice, buyPrice)
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
        getSellStationPrice(itemId, buyPrice, itemName, isUpdate);
    }
}

function addMarginRow(itemId, itemName, sellPrice, buyPrice){

    var profit_per_item = sellPrice-buyPrice;
    var margin = (sellPrice - buyPrice) / sellPrice;

    if(margin*100 >= threshold_lower && margin*100 <= threshold_upper){

        if(!created){
            created = true;
            dt = $('#dataTable').DataTable({
                "order": [[ MARGIN_INDEX, "desc" ]],
                "lengthMenu": [[-1], ["All"]]
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
        }

        var row_data = [
            itemName,
            numberWithCommas(buyPrice.toFixed(2)),
            numberWithCommas(sellPrice.toFixed(2)),
            numberWithCommas(profit_per_item.toFixed(2)),
            (margin.toFixed(3)*100).toFixed(1)+"%"
        ];

        var rowIndex = $('#dataTable').dataTable().fnAddData(row_data);
    }

    if(itemId === length){
        window.setTimeout(goAgain(), SECOND_DELAY);
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
function getBestSinglePrice(jsonMarket, stationId, orderType, itemId)
{
    var bestPrice = -1;

    // Pull all orders found and start iteration
    var orders = jsonMarket['items'];
    for (var orderIndex = 0; orderIndex < orders.length; orderIndex++)
    {
        var order = orders[orderIndex];
        if (stationId == order['location']['id']){

            if(bestPrice == -1){
                bestPrice = order['price'];
                /** Selling to Users at this price - ordered high to low **/
            }else if (orderType == "sell"){
                if(bestPrice > order['price']){
                    bestPrice = order['price'];
                }
                /** Buying from Users at this price - ordered low to high **/
            }else{
                if(bestPrice < order['price']){
                    bestPrice = order['price'];
                }
            }
        }
    }

    return bestPrice;
}
