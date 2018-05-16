var thiz;

var BUY_ORDER = "buy";
var SELL_ORDER = "sell";
var ESI_ENDPOINT = "https://esi.evetech.net";

var PAGE_MULTIPLE = 50;

var customBuy = [];
var customSell = [];
var page = 1;

function getMarketData(data, stationId, orderType, itemId){
    var tempArray;
    if (typeof(data) == "string")  {
        tempArray = [data];
    } else if (data != null){
        tempArray = getBestMarketPrice(data, stationId, orderType, itemId)
    }

    var returningArray = [];
    if(tempArray){
        for(var i = 0; i < tempArray.length; i++){
            if(tempArray[i][0] > 0){
                returningArray.push(tempArray[i]);
            }
        }
    }
    return returningArray;
}

/**
 * Private helper method that will determine the best price for a given item from the
 * market data provided.
 *
 * @param orders The market data
 * @param stationId The station that this is for
 * @param orderType The orderType
 * @param itemId The itemId in question
 * @returns {Array} The best price
 */
function getBestMarketPrice(orders, stationId, orderType, itemId) {
    var bestPrice = [];

    // Pull all orders found and start iteration
    for (var orderIdx = 0; orderIdx < orders.length; orderIdx++) {
        var order = orders[orderIdx];

        var orderAlignsWithType = (order['is_buy_order'] && orderType === BUY_ORDER)
            || (!order['is_buy_order'] && orderType === SELL_ORDER);

        if (stationId == order['location_id']
            && order['min_volume'] === 1
            && orderAlignsWithType ){
            // This is the station market we want
            var price = order['price'];
            var volume = order['volume_remain'];
            bestPrice.push([price, volume]);
        }
    }


    /** Selling to Users at this price - ordered high to low **/
    if (orderType == SELL_ORDER){
        bestPrice = bestPrice.sort(sellOrderComparator);
        saveSellOrderData(stationId, itemId, $.extend(true, [], bestPrice));
        /** Buying from Users at this price - ordered low to high **/
    }else {
        bestPrice = bestPrice.sort(buyOrderComparator);
        saveBuyOrderData(stationId, itemId, $.extend(true, [], bestPrice));
    }

    return bestPrice;
}

function saveSellOrderData(stationId, itemId, data){
    if(!customBuy[stationId]){
        customBuy[stationId] = [];
    }
    customBuy[stationId][itemId] = data;
}

function saveBuyOrderData(stationId, itemId, data){
    if(!customSell[stationId]){
        customSell[stationId] = [];
    }
    customSell[stationId][itemId] = data;
}

function sellOrderComparator(a,b){
    var stationFlip = thiz.className() === "Route" ? 1 : -1;
    if (a[0] > b[0]) return -1 * stationFlip;
    if (a[0] < b[0]) return stationFlip;
    return 0;
}

function buyOrderComparator(a,b){
    var stationFlip = thiz.className() === "Route" ? 1 : -1;

    if (a[0] > b[0]) return stationFlip;
    if (a[0] < b[0]) return -1 * stationFlip;
    return 0;
}

/**
 * Comparing the buy order index
 */
function bestRowComparator(a,b){
    if (a[5] < b[5]) return 1;
    if (a[5] > b[5]) return -1;
    return 0;
}

function getStationName(stationId){
    var stationFound = "";
    $.each(endCoordinates, function(){
        if(stationFound.length == 0 && this.station == stationId) {
            stationFound = this.name;
        }
    });
    return stationFound;
}