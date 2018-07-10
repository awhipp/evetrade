var threshold_margin_lower = 20;
var threshold_margin_upper = 40;
var volume_threshold = 1000;
var threshold_profit = 500000;
var threshold_roi = 4;
var threshold_cost = 999999999999999999;
var threshold_weight = 999999999999999999;

var tradingStyle = null;
var errorShown = false;
var addedToStartList = [];
var addedToEndList = [];

var stationsReady = false;
var regionsReady = false;

var popup_table_buy;
var popup_table_sell;

var universeList = {};
var stationIdToName = {};

var startCoordinates = [];
var endCoordinates = [];
var startLocations = [];
var endLocations = [];


var shifted = false;
$( document ).ready(function() {
    popup_table_buy = $("#popup-table-buy").DataTable({
        "order": [[ 0, "asc" ]],
        "lengthMenu": [[10], ["10"]]
    });

    popup_table_sell = $("#popup-table-sell").DataTable({
        "order": [[ 0, "desc" ]],
        "lengthMenu": [[10], ["10"]]
    });

    onClickListeners();


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

    $(document).on('keyup keydown', function (e) {
        if(e.shiftKey) {
            $(".add-station-button").val("Add System");
            shifted = true;
        } else {
            $(".add-station-button").val("+");
            shifted = false;
        }
        return true;
    });

    setAbout();
    setupCookies();

    setupCustomDropdown();

    $(".show-amazon-offers").on("click", function(){
        $('.amazon-offers').slideToggle();
    });
});

function getTradeHubName(stationName) {
    if (stationName == "Jita IV - Moon 4 - Caldari Navy Assembly Plant") {
        return "Jita";
    } else if (stationName == "Amarr VIII (Oris) - Emperor Family Academy") {
        return "Amarr";
    } else if (stationName == "Rens VI - Moon 8 - Brutor Tribe Treasury") {
        return "Rens";
    } else if (stationName == "Dodixie IX - Moon 20 - Federation Navy Assembly Plant") {
        return "Dodixie";
    } else if (stationName == "Hek VIII - Moon 12 - Boundless Creation Factory") {
        return "Hek";
    }

    return stationName;
}

function initCompletely(domId, stationList) {
    var completelyInput = completely(document.getElementById(domId), {
        fontSize: '18px',
        fontFamily: "Roboto",
        color: '#333',
        ignoreCase: true
    });
    completelyInput.options = stationList;
    completelyInput.repaint();

    if (domId == "start_station") {
        $($("#" + domId + " input")[1]).on('keydown', function (e) {
            if (e.keyCode == 13) {
                if (shifted) {
                    var e = {};
                    e.shiftKey = true;
                    newStartStation(e);
                } else {
                    newStartStation();
                }
            }
        });
    }

    if (domId == "end_station") {
        $($("#" + domId + " input")[1]).on('keydown', function (e) {
            if (e.keyCode == 13) {
                if (shifted) {
                    var e = {};
                    e.shiftKey = true;
                    newEndStation(e);
                } else {
                    newEndStation();
                }
            }
        });
    }
}

