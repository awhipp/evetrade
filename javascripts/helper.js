// Google Crest Script (GCS)
// version 4d
// Created by /u/nuadi @ Reddit
// Modified by Alexander Whipp @awhipp github

// LICENSE: Use at your own risk, and fly safe.

// Global variable needed to track number of retries attempted
var retries = 0;
// Global variables used in order comparison function and set by
// Advanced Orders function. Default is the Price column.
var sortIndex = 1;
var sortOrder = 1;

/**
 * Private helper method that will compare two market orders.
 */
function compareOrders(order1, order2){
  var comparison = 0;
  if (order1[sortIndex] < order2[sortIndex])
  {
    comparison = -1;
  }
  else if (order1[sortIndex] > order2[sortIndex])
  {
    comparison = 1;
  }
  return comparison * sortOrder;
}

/**
 * Private helper function that will return the JSON provided for
 * a given CREST market query.
 *
 * @param {itemId} itemId the item ID of the product to look up
 * @param {regionId} regionId the region ID for the market to look up
 * @param {stationId} stationId the station ID for the market to look up
 * @param {orderType} orderType this should be set to "sell" or "buy" orders
 */
function getMarketJson(itemId, regionId, stationId, orderType)
{
  var marketData = null;

  // Validate incoming arguments
  if (itemId == null || typeof(itemId) != "number")
  {
    throw new Error("Invalid Item ID");
  }
  else if (regionId == null || typeof(regionId) != "number")
  {
    throw new Error("Invalid Region ID");
  }
  else if (orderType == null || typeof(orderType) != "string" || orderType.toLowerCase() != 'sell' && orderType.toLowerCase() != 'buy')
  {
    throw new Error("Invalid order type");
  }
  else
  {
    orderType = orderType.toLowerCase();

    // Setup variables for the market endpoint we want
    var marketUrl = "https://public-crest.eveonline.com/market/" + regionId + "/orders/" + orderType + "/";
    var typeUrl = "?type=https://public-crest.eveonline.com/types/" + itemId + "/";

    try
    {
      // Make the call to get some market data
      $.get(marketUrl + typeUrl, function(data) {
        if (typeof(data) == "string")  {
          if(orderType == "buy"){
            $("#sell" + itemId+stationId).text(data);
          }else{
            $("#buy" + itemId+stationId).text(data);

          }
        }
        else if (data != null){
          returnPrice = getPrice(data, stationId, orderType, itemId)
        }
      });

    }
    catch (unknownError)
    {
      var addressError = "Address unavailable:";
      if (unknownError.message.slice(0, addressError.length) == addressError)
      {
        var maxRetries = 3;

        // See if we can try again
        if (retries <= maxRetries)
        {
          retries++;
          marketData = getMarketJson(itemId, regionId, orderType);
        }
        else
        {
          marketData = "";
          for (i in unknownError)
          {
            marketData += i + ": " + unknownError[i] + "\n";
          }
        }
      }
      else
      {
        marketData = "";
        for (i in unknownError)
        {
          marketData += i + ": " + unknownError[i] + "\n";
        }
      }
    }
  }

}

/**
 * Returns the market price for a given item.
 *
 * @param {itemId} itemId the item ID of the product to look up
 * @param {regionId} regionId the region ID for the market to look up
 * @param {stationId} stationId the station ID for the market to focus on
 * @param {orderType} orderType this should be set to "sell" or "buy" orders
 * @param {refresh} refresh (Optional) Change this value to force Google to refresh return value
 * @customfunction
 */
function getMarketPrice(itemId, regionId, stationId, orderType, refresh)
{
  var returnPrice = 0;

  if (stationId == null || typeof(stationId) != "number")
  {
    throw new Error("Invalid Station ID");
  }
  else
  {
    var jsonMarket = getMarketJson(itemId, regionId, stationId, orderType);
  }
}

/**
 * Returns the market item name for item id
 *
 * @param {itemId} itemId the item ID of the product to look up
 * @customfunction
 */
function getItemName(itemId, refresh)
{
  if (itemId == null || typeof(itemId) != "number")
  {
    throw new Error("Invalid Item ID");
  }
  else{

    // Setup variables for the market endpoint we want
    var marketUrl = "https://public-crest.eveonline.com/types/" + itemId + "/";

    // Make the call to get some market data
    var jsonMarket;
    $.get( marketUrl, function() {
    }).success(function(data){
      $("#itemid_"+itemId).text(data["name"]);
      successful.push(itemId);
    }).error(function() {
      $("#itemid_"+itemId).parents()[0].remove();
    });
  }
}

/**
 * Private helper method that will determine the best price for a given item from the
 * market data provided.
 *
 * @param {jsonMarket} jsonMarket the market data in JSON format
 * @param {stationId} stationId the station ID to focus the search on
 * @param {orderType} orderType the type of order is either "sell" or "buy"
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
  if(orderType == "buy"){
    $("#sell" + itemId+stationid).text(bestPrice);

  }else{
    $("#buy" + itemId+stationid).text(bestPrice);

  }
  return bestPrice;
}
