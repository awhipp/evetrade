var SECOND_DELAY = 0;
var PROFIT_INDEX = 6;
var PAGES = 40;
var UPDATING_TIMEOUT = 25000;
var UPDATING_CHECK = [];
var length;
var stations = [];
var created = false;
var dt;


var station_buy, stations;

function getData(data, stationId, orderType, itemId){
  var returnarr = [];
  var temparr;
  if (typeof(data) == "string")  {
    temparr = [data];
  }
  else if (data != null){
    temparr = getPrice(data, stationId, orderType, itemId)
  }
  if(temparr){
      for(var i = 0; i < temparr.length; i++){
        if(temparr[i][0] > 0){
          returnarr.push(temparr[i]);
        }
    }
  }
  return returnarr;
}

// function goAgain(){
//   if(routeTrading){
//     getRowsRoute();
//   }else{
//     getRowsStation();
//   }
// }

var buy_orders, sell_orders;
function beginRoute(s_buy, active_stations){
  station_buy = s_buy;
  buy_orders = {};
  buy_orders["complete"] = false;
  buy_orders["region"] = station_buy[0];
  buy_orders["station"] = station_buy[1];
  buy_orders["complete_pages"] = 0;
  for(var j = 1; j <= PAGES; j++){
      getOrders(j, station_buy[0], station_buy[1], buy_orders);
  }

  stations = active_stations;
  sell_orders = [];
  for(var i = 0; i < active_stations.length; i++){
    sell_orders[i] = {};
    sell_orders[i]["complete"] = false;
    var regionId = active_stations[i][0];
    var stationId = active_stations[i][1];
    sell_orders[i]["region"] = regionId;
    sell_orders[i]["station"] = stationId;
    sell_orders[i]["complete_pages"] = 0;
    for(var j = 1; j <= PAGES; j++){
        getOrders(j, regionId, stationId, sell_orders[i]);
    }
  }

  $("#selection").hide();
  // getRowsRoute();
}

var itemids = [];

function next(){
      var buyPrice = [];
      while(buyPrice.length == 0){
          var itemid = itemids.splice(0, 1)[0];
          buyPrice = getData(buy_orders[itemid], buy_orders["station"], "sell", itemid);
          if(itemids.length == 0){
              return;
          }
      }
      if(buyPrice.length > 0){
          executeRowCompute(itemid, buyPrice);
      }

      return;
}

function getOrders(page, region, station, composite){
  region = parseInt(region);
  station = parseInt(station);

  var url = "https://esi.tech.ccp.is/latest/markets/"+region+"/orders/?datasource=tranquility&page="+page;
  $.ajax({
    type: "get",
    url: url,
    dataType: "json",
    contentType: "application/json",
    success: function(data) {
        composite["complete_pages"] += 1;
        console.log(composite["region"] + " complete - " + composite["complete_pages"]);
        if(composite["complete_pages"] == PAGES){

            var sell_orders_finished = true;
            for(var i = 0; i < sell_orders.length; i++){
                if(sell_orders[i]["complete_pages"] !== PAGES){
                    sell_orders_finished = false;
                }else{
                    sell_orders[i]["complete"] = true;
                }
            }

            if(buy_orders["complete_pages"] === PAGES){
                buy_orders["complete"] = true;
            }

            if(buy_orders["complete"] === true && sell_orders_finished){
                console.log("ALL COMPLETE");
                for(itemid in buy_orders){
                  itemids.push(itemid);
                }

              var buyPrice = [];
              while(buyPrice.length == 0){
                  var itemid = itemids.splice(0, 1)[0];
                  buyPrice = getData(buy_orders[itemid], buy_orders["station"], "sell", itemid);
                  if(itemids.length == 0){
                      return;
                  }
              }
              if(buyPrice.length > 0){
                  executeRowCompute(itemid, buyPrice);
              }
                return;
            }
        }else{
            for(var i = 0; i < data.length; i++){
              if(data[i]["location_id"] === station){
                var id = data[i]["type_id"];
                if(!composite[id]){
                  composite[id] = [];
                }
                composite[id].push(data[i]);
              }
            }
        }
    },
    error: function(){
      getOrders(page, region, station, composite);
    }
  });
}

function executeRowCompute(itemid, buyPrice){
    if(itemid !== "complete" || itemid !== "station" || itemid !== "region" || itemid != "complete_pages"){
        for(var j = 0; j < sell_orders.length; j++){
          if(sell_orders[j][itemid]){
            var sellPrice = getData(sell_orders[j][itemid], sell_orders[j]["station"], "buy", itemid);
            if(sellPrice.length > 0){
              var station_info = [sell_orders[j]["region"],sell_orders[j]["station"]];
              getItemInfo(itemid, buyPrice, sellPrice, station_info);
            }
          }
        }
    }

    next();
}

