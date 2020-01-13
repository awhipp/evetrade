var sstLowerMargin;
var sstUpperMargin;
var sstMinVolume;
var thresholdProfit;
var thresholdRoi;
var thresholdCost;
var thresholdWeight;
var salesTax;
var sstBrokerFee;

var tradingStyle = null;
var errorShown = false;
var addedToStartList = [];
var addedToEndList = [];

var stationsReady = false;
var regionsReady = false;

var popupTableBuy;
var popupTableSell;

var universeList = {};
var stationIdToName = {};

var startCoordinates = [];
var endCoordinates = [];
var startLocations = [];
var endLocations = [];

var shifted = false;

var urlParams;

/**
* Once all resources are loaded we need to setup all the information
* > onClickListeners
* > ensuring numeric input is only entered
* > Setup the about, cookies, and custom station dropdowns
*/
$( document ).ready(function() {
    popupTableBuy = $("#popup_table_buy").DataTable({
        "order": [[ 0, "asc" ]],
        "lengthMenu": [[10], ["10"]]
    });

    popupTableSell = $("#popup_table_sell").DataTable({
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

    $.fn.isInViewport = function () {
        var elementTop = $(this).offset().top;
        var elementBottom = elementTop + $(this).outerHeight();
        var viewportTop = $(window).scrollTop();
        var viewportBottom = viewportTop + $(window).height();
        return elementBottom > viewportTop && elementTop < viewportBottom;
    };

    $(window).on("resize scroll",function () {
        if($(".branding").isInViewport()) {
            $(".promo-item").css("transform", "translateY(0)");
        } else {
            $(".promo-item").css("transform", "translateY(-5em)");
        }
    });

    gtag('event', 'Browser Location Tracking', {
        'event_category': 'URI',
        'event_label': window.location.href,
        'value': 1
    });

    urlParams = (new URL(window.location.href)).searchParams;
    switch(urlParams.get("trade")) {
        case "sst":
            setupTradeOptions(0);
            break;
        case "s2s":
            setupTradeOptions(1);
            break;
        case "r2r":
            setupTradeOptions(2);
    }
    //window.history.replaceState(null, null, window.location.pathname);
    
    ["#r2r_sales_tax", "#s2s_sales_tax", "#sst_sales_tax"].forEach(function(id) {
        if ($(id).val() === "other") {
            $(id + "_in").show();
        }
    });
});

/**
* Mapping function to shortened names of these popular stations
*/
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

/**
* Initializes completely which is the suggestion engine behind the inputs
*/
function initCompletely(domId, stationList) {
    var completelyInput = completely(document.getElementById(domId), {
        fontSize: '18px',
        fontFamily: "Roboto",
        color: '#333',
        ignoreCase: true
    });
    completelyInput.options = stationList;
    completelyInput.repaint();

    if (domId == "s2s_start_station") {
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

    if (domId == "s2s_end_station") {
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

/**
* Custom station dropdown initializer
*/
function setupCustomDropdown() {
    var customStationsDropdown = setInterval(function () {
        if (station_ids !== undefined) {
            clearInterval(customStationsDropdown);
            var stationList = [""];

            for (var i = 0; i < station_ids.length; i++) {

                var stationName = station_ids[i].stationName;

                // add trade hubs for easy of use
                var tradeHubName = getTradeHubName(stationName);
                if (stationName !== tradeHubName) {
                    var lowerCaseStationName = tradeHubName.toLowerCase();

                    universeList[lowerCaseStationName] = {};
                    universeList[lowerCaseStationName].region = station_ids[i].regionID;
                    universeList[lowerCaseStationName].station = station_ids[i].stationID;
                    universeList[lowerCaseStationName].system = station_ids[i].solarSystemID;
                    universeList[lowerCaseStationName].name = tradeHubName;
                    stationList.push(tradeHubName);
                }

                var lowerCaseStationName = stationName.toLowerCase();
                universeList[lowerCaseStationName] = {};
                universeList[lowerCaseStationName].region = station_ids[i].regionID;
                universeList[lowerCaseStationName].station = station_ids[i].stationID;
                universeList[lowerCaseStationName].system = station_ids[i].solarSystemID;
                universeList[lowerCaseStationName].name = stationName;
                stationList.push(stationName);

                stationIdToName[station_ids[i].stationID] = stationName;

            }

            stationList.sort();

            initCompletely("sst_start_station", stationList);
            initCompletely("s2s_start_station", stationList);
            initCompletely("s2s_end_station", stationList);

            if($("#r2r_route_preference").val() == null) {
              $("#r2r_route_preference").val("shortest");
            }

            if($("#r2r_min_security").val() == null) {
              $("#r2r_min_security").val("null");
            }

            if($("#s2s_buying_type").val() == null) {
              $("#s2s_buying_type").val("sell");
            }

            if($("#s2s_selling_type").val() == null) {
              $("#s2s_selling_type").val("buy");
            }

            stationsReady = true;
        }
    }, 1000);

    var customRegionsDropdown = setInterval(function () {
        if (region_ids !== undefined) {
            clearInterval(customRegionsDropdown);
            var regionList = [""];

            for (var i = 0; i < region_ids.length; i++) {
                if (region_ids[i].regionID < 11000000) { // Avoid special regions
                    var regionName = region_ids[i].regionName;
                    var lcRegionName = regionName.toLowerCase();

                    universeList[lcRegionName] = {};
                    universeList[lcRegionName].name = region_ids[i].regionName;
                    universeList[lcRegionName].id = region_ids[i].regionID;
                    regionList.push(regionName);
                }
            }

            regionList.sort();

            initCompletely("r2r_start_region", regionList);
            initCompletely("r2r_end_region", regionList);

            if($("#r2r_buying_type").val() == null) {
              $("#r2r_buying_type").val("sell");
            }

            if($("#r2r_selling_type").val() == null) {
              $("#r2r_selling_type").val("buy");
            }

            regionsReady = true;
        }
    }, 1000);

    var pageReadyInterval = setInterval(function () {
        if (stationsReady && regionsReady) {
            checkDirection();
            clearInterval(pageReadyInterval);

            $(function () {
                var tabIndex = 1;
                $('input').each(function () {
                    if (this.type != "hidden") {
                        var $input = $(this);
                        $input.attr("tabindex", tabIndex);
                        tabIndex++;
                    }
                });
            });

            $(".location-input").keyup(function (event) {
                if (event.keyCode == '9') { //9 is the tab key
                    var lastChar = parseInt(event.target.id.charAt(event.target.id.length - 1));
                    if (lastChar == 1) {
                        $("#sst_min_volume").focus();
                    } else if (lastChar == 2 || lastChar == 4) {
                        $("#location-input-" + (lastChar + 1)).focus();
                    } else if (lastChar == 3) {
                        $("#s2s_min_profit").focus();
                    } else if (lastChar == 5) {
                        $("#r2r_min_profit").focus();
                    }
                }
            });

            $(".loadingIcon").remove();
            $(".core-section").css("opacity", 1);
        }
    }, 1000);
}

/**
* Starts with function for Strings. Not accessible in IE.
*/
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.indexOf(searchString, position) === position;
    };
}

/**
* Finds all stations in a given system with this name.
*/
function findAllStations(stationName) {
    var stationsInSystem = [];
    var systemID = universeList[stationName.toLowerCase()].system;
    for (station in universeList) {
        if (!universeList.hasOwnProperty(station)) continue;
        if (universeList[station].system == systemID
            && station.indexOf(" ") > -1) {
            stationsInSystem.push(station);
        }
    }
    return stationsInSystem;
}

/**
* Adds a start station under the input for station haul
*/
function newStartStation(e) {
    var li = document.createElement("li");
    var inputValue = ($("#s2s_start_station input")[0].value
    && universeList[$("#s2s_start_station input")[0].value.toLowerCase()]
    && universeList[$("#s2s_start_station input")[0].value.toLowerCase()].name);

    if (inputValue.length == 0) {
        inputValue = ($("#s2s_start_station input")[1].value
        && universeList[$("#s2s_start_station input")[1].value.toLowerCase()]
        && universeList[$("#s2s_start_station input")[1].value.toLowerCase()].name);
    }

    var systems = [];
    if(e && e.shiftKey) {
        systems = findAllStations(inputValue);
        for(var i = 0; i < systems.length; i++) {
            $("#s2s_start_station input")[0].value = systems[i];
            $("#s2s_start_station input")[1].value = systems[i];
            newStartStation();
            $("#s2s_start_station input")[0].value = "";
            $("#s2s_start_station input")[1].value = "";
        }
    } else {
        var t = document.createTextNode(inputValue);

        if (addedToStartList.indexOf(inputValue) == -1) {
            addedToStartList.push(inputValue);

            li.appendChild(t);
            if (inputValue === '') {
                alert("You must choose a station!");
            } else {
                document.getElementById("s2s_route_start").style.display = "block";
                document.getElementById("s2s_route_start").appendChild(li);
            }

            $("#s2s_start_station input")[0].value = "";
            $("#s2s_start_station input")[1].value = "";

            var span = document.createElement("SPAN");
            var txt = document.createTextNode(" \u00D7");
            span.className = "s2sCloseStartStation";
            span.title = "Remove: " + inputValue;
            span.appendChild(txt);
            li.appendChild(span);
        }

        var close = document.getElementsByClassName("s2sCloseStartStation");
        var i;
        for (i = 0; i < close.length; i++) {
            close[i].onclick = function () {
                var data = $(this)[0].previousSibling.data;
                addedToStartList.splice(addedToStartList.indexOf(data), 1);
                $(this.parentElement).remove();
            }
        }
    }

}

/**
* Adds an end station under the input for station haul
*/
function newEndStation(e) {
    var li = document.createElement("li");
    var inputValue = ($("#s2s_end_station input")[0].value
    && universeList[$("#s2s_end_station input")[0].value.toLowerCase()]
    && universeList[$("#s2s_end_station input")[0].value.toLowerCase()].name);
    if(inputValue.length == 0) {
        inputValue = ($("#s2s_end_station input")[1].value
        && universeList[$("#s2s_end_station input")[1].value.toLowerCase()]
        && universeList[$("#s2s_end_station input")[1].value.toLowerCase()].name);
    }

    var systems = [];
    if (e && e.shiftKey) {
        systems = findAllStations(inputValue);
        for (var i = 0; i < systems.length; i++) {
            $("#s2s_end_station input")[0].value = systems[i];
            $("#s2s_end_station input")[1].value = systems[i];
            newEndStation();
            $("#s2s_end_station input")[0].value = "";
            $("#s2s_end_station input")[1].value = "";
        }
    } else {
        var t = document.createTextNode(inputValue);

        if (addedToEndList.indexOf(inputValue) == -1) {
            addedToEndList.push(inputValue);

            li.appendChild(t);
            if (inputValue === '') {
                alert("You must choose a station!");
            } else {
                document.getElementById("s2s_route_end").style.display = "block";
                document.getElementById("s2s_route_end").appendChild(li);
            }

            $("#s2s_end_station input")[0].value = "";
            $("#s2s_end_station input")[1].value = "";

            var span = document.createElement("SPAN");
            var txt = document.createTextNode(" \u00D7");
            span.className = "s2sCloseEndStation";
            span.title = "Remove: " + inputValue;
            span.appendChild(txt);
            li.appendChild(span);
        }

        var close = document.getElementsByClassName("s2sCloseEndStation");
        var i;
        for (i = 0; i < close.length; i++) {
            close[i].onclick = function () {
                var data = $(this)[0].previousSibling.data;
                addedToEndList.splice(addedToEndList.indexOf(data), 1);
                $(this.parentElement).remove();
            }
        }
    }
}

/**
* Enables all of the onclick listeners in one function
*/
function onClickListeners() {

    $(".end").on('click', function () {
        $(this).hasClass("end-selected") ? $(this).removeClass("end-selected") : $(this).addClass("end-selected");
    });

    $(".region-hauling").on('click', function () {
        setupTradeOptions(2);
    });

    $(".station-hauling").on('click', function(){
        setupTradeOptions(1);
    });

    $(".station-trading").on('click', function(){
        setupTradeOptions(0);
    });

    $(".station-start").on('click', function(){
        $(".station-start").removeClass("station-selected");
        $(this).addClass("station-selected");
    });

    $(".directionChange").on('change', function(){
        checkDirection();
    });

    ["sst", "s2s", "r2r"].forEach(function(id) {
        $("#" + id).on('click', function(){
            window.location = window.location.pathname + "?trade=" + id;
        });
    });

    ["#r2r_sales_tax", "#s2s_sales_tax", "#sst_sales_tax"].forEach(function(id) {
        $(id).on('change', function() {
            if ($(id).val() === "other") {
                $(id + "_in").show();
            } else {
                $(id + "_in").hide();
            }
        });
    });
}

function checkDirection() {
    var s2sBuyingType = $("#s2s_buying_type").val();
    var s2sSellingType = $("#s2s_selling_type").val();

    var r2rBuyingType = $("#r2r_buying_type").val();
    var r2rSellingType = $("#r2r_selling_type").val();

    if(s2sBuyingType == "sell" && s2sSellingType == "buy") {
      $("#direction_warning_station").hide();
    } else {
      $("#direction_warning_station > .startDirection").text(s2sBuyingType);
      $("#direction_warning_station > .endDirection").text(s2sSellingType);
      $("#direction_warning_station").show();
    }

    if(r2rBuyingType == "sell" && r2rSellingType == "buy") {
      $("#direction_warning_region").hide();
    } else {
      $("#direction_warning_region > .startDirection").text(r2rBuyingType);
      $("#direction_warning_region > .endDirection").text(r2rSellingType);
      $("#direction_warning_region").show();
    }
}

/**
* Based on the page the user is on, this function updates the about.
*/
function setAbout() {
    if (tradingStyle == null) {
        $("#about")[0].onclick = function() {
            $('#howto').modal('show');
        };
    } else if (tradingStyle == STATION_HAUL || tradingStyle == REGION_HAUL) {
        $("#about")[0].onclick = function() {
            $('#howto_route').modal('show');
        };
    } else if (tradingStyle == STATION_TRADE) {
        $("#about")[0].onclick = function() {
            $('#howto_station').modal('show');
        };
    }
}

/**
* Sets up cookies automatically using the jquery library input store.
*/
function setupCookies() {
  var formInputs = [
      "sst_lower_margin", "sst_upper_margin", "sst_min_volume",
      "s2s_min_profit", "s2s_min_roi", "s2s_max_budget", "s2s_max_cargo",
      "r2r_route_preference", "r2r_include_citadels", "r2r_min_security",
      "r2r_max_budget", "r2r_min_roi", "r2r_max_cargo",
      "r2r_min_profit", "s2s_buying_type", "s2s_selling_type",
      "r2r_buying_type", "r2r_selling_type", "sst_sales_tax", "sst_sales_tax_in",
      "r2r_sales_tax", "r2r_sales_tax_in", "s2s_sales_tax", "s2s_sales_tax_in",
      "sst_broker_fee"
  ];

  for(var i = 0; i < formInputs.length; i++) {
    $("#" + formInputs[i]).inputStore();
  }
}

/**
* Provides the user with the proper form on click.
*/
function setupTradeOptions(tradeType){
    tradingStyle = tradeType;

    $('.howto').toggle(false);

    $("#initial_choice").hide();

    $("#trade_menu").show();

    setAbout();

    var eventLabel = '';
    if(tradingStyle == STATION_HAUL){
        $("#station_haul").slideToggle();
        eventLabel = "Hauler - Station";
    }else if(tradingStyle == STATION_TRADE){
        $("#station_trade").slideToggle();
        eventLabel = "Station Trader";
    } else if (tradingStyle == REGION_HAUL) {
        $("#region_haul").slideToggle();
        eventLabel = "Hauler - Region";
    }

    if (urlParams.has("start")) setupBookmark(urlParams);

    gtag('event', 'User Preference Campaign', {
        'event_category': 'Trade Style',
        'event_label': eventLabel,
        'value': 1
    });
}

/**
* This is the comparison modal when a user wants
* more indepth information about a trade
*/
function open_popup(itemId, name, fromStation, toStation){
    if(!toStation.name && citadelCache[toStation.station]) {
        if(citadelCache[toStation.station] && citadelCache[toStation.station].name) {
            toStation.name = citadelCache[toStation.station].name + "*";
        } else {
            toStation.name = citadelCache[toStation.station] + "*";
        }
    }

    popupTableBuy.clear();
    popupTableSell.clear();

    var toStationName = getStationName(toStation) || toStation.name;
    var toStationId = toStation.station || toStation;

    $("#popup_itemName").text("Trade info for " + name);

    var buyArr = [];
    var sellArr = [];

    if(orderTypeStart == "buy") {
      buyArr = customSell[fromStation.station][itemId];
    } else {
      buyArr = customBuy[fromStation.station][itemId];
    }
    if(orderTypeEnd == "buy") {
      sellArr = customSell[toStationId][itemId];
    } else {
      sellArr = customBuy[toStationId][itemId];
    }

    for(var i = 0; i < buyArr.length; i++){
        if(buyArr[i]){
            $('#popup_table_buy').dataTable().fnAddData([numberWithCommas(buyArr[i][0].toFixed(2)), numberWithCommas(buyArr[i][1].toFixed())]);
        }
    }

    for(var i = 0; i < sellArr.length; i++){
        if(sellArr[i]){
            $('#popup_table_sell').dataTable().fnAddData([numberWithCommas(sellArr[i][0].toFixed(2)), numberWithCommas(sellArr[i][1].toFixed())]);
        }
    }

    $('#popup').modal('show');
    popupTableBuy.draw();
    popupTableSell.draw();


    if(orderTypeStart == "buy") {
      $("#buy_location").text("Buy Orders at " + fromStation.name);
      $("#popup_table_buy th:first-of-type")[0].textContent = "Buy Orders";
      $('#popup_table_buy').dataTable().fnSort( [0,'desc'] );
    } else {
      $("#buy_location").text("Sell Orders at " + fromStation.name);
      $("#popup_table_buy th:first-of-type")[0].textContent = "Sell Orders";
      $('#popup_table_buy').dataTable().fnSort( [0,'asc'] );
    }
    if(orderTypeEnd == "buy") {
      $("#sell_location").text("Buy Orders at " + toStationName);
      $("#popup_table_sell th:first-of-type")[0].textContent = "Buy Orders";
      $('#popup_table_sell').dataTable().fnSort( [0,'desc'] );
    } else {
      $("#sell_location").text("Sell Orders at " + toStationName);
      $("#popup_table_sell th:first-of-type")[0].textContent = "Sell Orders";
      $('#popup_table_sell').dataTable().fnSort( [0,'asc'] );
    }
}

/**
* Gets the start coordinates based on the style
*/
function addStart(variable) {
    if (tradingStyle == STATION_TRADE) {
        $("#sst_start_station input")[0].value = variable;
        $("#sst_start_station input")[1].value = variable;
    } else if (tradingStyle == STATION_HAUL) {
        $("#s2s_start_station input")[0].value = variable;
        $("#s2s_start_station input")[1].value = variable;
        if(shifted){
            var e = {};
            e.shiftKey = true;
            newStartStation(e);
        } else {
            newStartStation();
        }
    } else if (tradingStyle == REGION_HAUL) {
        $("#r2r_start_region input")[0].value = variable;
        $("#r2r_start_region input")[1].value = variable;
    }
}

/**
* Gets the end coordinates based on the style
*/
function addEnd(variable) {
    if (tradingStyle == STATION_TRADE) {
        return;
    } else if (tradingStyle == STATION_HAUL) {
        $("#s2s_end_station input")[0].value = variable;
        $("#s2s_end_station input")[1].value = variable;
        if (shifted) {
            var e = {};
            e.shiftKey = true;
            newEndStation(e);
        } else {
            newEndStation();
        }
    } else if (tradingStyle == REGION_HAUL) {
        $("#r2r_end_region input")[0].value = variable;
        $("#r2r_end_region input")[1].value = variable;
    }
}

/**
* Gets the station trading coordinates based on the input
*/
function setStationTradingLocations() {
    var inputValue = $("#sst_start_station input")[0].value || $("#sst_start_station input")[1].value;
    startLocations = inputValue.toLowerCase();

    var r2r_start_region = universeList[startLocations].region;
    var s2s_start_station = universeList[startLocations].station;
    startLocations = universeList[startLocations].name;

    startCoordinates.region = r2r_start_region;
    startCoordinates.station = s2s_start_station;
}

/**
* Gets the region trading coordinates based on the input
*/
function setRouteRegionTradingLocations() {
    var inputValue = $("#r2r_start_region input")[0].value || $("#r2r_start_region input")[1].value;
    startLocations = inputValue.toLowerCase();

    startCoordinates = universeList[startLocations];
    startLocations = startCoordinates.name;

    inputValue = $("#r2r_end_region input")[0].value || $("#r2r_end_region input")[1].value;
    endLocations = inputValue.toLowerCase();

    endCoordinates = universeList[endLocations];
    endLocations = endCoordinates.name;
}

/**
* Leverages the cached values to determine all the
* region, station, and name information required for a query
*/
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

/**
* Sets up the start and end locations for a given form input
*/
function setRouteStationTradingLocations() {
    startCoordinates = getCoordinatesFor("#s2s_route_start", "#s2s_start_station");

    if(startCoordinates.length > 0) {
        startLocations = [];
        for (var i = 0; i < startCoordinates.length; i++) {
            startLocations.push(startCoordinates[i].name);
        }

        endCoordinates = getCoordinatesFor("#s2s_route_end", "#s2s_end_station");
        for (i = 0; i < endCoordinates.length; i++) {
            endLocations.push(endCoordinates[i].name);
        }
    }
}

/**
* Executes the queries by forming the appropriate class prototypes
*/
function execute() {
    if(tradingStyle == STATION_HAUL) {
        routes = [];
        for(var i = 0; i < startCoordinates.length; i++) {
            new Route(startCoordinates[i], endCoordinates).startRoute();
        }
    } else if (tradingStyle == STATION_TRADE) {
        new Station(startCoordinates).startStation();
    } else if (tradingStyle == REGION_HAUL) {
        new Region(startCoordinates, endCoordinates).startRoute();
    }

}

/**
* The initalizer function that runs when a form is submitted
*/
function init(style){
    tradingStyle = style;
    try {
        if(tradingStyle == STATION_TRADE){
            if ($("#sst_sales_tax").val() === "other") {
                salesTax = setDefaultVal("sst_sales_tax_in");
            } else {
                salesTax = setDefaultVal("sst_sales_tax");
            }
            sstBrokerFee = setDefaultVal("sst_broker_fee");
            sstLowerMargin = setDefaultVal("sst_lower_margin");
            sstUpperMargin = setDefaultVal("sst_upper_margin");
            sstMinVolume = setDefaultVal("sst_min_volume");
            setStationTradingLocations();
        } else if (tradingStyle == STATION_HAUL) {
            if ($("#s2s_sales_tax").val() === "other") {
                salesTax = setDefaultVal("s2s_sales_tax_in");
            } else {
                salesTax = setDefaultVal("s2s_sales_tax");
            }
            thresholdProfit = setDefaultVal("s2s_min_profit");
            thresholdRoi = setDefaultVal("s2s_min_roi");
            thresholdCost = setDefaultVal("s2s_max_budget");
            thresholdWeight = setDefaultVal("s2s_max_cargo");
            setRouteStationTradingLocations();
        } else if (tradingStyle == REGION_HAUL) {
            if ($("#r2r_sales_tax").val() === "other") {
                salesTax = setDefaultVal("r2r_sales_tax_in");
            } else {
                salesTax = setDefaultVal("r2r_sales_tax");
            }
            thresholdProfit = setDefaultVal("r2r_min_profit");
            thresholdRoi = setDefaultVal("r2r_min_roi");
            thresholdCost = setDefaultVal("r2r_max_budget");
            thresholdWeight = setDefaultVal("r2r_max_cargo");
            setRouteRegionTradingLocations();
        }
        createBookmarks();
        setCopyWording();
        setTitle();

      var startCondition = (startLocations && startLocations.length > 0);
      var endCondition = (
        (tradingStyle==STATION_HAUL || tradingStyle==REGION_HAUL) && endLocations.length > 0
      ) || tradingStyle==STATION_TRADE;

      if(startCondition && endCondition){
          $(".error").slideToggle(false);
          $("#selection").hide();
      }else{
          $(".error").slideToggle(true);
          return false;
      }

      $(".tableLoadingIcon").show();
      createTradeHeader();
      execute();
    } catch(err) {
        $(".error").slideToggle(true);
        console.log(err);
        return false;
    }
    return false;
}
