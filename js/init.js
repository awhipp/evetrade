var JITA = [10000002,60003760];
var AMARR = [10000043,60008494];
var DODIXIE = [10000032,60011866];
var RENS = [10000030,60004588];
var HEK = [10000042,60005686];
var IGNORE = null;

var stopped = false;

var NUMBER_RETURNED = 1;

var threshold_margin_lower = 50;
var threshold_margin_upper = 75;

var threshold_profit = 100000;
var threshold_roi = 1;
var threshold_cost = 999999999999999999;
var threshold_weight = 999999999999999999

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

var requestItemWeight = true;

var stations_checked = 0;
var MAX_STATIONS = 25;

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

function setup(tradeType){
    routeTrading = tradeType;
    $('.howto').toggle(false);

    if(routeTrading == true){

        $("#about")[0].onclick = function() {
          $('#howto-route').modal('show');
        };
        $("#initial_choice").hide();
        $("#route_trade").slideToggle();
    }else{

        $("#about")[0].onclick = function() {
          $('#howto-station').modal('show');
        };
        $("#initial_choice").hide();
        $("#station_trade").slideToggle();
    }
}


$( document ).ready(function() {
    $("#stations_remaining").text(MAX_STATIONS);

    popup_table_buy = $("#popup-table-buy").DataTable({
        "order": [[ 0, "asc" ]],
        "lengthMenu": [[10], ["10"]]
    });
    popup_table_sell = $("#popup-table-sell").DataTable({
        "order": [[ 0, "desc" ]],
        "lengthMenu": [[10], ["10"]]
    });

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

    // $("#numberInput").on('blur', updateNumber);

    $("#custom_route").on('click', function(){
      $(".standard").slideToggle();
      $(".custom").slideToggle();
      if($(this).val() === "Enable Custom Route"){
        $(this).val("Disable Custom Route");
        isCustom = true;
      }else{
        $(this).val("Enable Custom Route");
        isCustom = false;
      }
    });

    $("#custom_select").on('click', function(){
      $(".standard").slideToggle();
      $(".custom").slideToggle();
      if($(this).val() === "Enable Custom Selection"){
        $(this).val("Disable Custom Selection");
        isCustom = true;
      }else{
        $(this).val("Enable Custom Selection");
        isCustom = false;
      }

    });

    for(var i = 0; i < station_ids.length; i++){
      $("#custom_route_start").append('<option value='+ [station_ids[i][1],station_ids[i][0]] +'>' + station_ids[i][2] + '</option>');
      $("#custom_route_end").append('<li><input id="end-'+i+'" class="end-selection" type="checkbox" value='+ [station_ids[i][1],station_ids[i][0]] +'><label for="end-'+i+'">' + station_ids[i][2] + '</label></li>');
      // $("#custom_route_end").append('<option value='+ [station_ids[i][1],station_ids[i][0]] +'>' + station_ids[i][2] + '</option>');
      $("#custom_station").append('<option value='+ [station_ids[i][1],station_ids[i][0]] +'>' + station_ids[i][2] + '</option>');
    }

    $(".end-selection").on('click', function(){
        stations_checked = $(".end-selection:checked").length;
        if(stations_checked > MAX_STATIONS){
          $(this).prop("checked",false);
          stations_checked = $(".end-selection:checked").length;
        }
        $("#stations_remaining").text(MAX_STATIONS-stations_checked);
    });

    $("#custom_route_start").change(function(){
      start_location = $("#custom_route_start option[value='" + $('#custom_route_start').val() + "']").text();
    });

    $("#custom_station").change(function(){
      start_location = $("#custom_station option[value='" + $('#custom_station').val() + "']").text();
    });

    $("#lower-margin-threshold").val(getCookie("lower-margin-threshold"));
    $("#upper-margin-threshold").val(getCookie("upper-margin-threshold"));
    $("#profit-threshold").val(getCookie("profit-threshold"));
    $("#roi-threshold").val(getCookie("roi-threshold"));
    $("#buy-threshold").val(getCookie("buy-threshold"));
    $("#weight-threshold").val(getCookie("weight-threshold"));
});

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