function getItemInfo(itemId, buyPrice, sellPrice, station){
  var rows = [];

  for(var i = 0; i < buyPrice.length; i++){
    for(var j = 0; j < sellPrice.length; j++){
      var row = calculateRow(itemId, buyPrice[i][0], buyPrice[i][1], sellPrice[j][0], sellPrice[j][1], station);
      if(row.length > 0){
        rows.push(row);
      }
    }
  }


    if(rows.length > 0){
        rows = rows.sort(rowComparator);
        getItemWeight(itemId, rows);
    }else{
        next();
    }
}

var itemWeightCache = {};
function getItemWeight(itemId, rows){
    if(itemWeightCache[itemId]){
        var name = itemWeightCache[itemId][0];
        var weight = itemWeightCache[itemId][1];
        if(weight <= threshold_weight){
          for(var i = 0; i < rows.length; i++){
            var row = rows[0];
            addRow(row[0],name,row[1],row[2],row[3],row[4],row[5],row[6],row[7],row[8],row[9],weight);
            break;
          }
        }
    }else{
        $.ajax({
        type: "get",
        url: "https://esi.tech.ccp.is/latest/universe/types/" + itemId + "/?datasource=tranquility&language=en-us",
        dataType: "json",
        async: true,
        contentType: "application/json",
            success: function(weightData) {
              var name = weightData['name'];
              var weight = weightData['volume']
              itemWeightCache[itemId] = [];
              itemWeightCache[itemId][0] = name;
              itemWeightCache[itemId][1] = weight;
              if(weight <= threshold_weight){
                for(var i = 0; i < rows.length; i++){
                  var row = rows[0];
                  addRow(row[0],name,row[1],row[2],row[3],row[4],row[5],row[6],row[7],row[8],row[9],weight);
                  break;
                }
              }
            },
            error: function (request, error) {
              console.log(error);
            }
        });
    }
}

function rowComparator(a,b){
  if (a[PROFIT_INDEX] < b[PROFIT_INDEX]) return 1;
  if (a[PROFIT_INDEX] > b[PROFIT_INDEX]) return -1;
  return 0;
}

function calculateRow(itemId,  b_price, b_volume, s_price, s_volume, station){
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
    var location = getLocation(station[1]);
    var iskRatio = (s_price-b_price)/b_price;
    if(profit >= threshold_profit && (iskRatio.toFixed(3)*100).toFixed(1) >= threshold_roi && buyCost <= threshold_cost ){
      return [itemId, b_price, volume, buyCost, location, profit, iskRatio, s_price, itemProfit, station];
    }else{
      return [];
    }
  }
  return [];
}

function getLocation(location){
  if(isCustom){
    return getCustomEnd(location);
  }else{
    return (location === JITA[1] ? "Jita" : location === AMARR[1] ? "Amarr" : location === DODIXIE[1] ? "Dodixie" : location === RENS[1] ? "Rens" : location === HEK[1] ? "Hek" : getCustomEnd(location));
  }
}

function getCustomEnd(location){
  for(var i = 0; i < stations.length; i++){
    if(location === stations[i][1]){
      return customEnd[i];
    }
  }
  return 'nil';
}

function checkRow(row_id){
  var next = UPDATING_CHECK[UPDATING_CHECK.length-1];
  if($("#"+next).hasClass("updating")){
    $("#"+next).remove();
  }
}

