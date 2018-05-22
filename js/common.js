var BUY_ORDER = "buy";
var SELL_ORDER = "sell";
var ALL_ORDER = "all";
var ESI_ENDPOINT = "https://esi.evetech.net";

var PAGE_MULTIPLE = 50;

var tableCreated = false;
var createdRefresher = false;
var totalProgress = 0;
var executingCount = 0;
var customBuy = {};
var customSell = {};
var itemCache = {};
var page = 1;
var iteration = 1;
var rowAdded = false;

function getMarketData(data, stationId, orderType, itemId, isRoute){
    var tempArray;
    if (typeof(data) == "string")  {
        tempArray = [data];
    } else if (data != null){
        tempArray = getBestMarketPrice(data, stationId, orderType, itemId, isRoute)
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
function getBestMarketPrice(orders, stationId, orderType, itemId, isRoute) {
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
        var sellOrderComparator = isRoute ? sellOrderComparatorRoute : sellOrderComparatorStation;
        bestPrice = bestPrice.sort(sellOrderComparator);
        saveSellOrderData(stationId, itemId, $.extend(true, [], bestPrice));
        /** Buying from Users at this price - ordered low to high **/
    } else {
        var buyOrderComparator = isRoute ? buyOrderComparatorRoute : buyOrderComparatorStation;
        bestPrice = bestPrice.sort(buyOrderComparator);
        saveBuyOrderData(stationId, itemId, $.extend(true, [], bestPrice));
    }

    return bestPrice;
}

function saveSellOrderData(stationId, itemId, data){
    if(data && data.length > 0) {
        if (!customBuy[stationId]) {
            customBuy[stationId] = [];
        }

        if (!customBuy[stationId][itemId] && data.length > 0) {
            customBuy[stationId][itemId] = data;
        }
    }
}

function saveBuyOrderData(stationId, itemId, data){

    if(data && data.length > 0) {
        if(!customSell[stationId]){
            customSell[stationId] = [];
        }

        if(!customSell[stationId][itemId] && data.length > 0) {
            customSell[stationId][itemId] = data;
        }

    }
}

function sellOrderComparatorRoute(a,b){
    if (a[0] > b[0]) return -1;
    if (a[0] < b[0]) return 1;
    return 0;
}

function buyOrderComparatorRoute(a,b){
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    return 0;
}

function sellOrderComparatorStation(a,b){
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    return 0;
}

function buyOrderComparatorStation(a,b){
    if (a[0] > b[0]) return -1;
    if (a[0] < b[0]) return 1;
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

function numberWithCommas(val) {
    while (/(\d+)(\d{3})/.test(val.toString())){
        val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}

function getTotalProgress() {
    var progressUpdate = 0;
    var allComplete = true;

    for (var i = 0; i < routes.length; i++) {
        allComplete = (allComplete && routes[i].completed);

        var routeProgress = routes[i].recalculateProgress();
        progressUpdate += routeProgress / routes.length;
    }

    if(allComplete) {
        totalProgress = 100;
    } else {
        totalProgress = progressUpdate > 100 ? 100 : progressUpdate;
    }

    $(".loading").html("Fetching orders: " + totalProgress.toFixed(2) + "% complete");
}

function refresh() {
    $('#noselect-object').html('<table id="dataTable" class="display"></table>');
    $(".dataTables_filter").remove();
    $(".dt-buttons").remove();
    $("#refresh-button").remove();
    iteration += 1;
    for (var i = 0; i < routes.length; i++) {
        routes[i].clear();
    }

    customBuy = [];
    customSell = [];
    startCoordinates = [];
    endCoordinates = [];
    startLocation = "";
    addedToStartList = [];
    addedToEndList = [];
    endLocations = [];
    page = 1;
    totalProgress = 0;
    createdRefresher = false;
    tableCreated = false;
    routes=[];

    init();
}

var spamItems = ["ahremen's", "brokara's", "brynn's",
    "chelm's", "cormack's", "draclira's", "estamel's",
    "gotan's", "hakim's", "kaikka's", "mizuro's", "raysere's",
    "selynne's", "setele's", "shaqil's", "tairei's", "thon's", "tuvan's",
    "vizen's", "zor's"
];

function isSpamItem(name) {
    for(var i = 0; i < spamItems.length; i++) {
        if(name.toLowerCase().indexOf(spamItems[i]) >= 0) {
            return true;
        }
    }
    return false;
}