function open_popup(itemId, name, location, stationid){
    popup_table_buy.clear();
    popup_table_sell.clear();
    $("#popup_itemName").text("Trade info for " + name);
    if(isCustom){
      $("#buyLocation").text("Buy at " + customStart);
      $("#sellLocation").text("Sell at " + location);
    }else{
      $("#buyLocation").text("Buy at " + start_location);
      $("#sellLocation").text("Sell at " + location);
    }
    var buyArr = customBuy[station_buy[1]][itemId];
    var sellArr = customSell[stationid][itemId];

    for(var i = 0; i < buyArr.length; i++){
        if(buyArr[i]){
            $('#popup-table-buy').dataTable().fnAddData([numberWithCommas(buyArr[i][0].toFixed(2)), numberWithCommas(buyArr[i][1].toFixed())]);
        }
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

function unreachable(itemId, length){
    if(!has_shown && $("#unreachable").is(":hidden")){
        $("#unreachable").hide();
        $("#unreachable").slideToggle();
        has_shown = true;
    }

    if(itemId === length){
      goAgain();
    }
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
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
            threshold_margin_lower = parseFloat($("#lower-margin-threshold").val());
            setCookie("lower-margin-threshold",threshold_margin_lower,7);
        }else{
            setCookie("lower-margin-threshold","");
        }

        if($("#upper-margin-threshold").val().length > 0 && !isNaN($("#upper-margin-threshold").val())){
            threshold_margin_upper = parseFloat($("#upper-margin-threshold").val());
            setCookie("upper-margin-threshold",threshold_margin_upper,7);
        }else{
            setCookie("upper-margin-threshold","");
        }
    }else{

      if(isCustom){
        if($(".end-selection:checked").length == 0){
          destinations.push("None");
        }
        $.each($(".end-selection:checked"), function(){
          if(destinations.length < MAX_STATIONS){
            destinations.push($("[for='"+$(this).attr('id')+"']").text());
          }
        });
        customStart = location;
        customEnd = destinations;
      }else{
        $.each($(".end-selected"), function(){
            destinations.push($(this).val());
        });
      }

      if($("#profit-threshold").val().length > 0 && !isNaN($("#profit-threshold").val())){
          threshold_profit = parseFloat($("#profit-threshold").val());
          setCookie("profit-threshold",threshold_profit,7);
      }else{
          setCookie("profit-threshold","");
      }
      if($("#roi-threshold").val().length > 0 && !isNaN($("#roi-threshold").val())){
          threshold_roi = parseFloat($("#roi-threshold").val());
          setCookie("roi-threshold",threshold_roi,7);
      }else{
          setCookie("roi-threshold","");
      }
      if($("#buy-threshold").val().length > 0 && !isNaN($("#buy-threshold").val())){
          threshold_cost = parseFloat($("#buy-threshold").val());
          setCookie("buy-threshold",threshold_cost,7);
      }else{
          setCookie("buy-threshold","");
      }
      if($("#weight-threshold").val().length > 0 && !isNaN($("#weight-threshold").val())){
          threshold_weight = parseFloat($("#weight-threshold").val());
          setCookie("weight-threshold",threshold_weight,7);
      }else{
          setCookie("weight-threshold","");
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
    }

    if(isCustom && (destinations[0] === "None" || start_location === "None")){
        $(".error").show();
        $("#selection").show();
        return;
    }else{
        $(".error").hide();
        $("#selection").hide();
    }

    var active_stations = [];
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

      $.each($(".end-selection:checked"), function(){
          if(active_stations.length < MAX_STATIONS){
            active_stations.push($(this).val().split(","));
          }
      });
    }
    $("#title-banner").slideToggle();
    if(routeTrading){

        $('#dataTable').append("<thead><tr><th>Item</th><th>Sell Order</th><th>Quantity</th><th>Total Cost</th><th>Take To</th><th>Buy Order</th><th>Quantity</th><th>Total Profit</th><th>Profit Per Item</th><th>R.O.I.</th><th>Total Volume (m3)</th></tr></thead>")
      
        $('#dataTable thead:last').after("<tbody id='tableBody'></tbody>");
        $("#buyingHeader").text("Buying Sell Orders from " + location);

        var including = "";
        if(isCustom){
          $.each(destinations, function(){
            including += this + ", ";
          });
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
            including = "<div id='route-to'>Selling to the Buy Orders at " + including.substring(0,including.length-2) + "</div>";
        }
        including += "ROI&nbsp;Greater&nbsp;Than&nbsp;" + threshold_roi + "% |&nbsp;Profits&nbsp;Greater&nbsp;Than&nbsp;" + numberWithCommas(threshold_profit) + "&nbsp;ISK";
        if(threshold_cost !== 999999999999999999){
          including += " |&nbsp;Buy&nbsp;Costs&nbsp;Less&nbsp;Than&nbsp;" + numberWithCommas(threshold_cost) + "&nbsp;ISK";
        }
        if(threshold_weight !== 999999999999999999){
          including += " |&nbsp;Total&nbsp;Volume&nbsp;Under&nbsp;" + numberWithCommas(threshold_weight) + "&nbsp;m3";
        }
        $("#buyingFooter").html(including + "<br/>*Profit is not guaranteed. <span class='avoidwrap'>Use at your own risk. <span class='avoidwrap'>Verify in game that prices are accurate.</span></span><div class='loading'></div>");
        $("#buyingFooter").show();
        $("#buyingHeader").show();
        $("#core").slideToggle();
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
        for(var i = 0; i < active_stations.length; i++){
          for(var j = 0; j < active_stations[i].length; j++){
            active_stations[i][j] = parseInt(active_stations[i][j]);
          }
        }
        beginRoute(station_buy,active_stations);
    }else{
        $("#buyingHeader").text("Station Trading at " + location);
        $("#buyingFooter").html("Margins between " + threshold_margin_lower + "% and " + threshold_margin_upper + "%<div class='loading'>Loading. Please wait...</div>");
        $("#buyingFooter").show();
        $("#buyingHeader").show();
        $("#core").slideToggle();
        if(isCustom){
          station_buy = $("#custom_station").val().split(",");
        }

        $('#dataTable').append("<thead><tr><th>Item</th><th>Buy Order</th><th>Sell Order</th><th>Profit Per Item</th><th>Margin</th></tr></thead>");
        $('#dataTable thead:last').after("<tbody id='tableBody'></tbody>");

        beginRoute(station_buy,station_buy);
    }



}