function addRow(itemId, itemName, buyPrice, buyVolume, buyCost, location, profit, iskRatio, sellPrice, itemProfit, station, storage_volume){
  var id = itemId + "_" + location + "_" + station[1];

  if(storage_volume){
    var vol1 = buyVolume.split("-")[0];
    var vol2 = buyVolume.split("-")[1];

    var selectedvol;
    if(vol1.indexOf("span") >= 0){
      selectedvol = vol1;
    }else{
      selectedvol = vol2;
    }

    var stage1 = selectedvol.substring(selectedvol.indexOf(">")+1,selectedvol.indexOf("</"));
    var stage2 = stage1.replace(",","");
    while(stage2.indexOf(",") >= 0){
      stage2 = stage2.replace(",","");
    }
    storage_volume = storage_volume * parseFloat(stage2);
  }else{
    storage_volume = 0;
  }

  if(!created){
    created = true;
    dt = $('#dataTable').DataTable({
      "order": [[ PROFIT_INDEX, "desc" ]],
      "lengthMenu": [[-1], ["All"]],
    "pagingType": "full_numbers"
    });

      // for each column in header add a togglevis button in the div
      var li_counter = 0;
      $("#dataTable thead th").each( function ( i ) {
        var name = dt.column( i ).header();
        var spanelt = document.createElement( "button" );
        // var initial_removed = [];
        // if($(document).width() < 768){
        //   initial_removed = ["Total Cost", "R.O.I.", "Sell Price", "Profit Per Item"];
        // }
        spanelt.innerHTML = name.innerHTML;

        $(spanelt).addClass("colvistoggle");
        $(spanelt).addClass("btn");
        $(spanelt).addClass("btn-default");
        $(spanelt).attr("colidx",i);		// store the column idx on the button

        $(spanelt).addClass("is-true");
        var column = dt.column( $(spanelt).attr('colidx') );
        column.visible( true );

        // for(var i = 0; i < initial_removed.length; i++){
        //   if(spanelt.innerHTML === initial_removed[i]){
        //     $(spanelt).addClass("is-false");
        //     var column = dt.column( $(spanelt).attr('colidx') );
        //     column.visible( false );
        //     break;
        //   }
        // }

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
            var classToFind = $(this).attr('id').split("_")[0] + "_" + $(this).attr('id').split("_")[1] + "_" + $(this).attr('id').split("_")[2];
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
            // open_popup($(this).attr('id').split("_")[0], $(this).children()[0].textContent, $(this).attr('id').split("_")[1], parseInt($(this).attr('id').split("_")[2]));
          }else{
            if(!$(this).hasClass("row-selected")){
              $(this).addClass("row-selected");
            }else{
              $(this).removeClass("row-selected");
            }
          }
        } else if(event.which === 3){
            open_popup($(this).attr('id').split("_")[0], $(this).children()[0].textContent, $(this).attr('id').split("_")[1], parseInt($(this).attr('id').split("_")[2]));
            event.preventDefault();
        //   var classToFind = $(this).attr('id').split("_")[0] + "_" + $(this).attr('id').split("_")[1] + "_" + $(this).attr('id').split("_")[2];
        //   if(document.getElementsByClassName(id)){
        //     var row = $("." + classToFind);
        //     $.each(row, function(){
        //       $(this).addClass("updating");
        //       window.setTimeout(function(){ UPDATING_CHECK.push($(this).attr('id')); checkRow(); }, UPDATING_TIMEOUT);
        //     });
        //   }
        //
        //   getBuyPrice($(this).attr('id').split("_")[0], true);
        }
      } );
      $("label > input").addClass("form-control").addClass("minor-text");
      $("label > input").attr("placeholder", "Search Results...");
      $(".loading").hide();
      $('#dataTable').show();
    }

    var row_data;
    if(requestItemWeight){
      row_data = [
      itemName,
      numberWithCommas(buyPrice.toFixed(2)),
      numberWithCommas(buyCost.toFixed(2)),
      buyVolume.split("-")[0],
      location,
      buyVolume.split("-")[1],
      numberWithCommas(profit.toFixed(2)),
      (iskRatio.toFixed(3)*100).toFixed(1)+"%",
      numberWithCommas(sellPrice.toFixed(2)),
      numberWithCommas(itemProfit.toFixed(2)),
      numberWithCommas(storage_volume.toFixed(2))
      ];
    }else{
      row_data = [
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
    }

    var rowIndex = $('#dataTable').dataTable().fnAddData(row_data);
    var row = $('#dataTable').dataTable().fnGetNodes(rowIndex);
    $(row).attr('id', id + "_" + $("." + id).length);
    $(row).addClass(id);

    next();
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
function getPrice(orders, stationId, orderType, itemId)
{
  var bestPrice = [];
  var bestVolume = [];

  // Pull all orders found and start iteration
  for (var orderIndex = 0; orderIndex < orders.length; orderIndex++)
  {
    var order = orders[orderIndex];

    var orderAlignsWithType = false;
    if(order['is_buy_order'] === true && orderType === "buy"){
        orderAlignsWithType = true;
    }else if(order['is_buy_order'] === false && orderType === "sell"){
        orderAlignsWithType = true;
    }

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
  if (orderType == "sell"){
    saveBuyData(stationId, itemId, $.extend(true, [], bestPrice));
    bestPrice = bestPrice.sort(buyComparator);
    /** Buying from Users at this price - ordered low to high **/
  }else{
    saveSellData(stationId, itemId, $.extend(true, [], bestPrice))
    bestPrice = bestPrice.sort(sellComparator);
  }
  return bestPrice;
}

function saveBuyData(stationId, itemId, data){
  if(customBuy[stationId]){
    customBuy[stationId][itemId] = data;
  }else{
    customBuy[stationId] = [];
    customBuy[stationId][itemId] = data;
  }
}

function saveSellData(stationId, itemId, data){
  if(customSell[stationId]){
    customSell[stationId][itemId] = data;
  }else{
    customSell[stationId] = [];
    customSell[stationId][itemId] = data;
  }
}
