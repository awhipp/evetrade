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
    var buyTypeUrl = "?type=" + ENDPOINT + "/inventory/types/" + itemId + "/";
    try{
        $.ajax({
            type: "get",
            url: buyMarketUrl + buyTypeUrl,
            dataType: "json",
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
    var sellTypeUrl = "?type=" + ENDPOINT + "/inventory/types/" + itemId + "/";
    try{
        $.ajax({
            type: "get",
            url: sellMarketUrl + sellTypeUrl,
            dataType: "json",
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

    if(margin*100 >= threshold_margin_lower && margin*100 <= threshold_margin_upper){

        if(!created){
            created = true;
            dt = $('#dataTable').DataTable({
                "order": [[ MARGIN_INDEX, "desc" ]],
                "lengthMenu": [[-1], ["All"]]
            });

            // for each column in header add a togglevis button in the div
            var li_counter = 0;
            $("#dataTable thead th").each( function ( i ) {
                var name = dt.column( i ).header();
                var spanelt = document.createElement( "button" );

                var initial_removed = [];
                if($(document).width() < 768){
                    initial_removed = ["Profit Per Item"];
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
