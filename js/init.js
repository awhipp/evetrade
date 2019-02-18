var threshold_margin_lower;
var threshold_margin_upper;
var volume_threshold;
var threshold_profit;
var threshold_roi;
var threshold_cost;
var threshold_weight;

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

/**
* Once all resources are loaded we need to setup all the information
* > onClickListeners
* > ensuring numeric input is only entered
* > Setup the about, cookies, and custom station dropdowns
*/
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

/**
* Custom station dropdown initializer
*/
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

            if($("#route-preference").val() == null) {
              $("#route-preference").val("shortest");
            }

            if($("#security-threshold").val() == null) {
              $("#security-threshold").val("NULL");
            }

            if($("#buying-type-station").val() == null) {
              $("#buying-type-station").val("SELL");
            }

            if($("#selling-type-station").val() == null) {
              $("#selling-type-station").val("BUY");
            }

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

            if($("#buying-type-region").val() == null) {
              $("#buying-type-region").val("SELL");
            }

            if($("#selling-type-region").val() == null) {
              $("#selling-type-region").val("BUY");
            }

            regionsReady = true;
        }
    }, 1000);

    var pageReadyInterval = setInterval(function () {
        if (stationsReady && regionsReady) {
            checkDirection();
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

/**
* Adds a start station under the input for station haul
*/
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

/**
* Adds an end station under the input for station haul
*/
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

/**
* Enables all of the onclick listeners in one function
*/
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

    $(".directionChange").on('change', function(){
        checkDirection();
    });
}

function checkDirection() {
    var stationStartType = $("#buying-type-station").val();
    var stationEndType = $("#selling-type-station").val();

    var regionStartType = $("#buying-type-region").val();
    var regionEndType = $("#selling-type-region").val();

    if(stationStartType == "SELL" && stationEndType == "BUY") {
      $("#directionWarningStation").hide();
    } else {
      $("#directionWarningStation > .startDirection").text(stationStartType);
      $("#directionWarningStation > .endDirection").text(stationEndType);
      $("#directionWarningStation").show();
    }

    if(regionStartType == "SELL" && regionEndType == "BUY") {
      $("#directionWarningRegion").hide();
    } else {
      $("#directionWarningRegion > .startDirection").text(regionStartType);
      $("#directionWarningRegion > .endDirection").text(regionEndType);
      $("#directionWarningRegion").show();
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
            $('#howto-route').modal('show');
        };
    } else if (tradingStyle == STATION_TRADE) {
        $("#about")[0].onclick = function() {
            $('#howto-station').modal('show');
        };
    }
}

/**
* Sets up cookies automatically using the jquery library input store.
*/
function setupCookies() {
  var formInputs = [
      "lower-margin-threshold", "upper-margin-threshold", "volume-threshold",
      "profit-threshold", "roi-threshold", "buy-threshold", "weight-threshold",
      "route-preference", "include-citadels", "security-threshold",
      "region-buy-threshold", "region-roi-threshold", "region-weight-threshold",
      "region-profit-threshold", "buying-type-station", "selling-type-station",
      "buying-type-region", "selling-type-region"
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

    setAbout();

    var eventLabel = '';
    if(tradingStyle == STATION_HAUL){
        $("#route_trade").slideToggle();
        eventLabel = "Hauler - Station";
    }else if(tradingStyle == STATION_TRADE){
        $("#station_trade").slideToggle();
        eventLabel = "Station Trader";
    } else if (tradingStyle == REGION_HAUL) {
        $("#region_trade").slideToggle();
        eventLabel = "Hauler - Region";
    }

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

    popup_table_buy.clear();
    popup_table_sell.clear();

    var toStationName = getStationName(toStation) || toStation.name;
    var toStationId = toStation.station || toStation;

    $("#popup_itemName").text("Trade info for " + name);

    var buyArr = [];
    var sellArr = [];

    if(orderTypeStart == "BUY") {
      $("#buyLocation").text("Buy Orders at " + fromStation.name);
      buyArr = customSell[fromStation.station][itemId];
    } else {
      $("#buyLocation").text("Sell Orders at " + fromStation.name);
      buyArr = customBuy[fromStation.station][itemId];
    }
    if(orderTypeEnd == "BUY") {
      $("#sellLocation").text("Buy Orders at " + toStationName);
      sellArr = customSell[toStationId][itemId];
    } else {
      $("#sellLocation").text("Sell Orders at " + toStationName);
      sellArr = customBuy[toStationId][itemId];
    }

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

/**
* Gets the start coordinates based on the style
*/
function addStart(variable) {
    if (tradingStyle == STATION_TRADE) {
        $("#custom_station input")[0].value = variable;
        $("#custom_station input")[1].value = variable;
    } else if (tradingStyle == STATION_HAUL) {
        $("#start_station input")[0].value = variable;
        $("#start_station input")[1].value = variable;
        if(shifted){
            var e = {};
            e.shiftKey = true;
            newStartStation(e);
        } else {
            newStartStation();
        }
    } else if (tradingStyle == REGION_HAUL) {
        $("#start_region input")[0].value = variable;
        $("#start_region input")[1].value = variable;
    }
}

/**
* Gets the end coordinates based on the style
*/
function addEnd(variable) {
    if (tradingStyle == STATION_TRADE) {
        return;
    } else if (tradingStyle == STATION_HAUL) {
        $("#end_station input")[0].value = variable;
        $("#end_station input")[1].value = variable;
        if (shifted) {
            var e = {};
            e.shiftKey = true;
            newEndStation(e);
        } else {
            newEndStation();
        }
    } else if (tradingStyle == REGION_HAUL) {
        $("#end_region input")[0].value = variable;
        $("#end_region input")[1].value = variable;
    }
}

/**
* Gets the station trading coordinates based on the input
*/
function setStationTradingLocations() {
    var inputValue = $("#custom_station input")[0].value || $("#custom_station input")[1].value;
    startLocations = inputValue.toLowerCase();

    var start_region = universeList[startLocations].region;
    var start_station = universeList[startLocations].station;
    startLocations = universeList[startLocations].name;

    startCoordinates.region = start_region;
    startCoordinates.station = start_station;
}

/**
* Gets the region trading coordinates based on the input
*/
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
          threshold_margin_lower = setDefaultVal($("#lower-margin-threshold").val(), 20);
          threshold_margin_upper = setDefaultVal($("#upper-margin-threshold").val(), 40);
          volume_threshold = setDefaultVal($("#volume-threshold").val(), 1000);
          setStationTradingLocations();
      } else if (tradingStyle == STATION_HAUL) {
          threshold_profit = setDefaultVal($("#profit-threshold").val(), 500000);
          threshold_roi = setDefaultVal($("#roi-threshold").val(), 4);
          threshold_cost = setDefaultVal($("#buy-threshold").val(), 999999999999999999);
          threshold_weight = setDefaultVal($("#weight-threshold").val(), 999999999999999999);
          setRouteStationTradingLocations();
      } else if (tradingStyle == REGION_HAUL) {
          threshold_profit = setDefaultVal($("#region-profit-threshold").val(), 500000);
          threshold_roi = setDefaultVal($("#region-roi-threshold").val(), 4);
          threshold_cost = setDefaultVal($("#region-buy-threshold").val(), 999999999999999999);
          threshold_weight = setDefaultVal($("#region-weight-threshold").val(), 999999999999999999);
          setRouteRegionTradingLocations();
      }
      setCopyWording();

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
