var threshold_margin_lower = 20;
var threshold_margin_upper = 40;
var volume_threshold = 1000;
var threshold_profit = 100000;
var threshold_roi = 1;
var threshold_cost = 999999999999999999;
var threshold_weight = 999999999999999999;

var routeTrading = null;
var isCustom = false;
var errorShown = false;

var customBuy = [];
var customSell = [];
var page = 1;

var popup_table_buy;
var popup_table_sell;

var stations_checked = 0;
var MAX_STATIONS = 25;

var universeList = {};

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

    onClickListeners();

    setupCustomDropdown();

    $('input[type="number"]').keypress(function(e) {
        var theEvent = e || window.event;
        var key = theEvent.keyCode || theEvent.which;
        key = String.fromCharCode( key );
        var regex = /[0-9]|\./;
        if(!regex.test(key) && theEvent.charCode !== 8 && theEvent.charCode !== 0) {
            theEvent.returnValue = false;
            if(theEvent.preventDefault) theEvent.preventDefault();
        }
    });

    setAbout();
    setupCookies();
});

function setupCustomDropdown() {
    for(var i = 0; i < station_ids.length; i++){
        $("#custom_route_start").append('<option>' + station_ids[i][2] + '</option>');

        $("#custom_route_end").append('<li>' +
            '<input id="echeck-' + i + '" class="end-selection" type="checkbox" value="'+ station_ids[i][2] +'">' +
            '<label for="echeck-' + i + '">' + station_ids[i][2] + '</label>' +
            '</li>');

        $("#custom_station").append('<option>' + station_ids[i][2] + '</option>');

        universeList[station_ids[i][2]] = {};
        universeList[station_ids[i][2]].region = station_ids[i][1];
        universeList[station_ids[i][2]].station = station_ids[i][0];
    }

    $(".end-selection").on('click', function(){
        stations_checked = $(".end-selection:checked").length;
        if(stations_checked > MAX_STATIONS){
            $(this).prop("checked",false);
            stations_checked = $(".end-selection:checked").length;
        }
        $("#stations_remaining").text(MAX_STATIONS-stations_checked);
    });
}

function onClickListeners() {

    $(".start").on('click', function(){
        $(".start").removeClass("start-selected");
        $(this).addClass("start-selected");
        checkStartSelection();
    });

    $(".end").on('click', function(){
        $(this).hasClass("end-selected") ? $(this).removeClass("end-selected") : $(this).addClass("end-selected");
        checkEndSelection();
    });

    $(".route-trader").on('click', function(){
        setupTradeOptions(true);
    });

    $(".station-trader").on('click', function(){
        setupTradeOptions(false);
    });

    $(".station-start").on('click', function(){
        $(".station-start").removeClass("station-selected");
        $(this).addClass("station-selected");
    });

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
}

function checkStartSelection() {
    $.each($(".start-selected"), function(){
        var startSelected = this;
        $.each($(".end-selected"), function() {
            if(this.dataset.station === startSelected.dataset.station) {
                $(this).removeClass("end-selected");
            }
        });
    });
}

function checkEndSelection() {
    $.each($(".start-selected"), function(){
        var startSelected = this;
        $.each($(".end-selected"), function() {
            if(this.dataset.station === startSelected.dataset.station) {
                $(startSelected).removeClass("start-selected");
            }
        });
    });
}

