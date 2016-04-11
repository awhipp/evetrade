// Google Crest Script (GCS)
// version 4d
// Created by /u/nuadi @ Reddit
// Modified by Alexander Whipp @awhipp github

// LICENSE: Use at your own risk, and fly safe.

var COLOR_CSS = "style='background-color:green; color: white;'";
var JUMPS = 25;
var start;
var length;
var lastIndex = 0;
var toIndex = JUMPS;

var init_itemIds, init_station_buy, init_station_sell1, init_station_sell2, init_station_sell3, init_station_sell4;

function getData(data, stationId, orderType, itemId){
   if (typeof(data) == "string")  {
      return data;
   }
   else if (data != null){
      return getPrice(data, stationId, orderType, itemId)
   }
}

function goAgain(){
   $("#more").val("Loading...");
   $("#more").prop('disabled', true);
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
   start = new Date().getTime();
   var i;
   for(i = lastIndex; i < itemIds.length && i < lastIndex + JUMPS; i++){
      var itemId = itemIds[i];
      getBuyPrice(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4);
      length = itemIds[i];
   }
   if(lastIndex >= itemIds.length){
      $("#more").val("No more deals found");
      $("#more").prop('disabled', true);
   }
   lastIndex = i;
}

function getBuyPrice(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4){
   var buyMarketUrl = "https://public-crest.eveonline.com/market/" + station_buy[0] + "/orders/sell/";
   var buyTypeUrl = "?type=https://public-crest.eveonline.com/types/" + itemId + "/";
   try{
      $.get(buyMarketUrl + buyTypeUrl, function(buyData) {
         var buyPrice = parseFloat(getData(buyData, station_buy[1], "sell", itemId));
         if(buyPrice > 0){
            getSellPrice1(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice);
         }else{
            if(itemId === length){
               var end = new Date().getTime();
               var time = end - start;
               console.log('Execution time: ' + time);
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

function getSellPrice1(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice){
   var sellMarketUrl_1 = "https://public-crest.eveonline.com/market/" + station_sell1[0] + "/orders/buy/";
   var sellTypeUrl_1 = "?type=https://public-crest.eveonline.com/types/" + itemId + "/";
   try{
      $.get(sellMarketUrl_1 + sellTypeUrl_1, function(sellData1) {
         var sellPrice1 = parseFloat(getData(sellData1, station_sell1[1], "buy", itemId));
         getSellPrice2(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1);
      });
   }catch (unknownError){
      getSellPrice1(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice);
   }
}

function getSellPrice2(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1){
   var sellMarketUrl_2 = "https://public-crest.eveonline.com/market/" + station_sell2[0] + "/orders/buy/";
   var sellTypeUrl_2 = "?type=https://public-crest.eveonline.com/types/" + itemId + "/";
   try{
      $.get(sellMarketUrl_2 + sellTypeUrl_2, function(sellData2) {
         var sellPrice2 = parseFloat(getData(sellData2, station_sell2[1], "buy", itemId));
         getSellPrice3(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1, sellPrice2);
      });
   }catch (unknownError){
      getSellPrice2(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1);
   }
}

function getSellPrice3(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1, sellPrice2){
   var sellMarketUrl_3 = "https://public-crest.eveonline.com/market/" + station_sell3[0] + "/orders/buy/";
   var sellTypeUrl_3 = "?type=https://public-crest.eveonline.com/types/" + itemId + "/";
   try{
      $.get(sellMarketUrl_3 + sellTypeUrl_3, function(sellData3) {
         var sellPrice3 = parseFloat(getData(sellData3, station_sell3[1], "buy", itemId));
         getSellPrice4(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1, sellPrice2, sellPrice3);
      });
   }catch (unknownError){
      getSellPrice3(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1, sellPrice2);
   }
}

function getSellPrice4(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1, sellPrice2, sellPrice3){
   var sellMarketUrl_4 = "https://public-crest.eveonline.com/market/" + station_sell4[0] + "/orders/buy/";
   var sellTypeUrl_4 = "?type=https://public-crest.eveonline.com/types/" + itemId + "/";
   try{
      $.get(sellMarketUrl_4 + sellTypeUrl_4, function(sellData4) {
         var sellPrice4 = parseFloat(getData(sellData4, station_sell4[1], "buy", itemId));
         getItemName(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1, sellPrice2, sellPrice3, sellPrice4);
      });
   }catch (unknownError){
      getSellPrice4(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1, sellPrice2, sellPrice3);
   }
}

function getItemName(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1, sellPrice2, sellPrice3, sellPrice4){
   var marketNameUrl = "https://public-crest.eveonline.com/types/" + itemId + "/";
   try{
      $.get(marketNameUrl, function() {}).success(function(data){
         itemName = data["name"];
         successful.push(itemId);
         buyPrice = parseFloat(buyPrice);
         sellPrice1 = parseFloat(sellPrice1);
         sellPrice2 = parseFloat(sellPrice2);
         sellPrice3 = parseFloat(sellPrice3);
         sellPrice4 = parseFloat(sellPrice4);
         if(buyPrice < sellPrice1 || buyPrice < sellPrice2 || buyPrice < sellPrice3 || buyPrice < sellPrice4){
            $('#dataTable').show();
            $("#more").show();
            var profit = -1;
            if(sellPrice1 > 0){
               var gain = sellPrice1 - buyPrice;
               if(gain > profit){
                  profit = gain;
               }
            }
            if(sellPrice2 > 0){
               var gain = sellPrice2 - buyPrice;
               if(gain > profit){
                  profit = gain;
               }
            }
            if(sellPrice3 > 0){
               var gain = sellPrice3 - buyPrice;
               if(gain > profit){
                  profit = gain;
               }
            }
            if(sellPrice4 > 0){
               var gain = sellPrice4 - buyPrice;
               if(gain > profit){
                  profit = gain;
               }
            }
            profit = Math.round(profit * 100) / 100;
            $('#dataTable tr:last').after("<tr><td>" + itemName + "</td><td>" + buyPrice + "</td>"
            + "<td>" + profit + "</td>"
            + "<td " + (buyPrice < sellPrice1 ? COLOR_CSS : "") + ">" + sellPrice1 + "</td>"
            + "<td " + (buyPrice < sellPrice2 ? COLOR_CSS : "") + ">" + sellPrice2 + "</td>"
            + "<td " + (buyPrice < sellPrice3 ? COLOR_CSS : "") + ">" + sellPrice3 + "</td>"
            + "<td " + (buyPrice < sellPrice4 ? COLOR_CSS : "") + ">" + sellPrice4 + "</td>"
            + "</tr>");
         }
         if(itemId === length){
            var end = new Date().getTime();
            var time = end - start;
            console.log('Execution time: ' + time);
            if($('tr').length-1 < toIndex){
               getRows(init_itemIds, init_station_buy, init_station_sell1, init_station_sell2, init_station_sell3, init_station_sell4);
            }else{
               $("#more").val("Get More");
               $("#more").prop('disabled', false);
               toIndex += JUMPS;
            }
         }
      });
   }catch (unknownError){
      getItemName(itemId, station_buy, station_sell1, station_sell2, station_sell3, station_sell4, buyPrice, sellPrice1, sellPrice2, sellPrice3, sellPrice4);
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

   // Pull all orders found and start iteration
   var orders = jsonMarket['items'];
   for (var orderIndex = 0; orderIndex < orders.length; orderIndex++)
   {
      var order = orders[orderIndex];
      if (stationId == order['location']['id'])
      {
         // This is the station market we want
         var price = order['price'];

         if (bestPrice > 0)
         {
            // We have a price from a previous iteration
            if (orderType == "sell" && price < bestPrice)
            {
               bestPrice = price;
            }
            else if (orderType == "buy" && price > bestPrice)
            {
               bestPrice = price;
            }
         }
         else
         {
            // This is the first price found, take it
            bestPrice = price;
         }
      }
   }
   return bestPrice;
}
