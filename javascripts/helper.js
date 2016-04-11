var JUMPS = 25;
// var start;
var length;
var lastIndex = 0;
var toIndex = JUMPS;
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
  init_itemIds = itemIds;
  init_station_buy = station_buy;
  init_station_sell1 = station_sell1;
  init_station_sell2 = station_sell2;
  init_station_sell3 = station_sell3;
  init_station_sell4 = station_sell4;

  $("#selection").hide();
  //  start = new Date().getTime();
  var i;
  for(i = lastIndex; i < itemIds.length && i < lastIndex + JUMPS; i++){
    var itemId = itemIds[i];
    getBuyPrice(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4);
    length = itemIds[i];
  }
  if(lastIndex >= itemIds.length){
    $(".more").val("No more deals found");
    $(".more").prop('disabled', true);
  }
  lastIndex = i;
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
          if($('tr').length-1 < toIndex){
            getRows(init_itemIds, init_station_buy, init_station_sell1, init_station_sell2, init_station_sell3, init_station_sell4);
          }else{
            toIndex += JUMPS;
          }
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
  if(buyPrice < sellPrice1 || buyPrice < sellPrice2 || buyPrice < sellPrice3 || buyPrice < sellPrice4){
    var itemprofit = -1;
    var final_sell = -1;
    var final_volume = -1;
    var iskRatio = -1;
    var index = 0;
    if(sellPrice1 > 0){
      var gain = sellPrice1 - buyPrice;
      if(gain > itemprofit){
        itemprofit = gain;
        final_sell = sellPrice1;
        final_volume = sellVolume1;
        index = station_sell1[0];
      }
    }else{
      sellPrice1 = "-";
    }
    if(sellPrice2 > 0){
      var gain = sellPrice2 - buyPrice;
      if(gain > itemprofit){
        itemprofit = gain;
        final_sell = sellPrice2;
        final_volume = sellVolume2;
        index = station_sell2[0];
      }
    }else{
      sellPrice2 = "-";
    }
    if(sellPrice3 > 0){
      var gain = sellPrice3 - buyPrice;
      if(gain > itemprofit){
        itemprofit = gain;
        final_sell = sellPrice3;
        final_volume = sellVolume3;
        index = station_sell3[0];
      }
    }else{
      sellPrice3 = "-";
    }
    if(sellPrice4 > 0){
      var gain = sellPrice4 - buyPrice;
      if(gain > itemprofit){
        itemprofit = gain;
        final_sell = sellPrice4;
        final_volume = sellVolume4;
        index = station_sell4[0];
      }
    }else{
      sellPrice4 = "-";
    }

    iskRatio = (final_sell-buyPrice)/buyPrice;
    var profit;
    if(buyVolume >= final_volume){
      profit = final_volume * itemprofit;
    }else{
      final_volume = buyVolume;
      profit = final_volume * itemprofit;
    }
    var cost = buyPrice * final_volume;
    if(!created){
      created = true;
      dt = $('#dataTable').DataTable({
        "order": [[ 6, "desc" ]],
        "lengthMenu": [[-1], ["All"]]
      });
      $(".more").show();
      $(".dataTables_length").remove();
      $(".dataTables_filter").remove();
      $(".dataTables_paginate").remove();
      $(".dataTables_info").css("width", "100%");
      $('#dataTable').show();
    }

    dt.row.add([
      itemName,
      numberWithCommas(buyPrice.toFixed(2)),
      numberWithCommas(final_volume.toFixed()),
      numberWithCommas(cost.toFixed(2)),
      (index === JITA[0] ? "Jita" : index === AMARR[0] ? "Amarr" : index === DODIXIE[0] ? "Dodixie" : index === RENS[0] ? "Rens" : "Hek"),
      numberWithCommas(profit.toFixed(2)),
      (iskRatio.toFixed(3)*100).toFixed(1)+"%",
      numberWithCommas(final_sell.toFixed(2)),
      numberWithCommas(itemprofit.toFixed(2))
    ]).draw( false );
  }
  if(itemId === length){
    // var end = new Date().getTime();
    // var time = end - start;
    // console.log('Execution time: ' + time);
    if($('tr').length-1 < toIndex){
      getRows(init_itemIds, init_station_buy, init_station_sell1, init_station_sell2, init_station_sell3, init_station_sell4);
    }else{
      window.setTimeout(goAgain(), 1000);
      toIndex += JUMPS;
    }
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

function run(val){
  if($('#howto').is(':visible')){
     $('#howto').slideToggle();
  }
  init(val);
}