function numberWithCommas(val) {
    while (/(\d+)(\d{3})/.test(val.toString())){
        val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}

function setAbout() {
    if (routeTrading == null) {
        $("#about")[0].onclick = function() {
            $('#howto').modal('show');
        };
    } else if (routeTrading) {
        $("#about")[0].onclick = function() {
            $('#howto-route').modal('show');
        };
    } else {
        $("#about")[0].onclick = function() {
            $('#howto-station').modal('show');
        };
    }
}

function setupCookies() {
    $("#lower-margin-threshold").val(getCookie("lower-margin-threshold"));
    $("#upper-margin-threshold").val(getCookie("upper-margin-threshold"));
    $("#volume-threshold").val(getCookie("volume-threshold"));
    $("#profit-threshold").val(getCookie("profit-threshold"));
    $("#roi-threshold").val(getCookie("roi-threshold"));
    $("#buy-threshold").val(getCookie("buy-threshold"));
    $("#weight-threshold").val(getCookie("weight-threshold"));
}

function updateCookies() {
    if(routeTrading) {
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
    } else {
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

        if($("#volume-threshold").val().length > 0 && !isNaN($("#volume-threshold").val())){
            volume_threshold = parseFloat($("#volume-threshold").val());
            setCookie("volume-threshold",volume_threshold,7);
        }else{
            setCookie("volume-threshold","");
        }
    }
}

function setupTradeOptions(tradeType){
    routeTrading = tradeType;
    $('.howto').toggle(false);

    $("#initial_choice").hide();

    setAbout();

    if(routeTrading){
        $("#route_trade").slideToggle();
        ga('send', 'event', 'Trade Style', 'Hauler', 'User Preference Campaign');
    }else{
        $("#station_trade").slideToggle();
        ga('send', 'event', 'Trade Style', 'Station Trader', 'User Preference Campaign');
    }
}

function open_popup(itemId, name, location, stationid){
    popup_table_buy.clear();
    popup_table_sell.clear();

    $("#popup_itemName").text("Trade info for " + name);
    if(isCustom){
      $("#buyLocation").text("Buy at " + startLocation);
      $("#sellLocation").text("Sell at " + location);
    }else{
      $("#buyLocation").text("Buy at " + startLocation);
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

var startCoordinates = {};
var endCoordinates = [];
var startLocation;
var endLocations = [];

function setStationTradingLocations() {
    var start_region, start_station;

    if(isCustom){
        startLocation = $("#custom_station").val();
        start_region = universeList[startLocation].region;
        start_station = universeList[startLocation].station;
    }else{
        var selectedStation = $(".station-selected")[0];
        startLocation = selectedStation.value;
        start_region = selectedStation.dataset.region;
        start_station =selectedStation.dataset.station;
    }

    endLocations = [startLocation];
    startCoordinates.region = start_region;
    startCoordinates.station = start_station;
}

function setRouteTradingLocations() {
    var start_region, start_station;

    if(isCustom){
        startLocation = $("#custom_route_start").val();
        start_region = universeList[startLocation].region;
        start_station = universeList[startLocation].station;

        $.each($(".end-selection:checked"), function(){
            var endCoordinate = {};
            endCoordinate.name = this.value;
            endCoordinate.region = universeList[endCoordinate.name].region;
            endCoordinate.station = universeList[endCoordinate.name].station;
            endLocations.push(endCoordinate.name);
            endCoordinates.push(endCoordinate);
        });
    }else{
        var selectedStation = $(".start-selected")[0];
        if(selectedStation){
            start_region = selectedStation.dataset.region;
            start_station = selectedStation.dataset.station;
            startLocation = selectedStation.value;

            $.each($(".end-selected"), function(){
                var endCoordinate = {};
                endCoordinate.region = $(this)[0].dataset.region;
                endCoordinate.station = $(this)[0].dataset.station;
                endCoordinate.name = $(this)[0].value;
                endLocations.push(endCoordinate.name);
                endCoordinates.push(endCoordinate);
            });
        }
    }

    startCoordinates.region = start_region;
    startCoordinates.station = start_station;
}

function createDataTable() {
    var buyingFooter;
    var buyingHeaderDOM = $("#buyingHeader");
    var buyingFooterDOM = $("#buyingFooter");
    var coreDOM = $("#core");
    var dataTableDOM = $("#dataTable");

    if(routeTrading) {
        dataTableDOM.append("<thead><tr>" +
            "<th>Item</th>" +
            "<th>Sell Order</th>" +
            "<th>Quantity</th>" +
            "<th>Total Cost</th>" +
            "<th>Take To</th>" +
            "<th>Buy Order</th>" +
            "<th>Quantity</th>" +
            "<th>Total Profit</th>" +
            "<th>Profit Per Item</th>" +
            "<th>R.O.I.</th>" +
            "<th>Total Volume (m3)</th>" +
            "</tr></thead>" +
            "<tbody id='tableBody'></tbody>");


        buyingHeaderDOM.text("Buying Sell Orders from " + startLocation);

        var sellingTo = "";
        $.each(endLocations, function(){
            sellingTo += this + ", ";
        });
        sellingTo = sellingTo.substring(0,sellingTo.length-2);

        var extraData = "<div id='route-to'>Selling to the Buy Orders at " + sellingTo + "</div> " +
            "ROI&nbsp;Greater&nbsp;Than&nbsp;" + threshold_roi + "% " +
            "|&nbsp;Profits&nbsp;Greater&nbsp;Than&nbsp;" + numberWithCommas(threshold_profit) + "&nbsp;ISK";

        if(threshold_cost !== 999999999999999999){
            extraData += " |&nbsp;Buy&nbsp;Costs&nbsp;Less&nbsp;Than&nbsp;" + numberWithCommas(threshold_cost) + "&nbsp;ISK";
        }
        if(threshold_weight !== 999999999999999999){
            extraData += " |&nbsp;Total&nbsp;Volume&nbsp;Under&nbsp;" + numberWithCommas(threshold_weight) + "&nbsp;m3";
        }

        buyingHeaderDOM.show();

        buyingFooter = extraData +
            "<br/>*Profit is not guaranteed. " +
            "<span class='avoidwrap'>Use at your own risk. " +
            "<span class='avoidwrap'>Verify in game that prices are accurate.</span></span>" +
            "<div class='loading'></div>";

        buyingFooterDOM.html(buyingFooter);
        buyingFooterDOM.show();
        coreDOM.slideToggle();
    } else {
        buyingHeaderDOM.text("Station Trading at " + startLocation);
        buyingHeaderDOM.show();

        buyingFooter = "Volume greater than: " + numberWithCommas(volume_threshold) +
            " | Margins between " + threshold_margin_lower + "% and " + threshold_margin_upper + "%" +
            "<div class='loading'>Loading. Please wait...</div>";
        buyingFooterDOM.html(buyingFooter);
        buyingFooterDOM.show();

        coreDOM.slideToggle();

        dataTableDOM.append("<thead><tr>" +
            "<th>Item</th>" +
            "<th>Buy Order</th>" +
            "<th>Sell Order</th>" +
            "<th>Profit Per Item</th>" +
            "<th>Margin</th>" +
            "<th>Volume</th>" +
            "</tr></thead>" +
            "<tbody id='tableBody'></tbody>");
    }
}

function execute() {
    var buyingStation;
    var endStations;

    if(routeTrading) {
        new Route(startCoordinates, endCoordinates).startRoute();
    } else {
        buyingStation = [startCoordinates.region, startCoordinates.station];
        endStations = buyingStation;
        beginRoute(buyingStation, endStations);
    }

}

function init(){
    updateCookies();

    if(routeTrading){
        setRouteTradingLocations();
    }else{
        setStationTradingLocations();
    }

    if(startLocation && startLocation.length > 0 && endLocations.length > 0){
        $(".error").hide();
        $("#selection").hide();
    }else{
        $(".error").show();
        return;
    }

    createDataTable();
    execute();
}

function displayError(){
    if(!errorShown){
        $("#connectEVE").slideToggle(true);
        errorShown = true;
    }
}

function hideError(){
    if(errorShown){
        $("#connectEVE").slideToggle();
        errorShown = false;
    }
}