function setupCustomDropdown() {
    var customStationsDropdown = setInterval(function () {
        if (station_ids !== undefined) {
            clearInterval(customStationsDropdown);
            var stationList = [""];

            for (var i = 0; i < station_ids.length; i++) {

                var stationName = station_ids[i][2];

                // add trade hubs for easy of use
                var tradeHubName = getTradeHubName(stationName);
                if (stationName !== tradeHubName) {
                    var lowerCaseStationName = tradeHubName.toLowerCase();

                    universeList[lowerCaseStationName] = {};
                    universeList[lowerCaseStationName].region = station_ids[i][1];
                    universeList[lowerCaseStationName].station = station_ids[i][0];
                    universeList[lowerCaseStationName].name = tradeHubName;
                    stationList.push(tradeHubName);
                }

                var lowerCaseStationName = stationName.toLowerCase();
                universeList[lowerCaseStationName] = {};
                universeList[lowerCaseStationName].region = station_ids[i][1];
                universeList[lowerCaseStationName].station = station_ids[i][0];
                universeList[lowerCaseStationName].name = stationName;
                stationList.push(stationName);

                stationIdToName[station_ids[i][0]] = stationName;

            }

            stationList.sort();

            initCompletely("custom_station", stationList);
            initCompletely("start_station", stationList);
            initCompletely("end_station", stationList);

            stationsReady = true;
        }
    }, 1000);


    var customRegionsDropdown = setInterval(function () {
        if (region_ids !== undefined) {
            clearInterval(customRegionsDropdown);
            var regionList = [""];

            for (var i = 0; i < region_ids.length; i++) {
                var regionName = region_ids[i][1];
                var lcRegionName = regionName.toLowerCase();

                universeList[lcRegionName] = {};
                universeList[lcRegionName].name = region_ids[i][1];
                universeList[lcRegionName].id = region_ids[i][0];
                regionList.push(regionName);
            }

            regionList.sort();

            initCompletely("start_region", regionList);
            initCompletely("end_region", regionList);

            regionsReady = true;
        }
    }, 1000);


    var pageReadyInterval = setInterval(function () {
        if (stationsReady && regionsReady) {
            clearInterval(pageReadyInterval);

            $(function () {
                var tabindex = 1;
                $('input').each(function () {
                    if (this.type != "hidden") {
                        var $input = $(this);
                        $input.attr("tabindex", tabindex);
                        tabindex++;
                    }
                });
            });

            $(".location-input").keyup(function (event) {
                if (event.keyCode == '9') { //9 is the tab key
                    var lastChar = parseInt(event.target.id.charAt(event.target.id.length - 1));
                    if (lastChar == 1) {
                        $("#volume-threshold").focus();
                    } else if (lastChar == 2 || lastChar == 4) {
                        $("#location-input-" + (lastChar + 1)).focus();
                    } else if (lastChar == 3) {
                        $("#profit-threshold").focus();
                    } else if (lastChar == 5) {
                        $("#region-profit-threshold").focus();
                    }
                }
            });

            $(".loadingIcon").remove();
            $("header").css("opacity", 1);
        }
    }, 1000);
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

function findAllStations(stationName) {
    var stationsInSystem = [];
    var systemName = stationName.toLowerCase();
    if(stationName.indexOf(" ") > -1) {
        systemName = stationName.substr(0, stationName.indexOf(" ")).toLowerCase();
    }

    if(systemName.length >= 3) {
        for (station in universeList) {
            if (!universeList.hasOwnProperty(station)) continue;
            if (station && station.startsWith(systemName)
                && station.indexOf(" ") > -1) {
                stationsInSystem.push(station);
            }
        }
    }
    return stationsInSystem;
}

function newStartStation(e) {
    var li = document.createElement("li");
    var inputValue = ($("#start_station input")[0].value
    && universeList[$("#start_station input")[0].value.toLowerCase()]
    && universeList[$("#start_station input")[0].value.toLowerCase()].name);

    if (inputValue.length == 0) {
        inputValue = ($("#start_station input")[1].value
        && universeList[$("#start_station input")[1].value.toLowerCase()]
        && universeList[$("#start_station input")[1].value.toLowerCase()].name);
    }

    var systems = [];
    if(e && e.shiftKey) {
        systems = findAllStations(inputValue);
        for(var i = 0; i < systems.length; i++) {
            $("#start_station input")[0].value = systems[i];
            $("#start_station input")[1].value = systems[i];
            newStartStation();
            $("#start_station input")[0].value = "";
            $("#start_station input")[1].value = "";
        }
    } else {
        var t = document.createTextNode(inputValue);

        if (addedToStartList.indexOf(inputValue) == -1) {
            addedToStartList.push(inputValue);

            li.appendChild(t);
            if (inputValue === '') {
                alert("You must choose a station!");
            } else {
                document.getElementById("custom_route_start").style.display = "block";
                document.getElementById("custom_route_start").appendChild(li);
            }

            $("#start_station input")[0].value = "";
            $("#start_station input")[1].value = "";

            var span = document.createElement("SPAN");
            var txt = document.createTextNode(" \u00D7");
            span.className = "closeStation";
            span.title = "Remove: " + inputValue;
            span.appendChild(txt);
            li.appendChild(span);
        }

        var close = document.getElementsByClassName("closeStation");
        var i;
        for (i = 0; i < close.length; i++) {
            close[i].onclick = function () {
                var data = $(this)[0].previousSibling.data;
                addedToStartList[addedToStartList.indexOf(data)] = "";
                $(this.parentElement).remove();
            }
        }
    }

}

function newEndStation(e) {
    var li = document.createElement("li");
    var inputValue = ($("#end_station input")[0].value
    && universeList[$("#end_station input")[0].value.toLowerCase()]
    && universeList[$("#end_station input")[0].value.toLowerCase()].name);
    if(inputValue.length == 0) {
        inputValue = ($("#end_station input")[1].value
        && universeList[$("#end_station input")[1].value.toLowerCase()]
        && universeList[$("#end_station input")[1].value.toLowerCase()].name);
    }

    var systems = [];
    if (e && e.shiftKey) {
        systems = findAllStations(inputValue);
        for (var i = 0; i < systems.length; i++) {
            $("#end_station input")[0].value = systems[i];
            $("#end_station input")[1].value = systems[i];
            newEndStation();
            $("#end_station input")[0].value = "";
            $("#end_station input")[1].value = "";
        }
    } else {
        var t = document.createTextNode(inputValue);

        if (addedToEndList.indexOf(inputValue) == -1) {
            addedToEndList.push(inputValue);

            li.appendChild(t);
            if (inputValue === '') {
                alert("You must choose a station!");
            } else {
                document.getElementById("custom_route_end").style.display = "block";
                document.getElementById("custom_route_end").appendChild(li);
            }

            $("#end_station input")[0].value = "";
            $("#end_station input")[1].value = "";

            var span = document.createElement("SPAN");
            var txt = document.createTextNode(" \u00D7");
            span.className = "closeStation";
            span.title = "Remove: " + inputValue;
            span.appendChild(txt);
            li.appendChild(span);
        }

        var close = document.getElementsByClassName("closeStation");
        var i;
        for (i = 0; i < close.length; i++) {
            close[i].onclick = function () {
                var data = $(this)[0].previousSibling.data;
                addedToEndList[addedToEndList.indexOf(data)] = "";
                $(this.parentElement).remove();
            }
        }
    }
}

function onClickListeners() {

    $(".end").on('click', function () {
        $(this).hasClass("end-selected") ? $(this).removeClass("end-selected") : $(this).addClass("end-selected");
    });

    $(".hauling-region-trader").on('click', function () {
        setupTradeOptions(2);
    });

    $(".hauling-station-trader").on('click', function(){
        setupTradeOptions(1);
    });

    $(".station-trader").on('click', function(){
        setupTradeOptions(0);
    });

    $(".station-start").on('click', function(){
        $(".station-start").removeClass("station-selected");
        $(this).addClass("station-selected");
    });
}

function setAbout() {
    if (tradingStyle == null) {
        $("#about")[0].onclick = function() {
            $('#howto').modal('show');
        };
    } else if (tradingStyle >= 1) {
        $("#about")[0].onclick = function() {
            $('#howto-route').modal('show');
        };
    } else if (tradingStyle == 0) {
        $("#about")[0].onclick = function() {
            $('#howto-station').modal('show');
        };
    } else if (tradingStyle == 2) {
        $("#about")[0].onclick = function () {
            $('#howto-route').modal('show');
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
    $("#region-profit-threshold").val(getCookie("profit-threshold"));
    $("#region-roi-threshold").val(getCookie("roi-threshold"));
    $("#region-buy-threshold").val(getCookie("buy-threshold"));
    $("#region-weight-threshold").val(getCookie("weight-threshold"));
}

function updateCookies() {
    if(tradingStyle == 1) {
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
    } else if (tradingStyle == 0) {
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
    } else if (tradingStyle == 2) {
        if ($("#region-profit-threshold").val().length > 0 && !isNaN($("#region-profit-threshold").val())) {
            threshold_profit = parseFloat($("#region-profit-threshold").val());
            setCookie("profit-threshold", threshold_profit, 7);
        } else {
            setCookie("profit-threshold", "");
        }
        if ($("#region-roi-threshold").val().length > 0 && !isNaN($("#region-roi-threshold").val())) {
            threshold_roi = parseFloat($("#region-roi-threshold").val());
            setCookie("roi-threshold", threshold_roi, 7);
        } else {
            setCookie("roi-threshold", "");
        }
        if ($("#region-buy-threshold").val().length > 0 && !isNaN($("#region-buy-threshold").val())) {
            threshold_cost = parseFloat($("#region-buy-threshold").val());
            setCookie("buy-threshold", threshold_cost, 7);
        } else {
            setCookie("buy-threshold", "");
        }
        if ($("#region-weight-threshold").val().length > 0 && !isNaN($("#region-weight-threshold").val())) {
            threshold_weight = parseFloat($("#region-weight-threshold").val());
            setCookie("weight-threshold", threshold_weight, 7);
        } else {
            setCookie("weight-threshold", "");
        }
    }
}

function setupTradeOptions(tradeType){
    tradingStyle = tradeType;

    $('.howto').toggle(false);

    $("#initial_choice").hide();

    setAbout();

    if(tradingStyle == 1){
        $("#route_trade").slideToggle();
        ga('send', 'event', 'Trade Style', 'Hauler - Station', 'User Preference Campaign');
    }else if(tradingStyle==0){
        $("#station_trade").slideToggle();
        ga('send', 'event', 'Trade Style', 'Station Trader', 'User Preference Campaign');
    } else if (tradingStyle == 2) {
        $("#region_trade").slideToggle();
        ga('send', 'event', 'Trade Style', 'Hauler - Region', 'User Preference Campaign');
    }
}

function open_popup(itemId, name, fromStation, toStation){
    if(!toStation.name && citadelCache[toStation.station]) {
        toStation.name = citadelCache[toStation.station];
    }

    popup_table_buy.clear();
    popup_table_sell.clear();

    var toStationName = getStationName(toStation) || toStation.name;
    var toStationId = toStation.station || toStation;

    $("#popup_itemName").text("Trade info for " + name);
    $("#buyLocation").text("Buy at " + fromStation.name);
    $("#sellLocation").text("Sell at " + toStationName);

    var buyArr = customBuy[fromStation.station][itemId];
    var sellArr = customSell[toStationId][itemId];

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

function addStart(variable) {
    if (tradingStyle == 0) {
        $("#custom_station input")[0].value = variable;
    } else if (tradingStyle == 1) {
        $("#start_station input")[0].value = variable;
        if(shifted){
            var e = {};
            e.shiftKey = true;
            newStartStation(e);
        } else {
            newStartStation();
        }
    } else if (tradingStyle == 2) {
        $("#start_region input")[0].value = variable;
    }
}

function addEnd(variable) {
    if (tradingStyle == 0) {
        return;
    } else if (tradingStyle == 1) {
        $("#end_station input")[0].value = variable;
        if (shifted) {
            var e = {};
            e.shiftKey = true;
            newEndStation(e);
        } else {
            newEndStation();
        }
    } else if (tradingStyle == 2) {
        $("#end_region input")[0].value = variable;
    }
}

function setStationTradingLocations() {
    var inputValue = $("#custom_station input")[0].value || $("#custom_station input")[1].value;
    startLocations = inputValue.toLowerCase();

    var start_region = universeList[startLocations].region;
    var start_station = universeList[startLocations].station;
    startLocations = universeList[startLocations].name;

    startCoordinates.region = start_region;
    startCoordinates.station = start_station;
}

function setRouteRegionTradingLocations() {
    var inputValue = $("#start_region input")[0].value || $("#start_region input")[1].value;
    startLocations = inputValue.toLowerCase();

    startCoordinates = universeList[startLocations];
    startLocations = startCoordinates.name;

    inputValue = $("#end_region input")[0].value || $("#end_region input")[1].value;
    endLocations = inputValue.toLowerCase();

    endCoordinates = universeList[endLocations];
    endLocations = endCoordinates.name;
}

function getCoordinatesFor(listId, inputId) {
    var coordinates = [];
    var existingPoints = [];
    var universeItem;

    $.each($(listId + " > li"), function () {
        var coordinate = {};
        var unrefined = $(this).text();
        var stationLocation = unrefined.substring(0, unrefined.length - 2).toLowerCase();

        universeItem = universeList[stationLocation];

        coordinate.region = universeItem.region;
        coordinate.station = universeItem.station;
        coordinate.name = universeItem.name;

        if (existingPoints.indexOf(coordinate.station) == -1) {
            coordinates.push(coordinate);
            existingPoints.push(coordinate.station);
        }
    });

    if($(inputId + " input")[0].value) {
        var inputValue = $(inputId + " input")[0].value || $(inputId + " input")[1].value;
        universeItem = universeList[inputValue.toLowerCase()];

        if (universeItem) {
            var coordinate = {};
            coordinate.region = universeItem.region;
            coordinate.station = universeItem.station;
            coordinate.name = universeItem.name;

            if (existingPoints.indexOf(coordinate.station) == -1) {
                coordinates.push(coordinate);
            }
        }
    }

    return coordinates;
}

function setRouteStationTradingLocations() {

    startCoordinates = getCoordinatesFor("#custom_route_start", "#start_station");

    if(startCoordinates.length > 0) {
        startLocations = [];
        for (var i = 0; i < startCoordinates.length; i++) {
            startLocations.push(startCoordinates[i].name);
        }

        endCoordinates = getCoordinatesFor("#custom_route_end", "#end_station");
        for (i = 0; i < endCoordinates.length; i++) {
            endLocations.push(endCoordinates[i].name);
        }
    }
}

function execute() {
    if(tradingStyle == 1) {
        routes = [];
        for(var i = 0; i < startCoordinates.length; i++) {
            new Route(startCoordinates[i], endCoordinates).startRoute();
        }
    } else if (tradingStyle == 0) {
        new Station(startCoordinates).startStation();
    } else if (tradingStyle == 2) {
        new Region(startCoordinates, endCoordinates).startRoute();
    }

}

function init(){
    $(".tableLoadingIcon").show();
    updateCookies();

    if(tradingStyle == 1){
        setRouteStationTradingLocations();
    } else if (tradingStyle == 0) {
        setStationTradingLocations();
    } else {
        setRouteRegionTradingLocations();
    }

    var startCondition = (startLocations && startLocations.length > 0);
    var endCondition = (tradingStyle>=1 && endLocations.length > 0) || tradingStyle==0;

    if(startCondition && endCondition){
        $(".error").hide();
        $("#selection").hide();
    }else{
        $(".error").show();
        return;
    }

    createTradeHeader();
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