var threshold_margin_lower = 20;
var threshold_margin_upper = 40;
var volume_threshold = 1000;
var threshold_profit = 100000;
var threshold_roi = 1;
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

var startCoordinates = [];
var endCoordinates = [];
var startLocations = [];
var endLocations = [];

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

    setAbout();
    setupCookies();

    setupCustomDropdown();
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
                newStartStation();
            }
        });
    }

    if (domId == "end_station") {
        $($("#" + domId + " input")[1]).on('keydown', function (e) {
            if (e.keyCode == 13) {
                newEndStation();
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

function newStartStation() {
    var li = document.createElement("li");
    var inputValue = ($("#start_station input")[0].value && universeList[$("#start_station input")[0].value.toLowerCase()].name)
        || ($("#start_station input")[1].value && universeList[$("#start_station input")[1].value.toLowerCase()].name);
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

function newEndStation() {
    var li = document.createElement("li");
    var inputValue = ($("#end_station input")[0].value && universeList[$("#end_station input")[0].value.toLowerCase()].name)
        || ($("#end_station input")[0].value && universeList[$("#end_station input")[1].value.toLowerCase()].name);
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
    popup_table_buy.clear();
    popup_table_sell.clear();

    $("#popup_itemName").text("Trade info for " + name);
    $("#buyLocation").text("Buy at " + fromStation.name);
    $("#sellLocation").text("Sell at " + getStationName(toStation));

    var buyArr = customBuy[fromStation.station][itemId];
    var sellArr = customSell[toStation][itemId];

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

function setStationTradingLocations() {
    startLocations = $("#custom_station input")[0].value.toLowerCase();

    var start_region = universeList[startLocations].region;
    var start_station = universeList[startLocations].station;
    startLocations = universeList[startLocations].name;

    startCoordinates.region = start_region;
    startCoordinates.station = start_station;
}

function setRouteRegionTradingLocations() {
    startLocations = $("#start_region input")[0].value.toLowerCase();

    startCoordinates = universeList[startLocations];
    startLocations = startCoordinates.name;

    endLocations = $("#end_region input")[0].value.toLowerCase();

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
        universeItem = universeList[$(inputId + " input")[0].value.toLowerCase()];

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

function createDataTable() {
    var buyingFooter;
    var buyingHeaderDOM = $("#buyingHeader");
    var buyingFooterDOM = $("#buyingFooter");
    var coreDOM = $("#core");
    var dataTableDOM = $("#dataTable");

    if(tradingStyle == 1 || tradingStyle == 2) {
        dataTableDOM.append("<thead><tr>" +
                "<th></th>" +
            "<th>Buy Item</th>" +
            "<th>From</th>" +
            "<th>Quantity</th>" +
            "<th>At Sell Price</th>" +
            "<th>Total Cost</th>" +
            "<th>Take To</th>" +
            "<th>At Buy Price</th>" +
            "<th>Total Profit</th>" +
            "<th>Profit Per Item</th>" +
            "<th>R.O.I.</th>" +
            "<th>Total Volume (m3)</th>" +
            "</tr></thead>" +
            "<tbody id='tableBody'></tbody>");


        var buyingFrom = "";
        var sellingTo = "";
        if (tradingStyle == 1) {
            $.each(startLocations, function () {
                buyingFrom += this + ", ";
            });
            buyingFrom = buyingFrom.substring(0, buyingFrom.length - 2);

            $.each(endLocations, function () {
                sellingTo += this + ", ";
            });
            sellingTo = sellingTo.substring(0, sellingTo.length - 2);
        } else {
            buyingFrom = startLocations;
            sellingTo = endLocations;
        }

        buyingHeaderDOM.text("Buying Sell Orders from " + buyingFrom);

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
            "<br/><hr/>" +
            "<div class='loading'></div>";

        buyingFooterDOM.html(buyingFooter);
        buyingFooterDOM.show();

        coreDOM.show();

        $(".deal_note").show();
        $("#core input").css('display','none');
        $("#core a").css('display','none');
        $("#show-hide").hide();

        // sorting on margin index
        var dt = dataTableDOM.DataTable({
            "order": [[ 8, "desc" ]],
            "lengthMenu": [[-1], ["All"]],
            responsive: true,
            dom: 'Bfrtip',
            buttons: [
                'copy', 'csv', 'excel', 'pdf'
            ],
            "columnDefs": [{
                "targets": 0,
                "orderable": false
            }]
        });

        // for each column in header add a togglevis button in the div
        var li_counter = 0;
        $("#dataTable thead th").each( function ( i ) {
            var name = dt.column( i ).header();
            var spanelt = document.createElement( "button" );

            var initial_removed = [];

            spanelt.innerHTML = name.innerHTML;

            $(spanelt).addClass("colvistoggle");
            $(spanelt).addClass("btn");
            $(spanelt).addClass("btn-default");
            $(spanelt).attr("colidx",i);    // store the column idx on the button

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

        // ADD SLIDEDOWN ANIMATION TO DROPDOWN //
        $('.dropdown').on('show.bs.dropdown', function(e){
            $(this).find('.dropdown-menu').first().stop(true, true).slideDown();
        });

        // ADD SLIDEUP ANIMATION TO DROPDOWN //
        $('.dropdown').on('hide.bs.dropdown', function(e){
            $(this).find('.dropdown-menu').first().stop(true, true).slideUp();
        });

        $('#dataTable tbody').on('mousedown', 'tr', function (event) {
            var investigateButton = (event.target.id.indexOf("investigate") >= 0
            || (event.target.children[0] && event.target.children[0].id.indexOf("investigate") >= 0)
            || (event.target.classList.contains("fa")));

            if(event.which === 1 && !investigateButton){
                if(!$(this).hasClass("row-selected")){
                    $(this).addClass("row-selected");
                }else{
                    $(this).removeClass("row-selected");
                }
            }
        } );

        $("label > input").addClass("form-control").addClass("minor-text");
        $("label > input").attr("placeholder", "Search Results...");
    } else if (tradingStyle == 0) {
        buyingHeaderDOM.text("Station Trading at " + startLocations);
        buyingHeaderDOM.show();

        buyingFooter = "Volume greater than: " + numberWithCommas(volume_threshold) +
            " | Margins between " + threshold_margin_lower + "% and " + threshold_margin_upper + "%" +
            "<div class='loading'>Loading. Please wait...</div>";
        buyingFooterDOM.html(buyingFooter);
        buyingFooterDOM.show();

        coreDOM.show();
        $(".deal_note").show();
        $("#show-hide").hide();

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
    if(tradingStyle == 1) {
        routes = [];
        for(var i = 0; i < startCoordinates.length; i++) {
            new Route(startCoordinates[i], endCoordinates).startRoute();
        }
    } else if (tradingStyle == 0) {
        new Station(startCoordinates).startStation();
    } else if (tradingStyle == 2) {
        console.log("From: ");
        console.log(startCoordinates);
        console.log("To: ");
        console.log(endCoordinates);
        new Region(startCoordinates, endCoordinates).startRoute();
    }

}

function init(){

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