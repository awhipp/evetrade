var JITA = [10000002,60003760];
var AMARR = [10000043,60008494];
var DODIXIE = [10000032,60011866];
var RENS = [10000030,60004588];
var HEK = [10000042,60005686];
var IGNORE = null;

var NUMBER_RETURNED = 3;

var threshold_margin_lower = 30;
var threshold_margin_upper = 45;

var threshold_profit = 100000;
var threshold_roi = 1;
var threshold_cost = 999999999999999999;

var itemIds = [];
var jitaBuy = [];
var jitaSell = [];
var amarrBuy = [];
var amarrSell = [];
var dodixieBuy = [];
var dodixieSell = [];
var rensBuy = [];
var rensSell = [];
var hekBuy = [];
var hekSell = [];
var customBuy = [];
var customSell = [];

var start_location = "";
var isCustom = false;
var customStart;
var customEnd;
var popup_table_buy;
var popup_table_sell;

var routeTrading = null;
var init_itemIds = 0;

var page = 1;
var has_shown = false;
var curr;

//var ENDPOINT = "https://public-crest.eveonline.com";
var ENDPOINT = "https://crest-tq.eveonline.com";


function numberWithCommas(val) {
    while (/(\d+)(\d{3})/.test(val.toString())){
        val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}

function showAbout(){
    if(routeTrading == null){
        $('#howto').slideToggle();
    }else if(routeTrading){
        $('#howto-route').slideToggle();
    }else{
        $('#howto-station').slideToggle();
    }
}

function getMoreItems(){
  var shown = false;
    $.ajax({
        type: "get",
        dataType: "json",
        url: ENDPOINT + "/market/types/",
        success: function(market){
          for(var page = 1; page <= market.pageCount; page++){
            $.ajax({
                type: "get",
                dataType: "json",
                url: ENDPOINT + "/market/types/?page=" + page,
                success: function(data){
                    if(data && data.items){
                        if(!data.next){
                            $("#loading").hide();
                            $("#selection").show();
                        }
                        var items = shuffle(data.items);
                        init_itemIds = init_itemIds + items.length;
                        for(var i = 0; i < items.length; i ++){
                            itemIds.push(items[i].id);
                        }
                    }
                },
                error: function (request, error) {
                    // getMoreItems();
                }
            });
          }
        },
        error: function (request, error) {
            // getMoreItems();
        }
    });
}

function setup(tradeType){
    routeTrading = tradeType;
    $('.howto').toggle(false);

    if(routeTrading == true){
        $("#initial_choice").hide();
        $("#route_trade").slideToggle();
    }else{
        $("#initial_choice").hide();
        $("#station_trade").slideToggle();
    }
}


$( document ).ready(function() {
    $("#loading").show();
    $("#selection").hide();

    popup_table_buy = $("#popup-table-buy").DataTable({
        "order": [[ 0, "asc" ]],
        "lengthMenu": [[10], ["10"]]
    });
    popup_table_sell = $("#popup-table-sell").DataTable({
        "order": [[ 0, "desc" ]],
        "lengthMenu": [[10], ["10"]]
    });

    getMoreItems();

    $(".start").on('click', function(){
        start_location = $(this).val();
        $(".start").removeClass("start-selected");
        $(this).addClass("start-selected");
        start_location == "Jita" ? $("#add_jita").removeClass("end-selected") : "";
        start_location == "Amarr" ? $("#add_amarr").removeClass("end-selected") : "";
        start_location == "Dodixie" ? $("#add_dodixie").removeClass("end-selected") : "";
        start_location == "Rens" ? $("#add_rens").removeClass("end-selected") : "";
        start_location == "Hek" ? $("#add_hek").removeClass("end-selected") : "";
    });

    $(".end").on('click', function(){
        if($(this).hasClass("end-selected")){
            $(this).removeClass("end-selected");
        }else{
            $(this).addClass("end-selected");
        }
    });

    $(".station-start").on('click', function(){
      $(".station-start").removeClass("station-selected");
      $(this).addClass("station-selected");
    });

    $("#numberInput").on('blur', updateNumber);

    $("#custom_route").on('click', function(){
      $(".standard").slideToggle();
      $(".custom").slideToggle();
      if($(this).val() === "Enable Custom Route (BETA)"){
        $(this).val("Disable Custom Route");
        isCustom = true;
      }else{
        $(this).val("Enable Custom Route (BETA)");
        isCustom = false;
      }

    });

    $("#custom_select").on('click', function(){
      $(".standard").slideToggle();
      $(".custom").slideToggle();
      if($(this).val() === "Enable Custom Selection (BETA)"){
        $(this).val("Disable Custom Selection");
        isCustom = true;
      }else{
        $(this).val("Enable Custom Selection (BETA)");
        isCustom = false;
      }

    });

    for(var i = 0; i < station_ids.length; i++){
      $("#custom_route_start").append('<option value='+ [station_ids[i][1],station_ids[i][0]] +'>' + station_ids[i][2] + '</option>');
      $("#custom_route_end").append('<option value='+ [station_ids[i][1],station_ids[i][0]] +'>' + station_ids[i][2] + '</option>');
      $("#custom_station").append('<option value='+ [station_ids[i][1],station_ids[i][0]] +'>' + station_ids[i][2] + '</option>');
    }

    $("#custom_route_start").change(function(){
      start_location = $("#custom_route_start option[value='" + $('#custom_route_start').val() + "']").text();
    });

    $("#custom_station").change(function(){
      start_location = $("#custom_station option[value='" + $('#custom_station').val() + "']").text();
    });
});

function updateNumber(){
    NUMBER_RETURNED = parseInt($("#numberInput").val());
    if(NUMBER_RETURNED > 10 || NUMBER_RETURNED < 1){
        NUMBER_RETURNED = 1;
        $("#numberInput").val("1");
    }
}

function shuffle(array) {
    var currentIndex = array.length,temporaryValue,randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function open_popup(itemId, name, location){
    popup_table_buy.clear();
    popup_table_sell.clear();
    $("#popup_itemName").text("Trade info for " + name);
    if(isCustom){
      $("#buyLocation").text("Buy at " + customStart);
      $("#sellLocation").text("Sell at " + customEnd);
    }else{
      $("#buyLocation").text("Buy at " + start_location);
      $("#sellLocation").text("Sell at " + location);
    }
    var buyArr;
    var sellArr;

    if(start_location == "Jita"){
        buyArr = jitaBuy[itemId];
    }else if(start_location == "Amarr"){
        buyArr = amarrBuy[itemId];
    }else if(start_location == "Dodixie"){
        buyArr = dodixieBuy[itemId];
    }else if(start_location == "Rens"){
        buyArr = rensBuy[itemId];
    }else if(start_location == "Hek"){
        buyArr = hekBuy[itemId];
    }else{
        buyArr = customBuy[itemId];
    }

    for(var i = 0; i < buyArr.length; i++){
        if(buyArr[i]){
            $('#popup-table-buy').dataTable().fnAddData([numberWithCommas(buyArr[i][0].toFixed(2)), numberWithCommas(buyArr[i][1].toFixed())]);
        }
    }

    if(location == "Jita"){
        sellArr = jitaSell[itemId];
    }else if(location == "Amarr"){
        sellArr = amarrSell[itemId];
    }else if(location == "Dodixie"){
        sellArr = dodixieSell[itemId];
    }else if(location == "Rens"){
        sellArr = rensSell[itemId];
    }else if(location == "Hek"){
        sellArr = hekSell[itemId];
    }else{
        sellArr = customSell[itemId];
    }

    for(var i = 0; i < sellArr.length; i++){
        if(sellArr[i]){
            $('#popup-table-sell').dataTable().fnAddData([numberWithCommas(sellArr[i][0].toFixed(2)), numberWithCommas(sellArr[i][1].toFixed())]);
        }
    }

    $('#popup').modal('show');
    popup_table_buy.draw();
    popup_table_sell.draw();
}

function unreachable(){
    if(!has_shown && $("#unreachable").is(":hidden")){
        $("#unreachable").hide();
        $("#unreachable").slideToggle();
        has_shown = true;
    }
}

function init(){
    var location = start_location;

    var destinations = [];

    if(routeTrading == false){
        if(isCustom){
          destinations.push($("#custom_station option[value='" + $('#custom_station').val() + "']").text());
          start_location = "Nil";
          customStart = location;
          customEnd = destinations[0];
        }else{
          $.each($(".station-selected"), function(){
              start_location = "Nil";
              location = $(this).val();
              destinations.push($(this).val());
          });
        }

        if($("#lower-margin-threshold").val().length > 0 && !isNaN($("#lower-margin-threshold").val())){
            threshold_margin_lower = parseInt($("#lower-margin-threshold").val());
        }

        if($("#upper-margin-threshold").val().length > 0 && !isNaN($("#upper-margin-threshold").val())){
            threshold_margin_upper = parseInt($("#upper-margin-threshold").val());
        }
    }else{

      if(isCustom){
        destinations.push($("#custom_route_end option[value='" + $('#custom_route_end').val() + "']").text());
        customStart = location;
        customEnd = destinations[0];
      }else{
        $.each($(".end-selected"), function(){
            destinations.push($(this).val());
        });
      }

      if($("#profit-threshold").val().length > 0 && !isNaN($("#profit-threshold").val())){
          threshold_profit = parseInt($("#profit-threshold").val());
      }
      if($("#roi-threshold").val().length > 0 && !isNaN($("#roi-threshold").val())){
          threshold_roi = parseInt($("#roi-threshold").val());
      }
      if($("#buy-threshold").val().length > 0 && !isNaN($("#buy-threshold").val())){
          threshold_cost = parseInt($("#buy-threshold").val());
      }
    }

    var add_jita = destinations.indexOf("Jita") > -1 ? true : false;
    var add_amarr = destinations.indexOf("Amarr") > -1 ? true : false;
    var add_dodixie = destinations.indexOf("Dodixie") > -1 ? true : false;
    var add_rens = destinations.indexOf("Rens") > -1 ? true : false;
    var add_hek = destinations.indexOf("Hek") > -1 ? true : false;

    if((destinations.indexOf(start_location) > -1 && destinations.length == 1) || (destinations.length == 0 || start_location === "")){
        $(".error").show();
        return;
    }else{
        $(".error").hide();
        $("#selection").hide();
        $("#stop").show();
    }

    if(isCustom && (destinations[0] === "None" || start_location === "None")){
        $(".error").show();
        $("#selection").show();
        $("#stop").hide();
        return;
    }else{
        $(".error").hide();
        $("#selection").hide();
        $("#stop").show();
    }

    if(!isCustom){
      var add_jita = destinations.indexOf("Jita") > -1 ? true : false;
      var add_amarr = destinations.indexOf("Amarr") > -1 ? true : false;
      var add_dodixie = destinations.indexOf("Dodixie") > -1 ? true : false;
      var add_rens = destinations.indexOf("Rens") > -1 ? true : false;
      var add_hek = destinations.indexOf("Hek") > -1 ? true : false;

      var station_buy,station_sell1,station_sell2,station_sell3,station_sell4;
      if(location === "Jita"){
          station_buy = JITA;
          station_sell1 = add_amarr ? AMARR : IGNORE;
          station_sell2 = add_dodixie ? DODIXIE : IGNORE;
          station_sell3 = add_rens ? RENS : IGNORE;
          station_sell4 = add_hek ? HEK : IGNORE;
      }else if(location === "Amarr"){
          station_buy = AMARR;
          station_sell1 = add_jita ? JITA : IGNORE;
          station_sell2 = add_dodixie ? DODIXIE : IGNORE;
          station_sell3 = add_rens ? RENS : IGNORE;
          station_sell4 = add_hek ? HEK : IGNORE;
      }else if(location === "Dodixie"){
          station_buy = DODIXIE;
          station_sell1 = add_amarr ? AMARR : IGNORE;
          station_sell2 = add_jita ? JITA : IGNORE;
          station_sell3 = add_rens ? RENS : IGNORE;
          station_sell4 = add_hek ? HEK : IGNORE;
      }else if(location === "Rens"){
          station_buy = RENS;
          station_sell1 = add_amarr ? AMARR : IGNORE;
          station_sell2 = add_dodixie ? DODIXIE : IGNORE;
          station_sell3 = add_jita ? JITA : IGNORE;
          station_sell4 = add_hek ? HEK : IGNORE;
      }else {
          station_buy = HEK;
          station_sell1 = add_amarr ? AMARR : IGNORE;
          station_sell2 = add_dodixie ? DODIXIE : IGNORE;
          station_sell3 = add_rens ? RENS : IGNORE;
          station_sell4 = add_jita ? JITA : IGNORE;
      }
    }else{
      station_buy = $("#custom_route_start").val().split(",");
      station_sell1 = $("#custom_route_end").val().split(",");
      station_sell2 = IGNORE;
      station_sell3 = IGNORE;
      station_sell4 = IGNORE;
    }
    $("#title-banner").slideToggle();
    if(routeTrading){
        $('#dataTable').append("<thead><tr><th>Item</th><th>Buy Price</th><th>Total Cost</th><th>Buy Quantity</th><th>Sell At</th><th>Sell Quantity</th><th>Total Profit</th><th>R.O.I.</th><th>Sell Price</th><th>Profit Per Item</th></tr></thead>")
        $('#dataTable thead:last').after("<tbody id='tableBody'></tbody>");
        $("#buyingHeader").text("Buying from " + location);

        var including = "";
        if(isCustom){
          including += destinations[0] + ", ";
        }else{
          if(add_jita && location !== "Jita"){
              including += "Jita, ";
          }
          if(add_amarr && location !== "Amarr"){
              including += "Amarr, ";
          }
          if(add_dodixie && location !== "Dodixie"){
              including += "Dodixie, ";
          }
          if(add_rens && location !== "Rens"){
              including += "Rens, ";
          }
          if(add_hek && location !== "Hek"){
              including += "Hek, ";
          }
        }
        if(including.length > 0){
            including = "( routes to " + including.substring(0,including.length-2) + " )<br/>";
        }
        including += "ROI&nbsp;Greater&nbsp;Than&nbsp;" + threshold_roi + "% |&nbsp;Profits&nbsp;Greater&nbsp;Than&nbsp;" + numberWithCommas(threshold_profit) + "&nbsp;ISK";
        if(threshold_cost !== 999999999999999999){
          including += " |&nbsp;Buy&nbsp;Costs&nbsp;Less&nbsp;Than&nbsp;" + numberWithCommas(threshold_cost) + "&nbsp;ISK";
        }
        including += " |&nbsp;<span id='percent-complete'></span>";
        $("#buyingFooter").html(including + "<br/>*Profit is not guaranteed. <span class='avoidwrap'>Use at your own risk. <span class='avoidwrap'>Verify in game that prices are accurate.</span></span><div class='loading'>Checking Live Prices<br>Please wait...</div>");
        $("#buyingFooter").show();
        $("#buyingHeader").show();
        var active_stations = [];
        if( station_sell1 != null ){
          active_stations.push(station_sell1);
        }
        if( station_sell2 != null ){
          active_stations.push(station_sell2);
        }
        if( station_sell3 != null ){
          active_stations.push(station_sell3);
        }
        if( station_sell4 != null ){
          active_stations.push(station_sell4);
        }
        beginRoute(station_buy,active_stations);
    }else{
        $("#buyingHeader").text("Station Trading at " + location);
        $("#buyingFooter").html("Margins between " + threshold_margin_lower + "% and " + threshold_margin_upper + "%<div class='loading'>Loading. Please wait...</div>");
        $("#buyingFooter").show();
        $("#buyingHeader").show();
        if(isCustom){
          station_buy = $("#custom_station").val().split(",");
        }

        $('#dataTable').append("<thead><tr><th>Item</th><th>Buy Price</th><th>Sell Price</th><th>Profit Per Item</th><th>Margin</th></tr></thead>");
        $('#dataTable thead:last').after("<tbody id='tableBody'></tbody>");
        beginStation(station_buy);
    }



}
