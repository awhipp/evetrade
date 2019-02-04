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
              $("#route-preference").val("shortest")
            }

            if($("#security-threshold").val() == null) {
              $("#security-threshold").val("NULL")
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
      "region-profit-threshold"
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

var BUY_ORDER = "buy";
var SELL_ORDER = "sell";
var ALL_ORDER = "all";
var ESI_ENDPOINT = "https://esi.evetech.net";

var STATION_TRADE = 0;
var STATION_HAUL = 1;
var REGION_HAUL = 2;

var PAGE_MULTIPLE = 50;

var tableCreated = false;
var createdRefresher = false;
var totalProgress = 0;
var executingCount = 0;
var customBuy = {};
var customSell = {};
var itemCache = {};
var citadelCache = {};
var systemSecurity = {};
var routeCache = {};
var page = 1;
var iteration = 1;
var rowAdded = false;

var regionHeader = ["", "Buy Item", "From", "Quantity", "At Sell Price", "Total Cost", "Take To", "At Buy Price", /*"Profit Per Item",*/  "Jumps", "Profit per Jump", "Total Profit", "R.O.I", "Total Volume (m3)"];
var routeHeader = ["", "Buy Item", "From", "Quantity", "At Sell Price", "Total Cost", "Take To", "At Buy Price", "Total Profit", "Profit Per Item", "R.O.I", "Total Volume (m3)"];
var stationHeader = ["Item", "Buy Order", "Sell Order", "Profit Per Item", "Margin", "24-Hour Volume", "14-Day Volume", "30-Day Volume"];

/**
* The keyword for known scam items
*/
var spamItems = [
    "ahremen's", "brokara's", "brynn's",
    "chelm's", "cormack's", "draclira's", "estamel's",
    "gotan's", "hakim's", "kaikka's", "mizuro's", "raysere's",
    "selynne's", "setele's", "shaqil's", "tairei's", "thon's", "tuvan's",
    "vizen's", "zor's"
];

/**
* Given a market data object this function determines the best prices
*/
function getMarketData(data, stationId, orderType, itemId, isRoute){
    var tempArray;
    if (typeof(data) == "string")  {
        tempArray = [data];
    } else if (data != null){
        tempArray = getBestMarketPrice(data, stationId, orderType, itemId, isRoute)
    }

    var returningArray = [];
    if(tempArray){
        for(var i = 0; i < tempArray.length; i++){
            if(tempArray[i][0] > 0){
                returningArray.push(tempArray[i]);
            }
        }
    }
    return returningArray;
}

/**
* Given a null or empty value it will return the default
*/
function setDefaultVal(ele, def) {
  if (ele && ele.length > 0) {
    return ele;
  }
  return def;
}

/**
 * Private helper method that will determine the best price for a given item from the
 * market data provided.
 *
 * @param orders The market data
 * @param stationId The station that this is for
 * @param orderType The orderType
 * @param itemId The itemId in question
 * @returns {Array} The best price
 */
function getBestMarketPrice(orders, stationId, orderType, itemId, isRoute) {
    var bestPrice = [];

    // Pull all orders found and start iteration
    for (var orderIdx = 0; orderIdx < orders.length; orderIdx++) {
        var order = orders[orderIdx];

        var orderAlignsWithType = (order['is_buy_order'] && orderType === BUY_ORDER)
            || (!order['is_buy_order'] && orderType === SELL_ORDER);

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
    if (orderType == SELL_ORDER){
        var comparator = isRoute ? sellOrderComparator : buyOrderComparator;
        bestPrice = bestPrice.sort(comparator);
        saveSellOrderData(stationId, itemId, $.extend(true, [], bestPrice));
        /** Buying from Users at this price - ordered low to high **/
    } else {
        var comparator = isRoute ? buyOrderComparator : sellOrderComparator;
        bestPrice = bestPrice.sort(comparator);
        saveBuyOrderData(stationId, itemId, $.extend(true, [], bestPrice));
    }

    return bestPrice;
}

/**
* Saves the sell order data for a given station and itemId
*/
function saveSellOrderData(stationId, itemId, data){
    if(data && data.length > 0) {
        if (!customBuy[stationId]) {
            customBuy[stationId] = [];
        }
        if (!customBuy[stationId][itemId] && data.length > 0) {
            customBuy[stationId][itemId] = data;
        }
    }
}

/**
* Saves the buy order data for a given station and itemId
*/
function saveBuyOrderData(stationId, itemId, data){
    if(data && data.length > 0) {
        if(!customSell[stationId]){
            customSell[stationId] = [];
        }
        if(!customSell[stationId][itemId] && data.length > 0) {
            customSell[stationId][itemId] = data;
        }
    }
}

/**
* The comparator for a sellOrder (greater is better)
*/
function sellOrderComparator(a,b){
    if (a[0] > b[0]) return -1;
    if (a[0] < b[0]) return 1;
    return 0;
}

/**
* The comparator for a buyOrder (lesser is better)
*/
function buyOrderComparator(a,b){
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    return 0;
}

/**
* The comparator for a row on a margin trade
*/
function bestRowComparator(a,b){
    if (a[5] < b[5]) return 1;
    if (a[5] > b[5]) return -1;
    return 0;
}

/**
* Given a station Id this function will provide the station name
*/
function getStationName(stationId){
    var stationFound = "";
    $.each(endCoordinates, function(){
        if(stationFound.length == 0 && this.station == stationId) {
            stationFound = this.name;
        }
    });
    return stationFound;
}

/**
* Displays the connection slow error
*/
function displayError(){
    if(!errorShown){
        $("#connectEVE").slideToggle(true);
        errorShown = true;
    }
}

/**
* Hides the connection slow error
*/
function hideError(){
    if(errorShown){
        $("#connectEVE").slideToggle();
        errorShown = false;
    }
}

/**
* Converts a numeric into a human readable string with commas.
*/
function numberWithCommas(val) {
    while (/(\d+)(\d{3})/.test(val.toString())){
        val = val.toString().replace(/(\d+)(\d{3})/, '$1'+','+'$2');
    }
    return val;
}

/**
* Increment progress helper
*/
function incrementProgress(composite, page) {
    getTotalProgress();
    composite.completePages[page] = true;
}

/**
* Determines progress based on completeness
*/
function getTotalProgress() {
    var progressUpdate = 0;
    var allComplete = true;

    for (var i = 0; i < routes.length; i++) {
        allComplete = (allComplete && routes[i].completed);

        var routeProgress = routes[i].recalculateProgress();
        progressUpdate += routeProgress / routes.length;
    }

    if(allComplete) {
        totalProgress = 100;
    } else {
        totalProgress = progressUpdate > 100 ? 100 : progressUpdate;
    }

    $(".loading").html("Fetching orders: " + (totalProgress-0.01).toFixed(2) + "% complete");
    $(".loadingContent").text((totalProgress-0.01).toFixed(2) + "%");
}

/**
* Generic refresh function which will clear and reinitialize the query
*/
function refresh() {
    $("#refresh-button").remove();
    iteration += 1;
    for (var i = 0; i < routes.length; i++) {
        routes[i].clear();
    }

    customBuy = [];
    customSell = [];
    startCoordinates = [];
    endCoordinates = [];
    startLocation = "";
    addedToStartList = [];
    addedToEndList = [];
    endLocations = [];
    page = 1;
    totalProgress = 0;
    createdRefresher = false;
    tableCreated = false;
    routes=[];

    init(tradingStyle);
}

/**
* Given an item this helper determines if it is a scam
*/
function isSpamItem(name) {
    for(var i = 0; i < spamItems.length; i++) {
        if(name.toLowerCase().indexOf(spamItems[i]) >= 0) {
            return true;
        }
    }
    return false;
}

/**
* Market endpoint URI builder
*/
function marketEndpointBuilder(region, page, orderType) {
    var url = ESI_ENDPOINT + "/latest/markets/" + region + "/orders/" +
        "?datasource=tranquility" +
        "&page=" + page +
        "&order_type=" + orderType +
        "&language=en-us&iteration=" + iteration;
    return url.replace(/\s/g, '');
}

/**
* Item weight endpoint URI builder
*/
function getWeightEndpointBuilder(itemId) {
    var url = ESI_ENDPOINT + "/latest/universe/types/" + itemId + "/" +
        "?datasource=tranquility" +
        "&language=en-us" +
        "&iteration=" + iteration;
    return url.replace(/\s/g, '');
}

/**
* Market volume endpoint URI builder
*/
function getVolumeEndpointBuilder(region, itemId) {
    var url = ESI_ENDPOINT + "/latest/markets/" + region + "/history/" +
        "?datasource=tranquility" +
        "&type_id=" + itemId +
        "&language=en-us" +
        "&iteration=" + iteration;
    return url.replace(/\s/g, '');
}

/**
* Builds the textual trade header while query
* is running which gives context on what the query is executing
*/
function createTradeHeader() {
    var buyingFooter = "";
    var buyingFrom = "";
    var sellingTo = "";
    var buyingHeaderDOM = $("#buyingHeader");
    var buyingFooterDOM = $("#buyingFooter");
    var coreDOM = $("#core");

    if (tradingStyle == STATION_HAUL) {
        $.each(startLocations, function () {
            if(this) {
                buyingFrom += this + ", ";
            }
        });
        buyingFrom = buyingFrom.substring(0, buyingFrom.length - 2);

        $.each(endLocations, function () {
            if(this) {
                sellingTo += this + ", ";
            }
        });
        sellingTo = sellingTo.substring(0, sellingTo.length - 2);
    } else if (tradingStyle == REGION_HAUL) {
        buyingFrom = startLocations;
        sellingTo = endLocations;
    }

    if (tradingStyle == STATION_HAUL || tradingStyle == REGION_HAUL) {
        buyingHeaderDOM.text("Buying Sell Orders from " + buyingFrom);

        var extraData = "<div id='route-to'>Selling to the Buy Orders at " + sellingTo + "</div> " +
            "ROI&nbsp;Greater&nbsp;Than&nbsp;" + threshold_roi + "% " +
            "|&nbsp;Profits&nbsp;Greater&nbsp;Than&nbsp;" + numberWithCommas(threshold_profit) + "&nbsp;ISK";
        if (tradingStyle == REGION_HAUL) {
            extraData += "<span id='citadelsLine'><br>* Indicates that the station is a citadel (confirm access at your own risk).</span>"
            extraData += "<br>Only showing system security status of " + $("#security-threshold").val() + " SEC or better.";
        }

        if(threshold_cost !== 999999999999999999){
            extraData += " |&nbsp;Buy&nbsp;Costs&nbsp;Less&nbsp;Than&nbsp;" + numberWithCommas(threshold_cost) + "&nbsp;ISK";
        }
        if(threshold_weight !== 999999999999999999){
            extraData += " |&nbsp;Total&nbsp;Volume&nbsp;Under&nbsp;" + numberWithCommas(threshold_weight) + "&nbsp;m3";
        }

        buyingHeaderDOM.show();

        buyingFooter = extraData +
            "<br/>" +
            "<div class='loading'></div>";

        buyingFooterDOM.html(buyingFooter);
        buyingFooterDOM.show();

        gtag('event', 'User Route Campaign', {
            'event_category': 'Route Trade Locations',
            'event_label': buyingFrom + " -> " + sellingTo,
            'value': 1
        });
    } else if (tradingStyle == STATION_TRADE){
        buyingHeaderDOM.text("Station Trading at " + startLocations);
        buyingHeaderDOM.show();

        buyingFooter = "Volume greater than: " + numberWithCommas(volume_threshold) +
            " | Margins between " + threshold_margin_lower + "% and " + threshold_margin_upper + "%" +
            "<div class='loading'>Loading. Please wait...</div>";
        buyingFooterDOM.html(buyingFooter);
        buyingFooterDOM.show();

        gtag('event', 'User Route Campaign', {
            'event_category': 'Station Trade Locations',
            'event_label': startLocations,
            'value': 1
        });
    }
    coreDOM.show();
}


/**
* Creates the datatable based on the trading style that is being queried
*/
function createDataTable() {
    if(!tableCreated) {
        tableCreated = true;
        $('#noselect-object').html('<table id="dataTable" class="display"></table>');
        $(".dataTableFilters").html("");

        var dataTableDOM = $("#dataTable");
        dataTableDOM.html("");

        var dtHTML = "<thead>";
        var headers = tradingStyle === STATION_TRADE ? stationHeader : tradingStyle === STATION_HAUL ? routeHeader : regionHeader;
        for (var i = 0; i < headers.length; i++) {
            dtHTML += ("<th>" + headers[i] + "</th>");
        }
        dtHTML += "</thead><tbody id='tableBody'></tbody>";
        dataTableDOM.append(dtHTML);

        var dt;
        if (tradingStyle == STATION_HAUL) {
            // sorting on total profit index
            dt = dataTableDOM.DataTable({
                "order": [[8, "desc"]],
                "lengthMenu": [[100], ["100"]],
                // "lengthMenu": [[-1], ["All"]],
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
        } else if (tradingStyle == REGION_HAUL) {
            // sorting on profit per jump index
            dt = dataTableDOM.DataTable({
                "order": [[9, "desc"]],
                "lengthMenu": [[100], ["100"]],
                // "lengthMenu": [[-1], ["All"]],
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

        } else if (tradingStyle == STATION_TRADE) {
            // sorting on margin index
            dt = dataTableDOM.DataTable({
                "order": [[6, "desc"]],
                "lengthMenu": [[100], ["100"]],
                // "lengthMenu": [[-1], ["All"]],
                responsive: true,
                dom: 'Bfrtip',
                buttons: [
                    'copy', 'csv', 'excel', 'pdf'
                ]
            });
        }


        $("#dataTable thead th").each(function (i) {
            if( i > 0 || tradingStyle == STATION_TRADE) {
                var name = dt.column(i).header();
                var spanelt = document.createElement("button");

                var initial_removed = [];

                spanelt.innerHTML = name.innerHTML;

                $(spanelt).addClass("colvistoggle");
                $(spanelt).addClass("btn");
                $(spanelt).addClass("btn-default");
                $(spanelt).attr("colidx", i);    // store the column idx on the button

                $(spanelt).addClass("is-true");
                var column = dt.column($(spanelt).attr('colidx'));
                column.visible(true);

                for (var i = 0; i < initial_removed.length; i++) {
                    if (spanelt.innerHTML === initial_removed[i]) {
                        $(spanelt).addClass("is-false");
                        var column = dt.column($(spanelt).attr('colidx'));
                        column.visible(false);
                        break;
                    }
                }

                $(spanelt).on('click', function (e) {
                    e.preventDefault();
                    // Get the column API object
                    var column = dt.column($(this).attr('colidx'));
                    // Toggle the visibility
                    $(this).removeClass("is-" + column.visible());
                    column.visible(!column.visible());
                    $(this).addClass("is-" + column.visible());

                });
                var li = document.createElement("li");
                $(li).append($(spanelt));
                $("#colvis").append($(li));
            }
        });

        // ADD SLIDEDOWN ANIMATION TO DROPDOWN //
        $('.dropdown').on('show.bs.dropdown', function (e) {
            $(this).find('.dropdown-menu').first().stop(true, true).slideDown();
        });

        // ADD SLIDEUP ANIMATION TO DROPDOWN //
        $('.dropdown').on('hide.bs.dropdown', function (e) {
            $(this).find('.dropdown-menu').first().stop(true, true).slideUp();
        });

        $('#dataTable tbody').on('mousedown', 'tr', function (event) {
            var investigateButton = (event.target.id.indexOf("investigate") >= 0
            || (event.target.children[0] && event.target.children[0].id.indexOf("investigate") >= 0)
            || (event.target.classList.contains("fa")));

            if (event.which === 1 && !investigateButton) {
                if (!$(this).hasClass("row-selected")) {
                    $(this).addClass("row-selected");
                } else {
                    $(this).removeClass("row-selected");
                }
            }
        });

        $("label > input").addClass("form-control").addClass("minor-text");
        $("label > input").attr("placeholder", "Filter by Station/Name...");

        $(".dataTableFilters").append($("#dataTable_filter"));
        $(".dataTableFilters").append($(".dt-buttons"));
        $(".dt-button").addClass("btn");
        $(".dt-button").addClass("btn-default");

        $(".deal_note").hide();
        $("#show-hide").show();
        $("#dataTable").show();

        $(".dataTables_paginate").on("click", function(){
           $(this)[0].scrollIntoView();
        });
    }
}

var routes = [];

/**
 * Creates a Route object
 *
 * @param startLocation a json object that contains the region and station of the start location
 * @param endLocations a json object array that contains the region and station of the end locations
 * @constructor
 */
function Route(startLocation, endLocations) {
    this.startLocation = startLocation;
    this.endLocations = endLocations;

    this.buyOrders = {};
    this.buyOrders.completePages = [];
    this.buyOrders.complete = false;
    this.buyOrders.pageBookend = PAGE_MULTIPLE;

    this.sellOrders = {};

    this.itemIds = [];
    this.secondsToRefresh = 60;

    this.asyncRefresher = null;
    this.asyncProgressUpdate = null;

    this.completed = false;

    routes.push(this);
    this.routeId = routes.length-1;
}

Route.prototype.className = function() {
    return "Route";
};


/**
 * Begins the process for finding route information and displaying the best trades for the route.
 */
Route.prototype.startRoute = function() {
    var page;
    var regionId = parseInt(this.startLocation.region);
    var stationId = parseInt(this.startLocation.station);

    for(page = 1; page <= PAGE_MULTIPLE; page++){
        this.getSellOrders(regionId, stationId, page, this.buyOrders);
    }

    var rI = 0;
    for(var i = 0; i < this.endLocations.length; i++){
        if(this.endLocations[i].station !== this.startLocation.station) {
            this.sellOrders[rI] = {};
            this.sellOrders[rI].completePages = [];
            this.sellOrders[rI].complete = false;
            this.sellOrders[rI].pageBookend = PAGE_MULTIPLE;

            regionId = parseInt(this.endLocations[i].region);
            stationId = parseInt(this.endLocations[i].station);

            for(page = 1; page <= PAGE_MULTIPLE; page++){
                this.getBuyOrders(regionId, stationId, page, this.sellOrders[rI]);
            }
            rI += 1;
        }
    }

    $("#selection").hide();
};

/**
 * Calculates the progress using a logarithmic function
 *
 * @returns {number}
 */
Route.prototype.recalculateProgress = function() {
    var progressUpdate = this.getNumberOfCompletePages(this.buyOrders);
    var rI = 0;
    for (var i = 0; i < this.endLocations.length; i++) {
        if(this.endLocations[i].station !== this.startLocation.station) {
            progressUpdate += this.getNumberOfCompletePages(this.sellOrders[rI]);
            rI += 1;
        }
    }
    return progressUpdate <= 0 ? 1 : 35.0 * Math.log10(progressUpdate);
};

/**
 * Helper function that gets buy orders only.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 */
Route.prototype.getBuyOrders = function(region, station, page, composite) {
    this.getOrders(region, station, page, composite, BUY_ORDER);
};

/**
 * Helper function that gets sell orders only.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 */
Route.prototype.getSellOrders = function(region, station, page, composite) {
    this.getOrders(region, station, page, composite, SELL_ORDER);
};

/**
 * Getting the orders for a specific region, station, and page number.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 * @param orderType The order type to get orders for.
 */
Route.prototype.getOrders = function(region, station, page, composite, orderType) {

    var url = marketEndpointBuilder(region, page, orderType);
    var thiz = this;

    if(!composite.completePages[page]) {
        $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            contentType: "application/json",
            async: true,
            success: function(data) {
                incrementProgress(composite, page);

                if (data.length === 0 && !composite.complete) {
                    composite.complete = true;
                    console.log("Completed " + station + " order fetch at " + page);
                } else {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i]["location_id"] === station) {
                            var id = data[i]["type_id"];
                            if (!composite[id]) {
                                composite[id] = [];
                            }
                            composite[id].push(data[i]);
                        }
                    }

                    if (!composite.complete && thiz.getNumberOfCompletePages(composite) === composite.pageBookend) {
                        var _page = page + 1;
                        composite.pageBookend = (composite.pageBookend + PAGE_MULTIPLE);

                        for (var newBookend = composite.pageBookend; _page <= newBookend; _page++) {
                            thiz.getOrders(region, station, _page, composite, orderType);
                        }
                    } else {
                        thiz.executeOrders();
                    }
                }

            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                displayError();
                incrementProgress(composite, page);

                if(!composite.complete && thiz.getNumberOfCompletePages(composite) === composite.pageBookend) {
                    var _page = page + 1;
                    composite.pageBookend = (composite.pageBookend + PAGE_MULTIPLE);

                    for (var newBookend = composite.pageBookend; _page <= newBookend; _page++) {
                        thiz.getOrders(region, station, _page, composite, orderType);
                    }
                } else {
                    thiz.executeOrders();
                }
            }
        });
    }
};

/**
 * Gets the number of completed pages for a specific order
 *
 * @param order The specific buy or sell order
 * @returns {number} The number of completed pages
 */
Route.prototype.getNumberOfCompletePages = function(order) {
    var numberOfCompletedPages = 0;
    for(var i = 0; i < order.completePages.length; i++) {
        if (order.completePages[i]) {
            numberOfCompletedPages++;
        }
    }
    return numberOfCompletedPages;
};


/**
 * Checks all active order requests to verify whether they are complete or not
 *
 * @returns {boolean|*}
 */
Route.prototype.checkOrdersComplete = function() {
    var orderFull = (this.getNumberOfCompletePages(this.buyOrders) === this.buyOrders.pageBookend);
    var ordersComplete = this.buyOrders.complete;

    // running index
    var rI = 0;
    for (var i = 0; i < this.endLocations.length; i++) {
        if(this.endLocations[i].station !== this.startLocation.station) {
            orderFull = orderFull && (this.getNumberOfCompletePages(this.sellOrders[rI]) === this.sellOrders[rI].pageBookend);
            ordersComplete = ordersComplete && this.sellOrders[rI].complete;
            rI += 1;
        }
    }

    return (orderFull && ordersComplete);
};

/**
 * If all the active orders are complete then it begins processing them
 */
Route.prototype.executeOrders = function() {
    if (this.checkOrdersComplete()) {
        hideError();

        for(itemId in this.buyOrders){
            if(itemId !== "completePages" && itemId !== "complete" && itemId !== "pageBookend")
                this.itemIds.push(itemId);
        }

        this.calculate();
    }
};

/**
* Clears the entire object for a refresh call.
*/
Route.prototype.clear = function() {
    this.startLocation = null;
    this.endLocations = null;

    this.buyOrders = {};
    this.buyOrders.completePages = [];
    this.buyOrders.complete = false;
    this.buyOrders.pageBookend = PAGE_MULTIPLE;

    this.sellOrders = {};

    this.itemIds = [];
    this.secondsToRefresh = 60;

    clearInterval(this.asyncRefresher);
    clearInterval(this.asyncProgressUpdate);
};

/**
 * The asynchronous function that calculated when a refresh can occur.
 */
Route.prototype.asyncRefresh = function() {
    var thiz = this;
    this.asyncRefresher = setInterval(function(){
        if(thiz.secondsToRefresh <= 0){
            clearInterval(thiz.asyncRefresher);
            $("#refresh-timer").remove();
            $("#buyingFooter").append('<div id="refresh-button">' +
                '<input type="button" class="btn btn-default" onclick="refresh()" value="Refresh Table with Last Query"/>' +
                '</div>');
        } else {
            if (rowAdded) {
                $(".loading").hide();
            } else {
                $(".loading").text("No trades found for your filters.");
            }

            $("#refresh-timer").html("<p>Refresh allowed in: " + thiz.secondsToRefresh + " seconds.");
            thiz.secondsToRefresh--;
        }
    }, 1000);
};

/**
* Async function which determines the progress of the query
*/
Route.prototype.asyncProgress = function() {
    var thiz = this;
    this.asyncProgressUpdate = setInterval(function() {
        getTotalProgress();

        if (totalProgress == 100) {
            clearInterval(thiz.asyncProgressUpdate);

            $("#buyingFooter").append('<div id="refresh-timer"></div>');

            $(".tableLoadingIcon").hide();

            if (!createdRefresher) {
                createdRefresher = true;
                thiz.asyncRefresh();
            }
        }
    }, 2500);
};

/**
 * The function that asynchronously calculates trades.
 */
Route.prototype.calculate = function() {
    this.asyncProgress();

    while(this.itemIds.length != 0){
        executingCount++;
        var itemId = this.itemIds.splice(0, 1)[0];
        if(this.itemIds.length == 0) {
            this.completed = true;
        }
        this.calculateNext(itemId);
    }
};

/**
 * Calculates the trades for the given itemId.
 *
 * @param itemId The itemId to calculate for.
 */
Route.prototype.calculateNext = function(itemId) {

    var buyPrice = getMarketData(this.buyOrders[itemId], this.startLocation.station, SELL_ORDER, itemId, true);

    if (buyPrice.length > 0) {
        var executed = false;

        var rI = 0;
        for(var i = 0; i < this.endLocations.length; i++){
            if(this.endLocations[i].station !== this.startLocation.station) {
                var sellOrder = this.sellOrders[rI];
                var endLocation = this.endLocations[i];

                if (sellOrder[itemId]) {
                    var sellPrice = getMarketData(sellOrder[itemId], endLocation.station, BUY_ORDER, itemId, true);
                    if (sellPrice.length > 0) {
                        var locationInfo = {};
                        locationInfo.region = endLocation.region;
                        locationInfo.station = endLocation.station;
                        executed = true;

                        this.getItemInfo(itemId, buyPrice, sellPrice, locationInfo);
                    }
                }
                rI += 1;
            }
        }

        if(!executed){
            executingCount--;
        }
    } else {
        executingCount--;
    }
};

/**
* Gets a particular item info given its itemId
*/
Route.prototype.getItemInfo = function(itemId, buyPrice, sellPrice, locationInfo){
    var rows = [];

    for(var i = 0; i < buyPrice.length; i++){
        for(var j = 0; j < sellPrice.length; j++){
            var row = this.calculateRow(itemId, buyPrice[i][0], buyPrice[i][1], sellPrice[j][0], sellPrice[j][1], locationInfo);
            if(row.length > 0){
                rows.push(row);
            }
        }
    }

    if(rows.length > 0){
        rows = rows.sort(bestRowComparator);
        this.getItemWeight(itemId, this.createRowObject(rows[0]));
    }else {
        executingCount--;
    }
};

/**
* Calculates the metrics behind a given row
*/
Route.prototype.calculateRow = function(itemId, buyPrice, buyVolume, sellPrice, sellVolume, locationInfo){
    if(buyPrice < sellPrice && sellPrice > 0){
        var itemProfit = sellPrice - buyPrice;

        var profit;
        var buyCost;
        var volume;

        if(buyVolume >= sellVolume){
            volume = sellVolume;
            profit = sellVolume * itemProfit;
            buyCost = buyPrice * sellVolume;
        }else{
            volume = buyVolume;
            profit = buyVolume * itemProfit;
            buyCost = buyPrice * buyVolume;
        }

        var iskRatio = (sellPrice-buyPrice)/buyPrice;

        if(profit >= threshold_profit && (iskRatio.toFixed(3)*100).toFixed(1) >= threshold_roi && buyCost <= threshold_cost ){
            return [itemId, buyPrice, volume, buyCost, locationInfo, profit, iskRatio, sellPrice, itemProfit];
        }else{
            return [];
        }
    }
    return [];
};

/**
* Gets the itemweight of a given itemId (checks cache if it was already retrieved)
*/
Route.prototype.getItemWeight = function(itemId, row){

    if(itemCache[itemId]){
        var name = itemCache[itemId].name;
        var weight = itemCache[itemId].weight;

        row.itemName = name;
        row.itemWeight = weight;

        this.addRow(row);

        executingCount--;
    }else{
        var thiz = this;
        var url = getWeightEndpointBuilder(itemId);
        $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            async: true,
            cache: false,
            contentType: "application/json",
            success: function(weightData) {
                executingCount--;

                var name = weightData.name;
                var weight = weightData.packaged_volume;

                itemCache[itemId] = {};
                itemCache[itemId].name = name;
                itemCache[itemId].weight = weight;

                row.itemName = name;
                row.itemWeight = weight;

                thiz.addRow(row);
            },
            error: function (request, error) {
                if(request.status != 404 && request.statusText !== "parsererror") {
                    thiz.getItemWeight(itemId, row);
                } else {
                    executingCount--;
                }
            }
        });
    }
};

/**
* Creates the route row object for insertion into datatable
*/
Route.prototype.createRowObject = function(row) {
    var rowObject = {};
    rowObject.itemId = row[0];
    rowObject.buyPrice = row[1];
    rowObject.quantity = row[2];
    rowObject.buyCost = row[3];
    rowObject.sellToStation = row[4];
    rowObject.totalProfit = row[5];
    rowObject.roi = row[6];
    rowObject.sellPrice = row[7];
    rowObject.perItemProfit = row[8];
    return rowObject;
};

/**
* Adds the row to the datatable if it passes all the conditions
*/
Route.prototype.addRow = function(row) {

    var storageVolume = row.itemWeight * row.quantity;

    if(storageVolume > threshold_weight) {
        return;
    }

    if(isSpamItem(row.itemName)) {
        return;
    }

    createDataTable();

    var investigateId = row.sellToStation.station + this.startLocation.station + row.itemId + "_investigate";

    var row_data = [
        "<span id=\""+ investigateId +"\"" +
        "data-itemId=\"" + row.itemId + "\"" +
        "data-itemName=\"" + row.itemName + "\"" +
        "data-routeId=\"" + this.routeId + "\"" +
        "data-sellStationId=\"" + row.sellToStation.station + "\">" +
        "<i class=\"fa fa-search-plus\"></i>" +
        "</span>",
        row.itemName,
        this.startLocation.name,
        numberWithCommas(row.quantity),
        numberWithCommas(row.buyPrice.toFixed(2)),
        numberWithCommas(row.buyCost.toFixed(2)),
        getStationName(row.sellToStation.station),
        numberWithCommas(row.sellPrice.toFixed(2)),
        numberWithCommas(row.totalProfit.toFixed(2)),
        numberWithCommas(row.perItemProfit.toFixed(2)),
        (row.roi.toFixed(3)*100).toFixed(1)+"%",
        numberWithCommas(storageVolume.toFixed(2))
    ];

    var rowIndex = $('#dataTable').dataTable().fnAddData(row_data);
    $('#dataTable').dataTable().fnGetNodes(rowIndex);

    $("#" + investigateId).on('click', function(){
        var popId = parseInt(this.dataset.itemid);
        var popName = this.dataset.itemname;
        var popFrom = routes[parseInt(this.dataset.routeid)].startLocation;
        var popTo = parseInt(this.dataset.sellstationid);

        open_popup(popId, popName, popFrom, popTo);
    });

    rowAdded = true;
};

var routes = [];

/**
 * Creates a Region object
 *
 * @param startLocation a json object that contains the region and station of the start location
 * @param endLocation a json object array that contains the region and station of the end locations
 * @constructor
 */
function Region(startLocation, endLocation) {
    this.startLocation = startLocation;
    this.endLocations = endLocation;

    this.buyOrders = {};
    this.buyOrders.completePages = [];
    this.buyOrders.complete = false;
    this.buyOrders.pageBookend = PAGE_MULTIPLE;


    this.sellOrders = {};
    this.sellOrders.completePages = [];
    this.sellOrders.complete = false;
    this.sellOrders.pageBookend = PAGE_MULTIPLE;

    this.regionRoutes = [];
    this.secondsToRefresh = 60;

    this.asyncRefresher = null;
    this.asyncProgressUpdate = null;
    this.routesExecutor = null;

    this.security = setDefaultVal($("#security-threshold").val(), "NULL");
    this.safety = setDefaultVal($("#route-preference").val(), "shortest");

    this.completed = false;

    this.includeCitadels = $("#include-citadels").is(":checked");

    if(!this.includeCitadels) {
        $("#citadelsLine").hide();
    } else {
        $("#citadelsLine").show();
    }

    routes.push(this);
}

Region.prototype.className = function() {
    return "Route";
};


/**
 * Begins the process for finding route information and displaying the best trades for the route.
 */
Region.prototype.startRoute = function() {
    var page;
    var regionId = parseInt(this.startLocation.id);

    for(page = 1; page <= PAGE_MULTIPLE; page++){
        this.getSellOrders(regionId, page, this.buyOrders);
    }

    regionId = parseInt(this.endLocations.id);

    for(page = 1; page <= PAGE_MULTIPLE; page++){
        this.getBuyOrders(regionId, page, this.sellOrders);
    }

    $("#selection").hide();
};

/**
 * Calculates the progress using a logarithmic function
 *
 * @returns {number}
 */
Region.prototype.recalculateProgress = function() {
    var progressUpdate = this.getNumberOfCompletePages(this.buyOrders);
    progressUpdate += this.getNumberOfCompletePages(this.sellOrders);
    return progressUpdate <= 0 ? 1 : 35.0 * Math.log10(progressUpdate);
};

/**
 * Helper function that gets buy orders only.
 *
 * @param region The region ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 */
Region.prototype.getBuyOrders = function(region, page, composite) {
    this.getOrders(region, page, composite, BUY_ORDER);
};

/**
 * Helper function that gets sell orders only.
 *
 * @param region The region ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 */
Region.prototype.getSellOrders = function(region, page, composite) {
    this.getOrders(region, page, composite, SELL_ORDER);
};

/**
 * Getting the orders for a specific region, station, and page number.
 *
 * @param region The region ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 * @param orderType The order type to get orders for.
 */
Region.prototype.getOrders = function(region, page, composite, orderType) {

    var url = marketEndpointBuilder(region, page, orderType);
    var thiz = this;

    if(!composite.completePages[page]) {
        $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            contentType: "application/json",
            async: true,
            success: function(data) {
                incrementProgress(composite, page);

                if (data.length === 0 && !composite.complete) {
                    composite.complete = true;
                    console.log("Completed " + region + " order fetch at " + page);
                } else {
                    for (var i = 0; i < data.length; i++) {
                        var stationId = data[i]["location_id"];
                        var id = data[i]["type_id"];


                        if (!composite[stationId]) {
                            composite[stationId] = {};
                        }

                        if (!composite[stationId][id]) {
                            composite[stationId][id] = [];
                        }

                        composite[stationId][id].push(data[i]);
                    }

                    if (!composite.complete && thiz.getNumberOfCompletePages(composite) === composite.pageBookend) {
                        var _page = page + 1;
                        composite.pageBookend = (composite.pageBookend + PAGE_MULTIPLE);

                        for (var newBookend = composite.pageBookend; _page <= newBookend; _page++) {
                            thiz.getOrders(region, _page, composite, orderType);
                        }
                    } else {
                        thiz.executeOrders();
                    }
                }

            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                displayError();
                incrementProgress(composite, page);

                if(!composite.complete && thiz.getNumberOfCompletePages(composite) === composite.pageBookend) {
                    var _page = page + 1;
                    composite.pageBookend = (composite.pageBookend + PAGE_MULTIPLE);

                    for (var newBookend = composite.pageBookend; _page <= newBookend; _page++) {
                        thiz.getOrders(region, _page, composite, orderType);
                    }
                }
            }
        });
    }
};

/**
 * Gets the number of completed pages for a specific order
 *
 * @param order The specific buy or sell order
 * @returns {number} The number of completed pages
 */
Region.prototype.getNumberOfCompletePages = function(order) {
    var numberOfCompletedPages = 0;
    for(var i = 0; i < order.completePages.length; i++) {
        if (order.completePages[i]) {
            numberOfCompletedPages++;
        }
    }
    return numberOfCompletedPages;
};


/**
 * Checks all active order requests to verify whether they are complete or not
 *
 * @returns {boolean|*}
 */
Region.prototype.checkOrdersComplete = function() {
    var orderFull = (this.getNumberOfCompletePages(this.buyOrders) === this.buyOrders.pageBookend);
    var ordersComplete = this.buyOrders.complete;

    orderFull = orderFull && (this.getNumberOfCompletePages(this.sellOrders) === this.sellOrders.pageBookend);
    ordersComplete = ordersComplete && this.sellOrders.complete;

    return (orderFull && ordersComplete);
};

/**
 * If all the active orders are complete then it begins processing them
 */
Region. regionRoutes = [];
Region.prototype.executeOrders = function() {
    if (this.checkOrdersComplete()) {
        hideError();

        for(startStationId in this.buyOrders) {
            var start = {};
            start.region = this.startLocation.id;
            start.station = startStationId;

            if(startStationId > 999999999 && !this.includeCitadels) {
                continue;
            }

            for(itemId in this.buyOrders[startStationId]) {
                if(itemId !== "completePages" && itemId !== "complete" && itemId !== "pageBookend") {
                    var buyPrice = getMarketData(this.buyOrders[startStationId][itemId], start.station, SELL_ORDER, itemId, true);

                    if (buyPrice.length > 0) {

                        for (endStationId in this.sellOrders) {

                            if(endStationId > 999999999 && !this.includeCitadels) {
                                continue;
                            }

                            if (endStationId !== startStationId) {
                                var end = {};
                                end.region = this.endLocations.id;
                                end.station = endStationId;

                                var sellOrder = this.sellOrders[endStationId];

                                if (sellOrder && sellOrder[itemId]) {
                                    var sellPrice = getMarketData(sellOrder[itemId], end.station, BUY_ORDER, itemId, true);
                                    if (sellPrice.length > 0) {
                                        var route = {};
                                        route.itemId = itemId;
                                        route.buyPrice = buyPrice;
                                        route.sellPrice = sellPrice;
                                        route.start = start;
                                        route.end = end;
                                        this.regionRoutes.push(route);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        this.executeRoutes();

    }
};

/**
* Keeps tracks of an executes the region calculation
*/
Region.prototype.executeRoutes = function() {
    var thiz = this;
    var runningCount = 0;
    var originalCount = this.regionRoutes.length;
    var remainingProgress = 100 - totalProgress;
    var originalTotal = totalProgress;

    this.routesExecutor = setInterval(function(){

        if(thiz.regionRoutes.length == 0){
            thiz.completed = true;
            totalProgress = 100;
            clearInterval(thiz.routesExecutor);
            if (rowAdded) {
                $(".loading").hide();
            }

            $(".tableLoadingIcon").hide();

            $("#buyingFooter").append('<div id="refresh-timer"></div>');

            thiz.asyncRefresh();
        }

        for(var i = 0; i < thiz.regionRoutes.length && i < 1000; i++ ) {
            var route = thiz.regionRoutes.splice(0, 1)[0];

            thiz.getItemInfo(route.itemId, route.buyPrice, route.sellPrice, route.start, route.end);
            runningCount += 1;
        }

        totalProgress = originalTotal + (remainingProgress * (runningCount/originalCount));

        $(".loading").html("Adding orders to table: " + totalProgress.toFixed(2) + "% complete");
        $(".loadingContent").text((totalProgress).toFixed(2) + "%");
    }, 1000);
};

/**
* Clears the entire region for a refresh including async functions
*/
Region.prototype.clear = function() {
    this.startLocation = null;
    this.endLocations = null;

    this.buyOrders = {};
    this.buyOrders.completePages = [];
    this.buyOrders.complete = false;
    this.buyOrders.pageBookend = PAGE_MULTIPLE;

    this.sellOrders = {};
    this.sellOrders.completePages = [];
    this.sellOrders.complete = false;
    this.sellOrders.pageBookend = PAGE_MULTIPLE;

    this.regionRoutes = [];
    this.secondsToRefresh = 120;

    clearInterval(this.asyncRefresher);
    clearInterval(this.asyncProgressUpdate);
    clearInterval(this.routesExecutor);

    this.completed = false;
};


/**
 * The asynchronous function that calculated when a refresh can occur.
 */
Region.prototype.asyncRefresh = function() {
    var thiz = this;
    this.asyncRefresher = setInterval(function(){
        if(thiz.secondsToRefresh <= 0){
            clearInterval(thiz.asyncRefresher);
            $("#refresh-timer").remove();
            $("#buyingFooter").append('<div id="refresh-button">' +
                '<input type="button" class="btn btn-default" onclick="refresh()" value="Refresh Table with Last Query"/>' +
                '</div>');
        } else {
            if (rowAdded) {
                $(".loading").hide();
            } else {
                $(".loading").text("No trades found for your filters.");
            }

            $("#refresh-timer").html("<p>Refresh allowed in: " + thiz.secondsToRefresh + " seconds.");
            thiz.secondsToRefresh--;
        }
    }, 1000);
};

/**
* Gets all required item info for a given itemId
*/
Region.prototype.getItemInfo = function(itemId, buyPrice, sellPrice, start, end){
    var rows = [];

    for(var i = 0; i < buyPrice.length; i++){
        for(var j = 0; j < sellPrice.length; j++){
            var row = this.calculateRow(itemId, buyPrice[i][0], buyPrice[i][1], sellPrice[j][0], sellPrice[j][1], start, end);
            if(row.length > 0){
                rows.push(row);
            }
        }
    }

    if(rows.length > 0){
        rows = rows.sort(bestRowComparator);
        this.getItemWeight(itemId, this.createRowObject(rows[0]));
    }
};

/**
* Calculates the given row and whether it should be added to the table
*/
Region.prototype.calculateRow = function(itemId, buyPrice, buyVolume, sellPrice, sellVolume, start, end){
    if(buyPrice < sellPrice && sellPrice > 0){
        var itemProfit = sellPrice - buyPrice;

        var profit;
        var buyCost;
        var volume;

        if(buyVolume >= sellVolume){
            volume = sellVolume;
            profit = sellVolume * itemProfit;
            buyCost = buyPrice * sellVolume;
        }else{
            volume = buyVolume;
            profit = buyVolume * itemProfit;
            buyCost = buyPrice * buyVolume;
        }

        var iskRatio = (sellPrice-buyPrice)/buyPrice;

        if(profit >= threshold_profit && (iskRatio.toFixed(3)*100).toFixed(1) >= threshold_roi && buyCost <= threshold_cost ){
            return [itemId, start, buyPrice, volume, buyCost, end, profit, iskRatio, sellPrice, itemProfit];
        }else{
            return [];
        }
    }
    return [];
};

/**
* Gets the item weight for a given itemId and adds it to the row
*/
Region.prototype.getItemWeight = function(itemId, row){
    if(itemCache[itemId]){
        var name = itemCache[itemId].name;
        var weight = itemCache[itemId].weight;
        row.itemName = name;
        row.itemWeight = weight;
        this.addRow(row);
    }else{
        var thiz = this;
        var url = getWeightEndpointBuilder(itemId);
        $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            async: true,
            cache: false,
            contentType: "application/json",
            success: function(weightData) {
                var name = weightData.name;
                var weight = weightData.packaged_volume;

                itemCache[itemId] = {};
                itemCache[itemId].name = name;
                itemCache[itemId].weight = weight;

                row.itemName = name;
                row.itemWeight = weight;

                thiz.addRow(row);
            },
            error: function (request, error) {
                if(request.status != 404 && request.statusText !== "parsererror") {
                    thiz.getItemWeight(itemId, row);
                }
            }
        });
    }
};

/**
* Creates the row object for a regional trade
*/
Region.prototype.createRowObject = function(row) {
    var rowObject = {};
    rowObject.itemId = row[0];
    rowObject.buyFromStation = row[1];
    rowObject.buyPrice = row[2];
    rowObject.quantity = row[3];
    rowObject.buyCost = row[4];
    rowObject.sellToStation = row[5];
    rowObject.totalProfit = row[6];
    rowObject.roi = row[7];
    rowObject.sellPrice = row[8];
    rowObject.perItemProfit = row[9];
    return rowObject;
};

/**
* If the user requested citadel data as well this will swap out the citadel id
* at the endpoint with the citadel data provided by stop.hammerti.me.uk
*/
Region.prototype.updateEndWithCitadel = function (row) {
    var citadelId = row.sellToStation.station;
    var thiz = this;

    if (citadelId < 999999999) {
        if (citadelCache[citadelId]) {
            var citadelName = citadelCache[citadelId].name;
            var citadelSystem = citadelCache[citadelId].system;
            row.sellToStation.name = citadelName;
            row.sellToStation.system = citadelSystem;
            this.getStartSystemSecurity(row);
        } else {
            $.ajax({
                type: "get",
                url: "https://esi.evetech.net/latest/universe/stations/" + row.sellToStation.station + "/?datasource=tranquility",
                dataType: "json",
                contentType: "application/json",
                async: true,
                success: function (data) {
                    var citadelName = data.name;
                    var citadelSystem = data["system_id"];
                    var citadel = {};
                    citadel.name = citadelName;
                    citadel.system = citadelSystem;
                    citadelCache[citadelId] = citadel;
                    row.sellToStation.name = citadelName;
                    row.sellToStation.system = citadelSystem;
                    thiz.getStartSystemSecurity(row);
                }
            });
        }
    } else if(this.includeCitadels) {
        if (citadelCache[citadelId]) {
            var citadelName = citadelCache[citadelId].name;
            var citadelSystem = citadelCache[citadelId].system;
            row.sellToStation.name = "<strong><em>" + citadelName + "*</em></strong>";
            row.sellToStation.system = citadelSystem;
            this.getStartSystemSecurity(row);
        } else {
            $.ajax({
                type: "get",
                url: "https://stop.hammerti.me.uk/api/citadel/" + citadelId,
                dataType: "json",
                contentType: "application/json",
                async: true,
                success: function (data) {
                    data = data[citadelId];
                    var citadelName = data.name;
                    var citadelSystem = data.systemId;
                    var citadel = {};
                    citadel.name = citadelName;
                    citadel.system = citadelSystem;
                    citadelCache[citadelId] = citadel;
                    row.sellToStation.name = "<strong><em>" + citadelName + "*</em></strong>";
                    row.sellToStation.system = citadelSystem;
                    thiz.getStartSystemSecurity(row);
                }
            });
        }
    }
};


/**
* If the user requested citadel data as well this will swap out the citadel id
* at the startpoint with the citadel data provided by stop.hammerti.me.uk
*/
Region.prototype.updateStartWithCitdael = function (row) {
    var citadelId = row.buyFromStation.station;
    var thiz = this;

    if (citadelId < 999999999) {
        if (citadelCache[citadelId]) {
            var citadelName = citadelCache[citadelId].name;
            var citadelSystem = citadelCache[citadelId].system;
            row.buyFromStation.name = citadelName;
            row.buyFromStation.system = citadelSystem;
            this.updateEndWithCitadel(row);
        } else {
            $.ajax({
                type: "get",
                url: "https://esi.evetech.net/latest/universe/stations/" + row.buyFromStation.station + "/?datasource=tranquility",
                dataType: "json",
                contentType: "application/json",
                async: true,
                success: function (data) {
                    var citadelName = data.name;
                    var citadelSystem = data["system_id"];
                    var citadel = {};
                    citadel.name = citadelName;
                    citadel.system = citadelSystem;
                    citadelCache[citadelId] = citadel;
                    row.buyFromStation.name = citadelName;
                    row.buyFromStation.system = citadelSystem;
                    thiz.updateEndWithCitadel(row);
                }
            });
        }
    } else if(this.includeCitadels) {
        if (citadelCache[citadelId]) {
            var citadelName = citadelCache[citadelId].name;
            var citadelSystem = citadelCache[citadelId].system;
            row.buyFromStation.name = "<strong><em>" + citadelName + "*</em></strong>";
            row.buyFromStation.system = citadelSystem;
            this.updateEndWithCitadel(row);
        } else {
            $.ajax({
                type: "get",
                url: "https://stop.hammerti.me.uk/api/citadel/" + citadelId,
                dataType: "json",
                contentType: "application/json",
                async: true,
                success: function (data) {
                    data = data[citadelId];
                    var citadelName = data.name;
                    var citadelSystem = data.systemId;
                    var citadel = {};
                    citadel.name = citadelName;
                    citadel.system = citadelSystem;
                    citadelCache[citadelId] = citadel;
                    row.buyFromStation.name = "<strong><em>"+citadelName+"*</em></strong>";
                    row.buyFromStation.system = citadelSystem;
                    thiz.updateEndWithCitadel(row);
                }
            });
        }
    }
};

/**
* If all conditions are met then the row is added to the datatable
*/
Region.prototype.addRow = function(row) {

    var storageVolume = row.itemWeight * row.quantity;

    if(storageVolume > threshold_weight) {
        return;
    }

    if(isSpamItem(row.itemName)) {
        return;
    }

    createDataTable();

    this.updateStartWithCitdael(row);
};

/**
* Translates security codes to their respective numeric values
*/
Region.prototype.getSecurityCode = function (sec) {
    if (sec >= 0.5) {
        return "high_sec";
    } else if (sec > 0 && (this.security == "NULL" || this.security == "LOW")) {
        return "low_sec";
    } else if (sec <= 0 && (this.security == "NULL")) {
        return "null_sec";
    } else {
        return -1;
    }
}

/**
* Determines the endpoint's security code
*/
Region.prototype.getEndSystemSecurity = function (row) {
    var systemId = row.sellToStation.system;
    var thiz = this;

    if (systemSecurity[systemId]) {
        var security = systemSecurity[systemId];
        var securityCode = this.getSecurityCode(security);
        if (securityCode == -1) {
            return;
        }
        row.sellToStation.name = "<span class='" + securityCode + "'>" + row.sellToStation.name + "</span>";
        this.getRouteLength(row);
    } else {
        $.ajax({
            type: "get",
            url: "https://esi.evetech.net/latest/universe/systems/" + systemId + "/?datasource=tranquility&language=en-us",
            dataType: "json",
            contentType: "application/json",
            async: true,
            success: function (data) {
                systemSecurity[systemId] = data["security_status"];
                var security = systemSecurity[systemId];
                var securityCode = thiz.getSecurityCode(security);
                if (securityCode == -1) {
                    return;
                }
                row.sellToStation.name = "<span class='" + securityCode + "'>" + row.sellToStation.name + "</span>";
                thiz.getRouteLength(row);
            }
        });
    }
};

/**
* Determines the startpoint's security code
*/
Region.prototype.getStartSystemSecurity = function (row) {
    var systemId = row.buyFromStation.system;
    var thiz = this;

    if (systemSecurity[systemId]) {
        var security = systemSecurity[systemId];
        var securityCode = this.getSecurityCode(security);
        if(securityCode == -1) {
            return;
        }
        row.buyFromStation.name = "<span class='" + securityCode + "'>" + row.buyFromStation.name + "</span>";
        this.getEndSystemSecurity(row);
    } else {
        $.ajax({
            type: "get",
            url: "https://esi.evetech.net/latest/universe/systems/" + systemId + "/?datasource=tranquility&language=en-us",
            dataType: "json",
            contentType: "application/json",
            async: true,
            success: function (data) {
                systemSecurity[systemId] = data["security_status"];
                var security = systemSecurity[systemId];
                var securityCode = thiz.getSecurityCode(security);
                if (securityCode == -1) {
                    return;
                }
                row.buyFromStation.name = "<span class='" + securityCode + "'>" + row.buyFromStation.name + "</span>";
                thiz.getEndSystemSecurity(row);
            }
        });
    }
};

/**
* Gets the length of the route
*/
Region.prototype.getRouteLength = function (row) {
    var systemIdStart = row.buyFromStation.system;
    var systemIdEnd = row.sellToStation.system;
    var routeId = systemIdStart + "-" + systemIdEnd;
    var thiz = this;

    if (routeCache[routeId]) {
        var routeLength = routeCache[routeId];
        row.routeLength = routeLength;
        this.updateDatatable(row);
    } else {
        $.ajax({
            type: "get",
            url: "https://esi.evetech.net/latest/route/" + systemIdStart + "/" + systemIdEnd + "/?datasource=tranquility&flag=" + thiz.safety,
            dataType: "json",
            contentType: "application/json",
            async: true,
            success: function (data) {
                var routeLength = data.length;
                routeCache[routeId] = routeLength;
                row.routeLength = routeLength;
                thiz.updateDatatable(row);
            }
        });
    }
};

/**
* Given a row this function updates the datatable
*/
Region.prototype.updateDatatable = function(row) {
    var investigateId = row.sellToStation.station + row.buyFromStation.station + row.itemId + "_investigate";
    var storageVolume = row.itemWeight * row.quantity;

    var row_data = [
        "<span id=\"" + investigateId + "\"" +
        "data-itemId=\"" + row.itemId + "\"" +
        "data-itemName=\"" + row.itemName + "\"" +
        "data-fromStationId=\"" + row.buyFromStation.station + "\"" +
        "data-sellStationId=\"" + row.sellToStation.station + "\">" +
        "<i class=\"fa fa-search-plus\"></i>" +
        "</span>",
        row.itemName,
        row.buyFromStation.name,
        numberWithCommas(row.quantity),
        numberWithCommas(row.buyPrice.toFixed(2)),
        numberWithCommas(row.buyCost.toFixed(2)),
        row.sellToStation.name,
        numberWithCommas(row.sellPrice.toFixed(2)),
        // numberWithCommas(row.perItemProfit.toFixed(2)),
        row.routeLength,
        numberWithCommas((row.totalProfit/row.routeLength).toFixed(2)),
        numberWithCommas(row.totalProfit.toFixed(2)),
        (row.roi.toFixed(3) * 100).toFixed(1) + "%",
        numberWithCommas(storageVolume.toFixed(2))
    ];

    var rowIndex = $('#dataTable').dataTable().fnAddData(row_data);
    $('#dataTable').dataTable().fnGetNodes(rowIndex);

    $("#" + investigateId).on('click', function () {
        var popId = parseInt(this.dataset.itemid);
        var popName = this.dataset.itemname;
        var popFrom = parseInt(this.dataset.fromstationid);

        var fromStation = {};
        fromStation.name = stationIdToName[popFrom];
        fromStation.station = popFrom;

        var toStation = {};
        toStation.name = stationIdToName[this.dataset.sellstationid];
        toStation.station = parseInt(this.dataset.sellstationid);

        open_popup(popId, popName, fromStation, toStation);
    });

    rowAdded = true;
};

/**
 * Creates a Station object
 *
 * @param stationLocation a json object that contains the region and station of the start location
 * @constructor
 */
function Station(stationLocation) {
    this.stationLocation = stationLocation;

    this.allOrders = {};
    this.allOrders.completePages = [];
    this.allOrders.complete = false;
    this.allOrders.pageBookend = PAGE_MULTIPLE;

    this.itemCache = {};

    this.itemIds = [];
    this.secondsToRefresh = 60;
    this.filtered = false;
    this.completed = false;
    this.filterCount = 0;

    this.asyncChecker = null;
    this.asyncCalculator = null;
    this.asyncFilter = null;
    this.asyncRefresher = null;

    routes.push(this);
}

Station.prototype.className = function() {
    return "Station";
};

/**
 * Begins the process for finding station information and displaying the best trades for the station.
 */
Station.prototype.startStation = function() {
    var page;
    var regionId = parseInt(this.stationLocation.region);
    var stationId = parseInt(this.stationLocation.station);

    for(page = 1; page <= PAGE_MULTIPLE; page++){
        this.getOrders(regionId, stationId, page, this.allOrders, ALL_ORDER);
    }

    $("#selection").hide();
    this.asyncCheck();
};

/**
 * Asynchronous checking function that periodically checks all of the orders to ensure they are still running
 */
Station.prototype.asyncCheck = function() {
    var thiz = this;
    this.asyncChecker = setInterval(function(){
        thiz.executeOrders();
    }, 1000);
};

/**
 * Calculates the progress using a logarithmic function
 *
 * @returns {number}
 */
Station.prototype.recalculateProgress = function() {
    var progressUpdate = this.getNumberOfCompletePages(this.allOrders);
    return progressUpdate <= 0 ? 1 : 35.0 * Math.log10(progressUpdate);
};


/**
 * Getting the orders for a specific region, station, and page number.
 *
 * @param region The region ID in question.
 * @param station The station ID in question.
 * @param page The market page number.
 * @param composite The running buy or sell order list object.
 * @param orderType The order type to get orders for.
 */
Station.prototype.getOrders = function(region, station, page, composite, orderType) {
    var url = marketEndpointBuilder(region, page, orderType);
    var thiz = this;

    if(!composite.completePages[page]) {
        $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            contentType: "application/json",
            async: true,
            success: function(data) {
                incrementProgress(composite, page);

                if (data.length === 0 && !composite.complete) {
                    composite.complete = true;
                    console.log("Completed " + station + " order fetch at " + page);
                    thiz.completed = true;
                } else {
                    for (var i = 0; i < data.length; i++) {
                        if (data[i]["location_id"] === station) {
                            var id = data[i]["type_id"];
                            if (!composite[id]) {
                                composite[id] = [];
                            }
                            composite[id].push(data[i]);
                        }
                    }

                    if (!composite.complete && thiz.getNumberOfCompletePages(composite) === composite.pageBookend) {
                        var _page = page + 1;
                        composite.pageBookend = (composite.pageBookend + PAGE_MULTIPLE);

                        for (var newBookend = composite.pageBookend; _page <= newBookend; _page++) {
                            thiz.getOrders(region, station, _page, composite, orderType);
                        }
                    }
                }

            },
            error: function(XMLHttpRequest, textStatus, errorThrown){
                displayError();
                incrementProgress(composite, page);

                if(!composite.complete && thiz.getNumberOfCompletePages(composite) === composite.pageBookend) {
                    var _page = page + 1;
                    composite.pageBookend = (composite.pageBookend + PAGE_MULTIPLE);

                    for (var newBookend = composite.pageBookend; _page <= newBookend; _page++) {
                        thiz.getOrders(region, station, _page, composite, orderType);
                    }
                }
            }
        });
    }
};

/**
 * Gets the number of completed pages for a specific order
 *
 * @param order The specific buy or sell order
 * @returns {number} The number of completed pages
 */
Station.prototype.getNumberOfCompletePages = function(order) {
    var numberOfCompletedPages = 0;
    for(var i = 0; i < order.completePages.length; i++) {
        if (order.completePages[i]) {
            numberOfCompletedPages++;
        }
    }
    return numberOfCompletedPages;
};


/**
 * Checks all active order requests to verify whether they are complete or not
 *
 * @returns {boolean|*}
 */
Station.prototype.checkOrdersComplete = function() {
    var orderFull = (this.getNumberOfCompletePages(this.allOrders) === this.allOrders.pageBookend);
    var ordersComplete = this.allOrders.complete && this.completed;

    return (orderFull && ordersComplete);
};

/**
 * If all the active orders are complete then it begins processing them
 */
Station.prototype.executeOrders = function() {
    if (this.checkOrdersComplete()) {

        clearInterval(this.asyncChecker);
        hideError();

        for(itemId in this.allOrders){
            if(itemId !== "completePages" && itemId !== "complete" && itemId !== "pageBookend")
                this.itemIds.push(itemId);
        }

        this.asyncCalculate();
    }
};

/**
* Clears the entire class including asynchronous timers.
*/
Station.prototype.clear = function() {
    this.stationLocation = null;

    this.allOrders = {};
    this.allOrders.completePages = [];
    this.allOrders.complete = false;
    this.allOrders.pageBookend = PAGE_MULTIPLE;

    this.itemCache = {};

    this.itemIds = [];
    this.secondsToRefresh = 60;
    this.filtered = false;
    this.filterCount = 0;
    this.completed = false;

    clearInterval(this.asyncChecker);
    clearInterval(this.asyncCalculator);
    clearInterval(this.asyncFilter);
    clearInterval(this.asyncRefresher);
};

/**
 * The asynchronous function that calculated when a refresh can occur.
 */
Station.prototype.asyncRefresh = function() {
    var thiz = this;
    this.asyncRefresher = setInterval(function(){
        if(thiz.secondsToRefresh <= 0){
            clearInterval(thiz.asyncRefresher);
            $("#refresh-timer").remove();
            $("#buyingFooter").append('<div id="refresh-button">' +
                '<input type="button" class="btn btn-default" onclick="refresh()" value="Refresh Table with Last Query"/>' +
                '</div>');
        } else {
            if (rowAdded) {
                $(".loading").hide();
            } else {
                $(".loading").text("No trades found for your filters.");
            }

            $(".tableLoadingIcon").hide();

            $("#refresh-timer").html("<p>Refresh allowed in: " + thiz.secondsToRefresh + " seconds.");
            thiz.secondsToRefresh--;
        }
    }, 1000);
};

/**
 * The function that asynchronously calculates trades.
 */
Station.prototype.asyncCalculate = function() {
    var thiz = this;
    this.asyncCalculator = setInterval(function(){
        if(!thiz.filtered){
            thiz.filtered = true;
            $("#buyingFooter").append("<div id='filtering-data'>Filtering Results. Please wait.</br>If it takes too long try a smaller margin range.</div>");
            thiz.asyncFiltering();
        }

        while(thiz.itemIds.length != 0 && executingCount < 1500){
            executingCount++;
            var itemId = thiz.itemIds.splice(0, 1)[0];
            thiz.calculateNext(itemId);
        }

        if(thiz.itemIds.length == 0 && executingCount <= 0) {
            clearInterval(thiz.asyncCalculator);

            $(".tableLoadingIcon").hide();

            if (rowAdded) {
                $(".loading").hide();
            }

            $("#buyingFooter").append('<div id="refresh-timer"></div>');

            thiz.asyncRefresh();
        }
    }, 1000);
};

/**
 * Calculates the trades for the given itemId.
 *
 * @param itemId The itemId to calculate for.
 */
Station.prototype.calculateNext = function(itemId) {

    var buyPrice = getMarketData(this.allOrders[itemId], this.stationLocation.station, SELL_ORDER, itemId, false);

    if (buyPrice.length > 0) {
        var executed = false;

        if(this.allOrders[itemId]){
            var sellPrice = getMarketData(this.allOrders[itemId], this.stationLocation.station, BUY_ORDER, itemId, false);
            if(sellPrice.length > 0){
                executed = true;

                this.getItemInfo(itemId, buyPrice, sellPrice);
            }
        }

        if(!executed){
            executingCount--;
        }
    } else {
        executingCount--;
    }
};

/**
* Gets the best sell and buy price for a particular itemId
*
* @param itemId The itemId to calculate for.
* @param buyPrice The items buyPrice to compare.
* @param sellPrice The items sellPrice to compare.
*/
Station.prototype.getItemInfo = function(itemId, buyPrice, sellPrice){
    var bestBuyPrice = sellPrice[0][0];
    var bestSellPrice = buyPrice[0][0];

    for(var i = 0; i < buyPrice.length; i++){
        for(var j = 0; j < sellPrice.length; j++){
            if(sellPrice[j][0] > bestSellPrice) {
                bestSellPrice = sellPrice[j][0];
            }
            if(buyPrice[i][0] < bestBuyPrice) {
                bestBuyPrice = buyPrice[i][0];
            }
        }
    }

    var row = {};
    buyPrice = bestBuyPrice;
    sellPrice = bestSellPrice;

    var profit_per_item = sellPrice-buyPrice;
    var margin = (sellPrice - buyPrice) / sellPrice;

    if(margin*100 >= threshold_margin_lower && margin*100 <= threshold_margin_upper && profit_per_item > 1000){
        row.buyPrice = buyPrice;
        row.sellPrice = sellPrice;
        row.itemId = itemId;
        this.getItemVolume(itemId, row);
    }else {
        executingCount--;
    }
};

/**
* An async function which determines when filtering is occuring as well as when it has stopped.
*/
Station.prototype.asyncFiltering = function() {
    var thiz = this;
    this.asyncFilter = setInterval(function(){
            thiz.filterCount += 1;
            var ellipses = "";
            for(var i = 0; i < ( thiz.filterCount % 5) ; i++){
                ellipses += ".";
            }

            $("#filtering-data").html("Filtering Results. Please wait" + ellipses + "</br>If it takes too long try a smaller margin range.");

            if(executingCount == 0) {
                clearInterval(thiz.asyncFilter);
                $("#filtering-data").remove();
            }
        },
        250);
};

/**
* The rest function to get an item's market volume
*
* @param itemId the item id for the item in question
* @param row the data row that this will be applied to
*/
Station.prototype.getItemVolume = function(itemId, row){
    var url = getVolumeEndpointBuilder(this.stationLocation.region, itemId);
    var thiz = this;
    $.ajax({
        type: "get",
        url: url,
        dataType: "json",
        async: true,
        cache: false,
        contentType: "application/json",
        success: function(volumeData) {
            if(volumeData && volumeData[volumeData.length-1] && volumeData[volumeData.length-1].volume){
                row.volume = volumeData[volumeData.length-1].volume;
                row.volume14 = 0;
                row.volume30 = 0;
                for(var i = 1; i < 31; i++) {
                    if(volumeData[volumeData.length-i] && volumeData[volumeData.length-i].volume) {
                        if (i < 15) {
                            row.volume14 += volumeData[volumeData.length-i].volume;
                        }
                        row.volume30 += volumeData[volumeData.length-i].volume;
                    }
                }
                row.volume14 = parseInt(row.volume14 / 14);
                row.volume30 = parseInt(row.volume30 / 30);

                if(row.volume14 >= volume_threshold){
                    thiz.getItemWeight(itemId, row);
                }else{
                    executingCount--;
                }
            }else{
                executingCount--;
            }
        },
        error: function (request, error) {
            if(request.status != 404 && request.statusText !== "parsererror") {
                thiz.getItemVolume(itemId, row);
            } else {
                executingCount--;
            }
        }
    });
};

/**
* The rest function to get an item's weightData
*
* @param itemId the item id for the item in question
* @param row the data row that this will be applied to
*/
Station.prototype.getItemWeight = function(itemId, row){
    if(this.itemCache[itemId]){
        row.itemName = this.itemCache[itemId].name;
        this.addRow(row);
        executingCount--;
    }else{
        var thiz = this;
        var url = getWeightEndpointBuilder(itemId);
        $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            async: true,
            cache: false,
            contentType: "application/json",
            success: function(weightData) {
                executingCount--;

                var name = weightData.name;

                thiz.itemCache[itemId] = {};
                thiz.itemCache[itemId].name = name;

                row.itemName = name;

                thiz.addRow(row);
            },
            error: function (request, error) {
                if(request.status != 404 && request.statusText !== "parsererror") {
                    thiz.getItemWeight(itemId, row);
                } else {
                    executingCount--;
                }
            }
        });
    }
};

/**
* Adds the row to the datatable. This also creates the datatable if it has not been created yet.
*
* @param row the row to be added
*/
Station.prototype.addRow = function(row) {

    var profitPerItem = row.sellPrice - row.buyPrice;
    var margin = (row.sellPrice - row.buyPrice) / row.sellPrice;
    margin = (margin.toFixed(3)*100).toFixed(1)+"%";

    createDataTable();

    var row_data = [
        row.itemName,
        numberWithCommas(row.buyPrice.toFixed(2)),
        numberWithCommas(row.sellPrice.toFixed(2)),
        numberWithCommas(profitPerItem.toFixed(2)),
        margin,
        numberWithCommas(row.volume),
        numberWithCommas(row.volume14),
        numberWithCommas(row.volume30)
    ];

    $('#dataTable').dataTable().fnAddData(row_data);

    rowAdded  = true;
};

var station_ids=[
  [
    60014862,
    10000005,
    "0-G8NO VIII - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60014885,
    10000005,
    "0-W778 VII - Moon 2 - Serpentis Corporation Refining"
  ],
  [
    60014338,
    10000022,
    "0G-A25 VI - Moon 20 - True Power Mining Outpost"
  ],
  [
    60013636,
    10000019,
    "0IRK-R IX - Jove Navy Testing Facilities"
  ],
  [
    60013669,
    10000019,
    "0IRK-R VIII - Moon 3 - Jovian Directorate Academy"
  ],
  [
    60013459,
    10000041,
    "0LTQ-C V - Moon 18 - Intaki Space Police Assembly Plant"
  ],
  [
    60013885,
    10000017,
    "0M-M64 VI - Prosper Depository"
  ],
  [
    60013729,
    10000017,
    "0M-M64 VII - Moon 5 - Jovian Directorate Bureau"
  ],
  [
    60014950,
    10000060,
    "0N-3RO VII - Moon 14 - Blood Raiders Testing Facilities"
  ],
  [
    60011218,
    10000041,
    "0T-AMZ IX - Moon 6 - Aliastra Retail Center"
  ],
  [
    60011215,
    10000041,
    "0T-AMZ VII - Moon 10 - Aliastra Warehouse"
  ],
  [
    60014320,
    10000022,
    "0T-LIB V - Moon 5 - True Power Mining Outpost"
  ],
  [
    60014200,
    10000022,
    "0T-LIB V - Moon 6 - True Creations Testing Facilities"
  ],
  [
    60013897,
    10000019,
    "0Z-VHC VI - Moon 12 - Prosper Depository"
  ],
  [
    60014032,
    10000019,
    "0Z-VHC VI - Moon 12 - Shapeset Shipyard"
  ],
  [
    60013444,
    10000041,
    "1-NKVT X - Intaki Space Police Logistic Support"
  ],
  [
    60014895,
    10000039,
    "111-F1 VIII - Moon 3 - Republic Military School Refining"
  ],
  [
    60013720,
    10000017,
    "1C-TD6 VIII - Moon 2 - Jovian Directorate Treasury"
  ],
  [
    60013726,
    10000017,
    "1C-TD6 X - Moon 16 - Jovian Directorate Treasury"
  ],
  [
    60013591,
    10000017,
    "1C-TD6 X - Moon 4 - Jove Navy Testing Facilities"
  ],
  [
    60014945,
    10000060,
    "1DH-SX III - Moon 1 - Blood Raiders Logistic Support"
  ],
  [
    60014251,
    10000022,
    "1H4V-O II - Moon 1 - True Creations Shipyard"
  ],
  [
    60014365,
    10000022,
    "1H4V-O V - Moon 2 - True Power Logistic Support"
  ],
  [
    60014020,
    10000017,
    "1SR-HT I - Shapeset Storage Bay"
  ],
  [
    60014911,
    10000008,
    "1V-LI2 III - Moon 2 - Serpentis Corporation Cloning"
  ],
  [
    60014878,
    10000056,
    "2-RSC7 VI - Moon 2 - Serpentis Corporation Manufacturing"
  ],
  [
    60014865,
    10000008,
    "28Y9-P V - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60002530,
    10000041,
    "2G38-I VI - Expert Distribution Warehouse"
  ],
  [
    60002527,
    10000041,
    "2G38-I VIII - Moon 9 - Expert Distribution Warehouse"
  ],
  [
    60014915,
    10000025,
    "2O-EEW IV - Moon 3 - Serpentis Corporation Cloning"
  ],
  [
    60009943,
    10000041,
    "2P-4LS VIII - Moon 10 - Quafe Company Factory"
  ],
  [
    60009949,
    10000041,
    "2P-4LS VIII - Moon 11 - Quafe Company Warehouse"
  ],
  [
    60009946,
    10000041,
    "2P-4LS VIII - Moon 7 - Quafe Company Warehouse"
  ],
  [
    60013747,
    10000019,
    "2RV-06 VIII - Moon 11 - Jovian Directorate Treasury"
  ],
  [
    60013468,
    10000041,
    "2X-PQG III - Moon 17 - Intaki Syndicate Academy"
  ],
  [
    60013903,
    10000019,
    "3-CE1R VIII - Moon 5 - Prosper Vault"
  ],
  [
    60014014,
    10000017,
    "3-XORH IV - Shapeset Shipyard"
  ],
  [
    60013807,
    10000017,
    "3-XORH VI - Moon 1 - Jovian Directorate Bureau"
  ],
  [
    60014122,
    10000041,
    "31-MLU IX - Moon 1 - Thukker Mix Factory"
  ],
  [
    60013489,
    10000041,
    "31-MLU X - Moon 8 - Intaki Syndicate Bureau"
  ],
  [
    60014951,
    10000060,
    "319-3D IX - Moon 22 - Blood Raiders Logistic Support"
  ],
  [
    60013540,
    10000041,
    "35-RK9 IX - Moon 4 - Intaki Syndicate Bureau"
  ],
  [
    60014149,
    10000022,
    "37S-KO III - Moon 1 - True Creations Shipyard"
  ],
  [
    60014152,
    10000022,
    "37S-KO V - Moon 2 - True Creations Shipyard"
  ],
  [
    60014155,
    10000022,
    "37S-KO VI - Moon 14 - True Creations Assembly Plant"
  ],
  [
    60014287,
    10000022,
    "37S-KO VI - Moon 9 - True Power Assembly Plant"
  ],
  [
    60014284,
    10000022,
    "37S-KO VII - True Power Mining Outpost"
  ],
  [
    60014898,
    10000050,
    "3BK-O7 VIII - Moon 1 - Serpentis Corporation Refining"
  ],
  [
    60014894,
    10000035,
    "3JN9-Q XII - Moon 3 - Serpentis Corporation Refining"
  ],
  [
    60013531,
    10000041,
    "3KNK-A IX - Moon 12 - Intaki Syndicate Bureau"
  ],
  [
    60014410,
    10000041,
    "3KNK-A IX - Moon 2 - Trust Partners Trading Post"
  ],
  [
    60011275,
    10000041,
    "3KNK-A IX - Moon 4 - Aliastra Warehouse"
  ],
  [
    60013528,
    10000041,
    "3MOG-V X - Moon 2 - Intaki Syndicate Bureau"
  ],
  [
    60014863,
    10000006,
    "4-EFLU VII - Moon 3 - Serpentis Corporation Manufacturing"
  ],
  [
    60014185,
    10000022,
    "42-UOW V - True Creations Shipyard"
  ],
  [
    60010825,
    10000057,
    "4C-B7X V - Moon 7 - Chemal Tech Factory"
  ],
  [
    60012586,
    10000057,
    "4C-B7X VI - Moon 1 - Outer Ring Excavations Refinery"
  ],
  [
    60010831,
    10000057,
    "4C-B7X VII - Moon 12 - Chemal Tech Factory"
  ],
  [
    60012583,
    10000057,
    "4C-B7X VIII - Moon 1 - Outer Ring Excavations Mining Outpost"
  ],
  [
    60014269,
    10000022,
    "4GQ-XQ IX - Moon 1 - True Creations Shipyard"
  ],
  [
    60014266,
    10000022,
    "4GQ-XQ XIV - Moon 10 - True Creations Shipyard"
  ],
  [
    60011221,
    10000041,
    "4L-E5P VI - Moon 6 - Aliastra Retail Center"
  ],
  [
    60011224,
    10000041,
    "4L-E5P VII - Moon 1 - Aliastra Warehouse"
  ],
  [
    60014903,
    10000060,
    "5-6QW7 VII - Moon 3 - Serpentis Corporation Refining"
  ],
  [
    60013534,
    10000041,
    "5-FGQI V - Moon 13 - Intaki Syndicate Academy"
  ],
  [
    60014891,
    10000014,
    "5-N2EY VIII - Moon 5 - Republic Military School Refining"
  ],
  [
    60013924,
    10000017,
    "5-P3CQ VIII - Moon 5 - Prosper Depository"
  ],
  [
    60014053,
    10000019,
    "50-TJY VII - Moon 8 - Shapeset Shipyard"
  ],
  [
    60014470,
    10000017,
    "54-VNO IX - Moon 1 - X-Sense Chemical Refinery"
  ],
  [
    60013558,
    10000017,
    "54-VNO V - Moon 2 - Jove Navy Assembly Plant"
  ],
  [
    60013654,
    10000017,
    "54-VNO VI - Moon 1 - Jovian Directorate Bureau"
  ],
  [
    60013660,
    10000017,
    "54-VNO VIII - Moon 3 - Jovian Directorate Bureau"
  ],
  [
    60013873,
    10000017,
    "54-VNO VIII - Moon 3 - Prosper Depository"
  ],
  [
    60013999,
    10000017,
    "54-VNO VIII - Moon 3 - Shapeset Shipyard"
  ],
  [
    60013561,
    10000017,
    "54-VNO X - Jove Navy Assembly Plant"
  ],
  [
    60013645,
    10000017,
    "54-VNO X - Moon 3 - Jovian Directorate Bureau"
  ],
  [
    60013555,
    10000017,
    "54-VNO XI - Moon 2 - Jove Navy Testing Facilities"
  ],
  [
    60013876,
    10000017,
    "54-VNO XII - Moon 2 - Prosper Depository"
  ],
  [
    60013426,
    10000041,
    "57-YRU IV - Moon 9 - Intaki Space Police Logistic Support"
  ],
  [
    60012751,
    10000012,
    "5E-VR8 I - Moon 10 - Salvation Angels Chemical Refinery"
  ],
  [
    60014254,
    10000022,
    "5J-UEX IV - Moon 1 - True Creations Assembly Plant"
  ],
  [
    60014248,
    10000022,
    "5J-UEX IV - Moon 7 - True Creations Shipyard"
  ],
  [
    60013765,
    10000019,
    "5V-YL6 VII - Moon 11 - Jovian Directorate Academy"
  ],
  [
    60012580,
    10000023,
    "5ZXX-K V - Moon 17 - Mordu's Legion Testing Facilities"
  ],
  [
    60013810,
    10000017,
    "6-23NU II - Moon 1 - Jovian Directorate Academy"
  ],
  [
    60013822,
    10000017,
    "6-23NU V - Moon 13 - Jovian Directorate Bureau"
  ],
  [
    60013549,
    10000041,
    "6-CZ49 VI - Moon 6 - Intaki Syndicate Bureau"
  ],
  [
    60013900,
    10000019,
    "6-HFD6 V - Moon 1 - Prosper Depository"
  ],
  [
    60013609,
    10000019,
    "6-HFD6 V - Moon 14 - Jove Navy Assembly Plant"
  ],
  [
    60013612,
    10000019,
    "6-HFD6 V - Moon 19 - Jove Navy Assembly Plant"
  ],
  [
    60013573,
    10000017,
    "6-NCE7 IV - Jove Navy Logistic Support"
  ],
  [
    60013711,
    10000017,
    "6-QXE6 VI - Moon 22 - Jovian Directorate Bureau"
  ],
  [
    60014916,
    10000031,
    "68FT-6 VI - Moon 1 - Serpentis Corporation Cloning"
  ],
  [
    60013582,
    10000019,
    "69A-54 VIII - Jove Navy Assembly Plant"
  ],
  [
    60013762,
    10000019,
    "69A-54 X - Moon 12 - Jovian Directorate Bureau"
  ],
  [
    60013759,
    10000019,
    "69A-54 X - Moon 8 - Jovian Directorate Bureau"
  ],
  [
    60013261,
    10000015,
    "6NJ8-V VI - Moon 6 - Guristas Production Shipyard"
  ],
  [
    60012556,
    10000015,
    "6NJ8-V VII - Moon 2 - Guristas Logistic Support"
  ],
  [
    60014896,
    10000045,
    "6OYQ-Z II - Moon 1 - Serpentis Corporation Refining"
  ],
  [
    60014332,
    10000022,
    "6QBH-S IV - Moon 13 - True Power Mining Outpost"
  ],
  [
    60014928,
    10000062,
    "6T3I-L VII - Moon 5 - Serpentis Corporation Cloning"
  ],
  [
    60014167,
    10000022,
    "6Y-0TW II - Moon 12 - True Creations Shipyard"
  ],
  [
    60014173,
    10000022,
    "6Y-0TW II - Moon 16 - True Creations Assembly Plant"
  ],
  [
    60014170,
    10000022,
    "6Y-0TW II - Moon 5 - True Creations Shipyard"
  ],
  [
    60014371,
    10000022,
    "6Y-0TW III - True Power Assembly Plant"
  ],
  [
    60013777,
    10000019,
    "7-8XK0 VI - Jovian Directorate Bureau"
  ],
  [
    60013771,
    10000019,
    "7-8XK0 VII - Moon 8 - Jovian Directorate Bureau"
  ],
  [
    60013882,
    10000019,
    "7-8XK0 VIII - Moon 5 - Prosper Depository"
  ],
  [
    60014296,
    10000022,
    "7-X3RN VII - Moon 12 - True Power Mining Outpost"
  ],
  [
    60013675,
    10000019,
    "7BA-TK III - Moon 2 - Jovian Directorate Bureau"
  ],
  [
    60013663,
    10000019,
    "7BA-TK VI - Moon 4 - Jovian Directorate Bureau"
  ],
  [
    60013618,
    10000017,
    "8-ULAA VI - Moon 13 - Jove Navy Testing Facilities"
  ],
  [
    60013756,
    10000019,
    "8-UWFS II - Jovian Directorate Academy"
  ],
  [
    60014922,
    10000051,
    "9-4RP2 IV - Moon 2 - Serpentis Corporation Cloning"
  ],
  [
    60013615,
    10000019,
    "9-BUSQ VII - Moon 4 - Jove Navy Assembly Plant"
  ],
  [
    60013084,
    10000017,
    "9-ERCP V - Genolution Biotech Production"
  ],
  [
    60014464,
    10000017,
    "9-ERCP VII - Moon 9 - X-Sense Chemical Refinery"
  ],
  [
    60013081,
    10000017,
    "9-ERCP VIII - Genolution Biotech Production"
  ],
  [
    60013786,
    10000019,
    "90G-OA XII - Moon 19 - Jovian Directorate Bureau"
  ],
  [
    60002110,
    10000041,
    "98Q-8O V - Moon 4 - Ishukone Corporation Factory"
  ],
  [
    60013450,
    10000041,
    "98Q-8O V - Moon 8 - Intaki Space Police Assembly Plant"
  ],
  [
    60013402,
    10000041,
    "98Q-8O VII - Moon 16 - Intaki Commerce Trading Post"
  ],
  [
    60014910,
    10000007,
    "995-3G V - Moon 5 - Serpentis Corporation Cloning"
  ],
  [
    60014921,
    10000050,
    "9CG6-H VIII - Moon 4 - Serpentis Corporation Cloning"
  ],
  [
    60013435,
    10000041,
    "9GYL-O V - Moon 13 - Intaki Space Police Assembly Plant"
  ],
  [
    60013480,
    10000041,
    "9GYL-O V - Moon 9 - Intaki Syndicate Bureau"
  ],
  [
    60013474,
    10000041,
    "9GYL-O VI - Moon 16 - Intaki Syndicate Bureau"
  ],
  [
    60014299,
    10000022,
    "9O-ZTS II - Moon 1 - True Power Testing Facilities"
  ],
  [
    60014221,
    10000022,
    "9RQ-L8 VII - Moon 11 - True Creations Shipyard"
  ],
  [
    60012862,
    10000058,
    "A-1CON X - Moon 10 - Serpentis Corporation Chemical Storage"
  ],
  [
    60012784,
    10000058,
    "A-1CON X - Moon 2 - Salvation Angels Warehouse"
  ],
  [
    60014944,
    10000060,
    "A-ELE2 VI - Blood Raiders Assembly Plant"
  ],
  [
    60013486,
    10000041,
    "A-SJ8X VII - Moon 1 - Intaki Syndicate Bureau"
  ],
  [
    60014362,
    10000022,
    "A-XASO IV - Moon 4 - True Power Mining Outpost"
  ],
  [
    60013492,
    10000041,
    "A-ZLHX VII - Moon 2 - Intaki Syndicate Bureau"
  ],
  [
    60013495,
    10000041,
    "A-ZLHX XI - Moon 1 - Intaki Syndicate Bureau"
  ],
  [
    60014188,
    10000022,
    "A4UG-O VII - Moon 16 - True Creations Shipyard"
  ],
  [
    60000772,
    10000016,
    "Aakari I - Minedrill Refinery"
  ],
  [
    60005137,
    10000016,
    "Aakari VII - Moon 6 - Republic Security Services Assembly Plant"
  ],
  [
    60012217,
    10000012,
    "AAM-1A II - Moon 11 - Archangels Testing Facilities"
  ],
  [
    60010030,
    10000041,
    "AAS-8R IV - Moon 2 - Quafe Company Warehouse"
  ],
  [
    60010045,
    10000041,
    "AAS-8R V - Quafe Company Retail Center"
  ],
  [
    60000502,
    10000002,
    "Abagawa IV - Moon 2 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60001645,
    10000002,
    "Abagawa IX - Moon 1 - Caldari Steel Factory"
  ],
  [
    60002746,
    10000002,
    "Abagawa VII - Moon 14 - Sukuuvestaa Corporation Factory"
  ],
  [
    60004054,
    10000002,
    "Abagawa VIII - Moon 4 - Peace and Order Unit Logistic Support"
  ],
  [
    60007312,
    10000020,
    "Abai IV - Moon 11 - Joint Harvesting Mineral Reserve"
  ],
  [
    60008662,
    10000043,
    "Abaim V - Moon 1 - Sarum Family Assembly Plant"
  ],
  [
    60009877,
    10000043,
    "Abaim V - Quafe Company Factory"
  ],
  [
    60009268,
    10000043,
    "Abaim VIII - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60005521,
    10000043,
    "Abaim VIII - Moon 4 - Core Complexion Inc. Factory"
  ],
  [
    60005524,
    10000043,
    "Abaim XI - Moon 1 - Core Complexion Inc. Factory"
  ],
  [
    60005527,
    10000043,
    "Abaim XI - Moon 3 - Core Complexion Inc. Factory"
  ],
  [
    60007963,
    10000052,
    "Aband IV - Moon 12 - Ministry of War Archives"
  ],
  [
    60010405,
    10000065,
    "Abath V - Moon 2 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60006703,
    10000067,
    "Abhan VII - Moon 1 - Zoar and Sons Factory"
  ],
  [
    60010003,
    10000067,
    "Abhan VIII - Moon 1 - Quafe Company Warehouse"
  ],
  [
    60015045,
    10000042,
    "Abrat III - Pator Tech School"
  ],
  [
    60015139,
    10000030,
    "Abudban IV - Tribal Liberation Force Logistic Support"
  ],
  [
    60004591,
    10000030,
    "Abudban IX - Moon 7 - Brutor Tribe Bureau"
  ],
  [
    60009121,
    10000030,
    "Abudban VIII - Moon 19 - TransStellar Shipping Storage"
  ],
  [
    60005728,
    10000030,
    "Abudban VIII - Moon 6 - Six Kin Development Production Plant"
  ],
  [
    60005044,
    10000030,
    "Abudban X - Moon 10 - Urban Management Bureau Offices"
  ],
  [
    60011113,
    10000037,
    "Aclan IX - Moon 2 - FedMart Warehouse"
  ],
  [
    60009358,
    10000037,
    "Aclan V - Moon 1 - Federal Freight Storage"
  ],
  [
    60011509,
    10000037,
    "Aclan VI - Garoun Investment Bank Vault"
  ],
  [
    60009352,
    10000037,
    "Aclan X - Moon 19 - Federal Freight Storage"
  ],
  [
    60011128,
    10000037,
    "Aclan X - Moon 24 - FedMart Storage"
  ],
  [
    60011692,
    10000037,
    "Aclan X - Moon 7 - Federal Administration Archives"
  ],
  [
    60010936,
    10000064,
    "Actee I - Duvolle Laboratories Factory"
  ],
  [
    60011338,
    10000064,
    "Actee III - Bank of Luminaire Depository"
  ],
  [
    60011728,
    10000048,
    "Adacyne III - Moon 14 - Federal Administration Information Center"
  ],
  [
    60011725,
    10000048,
    "Adacyne IV - Moon 14 - Federal Administration Bureau Offices"
  ],
  [
    60010639,
    10000048,
    "Adacyne V - Moon 8 - The Scope Development Studio"
  ],
  [
    60003304,
    10000020,
    "Adahum IX - Moon 2 - Modern Finances Vault"
  ],
  [
    60015033,
    10000068,
    "Adallier II - Center for Advanced Studies School"
  ],
  [
    60012364,
    10000037,
    "Adeel VIII - Moon 1 - CONCORD Treasury"
  ],
  [
    60009784,
    10000037,
    "Adeel VIII - Moon 6 - Combined Harvest Plantation"
  ],
  [
    60014557,
    10000037,
    "Adeel VIII - X-Sense Reprocessing Facility"
  ],
  [
    60009001,
    10000043,
    "Adia VI - Moon 8 - Theology Council Accounting"
  ],
  [
    60006325,
    10000043,
    "Adia VII - Moon 1 - Carthum Conglomerate Foundry"
  ],
  [
    60006322,
    10000043,
    "Adia VIII - Moon 9 - Carthum Conglomerate Foundry"
  ],
  [
    60009760,
    10000032,
    "Adiere VI - Moon 4 - Combined Harvest Warehouse"
  ],
  [
    60009040,
    10000032,
    "Adiere X - TransStellar Shipping Storage"
  ],
  [
    60003283,
    10000064,
    "Adirain IV - Moon 2 - Modern Finances Depository"
  ],
  [
    60000115,
    10000064,
    "Adirain V - Moon 4 - CBD Corporation Storage"
  ],
  [
    60005797,
    10000032,
    "Adrallezoen II - Moon 1 - Freedom Extension Storage"
  ],
  [
    60005803,
    10000032,
    "Adrallezoen V - Moon 1 - Freedom Extension Warehouse"
  ],
  [
    60005191,
    10000032,
    "Adrallezoen V - Republic Security Services Logistic Support"
  ],
  [
    60005791,
    10000032,
    "Adrallezoen VI - Moon 1 - Freedom Extension Storage"
  ],
  [
    60005230,
    10000064,
    "Adrel IV - Moon 9 - Republic Security Services Logistic Support"
  ],
  [
    60009601,
    10000032,
    "Adreland VI - Moon 8 - Astral Mining Inc. Refinery"
  ],
  [
    60003712,
    10000028,
    "Aedald VI - Moon 3 - Caldari Business Tribunal"
  ],
  [
    60003721,
    10000028,
    "Aedald VII - Moon 15 - Caldari Business Tribunal Information Center"
  ],
  [
    60004579,
    10000028,
    "Aedald VII - Moon 5 - Vherokior Tribe Bureau"
  ],
  [
    60014761,
    10000028,
    "Aedald VIII - Moon 5 - Republic Military School"
  ],
  [
    60003706,
    10000028,
    "Aedald VIII - Moon 6 - Caldari Business Tribunal Accounting"
  ],
  [
    60006496,
    10000028,
    "Aeddin II - Imperial Armaments Warehouse"
  ],
  [
    60004564,
    10000028,
    "Aeditide IV - Moon 1 - Vherokior Tribe Bureau"
  ],
  [
    60012421,
    10000028,
    "Aeditide V - CONCORD Bureau"
  ],
  [
    60004882,
    10000028,
    "Aeditide V - Republic Fleet Assembly Plant"
  ],
  [
    60011971,
    10000064,
    "Aeschee VI - Moon 4 - Federal Intelligence Office Logistic Support"
  ],
  [
    60012610,
    10000064,
    "Aeschee X - Moon 20 - Sisters of EVE Academy"
  ],
  [
    60006898,
    10000044,
    "Aeter III - Moon 5 - Ducia Foundry Mineral Reserve"
  ],
  [
    60011758,
    10000044,
    "Aeter VI - Moon 23 - Federation Navy Testing Facilities"
  ],
  [
    60006940,
    10000043,
    "Afivad IX - Moon 2 - HZO Refinery"
  ],
  [
    60007111,
    10000043,
    "Afivad XI - Moon 2 - Imperial Shipment Storage"
  ],
  [
    60001051,
    10000067,
    "Agal I - Kaalakiota Corporation Factory"
  ],
  [
    60009538,
    10000044,
    "Agaullores IV - Moon 3 - Material Acquisition Mining Outpost"
  ],
  [
    60009634,
    10000044,
    "Agaullores V - Moon 20 - Astral Mining Inc. Mining Outpost"
  ],
  [
    60011341,
    10000044,
    "Agaullores VI - Moon 11 - Bank of Luminaire Vault"
  ],
  [
    60014404,
    10000001,
    "Agha IX - Moon 6 - Trust Partners Warehouse"
  ],
  [
    60008041,
    10000043,
    "Aghesi VI - Moon 10 - Ministry of Assessment Bureau Offices"
  ],
  [
    60012412,
    10000049,
    "Agil VI - Moon 2 - CONCORD Logistic Support"
  ],
  [
    60014737,
    10000048,
    "Agoze IX - Moon 2 - Center for Advanced Studies School"
  ],
  [
    60010954,
    10000048,
    "Agoze V - FedMart Retail Center"
  ],
  [
    60009376,
    10000048,
    "Agoze XII - Moon 8 - Federal Freight Storage"
  ],
  [
    60009676,
    10000032,
    "Agrallarier VIII - Moon 3 - Astral Mining Inc. Refinery"
  ],
  [
    60014086,
    10000042,
    "Agtver VI - Thukker Mix Factory"
  ],
  [
    60004642,
    10000042,
    "Agtver VIII - Moon 2 - Republic Parliament Bureau"
  ],
  [
    60005476,
    10000043,
    "Ahala VII - Moon 1 - Core Complexion Inc. Warehouse"
  ],
  [
    60005470,
    10000043,
    "Ahala VIII - Core Complexion Inc. Warehouse"
  ],
  [
    60006244,
    10000052,
    "Aharalel III - Moon 5 - Carthum Conglomerate Factory"
  ],
  [
    60005089,
    10000052,
    "Aharalel III - Moon 7 - Republic Security Services Logistic Support"
  ],
  [
    60005935,
    10000052,
    "Aharalel V - Moon 2 - Freedom Extension Storage"
  ],
  [
    60007810,
    10000052,
    "Aharalel V - Moon 3 - Amarr Civil Service Archives"
  ],
  [
    60007069,
    10000067,
    "Ahbazon IV - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60006397,
    10000067,
    "Ahbazon IX - Moon 11 - Carthum Conglomerate Production Plant"
  ],
  [
    60007063,
    10000067,
    "Ahbazon IX - Moon 15 - Imperial Shipment Storage"
  ],
  [
    60007057,
    10000067,
    "Ahbazon VI - Imperial Shipment Storage"
  ],
  [
    60006391,
    10000067,
    "Ahbazon VIII - Moon 2 - Carthum Conglomerate Warehouse"
  ],
  [
    60007300,
    10000020,
    "Ahkour III - Moon 1 - Joint Harvesting Plantation"
  ],
  [
    60009991,
    10000020,
    "Ahkour IX - Moon 18 - Quafe Company Warehouse"
  ],
  [
    60007639,
    10000020,
    "Ahkour VII - Moon 8 - Nurtura Warehouse"
  ],
  [
    60007753,
    10000043,
    "Ahmak VII - Imperial Chancellor Archives"
  ],
  [
    60001072,
    10000020,
    "Ahrosseas VI - Moon 10 - Kaalakiota Corporation Factory"
  ],
  [
    60003400,
    10000033,
    "Ahynada VII - Mercantile Club Bureau"
  ],
  [
    60011635,
    10000037,
    "Aice II - Moon 1 - Federal Administration Information Center"
  ],
  [
    60003667,
    10000037,
    "Aice IV - Moon 1 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60015143,
    10000068,
    "Aidart IV - Federal Defense Union Logistic Support"
  ],
  [
    60003019,
    10000016,
    "Aikantoh I - Caldari Constructions Foundry"
  ],
  [
    60003409,
    10000016,
    "Aikantoh I - Moon 1 - Mercantile Club Academy"
  ],
  [
    60000775,
    10000016,
    "Aikantoh III - Minedrill Mining Outpost"
  ],
  [
    60003013,
    10000016,
    "Aikantoh III - Moon 1 - Caldari Constructions Production Plant"
  ],
  [
    60000778,
    10000016,
    "Aikantoh III - Moon 2 - Minedrill Mining Outpost"
  ],
  [
    60013180,
    10000016,
    "Aikantoh IV - Moon 1 - Genolution Biohazard Containment Facility"
  ],
  [
    60000781,
    10000016,
    "Aikantoh VI - Moon 2 - Minedrill Mining Outpost"
  ],
  [
    60001762,
    10000033,
    "Aikoro IV - Moon 1 - Caldari Steel Factory"
  ],
  [
    60003370,
    10000033,
    "Aikoro VI - Moon 9 - Chief Executive Panel Bureau"
  ],
  [
    60009433,
    10000044,
    "Aimoguier V - Material Acquisition Mining Outpost"
  ],
  [
    60010927,
    10000032,
    "Ainaille VII - Moon 5 - Duvolle Laboratories Factory"
  ],
  [
    60002362,
    10000002,
    "Airaken IV - Moon 1 - Lai Dai Corporation Warehouse"
  ],
  [
    60012670,
    10000002,
    "Airaken V - Moon 1 - Sisters of EVE Academy"
  ],
  [
    60013288,
    10000002,
    "Airaken V - Moon 6 - Impro Warehouse"
  ],
  [
    60012673,
    10000002,
    "Airaken VI - Moon 1 - Sisters of EVE Bureau"
  ],
  [
    60000529,
    10000002,
    "Airaken VI - Moon 3 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60003076,
    10000002,
    "Airaken VIII - Expert Housing Production Plant"
  ],
  [
    60002803,
    10000016,
    "Airkio II - Sukuuvestaa Corporation Factory"
  ],
  [
    60000814,
    10000016,
    "Airkio III - Moon 1 - Minedrill Mineral Reserve"
  ],
  [
    60000811,
    10000016,
    "Airkio IX - Minedrill Refinery"
  ],
  [
    60000481,
    10000016,
    "Airkio IX - Moon 1 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60000475,
    10000016,
    "Airkio IX - Moon 14 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60003430,
    10000016,
    "Airkio IX - Moon 15 - Mercantile Club Bureau"
  ],
  [
    60003940,
    10000016,
    "Airkio IX - Moon 7 - Lai Dai Protection Service Assembly Plant"
  ],
  [
    60003943,
    10000016,
    "Airkio VII - Moon 2 - Lai Dai Protection Service Assembly Plant"
  ],
  [
    60002245,
    10000016,
    "Airkio VII - Moon 3 - Lai Dai Corporation Factory"
  ],
  [
    60001432,
    10000016,
    "Airkio VII - Moon 3 - Top Down Factory"
  ],
  [
    60001429,
    10000016,
    "Airkio VII - Top Down Factory"
  ],
  [
    60015079,
    10000069,
    "Aivonen VI - State Protectorate Logistic Support"
  ],
  [
    60011167,
    10000016,
    "Ajanen VI - Moon 2 - Aliastra Warehouse"
  ],
  [
    60001555,
    10000016,
    "Ajanen VIII - Moon 2 - Perkone Factory"
  ],
  [
    60003391,
    10000016,
    "Ajanen X - Moon 3 - Chief Executive Panel Bureau"
  ],
  [
    60008833,
    10000054,
    "Ajna VIII - Moon 5 - Civic Court Accounting"
  ],
  [
    60014647,
    10000054,
    "Ajna VIII - Moon 5 - Imperial Academy"
  ],
  [
    60008530,
    10000036,
    "Akes V - Moon 2 - Emperor Family Academy"
  ],
  [
    60003637,
    10000036,
    "Akes VII - Caldari Business Tribunal Law School"
  ],
  [
    60006778,
    10000036,
    "Akes VII - Ducia Foundry Mineral Reserve"
  ],
  [
    60007570,
    10000001,
    "Akeva III - Moon 10 - Nurtura Plantation"
  ],
  [
    60007564,
    10000001,
    "Akeva IV - Moon 8 - Nurtura Plantation"
  ],
  [
    60008806,
    10000052,
    "Akhmoh IX - Civic Court Accounting"
  ],
  [
    60008809,
    10000052,
    "Akhmoh V - Moon 14 - Civic Court Law School"
  ],
  [
    60008647,
    10000052,
    "Akhmoh VII - Moon 6 - Kador Family Academy"
  ],
  [
    60005668,
    10000043,
    "Akhragan V - Core Complexion Inc. Warehouse"
  ],
  [
    60007771,
    10000043,
    "Akhragan V - Moon 1 - Amarr Civil Service Bureau Offices"
  ],
  [
    60007738,
    10000043,
    "Akhragan VII - Imperial Chancellor Bureau Offices"
  ],
  [
    60007888,
    10000043,
    "Akhragan VIII - Ministry of War Archives"
  ],
  [
    60005680,
    10000043,
    "Akhragan VIII - Moon 2 - Core Complexion Inc. Storage"
  ],
  [
    60006463,
    10000043,
    "Akhragan VIII - Moon 3 - Imperial Armaments Factory"
  ],
  [
    60008134,
    10000043,
    "Akhragan VIII - Moon 5 - Ministry of Internal Order Logistic Support"
  ],
  [
    60015017,
    10000052,
    "Akhwa II - Moon 1 - Hedion University"
  ],
  [
    60015001,
    10000016,
    "Akiainavas III - School of Applied Knowledge"
  ],
  [
    60007837,
    10000043,
    "Akila IX - Moon 6 - Amarr Civil Service Archives"
  ],
  [
    60011191,
    10000043,
    "Akila VI - Moon 13 - Aliastra Retail Center"
  ],
  [
    60007834,
    10000043,
    "Akila VII - Moon 12 - Amarr Civil Service Archives"
  ],
  [
    60002269,
    10000002,
    "Akkilen V - Moon 3 - Lai Dai Corporation Factory"
  ],
  [
    60012712,
    10000002,
    "Akkilen VIII - Moon 5 - Sisters of EVE Bureau"
  ],
  [
    60003172,
    10000002,
    "Akkio V - Moon 6 - Caldari Funds Unlimited Vault"
  ],
  [
    60002893,
    10000016,
    "Akonoinen I - Sukuuvestaa Corporation Factory"
  ],
  [
    60004288,
    10000016,
    "Akonoinen I - Wiyrkomi Peace Corps Assembly Plant"
  ],
  [
    60002404,
    10000016,
    "Akonoinen IV - Moon 1 - Propel Dynamics Factory"
  ],
  [
    60004285,
    10000016,
    "Akonoinen VI - Wiyrkomi Peace Corps Logistic Support"
  ],
  [
    60003241,
    10000002,
    "Akora IV - Moon 1 - State and Region Bank Depository"
  ],
  [
    60000922,
    10000002,
    "Akora IX - Moon 12 - Caldari Provisions Plantation"
  ],
  [
    60006859,
    10000002,
    "Akora IX - Moon 17 - Ducia Foundry Refinery"
  ],
  [
    60010198,
    10000002,
    "Akora IX - Moon 19 - CreoDron Factory"
  ],
  [
    60004078,
    10000002,
    "Akora IX - Moon 8 - Peace and Order Unit Assembly Plant"
  ],
  [
    60003043,
    10000002,
    "Akora VI - Moon 7 - Expert Housing Production Plant"
  ],
  [
    60009775,
    10000037,
    "Alachene V - Moon 2 - Combined Harvest Plantation"
  ],
  [
    60002656,
    10000037,
    "Alachene VII - Moon 1 - Expert Distribution Warehouse"
  ],
  [
    60009772,
    10000037,
    "Alachene VII - Moon 11 - Combined Harvest Plantation"
  ],
  [
    60009307,
    10000037,
    "Alachene VII - Moon 13 - Federal Freight Storage"
  ],
  [
    60002644,
    10000037,
    "Alachene VIII - Moon 3 - Expert Distribution Retail Center"
  ],
  [
    60000163,
    10000030,
    "Alakgur IX - Moon 9 - CBD Corporation Storage"
  ],
  [
    60005086,
    10000030,
    "Alakgur VII - Moon 3 - Republic Security Services Assembly Plant"
  ],
  [
    60000160,
    10000030,
    "Alakgur VIII - Moon 2 - CBD Corporation Storage"
  ],
  [
    60010078,
    10000030,
    "Alakgur VIII - Moon 2 - Quafe Company Warehouse"
  ],
  [
    60007882,
    10000067,
    "Alal III - Amarr Civil Service Bureau Offices"
  ],
  [
    60005635,
    10000067,
    "Alal IX - Moon 13 - Core Complexion Inc. Factory"
  ],
  [
    60009025,
    10000067,
    "Alal VII - Moon 14 - Theology Council Tribunal"
  ],
  [
    60009022,
    10000067,
    "Alal VII - Moon 17 - Theology Council Tribunal"
  ],
  [
    60005413,
    10000042,
    "Aldagolf V - Core Complexion Inc. Warehouse"
  ],
  [
    60008746,
    10000043,
    "Aldali VI - Moon 1 - Ardishapur Family Bureau"
  ],
  [
    60007630,
    10000042,
    "Aldik IV - Moon 1 - Nurtura Warehouse"
  ],
  [
    60004495,
    10000042,
    "Aldik VIII - Moon 2 - Sebiestor Tribe Bureau"
  ],
  [
    60005299,
    10000042,
    "Aldilur III - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60005287,
    10000042,
    "Aldilur IX - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60007459,
    10000042,
    "Aldilur V - Moon 15 - Joint Harvesting Plantation"
  ],
  [
    60005293,
    10000042,
    "Aldilur V - Moon 15 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60005290,
    10000042,
    "Aldilur V - Moon 6 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60005296,
    10000042,
    "Aldilur VII - Moon 10 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60005302,
    10000042,
    "Aldilur VII - Moon 7 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60011014,
    10000048,
    "Aldranette IX - Moon 1 - FedMart Warehouse"
  ],
  [
    60005377,
    10000042,
    "Aldrat IX - Moon 13 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60014818,
    10000042,
    "Aldrat IX - Pator Tech School"
  ],
  [
    60005386,
    10000042,
    "Aldrat VII - Moon 7 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60003493,
    10000042,
    "Aldrat VIII - Moon 1 - Caldari Business Tribunal Accounting"
  ],
  [
    60011575,
    10000068,
    "Alenia IV - Moon 3 - Quafe Company School"
  ],
  [
    60003253,
    10000068,
    "Alenia IV - Moon 4 - Modern Finances Depository"
  ],
  [
    60010870,
    10000068,
    "Alenia V - Duvolle Laboratories Factory"
  ],
  [
    60009559,
    10000068,
    "Alenia V - Moon 10 - Astral Mining Inc. Refinery"
  ],
  [
    60010306,
    10000068,
    "Alenia V - Moon 12 - Roden Shipyards Factory"
  ],
  [
    60010303,
    10000068,
    "Alenia V - Moon 4 - Roden Shipyards Factory"
  ],
  [
    60005212,
    10000068,
    "Alenia V - Moon 5 - Republic Security Services Assembly Plant"
  ],
  [
    60011401,
    10000068,
    "Alenia V - Pend Insurance Depository"
  ],
  [
    60011398,
    10000068,
    "Alenia VII - Moon 18 - Pend Insurance Depository"
  ],
  [
    60011404,
    10000068,
    "Alenia VII - Pend Insurance Depository"
  ],
  [
    60009562,
    10000068,
    "Alenia VIII - Astral Mining Inc. Refinery"
  ],
  [
    60010873,
    10000068,
    "Alentene V - Moon 4 - Duvolle Laboratories Factory"
  ],
  [
    60010396,
    10000068,
    "Alentene VI - Moon 16 - Poteque Pharmaceuticals Biotech Research Center"
  ],
  [
    60010300,
    10000068,
    "Alentene VI - Moon 6 - Roden Shipyards Warehouse"
  ],
  [
    60009550,
    10000068,
    "Alentene VII - Moon 1 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60009556,
    10000068,
    "Alentene VII - Moon 5 - Astral Mining Inc. Refinery"
  ],
  [
    60004633,
    10000042,
    "Alf II - Moon 1 - Republic Parliament Bureau"
  ],
  [
    60010735,
    10000042,
    "Alf III - Moon 1 - Chemal Tech Factory"
  ],
  [
    60006439,
    10000042,
    "Alf VI - Imperial Armaments Factory"
  ],
  [
    60005125,
    10000048,
    "Algasienan IV - Moon 1 - Republic Security Services Assembly Plant"
  ],
  [
    60009838,
    10000048,
    "Algasienan V - Moon 18 - Combined Harvest Food Packaging"
  ],
  [
    60009844,
    10000048,
    "Algasienan VI - Moon 11 - Combined Harvest Food Packaging"
  ],
  [
    60013222,
    10000048,
    "Algasienan VI - Moon 4 - Genolution Biotech Production"
  ],
  [
    60009133,
    10000048,
    "Algasienan VII - Moon 3 - TransStellar Shipping Storage"
  ],
  [
    60011311,
    10000064,
    "Algogille IX - Moon 3 - Bank of Luminaire Depository"
  ],
  [
    60011614,
    10000064,
    "Algogille IX - Moon 3 - Federal Administration Information Center"
  ],
  [
    60011734,
    10000064,
    "Algogille XIII - Federation Navy Testing Facilities"
  ],
  [
    60011269,
    10000032,
    "Aliette VII - Moon 14 - Aliastra Warehouse"
  ],
  [
    60011272,
    10000032,
    "Aliette VII - Moon 25 - Aliastra Warehouse"
  ],
  [
    60002023,
    10000033,
    "Alikara VI - Moon 14 - Echelon Entertainment Development Studio"
  ],
  [
    60003373,
    10000033,
    "Alikara VII - Moon 1 - Chief Executive Panel Bureau"
  ],
  [
    60011131,
    10000032,
    "Alillere IV - Aliastra Retail Center"
  ],
  [
    60003559,
    10000032,
    "Alillere VI - Moon 3 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60006910,
    10000043,
    "Alkabsi IV - Moon 1 - HZO Refinery Mineral Reserve"
  ],
  [
    60008656,
    10000043,
    "Alkabsi V - Sarum Family Logistic Support"
  ],
  [
    60007576,
    10000001,
    "Alkez VI - Moon 1 - Nurtura Plantation"
  ],
  [
    60012157,
    10000001,
    "Alkez VII - Moon 3 - Ammatar Fleet Testing Facilities"
  ],
  [
    60009925,
    10000064,
    "Allamotte VI - Moon 2 - Quafe Company Warehouse"
  ],
  [
    60002230,
    10000064,
    "Allebin IX - Moon 4 - Ishukone Corporation Factory"
  ],
  [
    60014713,
    10000064,
    "Allebin VI - Federal Navy Academy"
  ],
  [
    60010975,
    10000064,
    "Allebin VI - FedMart Warehouse"
  ],
  [
    60010969,
    10000064,
    "Allebin VII - Moon 4 - FedMart Retail Center"
  ],
  [
    60002227,
    10000064,
    "Allebin VII - Moon 7 - Ishukone Corporation Factory"
  ],
  [
    60010159,
    10000064,
    "Allebin VIII - Moon 4 - CreoDron Factory"
  ],
  [
    60010585,
    10000032,
    "Alles VI - Moon 12 - Egonics Inc. Development Studio"
  ],
  [
    60011713,
    10000032,
    "Alles VII - Moon 16 - Federal Administration Bureau Offices"
  ],
  [
    60014707,
    10000048,
    "Alparena V - Moon 4 - Federal Navy Academy"
  ],
  [
    60009328,
    10000048,
    "Alperaute V - Moon 5 - Federal Freight Storage"
  ],
  [
    60002152,
    10000048,
    "Alperaute VII - Moon 4 - Ishukone Corporation Factory"
  ],
  [
    60007240,
    10000020,
    "Alra VIII - Moon 22 - Amarr Certified News Development Studio"
  ],
  [
    60002455,
    10000020,
    "Alra VIII - Moon 8 - Expert Distribution Retail Center"
  ],
  [
    60008047,
    10000020,
    "Alra X - Moon 24 - Ministry of Assessment Information Center"
  ],
  [
    60006697,
    10000020,
    "Alra XII - Moon 2 - Zoar and Sons Factory"
  ],
  [
    60012466,
    10000028,
    "Altbrard IX - Moon 8 - CONCORD Testing Facilities"
  ],
  [
    60006091,
    10000042,
    "Altrinur VIII - The Leisure Group Publisher"
  ],
  [
    60014077,
    10000042,
    "Altrinur XI - Moon 3 - Thukker Mix Factory"
  ],
  [
    60002137,
    10000042,
    "Altrinur XII - Moon 15 - Ishukone Corporation Factory"
  ],
  [
    60014080,
    10000042,
    "Altrinur XII - Moon 2 - Thukker Mix Factory"
  ],
  [
    60006088,
    10000042,
    "Altrinur XII - Moon 3 - The Leisure Group Development Studio"
  ],
  [
    60007411,
    10000042,
    "Altrinur XII - Moon 6 - Joint Harvesting Food Packaging"
  ],
  [
    60002140,
    10000042,
    "Altrinur XIII - Moon 3 - Ishukone Corporation Factory"
  ],
  [
    60004603,
    10000030,
    "Amamake II - Brutor Tribe Bureau"
  ],
  [
    60002599,
    10000030,
    "Amamake II - Expert Distribution Warehouse"
  ],
  [
    60007339,
    10000030,
    "Amamake II - Moon 1 - Joint Harvesting Food Packaging"
  ],
  [
    60004816,
    10000030,
    "Amamake II - Moon 1 - Republic Fleet Logistic Support"
  ],
  [
    60005038,
    10000030,
    "Amamake II - Moon 1 - Republic Justice Department Tribunal"
  ],
  [
    60005035,
    10000030,
    "Amamake II - Republic Justice Department Tribunal"
  ],
  [
    60004819,
    10000030,
    "Amamake IV - Republic Fleet Assembly Plant"
  ],
  [
    60002590,
    10000030,
    "Amamake VI - Moon 1 - Expert Distribution Warehouse"
  ],
  [
    60004831,
    10000030,
    "Amamake VI - Moon 10 - Republic Fleet Logistic Support"
  ],
  [
    60007687,
    10000030,
    "Amamake VI - Moon 11 - Nurtura Warehouse"
  ],
  [
    60007342,
    10000030,
    "Amamake VI - Moon 13 - Joint Harvesting Warehouse"
  ],
  [
    60007684,
    10000030,
    "Amamake VI - Moon 2 - Nurtura Food Packaging"
  ],
  [
    60002596,
    10000030,
    "Amamake VI - Moon 3 - Expert Distribution Warehouse"
  ],
  [
    60004822,
    10000030,
    "Amamake VI - Moon 5 - Republic Fleet Logistic Support"
  ],
  [
    60004597,
    10000030,
    "Amamake VI - Moon 6 - Brutor Tribe Bureau"
  ],
  [
    60007345,
    10000030,
    "Amamake VI - Moon 6 - Joint Harvesting Mineral Reserve"
  ],
  [
    60007690,
    10000030,
    "Amamake VI - Moon 6 - Nurtura Warehouse"
  ],
  [
    60007333,
    10000030,
    "Amamake VI - Moon 8 - Joint Harvesting Food Packaging"
  ],
  [
    60014827,
    10000030,
    "Amamake VI - Moon 8 - Pator Tech School"
  ],
  [
    60006796,
    10000064,
    "Amane I - Ducia Foundry Mineral Reserve"
  ],
  [
    60006793,
    10000064,
    "Amane VII - Moon 11 - Ducia Foundry Mineral Reserve"
  ],
  [
    60008950,
    10000043,
    "Amarr VI (Zorast) - Moon 2 - Theology Council Tribunal"
  ],
  [
    60008494,
    10000043,
    "Amarr VIII (Oris) - Emperor Family Academy"
  ],
  [
    60002569,
    10000043,
    "Amarr VIII (Oris) - Moon 4 - Expert Distribution Retail Center"
  ],
  [
    60011323,
    10000048,
    "Amasiree VI - Moon 6 - Bank of Luminaire Depository"
  ],
  [
    60009817,
    10000048,
    "Amasiree VII - Moon 1 - Combined Harvest Plantation"
  ],
  [
    60003658,
    10000037,
    "Amattens VII - Moon 1 - Caldari Business Tribunal Law School"
  ],
  [
    60007015,
    10000065,
    "Amdonen VII - Moon 7 - Imperial Shipment Storage"
  ],
  [
    60006970,
    10000065,
    "Amdonen VIII - Moon 13 - Inherent Implants Biotech Production"
  ],
  [
    60007243,
    10000065,
    "Amdonen VIII - Moon 14 - Joint Harvesting Plantation"
  ],
  [
    60007186,
    10000065,
    "Amdonen VIII - Moon 8 - Amarr Certified News Development Studio"
  ],
  [
    60007018,
    10000065,
    "Amdonen VIII - Moon 8 - Imperial Shipment Storage"
  ],
  [
    60005731,
    10000030,
    "Ameinaka IX - Moon 21 - Six Kin Development Warehouse"
  ],
  [
    60000208,
    10000065,
    "Ami V - Moon 1 - CBD Corporation Storage"
  ],
  [
    60000211,
    10000065,
    "Ami VI - CBD Corporation Storage"
  ],
  [
    60006685,
    10000065,
    "Ami VI - Zoar and Sons Factory"
  ],
  [
    60000217,
    10000065,
    "Ami VII - Moon 1 - CBD Corporation Storage"
  ],
  [
    60008713,
    10000065,
    "Ami X - Moon 17 - Kor-Azor Family Bureau"
  ],
  [
    60008587,
    10000065,
    "Ami XI - Moon 1 - Emperor Family Bureau"
  ],
  [
    60014749,
    10000030,
    "Ammold V - Republic Military School"
  ],
  [
    60015104,
    10000042,
    "Amo II - Tribal Liberation Force Logistic Support"
  ],
  [
    60005701,
    10000042,
    "Amo V - Moon 20 - Boundless Creation Factory"
  ],
  [
    60005707,
    10000042,
    "Amo V - Moon 3 - Boundless Creation Factory"
  ],
  [
    60004903,
    10000042,
    "Amo VIII - Moon 2 - Republic Fleet Assembly Plant"
  ],
  [
    60008293,
    10000043,
    "Amod V - Amarr Trade Registry Archives"
  ],
  [
    60012706,
    10000043,
    "Amod VII - Moon 1 - Sisters of EVE Academy"
  ],
  [
    60011560,
    10000068,
    "Amoderia VI - Moon 1 - Garoun Investment Bank Depository"
  ],
  [
    60004450,
    10000016,
    "Amsen VI - Moon 1 - Science and Trade Institute School"
  ],
  [
    60011533,
    10000068,
    "Amygnon VI - Moon 1 - Garoun Investment Bank Vault"
  ],
  [
    60011209,
    10000068,
    "Amygnon VII - Moon 10 - Aliastra Warehouse"
  ],
  [
    60011203,
    10000068,
    "Amygnon VII - Moon 21 - Aliastra Warehouse"
  ],
  [
    60011530,
    10000068,
    "Amygnon VIII - Moon 5 - Garoun Investment Bank Vault"
  ],
  [
    60014479,
    10000068,
    "Amygnon VIII - Moon 5 - X-Sense Reprocessing Facility"
  ],
  [
    60006418,
    10000043,
    "Ana IX - Moon 19 - Imperial Armaments Factory"
  ],
  [
    60006781,
    10000043,
    "Ana VII - Moon 3 - Ducia Foundry Mineral Reserve"
  ],
  [
    60008242,
    10000067,
    "Anara VIII - Moon 8 - Ministry of Internal Order Logistic Support"
  ],
  [
    60011452,
    10000042,
    "Anbald I - Pend Insurance Vault"
  ],
  [
    60004939,
    10000042,
    "Anbald X - Moon 12 - Republic Justice Department Accounting"
  ],
  [
    60004936,
    10000042,
    "Anbald X - Moon 8 - Republic Justice Department Law School"
  ],
  [
    60011005,
    10000048,
    "Anchauttes III - Moon 13 - FedMart Retail Center"
  ],
  [
    60010393,
    10000044,
    "Anckee V - Moon 10 - Allotek Industries Factory"
  ],
  [
    60002122,
    10000043,
    "Andabiar I - Ishukone Corporation Factory"
  ],
  [
    60007906,
    10000065,
    "Andrub II - Moon 1 - Ministry of War Bureau Offices"
  ],
  [
    60007909,
    10000065,
    "Andrub VI - Ministry of War Bureau Offices"
  ],
  [
    60011077,
    10000064,
    "Ane III - Moon 1 - FedMart Warehouse"
  ],
  [
    60005224,
    10000064,
    "Ane IV - Moon 18 - Republic Security Services Logistic Support"
  ],
  [
    60010378,
    10000064,
    "Ane IV - Moon 3 - Roden Shipyards Warehouse"
  ],
  [
    60011089,
    10000064,
    "Ane IV - Moon 6 - FedMart Storage"
  ],
  [
    60005518,
    10000064,
    "Ane V - Moon 9 - Core Complexion Inc. Storage"
  ],
  [
    60006988,
    10000067,
    "Angur III - Moon 1 - Inherent Implants Biotech Production"
  ],
  [
    60006985,
    10000067,
    "Angur IV - Moon 2 - Inherent Implants Biotech Production"
  ],
  [
    60003535,
    10000037,
    "Angymonne V - Moon 6 - Caldari Business Tribunal"
  ],
  [
    60015141,
    10000042,
    "Anher I - Tribal Liberation Force Logistic Support"
  ],
  [
    60002539,
    10000042,
    "Anher III - Expert Distribution Retail Center"
  ],
  [
    60004522,
    10000042,
    "Anher IV - Moon 3 - Krusual Tribe Bureau"
  ],
  [
    60004519,
    10000042,
    "Anher V - Moon 12 - Krusual Tribe Bureau"
  ],
  [
    60011290,
    10000042,
    "Anher V - Moon 8 - Aliastra Retail Center"
  ],
  [
    60014770,
    10000042,
    "Anher V - Republic Military School"
  ],
  [
    60002548,
    10000042,
    "Anher VI - Moon 5 - Expert Distribution Warehouse"
  ],
  [
    60002536,
    10000042,
    "Anher VII - Moon 3 - Expert Distribution Retail Center"
  ],
  [
    60003961,
    10000016,
    "Anin IX - Moon 11 - Lai Dai Protection Service Assembly Plant"
  ],
  [
    60001678,
    10000016,
    "Anin IX - Moon 12 - Caldari Steel Factory"
  ],
  [
    60002941,
    10000016,
    "Anin IX - Moon 13 - Caldari Constructions Production Plant"
  ],
  [
    60001675,
    10000016,
    "Anin IX - Moon 16 - Caldari Steel Factory"
  ],
  [
    60006196,
    10000038,
    "Anka I - Amarr Constructions Production Plant"
  ],
  [
    60013102,
    10000038,
    "Anka IV - Moon 15 - Genolution Biotech Production"
  ],
  [
    60015018,
    10000065,
    "Annad V - Hedion University"
  ],
  [
    60009712,
    10000064,
    "Annages IV - Moon 1 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60009724,
    10000064,
    "Annages VII - Astral Mining Inc. Mining Outpost"
  ],
  [
    60009664,
    10000048,
    "Annancale IV - Moon 1 - Astral Mining Inc. Mining Outpost"
  ],
  [
    60009658,
    10000048,
    "Annancale IV - Moon 16 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60000010,
    10000033,
    "Annaro I - CBD Corporation Storage"
  ],
  [
    60010114,
    10000033,
    "Annaro I - Quafe Company Retail Center"
  ],
  [
    60002701,
    10000033,
    "Annaro II - CBD Sell Division Retail Center"
  ],
  [
    60001315,
    10000033,
    "Annaro IV - Wiyrkomi Corporation Factory"
  ],
  [
    60002764,
    10000033,
    "Annaro IX - Sukuuvestaa Corporation Factory"
  ],
  [
    60010108,
    10000033,
    "Annaro VI - Moon 1 - Quafe Company Factory"
  ],
  [
    60001309,
    10000033,
    "Annaro VI - Moon 2 - Wiyrkomi Corporation Factory"
  ],
  [
    60010117,
    10000033,
    "Annaro VII - Quafe Company Warehouse"
  ],
  [
    60010102,
    10000033,
    "Annaro VIII - Moon 4 - Quafe Company Factory"
  ],
  [
    60014683,
    10000033,
    "Annaro VIII - Moon 4 - State War Academy"
  ],
  [
    60002758,
    10000033,
    "Annaro VIII - Moon 4 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60001312,
    10000033,
    "Annaro VIII - Wiyrkomi Corporation Factory"
  ],
  [
    60010270,
    10000054,
    "Anohel VI - Moon 14 - CreoDron Factory"
  ],
  [
    60001930,
    10000068,
    "Ansalle V - Moon 2 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001240,
    10000052,
    "Ansasos III - Kaalakiota Corporation Factory"
  ],
  [
    60006769,
    10000052,
    "Ansasos III - Moon 1 - Noble Appliances Factory"
  ],
  [
    60001234,
    10000052,
    "Ansasos IX - Moon 1 - Kaalakiota Corporation Factory"
  ],
  [
    60001414,
    10000052,
    "Ansasos IX - Moon 2 - Wiyrkomi Corporation Factory"
  ],
  [
    60001420,
    10000052,
    "Ansasos IX - Wiyrkomi Corporation Factory"
  ],
  [
    60001423,
    10000052,
    "Ansasos VII - Moon 2 - Wiyrkomi Corporation Factory"
  ],
  [
    60001228,
    10000052,
    "Ansasos VII - Moon 4 - Kaalakiota Corporation Factory"
  ],
  [
    60006763,
    10000052,
    "Ansasos VIII - Moon 5 - Noble Appliances Factory"
  ],
  [
    60011437,
    10000042,
    "Ansen I - Moon 1 - Pend Insurance Depository"
  ],
  [
    60006082,
    10000042,
    "Ansen III - Moon 6 - The Leisure Group Publisher"
  ],
  [
    60003151,
    10000002,
    "Ansila V - Caldari Funds Unlimited Depository"
  ],
  [
    60004066,
    10000002,
    "Ansila VI - Moon 2 - Peace and Order Unit Assembly Plant"
  ],
  [
    60002998,
    10000002,
    "Ansila VIII - Moon 14 - Caldari Constructions Production Plant"
  ],
  [
    60003730,
    10000002,
    "Ansila VIII - Moon 14 - House of Records Bureau Offices"
  ],
  [
    60003001,
    10000002,
    "Ansila VIII - Moon 16 - Caldari Constructions Production Plant"
  ],
  [
    60006424,
    10000002,
    "Ansila X - Imperial Armaments Factory"
  ],
  [
    60004366,
    10000002,
    "Ansila X - Moon 1 - Corporate Police Force Assembly Plant"
  ],
  [
    60010759,
    10000042,
    "Anstard VI - Moon 1 - Chemal Tech Warehouse"
  ],
  [
    60007795,
    10000067,
    "Antem V - Moon 1 - Amarr Civil Service Bureau Offices"
  ],
  [
    60007801,
    10000067,
    "Antem VI - Amarr Civil Service Bureau Offices"
  ],
  [
    60008176,
    10000067,
    "Antem VI - Moon 6 - Ministry of Internal Order Logistic Support"
  ],
  [
    60008179,
    10000067,
    "Antem VI - Moon 7 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60008182,
    10000067,
    "Antem VIII - Moon 18 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60000607,
    10000016,
    "Antiainen I - Hyasyoda Corporation Refinery"
  ],
  [
    60011149,
    10000016,
    "Antiainen II - Moon 1 - Aliastra Retail Center"
  ],
  [
    60005647,
    10000016,
    "Antiainen III - Moon 1 - Core Complexion Inc. Factory"
  ],
  [
    60001249,
    10000016,
    "Antiainen III - Moon 1 - Wiyrkomi Corporation Factory"
  ],
  [
    60003184,
    10000016,
    "Antiainen III - State and Region Bank Depository"
  ],
  [
    60002980,
    10000016,
    "Antiainen IV - Caldari Constructions Production Plant"
  ],
  [
    60005656,
    10000016,
    "Antiainen IV - Moon 2 - Core Complexion Inc. Factory"
  ],
  [
    60005650,
    10000016,
    "Antiainen VI - Core Complexion Inc. Factory"
  ],
  [
    60011320,
    10000037,
    "Antollare VI - Bank of Luminaire Depository"
  ],
  [
    60003532,
    10000037,
    "Antollare VI - Moon 13 - Caldari Business Tribunal"
  ],
  [
    60000673,
    10000033,
    "Anttiri III - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60001456,
    10000033,
    "Anttiri IV - Moon 1 - Rapid Assembly Factory"
  ],
  [
    60004129,
    10000033,
    "Anttiri V - Moon 14 - Spacelane Patrol Assembly Plant"
  ],
  [
    60000676,
    10000033,
    "Anttiri V - Moon 18 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60001525,
    10000033,
    "Anttiri V - Moon 20 - Perkone Factory"
  ],
  [
    60004303,
    10000033,
    "Anttiri V - Moon 21 - Corporate Police Force Assembly Plant"
  ],
  [
    60004135,
    10000033,
    "Anttiri V - Moon 6 - Spacelane Patrol Assembly Plant"
  ],
  [
    60001534,
    10000033,
    "Anttiri V - Moon 8 - Perkone Factory"
  ],
  [
    60009997,
    10000067,
    "Anzalaisio V - Moon 10 - Quafe Company Factory"
  ],
  [
    60015002,
    10000002,
    "Aokannitoh VII - Moon 2 - School of Applied Knowledge"
  ],
  [
    60012613,
    10000067,
    "Apanake VIII - Moon 8 - Sisters of EVE Bureau"
  ],
  [
    60005944,
    10000052,
    "Aphend V - Moon 2 - Freedom Extension Warehouse"
  ],
  [
    60005095,
    10000052,
    "Aphend VI - Moon 12 - Republic Security Services Logistic Support"
  ],
  [
    60008800,
    10000052,
    "Aphend VII - Moon 4 - Civic Court Accounting"
  ],
  [
    60008506,
    10000052,
    "Aphend VII - Moon 4 - Emperor Family Academy"
  ],
  [
    60006250,
    10000052,
    "Aphend VII - Moon 7 - Carthum Conglomerate Foundry"
  ],
  [
    60007804,
    10000052,
    "Aphend VIII - Moon 3 - Amarr Civil Service Bureau Offices"
  ],
  [
    60007234,
    10000052,
    "Aphi VIII - Moon 5 - Amarr Certified News Development Studio"
  ],
  [
    60005515,
    10000064,
    "Aporulie VI - Moon 18 - Core Complexion Inc. Storage"
  ],
  [
    60010375,
    10000064,
    "Aporulie VI - Moon 7 - Roden Shipyards Factory"
  ],
  [
    60011590,
    10000064,
    "Aporulie VI - Moon 9 - University of Caille"
  ],
  [
    60011080,
    10000064,
    "Aporulie VII - Moon 16 - FedMart Retail Center"
  ],
  [
    60011086,
    10000064,
    "Aporulie VIII - FedMart Retail Center"
  ],
  [
    60005845,
    10000030,
    "Aralgrund I - Moon 1 - Freedom Extension Storage"
  ],
  [
    60005854,
    10000030,
    "Aralgrund IV - Freedom Extension Retail Center"
  ],
  [
    60005851,
    10000030,
    "Aralgrund IV - Moon 1 - Freedom Extension Storage"
  ],
  [
    60011185,
    10000030,
    "Aralgrund V - Moon 2 - Aliastra Warehouse"
  ],
  [
    60005857,
    10000030,
    "Aralgrund VI - Freedom Extension Warehouse"
  ],
  [
    60000424,
    10000033,
    "Aramachi II - Moon 2 - Ytiri Storage"
  ],
  [
    60003781,
    10000033,
    "Aramachi II - Moon 4 - Caldari Navy Testing Facilities"
  ],
  [
    60000832,
    10000033,
    "Aramachi V - Moon 1 - Minedrill Mining Outpost"
  ],
  [
    60002992,
    10000033,
    "Aramachi VI - Moon 11 - Caldari Constructions Foundry"
  ],
  [
    60000835,
    10000033,
    "Aramachi VI - Moon 4 - Minedrill Mining Outpost"
  ],
  [
    60000727,
    10000033,
    "Aramachi VI - Moon 6 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60000724,
    10000033,
    "Aramachi VII - Moon 8 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60012178,
    10000001,
    "Aranir VIII - Moon 8 - Ammatar Fleet Logistic Support"
  ],
  [
    60011932,
    10000064,
    "Arant IV - Moon 1 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60009922,
    10000064,
    "Arant V - Moon 14 - Quafe Company Factory"
  ],
  [
    60011053,
    10000044,
    "Arasare V - Moon 6 - FedMart Storage"
  ],
  [
    60011986,
    10000044,
    "Arasare V - Moon 7 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60011512,
    10000044,
    "Arasare VI - Garoun Investment Bank Depository"
  ],
  [
    60008542,
    10000036,
    "Arayar VII - Moon 16 - Emperor Family Bureau"
  ],
  [
    60007024,
    10000036,
    "Arayar VIII - Moon 2 - Imperial Shipment Storage"
  ],
  [
    60008872,
    10000043,
    "Arbaz IV - Moon 11 - Civic Court Tribunal"
  ],
  [
    60010099,
    10000043,
    "Arbaz VI - Moon 8 - Quafe Company Warehouse"
  ],
  [
    60008941,
    10000043,
    "Arbaz VI - Moon 8 - Theology Council Tribunal"
  ],
  [
    60009052,
    10000048,
    "Archavoinet II - Moon 17 - TransStellar Shipping Storage"
  ],
  [
    60009067,
    10000048,
    "Archavoinet II - Moon 7 - TransStellar Shipping Storage"
  ],
  [
    60010999,
    10000048,
    "Archavoinet III - Moon 1 - FedMart Storage"
  ],
  [
    60010225,
    10000037,
    "Ardallabier III - Moon 14 - CreoDron Factory"
  ],
  [
    60011116,
    10000037,
    "Ardallabier V - Moon 12 - FedMart Retail Center"
  ],
  [
    60011119,
    10000037,
    "Ardallabier VII - Moon 18 - FedMart Warehouse"
  ],
  [
    60009856,
    10000037,
    "Ardallabier VII - Moon 3 - Quafe Company Warehouse"
  ],
  [
    60014134,
    10000042,
    "Ardar IV - Moon 2 - Thukker Mix Factory"
  ],
  [
    60004888,
    10000042,
    "Ardar V - Moon 2 - Republic Fleet Logistic Support"
  ],
  [
    60000034,
    10000032,
    "Ardene VI - Moon 12 - CBD Corporation Storage"
  ],
  [
    60014743,
    10000032,
    "Ardene VIII - Moon 11 - Center for Advanced Studies School"
  ],
  [
    60000025,
    10000032,
    "Ardene VIII - Moon 5 - CBD Corporation Storage"
  ],
  [
    60007693,
    10000043,
    "Ardishapur Prime II - Further Foodstuffs Plantation"
  ],
  [
    60008722,
    10000043,
    "Ardishapur Prime IX - Moon 17 - Ardishapur Family Bureau"
  ],
  [
    60005473,
    10000043,
    "Arera VIII - Moon 16 - Core Complexion Inc. Factory"
  ],
  [
    60004528,
    10000042,
    "Arifsdald III - Moon 10 - Krusual Tribe Bureau"
  ],
  [
    60001993,
    10000042,
    "Arifsdald III - Moon 10 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60004834,
    10000042,
    "Arifsdald III - Moon 10 - Republic Fleet Assembly Plant"
  ],
  [
    60006085,
    10000042,
    "Arifsdald III - Moon 14 - The Leisure Group Development Studio"
  ],
  [
    60005881,
    10000067,
    "Aring IX - Moon 5 - Freedom Extension Storage"
  ],
  [
    60008146,
    10000067,
    "Aring VIII - Moon 12 - Ministry of Internal Order Logistic Support"
  ],
  [
    60008143,
    10000067,
    "Aring VIII - Moon 7 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60009547,
    10000044,
    "Arittant IX - Moon 16 - Material Acquisition Mining Outpost"
  ],
  [
    60011344,
    10000044,
    "Arittant IX - Moon 21 - Bank of Luminaire Vault"
  ],
  [
    60009625,
    10000044,
    "Arittant IX - Moon 7 - Astral Mining Inc. Mining Outpost"
  ],
  [
    60005419,
    10000042,
    "Arlek I - Moon 5 - Core Complexion Inc. Factory"
  ],
  [
    60004627,
    10000042,
    "Arlulf II - Republic Parliament Bureau"
  ],
  [
    60010741,
    10000042,
    "Arlulf III - Moon 1 - Chemal Tech Factory"
  ],
  [
    60012355,
    10000042,
    "Arlulf III - Moon 10 - CONCORD Bureau"
  ],
  [
    60012361,
    10000042,
    "Arlulf III - Moon 11 - CONCORD Assembly Plant"
  ],
  [
    60004924,
    10000042,
    "Arlulf III - Moon 11 - Republic Justice Department Law School"
  ],
  [
    60006061,
    10000042,
    "Arlulf III - Moon 5 - The Leisure Group Development Studio"
  ],
  [
    60012358,
    10000042,
    "Arlulf VI - Moon 1 - CONCORD Assembly Plant"
  ],
  [
    60014452,
    10000001,
    "Arnola VII - Moon 1 - Trust Partners Trading Post"
  ],
  [
    60012607,
    10000064,
    "Arnon IX - Moon 3 - Sisters of EVE Bureau"
  ],
  [
    60000112,
    10000064,
    "Arnon VIII - Moon 2 - CBD Corporation Storage"
  ],
  [
    60000127,
    10000064,
    "Arnon X - Moon 8 - CBD Corporation Storage"
  ],
  [
    60000124,
    10000064,
    "Arnon XII - CBD Corporation Storage"
  ],
  [
    60009607,
    10000068,
    "Arraron III - Astral Mining Inc. Refinery"
  ],
  [
    60009610,
    10000068,
    "Arraron VII - Astral Mining Inc. Refinery"
  ],
  [
    60009799,
    10000068,
    "Arraron VII - Moon 12 - Combined Harvest Food Packaging"
  ],
  [
    60007666,
    10000068,
    "Arraron VII - Moon 7 - Nurtura Food Packaging"
  ],
  [
    60008935,
    10000043,
    "Arshat VII - Moon 4 - Theology Council Law School"
  ],
  [
    60010669,
    10000032,
    "Artisine IV - Moon 2 - The Scope Development Studio"
  ],
  [
    60002641,
    10000032,
    "Artisine VIII - Moon 18 - Expert Distribution Retail Center"
  ],
  [
    60010135,
    10000043,
    "Arton II - CreoDron Factory"
  ],
  [
    60002671,
    10000043,
    "Artoun IX - Moon 1 - Expert Distribution Warehouse"
  ],
  [
    60007741,
    10000043,
    "Artoun VII - Imperial Chancellor Bureau Offices"
  ],
  [
    60007210,
    10000043,
    "Artoun VII - Moon 2 - Amarr Certified News Development Studio"
  ],
  [
    60002884,
    10000016,
    "Arvasaras II - Moon 1 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60004282,
    10000016,
    "Arvasaras II - Moon 3 - Wiyrkomi Peace Corps Testing Facilities"
  ],
  [
    60012337,
    10000016,
    "Arvasaras IV - Moon 15 - CONCORD Academy"
  ],
  [
    60011434,
    10000042,
    "Arwa IX - Moon 2 - Pend Insurance Depository"
  ],
  [
    60011440,
    10000042,
    "Arwa VIII - Moon 13 - Pend Insurance Depository"
  ],
  [
    60004843,
    10000042,
    "Arwa X - Moon 3 - Republic Fleet Assembly Plant"
  ],
  [
    60011449,
    10000065,
    "Arza II - Pend Insurance Vault"
  ],
  [
    60007366,
    10000065,
    "Arza IV - Joint Harvesting Mining Outpost"
  ],
  [
    60007357,
    10000065,
    "Arza IV - Moon 3 - Joint Harvesting Plantation"
  ],
  [
    60015057,
    10000036,
    "Arzad VIII - 24th Imperial Crusade Logistic Support"
  ],
  [
    60010402,
    10000065,
    "Arzi X - Moon 1 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60013972,
    10000049,
    "Arzieh V - Moon 3 - Royal Khanid Navy Testing Facilities"
  ],
  [
    60012292,
    10000001,
    "Asabona IX - Moon 5 - CONCORD Bureau"
  ],
  [
    60015069,
    10000069,
    "Asakai II - State Protectorate Testing Facilities"
  ],
  [
    60010000,
    10000067,
    "Asanot VI - Moon 17 - Quafe Company Factory"
  ],
  [
    60007429,
    10000020,
    "Asesamy I - Moon 1 - Joint Harvesting Plantation"
  ],
  [
    60007423,
    10000020,
    "Asesamy II - Moon 1 - Joint Harvesting Warehouse"
  ],
  [
    60008776,
    10000020,
    "Asesamy VI - Moon 13 - Tash-Murkon Family Academy"
  ],
  [
    60012964,
    10000020,
    "Asesamy VI - Moon 8 - DED Assembly Plant"
  ],
  [
    60006028,
    10000042,
    "Aset II - Moon 1 - Freedom Extension Storage"
  ],
  [
    60009094,
    10000042,
    "Aset II - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60005401,
    10000042,
    "Aset VII - Moon 1 - Minmatar Mining Corporation Refinery"
  ],
  [
    60013168,
    10000020,
    "Asezai I - Moon 1 - Genolution Biotech Production"
  ],
  [
    60013171,
    10000020,
    "Asezai V - Moon 1 - Genolution Biotech Production"
  ],
  [
    60013012,
    10000001,
    "Asghatil IX - Moon 3 - DED Assembly Plant"
  ],
  [
    60015054,
    10000036,
    "Asghed III - 24th Imperial Crusade Logistic Support"
  ],
  [
    60010675,
    10000036,
    "Asghed VI - Moon 12 - The Scope Publisher"
  ],
  [
    60007033,
    10000036,
    "Asghed VI - Moon 5 - Imperial Shipment Storage"
  ],
  [
    60008875,
    10000043,
    "Ashab VII - Moon 16 - Civic Court Accounting"
  ],
  [
    60008938,
    10000043,
    "Ashab VIII - Moon 10 - Theology Council Tribunal"
  ],
  [
    60013855,
    10000049,
    "Ashi VI - Moon 5 - Khanid Transport Storage"
  ],
  [
    60006628,
    10000067,
    "Ashokon XII - Moon 2 - Zoar and Sons Factory"
  ],
  [
    60007198,
    10000067,
    "Ashokon XIII - Moon 16 - Amarr Certified News Development Studio"
  ],
  [
    60006637,
    10000067,
    "Ashokon XIII - Moon 8 - Zoar and Sons Factory"
  ],
  [
    60006943,
    10000052,
    "Askonak III - Moon 2 - Inherent Implants Biotech Production"
  ],
  [
    60001162,
    10000052,
    "Askonak IV - Moon 15 - Kaalakiota Corporation Factory"
  ],
  [
    60008917,
    10000043,
    "Asoutar V - Moon 5 - Theology Council Accounting"
  ],
  [
    60001009,
    10000052,
    "Asrios III - Kaalakiota Corporation Factory"
  ],
  [
    60006274,
    10000052,
    "Asrios VI - Moon 1 - Carthum Conglomerate Factory"
  ],
  [
    60006283,
    10000052,
    "Asrios VII - Carthum Conglomerate Factory"
  ],
  [
    60006289,
    10000052,
    "Asrios VII - Moon 1 - Carthum Conglomerate Production Plant"
  ],
  [
    60000997,
    10000052,
    "Asrios VII - Moon 1 - Kaalakiota Corporation Factory"
  ],
  [
    60006286,
    10000052,
    "Asrios VIII - Carthum Conglomerate Production Plant"
  ],
  [
    60007993,
    10000052,
    "Asrios VIII - Ministry of War Information Center"
  ],
  [
    60006490,
    10000001,
    "Assah IX - Moon 1 - Imperial Armaments Factory"
  ],
  [
    60014422,
    10000001,
    "Assah V - Moon 14 - Trust Partners Warehouse"
  ],
  [
    60012166,
    10000001,
    "Assah VII - Moon 7 - Ammatar Fleet Assembly Plant"
  ],
  [
    60009028,
    10000067,
    "Assez VIII - Moon 21 - Theology Council Tribunal"
  ],
  [
    60007879,
    10000067,
    "Assez X - Moon 1 - Amarr Civil Service Bureau Offices"
  ],
  [
    60005101,
    10000020,
    "Assiad III - Republic Security Services Assembly Plant"
  ],
  [
    60005104,
    10000020,
    "Assiad VI - Moon 3 - Republic Security Services Assembly Plant"
  ],
  [
    60013303,
    10000032,
    "Assiettes IV - Impro Factory"
  ],
  [
    60012502,
    10000032,
    "Assiettes IV - Moon 1 - CONCORD Logistic Support"
  ],
  [
    60013186,
    10000016,
    "Atai II - Moon 15 - Genolution Biotech Production"
  ],
  [
    60003010,
    10000016,
    "Atai II - Moon 2 - Caldari Constructions Production Plant"
  ],
  [
    60003016,
    10000016,
    "Atai II - Moon 7 - Caldari Constructions Production Plant"
  ],
  [
    60014389,
    10000030,
    "Atgur VIII - Moon 1 - Trust Partners Warehouse"
  ],
  [
    60012649,
    10000037,
    "Athinard IV - Sisters of EVE Bureau"
  ],
  [
    60005833,
    10000037,
    "Athinard VII - Moon 1 - Freedom Extension Storage"
  ],
  [
    60009703,
    10000037,
    "Athinard VII - Moon 2 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60011674,
    10000032,
    "Atier II - Federal Administration Archives"
  ],
  [
    60011023,
    10000032,
    "Ation II - Moon 1 - FedMart Warehouse"
  ],
  [
    60011791,
    10000032,
    "Ation IX - Moon 4 - Federation Navy Logistic Support"
  ],
  [
    60011266,
    10000032,
    "Ation VI - Aliastra Warehouse"
  ],
  [
    60010768,
    10000064,
    "Atlangeins V - Moon 11 - Chemal Tech Factory"
  ],
  [
    60010723,
    10000064,
    "Atlangeins V - Moon 13 - The Scope Development Studio"
  ],
  [
    60010486,
    10000037,
    "Atlanins III - Impetus Publisher"
  ],
  [
    60002650,
    10000037,
    "Atlanins VII - Moon 1 - Expert Distribution Retail Center"
  ],
  [
    60006502,
    10000028,
    "Atlar VI - Moon 4 - Imperial Armaments Factory"
  ],
  [
    60005347,
    10000028,
    "Atlar VII - Moon 3 - Minmatar Mining Corporation Refinery"
  ],
  [
    60010165,
    10000064,
    "Atlulle III - CreoDron Factory"
  ],
  [
    60002224,
    10000064,
    "Atlulle VII - Moon 1 - Ishukone Corporation Factory"
  ],
  [
    60010984,
    10000064,
    "Atlulle VIII - FedMart Storage"
  ],
  [
    60010162,
    10000064,
    "Atlulle VIII - Moon 6 - CreoDron Factory"
  ],
  [
    60007330,
    10000020,
    "Atoosh VI - Moon 5 - Joint Harvesting Refinery"
  ],
  [
    60006733,
    10000020,
    "Atoosh VII - Moon 2 - Zoar and Sons Factory"
  ],
  [
    60007321,
    10000020,
    "Atoosh VIII - Joint Harvesting Warehouse"
  ],
  [
    60006385,
    10000067,
    "Atreen VIII - Carthum Conglomerate Factory"
  ],
  [
    60010447,
    10000064,
    "Attyn V - Moon 13 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60000118,
    10000064,
    "Attyn V - Moon 2 - CBD Corporation Storage"
  ],
  [
    60009748,
    10000048,
    "Aubenall V - Moon 9 - Combined Harvest Warehouse"
  ],
  [
    60009043,
    10000032,
    "Auberulle V - TransStellar Shipping Storage"
  ],
  [
    60009754,
    10000032,
    "Auberulle VII - Moon 1 - Combined Harvest Warehouse"
  ],
  [
    60010600,
    10000032,
    "Auberulle VIII - Moon 1 - Egonics Inc. Development Studio"
  ],
  [
    60003256,
    10000032,
    "Audaerne VI - Moon 5 - Modern Finances Depository"
  ],
  [
    60010453,
    10000032,
    "Audaerne X - Moon 3 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60009595,
    10000032,
    "Aufay I - Astral Mining Inc. Mining Outpost"
  ],
  [
    60009589,
    10000032,
    "Aufay II - Astral Mining Inc. Mining Outpost"
  ],
  [
    60009592,
    10000032,
    "Aufay III - Moon 3 - Astral Mining Inc. Mining Outpost"
  ],
  [
    60009586,
    10000032,
    "Aufay IV - Moon 2 - Astral Mining Inc. Mining Outpost"
  ],
  [
    60011929,
    10000032,
    "Aufay V - Moon 1 - Federal Intelligence Office Testing Facilities"
  ],
  [
    60007348,
    10000030,
    "Auga V - Moon 10 - Joint Harvesting Refinery"
  ],
  [
    60005752,
    10000030,
    "Auga VI - Moon 13 - Six Kin Development Production Plant"
  ],
  [
    60004825,
    10000030,
    "Auga VIII - Moon 2 - Republic Fleet Assembly Plant"
  ],
  [
    60004600,
    10000030,
    "Auga X - Moon 3 - Brutor Tribe Bureau"
  ],
  [
    60010450,
    10000032,
    "Augnais VI - Moon 1 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60011428,
    10000032,
    "Augnais VIII - Moon 14 - Pend Insurance Depository"
  ],
  [
    60001258,
    10000032,
    "Augnais X - Moon 1 - Wiyrkomi Corporation Factory"
  ],
  [
    60006568,
    10000048,
    "Aulbres IX - Moon 10 - Imperial Armaments Factory"
  ],
  [
    60006574,
    10000048,
    "Aulbres IX - Moon 20 - Imperial Armaments Factory"
  ],
  [
    60013336,
    10000048,
    "Aulbres IX - Moon 22 - Impro Factory"
  ],
  [
    60012451,
    10000048,
    "Aulbres V - Moon 4 - CONCORD Logistic Support"
  ],
  [
    60011782,
    10000048,
    "Aulbres V - Moon 5 - Federation Navy Assembly Plant"
  ],
  [
    60011770,
    10000048,
    "Aulbres VI - Moon 5 - Federation Navy Logistic Support"
  ],
  [
    60011641,
    10000048,
    "Aulbres VI - Moon 6 - Federal Administration Information Center"
  ],
  [
    60012442,
    10000048,
    "Aulbres VII - CONCORD Bureau"
  ],
  [
    60012448,
    10000048,
    "Aulbres VII - Moon 16 - CONCORD Assembly Plant"
  ],
  [
    60013339,
    10000048,
    "Aulbres VIII - Moon 15 - Impro Factory"
  ],
  [
    60006577,
    10000048,
    "Aulbres VIII - Moon 23 - Imperial Armaments Factory"
  ],
  [
    60011242,
    10000048,
    "Aulbres X - Aliastra Warehouse"
  ],
  [
    60012445,
    10000048,
    "Aulbres X - CONCORD Bureau"
  ],
  [
    60012439,
    10000048,
    "Aulbres X - Moon 2 - CONCORD Bureau"
  ],
  [
    60002008,
    10000016,
    "Aunenen II - Echelon Entertainment Development Studio"
  ],
  [
    60003868,
    10000016,
    "Aunenen III - Moon 1 - Caldari Navy Assembly Plant"
  ],
  [
    60007384,
    10000016,
    "Aunenen V - Moon 14 - Joint Harvesting Mineral Reserve"
  ],
  [
    60004009,
    10000016,
    "Aunenen V - Moon 16 - Home Guard Logistic Support"
  ],
  [
    60002365,
    10000016,
    "Aunenen VI - Moon 5 - Zero-G Research Firm Factory"
  ],
  [
    60000319,
    10000016,
    "Aunenen VII - Moon 1 - Ytiri Storage"
  ],
  [
    60004894,
    10000042,
    "Auner V - Republic Fleet Logistic Support"
  ],
  [
    60015098,
    10000042,
    "Auner VI - Tribal Liberation Force Logistic Support"
  ],
  [
    60014131,
    10000042,
    "Auner VIII - Moon 10 - Thukker Mix Factory"
  ],
  [
    60011872,
    10000032,
    "Aunia I - Moon 11 - Federation Navy Assembly Plant"
  ],
  [
    60009337,
    10000048,
    "Aunsou I - Federal Freight Storage"
  ],
  [
    60002149,
    10000048,
    "Aunsou I - Ishukone Corporation Factory"
  ],
  [
    60012016,
    10000048,
    "Aunsou II - Moon 1 - Federation Customs Assembly Plant"
  ],
  [
    60003595,
    10000048,
    "Aunsou II - Moon 2 - Caldari Business Tribunal Information Center"
  ],
  [
    60012025,
    10000048,
    "Aunsou III - Moon 1 - Federation Customs Assembly Plant"
  ],
  [
    60012019,
    10000048,
    "Aunsou III - Moon 4 - Federation Customs Assembly Plant"
  ],
  [
    60002158,
    10000048,
    "Aunsou III - Moon 4 - Ishukone Corporation Factory"
  ],
  [
    60011524,
    10000048,
    "Aunsou IV - Moon 1 - Garoun Investment Bank Depository"
  ],
  [
    60005434,
    10000048,
    "Aunsou IV - Moon 3 - Core Complexion Inc. Factory"
  ],
  [
    60011137,
    10000032,
    "Aurcel IV - Moon 17 - Aliastra Warehouse"
  ],
  [
    60001777,
    10000016,
    "Aurohunen III - Zainou Biotech Production"
  ],
  [
    60002371,
    10000016,
    "Aurohunen V - Moon 10 - Propel Dynamics Factory"
  ],
  [
    60003445,
    10000016,
    "Aurohunen V - Moon 17 - Mercantile Club Bureau"
  ],
  [
    60006571,
    10000048,
    "Ausmaert VII - Moon 2 - Imperial Armaments Factory"
  ],
  [
    60006841,
    10000048,
    "Ausmaert VII - Moon 5 - Ducia Foundry Refinery"
  ],
  [
    60011248,
    10000048,
    "Ausmaert VIII - Moon 1 - Aliastra Warehouse"
  ],
  [
    60011176,
    10000016,
    "Autama IX - Moon 12 - Aliastra Warehouse"
  ],
  [
    60002017,
    10000016,
    "Autama V - Moon 5 - Echelon Entertainment Development Studio"
  ],
  [
    60014680,
    10000016,
    "Autama V - Moon 9 - State War Academy"
  ],
  [
    60012343,
    10000016,
    "Autaris I - CONCORD Assembly Plant"
  ],
  [
    60012340,
    10000016,
    "Autaris IV - CONCORD Assembly Plant"
  ],
  [
    60002887,
    10000016,
    "Autaris V - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60003736,
    10000016,
    "Autaris VI - Moon 2 - House of Records Information Center"
  ],
  [
    60001705,
    10000016,
    "Autaris VII - Moon 2 - Caldari Steel Factory"
  ],
  [
    60002035,
    10000016,
    "Autaris VIII - Moon 12 - Echelon Entertainment Development Studio"
  ],
  [
    60002881,
    10000016,
    "Autaris VIII - Moon 4 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60012331,
    10000016,
    "Autaris VIII - Moon 5 - CONCORD Bureau"
  ],
  [
    60011983,
    10000032,
    "Auvergne V - Moon 5 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60004105,
    10000033,
    "Auviken IV - Spacelane Patrol Logistic Support"
  ],
  [
    60004111,
    10000033,
    "Auviken V - Moon 1 - Spacelane Patrol Logistic Support"
  ],
  [
    60004117,
    10000033,
    "Auviken V - Moon 10 - Spacelane Patrol Logistic Support"
  ],
  [
    60003523,
    10000033,
    "Auviken V - Moon 5 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60000322,
    10000033,
    "Auviken V - Moon 6 - Ytiri Storage"
  ],
  [
    60002383,
    10000033,
    "Auviken VII - Moon 18 - Propel Dynamics Factory"
  ],
  [
    60004102,
    10000033,
    "Auviken VII - Moon 8 - Spacelane Patrol Assembly Plant"
  ],
  [
    60000136,
    10000054,
    "Avada II - CBD Corporation Storage"
  ],
  [
    60012394,
    10000054,
    "Avada V - CONCORD Assembly Plant"
  ],
  [
    60001384,
    10000054,
    "Avada VI - Moon 1 - Wiyrkomi Corporation Factory"
  ],
  [
    60001378,
    10000054,
    "Avada VI - Moon 20 - Wiyrkomi Corporation Factory"
  ],
  [
    60001381,
    10000054,
    "Avada VII - Moon 6 - Wiyrkomi Corporation Factory"
  ],
  [
    60013294,
    10000043,
    "Avair VII - Moon 12 - Impro Factory"
  ],
  [
    60008914,
    10000043,
    "Avair VII - Moon 25 - Theology Council Tribunal"
  ],
  [
    60014608,
    10000043,
    "Avair X - Hedion University"
  ],
  [
    60009820,
    10000048,
    "Avaux VIII - Moon 3 - Combined Harvest Food Packaging"
  ],
  [
    60010126,
    10000037,
    "Avele V - Moon 11 - CreoDron Warehouse"
  ],
  [
    60003526,
    10000037,
    "Avele VI - Moon 15 - Caldari Business Tribunal"
  ],
  [
    60004726,
    10000042,
    "Avenod V - Moon 1 - Republic Parliament Academy"
  ],
  [
    60004729,
    10000042,
    "Avenod VI - Moon 9 - Republic Parliament Academy"
  ],
  [
    60005407,
    10000042,
    "Avenod VII - Moon 13 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60005404,
    10000042,
    "Avenod VII - Moon 19 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60009091,
    10000042,
    "Avenod VIII - Moon 17 - TransStellar Shipping Storage"
  ],
  [
    60003538,
    10000037,
    "Averon VII - Moon 3 - Caldari Business Tribunal Information Center"
  ],
  [
    60010129,
    10000037,
    "Aydoteaux II - CreoDron Factory"
  ],
  [
    60010864,
    10000037,
    "Aydoteaux V - Moon 1 - Duvolle Laboratories Factory"
  ],
  [
    60011317,
    10000037,
    "Aydoteaux VII - Moon 20 - Bank of Luminaire Depository"
  ],
  [
    60010123,
    10000037,
    "Aydoteaux VIII - Moon 12 - CreoDron Warehouse"
  ],
  [
    60005980,
    10000038,
    "Ayeroilen IX - Moon 10 - Freedom Extension Warehouse"
  ],
  [
    60005983,
    10000038,
    "Ayeroilen XI - Moon 4 - Freedom Extension Warehouse"
  ],
  [
    60011140,
    10000032,
    "Aymaerne VI - Moon 10 - Aliastra Warehouse"
  ],
  [
    60011134,
    10000032,
    "Aymaerne VIII - Moon 2 - Aliastra Warehouse"
  ],
  [
    60014602,
    10000067,
    "Azedi II - Hedion University"
  ],
  [
    60008596,
    10000067,
    "Azedi III - Emperor Family Bureau"
  ],
  [
    60008245,
    10000067,
    "Azedi IX - Ministry of Internal Order Logistic Support"
  ],
  [
    60014650,
    10000067,
    "Azedi V - Moon 1 - Imperial Academy"
  ],
  [
    60010261,
    10000037,
    "Azer III - Moon 6 - CreoDron Factory"
  ],
  [
    60010255,
    10000037,
    "Azer VI - Moon 1 - CreoDron Warehouse"
  ],
  [
    60011107,
    10000037,
    "Azer VI - Moon 2 - FedMart Storage"
  ],
  [
    60012061,
    10000037,
    "Azer VI - Moon 3 - Federation Customs Assembly Plant"
  ],
  [
    60007138,
    10000020,
    "Azerakish XII - Moon 3 - Imperial Shipment Storage"
  ],
  [
    60010507,
    10000020,
    "Azhgabid III - Moon 5 - Impetus Development Studio"
  ],
  [
    60001897,
    10000020,
    "Azhgabid III - Moon 5 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60009007,
    10000043,
    "Azizora V - Moon 17 - Theology Council Tribunal"
  ],
  [
    60007756,
    10000043,
    "Azizora VI - Moon 1 - Imperial Chancellor Information Center"
  ],
  [
    60014368,
    10000022,
    "B-G1LG VI - Moon 3 - True Power Mining Outpost"
  ],
  [
    60014044,
    10000019,
    "B-Y06L II - Shapeset Shipyard"
  ],
  [
    60014047,
    10000019,
    "B-Y06L IV - Shapeset Shipyard"
  ],
  [
    60013750,
    10000019,
    "B-Y06L VII - Moon 1 - Jovian Directorate Bureau"
  ],
  [
    60013927,
    10000019,
    "B-Y06L VII - Moon 2 - Prosper Depository"
  ],
  [
    60013738,
    10000019,
    "B-Y06L VII - Moon 4 - Jovian Directorate Bureau"
  ],
  [
    60009544,
    10000044,
    "Babirmoult VI - Moon 15 - Material Acquisition Mineral Reserve"
  ],
  [
    60013984,
    10000049,
    "Badivefi VI - Moon 2 - Royal Khanid Navy Logistic Support"
  ],
  [
    60013981,
    10000049,
    "Badivefi VIII - Moon 10 - Royal Khanid Navy Logistic Support"
  ],
  [
    60006907,
    10000043,
    "Bagodan I - HZO Refinery Mining Outpost"
  ],
  [
    60006913,
    10000043,
    "Bagodan VIII - Moon 4 - HZO Refinery Mineral Reserve"
  ],
  [
    60008653,
    10000043,
    "Bagodan VIII - Moon 6 - Sarum Family Logistic Support"
  ],
  [
    60006352,
    10000043,
    "Bahromab IX - Moon 13 - Carthum Conglomerate Factory"
  ],
  [
    60008065,
    10000043,
    "Bahromab IX - Moon 4 - Ministry of Assessment Information Center"
  ],
  [
    60006349,
    10000043,
    "Bahromab IX - Moon 5 - Carthum Conglomerate Factory"
  ],
  [
    60006346,
    10000043,
    "Bahromab IX - Moon 8 - Carthum Conglomerate Factory"
  ],
  [
    60005071,
    10000043,
    "Bahromab IX - Republic Security Services Assembly Plant"
  ],
  [
    60008059,
    10000043,
    "Bahromab V - Ministry of Assessment Bureau Offices"
  ],
  [
    60008056,
    10000043,
    "Bahromab VIII - Moon 3 - Ministry of Assessment Information Center"
  ],
  [
    60006355,
    10000043,
    "Bahromab VIII - Moon 4 - Carthum Conglomerate Factory"
  ],
  [
    60005068,
    10000043,
    "Bahromab VIII - Moon 6 - Republic Security Services Assembly Plant"
  ],
  [
    60014098,
    10000001,
    "Bairshir IV - Moon 11 - Thukker Mix Factory"
  ],
  [
    60007000,
    10000054,
    "Balas I - Moon 11 - Inherent Implants Biotech Production"
  ],
  [
    60006997,
    10000054,
    "Balas I - Moon 2 - Inherent Implants Biotech Production"
  ],
  [
    60004621,
    10000030,
    "Balginia II - Brutor Tribe Bureau"
  ],
  [
    60014740,
    10000032,
    "Balle VII - Moon 17 - Center for Advanced Studies School"
  ],
  [
    60001048,
    10000067,
    "Bania VI - Moon 11 - Kaalakiota Corporation Warehouse"
  ],
  [
    60008272,
    10000067,
    "Bantish I - Moon 1 - Amarr Trade Registry Information Center"
  ],
  [
    60007093,
    10000067,
    "Bantish VI - Moon 3 - Imperial Shipment Storage"
  ],
  [
    60010264,
    10000054,
    "Bapraya IV - Moon 1 - CreoDron Factory"
  ],
  [
    60008476,
    10000054,
    "Bapraya X - Moon 6 - Amarr Navy Assembly Plant"
  ],
  [
    60008848,
    10000054,
    "Bapraya XI - Moon 1 - Civic Court Tribunal"
  ],
  [
    60008482,
    10000054,
    "Bapraya XI - Moon 4 - Amarr Navy Logistic Support"
  ],
  [
    60013969,
    10000049,
    "Baratar X - Moon 9 - Royal Khanid Navy Logistic Support"
  ],
  [
    60007279,
    10000042,
    "Barkrik II - Moon 10 - Joint Harvesting Food Packaging"
  ],
  [
    60007285,
    10000042,
    "Barkrik IV - Moon 4 - Joint Harvesting Food Packaging"
  ],
  [
    60012436,
    10000048,
    "Barleguet IV - Moon 2 - CONCORD Bureau"
  ],
  [
    60006838,
    10000048,
    "Barleguet V - Moon 5 - Ducia Foundry Refinery"
  ],
  [
    60006835,
    10000048,
    "Barleguet VI - Moon 1 - Ducia Foundry Refinery"
  ],
  [
    60011644,
    10000048,
    "Barleguet VII - Federal Administration Information Center"
  ],
  [
    60011785,
    10000048,
    "Barleguet VII - Federation Navy Assembly Plant"
  ],
  [
    60014722,
    10000048,
    "Barleguet VII - Moon 6 - Center for Advanced Studies School"
  ],
  [
    60011779,
    10000048,
    "Barleguet VII - Moon 9 - Federation Navy Assembly Plant"
  ],
  [
    60003259,
    10000032,
    "Barmalie VI - Moon 4 - Modern Finances Vault"
  ],
  [
    60005626,
    10000032,
    "Barmalie VIII - Moon 4 - Core Complexion Inc. Storage"
  ],
  [
    60012049,
    10000032,
    "Basgerin V - Moon 1 - Federation Customs Testing Facilities"
  ],
  [
    60011710,
    10000032,
    "Basgerin VII - Moon 7 - Federal Administration Archives"
  ],
  [
    60008128,
    10000043,
    "Bashakru IV - Ministry of Internal Order Assembly Plant"
  ],
  [
    60007153,
    10000043,
    "Bashakru VI - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60008752,
    10000043,
    "Bashakru VII - Moon 5 - Ardishapur Family Bureau"
  ],
  [
    60013843,
    10000049,
    "Bashyam X - Moon 7 - Khanid Transport Storage"
  ],
  [
    60001099,
    10000020,
    "Baviasi II - Kaalakiota Corporation Factory"
  ],
  [
    60006586,
    10000020,
    "Baviasi II - Moon 1 - Viziam Factory"
  ],
  [
    60007519,
    10000020,
    "Baviasi III - Moon 1 - Nurtura Food Packaging"
  ],
  [
    60006229,
    10000020,
    "Baviasi IX - Carthum Conglomerate Factory"
  ],
  [
    60002185,
    10000020,
    "Baviasi IX - Moon 2 - Ishukone Corporation Factory"
  ],
  [
    60006580,
    10000020,
    "Baviasi IX - Viziam Factory"
  ],
  [
    60008230,
    10000020,
    "Baviasi V - Moon 1 - Ministry of Internal Order Logistic Support"
  ],
  [
    60001090,
    10000020,
    "Baviasi VI - Moon 3 - Kaalakiota Corporation Factory"
  ],
  [
    60002191,
    10000020,
    "Baviasi X - Ishukone Corporation Factory"
  ],
  [
    60001087,
    10000020,
    "Baviasi X - Moon 2 - Kaalakiota Corporation Factory"
  ],
  [
    60002188,
    10000020,
    "Baviasi XI - Ishukone Corporation Factory"
  ],
  [
    60009418,
    10000032,
    "Bawilan I - Federal Freight Storage"
  ],
  [
    60005194,
    10000032,
    "Bawilan V - Republic Security Services Assembly Plant"
  ],
  [
    60003295,
    10000032,
    "Bawilan VIII - Moon 17 - Modern Finances Depository"
  ],
  [
    60012535,
    10000001,
    "Bayuka VI - Moon 1 - Ammatar Consulate Bureau"
  ],
  [
    60008158,
    10000054,
    "Bazadod IX - Moon 4 - Ministry of Internal Order Testing Facilities"
  ],
  [
    60005773,
    10000042,
    "Bei VI - Moon 8 - Freedom Extension Storage"
  ],
  [
    60005785,
    10000042,
    "Bei VII - Moon 3 - Freedom Extension Retail Center"
  ],
  [
    60005770,
    10000042,
    "Bei VII - Moon 8 - Freedom Extension Storage"
  ],
  [
    60009211,
    10000067,
    "Beke IV - TransStellar Shipping Storage"
  ],
  [
    60008395,
    10000067,
    "Beke VI - Moon 4 - Amarr Navy Logistic Support"
  ],
  [
    60010315,
    10000037,
    "Bereye III - Moon 1 - Roden Shipyards Factory"
  ],
  [
    60011995,
    10000037,
    "Bereye VI - Federal Intelligence Office Assembly Plant"
  ],
  [
    60009520,
    10000037,
    "Bereye VI - Moon 2 - Material Acquisition Refinery"
  ],
  [
    60009514,
    10000037,
    "Bereye VII - Moon 1 - Material Acquisition Mineral Reserve"
  ],
  [
    60012550,
    10000001,
    "Berta VI - Moon 19 - Ammatar Consulate Bureau"
  ],
  [
    60008374,
    10000043,
    "Bhizheba IX - Moon 1 - Amarr Navy Logistic Support"
  ],
  [
    60002662,
    10000043,
    "Bhizheba VIII - Moon 5 - Expert Distribution Warehouse"
  ],
  [
    60008932,
    10000043,
    "Bika II - Theology Council Law School"
  ],
  [
    60010240,
    10000043,
    "Bika III - CreoDron Factory"
  ],
  [
    60010246,
    10000043,
    "Bika V - Moon 1 - CreoDron Warehouse"
  ],
  [
    60010249,
    10000043,
    "Bika VII - Moon 1 - CreoDron Factory"
  ],
  [
    60008089,
    10000043,
    "Bika VII - Moon 3 - Ministry of Assessment Bureau Offices"
  ],
  [
    60010243,
    10000043,
    "Bika VIII - Moon 11 - CreoDron Warehouse"
  ],
  [
    60002659,
    10000037,
    "Bille I - Expert Distribution Retail Center"
  ],
  [
    60010489,
    10000037,
    "Bille IX - Moon 3 - Impetus Development Studio"
  ],
  [
    60009769,
    10000037,
    "Bille VII - Moon 2 - Combined Harvest Food Packaging"
  ],
  [
    60011569,
    10000037,
    "Bille X - Moon 1 - University of Caille"
  ],
  [
    60010579,
    10000037,
    "Bille XI - Moon 1 - Egonics Inc. Development Studio"
  ],
  [
    60006955,
    10000043,
    "Bittanshal I - Moon 1 - Inherent Implants Biotech Production"
  ],
  [
    60010138,
    10000043,
    "Bittanshal VII - Moon 9 - CreoDron Factory"
  ],
  [
    60007525,
    10000043,
    "Bittanshal VIII - Moon 18 - Nurtura Food Packaging"
  ],
  [
    60007531,
    10000043,
    "Bittanshal VIII - Moon 9 - Nurtura Plantation"
  ],
  [
    60014029,
    10000017,
    "BJC4-8 XI - Moon 2 - Shapeset Shipyard"
  ],
  [
    60014900,
    10000055,
    "BKG-Q2 VIII - Moon 1 - Secure Commerce Commission Refining"
  ],
  [
    60013795,
    10000017,
    "BKK4-H IX - Moon 11 - Jovian Directorate Bureau"
  ],
  [
    60009865,
    10000037,
    "Blameston IV - Moon 12 - Quafe Company Retail Center"
  ],
  [
    60010621,
    10000037,
    "Blameston VI - Moon 10 - Egonics Inc. Development Studio"
  ],
  [
    60009361,
    10000037,
    "Blameston VI - Moon 2 - Federal Freight Storage"
  ],
  [
    60013462,
    10000041,
    "BMNV-P XI - Moon 11 - Intaki Space Police Assembly Plant"
  ],
  [
    60011182,
    10000030,
    "Bogelek IV - Moon 2 - Aliastra Warehouse"
  ],
  [
    60000049,
    10000042,
    "Bongveber IX - Moon 10 - CBD Corporation Storage"
  ],
  [
    60011455,
    10000042,
    "Bongveber V - Pend Insurance Depository"
  ],
  [
    60011458,
    10000042,
    "Bongveber VII - Moon 1 - Pend Insurance Depository"
  ],
  [
    60001360,
    10000042,
    "Bongveber VII - Moon 5 - Wiyrkomi Corporation Factory"
  ],
  [
    60002557,
    10000043,
    "Boranai VII - Moon 17 - Expert Distribution Retail Center"
  ],
  [
    60008956,
    10000043,
    "Boranai VII - Moon 9 - Theology Council Law School"
  ],
  [
    60002563,
    10000043,
    "Boranai VIII - Expert Distribution Warehouse"
  ],
  [
    60001243,
    10000052,
    "Bordan IV - Moon 1 - Kaalakiota Corporation Factory"
  ],
  [
    60001237,
    10000052,
    "Bordan V - Moon 2 - Kaalakiota Corporation Factory"
  ],
  [
    60006766,
    10000052,
    "Bordan V - Noble Appliances Factory"
  ],
  [
    60001417,
    10000052,
    "Bordan VII - Moon 11 - Wiyrkomi Corporation Factory"
  ],
  [
    60001231,
    10000052,
    "Bordan VIII - Moon 3 - Kaalakiota Corporation Factory"
  ],
  [
    60005080,
    10000030,
    "Bosboger VI - Moon 7 - Republic Security Services Assembly Plant"
  ],
  [
    60010069,
    10000030,
    "Bosboger VIII - Moon 2 - Quafe Company Factory"
  ],
  [
    60004798,
    10000028,
    "Bosena V - Moon 1 - Republic Fleet Assembly Plant"
  ],
  [
    60011566,
    10000032,
    "Bourynes VII - Moon 2 - University of Caille"
  ],
  [
    60011950,
    10000044,
    "Boystin V - Moon 6 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60012688,
    10000044,
    "Boystin V - Moon 7 - Sisters of EVE Bureau"
  ],
  [
    60009733,
    10000044,
    "Boystin VI - Moon 1 - Combined Harvest Plantation"
  ],
  [
    60005956,
    10000044,
    "Boystin VI - Moon 11 - Freedom Extension Storage"
  ],
  [
    60005959,
    10000044,
    "Boystin VI - Moon 12 - Freedom Extension Storage"
  ],
  [
    60009730,
    10000044,
    "Boystin VI - Moon 13 - Combined Harvest Plantation"
  ],
  [
    60010663,
    10000044,
    "Boystin VI - Moon 14 - The Scope Publisher"
  ],
  [
    60009490,
    10000044,
    "Boystin VI - Moon 23 - Material Acquisition Refinery"
  ],
  [
    60012232,
    10000012,
    "BPK-XK V - Moon 20 - Archangels Logistic Support"
  ],
  [
    60011683,
    10000032,
    "Brapelille IV - Moon 2 - Federal Administration Bureau Offices"
  ],
  [
    60009421,
    10000032,
    "Brapelille IV - Moon 2 - Federal Freight Storage"
  ],
  [
    60011680,
    10000032,
    "Brapelille IX - Moon 18 - Federal Administration Information Center"
  ],
  [
    60003292,
    10000032,
    "Brapelille IX - Moon 18 - Modern Finances Depository"
  ],
  [
    60011677,
    10000032,
    "Brapelille X - Moon 5 - Federal Administration Information Center"
  ],
  [
    60009415,
    10000032,
    "Brapelille X - Moon 6 - Federal Freight Storage"
  ],
  [
    60005794,
    10000032,
    "Brapelille XI - Moon 1 - Freedom Extension Storage"
  ],
  [
    60010960,
    10000048,
    "Brarel I - FedMart Warehouse"
  ],
  [
    60009382,
    10000048,
    "Brarel V - Moon 3 - Federal Freight Storage"
  ],
  [
    60009577,
    10000048,
    "Brellystier IV - Moon 2 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60008581,
    10000065,
    "Bridi II - Moon 1 - Emperor Family Academy"
  ],
  [
    60010498,
    10000065,
    "Bridi III - Moon 2 - Impetus Publisher"
  ],
  [
    60014146,
    10000042,
    "Brin V - Moon 7 - Thukker Mix Factory"
  ],
  [
    60001138,
    10000042,
    "Brin VI - Moon 14 - Kaalakiota Corporation Warehouse"
  ],
  [
    60004999,
    10000042,
    "Brin VI - Moon 7 - Republic Justice Department Accounting"
  ],
  [
    60012346,
    10000042,
    "Brundakur IV - Moon 1 - CONCORD Bureau"
  ],
  [
    60010738,
    10000042,
    "Brundakur VI - Moon 5 - Chemal Tech Factory"
  ],
  [
    60004930,
    10000042,
    "Brundakur VI - Moon 7 - Republic Justice Department Tribunal"
  ],
  [
    60009412,
    10000032,
    "Brybier I - Moon 1 - Federal Freight Storage"
  ],
  [
    60005800,
    10000032,
    "Brybier I - Moon 20 - Freedom Extension Warehouse"
  ],
  [
    60005788,
    10000032,
    "Brybier I - Moon 6 - Freedom Extension Storage"
  ],
  [
    60006472,
    10000030,
    "Bundindus IV - Moon 7 - Imperial Armaments Factory"
  ],
  [
    60013753,
    10000019,
    "BWO-UU VII - Moon 4 - Jovian Directorate Treasury"
  ],
  [
    60013585,
    10000019,
    "BWO-UU VIII - Jove Navy Testing Facilities"
  ],
  [
    60009952,
    10000041,
    "BY-S36 II - Quafe Company Warehouse"
  ],
  [
    60009955,
    10000041,
    "BY-S36 V - Moon 6 - Quafe Company Warehouse"
  ],
  [
    60014872,
    10000039,
    "BZ-0GW V - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60014912,
    10000009,
    "C-J6MT IV - Moon 1 - Serpentis Corporation Cloning"
  ],
  [
    60014897,
    10000046,
    "C4C-Z4 VIII - Moon 3 - Serpentis Corporation Refining"
  ],
  [
    60014918,
    10000039,
    "C9N-CC I - Moon 2 - Serpentis Corporation Cloning"
  ],
  [
    60009439,
    10000044,
    "Cadelanne V - Material Acquisition Mining Outpost"
  ],
  [
    60012160,
    10000001,
    "Camal IX - Ammatar Fleet Testing Facilities"
  ],
  [
    60002467,
    10000032,
    "Caretyn VI - Moon 3 - Expert Distribution Warehouse"
  ],
  [
    60011842,
    10000032,
    "Caretyn VII - Moon 13 - Federation Navy Assembly Plant"
  ],
  [
    60011845,
    10000032,
    "Caretyn VII - Moon 18 - Federation Navy Assembly Plant"
  ],
  [
    60003541,
    10000037,
    "Carirgnottin IX - Moon 17 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60013282,
    10000037,
    "Carirgnottin IX - Moon 5 - Impro Factory"
  ],
  [
    60010120,
    10000037,
    "Carirgnottin VIII - CreoDron Factory"
  ],
  [
    60010861,
    10000037,
    "Carirgnottin X - Moon 1 - Duvolle Laboratories Factory"
  ],
  [
    60012034,
    10000032,
    "Carrou III - Moon 7 - Federation Customs Logistic Support"
  ],
  [
    60010381,
    10000032,
    "Carrou IV - Moon 13 - Roden Shipyards Factory"
  ],
  [
    60015142,
    10000064,
    "Caslemon III - Federal Defense Union Logistic Support"
  ],
  [
    60009811,
    10000064,
    "Caslemon IX - Moon 16 - Combined Harvest Warehouse"
  ],
  [
    60001408,
    10000064,
    "Caslemon VI - Moon 4 - Wiyrkomi Corporation Warehouse"
  ],
  [
    60001981,
    10000064,
    "Cat VI - Moon 12 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001990,
    10000064,
    "Cat VI - Moon 4 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60011965,
    10000064,
    "Cat VI - Moon 7 - Federal Intelligence Office Logistic Support"
  ],
  [
    60001987,
    10000064,
    "Cat VII - Moon 3 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60009454,
    10000064,
    "Cat VII - Moon 4 - Material Acquisition Mineral Reserve"
  ],
  [
    60006547,
    10000032,
    "Chainelant VIII - Moon 3 - Imperial Armaments Factory"
  ],
  [
    60015019,
    10000065,
    "Chaktaren VII - Moon 3 - Hedion University"
  ],
  [
    60013960,
    10000049,
    "Chamemi VI - Moon 1 - Royal Khanid Navy Assembly Plant"
  ],
  [
    60005632,
    10000067,
    "Chamja V - Moon 12 - Core Complexion Inc. Warehouse"
  ],
  [
    60005644,
    10000067,
    "Chamja VI - Moon 6 - Core Complexion Inc. Storage"
  ],
  [
    60005641,
    10000067,
    "Chamja VI - Moon 7 - Core Complexion Inc. Storage"
  ],
  [
    60008878,
    10000020,
    "Chamume III - Civic Court Law School"
  ],
  [
    60007075,
    10000020,
    "Chamume IV - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60008884,
    10000020,
    "Chamume V - Moon 7 - Civic Court Accounting"
  ],
  [
    60007078,
    10000020,
    "Chamume VII - Moon 14 - Imperial Shipment Storage"
  ],
  [
    60007084,
    10000020,
    "Chamume VII - Moon 2 - Imperial Shipment Storage"
  ],
  [
    60015034,
    10000068,
    "Channace III - Moon 3 - Center for Advanced Studies School"
  ],
  [
    60006160,
    10000052,
    "Chanoun III - Amarr Constructions Warehouse"
  ],
  [
    60006169,
    10000052,
    "Chanoun IX - Moon 16 - Amarr Constructions Production Plant"
  ],
  [
    60010642,
    10000052,
    "Chanoun IX - The Scope Development Studio"
  ],
  [
    60006760,
    10000052,
    "Chanoun VIII - Moon 10 - Noble Appliances Factory"
  ],
  [
    60006889,
    10000052,
    "Chanoun VIII - Moon 11 - Ducia Foundry Mineral Reserve"
  ],
  [
    60006757,
    10000052,
    "Chanoun VIII - Moon 8 - Noble Appliances Factory"
  ],
  [
    60009832,
    10000048,
    "Chardalane I - Combined Harvest Plantation"
  ],
  [
    60011827,
    10000048,
    "Chardalane III - Federation Navy Testing Facilities"
  ],
  [
    60009835,
    10000048,
    "Chardalane III - Moon 2 - Combined Harvest Plantation"
  ],
  [
    60009826,
    10000048,
    "Chardalane V - Moon 2 - Combined Harvest Plantation"
  ],
  [
    60014575,
    10000048,
    "Chardalane V - X-Sense Reprocessing Facility"
  ],
  [
    60014542,
    10000064,
    "Charmerout I - X-Sense Chemical Refinery"
  ],
  [
    60009802,
    10000064,
    "Charmerout IV - Moon 1 - Combined Harvest Food Packaging"
  ],
  [
    60011671,
    10000064,
    "Charmerout IV - Moon 1 - Federal Administration Information Center"
  ],
  [
    60011665,
    10000064,
    "Charmerout IX - Moon 1 - Federal Administration Information Center"
  ],
  [
    60009172,
    10000064,
    "Charmerout IX - Moon 2 - TransStellar Shipping Storage"
  ],
  [
    60014539,
    10000064,
    "Charmerout IX - Moon 3 - X-Sense Chemical Refinery"
  ],
  [
    60001402,
    10000064,
    "Charmerout IX - Wiyrkomi Corporation Factory"
  ],
  [
    60009805,
    10000064,
    "Charmerout VII - Combined Harvest Food Packaging"
  ],
  [
    60011662,
    10000064,
    "Charmerout VII - Federal Administration Information Center"
  ],
  [
    60011668,
    10000064,
    "Charmerout VII - Moon 4 - Federal Administration Information Center"
  ],
  [
    60009169,
    10000064,
    "Charmerout X - TransStellar Shipping Storage"
  ],
  [
    60008035,
    10000043,
    "Charra I - Ministry of Assessment Information Center"
  ],
  [
    60008032,
    10000043,
    "Charra VI - Moon 13 - Ministry of Assessment Bureau Offices"
  ],
  [
    60008038,
    10000043,
    "Charra VII - Moon 19 - Ministry of Assessment Information Center"
  ],
  [
    60014629,
    10000043,
    "Chaven VIII - Moon 1 - Imperial Academy"
  ],
  [
    60008149,
    10000067,
    "Chej VI - Ministry of Internal Order Assembly Plant"
  ],
  [
    60008260,
    10000067,
    "Chej VI - Moon 2 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60005893,
    10000067,
    "Chej VI - Moon 4 - Freedom Extension Retail Center"
  ],
  [
    60008269,
    10000067,
    "Chej VII - Amarr Trade Registry Information Center"
  ],
  [
    60011719,
    10000032,
    "Chelien IV - Moon 20 - Federal Administration Information Center"
  ],
  [
    60003697,
    10000043,
    "Chemilip IV - Moon 16 - Caldari Business Tribunal"
  ],
  [
    60000130,
    10000054,
    "Chibi VI - Moon 13 - CBD Corporation Storage"
  ],
  [
    60012391,
    10000054,
    "Chibi VI - Moon 15 - CONCORD Treasury"
  ],
  [
    60000142,
    10000054,
    "Chibi VIII - Moon 21 - CBD Corporation Storage"
  ],
  [
    60012304,
    10000001,
    "Chidah V - CONCORD Assembly Plant"
  ],
  [
    60012547,
    10000001,
    "Chidah VII - Moon 10 - Ammatar Consulate Bureau"
  ],
  [
    60012307,
    10000001,
    "Chidah VIII - Moon 17 - CONCORD Assembly Plant"
  ],
  [
    60010006,
    10000067,
    "Chiga I - Moon 2 - Quafe Company Warehouse"
  ],
  [
    60011485,
    10000067,
    "Chiga III - Moon 15 - Pend Insurance Vault"
  ],
  [
    60003475,
    10000065,
    "Choga II - Caldari Business Tribunal"
  ],
  [
    60001915,
    10000065,
    "Choga II - Moon 1 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60002587,
    10000065,
    "Choga VII - Expert Distribution Retail Center"
  ],
  [
    60006520,
    10000036,
    "Choonka X - Moon 6 - Imperial Armaments Factory"
  ],
  [
    60013507,
    10000041,
    "CIS-7X IX - Moon 6 - Intaki Syndicate Bureau"
  ],
  [
    60013501,
    10000041,
    "CIS-7X VII - Intaki Syndicate Bureau"
  ],
  [
    60014719,
    10000068,
    "Cistuvaert V - Moon 12 - Center for Advanced Studies School"
  ],
  [
    60012229,
    10000012,
    "CL-1JE III - Archangels Assembly Plant"
  ],
  [
    60012844,
    10000012,
    "CL-1JE V - Moon 1 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60012775,
    10000012,
    "CL-1JE V - Moon 15 - Salvation Angels Chemical Refinery"
  ],
  [
    60012847,
    10000012,
    "CL-1JE V - Moon 3 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60012211,
    10000012,
    "CL-85V IX - Moon 2 - Archangels Assembly Plant"
  ],
  [
    60012829,
    10000012,
    "CL-85V V - Serpentis Corporation Chemical Storage"
  ],
  [
    60012889,
    10000012,
    "CL-85V VI - Moon 8 - Guardian Angels Assembly Plant"
  ],
  [
    60015035,
    10000068,
    "Clacille IV - Center for Advanced Studies School"
  ],
  [
    60008923,
    10000043,
    "Clarelam I - Theology Council Law School"
  ],
  [
    60006268,
    10000043,
    "Clarelam IV - Moon 4 - Carthum Conglomerate Foundry"
  ],
  [
    60006271,
    10000043,
    "Clarelam VI - Moon 2 - Carthum Conglomerate Foundry"
  ],
  [
    60013297,
    10000043,
    "Clarelam VI - Moon 8 - Impro Research Center"
  ],
  [
    60001945,
    10000068,
    "Claulenne IV - Moon 14 - Nugoeihuvi Corporation Publisher"
  ],
  [
    60003577,
    10000032,
    "Claysson IV - Moon 1 - Caldari Business Tribunal Information Center"
  ],
  [
    60003565,
    10000032,
    "Claysson X - Caldari Business Tribunal Accounting"
  ],
  [
    60013741,
    10000019,
    "CLDT-L III - Moon 5 - Jovian Directorate Bureau"
  ],
  [
    60013744,
    10000019,
    "CLDT-L IV - Moon 7 - Jovian Directorate Bureau"
  ],
  [
    60015036,
    10000068,
    "Clellinon VI - Moon 11 - Center for Advanced Studies School"
  ],
  [
    60008098,
    10000067,
    "Cleyd IV - Moon 13 - Ministry of Assessment Information Center"
  ],
  [
    60006382,
    10000067,
    "Cleyd IV - Moon 6 - Carthum Conglomerate Factory"
  ],
  [
    60008101,
    10000067,
    "Cleyd IV - Moon 6 - Ministry of Assessment Information Center"
  ],
  [
    60006388,
    10000067,
    "Cleyd V - Carthum Conglomerate Factory"
  ],
  [
    60006394,
    10000067,
    "Cleyd VI - Moon 4 - Carthum Conglomerate Production Plant"
  ],
  [
    60011083,
    10000064,
    "Clorteler II - Moon 1 - FedMart Warehouse"
  ],
  [
    60002653,
    10000037,
    "Colcer I - Expert Distribution Warehouse"
  ],
  [
    60002647,
    10000037,
    "Colcer IX - Moon 7 - Expert Distribution Warehouse"
  ],
  [
    60009766,
    10000037,
    "Colcer IX - Moon 9 - Combined Harvest Plantation"
  ],
  [
    60009313,
    10000037,
    "Colcer IX - Moon 9 - Federal Freight Storage"
  ],
  [
    60015020,
    10000065,
    "Conoban VII - Moon 8 - Hedion University"
  ],
  [
    60012064,
    10000068,
    "Costolle III - Moon 1 - Federation Customs Logistic Support"
  ],
  [
    60015082,
    10000068,
    "Costolle V - Federal Defense Union Logistic Support"
  ],
  [
    60015029,
    10000064,
    "Couster II - Moon 1 - Federal Navy Academy"
  ],
  [
    60015090,
    10000048,
    "Covryn III - Federal Defense Union Logistic Support"
  ],
  [
    60010879,
    10000048,
    "Covryn VI - Moon 12 - Duvolle Laboratories Warehouse"
  ],
  [
    60005917,
    10000048,
    "Covryn VI - Moon 13 - Freedom Extension Storage"
  ],
  [
    60010471,
    10000048,
    "Covryn VII - Moon 2 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60014860,
    10000032,
    "Crielere I - Duvolle Laboratories Research Center"
  ],
  [
    60014857,
    10000032,
    "Crielere I - Ishukone Corporation Research Center"
  ],
  [
    60005185,
    10000032,
    "Croleur III - Moon 1 - Republic Security Services Testing Facilities"
  ],
  [
    60005188,
    10000032,
    "Croleur VIII - Moon 2 - Republic Security Services Testing Facilities"
  ],
  [
    60009334,
    10000048,
    "Cumemare I - Federal Freight Storage"
  ],
  [
    60003583,
    10000048,
    "Cumemare III - Moon 13 - Caldari Business Tribunal"
  ],
  [
    60012838,
    10000012,
    "CVY-UC IX - Moon 17 - Serpentis Corporation Reprocessing Facility"
  ],
  [
    60002524,
    10000041,
    "CY-ZLP III - Moon 1 - Expert Distribution Warehouse"
  ],
  [
    60002107,
    10000041,
    "CY-ZLP IX - Moon 1 - Ishukone Corporation Factory"
  ],
  [
    60013576,
    10000017,
    "CZ-CED IV - Moon 18 - Jove Navy Assembly Plant"
  ],
  [
    60013789,
    10000017,
    "CZ-CED VI - Moon 2 - Jovian Directorate Bureau"
  ],
  [
    60013801,
    10000017,
    "CZ-CED VI - Moon 3 - Jovian Directorate Bureau"
  ],
  [
    60014871,
    10000035,
    "CZDJ-1 X - Moon 4 - Serpentis Corporation Manufacturing"
  ],
  [
    60014905,
    10000062,
    "D2EZ-X VI - Moon 3 - Serpentis Corporation Refining"
  ],
  [
    60014877,
    10000055,
    "D4R-H7 VII - Moon 2 - Serpentis Corporation Manufacturing"
  ],
  [
    60010828,
    10000057,
    "D5IW-F VIII - Moon 2 - Chemal Tech Factory"
  ],
  [
    60014890,
    10000010,
    "D7-ZAC VIII - Moon 1 - Serpentis Corporation Refining"
  ],
  [
    60013378,
    10000041,
    "D85-VD VII - Intaki Bank Vault"
  ],
  [
    60012196,
    10000012,
    "D87E-A VII - Moon 16 - Archangels Assembly Plant"
  ],
  [
    60012874,
    10000012,
    "D87E-A VII - Moon 6 - Guardian Angels Assembly Plant"
  ],
  [
    60014206,
    10000022,
    "D9D-GD V - Moon 2 - True Creations Shipyard"
  ],
  [
    60003622,
    10000020,
    "Dabrid II - Moon 13 - Caldari Business Tribunal Accounting"
  ],
  [
    60003619,
    10000020,
    "Dabrid III - Moon 3 - Caldari Business Tribunal Law School"
  ],
  [
    60008419,
    10000020,
    "Dabrid IV - Moon 6 - Amarr Navy Assembly Plant"
  ],
  [
    60003616,
    10000020,
    "Dabrid V - Moon 1 - Caldari Business Tribunal Accounting"
  ],
  [
    60008725,
    10000043,
    "Dakba I - Ardishapur Family Academy"
  ],
  [
    60006109,
    10000043,
    "Dakba VI - Amarr Constructions Foundry"
  ],
  [
    60008728,
    10000043,
    "Dakba VII - Ardishapur Family Treasury"
  ],
  [
    60015093,
    10000030,
    "Dal I - Tribal Liberation Force Logistic Support"
  ],
  [
    60004828,
    10000030,
    "Dal III - Moon 1 - Republic Fleet Assembly Plant"
  ],
  [
    60005041,
    10000030,
    "Dal IV - Moon 17 - Republic Justice Department Tribunal"
  ],
  [
    60005032,
    10000030,
    "Dal VI - Moon 1 - Republic Justice Department Tribunal"
  ],
  [
    60010066,
    10000030,
    "Dammalin I - Quafe Company Factory"
  ],
  [
    60000148,
    10000030,
    "Dammalin VI - CBD Corporation Storage"
  ],
  [
    60010072,
    10000030,
    "Dammalin VII - Moon 5 - Quafe Company Factory"
  ],
  [
    60013849,
    10000049,
    "Danera III - Moon 3 - Khanid Transport Storage"
  ],
  [
    60013954,
    10000049,
    "Danera IV - Moon 1 - Royal Khanid Navy Assembly Plant"
  ],
  [
    60013951,
    10000049,
    "Danera IV - Moon 9 - Royal Khanid Navy Assembly Plant"
  ],
  [
    60001165,
    10000052,
    "Dantan VI - Moon 3 - Kaalakiota Corporation Warehouse"
  ],
  [
    60004954,
    10000042,
    "Dantbeinn III - Moon 5 - Republic Justice Department Law School"
  ],
  [
    60009226,
    10000042,
    "Dantbeinn III - Moon 6 - TransStellar Shipping Storage"
  ],
  [
    60009214,
    10000042,
    "Dantbeinn IV - Moon 3 - TransStellar Shipping Storage"
  ],
  [
    60009217,
    10000042,
    "Dantbeinn IV - TransStellar Shipping Storage"
  ],
  [
    60004957,
    10000042,
    "Dantbeinn V - Moon 4 - Republic Justice Department Accounting"
  ],
  [
    60000601,
    10000016,
    "Dantumi III - Hyasyoda Corporation Refinery"
  ],
  [
    60001255,
    10000016,
    "Dantumi IV - Moon 12 - Wiyrkomi Corporation Factory"
  ],
  [
    60001246,
    10000016,
    "Dantumi IV - Moon 14 - Wiyrkomi Corporation Factory"
  ],
  [
    60000592,
    10000016,
    "Dantumi IV - Moon 19 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60005653,
    10000016,
    "Dantumi IV - Moon 2 - Core Complexion Inc. Factory"
  ],
  [
    60003442,
    10000016,
    "Dantumi IV - Moon 8 - Mercantile Club Bureau"
  ],
  [
    60002977,
    10000016,
    "Dantumi V - Moon 1 - Caldari Constructions Warehouse"
  ],
  [
    60004471,
    10000016,
    "Dantumi V - Moon 19 - Science and Trade Institute School"
  ],
  [
    60004264,
    10000016,
    "Dantumi VI - Moon 1 - Wiyrkomi Peace Corps Assembly Plant"
  ],
  [
    60001252,
    10000016,
    "Dantumi VI - Moon 3 - Wiyrkomi Corporation Factory"
  ],
  [
    60011152,
    10000016,
    "Dantumi VI - Moon 5 - Aliastra Warehouse"
  ],
  [
    60006649,
    10000065,
    "Danyana III - Moon 4 - Zoar and Sons Factory"
  ],
  [
    60006646,
    10000065,
    "Danyana IV - Moon 1 - Zoar and Sons Factory"
  ],
  [
    60008698,
    10000065,
    "Danyana VI - Moon 8 - Kor-Azor Family Bureau"
  ],
  [
    60006181,
    10000065,
    "Daran V - Amarr Constructions Foundry"
  ],
  [
    60006175,
    10000065,
    "Daran V - Moon 1 - Amarr Constructions Foundry"
  ],
  [
    60003991,
    10000016,
    "Daras III - Ishukone Watch Assembly Plant"
  ],
  [
    60005926,
    10000048,
    "Dastryns III - Freedom Extension Warehouse"
  ],
  [
    60011707,
    10000048,
    "Dastryns VIII - Moon 17 - Federal Administration Bureau Offices"
  ],
  [
    60005338,
    10000042,
    "Datulen IV - Moon 12 - Minmatar Mining Corporation Refinery"
  ],
  [
    60006067,
    10000042,
    "Datulen V - Moon 14 - The Leisure Group Development Studio"
  ],
  [
    60009256,
    10000041,
    "DCHR-L VIII - Moon 10 - TransStellar Shipping Storage"
  ],
  [
    60011926,
    10000032,
    "Decon VI - Moon 10 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60015021,
    10000043,
    "Deepari II - Imperial Academy"
  ],
  [
    60012997,
    10000054,
    "Defsunun IV - Moon 1 - DED Assembly Plant"
  ],
  [
    60008440,
    10000054,
    "Defsunun IX - Moon 15 - Amarr Navy Assembly Plant"
  ],
  [
    60001135,
    10000054,
    "Defsunun IX - Moon 18 - Kaalakiota Corporation Factory"
  ],
  [
    60005617,
    10000032,
    "Deltole III - Moon 1 - Core Complexion Inc. Warehouse"
  ],
  [
    60010678,
    10000064,
    "Deninard VIII - Moon 1 - The Scope Development Studio"
  ],
  [
    60010765,
    10000064,
    "Derririntel V - Moon 15 - Chemal Tech Warehouse"
  ],
  [
    60001984,
    10000064,
    "Derririntel V - Moon 15 - Nugoeihuvi Corporation Publisher"
  ],
  [
    60010720,
    10000064,
    "Derririntel VII - Moon 4 - The Scope Development Studio"
  ],
  [
    60006790,
    10000064,
    "Deven V - Moon 16 - Ducia Foundry Mining Outpost"
  ],
  [
    60014908,
    10000005,
    "DG-8VJ IV - Moon 3 - Serpentis Corporation Cloning"
  ],
  [
    60008398,
    10000067,
    "Diaderi II - Amarr Navy Assembly Plant"
  ],
  [
    60006130,
    10000067,
    "Diaderi IX - Moon 16 - Amarr Constructions Warehouse"
  ],
  [
    60006124,
    10000067,
    "Diaderi VII - Moon 3 - Amarr Constructions Production Plant"
  ],
  [
    60008392,
    10000067,
    "Diaderi VIII - Moon 4 - Amarr Navy Assembly Plant"
  ],
  [
    60015138,
    10000036,
    "Dihra V - 24th Imperial Crusade Logistic Support"
  ],
  [
    60006523,
    10000036,
    "Dihra VIII - Moon 16 - Imperial Armaments Factory"
  ],
  [
    60012031,
    10000032,
    "Direrie I - Federation Customs Logistic Support"
  ],
  [
    60009397,
    10000032,
    "Direrie V - Moon 17 - Federal Freight Storage"
  ],
  [
    60012037,
    10000032,
    "Direrie V - Moon 19 - Federation Customs Logistic Support"
  ],
  [
    60007792,
    10000067,
    "Djimame VI - Moon 1 - Amarr Civil Service Bureau Offices"
  ],
  [
    60007798,
    10000067,
    "Djimame VIII - Moon 2 - Amarr Civil Service Bureau Offices"
  ],
  [
    60013570,
    10000019,
    "DLY-RG VIII - Moon 3 - Jove Navy Assembly Plant"
  ],
  [
    60013684,
    10000019,
    "DLY-RG X - Jovian Directorate Bureau"
  ],
  [
    60014692,
    10000032,
    "Dodenvale VIII - Federal Navy Academy"
  ],
  [
    60006544,
    10000032,
    "Dodenvale VIII - Moon 3 - Imperial Armaments Factory"
  ],
  [
    60006553,
    10000032,
    "Dodenvale X - Moon 2 - Imperial Armaments Factory"
  ],
  [
    60010666,
    10000032,
    "Dodenvale X - Moon 5 - The Scope Publisher"
  ],
  [
    60011866,
    10000032,
    "Dodixie IX - Moon 20 - Federation Navy Assembly Plant"
  ],
  [
    60001864,
    10000032,
    "Dodixie IX - Moon 9 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001867,
    10000032,
    "Dodixie VIII - Moon 3 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60012238,
    10000012,
    "Doril I - Archangels Assembly Plant"
  ],
  [
    60012781,
    10000012,
    "Doril V - Moon 1 - Salvation Angels Chemical Refinery"
  ],
  [
    60009574,
    10000048,
    "Dour V - Moon 7 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60005131,
    10000048,
    "Dour VII - Moon 2 - Republic Security Services Assembly Plant"
  ],
  [
    60012682,
    10000048,
    "Dour VIII - Moon 1 - Sisters of EVE Academy"
  ],
  [
    60009757,
    10000032,
    "Doussivitte VIII - Combined Harvest Warehouse"
  ],
  [
    60010726,
    10000032,
    "Doussivitte VIII - Moon 20 - Chemal Tech Factory"
  ],
  [
    60009034,
    10000032,
    "Doussivitte VIII - Moon 20 - TransStellar Shipping Storage"
  ],
  [
    60010732,
    10000032,
    "Doussivitte VIII - Moon 8 - Chemal Tech Factory"
  ],
  [
    60009049,
    10000032,
    "Doussivitte X - TransStellar Shipping Storage"
  ],
  [
    60008362,
    10000067,
    "Doza I - Amarr Trade Registry Information Center"
  ],
  [
    60013393,
    10000041,
    "DP34-U V - Moon 1 - Intaki Commerce Trading Post"
  ],
  [
    60010549,
    10000041,
    "DP34-U VII - Moon 1 - Impetus Development Studio"
  ],
  [
    60005941,
    10000052,
    "Dresi I - Moon 1 - Freedom Extension Storage"
  ],
  [
    60006238,
    10000052,
    "Dresi I - Moon 10 - Carthum Conglomerate Factory"
  ],
  [
    60008797,
    10000052,
    "Dresi I - Moon 17 - Civic Court Tribunal"
  ],
  [
    60008515,
    10000052,
    "Dresi I - Moon 18 - Emperor Family Bureau"
  ],
  [
    60005092,
    10000052,
    "Dresi I - Moon 18 - Republic Security Services Assembly Plant"
  ],
  [
    60008794,
    10000052,
    "Dresi I - Moon 3 - Civic Court Accounting"
  ],
  [
    60005932,
    10000052,
    "Dresi I - Moon 5 - Freedom Extension Storage"
  ],
  [
    60005947,
    10000052,
    "Dresi II - Freedom Extension Retail Center"
  ],
  [
    60007729,
    10000052,
    "Dresi II - Royal Amarr Institute School"
  ],
  [
    60009487,
    10000064,
    "Droselory IX - Moon 4 - Material Acquisition Mineral Reserve"
  ],
  [
    60010156,
    10000064,
    "Droselory VI - Moon 17 - CreoDron Warehouse"
  ],
  [
    60014326,
    10000022,
    "DSS-EZ IV - Moon 1 - True Power Refinery"
  ],
  [
    60004525,
    10000042,
    "Dudreda IV - Krusual Tribe Bureau"
  ],
  [
    60004840,
    10000042,
    "Dudreda V - Moon 3 - Republic Fleet Assembly Plant"
  ],
  [
    60004693,
    10000042,
    "Dudreda V - Moon 8 - Republic Parliament Bureau"
  ],
  [
    60004846,
    10000042,
    "Dudreda VI - Moon 12 - Republic Fleet Assembly Plant"
  ],
  [
    60014758,
    10000042,
    "Dudreda VI - Moon 4 - Republic Military School"
  ],
  [
    60004531,
    10000042,
    "Dudreda VI - Moon 6 - Krusual Tribe Bureau"
  ],
  [
    60014755,
    10000030,
    "Dumkirinur V - Republic Military School"
  ],
  [
    60002095,
    10000032,
    "Dunraelare II - Ishukone Corporation Warehouse"
  ],
  [
    60010888,
    10000032,
    "Dunraelare V - Moon 1 - Duvolle Laboratories Factory"
  ],
  [
    60001216,
    10000032,
    "Dunraelare VIII - Moon 14 - Kaalakiota Corporation Factory"
  ],
  [
    60001222,
    10000032,
    "Dunraelare VIII - Moon 15 - Kaalakiota Corporation Factory"
  ],
  [
    60001318,
    10000032,
    "Dunraelare VIII - Moon 7 - Wiyrkomi Corporation Warehouse"
  ],
  [
    60014689,
    10000064,
    "Duripant VII - Moon 6 - Federal Navy Academy"
  ],
  [
    60012136,
    10000001,
    "Dysa II - Ammatar Fleet Assembly Plant"
  ],
  [
    60014927,
    10000061,
    "DZ6-I5 IV - Moon 1 - Serpentis Corporation Cloning"
  ],
  [
    60014062,
    10000011,
    "E02-IK VIII - Moon 1 - Thukker Mix Factory"
  ],
  [
    60013891,
    10000017,
    "E2AX-5 VIII - Moon 1 - Prosper Depository"
  ],
  [
    60014892,
    10000025,
    "E8-YS9 VI - Moon 4 - Serpentis Corporation Refining"
  ],
  [
    60011194,
    10000043,
    "Ealur IX - Moon 16 - Aliastra Warehouse"
  ],
  [
    60006079,
    10000042,
    "Earwik V - The Leisure Group Development Studio"
  ],
  [
    60014803,
    10000042,
    "Earwik VI - Moon 10 - Republic University"
  ],
  [
    60002674,
    10000043,
    "Eba II - Expert Distribution Warehouse"
  ],
  [
    60007744,
    10000043,
    "Eba VII - Moon 16 - Imperial Chancellor Bureau Offices"
  ],
  [
    60002677,
    10000043,
    "Eba VII - Moon 4 - Expert Distribution Retail Center"
  ],
  [
    60002665,
    10000043,
    "Eba VIII - Moon 4 - Expert Distribution Retail Center"
  ],
  [
    60007207,
    10000043,
    "Eba VIII - Moon 9 - Amarr Certified News Publisher"
  ],
  [
    60001054,
    10000067,
    "Ebasez VIII - Moon 4 - Kaalakiota Corporation Factory"
  ],
  [
    60010534,
    10000030,
    "Ebasgerdur III - Impetus Development Studio"
  ],
  [
    60001111,
    10000030,
    "Ebasgerdur V - Moon 11 - Kaalakiota Corporation Factory"
  ],
  [
    60006259,
    10000043,
    "Ebo IV - Moon 1 - Carthum Conglomerate Factory"
  ],
  [
    60008920,
    10000043,
    "Ebo IX - Theology Council Tribunal"
  ],
  [
    60006265,
    10000043,
    "Ebo VII - Moon 1 - Carthum Conglomerate Factory"
  ],
  [
    60001114,
    10000030,
    "Ebodold X - Moon 17 - Kaalakiota Corporation Research Center"
  ],
  [
    60015096,
    10000042,
    "Ebolfer V - Tribal Liberation Force Testing Facilities"
  ],
  [
    60004537,
    10000042,
    "Ebolfer VI - Moon 2 - Krusual Tribe Bureau"
  ],
  [
    60008371,
    10000043,
    "Ebtesham V - Amarr Navy Assembly Plant"
  ],
  [
    60002668,
    10000043,
    "Ebtesham VI - Moon 15 - Expert Distribution Warehouse"
  ],
  [
    60008377,
    10000043,
    "Ebtesham VI - Moon 2 - Amarr Navy Assembly Plant"
  ],
  [
    60005842,
    10000030,
    "Eddar VI - Freedom Extension Storage"
  ],
  [
    60011188,
    10000030,
    "Eddar VIII - Moon 7 - Aliastra Retail Center"
  ],
  [
    60006052,
    10000030,
    "Eddar VIII - Moon 8 - The Leisure Group Development Studio"
  ],
  [
    60015053,
    10000030,
    "Edmalbrurdus I - Republic University"
  ],
  [
    60013429,
    10000041,
    "EF-F36 III - Moon 1 - Intaki Space Police Logistic Support"
  ],
  [
    60013162,
    10000054,
    "Efu V - Moon 1 - Genolution Biotech Production"
  ],
  [
    60012700,
    10000054,
    "Efu V - Moon 12 - Sisters of EVE Bureau"
  ],
  [
    60006670,
    10000054,
    "Efu V - Moon 18 - Zoar and Sons Factory"
  ],
  [
    60006667,
    10000054,
    "Efu V - Moon 19 - Zoar and Sons Factory"
  ],
  [
    60012694,
    10000054,
    "Efu VII - Sisters of EVE Bureau"
  ],
  [
    60005368,
    10000028,
    "Egbinger III - Moon 1 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60005362,
    10000028,
    "Egbinger IX - Moon 8 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60012427,
    10000028,
    "Egbinger V - CONCORD Treasury"
  ],
  [
    60000085,
    10000028,
    "Egbinger XI - Moon 3 - CBD Corporation Storage"
  ],
  [
    60004870,
    10000028,
    "Egbinger XI - Moon 3 - Republic Fleet Testing Facilities"
  ],
  [
    60012424,
    10000028,
    "Egbinger XII - CONCORD Academy"
  ],
  [
    60004561,
    10000028,
    "Egbinger XII - Moon 2 - Vherokior Tribe Treasury"
  ],
  [
    60004636,
    10000042,
    "Egbonbet VI - Moon 11 - Republic Parliament Bureau"
  ],
  [
    60011026,
    10000032,
    "Egghelende IV - Moon 1 - FedMart Warehouse"
  ],
  [
    60011578,
    10000032,
    "Egghelende V - Moon 13 - University of Caille"
  ],
  [
    60010804,
    10000032,
    "Egghelende VI - Moon 19 - Chemal Tech Factory"
  ],
  [
    60011794,
    10000032,
    "Egghelende VII - Moon 20 - Federation Navy Assembly Plant"
  ],
  [
    60010345,
    10000032,
    "Egghelende VII - Moon 22 - Roden Shipyards Factory"
  ],
  [
    60011863,
    10000032,
    "Eglennaert I - Moon 1 - Federation Navy Assembly Plant"
  ],
  [
    60009688,
    10000032,
    "Eglennaert I - Moon 11 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60001870,
    10000032,
    "Eglennaert I - Moon 11 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60009691,
    10000032,
    "Eglennaert I - Moon 12 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60011977,
    10000032,
    "Eglennaert I - Moon 14 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60011860,
    10000032,
    "Eglennaert I - Moon 16 - Federation Navy Logistic Support"
  ],
  [
    60001861,
    10000032,
    "Eglennaert I - Moon 17 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60011980,
    10000032,
    "Eglennaert I - Moon 4 - Federal Intelligence Office Logistic Support"
  ],
  [
    60011869,
    10000032,
    "Eglennaert I - Moon 4 - Federation Navy Assembly Plant"
  ],
  [
    60009679,
    10000032,
    "Eglennaert I - Moon 6 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60005272,
    10000042,
    "Egmar V - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60005902,
    10000042,
    "Egmar XII - Freedom Extension Storage"
  ],
  [
    60004981,
    10000042,
    "Egmar XII - Moon 10 - Republic Justice Department Law School"
  ],
  [
    60005899,
    10000042,
    "Egmar XII - Moon 12 - Freedom Extension Storage"
  ],
  [
    60004672,
    10000030,
    "Egmur VII - Moon 15 - Republic Parliament Academy"
  ],
  [
    60004681,
    10000030,
    "Egmur VII - Moon 16 - Republic Parliament Academy"
  ],
  [
    60015078,
    10000069,
    "Eha III - State Protectorate Logistic Support"
  ],
  [
    60010750,
    10000036,
    "Ehnoum II - Chemal Tech Factory"
  ],
  [
    60007546,
    10000042,
    "Eiluvodi VI - Moon 10 - Nurtura Food Packaging"
  ],
  [
    60000040,
    10000042,
    "Eiluvodi VI - Moon 14 - CBD Corporation Storage"
  ],
  [
    60000043,
    10000042,
    "Eiluvodi VIII - Moon 2 - CBD Corporation Storage"
  ],
  [
    60003913,
    10000033,
    "Eitu III - Moon 12 - Caldari Navy Assembly Plant"
  ],
  [
    60003286,
    10000033,
    "Eitu III - Moon 5 - Modern Finances Depository"
  ],
  [
    60003289,
    10000033,
    "Eitu III - Moon 9 - Modern Finances Depository"
  ],
  [
    60004390,
    10000033,
    "Eitu VI - Moon 10 - Corporate Police Force Assembly Plant"
  ],
  [
    60004384,
    10000033,
    "Eitu VI - Moon 21 - Corporate Police Force Assembly Plant"
  ],
  [
    60014665,
    10000033,
    "Eitu VI - Moon 3 - State War Academy"
  ],
  [
    60003217,
    10000033,
    "Eitu VI - Moon 7 - State and Region Bank Depository"
  ],
  [
    60010573,
    10000033,
    "Eitu VII - Moon 2 - Impetus Development Studio"
  ],
  [
    60010570,
    10000033,
    "Eitu VII - Moon 4 - Impetus Development Studio"
  ],
  [
    60007561,
    10000001,
    "Ejahi IV - Nurtura Warehouse"
  ],
  [
    60007567,
    10000001,
    "Ejahi VI - Nurtura Warehouse"
  ],
  [
    60006001,
    10000043,
    "Ekid V - Freedom Extension Warehouse"
  ],
  [
    60008668,
    10000043,
    "Ekid X - Sarum Family Logistic Support"
  ],
  [
    60005575,
    10000068,
    "Ekuenbiron III - Moon 1 - Core Complexion Inc. Warehouse"
  ],
  [
    60005581,
    10000068,
    "Ekuenbiron V - Moon 1 - Core Complexion Inc. Warehouse"
  ],
  [
    60012106,
    10000068,
    "Ekuenbiron VI - Federation Customs Logistic Support"
  ],
  [
    60005590,
    10000068,
    "Ekuenbiron VII - Moon 11 - Core Complexion Inc. Storage"
  ],
  [
    60012100,
    10000068,
    "Ekuenbiron VII - Moon 12 - Federation Customs Logistic Support"
  ],
  [
    60005587,
    10000068,
    "Ekuenbiron VIII - Core Complexion Inc. Storage"
  ],
  [
    60002968,
    10000016,
    "Ekura VII - Moon 14 - Caldari Constructions Warehouse"
  ],
  [
    60015134,
    10000016,
    "Elanoda IV - State Protectorate Logistic Support"
  ],
  [
    60007621,
    10000042,
    "Eldjaerin IV - Nurtura Food Packaging"
  ],
  [
    60004576,
    10000028,
    "Eldulf IV - Moon 11 - Vherokior Tribe Bureau"
  ],
  [
    60004573,
    10000028,
    "Eldulf V - Moon 6 - Vherokior Tribe Academy"
  ],
  [
    60004570,
    10000028,
    "Eldulf VI - Moon 3 - Vherokior Tribe Academy"
  ],
  [
    60012109,
    10000068,
    "Eletta IX - Federation Customs Assembly Plant"
  ],
  [
    60012994,
    10000068,
    "Eletta VII - Moon 7 - DED Logistic Support"
  ],
  [
    60011581,
    10000068,
    "Eletta VIII - Moon 19 - University of Caille"
  ],
  [
    60005719,
    10000042,
    "Elgoi VI - Moon 1 - Eifyr and Co. Biotech Production"
  ],
  [
    60005425,
    10000042,
    "Elgoi VII - Moon 6 - Core Complexion Inc. Storage"
  ],
  [
    60005428,
    10000042,
    "Elgoi VIII - Moon 18 - Core Complexion Inc. Storage"
  ],
  [
    60014104,
    10000042,
    "Elgoi VIII - Moon 19 - Thukker Mix Factory"
  ],
  [
    60014476,
    10000068,
    "Ellmay I - X-Sense Chemical Storage"
  ],
  [
    60001927,
    10000068,
    "Ellmay IX - Moon 2 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60011206,
    10000068,
    "Ellmay VIII - Moon 10 - Aliastra Warehouse"
  ],
  [
    60014473,
    10000068,
    "Ellmay VIII - Moon 12 - X-Sense Chemical Refinery"
  ],
  [
    60007372,
    10000016,
    "Elonaya VI - Joint Harvesting Plantation"
  ],
  [
    60000271,
    10000016,
    "Elonaya X - Moon 11 - CBD Corporation Storage"
  ],
  [
    60004003,
    10000016,
    "Elonaya X - Moon 15 - Home Guard Logistic Support"
  ],
  [
    60000310,
    10000016,
    "Elonaya X - Moon 21 - Ytiri Storage"
  ],
  [
    60000256,
    10000016,
    "Elonaya X - Moon 22 - CBD Corporation Storage"
  ],
  [
    60002305,
    10000016,
    "Elonaya X - Moon 4 - Lai Dai Corporation Factory"
  ],
  [
    60007375,
    10000016,
    "Elonaya XI - Joint Harvesting Plantation"
  ],
  [
    60009430,
    10000044,
    "Elore IV - Moon 1 - Material Acquisition Mining Outpost"
  ],
  [
    60010390,
    10000044,
    "Elore V - Moon 4 - Allotek Industries Warehouse"
  ],
  [
    60014701,
    10000044,
    "Elore VI - Moon 4 - Federal Navy Academy"
  ],
  [
    60015046,
    10000042,
    "Embod IV - Moon 10 - Pator Tech School"
  ],
  [
    60005011,
    10000030,
    "Emolgranlan V - Moon 12 - Republic Justice Department Tribunal"
  ],
  [
    60010063,
    10000030,
    "Emolgranlan V - Moon 3 - Quafe Company Warehouse"
  ],
  [
    60004753,
    10000030,
    "Emolgranlan VI - Republic Fleet Assembly Plant"
  ],
  [
    60004606,
    10000030,
    "Emolgranlan VII - Moon 9 - Brutor Tribe Bureau"
  ],
  [
    60007702,
    10000020,
    "Emrayur III - Moon 1 - Royal Amarr Institute School"
  ],
  [
    60005542,
    10000065,
    "Enal IX - Moon 1 - Core Complexion Inc. Factory"
  ],
  [
    60005545,
    10000065,
    "Enal IX - Moon 3 - Core Complexion Inc. Factory"
  ],
  [
    60005539,
    10000065,
    "Enal IX - Moon 4 - Core Complexion Inc. Factory"
  ],
  [
    60005548,
    10000065,
    "Enal IX - Moon 5 - Core Complexion Inc. Factory"
  ],
  [
    60005551,
    10000065,
    "Enal VI - Moon 1 - Core Complexion Inc. Storage"
  ],
  [
    60008704,
    10000065,
    "Enal VIII - Moon 13 - Kor-Azor Family Bureau"
  ],
  [
    60010564,
    10000065,
    "Enal X - Impetus Development Studio"
  ],
  [
    60015074,
    10000069,
    "Enaluri II - State Protectorate Logistic Support"
  ],
  [
    60015068,
    10000069,
    "Enaluri V - State Protectorate Assembly Plant"
  ],
  [
    60010810,
    10000016,
    "Endatoh IV - Chemal Tech Factory"
  ],
  [
    60010807,
    10000016,
    "Endatoh IV - Moon 1 - Chemal Tech Warehouse"
  ],
  [
    60002053,
    10000016,
    "Endatoh V - Echelon Entertainment Development Studio"
  ],
  [
    60010813,
    10000016,
    "Endatoh VI - Chemal Tech Factory"
  ],
  [
    60003955,
    10000016,
    "Endatoh VII - Moon 2 - Lai Dai Protection Service Assembly Plant"
  ],
  [
    60001819,
    10000033,
    "Enderailen IV - Zainou Biotech Production"
  ],
  [
    60000751,
    10000033,
    "Enderailen V - Poksu Mineral Group Refinery"
  ],
  [
    60004174,
    10000033,
    "Enderailen VI - Moon 11 - Spacelane Patrol Assembly Plant"
  ],
  [
    60004186,
    10000033,
    "Enderailen VI - Moon 17 - Spacelane Patrol Assembly Plant"
  ],
  [
    60004183,
    10000033,
    "Enderailen VII - Moon 6 - Spacelane Patrol Assembly Plant"
  ],
  [
    60013252,
    10000033,
    "Enderailen VIII - Moon 16 - Genolution Biotech Production"
  ],
  [
    60004177,
    10000033,
    "Enderailen VIII - Moon 3 - Spacelane Patrol Assembly Plant"
  ],
  [
    60010171,
    10000030,
    "Endrulf IV - Moon 1 - CreoDron Warehouse"
  ],
  [
    60004963,
    10000030,
    "Endrulf IV - Moon 1 - Republic Justice Department Accounting"
  ],
  [
    60010168,
    10000030,
    "Endrulf VIII - Moon 1 - CreoDron Warehouse"
  ],
  [
    60013321,
    10000028,
    "Ennur IX - Moon 7 - Impro Research Center"
  ],
  [
    60004657,
    10000028,
    "Ennur VIII - Moon 6 - Republic Parliament Treasury"
  ],
  [
    60004654,
    10000028,
    "Ennur VIII - Moon 7 - Republic Parliament Treasury"
  ],
  [
    60004486,
    10000042,
    "Eram IX - Moon 4 - Sebiestor Tribe Bureau"
  ],
  [
    60005416,
    10000042,
    "Eram IX - Moon 5 - Core Complexion Inc. Factory"
  ],
  [
    60005722,
    10000042,
    "Eram V - Moon 2 - Eifyr and Co. Biotech Production"
  ],
  [
    60004483,
    10000042,
    "Eram V - Moon 2 - Sebiestor Tribe Bureau"
  ],
  [
    60004480,
    10000042,
    "Eram VIII - Moon 13 - Sebiestor Tribe Bureau"
  ],
  [
    60006043,
    10000042,
    "Eram VIII - Moon 17 - The Leisure Group Development Studio"
  ],
  [
    60000700,
    10000033,
    "Eranakko III - Moon 6 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60003103,
    10000033,
    "Eranakko IV - Moon 1 - Expert Housing Foundry"
  ],
  [
    60001189,
    10000036,
    "Eredan I - Kaalakiota Corporation Research Center"
  ],
  [
    60007042,
    10000036,
    "Eredan III - Imperial Shipment Storage"
  ],
  [
    60008995,
    10000036,
    "Eredan VII - Moon 1 - Theology Council Accounting"
  ],
  [
    60015047,
    10000042,
    "Erego VII - Moon 20 - Pator Tech School"
  ],
  [
    60004033,
    10000016,
    "Erenta II - Moon 2 - Home Guard Assembly Plant"
  ],
  [
    60004297,
    10000016,
    "Erenta V - Wiyrkomi Peace Corps Logistic Support"
  ],
  [
    60013111,
    10000016,
    "Erenta VI - Moon 6 - Genolution Biotech Production"
  ],
  [
    60012634,
    10000042,
    "Erindur VI - Moon 1 - Sisters of EVE Academy"
  ],
  [
    60005818,
    10000042,
    "Erindur VI - Moon 15 - Freedom Extension Warehouse"
  ],
  [
    60012637,
    10000042,
    "Erindur VII - Moon 2 - Sisters of EVE Academy"
  ],
  [
    60003310,
    10000042,
    "Erindur VIII - Moon 18 - Modern Finances Vault"
  ],
  [
    60010777,
    10000038,
    "Erkinen XII - Moon 7 - Chemal Tech Factory"
  ],
  [
    60013093,
    10000038,
    "Erkinen XII - Moon 8 - Genolution Biotech Production"
  ],
  [
    60003499,
    10000042,
    "Erstur III - Moon 1 - Caldari Business Tribunal"
  ],
  [
    60002374,
    10000002,
    "Eruka II - Propel Dynamics Warehouse"
  ],
  [
    60007501,
    10000002,
    "Eruka IV - Moon 6 - Joint Harvesting Food Packaging"
  ],
  [
    60000493,
    10000002,
    "Eruka V - Moon 5 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60004378,
    10000002,
    "Eruka VIII - Moon 12 - Corporate Police Force Logistic Support"
  ],
  [
    60000499,
    10000002,
    "Eruka VIII - Moon 18 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60008410,
    10000043,
    "Erzoh V - Moon 14 - Amarr Navy Testing Facilities"
  ],
  [
    60012220,
    10000012,
    "ES-UWY VI - Archangels Logistic Support"
  ],
  [
    60006610,
    10000020,
    "Esa VIII - Moon 2 - Viziam Warehouse"
  ],
  [
    60006526,
    10000036,
    "Esescama VIII - Moon 3 - Imperial Armaments Warehouse"
  ],
  [
    60015084,
    10000048,
    "Esesier IX - Federal Defense Union Logistic Support"
  ],
  [
    60006802,
    10000048,
    "Esesier X - Ducia Foundry Mining Outpost"
  ],
  [
    60011353,
    10000048,
    "Esesier X - Moon 3 - Bank of Luminaire Vault"
  ],
  [
    60003007,
    10000002,
    "Eskunen VI - Caldari Constructions Warehouse"
  ],
  [
    60004072,
    10000002,
    "Eskunen X - Moon 13 - Peace and Order Unit Assembly Plant"
  ],
  [
    60004069,
    10000002,
    "Eskunen X - Moon 16 - Peace and Order Unit Assembly Plant"
  ],
  [
    60003004,
    10000002,
    "Eskunen XI - Moon 1 - Caldari Constructions Production Plant"
  ],
  [
    60012493,
    10000032,
    "Esmes IV - Moon 2 - CONCORD Treasury"
  ],
  [
    60011239,
    10000048,
    "Espigoure VIII - Moon 5 - Aliastra Warehouse"
  ],
  [
    60012952,
    10000043,
    "Esteban VIII - Moon 4 - DED Logistic Support"
  ],
  [
    60009370,
    10000032,
    "Estene I - Moon 1 - Federal Freight Storage"
  ],
  [
    60001210,
    10000032,
    "Estene VI - Moon 17 - Kaalakiota Corporation Factory"
  ],
  [
    60009373,
    10000032,
    "Estene VI - Moon 3 - Federal Freight Storage"
  ],
  [
    60007939,
    10000054,
    "Esubara I - Moon 13 - Ministry of War Bureau Offices"
  ],
  [
    60007942,
    10000054,
    "Esubara I - Moon 15 - Ministry of War Bureau Offices"
  ],
  [
    60007936,
    10000054,
    "Esubara II - Moon 12 - Ministry of War Information Center"
  ],
  [
    60013243,
    10000042,
    "Eszur I - Moon 1 - Genolution Biotech Production"
  ],
  [
    60015097,
    10000042,
    "Eszur III - Tribal Liberation Force Assembly Plant"
  ],
  [
    60002131,
    10000042,
    "Eszur IV - Ishukone Corporation Factory"
  ],
  [
    60007855,
    10000043,
    "Etav IX - Amarr Civil Service Information Center"
  ],
  [
    60007861,
    10000043,
    "Etav VIII - Moon 14 - Amarr Civil Service Bureau Offices"
  ],
  [
    60006928,
    10000043,
    "Etav X - Moon 3 - HZO Refinery"
  ],
  [
    60009700,
    10000037,
    "Ethernity V - Moon 1 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60010597,
    10000037,
    "Ethernity VI - Moon 16 - Egonics Inc. Development Studio"
  ],
  [
    60010594,
    10000037,
    "Ethernity VI - Moon 17 - Egonics Inc. Development Studio"
  ],
  [
    60015085,
    10000048,
    "Eugales V - Federal Defense Union Assembly Plant"
  ],
  [
    60010987,
    10000048,
    "Eugales VII - Moon 9 - FedMart Retail Center"
  ],
  [
    60007624,
    10000042,
    "Eurgrana I - Nurtura Plantation"
  ],
  [
    60004492,
    10000042,
    "Eurgrana VII - Moon 13 - Sebiestor Tribe Treasury"
  ],
  [
    60004489,
    10000042,
    "Eurgrana VIII - Moon 18 - Sebiestor Tribe Academy"
  ],
  [
    60010552,
    10000042,
    "Eust I - Impetus Development Studio"
  ],
  [
    60005002,
    10000042,
    "Evati II - Moon 1 - Republic Justice Department Tribunal"
  ],
  [
    60012970,
    10000042,
    "Evati IX - Moon 1 - DED Assembly Plant"
  ],
  [
    60004858,
    10000042,
    "Evati IX - Moon 12 - Republic Fleet Assembly Plant"
  ],
  [
    60001150,
    10000042,
    "Evati IX - Moon 4 - Kaalakiota Corporation Warehouse"
  ],
  [
    60005710,
    10000042,
    "Evati V - Moon 1 - Boundless Creation Factory"
  ],
  [
    60004852,
    10000042,
    "Evati VI - Moon 3 - Republic Fleet Logistic Support"
  ],
  [
    60001147,
    10000042,
    "Evati VII - Moon 1 - Kaalakiota Corporation Warehouse"
  ],
  [
    60005713,
    10000042,
    "Evati X - Moon 2 - Boundless Creation Factory"
  ],
  [
    60001141,
    10000042,
    "Evati X - Moon 2 - Kaalakiota Corporation Factory"
  ],
  [
    60011020,
    10000048,
    "Evaulon V - Moon 2 - FedMart Storage"
  ],
  [
    60011356,
    10000048,
    "Evaulon VI - Moon 1 - Bank of Luminaire Depository"
  ],
  [
    60005326,
    10000042,
    "Evettullur I - Minmatar Mining Corporation Refinery"
  ],
  [
    60004645,
    10000042,
    "Evettullur VI - Moon 18 - Republic Parliament Bureau"
  ],
  [
    60014776,
    10000042,
    "Evettullur VI - Republic Military School"
  ],
  [
    60010555,
    10000042,
    "Evuldgenzo VI - Moon 2 - Impetus Development Studio"
  ],
  [
    60005311,
    10000042,
    "Eygfe VII - Moon 19 - Minmatar Mining Corporation Refinery"
  ],
  [
    60002146,
    10000042,
    "Eygfe VII - Moon 9 - Ishukone Corporation Factory"
  ],
  [
    60004756,
    10000030,
    "Eystur III - Moon 1 - Republic Fleet Assembly Plant"
  ],
  [
    60005062,
    10000030,
    "Eystur III - Moon 1 - Republic Security Services Assembly Plant"
  ],
  [
    60010048,
    10000030,
    "Eystur III - Moon 2 - Quafe Company Factory"
  ],
  [
    60010057,
    10000030,
    "Eystur IV - Quafe Company Factory"
  ],
  [
    60011410,
    10000030,
    "Eystur V - Pend Insurance Depository"
  ],
  [
    60005017,
    10000030,
    "Eystur VI - Republic Justice Department Tribunal"
  ],
  [
    60013552,
    10000041,
    "EZA-FM IV - Intaki Syndicate Bureau"
  ],
  [
    60014092,
    10000041,
    "EZA-FM IV - Moon 16 - Thukker Mix Factory"
  ],
  [
    60014886,
    10000006,
    "F-EM4Q V - Moon 5 - Serpentis Corporation Refining"
  ],
  [
    60014889,
    10000009,
    "F2A-GX IV - Moon 4 - Serpentis Corporation Refining"
  ],
  [
    60013381,
    10000041,
    "F67E-Q VIII - Moon 2 - Intaki Commerce Trading Post"
  ],
  [
    60014341,
    10000022,
    "F9SX-1 V - Moon 1 - True Power Assembly Plant"
  ],
  [
    60008062,
    10000043,
    "Fabum III - Ministry of Assessment Archives"
  ],
  [
    60008839,
    10000054,
    "Fageras X - Civic Court Accounting"
  ],
  [
    60008290,
    10000043,
    "Fahruni VI - Amarr Trade Registry Bureau Offices"
  ],
  [
    60011200,
    10000043,
    "Fahruni X - Moon 1 - Aliastra Retail Center"
  ],
  [
    60014638,
    10000043,
    "Fahruni XI - Imperial Academy"
  ],
  [
    60008284,
    10000043,
    "Fahruni XI - Moon 13 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60012709,
    10000043,
    "Fahruni XII - Sisters of EVE Bureau"
  ],
  [
    60012163,
    10000001,
    "Faspera I - Ammatar Fleet Testing Facilities"
  ],
  [
    60006994,
    10000043,
    "Faswiba IX - Moon 1 - Inherent Implants Biotech Production"
  ],
  [
    60008677,
    10000043,
    "Faswiba IX - Moon 8 - Sarum Family Assembly Plant"
  ],
  [
    60010696,
    10000043,
    "Faswiba VII - Moon 4 - The Scope Development Studio"
  ],
  [
    60008680,
    10000043,
    "Faswiba VIII - Moon 11 - Sarum Family Assembly Plant"
  ],
  [
    60010699,
    10000043,
    "Faswiba VIII - Moon 3 - The Scope Publisher"
  ],
  [
    60014868,
    10000014,
    "FAT-6P VIII - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60009391,
    10000032,
    "Faurent I - Federal Freight Storage"
  ],
  [
    60009394,
    10000032,
    "Faurent V - Moon 2 - Federal Freight Storage"
  ],
  [
    60010384,
    10000032,
    "Faurent VII - Moon 4 - Roden Shipyards Factory"
  ],
  [
    60013360,
    10000041,
    "FD-MLJ VII - Moon 2 - Intaki Bank Depository"
  ],
  [
    60013408,
    10000041,
    "FD-MLJ VII - Moon 4 - Intaki Space Police Assembly Plant"
  ],
  [
    60012733,
    10000029,
    "FDZ4-A IX - Moon 6 - Society of Conscious Thought School"
  ],
  [
    60012730,
    10000029,
    "FDZ4-A VIII - Moon 3 - Society of Conscious Thought School"
  ],
  [
    60008578,
    10000065,
    "Fensi V - Moon 1 - Emperor Family Bureau"
  ],
  [
    60000214,
    10000065,
    "Fensi VI - Moon 10 - CBD Corporation Storage"
  ],
  [
    60006682,
    10000065,
    "Fensi VII - Moon 10 - Zoar and Sons Factory"
  ],
  [
    60007144,
    10000020,
    "Ferira VI - Moon 14 - Imperial Shipment Storage"
  ],
  [
    60007132,
    10000020,
    "Ferira VIII - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60001303,
    10000054,
    "Fihrneh IV - Moon 8 - Wiyrkomi Corporation Factory"
  ],
  [
    60001297,
    10000054,
    "Fihrneh V - Moon 4 - Wiyrkomi Corporation Factory"
  ],
  [
    60007705,
    10000054,
    "Fihrneh VI - Moon 1 - Royal Amarr Institute School"
  ],
  [
    60007222,
    10000054,
    "Fihrneh VI - Moon 10 - Amarr Certified News Development Studio"
  ],
  [
    60001300,
    10000054,
    "Fihrneh VI - Moon 14 - Wiyrkomi Corporation Warehouse"
  ],
  [
    60010690,
    10000054,
    "Fihrneh VI - Moon 5 - The Scope Development Studio"
  ],
  [
    60001294,
    10000054,
    "Fihrneh VI - Moon 8 - Wiyrkomi Corporation Factory"
  ],
  [
    60015048,
    10000042,
    "Fildar V - Pator Tech School"
  ],
  [
    60005260,
    10000042,
    "Finanar VIII - Moon 2 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60005254,
    10000042,
    "Finanar X - Moon 15 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60008464,
    10000052,
    "Finid X - Moon 1 - Amarr Navy Assembly Plant"
  ],
  [
    60015080,
    10000064,
    "Fliet III - Federal Defense Union Logistic Support"
  ],
  [
    60011335,
    10000064,
    "Fliet IV - Bank of Luminaire Depository"
  ],
  [
    60006025,
    10000042,
    "Floseswin I - Moon 1 - Freedom Extension Storage"
  ],
  [
    60006031,
    10000042,
    "Floseswin II - Freedom Extension Storage"
  ],
  [
    60015100,
    10000042,
    "Floseswin IV - Tribal Liberation Force Logistic Support"
  ],
  [
    60006037,
    10000042,
    "Floseswin IX - Moon 13 - Freedom Extension Retail Center"
  ],
  [
    60009088,
    10000042,
    "Floseswin IX - Moon 5 - TransStellar Shipping Storage"
  ],
  [
    60010417,
    10000042,
    "Floseswin VI - Moon 2 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60005113,
    10000042,
    "Floseswin VI - Moon 2 - Republic Security Services Logistic Support"
  ],
  [
    60010414,
    10000042,
    "Floseswin VII - Moon 5 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60005395,
    10000042,
    "Floseswin VIII - Moon 15 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60009097,
    10000042,
    "Floseswin VIII - Moon 2 - TransStellar Shipping Storage"
  ],
  [
    60005398,
    10000042,
    "Floseswin VIII - Moon 7 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60014800,
    10000042,
    "Floseswin VIII - Moon 7 - Republic University"
  ],
  [
    60011431,
    10000032,
    "Fluekele IV - Moon 1 - Pend Insurance Depository"
  ],
  [
    60001261,
    10000032,
    "Fluekele IV - Moon 10 - Wiyrkomi Corporation Factory"
  ],
  [
    60013678,
    10000019,
    "FNS3-F VII - Moon 3 - Jovian Directorate Academy"
  ],
  [
    60013642,
    10000019,
    "FNS3-F VII - Moon 7 - Jove Navy Logistic Support"
  ],
  [
    60013708,
    10000017,
    "FO-3PJ III - Moon 10 - Jovian Directorate Bureau"
  ],
  [
    60013699,
    10000017,
    "FO-3PJ III - Moon 2 - Jovian Directorate Bureau"
  ],
  [
    60013702,
    10000017,
    "FO-3PJ VI - Moon 11 - Jovian Directorate Bureau"
  ],
  [
    60008899,
    10000054,
    "Fobiner VII - Moon 13 - Civic Court Tribunal"
  ],
  [
    60015022,
    10000043,
    "Fora V - Moon 3 - Imperial Academy"
  ],
  [
    60014734,
    10000032,
    "Foves V - Center for Advanced Studies School"
  ],
  [
    60012043,
    10000032,
    "Foves VII - Moon 10 - Federation Customs Assembly Plant"
  ],
  [
    60011716,
    10000032,
    "Foves VII - Moon 13 - Federal Administration Bureau Offices"
  ],
  [
    60012046,
    10000032,
    "Foves VII - Moon 4 - Federation Customs Assembly Plant"
  ],
  [
    60012541,
    10000001,
    "Fovihi V - Ammatar Consulate Bureau"
  ],
  [
    60014461,
    10000001,
    "Fovihi V - Moon 6 - Trust Partners Warehouse"
  ],
  [
    60014893,
    10000031,
    "FR-B1H VII - Moon 1 - Serpentis Corporation Refining"
  ],
  [
    60013672,
    10000019,
    "FR-RCH I - Moon 10 - Jovian Directorate Bureau"
  ],
  [
    60013666,
    10000019,
    "FR-RCH I - Moon 11 - Jovian Directorate Bureau"
  ],
  [
    60013639,
    10000019,
    "FR-RCH IV - Moon 2 - Jove Navy Assembly Plant"
  ],
  [
    60009745,
    10000048,
    "Frarie IX - Combined Harvest Warehouse"
  ],
  [
    60009061,
    10000048,
    "Frarie IX - Moon 12 - TransStellar Shipping Storage"
  ],
  [
    60011002,
    10000048,
    "Frarie IX - Moon 14 - FedMart Storage"
  ],
  [
    60010993,
    10000048,
    "Frarie IX - Moon 17 - FedMart Retail Center"
  ],
  [
    60009751,
    10000048,
    "Frarie VI - Moon 1 - Combined Harvest Warehouse"
  ],
  [
    60009058,
    10000048,
    "Frarie VIII - Moon 2 - TransStellar Shipping Storage"
  ],
  [
    60009055,
    10000048,
    "Frarie VIII - Moon 3 - TransStellar Shipping Storage"
  ],
  [
    60004615,
    10000030,
    "Frarn VI - Moon 18 - Brutor Tribe Bureau"
  ],
  [
    60009697,
    10000037,
    "Frarolle VII - Astral Mining Inc. Mining Outpost"
  ],
  [
    60005839,
    10000037,
    "Frarolle XI - Moon 2 - Freedom Extension Warehouse"
  ],
  [
    60000055,
    10000042,
    "Freatlidur IX - Moon 15 - CBD Corporation Storage"
  ],
  [
    60001363,
    10000042,
    "Freatlidur IX - Moon 19 - Wiyrkomi Corporation Factory"
  ],
  [
    60001354,
    10000042,
    "Freatlidur V - Moon 11 - Wiyrkomi Corporation Factory"
  ],
  [
    60004513,
    10000042,
    "Freatlidur V - Moon 3 - Sebiestor Tribe Bureau"
  ],
  [
    60014125,
    10000042,
    "Freatlidur V - Moon 4 - Thukker Mix Factory"
  ],
  [
    60004507,
    10000042,
    "Freatlidur V - Moon 8 - Sebiestor Tribe Bureau"
  ],
  [
    60014128,
    10000042,
    "Freatlidur VII - Moon 3 - Thukker Mix Factory"
  ],
  [
    60003496,
    10000042,
    "Fredagod IV - Moon 1 - Caldari Business Tribunal Accounting"
  ],
  [
    60003505,
    10000042,
    "Fredagod V - Moon 10 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60005389,
    10000042,
    "Fredagod V - Moon 15 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60004540,
    10000042,
    "Frerstorn I - Krusual Tribe Bureau"
  ],
  [
    60002125,
    10000042,
    "Frerstorn III - Ishukone Corporation Factory"
  ],
  [
    60010522,
    10000042,
    "Frerstorn V - Moon 1 - Impetus Development Studio"
  ],
  [
    60013237,
    10000042,
    "Frerstorn VI - Genolution Biotech Production"
  ],
  [
    60014767,
    10000042,
    "Frerstorn VI - Moon 8 - Republic Military School"
  ],
  [
    60002134,
    10000042,
    "Frerstorn VII - Moon 1 - Ishukone Corporation Factory"
  ],
  [
    60011851,
    10000032,
    "Fricoure VIII - Moon 2 - Federation Navy Assembly Plant"
  ],
  [
    60010924,
    10000032,
    "Fricoure VIII - Moon 3 - Duvolle Laboratories Factory"
  ],
  [
    60002281,
    10000002,
    "Friggi VII - Moon 12 - Lai Dai Corporation Factory"
  ],
  [
    60001882,
    10000002,
    "Friggi VIII - Moon 20 - Nugoeihuvi Corporation Publisher"
  ],
  [
    60002287,
    10000002,
    "Friggi VIII - Moon 22 - Lai Dai Corporation Factory"
  ],
  [
    60005809,
    10000042,
    "Frulegur III - Moon 1 - Freedom Extension Storage"
  ],
  [
    60014830,
    10000042,
    "Frulegur IV - Moon 1 - Pator Tech School"
  ],
  [
    60001033,
    10000042,
    "Frulegur IX - Moon 4 - Kaalakiota Corporation Warehouse"
  ],
  [
    60014116,
    10000042,
    "Frulegur IX - Moon 5 - Thukker Mix Factory"
  ],
  [
    60001042,
    10000042,
    "Frulegur VIII - Moon 4 - Kaalakiota Corporation Warehouse"
  ],
  [
    60001036,
    10000042,
    "Frulegur X - Moon 3 - Kaalakiota Corporation Factory"
  ],
  [
    60000901,
    10000016,
    "Funtanainen II - Caldari Provisions Warehouse"
  ],
  [
    60002908,
    10000016,
    "Funtanainen III - Sukuuvestaa Corporation Factory"
  ],
  [
    60003931,
    10000016,
    "Funtanainen IV - Moon 1 - Caldari Navy Logistic Support"
  ],
  [
    60002896,
    10000016,
    "Funtanainen IV - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60000760,
    10000016,
    "Funtanainen V - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60003919,
    10000016,
    "Funtanainen VIII - Caldari Navy Assembly Plant"
  ],
  [
    60008197,
    10000038,
    "Furskeshin V - Moon 2 - Ministry of Internal Order Logistic Support"
  ],
  [
    60014074,
    10000001,
    "Futzchag II - Thukker Mix Factory"
  ],
  [
    60014071,
    10000001,
    "Futzchag IX - Moon 9 - Thukker Mix Factory"
  ],
  [
    60014182,
    10000022,
    "FV-SE8 VIII - Moon 1 - True Creations Logistic Support"
  ],
  [
    60014947,
    10000060,
    "FWST-8 II - Blood Raiders Logistic Support"
  ],
  [
    60012235,
    10000012,
    "G-0Q86 V - Moon 5 - Archangels Logistic Support"
  ],
  [
    60012898,
    10000012,
    "G-0Q86 VII - Moon 1 - Guardian Angels Assembly Plant"
  ],
  [
    60012745,
    10000012,
    "G-G78S VII - Salvation Angels Chemical Refinery"
  ],
  [
    60012796,
    10000012,
    "G-G78S X - Moon 11 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60013051,
    10000012,
    "G-G78S XI - Moon 3 - Dominations Assembly Plant"
  ],
  [
    60012802,
    10000012,
    "G-G78S XI - Moon 7 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60014236,
    10000022,
    "G-ME2K VIII - Moon 14 - True Creations Testing Facilities"
  ],
  [
    60014302,
    10000022,
    "G-ME2K VIII - Moon 3 - True Power Mining Outpost"
  ],
  [
    60013774,
    10000019,
    "G-N6MC VI - Moon 5 - Jovian Directorate Bureau"
  ],
  [
    60013783,
    10000019,
    "G-N6MC VI - Moon 9 - Jovian Directorate Bureau"
  ],
  [
    60013879,
    10000019,
    "G-N6MC VIII - Moon 9 - Prosper Depository"
  ],
  [
    60014883,
    10000063,
    "G-Q5JU VII - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60014948,
    10000060,
    "G-TT5V VII - Moon 11 - Blood Raiders Testing Facilities"
  ],
  [
    60013813,
    10000017,
    "G1VU-H IX - Moon 18 - Jovian Directorate Bureau"
  ],
  [
    60014017,
    10000017,
    "G1VU-H IX - Moon 18 - Shapeset Shipyard"
  ],
  [
    60014899,
    10000051,
    "G8AD-C XI - Moon 2 - Serpentis Corporation Refining"
  ],
  [
    60001969,
    10000065,
    "Gademam VI - Moon 5 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60005161,
    10000043,
    "Gaha IV - Moon 5 - Republic Security Services Assembly Plant"
  ],
  [
    60005164,
    10000043,
    "Gaha VII - Moon 2 - Republic Security Services Logistic Support"
  ],
  [
    60002080,
    10000020,
    "Gaknem IV - Moon 5 - Ishukone Corporation Factory"
  ],
  [
    60007309,
    10000020,
    "Gaknem V - Joint Harvesting Mineral Reserve"
  ],
  [
    60011302,
    10000020,
    "Gaknem VI - Moon 6 - Aliastra Retail Center"
  ],
  [
    60009364,
    10000032,
    "Gallareue I - Federal Freight Storage"
  ],
  [
    60005488,
    10000067,
    "Galnafsad V - Moon 7 - Core Complexion Inc. Warehouse"
  ],
  [
    60005494,
    10000067,
    "Galnafsad VI - Moon 1 - Core Complexion Inc. Factory"
  ],
  [
    60010429,
    10000067,
    "Galnafsad VI - Moon 18 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60012133,
    10000001,
    "Gamis X - Ammatar Fleet Logistic Support"
  ],
  [
    60015136,
    10000038,
    "Gammel III - 24th Imperial Crusade Logistic Support"
  ],
  [
    60008104,
    10000038,
    "Gammel X - Moon 3 - Ministry of Assessment Bureau Offices"
  ],
  [
    60002155,
    10000048,
    "Gare V - Moon 10 - Ishukone Corporation Factory"
  ],
  [
    60005440,
    10000048,
    "Gare VIII - Core Complexion Inc. Factory"
  ],
  [
    60003586,
    10000048,
    "Gare VIII - Moon 11 - Caldari Business Tribunal"
  ],
  [
    60003580,
    10000048,
    "Gare VIII - Moon 20 - Caldari Business Tribunal"
  ],
  [
    60003589,
    10000048,
    "Gare VIII - Moon 8 - Caldari Business Tribunal"
  ],
  [
    60006895,
    10000052,
    "Garisas VI - Ducia Foundry Refinery"
  ],
  [
    60008266,
    10000067,
    "Gayar IV - Moon 1 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60014164,
    10000022,
    "GDO-7H VI - Moon 1 - True Creations Assembly Plant"
  ],
  [
    60002128,
    10000042,
    "Gebuladi IX - Moon 9 - Ishukone Corporation Factory"
  ],
  [
    60013246,
    10000042,
    "Gebuladi VIII - Moon 2 - Genolution Biotech Production"
  ],
  [
    60013240,
    10000042,
    "Gebuladi X - Moon 3 - Genolution Biotech Production"
  ],
  [
    60006562,
    10000042,
    "Gedugaud IV - Moon 2 - Imperial Armaments Factory"
  ],
  [
    60006565,
    10000042,
    "Gedugaud VI - Moon 8 - Imperial Armaments Factory"
  ],
  [
    60000109,
    10000042,
    "Geffur VII - Moon 3 - CBD Corporation Storage"
  ],
  [
    60012277,
    10000042,
    "Geffur VII - Moon 8 - CONCORD Bureau"
  ],
  [
    60000094,
    10000042,
    "Geffur VIII - Moon 10 - CBD Corporation Storage"
  ],
  [
    60001279,
    10000042,
    "Geffur VIII - Moon 13 - Wiyrkomi Corporation Factory"
  ],
  [
    60013990,
    10000049,
    "Gehi IX - Moon 4 - Royal Khanid Navy Assembly Plant"
  ],
  [
    60000508,
    10000002,
    "Gekutami III - Hyasyoda Corporation Refinery"
  ],
  [
    60000511,
    10000002,
    "Gekutami V - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60000274,
    10000002,
    "Gekutami V - Moon 1 - Prompt Delivery Storage"
  ],
  [
    60003676,
    10000002,
    "Gekutami VI - Moon 2 - Caldari Business Tribunal Law School"
  ],
  [
    60002740,
    10000002,
    "Gekutami VI - Moon 2 - Sukuuvestaa Corporation Foundry"
  ],
  [
    60000652,
    10000002,
    "Gekutami VI - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60000280,
    10000002,
    "Gekutami VII - Moon 3 - Prompt Delivery Storage"
  ],
  [
    60003679,
    10000002,
    "Gekutami VIII - Caldari Business Tribunal Accounting"
  ],
  [
    60004804,
    10000028,
    "Gelfiven III - Moon 1 - Republic Fleet Assembly Plant"
  ],
  [
    60004555,
    10000028,
    "Gelfiven IX - Moon 15 - Vherokior Tribe Bureau"
  ],
  [
    60004801,
    10000028,
    "Gelfiven IX - Moon 17 - Republic Fleet Assembly Plant"
  ],
  [
    60014752,
    10000028,
    "Gelfiven IX - Moon 4 - Native Freshfood School"
  ],
  [
    60004558,
    10000028,
    "Gelfiven IX - Moon 8 - Vherokior Tribe Bureau"
  ],
  [
    60007270,
    10000028,
    "Gelfiven V - Joint Harvesting Food Packaging"
  ],
  [
    60005761,
    10000028,
    "Gelfiven V - Native Freshfood Warehouse"
  ],
  [
    60007267,
    10000028,
    "Gelfiven VI - Moon 1 - Joint Harvesting Food Packaging"
  ],
  [
    60014380,
    10000028,
    "Gelfiven VI - Moon 1 - Trust Partners Trading Post"
  ],
  [
    60005353,
    10000028,
    "Gelfiven X - Moon 4 - Minmatar Mining Corporation Refinery"
  ],
  [
    60012142,
    10000001,
    "Gelhan IX - Moon 6 - Ammatar Fleet Assembly Plant"
  ],
  [
    60013009,
    10000001,
    "Gelhan V - Moon 1 - DED Assembly Plant"
  ],
  [
    60013006,
    10000001,
    "Gelhan V - Moon 10 - DED Logistic Support"
  ],
  [
    60006601,
    10000020,
    "Gemodi VI - Viziam Factory"
  ],
  [
    60006112,
    10000054,
    "Gens V - Moon 2 - Amarr Constructions Production Plant"
  ],
  [
    60006253,
    10000052,
    "Gensela IX - Carthum Conglomerate Warehouse"
  ],
  [
    60005098,
    10000052,
    "Gensela VIII - Moon 3 - Republic Security Services Assembly Plant"
  ],
  [
    60008512,
    10000052,
    "Gensela X - Emperor Family Bureau"
  ],
  [
    60006247,
    10000052,
    "Gensela XI - Moon 2 - Carthum Conglomerate Factory"
  ],
  [
    60003244,
    10000002,
    "Geras IV - Moon 1 - Modern Finances Depository"
  ],
  [
    60000292,
    10000002,
    "Geras IX - Moon 7 - Prompt Delivery Storage"
  ],
  [
    60014773,
    10000030,
    "Gerbold III - Moon 14 - Republic Military School"
  ],
  [
    60010702,
    10000030,
    "Gerbold III - Moon 2 - The Scope Development Studio"
  ],
  [
    60001108,
    10000030,
    "Gerek IV - Moon 8 - Kaalakiota Corporation Factory"
  ],
  [
    60010537,
    10000030,
    "Gerek V - Moon 14 - Impetus Development Studio"
  ],
  [
    60014791,
    10000030,
    "Gerek V - Moon 3 - Republic University"
  ],
  [
    60006046,
    10000030,
    "Gerek VI - Moon 16 - The Leisure Group Development Studio"
  ],
  [
    60006901,
    10000044,
    "Gererique II - Moon 1 - Ducia Foundry Mining Outpost"
  ],
  [
    60009319,
    10000044,
    "Gererique II - Moon 1 - Federal Freight Storage"
  ],
  [
    60009322,
    10000044,
    "Gererique III - Moon 1 - Federal Freight Storage"
  ],
  [
    60009316,
    10000044,
    "Gererique IV - Moon 1 - Federal Freight Storage"
  ],
  [
    60011071,
    10000044,
    "Gererique IV - Moon 4 - FedMart Storage"
  ],
  [
    60011767,
    10000044,
    "Gererique VI - Moon 3 - Federation Navy Testing Facilities"
  ],
  [
    60001330,
    10000067,
    "Gergish IX - Moon 10 - Wiyrkomi Corporation Factory"
  ],
  [
    60007720,
    10000067,
    "Gergish X - Moon 3 - Royal Amarr Institute School"
  ],
  [
    60011104,
    10000037,
    "Gerper V - Moon 10 - FedMart Warehouse"
  ],
  [
    60011098,
    10000037,
    "Gerper V - Moon 14 - FedMart Warehouse"
  ],
  [
    60011095,
    10000037,
    "Gerper VI - Moon 12 - FedMart Warehouse"
  ],
  [
    60011110,
    10000037,
    "Gerper VI - Moon 2 - FedMart Storage"
  ],
  [
    60012052,
    10000037,
    "Gerper VI - Moon 7 - Federation Customs Testing Facilities"
  ],
  [
    60001126,
    10000054,
    "Getrenjesa IX - Moon 1 - Kaalakiota Corporation Factory"
  ],
  [
    60010273,
    10000054,
    "Ghekon II - Moon 2 - CreoDron Factory"
  ],
  [
    60008851,
    10000054,
    "Ghekon IV - Moon 20 - Civic Court Accounting"
  ],
  [
    60008485,
    10000054,
    "Ghekon IV - Moon 8 - Amarr Navy Assembly Plant"
  ],
  [
    60008479,
    10000054,
    "Ghekon V - Moon 11 - Amarr Navy Logistic Support"
  ],
  [
    60010267,
    10000054,
    "Ghekon V - Moon 5 - CreoDron Factory"
  ],
  [
    60006979,
    10000052,
    "Ghesis II - Inherent Implants Biotech Production"
  ],
  [
    60007966,
    10000052,
    "Ghesis IV - Moon 17 - Ministry of War Information Center"
  ],
  [
    60006982,
    10000052,
    "Ghesis IV - Moon 4 - Inherent Implants Biotech Production"
  ],
  [
    60010234,
    10000052,
    "Ghesis V - Moon 13 - CreoDron Factory"
  ],
  [
    60010228,
    10000052,
    "Ghesis V - Moon 2 - CreoDron Factory"
  ],
  [
    60014581,
    10000052,
    "Ghesis V - Moon 2 - X-Sense Chemical Refinery"
  ],
  [
    60014584,
    10000052,
    "Ghesis V - Moon 22 - X-Sense Chemical Refinery"
  ],
  [
    60010237,
    10000052,
    "Ghesis V - Moon 3 - CreoDron Factory"
  ],
  [
    60008623,
    10000052,
    "Ghesis V - Moon 3 - Kador Family Bureau"
  ],
  [
    60010231,
    10000052,
    "Ghesis V - Moon 9 - CreoDron Factory"
  ],
  [
    60014587,
    10000052,
    "Ghesis V - Moon 9 - X-Sense Chemical Refinery"
  ],
  [
    60007054,
    10000036,
    "Gheth IX - Moon 2 - Imperial Shipment Storage"
  ],
  [
    60008302,
    10000036,
    "Gheth VI - Amarr Trade Registry Archives"
  ],
  [
    60008986,
    10000036,
    "Gheth VII - Moon 12 - Theology Council Law School"
  ],
  [
    60007048,
    10000036,
    "Gheth VIII - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60008215,
    10000036,
    "Gheth VIII - Moon 8 - Ministry of Internal Order Logistic Support"
  ],
  [
    60005824,
    10000037,
    "Gicodel VII - Freedom Extension Storage"
  ],
  [
    60012652,
    10000037,
    "Gicodel VII - Moon 14 - Sisters of EVE Bureau"
  ],
  [
    60007759,
    10000043,
    "Gid V - Moon 4 - Imperial Chancellor Bureau Offices"
  ],
  [
    60010651,
    10000068,
    "Gisleres IV - Moon 2 - The Scope Development Studio"
  ],
  [
    60010336,
    10000068,
    "Gisleres IV - Moon 6 - Roden Shipyards Warehouse"
  ],
  [
    60010648,
    10000068,
    "Gisleres V - Moon 7 - The Scope Development Studio"
  ],
  [
    60010840,
    10000068,
    "Gisleres V - Moon 8 - Chemal Tech Factory"
  ],
  [
    60012499,
    10000032,
    "Goinard III - Moon 2 - CONCORD Bureau"
  ],
  [
    60012490,
    10000032,
    "Goinard IV - Moon 2 - CONCORD Bureau"
  ],
  [
    60013300,
    10000032,
    "Goinard IV - Moon 5 - Impro Factory"
  ],
  [
    60008629,
    10000052,
    "Gonan I - Moon 1 - Kador Family Bureau"
  ],
  [
    60008626,
    10000052,
    "Gonan VI - Moon 12 - Kador Family Bureau"
  ],
  [
    60005500,
    10000067,
    "Gonditsa IV - Moon 7 - Core Complexion Inc. Storage"
  ],
  [
    60011257,
    10000067,
    "Gonditsa IV - Moon 8 - Aliastra Retail Center"
  ],
  [
    60006964,
    10000020,
    "Goni IV - Moon 14 - Inherent Implants Biotech Production"
  ],
  [
    60009079,
    10000020,
    "Goni VI - TransStellar Shipping Storage"
  ],
  [
    60010495,
    10000020,
    "Goram III - Moon 2 - Impetus Development Studio"
  ],
  [
    60001066,
    10000020,
    "Goram V - Moon 3 - Kaalakiota Corporation Factory"
  ],
  [
    60013039,
    10000020,
    "Goram VII - Moon 4 - DED Assembly Plant"
  ],
  [
    60001075,
    10000020,
    "Goram VIII - Moon 4 - Kaalakiota Corporation Factory"
  ],
  [
    60005533,
    10000043,
    "Gosalav IV - Core Complexion Inc. Storage"
  ],
  [
    60005530,
    10000043,
    "Gosalav IV - Moon 1 - Core Complexion Inc. Factory"
  ],
  [
    60009871,
    10000043,
    "Gosalav VI - Moon 1 - Quafe Company Factory"
  ],
  [
    60008665,
    10000043,
    "Gosalav VI - Sarum Family Logistic Support"
  ],
  [
    60009874,
    10000043,
    "Gosalav VII - Moon 1 - Quafe Company Factory"
  ],
  [
    60013948,
    10000049,
    "Goudiyah VIII - Moon 1 - Royal Khanid Navy Logistic Support"
  ],
  [
    60014902,
    10000059,
    "GQ2S-8 III - Moon 3 - Serpentis Corporation Refining"
  ],
  [
    60011923,
    10000032,
    "Grinacanne I - Federal Intelligence Office Assembly Plant"
  ],
  [
    60012088,
    10000048,
    "Grispire I - Federation Customs Logistic Support"
  ],
  [
    60013213,
    10000048,
    "Grispire IV - Moon 14 - Genolution Biotech Production"
  ],
  [
    60010897,
    10000048,
    "Grispire V - Duvolle Laboratories Factory"
  ],
  [
    60013219,
    10000048,
    "Grispire V - Moon 15 - Genolution Biotech Production"
  ],
  [
    60009847,
    10000048,
    "Grispire VI - Moon 3 - Combined Harvest Food Packaging"
  ],
  [
    60013432,
    10000041,
    "GRNJ-3 III - Intaki Space Police Testing Facilities"
  ],
  [
    60010588,
    10000037,
    "Groothese X - Moon 10 - Egonics Inc. Development Studio"
  ],
  [
    60001372,
    10000037,
    "Groothese X - Moon 11 - Wiyrkomi Corporation Factory"
  ],
  [
    60012373,
    10000037,
    "Groothese X - Moon 13 - CONCORD Bureau"
  ],
  [
    60001366,
    10000037,
    "Groothese X - Moon 18 - Wiyrkomi Corporation Factory"
  ],
  [
    60009781,
    10000037,
    "Groothese X - Moon 2 - Combined Harvest Warehouse"
  ],
  [
    60009778,
    10000037,
    "Groothese X - Moon 6 - Combined Harvest Warehouse"
  ],
  [
    60014554,
    10000037,
    "Groothese XI - Moon 11 - X-Sense Chemical Storage"
  ],
  [
    60014203,
    10000022,
    "GU-54G VIII - Moon 1 - True Creations Shipyard"
  ],
  [
    60014209,
    10000022,
    "GU-54G VIII - Moon 5 - True Creations Assembly Plant"
  ],
  [
    60005284,
    10000042,
    "Gukarla IV - Moon 1 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60015101,
    10000042,
    "Gukarla V - Tribal Liberation Force Logistic Support"
  ],
  [
    60004978,
    10000042,
    "Gukarla VI - Republic Justice Department Accounting"
  ],
  [
    60004972,
    10000042,
    "Gukarla VII - Moon 13 - Republic Justice Department Law School"
  ],
  [
    60005281,
    10000042,
    "Gukarla VII - Moon 3 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60005350,
    10000028,
    "Gulfonodi V - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60007264,
    10000028,
    "Gulfonodi VIII - Moon 15 - Joint Harvesting Food Packaging"
  ],
  [
    60005344,
    10000028,
    "Gulfonodi VIII - Moon 15 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60007261,
    10000028,
    "Gulfonodi VIII - Moon 5 - Joint Harvesting Warehouse"
  ],
  [
    60005356,
    10000028,
    "Gulfonodi VIII - Moon 6 - Minmatar Mining Corporation Refinery"
  ],
  [
    60005764,
    10000028,
    "Gulfonodi VIII - Moon 6 - Native Freshfood Plantation"
  ],
  [
    60005767,
    10000028,
    "Gulfonodi X - Moon 13 - Native Freshfood Plantation"
  ],
  [
    60004807,
    10000028,
    "Gulfonodi X - Moon 13 - Republic Fleet Logistic Support"
  ],
  [
    60004810,
    10000028,
    "Gulfonodi X - Moon 15 - Republic Fleet Testing Facilities"
  ],
  [
    60005341,
    10000028,
    "Gulfonodi X - Moon 18 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60007276,
    10000028,
    "Gulfonodi X - Moon 5 - Joint Harvesting Refinery"
  ],
  [
    60000151,
    10000030,
    "Gulmorogod VI - Moon 4 - CBD Corporation Storage"
  ],
  [
    60010411,
    10000030,
    "Gulmorogod VII - Moon 16 - Poteque Pharmaceuticals Biotech Research Center"
  ],
  [
    60005077,
    10000030,
    "Gulmorogod VIII - Moon 15 - Republic Security Services Testing Facilities"
  ],
  [
    60000157,
    10000030,
    "Gulmorogod VIII - Moon 25 - CBD Corporation Storage"
  ],
  [
    60004966,
    10000030,
    "Gultratren III - Moon 12 - Republic Justice Department Tribunal"
  ],
  [
    60014386,
    10000030,
    "Gultratren III - Moon 2 - Trust Partners Trading Post"
  ],
  [
    60010177,
    10000030,
    "Gultratren V - Moon 22 - CreoDron Factory"
  ],
  [
    60014797,
    10000030,
    "Gultratren V - Moon 4 - Republic University"
  ],
  [
    60004960,
    10000030,
    "Gusandall IV - Republic Justice Department Tribunal"
  ],
  [
    60003625,
    10000020,
    "Gyerzen IV - Moon 1 - Caldari Business Tribunal Law School"
  ],
  [
    60008416,
    10000020,
    "Gyerzen IX - Moon 15 - Amarr Navy Testing Facilities"
  ],
  [
    60008425,
    10000020,
    "Gyerzen X - Moon 8 - Amarr Navy Testing Facilities"
  ],
  [
    60014398,
    10000030,
    "Gyng IV - Trust Partners Trading Post"
  ],
  [
    60012868,
    10000012,
    "H-ADOC IV - Moon 1 - Guardian Angels Assembly Plant"
  ],
  [
    60012187,
    10000012,
    "H-ADOC IV - Moon 12 - Archangels Logistic Support"
  ],
  [
    60012742,
    10000012,
    "H-ADOC VII - Moon 12 - Salvation Angels Warehouse"
  ],
  [
    60014002,
    10000017,
    "H-EDXD VIII - Moon 1 - Shapeset Shipyard"
  ],
  [
    60013621,
    10000017,
    "H-EDXD VIII - Moon 3 - Jove Navy Assembly Plant"
  ],
  [
    60012571,
    10000015,
    "H-PA29 IV - Moon 2 - Guristas Assembly Plant"
  ],
  [
    60012568,
    10000015,
    "H-PA29 V - Moon 1 - Guristas Assembly Plant"
  ],
  [
    60014913,
    10000010,
    "H-W9TY XII - Moon 2 - Serpentis Corporation Cloning"
  ],
  [
    60014875,
    10000050,
    "H74-B0 III - Moon 4 - Serpentis Corporation Manufacturing"
  ],
  [
    60013717,
    10000017,
    "H7OL-I III - Moon 3 - Jovian Directorate Bureau"
  ],
  [
    60013723,
    10000017,
    "H7OL-I IV - Moon 10 - Jovian Directorate Bureau"
  ],
  [
    60013597,
    10000017,
    "H7OL-I IV - Moon 6 - Jove Navy Assembly Plant"
  ],
  [
    60014925,
    10000059,
    "H8-ZTO VI - Moon 5 - Serpentis Corporation Cloning"
  ],
  [
    60004342,
    10000016,
    "Haajinen X - Corporate Police Force Logistic Support"
  ],
  [
    60002317,
    10000016,
    "Haajinen XI - Lai Dai Corporation Factory"
  ],
  [
    60004207,
    10000016,
    "Haajinen XI - Moon 7 - Spacelane Patrol Assembly Plant"
  ],
  [
    60002323,
    10000016,
    "Haajinen XI - Moon 9 - Lai Dai Corporation Warehouse"
  ],
  [
    60000943,
    10000016,
    "Haajinen XII - Moon 19 - Caldari Provisions Food Packaging"
  ],
  [
    60004039,
    10000016,
    "Haajinen XII - Moon 20 - Home Guard Logistic Support"
  ],
  [
    60003982,
    10000016,
    "Haajinen XII - Moon 8 - Ishukone Watch Logistic Support"
  ],
  [
    60000940,
    10000016,
    "Haajinen XII - Moon 9 - Caldari Provisions Food Packaging"
  ],
  [
    60002413,
    10000033,
    "Haatomo III - Moon 1 - Propel Dynamics Factory"
  ],
  [
    60000856,
    10000033,
    "Haatomo VI - Moon 1 - Caldari Provisions Warehouse"
  ],
  [
    60005563,
    10000033,
    "Haatomo VI - Moon 12 - Core Complexion Inc. Factory"
  ],
  [
    60000622,
    10000033,
    "Haatomo VI - Moon 16 - Deep Core Mining Inc. Refinery"
  ],
  [
    60002836,
    10000033,
    "Haatomo VI - Moon 2 - Sukuuvestaa Corporation Factory"
  ],
  [
    60003805,
    10000033,
    "Haatomo VI - Moon 3 - Caldari Navy Assembly Plant"
  ],
  [
    60005566,
    10000033,
    "Haatomo VI - Moon 5 - Core Complexion Inc. Factory"
  ],
  [
    60001792,
    10000033,
    "Haatomo VI - Moon 6 - Zainou Biotech Production"
  ],
  [
    60003031,
    10000033,
    "Haatomo VII - Moon 3 - Caldari Constructions Warehouse"
  ],
  [
    60001453,
    10000033,
    "Haatomo VII - Moon 6 - Rapid Assembly Factory"
  ],
  [
    60001789,
    10000033,
    "Haatomo VII - Moon 7 - Zainou Biotech Production"
  ],
  [
    60006700,
    10000067,
    "Habu IV - Zoar and Sons Factory"
  ],
  [
    60011482,
    10000067,
    "Habu V - Moon 12 - Pend Insurance Depository"
  ],
  [
    60006706,
    10000067,
    "Habu V - Moon 13 - Zoar and Sons Factory"
  ],
  [
    60011479,
    10000067,
    "Habu V - Moon 2 - Pend Insurance Depository"
  ],
  [
    60006709,
    10000067,
    "Habu V - Moon 2 - Zoar and Sons Factory"
  ],
  [
    60010009,
    10000067,
    "Habu V - Quafe Company Retail Center"
  ],
  [
    60009994,
    10000067,
    "Habu VIII - Moon 1 - Quafe Company Factory"
  ],
  [
    60015037,
    10000030,
    "Hadaugago II - Moon 1 - Republic Military School"
  ],
  [
    60006313,
    10000043,
    "Hadonoo III - Moon 9 - Carthum Conglomerate Research Center"
  ],
  [
    60015099,
    10000042,
    "Hadozeko II - Tribal Liberation Force Logistic Support"
  ],
  [
    60004900,
    10000042,
    "Hadozeko IV - Moon 1 - Republic Fleet Assembly Plant"
  ],
  [
    60005704,
    10000042,
    "Hadozeko IX - Moon 11 - Boundless Creation Factory"
  ],
  [
    60004897,
    10000042,
    "Hadozeko VIII - Moon 5 - Republic Fleet Assembly Plant"
  ],
  [
    60001723,
    10000016,
    "Hageken IV - Caldari Steel Factory"
  ],
  [
    60003922,
    10000016,
    "Hageken V - Moon 2 - Caldari Navy Assembly Plant"
  ],
  [
    60001726,
    10000016,
    "Hageken VII - Moon 5 - Caldari Steel Factory"
  ],
  [
    60002899,
    10000016,
    "Hageken VII - Moon 6 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60003091,
    10000016,
    "Hageken VIII - Moon 5 - Expert Housing Warehouse"
  ],
  [
    60007678,
    10000016,
    "Hageken X - Moon 15 - Nurtura Food Packaging"
  ],
  [
    60000898,
    10000016,
    "Hageken X - Moon 20 - Caldari Provisions Warehouse"
  ],
  [
    60000838,
    10000016,
    "Hageken X - Moon 9 - Minedrill Mineral Reserve"
  ],
  [
    60007669,
    10000016,
    "Hageken XI - Moon 2 - Nurtura Warehouse"
  ],
  [
    60005248,
    10000042,
    "Hagilur I - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60005233,
    10000042,
    "Hagilur IV - Moon 2 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60005683,
    10000042,
    "Hagilur IV - Moon 3 - Boundless Creation Factory"
  ],
  [
    60005782,
    10000042,
    "Hagilur V - Moon 7 - Freedom Extension Warehouse"
  ],
  [
    60005689,
    10000042,
    "Hagilur V - Moon 8 - Boundless Creation Factory"
  ],
  [
    60007114,
    10000043,
    "Hahda IX - Imperial Shipment Storage"
  ],
  [
    60006328,
    10000043,
    "Hahda VII - Moon 1 - Carthum Conglomerate Factory"
  ],
  [
    60000145,
    10000054,
    "Haimeh II - CBD Corporation Storage"
  ],
  [
    60008152,
    10000054,
    "Haimeh IX - Moon 11 - Ministry of Internal Order Logistic Support"
  ],
  [
    60012382,
    10000054,
    "Haimeh IX - Moon 16 - CONCORD Bureau"
  ],
  [
    60000139,
    10000054,
    "Haimeh IX - Moon 4 - CBD Corporation Storage"
  ],
  [
    60008161,
    10000054,
    "Haimeh IX - Moon 8 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60001387,
    10000054,
    "Haimeh VII - Wiyrkomi Corporation Factory"
  ],
  [
    60011941,
    10000064,
    "Haine III - Moon 2 - Federal Intelligence Office Logistic Support"
  ],
  [
    60002221,
    10000064,
    "Haine V - Moon 11 - Ishukone Corporation Factory"
  ],
  [
    60011944,
    10000064,
    "Haine VI - Moon 6 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60009229,
    10000042,
    "Hakeri III - TransStellar Shipping Storage"
  ],
  [
    60004951,
    10000042,
    "Hakeri VI - Republic Justice Department Tribunal"
  ],
  [
    60004498,
    10000042,
    "Hakeri VII - Moon 1 - Sebiestor Tribe Bureau"
  ],
  [
    60004501,
    10000042,
    "Hakeri XI - Moon 14 - Sebiestor Tribe Bureau"
  ],
  [
    60010147,
    10000042,
    "Hakeri XI - Moon 5 - CreoDron Factory"
  ],
  [
    60004690,
    10000042,
    "Hakisalki IX - Moon 14 - Republic Parliament Bureau"
  ],
  [
    60001996,
    10000042,
    "Hakisalki VIII - Moon 1 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001999,
    10000042,
    "Hakisalki VIII - Moon 14 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60004849,
    10000042,
    "Hakisalki VIII - Moon 23 - Republic Fleet Logistic Support"
  ],
  [
    60004684,
    10000042,
    "Hakisalki X - Republic Parliament Academy"
  ],
  [
    60003610,
    10000016,
    "Hakonen IX - Moon 10 - Caldari Business Tribunal Information Center"
  ],
  [
    60000820,
    10000016,
    "Hakonen IX - Moon 16 - Minedrill Refinery"
  ],
  [
    60003808,
    10000016,
    "Hakonen IX - Moon 9 - Caldari Navy Assembly Plant"
  ],
  [
    60002161,
    10000016,
    "Hakonen VII - Moon 7 - Ishukone Corporation Factory"
  ],
  [
    60003643,
    10000036,
    "Hakshma VIII - Moon 13 - Caldari Business Tribunal"
  ],
  [
    60000880,
    10000033,
    "Halaima VII - Moon 6 - Caldari Provisions Warehouse"
  ],
  [
    60003418,
    10000033,
    "Halaima VIII - Moon 17 - Mercantile Club Bureau"
  ],
  [
    60009187,
    10000036,
    "Halenan III - TransStellar Shipping Storage"
  ],
  [
    60007204,
    10000036,
    "Halenan IX - Moon 1 - Amarr Certified News Development Studio"
  ],
  [
    60007873,
    10000036,
    "Halenan V - Moon 1 - Amarr Civil Service Bureau Offices"
  ],
  [
    60007870,
    10000036,
    "Halenan VIII - Moon 6 - Amarr Civil Service Bureau Offices"
  ],
  [
    60009181,
    10000036,
    "Halenan VIII - Moon 6 - TransStellar Shipping Storage"
  ],
  [
    60012454,
    10000028,
    "Half VII - Moon 1 - CONCORD Bureau"
  ],
  [
    60012469,
    10000028,
    "Half VII - Moon 4 - CONCORD Assembly Plant"
  ],
  [
    60014824,
    10000028,
    "Half VIII - Moon 1 - Pator Tech School"
  ],
  [
    60004786,
    10000028,
    "Half X - Moon 10 - Republic Fleet Assembly Plant"
  ],
  [
    60006211,
    10000052,
    "Halibai IV - Moon 1 - Amarr Constructions Production Plant"
  ],
  [
    60006823,
    10000052,
    "Halibai IV - Moon 2 - Ducia Foundry Mining Outpost"
  ],
  [
    60008014,
    10000052,
    "Halibai IV - Moon 3 - Ministry of Assessment Archives"
  ],
  [
    60015125,
    10000069,
    "Hallanen IV - Caldari Navy Assembly Plant"
  ],
  [
    60003652,
    10000037,
    "Halle II - Caldari Business Tribunal"
  ],
  [
    60011626,
    10000037,
    "Halle VII - Federal Administration Bureau Offices"
  ],
  [
    60010309,
    10000037,
    "Halle VII - Moon 1 - Roden Shipyards Factory"
  ],
  [
    60011998,
    10000037,
    "Halle VII - Moon 6 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60014485,
    10000037,
    "Halle X - Moon 4 - X-Sense Chemical Refinery"
  ],
  [
    60007027,
    10000036,
    "Halmah II - Moon 12 - Imperial Shipment Storage"
  ],
  [
    60015055,
    10000036,
    "Halmah IV - 24th Imperial Crusade Assembly Plant"
  ],
  [
    60000514,
    10000002,
    "Hampinen V - Moon 1 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60000646,
    10000002,
    "Hampinen V - Poksu Mineral Group Mining Outpost"
  ],
  [
    60000655,
    10000002,
    "Hampinen VII - Moon 11 - Poksu Mineral Group Refinery"
  ],
  [
    60003670,
    10000002,
    "Hampinen VII - Moon 13 - Caldari Business Tribunal Accounting"
  ],
  [
    60003673,
    10000002,
    "Hampinen VII - Moon 16 - Caldari Business Tribunal"
  ],
  [
    60006421,
    10000043,
    "Hamse IX - Moon 13 - Imperial Armaments Factory"
  ],
  [
    60015023,
    10000043,
    "Hanan VI - Imperial Academy"
  ],
  [
    60005383,
    10000042,
    "Hardbako III - Moon 1 - Minmatar Mining Corporation Refinery"
  ],
  [
    60014698,
    10000037,
    "Harerget II - Moon 1 - Federal Navy Academy"
  ],
  [
    60010252,
    10000037,
    "Harerget V - Moon 1 - CreoDron Factory"
  ],
  [
    60011101,
    10000037,
    "Harerget VIII - FedMart Warehouse"
  ],
  [
    60010258,
    10000037,
    "Harerget VIII - Moon 1 - CreoDron Factory"
  ],
  [
    60010966,
    10000048,
    "Harroule VIII - Moon 5 - FedMart Storage"
  ],
  [
    60006484,
    10000001,
    "Hasateem V - Moon 11 - Imperial Armaments Factory"
  ],
  [
    60014065,
    10000001,
    "Hasateem VI - Moon 12 - Thukker Mix Factory"
  ],
  [
    60006493,
    10000001,
    "Hasateem VI - Moon 8 - Imperial Armaments Factory"
  ],
  [
    60006487,
    10000001,
    "Hasateem VII - Moon 2 - Imperial Armaments Factory"
  ],
  [
    60007648,
    10000001,
    "Hasateem VII - Moon 3 - Nurtura Food Packaging"
  ],
  [
    60012544,
    10000001,
    "Hasiari VIII - Moon 4 - Ammatar Consulate Bureau"
  ],
  [
    60000850,
    10000033,
    "Hasmijaala VIII - Moon 4 - Minedrill Mineral Reserve"
  ],
  [
    60000703,
    10000033,
    "Hasmijaala X - Moon 1 - Poksu Mineral Group Refinery"
  ],
  [
    60003100,
    10000033,
    "Hasmijaala X - Moon 3 - Expert Housing Production Plant"
  ],
  [
    60003205,
    10000033,
    "Hatakani I - Moon 1 - State and Region Bank Depository"
  ],
  [
    60012517,
    10000033,
    "Hatakani VI - CONCORD Bureau"
  ],
  [
    60012508,
    10000033,
    "Hatakani VI - Moon 10 - CONCORD Bureau"
  ],
  [
    60002719,
    10000033,
    "Hatakani VI - Moon 13 - CBD Sell Division Retail Center"
  ],
  [
    60000541,
    10000033,
    "Hatakani VI - Moon 4 - Hyasyoda Corporation Refinery"
  ],
  [
    60000538,
    10000033,
    "Hatakani VI - Moon 5 - Hyasyoda Corporation Refinery"
  ],
  [
    60003166,
    10000033,
    "Hatakani VII - Moon 1 - Caldari Funds Unlimited Depository"
  ],
  [
    60002869,
    10000033,
    "Hatakani VII - Moon 18 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60001492,
    10000033,
    "Hatakani VII - Moon 20 - Rapid Assembly Factory"
  ],
  [
    60003202,
    10000033,
    "Hatakani VII - Moon 20 - State and Region Bank Depository"
  ],
  [
    60002716,
    10000033,
    "Hatakani VII - Moon 5 - CBD Sell Division Retail Center"
  ],
  [
    60000412,
    10000033,
    "Hatakani VIII - Moon 11 - Ytiri Storage"
  ],
  [
    60000409,
    10000033,
    "Hatakani VIII - Moon 17 - Ytiri Storage"
  ],
  [
    60006613,
    10000020,
    "Hath IV - Moon 6 - Viziam Warehouse"
  ],
  [
    60006775,
    10000036,
    "Hati V - Moon 1 - Ducia Foundry Mineral Reserve"
  ],
  [
    60000070,
    10000038,
    "Hatori IX - Moon 8 - CBD Corporation Storage"
  ],
  [
    60000064,
    10000038,
    "Hatori X - Moon 10 - CBD Corporation Storage"
  ],
  [
    60000058,
    10000038,
    "Hatori X - Moon 12 - CBD Corporation Storage"
  ],
  [
    60006991,
    10000043,
    "Hayumtom XII - Moon 1 - Inherent Implants Biotech Research Center"
  ],
  [
    60014854,
    10000017,
    "HD3-JK I - Academy of Aggressive Behaviour"
  ],
  [
    60015030,
    10000064,
    "Hecarrin VI - Moon 3 - Federal Navy Academy"
  ],
  [
    60004789,
    10000028,
    "Hedaleolfarber II - Moon 1 - Republic Fleet Testing Facilities"
  ],
  [
    60004783,
    10000028,
    "Hedaleolfarber IX - Moon 23 - Republic Fleet Testing Facilities"
  ],
  [
    60014392,
    10000028,
    "Hedaleolfarber VI - Moon 5 - Trust Partners Warehouse"
  ],
  [
    60012463,
    10000028,
    "Hedaleolfarber VII - Moon 17 - CONCORD Treasury"
  ],
  [
    60008488,
    10000043,
    "Hedion V - Moon 9 - Court Chamberlain Bureau"
  ],
  [
    60004873,
    10000028,
    "Hegfunden IV - Moon 1 - Republic Fleet Assembly Plant"
  ],
  [
    60010186,
    10000028,
    "Hegfunden VIII - Moon 14 - CreoDron Factory"
  ],
  [
    60010189,
    10000028,
    "Hegfunden VIII - Moon 26 - CreoDron Factory"
  ],
  [
    60004915,
    10000028,
    "Heild II - Republic Fleet Logistic Support"
  ],
  [
    60003718,
    10000028,
    "Heild V - Moon 5 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60003715,
    10000028,
    "Heild V - Moon 7 - Caldari Business Tribunal Accounting"
  ],
  [
    60004582,
    10000028,
    "Heild VI - Vherokior Tribe Bureau"
  ],
  [
    60004912,
    10000028,
    "Heild VII - Moon 12 - Republic Fleet Assembly Plant"
  ],
  [
    60004921,
    10000028,
    "Heild VII - Moon 21 - Republic Fleet Assembly Plant"
  ],
  [
    60014815,
    10000028,
    "Heild X - Moon 1 - Pator Tech School"
  ],
  [
    60005236,
    10000042,
    "Hek II - Moon 1 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60004516,
    10000042,
    "Hek IV - Krusual Tribe Bureau"
  ],
  [
    60015140,
    10000042,
    "Hek VII - Tribal Liberation Force Logistic Support"
  ],
  [
    60005686,
    10000042,
    "Hek VIII - Moon 12 - Boundless Creation Factory"
  ],
  [
    60011287,
    10000042,
    "Hek VIII - Moon 17 - Aliastra Retail Center"
  ],
  [
    60005716,
    10000042,
    "Helgatild IX - Moon 14 - Boundless Creation Factory"
  ],
  [
    60004855,
    10000042,
    "Helgatild VII - Moon 10 - Republic Fleet Assembly Plant"
  ],
  [
    60009622,
    10000044,
    "Heluene IV - Moon 1 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60010360,
    10000044,
    "Heluene IV - Roden Shipyards Factory"
  ],
  [
    60009628,
    10000044,
    "Heluene V - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60010357,
    10000044,
    "Heluene V - Roden Shipyards Factory"
  ],
  [
    60009637,
    10000044,
    "Heluene X - Astral Mining Inc. Refinery"
  ],
  [
    60009541,
    10000044,
    "Heluene X - Material Acquisition Refinery"
  ],
  [
    60012241,
    10000012,
    "Hemin VII - Moon 12 - Archangels Logistic Support"
  ],
  [
    60012907,
    10000012,
    "Hemin VII - Moon 15 - Guardian Angels Logistic Support"
  ],
  [
    60015031,
    10000064,
    "Henebene V - Federal Navy Academy"
  ],
  [
    60002236,
    10000002,
    "Hentogaira I - Moon 10 - Ishukone Corporation Warehouse"
  ],
  [
    60004474,
    10000002,
    "Hentogaira I - Moon 11 - Science and Trade Institute School"
  ],
  [
    60000784,
    10000002,
    "Hentogaira I - Moon 13 - Minedrill Mineral Reserve"
  ],
  [
    60001591,
    10000002,
    "Hentogaira I - Moon 16 - Perkone Factory"
  ],
  [
    60007591,
    10000002,
    "Hentogaira I - Moon 7 - Nurtura Warehouse"
  ],
  [
    60007588,
    10000002,
    "Hentogaira II - Moon 10 - Nurtura Food Packaging"
  ],
  [
    60000790,
    10000002,
    "Hentogaira II - Moon 6 - Minedrill Refinery"
  ],
  [
    60001594,
    10000002,
    "Hentogaira II - Perkone Factory"
  ],
  [
    60000301,
    10000002,
    "Hentogaira III - Moon 6 - Prompt Delivery Storage"
  ],
  [
    60000304,
    10000002,
    "Hentogaira IV - Prompt Delivery Storage"
  ],
  [
    60008359,
    10000067,
    "Heorah V - Moon 7 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60010687,
    10000067,
    "Heorah VI - Moon 14 - The Scope Publisher"
  ],
  [
    60010684,
    10000067,
    "Heorah VI - Moon 17 - The Scope Development Studio"
  ],
  [
    60001063,
    10000067,
    "Heorah VII - Kaalakiota Corporation Factory"
  ],
  [
    60001060,
    10000067,
    "Heorah VII - Moon 2 - Kaalakiota Corporation Factory"
  ],
  [
    60003691,
    10000043,
    "Herila I - Caldari Business Tribunal"
  ],
  [
    60007126,
    10000043,
    "Herila IV - Moon 5 - Imperial Shipment Storage"
  ],
  [
    60009409,
    10000068,
    "Hevrice V - Federal Freight Storage"
  ],
  [
    60009403,
    10000068,
    "Hevrice VI - Moon 6 - Federal Freight Storage"
  ],
  [
    60010933,
    10000064,
    "Heydieles III - Moon 13 - Duvolle Laboratories Factory"
  ],
  [
    60010939,
    10000064,
    "Heydieles IV - Moon 19 - Duvolle Laboratories Warehouse"
  ],
  [
    60006598,
    10000020,
    "Hibi V - Moon 10 - Viziam Factory"
  ],
  [
    60007087,
    10000020,
    "Hibi V - Moon 4 - Imperial Shipment Storage"
  ],
  [
    60008881,
    10000020,
    "Hibi VI - Moon 5 - Civic Court Tribunal"
  ],
  [
    60008569,
    10000054,
    "Hier IV - Moon 3 - Emperor Family Bureau"
  ],
  [
    60006976,
    10000054,
    "Hier IV - Moon 3 - Inherent Implants Biotech Production"
  ],
  [
    60007717,
    10000054,
    "Hier V - Royal Amarr Institute School"
  ],
  [
    60008572,
    10000054,
    "Hier VII - Emperor Family Bureau"
  ],
  [
    60014641,
    10000052,
    "Hikansog VII - Imperial Academy"
  ],
  [
    60007726,
    10000052,
    "Hikansog VII - Moon 9 - Royal Amarr Institute School"
  ],
  [
    60008815,
    10000052,
    "Hikansog VIII - Moon 12 - Civic Court Tribunal"
  ],
  [
    60008641,
    10000052,
    "Hikansog VIII - Moon 16 - Kador Family Bureau"
  ],
  [
    60007522,
    10000020,
    "Hilaban I - Nurtura Warehouse"
  ],
  [
    60008227,
    10000020,
    "Hilaban II - Moon 1 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60007516,
    10000020,
    "Hilaban II - Moon 12 - Nurtura Warehouse"
  ],
  [
    60012979,
    10000020,
    "Hilaban II - Moon 5 - DED Testing Facilities"
  ],
  [
    60008761,
    10000020,
    "Hilaban II - Moon 7 - Tash-Murkon Family Academy"
  ],
  [
    60006151,
    10000020,
    "Hilaban II - Moon 9 - Amarr Constructions Production Plant"
  ],
  [
    60002482,
    10000020,
    "Hilaban III - Moon 1 - Expert Distribution Warehouse"
  ],
  [
    60006148,
    10000020,
    "Hilaban III - Moon 14 - Amarr Constructions Foundry"
  ],
  [
    60000193,
    10000020,
    "Hilaban III - Moon 3 - CBD Corporation Storage"
  ],
  [
    60001093,
    10000020,
    "Hilaban III - Moon 3 - Kaalakiota Corporation Factory"
  ],
  [
    60006235,
    10000020,
    "Hilaban III - Moon 4 - Carthum Conglomerate Warehouse"
  ],
  [
    60008233,
    10000020,
    "Hilaban III - Moon 7 - Ministry of Internal Order Logistic Support"
  ],
  [
    60002488,
    10000020,
    "Hilaban IV - Moon 19 - Expert Distribution Retail Center"
  ],
  [
    60000190,
    10000020,
    "Hilaban IV - Moon 5 - CBD Corporation Storage"
  ],
  [
    60006157,
    10000020,
    "Hilaban V - Amarr Constructions Production Plant"
  ],
  [
    60008224,
    10000020,
    "Hilaban VI - Ministry of Internal Order Assembly Plant"
  ],
  [
    60000187,
    10000020,
    "Hilaban VI - Moon 1 - CBD Corporation Storage"
  ],
  [
    60000199,
    10000020,
    "Hilaban VIII - Moon 1 - CBD Corporation Storage"
  ],
  [
    60012286,
    10000042,
    "Hilfhurmur VIII - Moon 6 - CONCORD Logistic Support"
  ],
  [
    60001270,
    10000042,
    "Hilfhurmur X - Wiyrkomi Corporation Factory"
  ],
  [
    60009019,
    10000052,
    "Hilmar VII - Moon 17 - Theology Council Tribunal"
  ],
  [
    60011488,
    10000052,
    "Hiremir VIII - Moon 2 - Pend Insurance Vault"
  ],
  [
    60007912,
    10000067,
    "Hirizan VII - Moon 3 - Ministry of War Bureau Offices"
  ],
  [
    60001339,
    10000067,
    "Hirizan VIII - Wiyrkomi Corporation Factory"
  ],
  [
    60008803,
    10000052,
    "Hiroudeh VIII - Moon 2 - Civic Court Tribunal"
  ],
  [
    60008509,
    10000052,
    "Hiroudeh VIII - Moon 3 - Emperor Family Bureau"
  ],
  [
    60002050,
    10000002,
    "Hirtamon IV - Moon 1 - Echelon Entertainment Development Studio"
  ],
  [
    60004363,
    10000002,
    "Hirtamon VI - Moon 18 - Corporate Police Force Assembly Plant"
  ],
  [
    60000400,
    10000002,
    "Hirtamon VI - Moon 6 - Ytiri Storage"
  ],
  [
    60002047,
    10000002,
    "Hirtamon VII - Moon 2 - Echelon Entertainment Development Studio"
  ],
  [
    60001807,
    10000002,
    "Hirtamon VII - Moon 5 - Zainou Biotech Production"
  ],
  [
    60001810,
    10000002,
    "Hirtamon VII - Moon 6 - Zainou Biotech Production"
  ],
  [
    60003106,
    10000002,
    "Hirtamon VIII - Moon 5 - Expert Housing Warehouse"
  ],
  [
    60006337,
    10000043,
    "Hisoufad VII - Moon 4 - Carthum Conglomerate Factory"
  ],
  [
    60008404,
    10000043,
    "Hisoufad X - Moon 15 - Amarr Navy Assembly Plant"
  ],
  [
    60015003,
    10000016,
    "Hitanishio VI - Moon 6 - School of Applied Knowledge"
  ],
  [
    60005467,
    10000043,
    "Hizhara IX - Moon 5 - Core Complexion Inc. Factory"
  ],
  [
    60007282,
    10000042,
    "Hjoramold III - Joint Harvesting Plantation"
  ],
  [
    60007291,
    10000042,
    "Hjoramold IX - Moon 14 - Joint Harvesting Refinery"
  ],
  [
    60007288,
    10000042,
    "Hjoramold XII - Moon 1 - Joint Harvesting Plantation"
  ],
  [
    60005332,
    10000042,
    "Hjortur V - Moon 5 - Minmatar Mining Corporation Refinery"
  ],
  [
    60005335,
    10000042,
    "Hjortur VII - Moon 8 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60012205,
    10000012,
    "HLW-HP III - Moon 3 - Archangels Assembly Plant"
  ],
  [
    60012817,
    10000012,
    "HLW-HP III - Moon 5 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60012820,
    10000012,
    "HLW-HP IV - Moon 1 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60012202,
    10000012,
    "HLW-HP VI - Moon 1 - Archangels Assembly Plant"
  ],
  [
    60012757,
    10000012,
    "HLW-HP VI - Moon 10 - Salvation Angels Chemical Refinery"
  ],
  [
    60012814,
    10000012,
    "HLW-HP VI - Moon 14 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60012880,
    10000012,
    "HLW-HP VI - Moon 7 - Guardian Angels Assembly Plant"
  ],
  [
    60014230,
    10000022,
    "HM-UVD VI - Moon 4 - True Creations Shipyard"
  ],
  [
    60014233,
    10000022,
    "HM-UVD VII - Moon 5 - True Creations Shipyard"
  ],
  [
    60014305,
    10000022,
    "HM-UVD VIII - Moon 2 - True Power Assembly Plant"
  ],
  [
    60014113,
    10000042,
    "Hodrold VII - Moon 8 - Thukker Mix Factory"
  ],
  [
    60001045,
    10000042,
    "Hodrold VIII - Moon 2 - Kaalakiota Corporation Factory"
  ],
  [
    60000640,
    10000033,
    "Hogimo IV - Deep Core Mining Inc. Mining Outpost"
  ],
  [
    60000637,
    10000033,
    "Hogimo V - Moon 11 - Deep Core Mining Inc. Mining Outpost"
  ],
  [
    60000643,
    10000033,
    "Hogimo V - Moon 16 - Deep Core Mining Inc. Mining Outpost"
  ],
  [
    60000742,
    10000033,
    "Hogimo V - Moon 7 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60000745,
    10000033,
    "Hogimo V - Moon 9 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60002335,
    10000033,
    "Hogimo VI - Moon 17 - Lai Dai Corporation Research Center"
  ],
  [
    60008890,
    10000054,
    "Hophib III - Civic Court Law School"
  ],
  [
    60008896,
    10000054,
    "Hophib VI - Moon 2 - Civic Court Law School"
  ],
  [
    60007957,
    10000054,
    "Hophib VI - Moon 3 - Ministry of War Archives"
  ],
  [
    60007948,
    10000054,
    "Hophib XII - Ministry of War Archives"
  ],
  [
    60002680,
    10000028,
    "Horaka IV - Moon 9 - Expert Distribution Warehouse"
  ],
  [
    60002689,
    10000028,
    "Horaka VII - Moon 1 - Expert Distribution Retail Center"
  ],
  [
    60015024,
    10000043,
    "Horir III - Moon 1 - Imperial Academy"
  ],
  [
    60002302,
    10000033,
    "Horkkisen I - Lai Dai Corporation Research Center"
  ],
  [
    60003901,
    10000033,
    "Horkkisen XII - Caldari Navy Testing Facilities"
  ],
  [
    60003214,
    10000033,
    "Horkkisen XVIII - State and Region Bank Vault"
  ],
  [
    60007219,
    10000054,
    "Hoseen VIII - Amarr Certified News Development Studio"
  ],
  [
    60006454,
    10000043,
    "Hoshoun VII - Moon 17 - Imperial Armaments Warehouse"
  ],
  [
    60009010,
    10000052,
    "Hostakoh VI - Moon 2 - Theology Council Tribunal"
  ],
  [
    60008020,
    10000020,
    "Hostni V - Moon 4 - Ministry of Assessment Bureau Offices"
  ],
  [
    60008029,
    10000020,
    "Hostni VI - Moon 7 - Ministry of Assessment Information Center"
  ],
  [
    60008977,
    10000020,
    "Hostni VII - Moon 11 - Theology Council Tribunal"
  ],
  [
    60008983,
    10000020,
    "Hostni VII - Moon 14 - Theology Council Tribunal"
  ],
  [
    60012967,
    10000020,
    "Hostni VII - Moon 18 - DED Assembly Plant"
  ],
  [
    60008782,
    10000020,
    "Hostni VII - Moon 8 - Tash-Murkon Family Bureau"
  ],
  [
    60012130,
    10000001,
    "Hothomouh VII - Moon 2 - Ammatar Fleet Assembly Plant"
  ],
  [
    60014785,
    10000042,
    "Hotrardik VI - Moon 17 - Republic University"
  ],
  [
    60013894,
    10000017,
    "HPE-KP VI - Moon 7 - Prosper Depository"
  ],
  [
    60004906,
    10000028,
    "Hrober VI - Republic Fleet Testing Facilities"
  ],
  [
    60004909,
    10000028,
    "Hrober VII - Moon 5 - Republic Fleet Testing Facilities"
  ],
  [
    60003709,
    10000028,
    "Hrober VII - Moon 8 - Caldari Business Tribunal Law School"
  ],
  [
    60014794,
    10000042,
    "Hroduko V - Moon 4 - Republic University"
  ],
  [
    60005815,
    10000042,
    "Hroduko VII - Moon 11 - Freedom Extension Storage"
  ],
  [
    60003313,
    10000042,
    "Hroduko VII - Moon 14 - Modern Finances Depository"
  ],
  [
    60004918,
    10000028,
    "Hrokkur V - Moon 17 - Republic Fleet Assembly Plant"
  ],
  [
    60004585,
    10000028,
    "Hrokkur VI - Moon 9 - Vherokior Tribe Academy"
  ],
  [
    60013309,
    10000030,
    "Hrondedir VII - Moon 15 - Impro Factory"
  ],
  [
    60014779,
    10000030,
    "Hulm VIII - Moon 2 - Republic University"
  ],
  [
    60011359,
    10000064,
    "Hulmate I - Moon 11 - Bank of Luminaire Depository"
  ],
  [
    60008893,
    10000054,
    "Huna III - Civic Court Law School"
  ],
  [
    60007954,
    10000054,
    "Huna VI - Moon 17 - Ministry of War Archives"
  ],
  [
    60015059,
    10000038,
    "Huola VI - 24th Imperial Crusade Logistic Support"
  ],
  [
    60002203,
    10000038,
    "Huola X - Moon 2 - Ishukone Corporation Factory"
  ],
  [
    60006538,
    10000030,
    "Hurjafren IX - Imperial Armaments Factory"
  ],
  [
    60006532,
    10000030,
    "Hurjafren V - Imperial Armaments Factory"
  ],
  [
    60004741,
    10000030,
    "Hurjafren VI - Moon 17 - Republic Parliament Bureau"
  ],
  [
    60013231,
    10000030,
    "Hurjafren VII - Moon 10 - Genolution Biotech Production"
  ],
  [
    60014107,
    10000030,
    "Hurjafren VII - Moon 25 - Thukker Mix Factory"
  ],
  [
    60001639,
    10000002,
    "Hurtoken III - Moon 1 - Perkone Warehouse"
  ],
  [
    60001636,
    10000002,
    "Hurtoken IV - Moon 7 - Perkone Warehouse"
  ],
  [
    60004051,
    10000002,
    "Hurtoken VII - Moon 3 - Peace and Order Unit Testing Facilities"
  ],
  [
    60001693,
    10000033,
    "Huttaken I - Moon 1 - Caldari Steel Factory"
  ],
  [
    60013249,
    10000033,
    "Huttaken VI - Genolution Biotech Production"
  ],
  [
    60000748,
    10000033,
    "Huttaken VI - Moon 2 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60015076,
    10000069,
    "Hykanima I - State Protectorate Logistic Support"
  ],
  [
    60015105,
    10000069,
    "Hykanima V - Lai Dai Protection Service Testing Facilities"
  ],
  [
    60003109,
    10000002,
    "Hykkota IV - Moon 7 - Expert Housing Production Plant"
  ],
  [
    60003148,
    10000002,
    "Hykkota V - Moon 17 - Caldari Funds Unlimited Depository"
  ],
  [
    60004408,
    10000033,
    "Hysera II - Corporate Police Force Assembly Plant"
  ],
  [
    60002611,
    10000033,
    "Hysera II - Moon 7 - Expert Distribution Warehouse"
  ],
  [
    60002608,
    10000033,
    "Hysera V - Moon 14 - Expert Distribution Warehouse"
  ],
  [
    60014245,
    10000022,
    "I-ME3L V - Moon 1 - True Creations Testing Facilities"
  ],
  [
    60014874,
    10000046,
    "I-UUI5 IV - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60014416,
    10000041,
    "I0AB-R II - Trust Partners Trading Post"
  ],
  [
    60014419,
    10000041,
    "I0AB-R V - Moon 1 - Trust Partners Trading Post"
  ],
  [
    60013414,
    10000041,
    "I0AB-R VI - Intaki Space Police Assembly Plant"
  ],
  [
    60013537,
    10000041,
    "I0AB-R VI - Moon 2 - Intaki Syndicate Bureau"
  ],
  [
    60014952,
    10000060,
    "I3Q-II VII - Moon 2 - Blood Raiders Assembly Plant"
  ],
  [
    60013633,
    10000017,
    "I9D-0D II - Jove Navy Assembly Plant"
  ],
  [
    60013627,
    10000017,
    "I9D-0D VI - Moon 3 - Jove Navy Assembly Plant"
  ],
  [
    60013264,
    10000017,
    "IAMZ-5 VIII - Moon 9 - Impro Factory"
  ],
  [
    60013996,
    10000017,
    "IAMZ-5 X - Moon 14 - Shapeset Shipyard"
  ],
  [
    60013657,
    10000017,
    "IAMZ-5 XII - Moon 2 - Jovian Directorate Bureau"
  ],
  [
    60006862,
    10000052,
    "Iaokit IX - Moon 7 - Ducia Foundry Mining Outpost"
  ],
  [
    60006868,
    10000052,
    "Iaokit VI - Moon 14 - Ducia Foundry Mining Outpost"
  ],
  [
    60014050,
    10000019,
    "IAWJ-X VI - Moon 10 - Shapeset Shipyard"
  ],
  [
    60013906,
    10000019,
    "IAWJ-X VI - Moon 16 - Prosper Depository"
  ],
  [
    60013852,
    10000049,
    "Ibani VI - Moon 15 - Khanid Transport Storage"
  ],
  [
    60014137,
    10000001,
    "Ibaria III - Thukker Mix Warehouse"
  ],
  [
    60008077,
    10000036,
    "Ibash II - Ministry of Assessment Information Center"
  ],
  [
    60006517,
    10000036,
    "Ibash V - Moon 12 - Imperial Armaments Factory"
  ],
  [
    60006514,
    10000036,
    "Ibash V - Moon 4 - Imperial Armaments Factory"
  ],
  [
    60008902,
    10000036,
    "Ibash V - Moon 7 - Civic Court Accounting"
  ],
  [
    60006508,
    10000036,
    "Ibash VI - Imperial Armaments Factory"
  ],
  [
    60004204,
    10000016,
    "Ibura IX - Moon 11 - Spacelane Patrol Testing Facilities"
  ],
  [
    60004336,
    10000016,
    "Ibura IX - Moon 12 - Corporate Police Force Logistic Support"
  ],
  [
    60015004,
    10000016,
    "Ichinumi VII - School of Applied Knowledge"
  ],
  [
    60015147,
    10000069,
    "Ichoriya V - Caldari Navy Logistic Support"
  ],
  [
    60015120,
    10000069,
    "Ichoriya VI - Kaalakiota Corporation Factory"
  ],
  [
    60005629,
    10000067,
    "Iderion IX - Moon 18 - Core Complexion Inc. Factory"
  ],
  [
    60007876,
    10000067,
    "Iderion XI - Moon 13 - Amarr Civil Service Information Center"
  ],
  [
    60015110,
    10000069,
    "Ienakkamon X - Caldari Navy Logistic Support"
  ],
  [
    60015064,
    10000038,
    "Iesa IV - 24th Imperial Crusade Testing Facilities"
  ],
  [
    60008107,
    10000038,
    "Iesa VI - Moon 6 - Ministry of Assessment Information Center"
  ],
  [
    60011890,
    10000048,
    "Iges I - Federation Navy Assembly Plant"
  ],
  [
    60011536,
    10000048,
    "Iges IV - Moon 2 - Garoun Investment Bank Depository"
  ],
  [
    60001858,
    10000048,
    "Iges IV - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60011878,
    10000048,
    "Iges VI - Moon 12 - Federation Navy Assembly Plant"
  ],
  [
    60010468,
    10000048,
    "Iges VI - Moon 3 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60011539,
    10000048,
    "Iges VI - Moon 6 - Garoun Investment Bank Depository"
  ],
  [
    60001852,
    10000048,
    "Iges VII - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60006874,
    10000048,
    "Iges VIII - Moon 1 - Ducia Foundry Refinery"
  ],
  [
    60009505,
    10000048,
    "Iges VIII - Moon 5 - Material Acquisition Refinery"
  ],
  [
    60011974,
    10000064,
    "Ignebaener IV - Federal Intelligence Office Logistic Support"
  ],
  [
    60011968,
    10000064,
    "Ignebaener VI - Moon 1 - Federal Intelligence Office Logistic Support"
  ],
  [
    60009388,
    10000032,
    "Ignoitton V - Moon 11 - Federal Freight Storage"
  ],
  [
    60012028,
    10000032,
    "Ignoitton V - Moon 13 - Federation Customs Logistic Support"
  ],
  [
    60003208,
    10000002,
    "Ihakana VI - State and Region Bank Depository"
  ],
  [
    60001876,
    10000002,
    "Ihakana VIII - Moon 6 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60014035,
    10000019,
    "II-1B3 IX - Moon 9 - Shapeset Storage Bay"
  ],
  [
    60002971,
    10000016,
    "Iidoken III - Caldari Constructions Warehouse"
  ],
  [
    60000373,
    10000016,
    "Iidoken VI - Moon 8 - Ytiri Storage"
  ],
  [
    60003361,
    10000016,
    "Iidoken VII - Moon 7 - Chief Executive Panel Bureau"
  ],
  [
    60001663,
    10000016,
    "Iidoken VIII - Caldari Steel Factory"
  ],
  [
    60013411,
    10000041,
    "IIRH-G VIII - Intaki Space Police Logistic Support"
  ],
  [
    60013177,
    10000016,
    "Iitanmadan III - Moon 1 - Genolution Biotech Production"
  ],
  [
    60001732,
    10000016,
    "Iitanmadan VIII - Moon 1 - Caldari Steel Factory"
  ],
  [
    60001495,
    10000033,
    "Iivinen IV - Moon 8 - Rapid Assembly Factory"
  ],
  [
    60001489,
    10000033,
    "Iivinen VI - Moon 10 - Rapid Assembly Factory"
  ],
  [
    60002722,
    10000033,
    "Iivinen VI - Moon 15 - CBD Sell Division Warehouse"
  ],
  [
    60012520,
    10000033,
    "Iivinen VIII - Moon 10 - CONCORD Assembly Plant"
  ],
  [
    60002863,
    10000033,
    "Iivinen VIII - Moon 13 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60013198,
    10000033,
    "Iivinen VIII - Moon 7 - Genolution Biohazard Containment Facility"
  ],
  [
    60000415,
    10000033,
    "Iivinen VIII - Moon 8 - Ytiri Storage"
  ],
  [
    60013189,
    10000033,
    "Iivinen X - Moon 10 - Genolution Biohazard Containment Facility"
  ],
  [
    60000544,
    10000033,
    "Iivinen X - Moon 10 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60000406,
    10000033,
    "Iivinen X - Moon 2 - Ytiri Storage"
  ],
  [
    60000553,
    10000033,
    "Iivinen X - Moon 5 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60000919,
    10000002,
    "Ikami VI - Moon 13 - Caldari Provisions Food Packaging"
  ],
  [
    60004075,
    10000002,
    "Ikami VIII - Moon 12 - Peace and Order Unit Logistic Support"
  ],
  [
    60010195,
    10000002,
    "Ikami X - CreoDron Factory"
  ],
  [
    60006856,
    10000002,
    "Ikami XI - Moon 4 - Ducia Foundry Refinery"
  ],
  [
    60002770,
    10000033,
    "Ikao VII - Moon 1 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60002785,
    10000033,
    "Ikao VII - Moon 19 - Sukuuvestaa Corporation Factory"
  ],
  [
    60004171,
    10000033,
    "Ikao VII - Moon 8 - Spacelane Patrol Logistic Support"
  ],
  [
    60000658,
    10000033,
    "Ikao VIII - Moon 1 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60002779,
    10000033,
    "Ikao VIII - Moon 3 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60000667,
    10000033,
    "Ikao VIII - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60006427,
    10000002,
    "Ikuchi VI - Moon 15 - Imperial Armaments Warehouse"
  ],
  [
    60000394,
    10000002,
    "Ikuchi VI - Moon 15 - Ytiri Storage"
  ],
  [
    60000403,
    10000002,
    "Ikuchi VI - Moon 6 - Ytiri Storage"
  ],
  [
    60007237,
    10000020,
    "Ilas IX - Moon 4 - Amarr Certified News Development Studio"
  ],
  [
    60000226,
    10000020,
    "Ilas V - Moon 1 - CBD Corporation Storage"
  ],
  [
    60000235,
    10000020,
    "Ilas VII - Moon 10 - CBD Corporation Storage"
  ],
  [
    60008050,
    10000020,
    "Ilas VII - Moon 11 - Ministry of Assessment Information Center"
  ],
  [
    60002686,
    10000028,
    "Illamur III - Expert Distribution Retail Center"
  ],
  [
    60014833,
    10000030,
    "Illinfrik VII - Moon 12 - Pator Tech School"
  ],
  [
    60014401,
    10000030,
    "Illinfrik VIII - Moon 1 - Trust Partners Trading Post"
  ],
  [
    60004624,
    10000042,
    "Illuin III - Republic Parliament Bureau"
  ],
  [
    60006442,
    10000042,
    "Illuin IV - Moon 5 - Imperial Armaments Warehouse"
  ],
  [
    60014782,
    10000042,
    "Illuin V - Moon 13 - Republic University"
  ],
  [
    60006445,
    10000042,
    "Illuin V - Moon 5 - Imperial Armaments Factory"
  ],
  [
    60004933,
    10000042,
    "Illuin VI - Moon 5 - Republic Justice Department Accounting"
  ],
  [
    60006058,
    10000042,
    "Illuin VI - Moon 8 - The Leisure Group Development Studio"
  ],
  [
    60005971,
    10000038,
    "Imata IV - Freedom Extension Storage"
  ],
  [
    60008353,
    10000038,
    "Imata VII - Amarr Trade Registry Archives"
  ],
  [
    60001285,
    10000038,
    "Imata VII - Wiyrkomi Corporation Warehouse"
  ],
  [
    60007615,
    10000020,
    "Imeshasa I - Nurtura Food Packaging"
  ],
  [
    60002578,
    10000065,
    "Imih III - Moon 10 - Expert Distribution Warehouse"
  ],
  [
    60003472,
    10000065,
    "Imih III - Moon 2 - Caldari Business Tribunal Law School"
  ],
  [
    60002572,
    10000065,
    "Imih III - Moon 7 - Expert Distribution Warehouse"
  ],
  [
    60010462,
    10000065,
    "Imih III - Moon 8 - Poteque Pharmaceuticals Biotech Research Center"
  ],
  [
    60002581,
    10000065,
    "Imih III - Moon 9 - Expert Distribution Warehouse"
  ],
  [
    60014867,
    10000010,
    "IMK-K1 IX - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60007918,
    10000067,
    "Imya VIII - Moon 3 - Ministry of War Information Center"
  ],
  [
    60007450,
    10000033,
    "Inari I - Moon 1 - Joint Harvesting Plantation"
  ],
  [
    60007447,
    10000033,
    "Inari IX - Moon 11 - Joint Harvesting Plantation"
  ],
  [
    60004348,
    10000033,
    "Inari IX - Moon 13 - Corporate Police Force Testing Facilities"
  ],
  [
    60000934,
    10000033,
    "Inari IX - Moon 7 - Caldari Provisions Plantation"
  ],
  [
    60007456,
    10000033,
    "Inari VII - Moon 23 - Joint Harvesting Mining Outpost"
  ],
  [
    60002263,
    10000033,
    "Inaro VII - Moon 4 - Lai Dai Corporation Factory"
  ],
  [
    60001750,
    10000033,
    "Inaro X - Moon 12 - Caldari Steel Factory"
  ],
  [
    60004354,
    10000033,
    "Inaro X - Moon 13 - Corporate Police Force Logistic Support"
  ],
  [
    60002710,
    10000033,
    "Inaro X - Moon 2 - CBD Sell Division Retail Center"
  ],
  [
    60002266,
    10000033,
    "Inaro X - Moon 4 - Lai Dai Corporation Factory"
  ],
  [
    60001744,
    10000033,
    "Inaro XI - Moon 3 - Caldari Steel Factory"
  ],
  [
    60013291,
    10000002,
    "Inaya IX - Moon 13 - Impro Factory"
  ],
  [
    60003193,
    10000002,
    "Inaya VIII - Moon 8 - State and Region Bank Depository"
  ],
  [
    60012628,
    10000042,
    "Inder VII - Moon 11 - Sisters of EVE Bureau"
  ],
  [
    60001324,
    10000032,
    "Inghenges IV - Moon 17 - Wiyrkomi Corporation Factory"
  ],
  [
    60014551,
    10000032,
    "Inghenges IV - Moon 4 - X-Sense Chemical Refinery"
  ],
  [
    60001219,
    10000032,
    "Inghenges IV - Moon 5 - Kaalakiota Corporation Factory"
  ],
  [
    60002098,
    10000032,
    "Inghenges V - Moon 13 - Ishukone Corporation Factory"
  ],
  [
    60013324,
    10000032,
    "Inghenges V - Moon 15 - Impro Factory"
  ],
  [
    60002092,
    10000032,
    "Inghenges V - Moon 2 - Ishukone Corporation Factory"
  ],
  [
    60014548,
    10000032,
    "Inghenges V - Moon 3 - X-Sense Chemical Refinery"
  ],
  [
    60002089,
    10000032,
    "Inghenges VI - Moon 13 - Ishukone Corporation Factory"
  ],
  [
    60010891,
    10000032,
    "Inghenges VI - Moon 15 - Duvolle Laboratories Factory"
  ],
  [
    60013327,
    10000032,
    "Inghenges VI - Moon 4 - Impro Factory"
  ],
  [
    60011593,
    10000032,
    "Inghenges VI - Moon 7 - University of Caille"
  ],
  [
    60009367,
    10000032,
    "Inghenges VII - Federal Freight Storage"
  ],
  [
    60004969,
    10000030,
    "Ingunn V - Moon 19 - Republic Justice Department Tribunal"
  ],
  [
    60010174,
    10000030,
    "Ingunn V - Moon 21 - CreoDron Factory"
  ],
  [
    60008965,
    10000052,
    "Inis-Ilix I - Theology Council Accounting"
  ],
  [
    60008968,
    10000052,
    "Inis-Ilix II - Moon 1 - Theology Council Law School"
  ],
  [
    60006217,
    10000052,
    "Inis-Ilix IV - Moon 1 - Amarr Constructions Foundry"
  ],
  [
    60000244,
    10000052,
    "Inis-Ilix IV - Moon 1 - CBD Corporation Storage"
  ],
  [
    60000238,
    10000052,
    "Inis-Ilix V - CBD Corporation Storage"
  ],
  [
    60008971,
    10000052,
    "Inis-Ilix VI - Theology Council Accounting"
  ],
  [
    60008011,
    10000052,
    "Inis-Ilix VII - Moon 1 - Ministry of Assessment Archives"
  ],
  [
    60015075,
    10000069,
    "Innia II - State Protectorate Logistic Support"
  ],
  [
    60002296,
    10000033,
    "Inoue IV - Moon 4 - Lai Dai Corporation Warehouse"
  ],
  [
    60003898,
    10000033,
    "Inoue VI - Moon 9 - Caldari Navy Logistic Support"
  ],
  [
    60003910,
    10000033,
    "Inoue VIII - Moon 5 - Caldari Navy Logistic Support"
  ],
  [
    60015088,
    10000048,
    "Intaki II - Federal Defense Union Logistic Support"
  ],
  [
    60011377,
    10000048,
    "Intaki III - Pend Insurance Depository"
  ],
  [
    60009667,
    10000048,
    "Intaki V - Moon 5 - Astral Mining Inc. Refinery"
  ],
  [
    60010963,
    10000048,
    "Intaki VI - Moon 5 - FedMart Storage"
  ],
  [
    60011374,
    10000048,
    "Intaki VI - Moon 5 - Pend Insurance Depository"
  ],
  [
    60009385,
    10000048,
    "Intaki VII - Moon 1 - Federal Freight Storage"
  ],
  [
    60012415,
    10000049,
    "Ipref II - Moon 1 - CONCORD Assembly Plant"
  ],
  [
    60012400,
    10000049,
    "Ipref IV - Moon 5 - CONCORD Bureau"
  ],
  [
    60015113,
    10000069,
    "Iralaja IX - Home Guard Testing Facilities"
  ],
  [
    60015112,
    10000069,
    "Iralaja VII - Home Guard Testing Facilities"
  ],
  [
    60009223,
    10000042,
    "Irgrus IV - Moon 13 - TransStellar Shipping Storage"
  ],
  [
    60001510,
    10000033,
    "Irjunen I - Rapid Assembly Warehouse"
  ],
  [
    60001747,
    10000033,
    "Irjunen II - Caldari Steel Warehouse"
  ],
  [
    60004357,
    10000033,
    "Irjunen II - Corporate Police Force Assembly Plant"
  ],
  [
    60014668,
    10000033,
    "Irjunen IV - House of Records School"
  ],
  [
    60001198,
    10000033,
    "Irjunen IV - Kaalakiota Corporation Warehouse"
  ],
  [
    60002713,
    10000033,
    "Irjunen V - CBD Sell Division Retail Center"
  ],
  [
    60000928,
    10000033,
    "Irjunen VI - Caldari Provisions Food Packaging"
  ],
  [
    60002257,
    10000033,
    "Irjunen VII - Moon 2 - Lai Dai Corporation Factory"
  ],
  [
    60013945,
    10000049,
    "Irmalin VIII - Moon 13 - Royal Khanid Navy Testing Facilities"
  ],
  [
    60015050,
    10000043,
    "Irnal I - Imperial Academy"
  ],
  [
    60008491,
    10000043,
    "Irnin VIII - Moon 8 - Court Chamberlain Bureau"
  ],
  [
    60009976,
    10000020,
    "Iro IX - Moon 2 - Quafe Company Factory"
  ],
  [
    60002077,
    10000020,
    "Iro IX - Moon 6 - Ishukone Corporation Warehouse"
  ],
  [
    60002086,
    10000020,
    "Iro XI - Moon 11 - Ishukone Corporation Factory"
  ],
  [
    60009982,
    10000020,
    "Iro XI - Quafe Company Factory"
  ],
  [
    60014425,
    10000001,
    "Irshah VIII - Moon 9 - Trust Partners Trading Post"
  ],
  [
    60007747,
    10000043,
    "Isamm IX - Moon 15 - Imperial Chancellor Bureau Offices"
  ],
  [
    60007597,
    10000016,
    "Isanamo VII - Moon 1 - Nurtura Warehouse"
  ],
  [
    60001462,
    10000016,
    "Isanamo XIV - Moon 19 - Rapid Assembly Factory"
  ],
  [
    60001468,
    10000016,
    "Isanamo XIV - Moon 21 - Rapid Assembly Factory"
  ],
  [
    60004432,
    10000016,
    "Isanamo XIV - Moon 9 - Caldari Provisions School"
  ],
  [
    60001570,
    10000033,
    "Isaziwa III - Perkone Warehouse"
  ],
  [
    60003355,
    10000033,
    "Isaziwa IX - Chief Executive Panel Bureau"
  ],
  [
    60001567,
    10000033,
    "Isaziwa VII - Perkone Factory"
  ],
  [
    60004393,
    10000033,
    "Isaziwa VIII - Corporate Police Force Logistic Support"
  ],
  [
    60003352,
    10000033,
    "Isaziwa X - Moon 1 - Chief Executive Panel Bureau"
  ],
  [
    60003904,
    10000033,
    "Isaziwa X - Moon 3 - Caldari Navy Assembly Plant"
  ],
  [
    60002299,
    10000033,
    "Isaziwa X - Moon 3 - Lai Dai Corporation Factory"
  ],
  [
    60001564,
    10000033,
    "Isaziwa X - Perkone Warehouse"
  ],
  [
    60004453,
    10000033,
    "Isaziwa X - Science and Trade Institute School"
  ],
  [
    60004387,
    10000033,
    "Isaziwa XI - Corporate Police Force Assembly Plant"
  ],
  [
    60003907,
    10000033,
    "Isaziwa XIII - Moon 15 - Caldari Navy Logistic Support"
  ],
  [
    60001561,
    10000033,
    "Isaziwa XIII - Moon 8 - Perkone Factory"
  ],
  [
    60005695,
    10000042,
    "Isbrabata VII - Boundless Creation Factory"
  ],
  [
    60014821,
    10000042,
    "Isbrabata VII - Moon 1 - Pator Tech School"
  ],
  [
    60005116,
    10000042,
    "Isbrabata VIII - Moon 5 - Republic Security Services Assembly Plant"
  ],
  [
    60006034,
    10000042,
    "Isbrabata VIII - Moon 8 - Freedom Extension Warehouse"
  ],
  [
    60001774,
    10000033,
    "Isenairos V - Moon 7 - Zainou Biotech Production"
  ],
  [
    60002986,
    10000033,
    "Isenairos VI - Caldari Constructions Warehouse"
  ],
  [
    60003775,
    10000033,
    "Isenairos VI - Caldari Navy Logistic Support"
  ],
  [
    60001447,
    10000033,
    "Isenairos VI - Moon 13 - Rapid Assembly Warehouse"
  ],
  [
    60003448,
    10000033,
    "Isenairos VI - Moon 6 - Mercantile Club Bureau"
  ],
  [
    60002041,
    10000033,
    "Isenairos VI - Moon 7 - Echelon Entertainment Development Studio"
  ],
  [
    60003772,
    10000033,
    "Isenairos VI - Moon 9 - Caldari Navy Logistic Support"
  ],
  [
    60001351,
    10000033,
    "Isenairos VI - Moon 9 - Wiyrkomi Corporation Factory"
  ],
  [
    60000718,
    10000033,
    "Isenairos VI - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60000427,
    10000033,
    "Isenairos VII - Moon 4 - Ytiri Storage"
  ],
  [
    60001348,
    10000033,
    "Isenairos VII - Moon 5 - Wiyrkomi Corporation Factory"
  ],
  [
    60009484,
    10000064,
    "Isenan VII - Moon 13 - Material Acquisition Mining Outpost"
  ],
  [
    60010981,
    10000064,
    "Isenan VII - Moon 2 - FedMart Storage"
  ],
  [
    60009481,
    10000064,
    "Isenan VII - Moon 9 - Material Acquisition Mining Outpost"
  ],
  [
    60010972,
    10000064,
    "Isenan VIII - Moon 12 - FedMart Warehouse"
  ],
  [
    60010978,
    10000064,
    "Isenan VIII - Moon 7 - FedMart Warehouse"
  ],
  [
    60011947,
    10000064,
    "Isenan X - Moon 7 - Federal Intelligence Office Testing Facilities"
  ],
  [
    60009478,
    10000064,
    "Isenan XI - Moon 4 - Material Acquisition Mining Outpost"
  ],
  [
    60005008,
    10000030,
    "Isendeldik IX - Moon 14 - Republic Justice Department Accounting"
  ],
  [
    60011413,
    10000030,
    "Isendeldik IX - Moon 3 - Pend Insurance Depository"
  ],
  [
    60004750,
    10000030,
    "Isendeldik IX - Moon 6 - Republic Fleet Logistic Support"
  ],
  [
    60011407,
    10000030,
    "Isendeldik IX - Moon 8 - Pend Insurance Depository"
  ],
  [
    60005740,
    10000030,
    "Isendeldik VIII - Moon 19 - Six Kin Development Warehouse"
  ],
  [
    60001873,
    10000002,
    "Ishisomo IV - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60003349,
    10000002,
    "Ishisomo IX - Moon 9 - Chief Executive Panel Bureau"
  ],
  [
    60002422,
    10000002,
    "Ishisomo VII - Moon 14 - Propel Dynamics Factory"
  ],
  [
    60014686,
    10000002,
    "Ishisomo VIII - Moon 11 - State War Academy"
  ],
  [
    60002425,
    10000002,
    "Ishisomo VIII - Propel Dynamics Factory"
  ],
  [
    60012181,
    10000001,
    "Ishkad VIII - Ammatar Fleet Testing Facilities"
  ],
  [
    60003439,
    10000033,
    "Ishomilken IX - Moon 12 - Mercantile Club Bureau"
  ],
  [
    60001603,
    10000033,
    "Ishomilken IX - Moon 14 - Perkone Factory"
  ],
  [
    60003385,
    10000033,
    "Ishomilken IX - Moon 4 - Chief Executive Panel Bureau"
  ],
  [
    60004321,
    10000033,
    "Ishomilken IX - Moon 4 - Corporate Police Force Assembly Plant"
  ],
  [
    60015071,
    10000033,
    "Ishomilken V - State Protectorate Logistic Support"
  ],
  [
    60001600,
    10000033,
    "Ishomilken VIII - Moon 2 - Perkone Factory"
  ],
  [
    60000805,
    10000016,
    "Isie V - Minedrill Mining Outpost"
  ],
  [
    60004255,
    10000016,
    "Isikano IV - Moon 1 - Spacelane Patrol Assembly Plant"
  ],
  [
    60004279,
    10000016,
    "Isikano IX - Moon 11 - Wiyrkomi Peace Corps Logistic Support"
  ],
  [
    60003739,
    10000016,
    "Isikano IX - Moon 17 - House of Records Bureau Offices"
  ],
  [
    60000343,
    10000016,
    "Isikano VII - Moon 5 - Ytiri Storage"
  ],
  [
    60000337,
    10000016,
    "Isikano VIII - Moon 7 - Ytiri Storage"
  ],
  [
    60004021,
    10000016,
    "Isikemi I - Home Guard Assembly Plant"
  ],
  [
    60003088,
    10000016,
    "Isikemi II - Moon 1 - Expert Housing Warehouse"
  ],
  [
    60002014,
    10000016,
    "Isikemi IV - Moon 2 - Echelon Entertainment Development Studio"
  ],
  [
    60000841,
    10000016,
    "Isikemi IV - Moon 3 - Minedrill Mineral Reserve"
  ],
  [
    60011503,
    10000016,
    "Isikemi IV - Pend Insurance Depository"
  ],
  [
    60004015,
    10000016,
    "Isikemi V - Home Guard Assembly Plant"
  ],
  [
    60007675,
    10000016,
    "Isikemi VI - Moon 3 - Nurtura Food Packaging"
  ],
  [
    60002902,
    10000016,
    "Isikemi VI - Moon 3 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60003928,
    10000016,
    "Isikemi VI - Moon 5 - Caldari Navy Logistic Support"
  ],
  [
    60002905,
    10000016,
    "Isikemi VII - Moon 2 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60011497,
    10000016,
    "Isikemi VII - Moon 3 - Pend Insurance Depository"
  ],
  [
    60001531,
    10000033,
    "Isikesu I - Moon 1 - Perkone Factory"
  ],
  [
    60004132,
    10000033,
    "Isikesu I - Moon 1 - Spacelane Patrol Logistic Support"
  ],
  [
    60002728,
    10000033,
    "Isikesu I - Moon 3 - CBD Sell Division Warehouse"
  ],
  [
    60002830,
    10000033,
    "Isikesu IV - Moon 10 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60001459,
    10000033,
    "Isikesu IV - Moon 13 - Rapid Assembly Warehouse"
  ],
  [
    60000439,
    10000033,
    "Isikesu IV - Moon 14 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60003028,
    10000033,
    "Isikesu IV - Moon 5 - Caldari Constructions Production Plant"
  ],
  [
    60003799,
    10000033,
    "Isikesu IV - Moon 5 - Caldari Navy Logistic Support"
  ],
  [
    60002725,
    10000033,
    "Isikesu IV - Moon 6 - CBD Sell Division Warehouse"
  ],
  [
    60000442,
    10000033,
    "Isikesu IV - Moon 7 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60002839,
    10000033,
    "Isikesu IV - Moon 9 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60004195,
    10000016,
    "Isinokka V - Moon 10 - Spacelane Patrol Testing Facilities"
  ],
  [
    60004192,
    10000016,
    "Isinokka V - Moon 2 - Spacelane Patrol Logistic Support"
  ],
  [
    60003988,
    10000016,
    "Isinokka VI - Moon 1 - Ishukone Watch Logistic Support"
  ],
  [
    60000949,
    10000016,
    "Isinokka VI - Moon 7 - Caldari Provisions Warehouse"
  ],
  [
    60000769,
    10000016,
    "Isseras IV - Moon 1 - Minedrill Mineral Reserve"
  ],
  [
    60007558,
    10000016,
    "Isseras IV - Moon 1 - Nurtura Plantation"
  ],
  [
    60001765,
    10000016,
    "Isseras IV - Zainou Biotech Production"
  ],
  [
    60002392,
    10000016,
    "Isseras VI - Moon 6 - Propel Dynamics Factory"
  ],
  [
    60001573,
    10000016,
    "Isseras VII - Moon 13 - Perkone Factory"
  ],
  [
    60001579,
    10000016,
    "Isseras VII - Moon 6 - Perkone Factory"
  ],
  [
    60007552,
    10000016,
    "Isseras VII - Nurtura Warehouse"
  ],
  [
    60002395,
    10000016,
    "Isseras VII - Propel Dynamics Warehouse"
  ],
  [
    60012460,
    10000028,
    "Istodard IX - Moon 16 - CONCORD Bureau"
  ],
  [
    60012457,
    10000028,
    "Istodard IX - Moon 5 - CONCORD Bureau"
  ],
  [
    60004792,
    10000028,
    "Istodard IX - Moon 5 - Republic Fleet Assembly Plant"
  ],
  [
    60014395,
    10000028,
    "Istodard V - Moon 2 - Trust Partners Trading Post"
  ],
  [
    60004795,
    10000028,
    "Istodard VIII - Moon 4 - Republic Fleet Logistic Support"
  ],
  [
    60001690,
    10000033,
    "Isutaka I - Caldari Steel Warehouse"
  ],
  [
    60010105,
    10000033,
    "Isutaka IV - Moon 2 - Quafe Company Factory"
  ],
  [
    60010111,
    10000033,
    "Isutaka IV - Moon 3 - Quafe Company Warehouse"
  ],
  [
    60011158,
    10000020,
    "Iswa II - Aliastra Warehouse"
  ],
  [
    60005110,
    10000020,
    "Iswa VIII - Republic Security Services Logistic Support"
  ],
  [
    60001543,
    10000002,
    "Itamo III - Perkone Factory"
  ],
  [
    60001540,
    10000002,
    "Itamo IV - Moon 1 - Perkone Factory"
  ],
  [
    60005608,
    10000002,
    "Itamo VI - Core Complexion Inc. Storage"
  ],
  [
    60004462,
    10000002,
    "Itamo VI - Moon 6 - Science and Trade Institute School"
  ],
  [
    60001537,
    10000002,
    "Itamo VI - Moon 7 - Perkone Factory"
  ],
  [
    60001546,
    10000002,
    "Itamo VI - Perkone Factory"
  ],
  [
    60001483,
    10000002,
    "Itamo VII - Moon 3 - Rapid Assembly Factory"
  ],
  [
    60003067,
    10000002,
    "Itamo VII - Moon 5 - Expert Housing Warehouse"
  ],
  [
    60005593,
    10000002,
    "Itamo VIII - Core Complexion Inc. Factory"
  ],
  [
    60005596,
    10000002,
    "Itamo VIII - Moon 13 - Core Complexion Inc. Factory"
  ],
  [
    60005599,
    10000002,
    "Itamo VIII - Moon 4 - Core Complexion Inc. Factory"
  ],
  [
    60001486,
    10000002,
    "Itamo VIII - Rapid Assembly Factory"
  ],
  [
    60001000,
    10000052,
    "Ithar VI - Moon 10 - Kaalakiota Corporation Factory"
  ],
  [
    60008635,
    10000052,
    "Ithar VI - Moon 14 - Kador Family Academy"
  ],
  [
    60001003,
    10000052,
    "Ithar VIII - Moon 16 - Kaalakiota Corporation Warehouse"
  ],
  [
    60000994,
    10000052,
    "Ithar XI - Kaalakiota Corporation Warehouse"
  ],
  [
    60011236,
    10000067,
    "Itrin V - Moon 19 - Aliastra Retail Center"
  ],
  [
    60008278,
    10000067,
    "Itrin V - Moon 2 - Amarr Trade Registry Information Center"
  ],
  [
    60011233,
    10000067,
    "Itrin V - Moon 7 - Aliastra Warehouse"
  ],
  [
    60004618,
    10000030,
    "Ivar IX - Moon 4 - Brutor Tribe Bureau"
  ],
  [
    60010387,
    10000032,
    "Iyen-Oursta III - Roden Shipyards Factory"
  ],
  [
    60014308,
    10000022,
    "J-AYLV III - Moon 14 - True Power Mining Outpost"
  ],
  [
    60012598,
    10000023,
    "J-CIJV VII - Moon 14 - Sisters of EVE Bureau"
  ],
  [
    60013912,
    10000017,
    "J-JS0D IX - Moon 8 - Prosper Vault"
  ],
  [
    60013909,
    10000017,
    "J-JS0D VIII - Moon 15 - Prosper Vault"
  ],
  [
    60012901,
    10000012,
    "J4UD-J VI - Moon 3 - Guardian Angels Testing Facilities"
  ],
  [
    60013054,
    10000012,
    "J7A-UR VI - Dominations Testing Facilities"
  ],
  [
    60002743,
    10000002,
    "Jakanerva II - Moon 1 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60000517,
    10000002,
    "Jakanerva II - Moon 13 - Hyasyoda Corporation Refinery"
  ],
  [
    60002749,
    10000002,
    "Jakanerva II - Moon 13 - Sukuuvestaa Corporation Factory"
  ],
  [
    60001648,
    10000002,
    "Jakanerva II - Moon 4 - Caldari Steel Factory"
  ],
  [
    60002737,
    10000002,
    "Jakanerva II - Moon 5 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60000277,
    10000002,
    "Jakanerva III - Moon 15 - Prompt Delivery Storage"
  ],
  [
    60003682,
    10000002,
    "Jakanerva IV - Moon 11 - Caldari Business Tribunal Information Center"
  ],
  [
    60001654,
    10000002,
    "Jakanerva IV - Moon 17 - Caldari Steel Factory"
  ],
  [
    60000505,
    10000002,
    "Jakanerva IV - Moon 4 - Hyasyoda Corporation Refinery"
  ],
  [
    60002059,
    10000002,
    "Jakanerva V - Moon 1 - Echelon Entertainment Development Studio"
  ],
  [
    60002062,
    10000002,
    "Jakanerva V - Moon 10 - Echelon Entertainment Development Studio"
  ],
  [
    60001651,
    10000002,
    "Jakanerva V - Moon 15 - Caldari Steel Factory"
  ],
  [
    60003685,
    10000002,
    "Jakanerva V - Moon 21 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60007396,
    10000043,
    "Jambu V - Moon 6 - Joint Harvesting Food Packaging"
  ],
  [
    60010132,
    10000043,
    "Jambu VI - Moon 3 - CreoDron Factory"
  ],
  [
    60001714,
    10000016,
    "Jan IV - Caldari Steel Warehouse"
  ],
  [
    60003412,
    10000016,
    "Jan V - Moon 10 - Mercantile Club Bureau"
  ],
  [
    60012334,
    10000016,
    "Jan VI - Moon 21 - CONCORD Academy"
  ],
  [
    60007654,
    10000001,
    "Jangar IV - Nurtura Plantation"
  ],
  [
    60007651,
    10000001,
    "Jangar VII - Moon 1 - Nurtura Plantation"
  ],
  [
    60007645,
    10000001,
    "Jangar VIII - Moon 2 - Nurtura Plantation"
  ],
  [
    60012145,
    10000001,
    "Jarizza II - Moon 1 - Ammatar Fleet Assembly Plant"
  ],
  [
    60012532,
    10000001,
    "Jarizza VI - Moon 1 - Ammatar Consulate Bureau"
  ],
  [
    60009004,
    10000043,
    "Jarshitsan VI - Moon 1 - Theology Council Tribunal"
  ],
  [
    60007750,
    10000043,
    "Jarshitsan VII - Moon 19 - Imperial Chancellor Information Center"
  ],
  [
    60006316,
    10000043,
    "Jarshitsan VIII - Moon 8 - Carthum Conglomerate Factory"
  ],
  [
    60008998,
    10000043,
    "Jarshitsan VIII - Moon 8 - Theology Council Tribunal"
  ],
  [
    60009301,
    10000020,
    "Jarzalad IV - Moon 6 - TransStellar Shipping Storage"
  ],
  [
    60009295,
    10000020,
    "Jarzalad VII - Moon 3 - TransStellar Shipping Storage"
  ],
  [
    60009289,
    10000020,
    "Jarzalad VIII - Moon 8 - TransStellar Shipping Storage"
  ],
  [
    60009355,
    10000037,
    "Jaschercis III - Moon 1 - Federal Freight Storage"
  ],
  [
    60011122,
    10000037,
    "Jaschercis IV - Moon 1 - FedMart Retail Center"
  ],
  [
    60011125,
    10000037,
    "Jaschercis IV - Moon 14 - FedMart Storage"
  ],
  [
    60010222,
    10000037,
    "Jaschercis IV - Moon 2 - CreoDron Factory"
  ],
  [
    60009853,
    10000037,
    "Jaschercis IV - Moon 9 - Quafe Company Factory"
  ],
  [
    60008575,
    10000054,
    "Jasson I - Moon 4 - Emperor Family Bureau"
  ],
  [
    60000286,
    10000002,
    "Jatate III - Moon 10 - Prompt Delivery Storage"
  ],
  [
    60003751,
    10000002,
    "Jatate IV - Moon 11 - House of Records Archives"
  ],
  [
    60005605,
    10000002,
    "Jatate IV - Moon 16 - Core Complexion Inc. Storage"
  ],
  [
    60000289,
    10000002,
    "Jatate IV - Moon 17 - Prompt Delivery Storage"
  ],
  [
    60004675,
    10000030,
    "Javrendei VIII - Moon 13 - Republic Parliament Academy"
  ],
  [
    60011446,
    10000065,
    "Jedandan VI - Moon 13 - Pend Insurance Depository"
  ],
  [
    60010351,
    10000032,
    "Jel I - Roden Shipyards Warehouse"
  ],
  [
    60010948,
    10000032,
    "Jel V - Duvolle Laboratories Factory"
  ],
  [
    60011800,
    10000032,
    "Jel V - Federation Navy Logistic Support"
  ],
  [
    60011788,
    10000032,
    "Jel VI - Federation Navy Logistic Support"
  ],
  [
    60011263,
    10000032,
    "Jel VIII - Aliastra Retail Center"
  ],
  [
    60011029,
    10000032,
    "Jel VIII - Moon 1 - FedMart Warehouse"
  ],
  [
    60010348,
    10000032,
    "Jel VIII - Moon 12 - Roden Shipyards Factory"
  ],
  [
    60011797,
    10000032,
    "Jel VIII - Moon 20 - Federation Navy Assembly Plant"
  ],
  [
    60011038,
    10000032,
    "Jel VIII - Moon 22 - FedMart Storage"
  ],
  [
    60006679,
    10000065,
    "Jeni IX - Moon 17 - Zoar and Sons Warehouse"
  ],
  [
    60000331,
    10000033,
    "Jeras VII - Moon 1 - Ytiri Storage"
  ],
  [
    60003517,
    10000033,
    "Jeras VII - Moon 13 - Caldari Business Tribunal"
  ],
  [
    60000328,
    10000033,
    "Jeras VII - Moon 15 - Ytiri Storage"
  ],
  [
    60013000,
    10000054,
    "Jerhesh VI - Moon 11 - DED Logistic Support"
  ],
  [
    60001132,
    10000054,
    "Jerhesh VI - Moon 11 - Kaalakiota Corporation Factory"
  ],
  [
    60008080,
    10000043,
    "Jerma V - Ministry of Assessment Information Center"
  ],
  [
    60008929,
    10000043,
    "Jerma VI - Moon 12 - Theology Council Tribunal"
  ],
  [
    60008086,
    10000043,
    "Jerma VII - Moon 4 - Ministry of Assessment Bureau Offices"
  ],
  [
    60008926,
    10000043,
    "Jerma VIII - Moon 3 - Theology Council Tribunal"
  ],
  [
    60008407,
    10000043,
    "Jesoyeh IX - Moon 15 - Amarr Navy Testing Facilities"
  ],
  [
    60006937,
    10000043,
    "Jesoyeh IX - Moon 7 - HZO Refinery Mining Outpost"
  ],
  [
    60003700,
    10000043,
    "Jesoyeh VIII - Moon 8 - Caldari Business Tribunal Archives"
  ],
  [
    60006934,
    10000043,
    "Jesoyeh X - Moon 12 - HZO Refinery Mining Outpost"
  ],
  [
    60007120,
    10000043,
    "Jesoyeh X - Moon 7 - Imperial Shipment Storage"
  ],
  [
    60007783,
    10000065,
    "Jinkah III - Moon 3 - Amarr Civil Service Archives"
  ],
  [
    60007903,
    10000065,
    "Jinkah VI - Moon 10 - Ministry of War Archives"
  ],
  [
    60007900,
    10000065,
    "Jinkah VI - Moon 12 - Ministry of War Archives"
  ],
  [
    60003469,
    10000002,
    "Jita IV - Caldari Business Tribunal Information Center"
  ],
  [
    60003460,
    10000002,
    "Jita IV - Moon 10 - Caldari Business Tribunal Law School"
  ],
  [
    60002959,
    10000002,
    "Jita IV - Moon 10 - Caldari Constructions Production Plant"
  ],
  [
    60003055,
    10000002,
    "Jita IV - Moon 11 - Expert Housing Production Plant"
  ],
  [
    60003466,
    10000002,
    "Jita IV - Moon 4 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60003760,
    10000002,
    "Jita IV - Moon 4 - Caldari Navy Assembly Plant"
  ],
  [
    60003757,
    10000002,
    "Jita IV - Moon 5 - Caldari Navy Assembly Plant"
  ],
  [
    60004423,
    10000002,
    "Jita IV - Moon 6 - Caldari Provisions School"
  ],
  [
    60000451,
    10000002,
    "Jita IV - Moon 6 - Hyasyoda Corporation Refinery"
  ],
  [
    60000361,
    10000002,
    "Jita IV - Moon 6 - Ytiri Storage"
  ],
  [
    60000364,
    10000002,
    "Jita V - Moon 14 - Ytiri Storage"
  ],
  [
    60002953,
    10000002,
    "Jita V - Moon 17 - Caldari Constructions Production Plant"
  ],
  [
    60000463,
    10000002,
    "Jita VI - Hyasyoda Corporation Refinery"
  ],
  [
    60003463,
    10000002,
    "Jita VII - Moon 2 - Caldari Business Tribunal Law School"
  ],
  [
    60014888,
    10000008,
    "JLO-Z3 IX - Moon 4 - Serpentis Corporation Refining"
  ],
  [
    60009163,
    10000064,
    "Jolevier VII - Moon 17 - TransStellar Shipping Storage"
  ],
  [
    60005611,
    10000032,
    "Jolia I - Moon 1 - Core Complexion Inc. Factory"
  ],
  [
    60011425,
    10000032,
    "Jolia I - Moon 1 - Pend Insurance Depository"
  ],
  [
    60001267,
    10000032,
    "Jolia VII - Moon 12 - Wiyrkomi Corporation Factory"
  ],
  [
    60007417,
    10000042,
    "Jondik VI - Joint Harvesting Mineral Reserve"
  ],
  [
    60008740,
    10000043,
    "Joppaya IX - Moon 9 - Ardishapur Family Bureau"
  ],
  [
    60007969,
    10000052,
    "Joramok IV - Moon 4 - Ministry of War Archives"
  ],
  [
    60007960,
    10000052,
    "Joramok VI - Moon 14 - Ministry of War Archives"
  ],
  [
    60012244,
    10000012,
    "Jorund VI - Archangels Assembly Plant"
  ],
  [
    60012856,
    10000012,
    "Jorund VII - Moon 2 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60002431,
    10000002,
    "Josameto III - Expert Distribution Retail Center"
  ],
  [
    60002821,
    10000002,
    "Josameto III - Moon 1 - Sukuuvestaa Corporation Factory"
  ],
  [
    60001828,
    10000002,
    "Josameto IV - Moon 1 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60004219,
    10000002,
    "Josameto IV - Spacelane Patrol Assembly Plant"
  ],
  [
    60003136,
    10000002,
    "Josameto IX - Moon 3 - Caldari Funds Unlimited Depository"
  ],
  [
    60001834,
    10000002,
    "Josameto VIII - Moon 1 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001825,
    10000002,
    "Josameto VIII - Nugoeihuvi Corporation Publisher"
  ],
  [
    60004225,
    10000002,
    "Josameto VIII - Spacelane Patrol Assembly Plant"
  ],
  [
    60010144,
    10000042,
    "Josekorn IV - CreoDron Factory"
  ],
  [
    60004948,
    10000042,
    "Josekorn VI - Republic Justice Department Tribunal"
  ],
  [
    60004504,
    10000042,
    "Josekorn VII - Moon 1 - Sebiestor Tribe Bureau"
  ],
  [
    60010150,
    10000042,
    "Josekorn VIII - CreoDron Factory"
  ],
  [
    60010153,
    10000042,
    "Josekorn X - Moon 1 - CreoDron Factory"
  ],
  [
    60001729,
    10000016,
    "Jotenen II - Caldari Steel Warehouse"
  ],
  [
    60003997,
    10000016,
    "Jotenen II - Ishukone Watch Testing Facilities"
  ],
  [
    60013183,
    10000016,
    "Jotenen II - Moon 1 - Genolution Biohazard Containment Facility"
  ],
  [
    60001735,
    10000016,
    "Jotenen IV - Caldari Steel Warehouse"
  ],
  [
    60003406,
    10000016,
    "Jotenen V - Mercantile Club Bureau"
  ],
  [
    60015005,
    10000016,
    "Jouvulen III - Science and Trade Institute School"
  ],
  [
    60009406,
    10000068,
    "Jovainnon IV - Federal Freight Storage"
  ],
  [
    60009400,
    10000068,
    "Jovainnon VI - Federal Freight Storage"
  ],
  [
    60012949,
    10000001,
    "Juddi VII - DED Logistic Support"
  ],
  [
    60007213,
    10000020,
    "Judra VII - Moon 7 - Amarr Certified News Publisher"
  ],
  [
    60015092,
    10000068,
    "Jufvitte IV - Federal Defense Union Logistic Support"
  ],
  [
    60011212,
    10000068,
    "Jufvitte IX - Aliastra Warehouse"
  ],
  [
    60010339,
    10000068,
    "Jufvitte VI - Moon 4 - Roden Shipyards Factory"
  ],
  [
    60000073,
    10000038,
    "Junsen V - Moon 20 - CBD Corporation Storage"
  ],
  [
    60012001,
    10000037,
    "Junsoraert VI - Moon 1 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60010312,
    10000037,
    "Junsoraert XI - Moon 9 - Roden Shipyards Factory"
  ],
  [
    60009517,
    10000037,
    "Jurlesel II - Material Acquisition Refinery"
  ],
  [
    60014482,
    10000037,
    "Jurlesel VI - Moon 17 - X-Sense Chemical Refinery"
  ],
  [
    60011632,
    10000037,
    "Jurlesel VI - Moon 20 - Federal Administration Information Center"
  ],
  [
    60014488,
    10000037,
    "Jurlesel VIII - X-Sense Chemical Refinery"
  ],
  [
    60004123,
    10000033,
    "Juunigaishi III - Spacelane Patrol Assembly Plant"
  ],
  [
    60001528,
    10000033,
    "Juunigaishi VII - Perkone Factory"
  ],
  [
    60000865,
    10000033,
    "Juunigaishi X - Moon 3 - Caldari Provisions Food Packaging"
  ],
  [
    60004309,
    10000033,
    "Juunigaishi X - Moon 5 - Corporate Police Force Assembly Plant"
  ],
  [
    60000799,
    10000033,
    "Juunigaishi XI - Moon 3 - Minedrill Refinery"
  ],
  [
    60003796,
    10000033,
    "Juunigaishi XII - Moon 16 - Caldari Navy Assembly Plant"
  ],
  [
    60014881,
    10000061,
    "JV1V-O IV - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60014861,
    10000003,
    "JZV-F4 V - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60014923,
    10000055,
    "K-8SQS VI - Moon 2 - Serpentis Corporation Cloning"
  ],
  [
    60012184,
    10000012,
    "K-MGJ7 IV - Moon 11 - Archangels Testing Facilities"
  ],
  [
    60012190,
    10000012,
    "K-MGJ7 IV - Moon 4 - Archangels Testing Facilities"
  ],
  [
    60012214,
    10000012,
    "K-QWHE V - Moon 4 - Archangels Assembly Plant"
  ],
  [
    60012763,
    10000012,
    "K-QWHE VI - Moon 10 - Salvation Angels Chemical Refinery"
  ],
  [
    60012826,
    10000012,
    "K-QWHE VI - Moon 15 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60012823,
    10000012,
    "K-QWHE VII - Moon 11 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60013060,
    10000012,
    "K-QWHE VII - Moon 8 - Dominations Assembly Plant"
  ],
  [
    60012565,
    10000015,
    "K3JR-J VIII - Guristas Assembly Plant"
  ],
  [
    60013471,
    10000041,
    "K5-JRD VIII - Moon 2 - Intaki Syndicate Bureau"
  ],
  [
    60002707,
    10000033,
    "Kaaputenen III - Moon 1 - CBD Sell Division Warehouse"
  ],
  [
    60007453,
    10000033,
    "Kaaputenen III - Moon 10 - Joint Harvesting Mining Outpost"
  ],
  [
    60000931,
    10000033,
    "Kaaputenen III - Moon 7 - Caldari Provisions Plantation"
  ],
  [
    60007444,
    10000033,
    "Kaaputenen V - Moon 1 - Joint Harvesting Plantation"
  ],
  [
    60000937,
    10000033,
    "Kaaputenen V - Moon 16 - Caldari Provisions Plantation"
  ],
  [
    60007441,
    10000033,
    "Kaaputenen VII - Moon 4 - Joint Harvesting Plantation"
  ],
  [
    60008620,
    10000052,
    "Kador Prime I - Kador Family Bureau"
  ],
  [
    60009145,
    10000052,
    "Kador Prime II - TransStellar Shipping Storage"
  ],
  [
    60001168,
    10000052,
    "Kador Prime IX - Moon 2 - Kaalakiota Corporation Factory"
  ],
  [
    60009157,
    10000052,
    "Kador Prime IX - TransStellar Shipping Storage"
  ],
  [
    60008614,
    10000052,
    "Kador Prime VI - Moon 1 - Kador Family Bureau"
  ],
  [
    60009142,
    10000052,
    "Kador Prime VII - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60009151,
    10000052,
    "Kador Prime VIII - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60006946,
    10000052,
    "Kador Prime VIII - Moon 3 - Inherent Implants Biotech Production"
  ],
  [
    60013837,
    10000049,
    "Kahah I - Khanid Transport Storage"
  ],
  [
    60004333,
    10000033,
    "Kaimon I - Moon 1 - Corporate Police Force Assembly Plant"
  ],
  [
    60004327,
    10000033,
    "Kaimon II - Moon 10 - Corporate Police Force Assembly Plant"
  ],
  [
    60001753,
    10000033,
    "Kaimon II - Moon 6 - Caldari Steel Factory"
  ],
  [
    60002026,
    10000033,
    "Kaimon II - Moon 6 - Echelon Entertainment Development Studio"
  ],
  [
    60004324,
    10000033,
    "Kaimon III - Moon 1 - Corporate Police Force Assembly Plant"
  ],
  [
    60004330,
    10000033,
    "Kaimon III - Moon 10 - Corporate Police Force Assembly Plant"
  ],
  [
    60003160,
    10000033,
    "Kaimon III - Moon 14 - Caldari Funds Unlimited Depository"
  ],
  [
    60003163,
    10000033,
    "Kaimon III - Moon 15 - Caldari Funds Unlimited Depository"
  ],
  [
    60001759,
    10000033,
    "Kaimon III - Moon 18 - Caldari Steel Factory"
  ],
  [
    60003403,
    10000033,
    "Kaimon III - Moon 25 - Mercantile Club Bureau"
  ],
  [
    60002797,
    10000016,
    "Kakakela V - Moon 2 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60003895,
    10000016,
    "Kakakela VI - Moon 15 - Caldari Navy Assembly Plant"
  ],
  [
    60003892,
    10000016,
    "Kakakela VI - Moon 18 - Caldari Navy Assembly Plant"
  ],
  [
    60002248,
    10000016,
    "Kakakela VI - Moon 5 - Lai Dai Corporation Factory"
  ],
  [
    60003889,
    10000016,
    "Kakakela VII - Caldari Navy Assembly Plant"
  ],
  [
    60004405,
    10000016,
    "Kakakela VII - Moon 13 - Corporate Police Force Assembly Plant"
  ],
  [
    60003880,
    10000016,
    "Kakakela VII - Moon 16 - Caldari Navy Assembly Plant"
  ],
  [
    60004402,
    10000016,
    "Kakakela VII - Moon 9 - Corporate Police Force Assembly Plant"
  ],
  [
    60003520,
    10000033,
    "Kakki V - Moon 9 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60008857,
    10000052,
    "Kamda XII - Civic Court Tribunal"
  ],
  [
    60015060,
    10000038,
    "Kamela V - 24th Imperial Crusade Logistic Support"
  ],
  [
    60006115,
    10000054,
    "Kamih IV - Amarr Constructions Warehouse"
  ],
  [
    60006118,
    10000054,
    "Kamih V - Amarr Constructions Production Plant"
  ],
  [
    60008386,
    10000054,
    "Kamih V - Amarr Navy Logistic Support"
  ],
  [
    60006973,
    10000054,
    "Kamih VI - Moon 2 - Inherent Implants Biotech Production"
  ],
  [
    60008566,
    10000054,
    "Kamih VII - Moon 4 - Emperor Family Bureau"
  ],
  [
    60002773,
    10000033,
    "Kamio VI - Moon 7 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60002800,
    10000016,
    "Kamokor V - Moon 15 - Sukuuvestaa Corporation Factory"
  ],
  [
    60002251,
    10000016,
    "Kamokor V - Moon 19 - Lai Dai Corporation Factory"
  ],
  [
    60002254,
    10000016,
    "Kamokor V - Moon 4 - Lai Dai Corporation Factory"
  ],
  [
    60003433,
    10000016,
    "Kamokor VII - Moon 1 - Mercantile Club Bureau"
  ],
  [
    60015006,
    10000016,
    "Kappas VIII - Moon 1 - Science and Trade Institute School"
  ],
  [
    60007708,
    10000054,
    "Karan VIII - Royal Amarr Institute School"
  ],
  [
    60003232,
    10000016,
    "Karjataimon V - Moon 19 - State and Region Bank Depository"
  ],
  [
    60009895,
    10000016,
    "Karjataimon VIII - Moon 1 - Quafe Company Factory"
  ],
  [
    60009016,
    10000052,
    "Kasi V - Moon 5 - Theology Council Tribunal"
  ],
  [
    60009013,
    10000052,
    "Kasi V - Moon 9 - Theology Council Tribunal"
  ],
  [
    60014458,
    10000001,
    "Kasrasi IX - Moon 5 - Trust Partners Trading Post"
  ],
  [
    60013024,
    10000001,
    "Kasrasi IX - Moon 7 - DED Assembly Plant"
  ],
  [
    60014440,
    10000030,
    "Katugumur V - Moon 12 - Trust Partners Warehouse"
  ],
  [
    60006016,
    10000033,
    "Kaunokka II - Freedom Extension Warehouse"
  ],
  [
    60003850,
    10000033,
    "Kaunokka II - Moon 1 - Caldari Navy Testing Facilities"
  ],
  [
    60000559,
    10000033,
    "Kaunokka II - Moon 1 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60000634,
    10000033,
    "Kaunokka III - Moon 1 - Deep Core Mining Inc. Mining Outpost"
  ],
  [
    60000556,
    10000033,
    "Kaunokka IV - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60006004,
    10000033,
    "Kaunokka V - Freedom Extension Storage"
  ],
  [
    60000628,
    10000033,
    "Kaunokka VI - Moon 1 - Deep Core Mining Inc. Mineral Reserve"
  ],
  [
    60003847,
    10000033,
    "Kaunokka VI - Moon 2 - Caldari Navy Assembly Plant"
  ],
  [
    60006013,
    10000033,
    "Kaunokka VI - Moon 2 - Freedom Extension Storage"
  ],
  [
    60001756,
    10000033,
    "Kausaaja IX - Moon 9 - Caldari Steel Factory"
  ],
  [
    60000166,
    10000054,
    "Keba II - CBD Corporation Storage"
  ],
  [
    60000181,
    10000054,
    "Keba IX - Moon 1 - CBD Corporation Storage"
  ],
  [
    60006721,
    10000054,
    "Keba IX - Moon 3 - Zoar and Sons Factory"
  ],
  [
    60011392,
    10000054,
    "Keba VII - Moon 15 - Pend Insurance Depository"
  ],
  [
    60015107,
    10000069,
    "Kehjari II - Kaalakiota Corporation Factory"
  ],
  [
    60005872,
    10000043,
    "Kehour V - Moon 1 - Freedom Extension Retail Center"
  ],
  [
    60008497,
    10000043,
    "Kehour VIII - Moon 1 - Emperor Family Bureau"
  ],
  [
    60013864,
    10000001,
    "Kehrara IV - Nefantar Miner Association Refinery"
  ],
  [
    60012538,
    10000001,
    "Kehrara VI - Moon 9 - Ammatar Consulate Bureau"
  ],
  [
    60002845,
    10000002,
    "Keikaken I - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60002272,
    10000002,
    "Keikaken V - Moon 1 - Lai Dai Corporation Warehouse"
  ],
  [
    60012262,
    10000067,
    "Kemerk V - Moon 10 - CONCORD Bureau"
  ],
  [
    60008383,
    10000054,
    "Kenahehab IX - Moon 4 - Amarr Navy Assembly Plant"
  ],
  [
    60008389,
    10000054,
    "Kenahehab VI - Moon 11 - Amarr Navy Assembly Plant"
  ],
  [
    60008380,
    10000054,
    "Kenahehab VII - Moon 4 - Amarr Navy Assembly Plant"
  ],
  [
    60011647,
    10000048,
    "Kenninck IX - Moon 6 - Federal Administration Archives"
  ],
  [
    60011638,
    10000048,
    "Kenninck VIII - Federal Administration Archives"
  ],
  [
    60001957,
    10000065,
    "Keproh VI - Moon 5 - Nugoeihuvi Corporation Publisher"
  ],
  [
    60012484,
    10000065,
    "Keproh VIII - Moon 3 - CONCORD Assembly Plant"
  ],
  [
    60001963,
    10000065,
    "Keproh VIII - Moon 4 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60015009,
    10000020,
    "Kerepa I - Royal Amarr Institute School"
  ],
  [
    60008281,
    10000067,
    "Keri VI - Moon 1 - Amarr Trade Registry Archives"
  ],
  [
    60007102,
    10000067,
    "Keri VII - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60007108,
    10000067,
    "Keri VIII - Moon 3 - Imperial Shipment Storage"
  ],
  [
    60007096,
    10000067,
    "Keri X - Imperial Shipment Storage"
  ],
  [
    60013129,
    10000020,
    "Keshirou IX - Moon 4 - Genolution Biotech Production"
  ],
  [
    60013132,
    10000020,
    "Keshirou VIII - Moon 2 - Genolution Biotech Production"
  ],
  [
    60014005,
    10000017,
    "KF1-DU VII - Moon 15 - Shapeset Shipyard"
  ],
  [
    60013624,
    10000017,
    "KF1-DU VII - Moon 3 - Jove Navy Assembly Plant"
  ],
  [
    60014942,
    10000060,
    "KFIE-Z III - Moon 7 - Blood Raiders Assembly Plant"
  ],
  [
    60014943,
    10000060,
    "KFIE-Z VIII - Moon 18 - Blood Raiders Logistic Support"
  ],
  [
    60001888,
    10000041,
    "KFR-ZE V - Nugoeihuvi Corporation Publisher"
  ],
  [
    60013456,
    10000041,
    "KFR-ZE VII - Moon 6 - Intaki Space Police Assembly Plant"
  ],
  [
    60006676,
    10000065,
    "Khabara VI - Moon 7 - Zoar and Sons Factory"
  ],
  [
    60008719,
    10000065,
    "Khabara VII - Moon 12 - Kor-Azor Family Bureau"
  ],
  [
    60000202,
    10000065,
    "Khabara VII - Moon 15 - CBD Corporation Storage"
  ],
  [
    60001171,
    10000052,
    "Khafis IX - Moon 7 - Kaalakiota Corporation Warehouse"
  ],
  [
    60008617,
    10000052,
    "Khafis VII - Moon 3 - Kador Family Bureau"
  ],
  [
    60009154,
    10000052,
    "Khafis VII - Moon 8 - TransStellar Shipping Storage"
  ],
  [
    60001159,
    10000052,
    "Khafis X - Moon 2 - Kaalakiota Corporation Factory"
  ],
  [
    60013828,
    10000049,
    "Khanid Prime IX - Khanid Transport Storage"
  ],
  [
    60013825,
    10000049,
    "Khanid Prime V - Moon 1 - Khanid Innovation Factory"
  ],
  [
    60013858,
    10000049,
    "Khanid Prime VII - Moon 2 - Khanid Works Shipyard"
  ],
  [
    60012529,
    10000001,
    "Khankenirdia V - Moon 17 - Ammatar Consulate Academy"
  ],
  [
    60006307,
    10000043,
    "Kheram III - Moon 1 - Carthum Conglomerate Production Plant"
  ],
  [
    60002119,
    10000043,
    "Kheram III - Moon 6 - Ishukone Corporation Factory"
  ],
  [
    60006292,
    10000043,
    "Kheram IV - Moon 15 - Carthum Conglomerate Factory"
  ],
  [
    60006298,
    10000043,
    "Kheram V - Moon 15 - Carthum Conglomerate Factory"
  ],
  [
    60006295,
    10000043,
    "Kheram V - Moon 6 - Carthum Conglomerate Factory"
  ],
  [
    60002113,
    10000043,
    "Kheram V - Moon 6 - Ishukone Corporation Factory"
  ],
  [
    60006301,
    10000043,
    "Kheram VI - Moon 10 - Carthum Conglomerate Factory"
  ],
  [
    60008866,
    10000043,
    "Khopa IX - Moon 14 - Civic Court Tribunal"
  ],
  [
    60006403,
    10000043,
    "Khopa VII - Moon 3 - Imperial Armaments Factory"
  ],
  [
    60010096,
    10000043,
    "Khopa X - Moon 4 - Quafe Company Warehouse"
  ],
  [
    60000307,
    10000002,
    "Kiainti IX - Moon 8 - Prompt Delivery Storage"
  ],
  [
    60010822,
    10000002,
    "Kiainti VI - Moon 1 - Chemal Tech Factory"
  ],
  [
    60000577,
    10000002,
    "Kiainti VI - Moon 1 - Hyasyoda Corporation Refinery"
  ],
  [
    60013147,
    10000002,
    "Kiainti VII - Genolution Biotech Production"
  ],
  [
    60008023,
    10000020,
    "Kibursha I - Ministry of Assessment Information Center"
  ],
  [
    60013027,
    10000001,
    "Kiereend VII - Moon 3 - DED Assembly Plant"
  ],
  [
    60012406,
    10000049,
    "Kihtaled VIII - CONCORD Bureau"
  ],
  [
    60012409,
    10000049,
    "Kihtaled VIII - Moon 17 - CONCORD Bureau"
  ],
  [
    60013933,
    10000049,
    "Kihtaled VIII - Moon 7 - Royal Khanid Navy Assembly Plant"
  ],
  [
    60013936,
    10000049,
    "Kihtaled VIII - Royal Khanid Navy Assembly Plant"
  ],
  [
    60015111,
    10000069,
    "Kinakka III - Lai Dai Corporation Factory"
  ],
  [
    60000712,
    10000016,
    "Kino IV - Moon 12 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60000706,
    10000016,
    "Kino V - Moon 3 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60000961,
    10000016,
    "Kino VII - Moon 10 - Caldari Provisions Plantation"
  ],
  [
    60000355,
    10000016,
    "Kino VII - Moon 13 - Ytiri Storage"
  ],
  [
    60000952,
    10000016,
    "Kino VII - Moon 17 - Caldari Provisions Plantation"
  ],
  [
    60004024,
    10000016,
    "Kino VII - Moon 7 - Home Guard Testing Facilities"
  ],
  [
    60001558,
    10000016,
    "Kirras II - Perkone Factory"
  ],
  [
    60003745,
    10000016,
    "Kirras IX - House of Records Information Center"
  ],
  [
    60001549,
    10000016,
    "Kirras VII - Moon 10 - Perkone Factory"
  ],
  [
    60000595,
    10000016,
    "Kiskoken I - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60003187,
    10000016,
    "Kiskoken VII - Moon 14 - State and Region Bank Vault"
  ],
  [
    60000604,
    10000016,
    "Kiskoken VII - Moon 2 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60002983,
    10000016,
    "Kiskoken VII - Moon 4 - Caldari Constructions Foundry"
  ],
  [
    60014659,
    10000002,
    "Kisogo VII - State War Academy"
  ],
  [
    60010708,
    10000065,
    "Kizama V - Moon 3 - The Scope Development Studio"
  ],
  [
    60005182,
    10000065,
    "Kizama VI - Moon 4 - Republic Security Services Logistic Support"
  ],
  [
    60004711,
    10000042,
    "Klaevik VII - Moon 13 - Republic Parliament Bureau"
  ],
  [
    60012418,
    10000028,
    "Klingt III - CONCORD Bureau"
  ],
  [
    60004879,
    10000028,
    "Klingt III - Republic Fleet Assembly Plant"
  ],
  [
    60000082,
    10000028,
    "Klingt IV - Moon 1 - CBD Corporation Storage"
  ],
  [
    60012433,
    10000028,
    "Klingt IX - CONCORD Assembly Plant"
  ],
  [
    60010183,
    10000028,
    "Klingt IX - Moon 11 - CreoDron Factory"
  ],
  [
    60000091,
    10000028,
    "Klingt IX - Moon 3 - CBD Corporation Storage"
  ],
  [
    60004885,
    10000028,
    "Klingt IX - Moon 4 - Republic Fleet Logistic Support"
  ],
  [
    60000088,
    10000028,
    "Klingt V - CBD Corporation Storage"
  ],
  [
    60000076,
    10000028,
    "Klingt VII - Moon 2 - CBD Corporation Storage"
  ],
  [
    60012430,
    10000028,
    "Klingt VIII - CONCORD Logistic Support"
  ],
  [
    60004567,
    10000028,
    "Klingt X - Moon 1 - Vherokior Tribe Bureau"
  ],
  [
    60009967,
    10000030,
    "Klir V - Moon 11 - Quafe Company Factory"
  ],
  [
    60009970,
    10000030,
    "Klir V - Moon 7 - Quafe Company Warehouse"
  ],
  [
    60001837,
    10000030,
    "Klir VI - Moon 4 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60005911,
    10000042,
    "Klogori I - Freedom Extension Retail Center"
  ],
  [
    60005908,
    10000042,
    "Klogori II - Freedom Extension Warehouse"
  ],
  [
    60004765,
    10000042,
    "Klogori II - Moon 1 - Republic Fleet Assembly Plant"
  ],
  [
    60005269,
    10000042,
    "Klogori III - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60010474,
    10000042,
    "Klogori III - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60004762,
    10000042,
    "Klogori III - Republic Fleet Logistic Support"
  ],
  [
    60005896,
    10000042,
    "Klogori V - Moon 2 - Freedom Extension Storage"
  ],
  [
    60004768,
    10000042,
    "Klogori V - Moon 2 - Republic Fleet Assembly Plant"
  ],
  [
    60004774,
    10000042,
    "Klogori VI - Moon 1 - Republic Fleet Assembly Plant"
  ],
  [
    60013375,
    10000041,
    "KLYN-8 II - Moon 14 - Intaki Bank Depository"
  ],
  [
    60013516,
    10000041,
    "KLYN-8 IV - Moon 14 - Intaki Syndicate Academy"
  ],
  [
    60013513,
    10000041,
    "KLYN-8 IV - Moon 21 - Intaki Syndicate Bureau"
  ],
  [
    60013090,
    10000017,
    "KN7M-N IV - Moon 4 - Genolution Biotech Research Center"
  ],
  [
    60013267,
    10000017,
    "KN7M-N IV - Moon 7 - Impro Research Center"
  ],
  [
    60014467,
    10000017,
    "KN7M-N V - Moon 17 - X-Sense Reprocessing Facility"
  ],
  [
    60013087,
    10000017,
    "KN7M-N VI - Moon 3 - Genolution Biotech Research Center"
  ],
  [
    60005482,
    10000043,
    "Knophtikoo IV - Moon 19 - Core Complexion Inc. Storage"
  ],
  [
    60001333,
    10000067,
    "Kobam VIII - Moon 2 - Wiyrkomi Corporation Factory"
  ],
  [
    60001288,
    10000038,
    "Komaa III - Moon 1 - Wiyrkomi Corporation Factory"
  ],
  [
    60005968,
    10000038,
    "Komaa IV - Freedom Extension Storage"
  ],
  [
    60008347,
    10000038,
    "Komaa V - Moon 3 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60007711,
    10000038,
    "Komaa V - Royal Amarr Institute School"
  ],
  [
    60014614,
    10000038,
    "Komaa VI - Moon 17 - Hedion University"
  ],
  [
    60008344,
    10000038,
    "Komaa VI - Moon 19 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60001282,
    10000038,
    "Komaa VII - Moon 1 - Wiyrkomi Corporation Factory"
  ],
  [
    60008191,
    10000038,
    "Komaa VII - Moon 10 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60005974,
    10000038,
    "Komaa VII - Moon 5 - Freedom Extension Storage"
  ],
  [
    60001291,
    10000038,
    "Komaa VII - Moon 6 - Wiyrkomi Corporation Factory"
  ],
  [
    60008188,
    10000038,
    "Komaa VII - Moon 7 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60015007,
    10000033,
    "Komo IX - Science and Trade Institute School"
  ],
  [
    60002293,
    10000033,
    "Konola V - Moon 12 - Lai Dai Corporation Warehouse"
  ],
  [
    60005806,
    10000042,
    "Konora IX - Moon 1 - Freedom Extension Storage"
  ],
  [
    60001039,
    10000042,
    "Konora VI - Kaalakiota Corporation Factory"
  ],
  [
    60007231,
    10000052,
    "Koona IV - Amarr Certified News Development Studio"
  ],
  [
    60006754,
    10000052,
    "Koona VI - Moon 14 - Noble Appliances Factory"
  ],
  [
    60008692,
    10000065,
    "Kor-Azor Prime II - Kor-Azor Family Bureau"
  ],
  [
    60007246,
    10000065,
    "Kor-Azor Prime II - Moon 1 - Joint Harvesting Plantation"
  ],
  [
    60002212,
    10000065,
    "Kor-Azor Prime IV (Eclipticum) - Moon Griklaeum - Ishukone Corporation Factory"
  ],
  [
    60008686,
    10000065,
    "Kor-Azor Prime IV (Eclipticum) - Moon Griklaeum - Kor-Azor Family Bureau"
  ],
  [
    60002209,
    10000065,
    "Kor-Azor Prime V - Moon 1 - Ishukone Corporation Factory"
  ],
  [
    60007819,
    10000065,
    "Kor-Azor Prime V - Moon 2 - Amarr Civil Service Bureau Offices"
  ],
  [
    60005146,
    10000016,
    "Korama II - Moon 5 - Republic Security Services Logistic Support"
  ],
  [
    60001576,
    10000016,
    "Korama II - Moon 7 - Perkone Warehouse"
  ],
  [
    60007549,
    10000016,
    "Korama II - Moon 8 - Nurtura Food Packaging"
  ],
  [
    60002068,
    10000016,
    "Korama III - Moon 10 - Ishukone Corporation Factory"
  ],
  [
    60003970,
    10000016,
    "Korama III - Moon 6 - Ishukone Watch Logistic Support"
  ],
  [
    60002074,
    10000016,
    "Korama III - Moon 8 - Ishukone Corporation Factory"
  ],
  [
    60001582,
    10000016,
    "Korama IV - Moon 17 - Perkone Warehouse"
  ],
  [
    60003733,
    10000016,
    "Korama V - Moon 13 - House of Records Information Center"
  ],
  [
    60002071,
    10000016,
    "Korama V - Moon 20 - Ishukone Corporation Factory"
  ],
  [
    60000766,
    10000016,
    "Korama VI - Moon 10 - Minedrill Mining Outpost"
  ],
  [
    60003967,
    10000016,
    "Korama VI - Moon 20 - Ishukone Watch Assembly Plant"
  ],
  [
    60005140,
    10000016,
    "Korama VI - Republic Security Services Assembly Plant"
  ],
  [
    60007099,
    10000067,
    "Korridi I - Imperial Shipment Storage"
  ],
  [
    60011230,
    10000067,
    "Korridi III - Aliastra Retail Center"
  ],
  [
    60014626,
    10000067,
    "Korridi IV - Hedion University"
  ],
  [
    60004444,
    10000002,
    "Korsiki II - Moon 7 - School of Applied Knowledge"
  ],
  [
    60003190,
    10000002,
    "Korsiki III - Moon 11 - State and Region Bank Depository"
  ],
  [
    60001783,
    10000002,
    "Korsiki III - Moon 15 - Zainou Biotech Production"
  ],
  [
    60003070,
    10000002,
    "Korsiki III - Moon 18 - Expert Housing Production Plant"
  ],
  [
    60002353,
    10000002,
    "Korsiki III - Moon 5 - Lai Dai Corporation Factory"
  ],
  [
    60000874,
    10000002,
    "Korsiki IV - Moon 16 - Caldari Provisions Food Packaging"
  ],
  [
    60006820,
    10000052,
    "Kothe III - Ducia Foundry Mining Outpost"
  ],
  [
    60008017,
    10000052,
    "Kothe III - Moon 1 - Ministry of Assessment Archives"
  ],
  [
    60008962,
    10000052,
    "Kothe VI - Moon 15 - Theology Council Accounting"
  ],
  [
    60000250,
    10000052,
    "Kothe X - Moon 6 - CBD Corporation Storage"
  ],
  [
    60014566,
    10000038,
    "Kourmonen II - Moon 2 - X-Sense Chemical Refinery"
  ],
  [
    60002206,
    10000038,
    "Kourmonen IV - Moon 18 - Ishukone Corporation Factory"
  ],
  [
    60002200,
    10000038,
    "Kourmonen V - Ishukone Corporation Factory"
  ],
  [
    60014569,
    10000038,
    "Kourmonen V - Moon 13 - X-Sense Chemical Refinery"
  ],
  [
    60014563,
    10000038,
    "Kourmonen V - Moon 4 - X-Sense Chemical Refinery"
  ],
  [
    60014314,
    10000022,
    "KP-FQ1 III - Moon 12 - True Power Mineral Reserve"
  ],
  [
    60014257,
    10000022,
    "KP-FQ1 III - Moon 9 - True Creations Storage Bay"
  ],
  [
    60014263,
    10000022,
    "KP-FQ1 III - True Creations Assembly Plant"
  ],
  [
    60015038,
    10000030,
    "Krilmokenur VII - Moon 8 - Republic Military School"
  ],
  [
    60002002,
    10000042,
    "Krirald IX - Moon 1 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60004687,
    10000042,
    "Krirald VII - Moon 11 - Republic Parliament Bureau"
  ],
  [
    60004837,
    10000042,
    "Krirald VII - Moon 14 - Republic Fleet Assembly Plant"
  ],
  [
    60004984,
    10000030,
    "Kronsur III - Moon 1 - Republic Justice Department Tribunal"
  ],
  [
    60004990,
    10000030,
    "Kronsur VI - Moon 2 - Republic Justice Department Tribunal"
  ],
  [
    60010042,
    10000041,
    "KTHT-O VI - Moon 12 - Quafe Company Warehouse"
  ],
  [
    60004180,
    10000033,
    "Kubinen IX - Spacelane Patrol Assembly Plant"
  ],
  [
    60002338,
    10000033,
    "Kubinen VI - Moon 2 - Lai Dai Corporation Factory"
  ],
  [
    60001702,
    10000033,
    "Kubinen VI - Moon 6 - Caldari Steel Factory"
  ],
  [
    60001474,
    10000033,
    "Kubinen VIII - Moon 2 - Rapid Assembly Factory"
  ],
  [
    60013963,
    10000049,
    "Kuhri III - Moon 13 - Royal Khanid Navy Testing Facilities"
  ],
  [
    60001612,
    10000033,
    "Kulelen V - Moon 12 - Perkone Factory"
  ],
  [
    60002329,
    10000033,
    "Kulelen V - Moon 16 - Lai Dai Corporation Factory"
  ],
  [
    60013258,
    10000033,
    "Kulelen V - Moon 18 - Genolution Biotech Production"
  ],
  [
    60004441,
    10000033,
    "Kulelen V - Moon 4 - School of Applied Knowledge"
  ],
  [
    60001822,
    10000033,
    "Kulelen V - Moon 8 - Zainou Biotech Production"
  ],
  [
    60001615,
    10000033,
    "Kulelen VI - Perkone Factory"
  ],
  [
    60001918,
    10000065,
    "Kulu I - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001912,
    10000065,
    "Kulu IX - Moon 2 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60002584,
    10000065,
    "Kulu VIII - Moon 3 - Expert Distribution Warehouse"
  ],
  [
    60007723,
    10000065,
    "Kulu X - Moon 16 - Royal Amarr Institute School"
  ],
  [
    60003484,
    10000065,
    "Kulu X - Moon 3 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60001909,
    10000065,
    "Kulu X - Moon 9 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60006829,
    10000038,
    "Kuomi VI - Moon 2 - Ducia Foundry Refinery"
  ],
  [
    60002197,
    10000038,
    "Kuomi VIII - Moon 22 - Ishukone Corporation Factory"
  ],
  [
    60005977,
    10000038,
    "Kurmaru I - Freedom Extension Storage"
  ],
  [
    60008194,
    10000038,
    "Kurmaru I - Ministry of Internal Order Testing Facilities"
  ],
  [
    60015061,
    10000038,
    "Kurniainen IX - 24th Imperial Crusade Logistic Support"
  ],
  [
    60002833,
    10000033,
    "Kusomonmon II - Moon 12 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60003022,
    10000033,
    "Kusomonmon II - Moon 8 - Caldari Constructions Production Plant"
  ],
  [
    60003025,
    10000033,
    "Kusomonmon IV - Moon 13 - Caldari Constructions Foundry"
  ],
  [
    60000793,
    10000033,
    "Kusomonmon IV - Moon 2 - Minedrill Mining Outpost"
  ],
  [
    60000436,
    10000033,
    "Kusomonmon IV - Moon 4 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60000796,
    10000033,
    "Kusomonmon IV - Moon 6 - Minedrill Mining Outpost"
  ],
  [
    60000619,
    10000033,
    "Kusomonmon V - Moon 14 - Deep Core Mining Inc. Mining Outpost"
  ],
  [
    60000625,
    10000033,
    "Kusomonmon V - Moon 20 - Deep Core Mining Inc. Mining Outpost"
  ],
  [
    60003802,
    10000033,
    "Kusomonmon V - Moon 9 - Caldari Navy Testing Facilities"
  ],
  [
    60005572,
    10000033,
    "Kusomonmon VI - Moon 1 - Core Complexion Inc. Storage"
  ],
  [
    60000670,
    10000033,
    "Kusomonmon VI - Moon 20 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60002731,
    10000033,
    "Kusomonmon VI - Moon 21 - CBD Sell Division Warehouse"
  ],
  [
    60004306,
    10000033,
    "Kusomonmon VI - Moon 23 - Corporate Police Force Testing Facilities"
  ],
  [
    60002824,
    10000033,
    "Kusomonmon VI - Moon 23 - Sukuuvestaa Corporation Foundry"
  ],
  [
    60000445,
    10000033,
    "Kusomonmon VI - Moon 24 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60000433,
    10000033,
    "Kusomonmon VI - Moon 4 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60000859,
    10000033,
    "Kusomonmon VI - Moon 6 - Caldari Provisions Plantation"
  ],
  [
    60014347,
    10000022,
    "L-A9FS V - Moon 2 - True Power Logistic Support"
  ],
  [
    60014920,
    10000046,
    "L-C3O7 VII - Moon 5 - Serpentis Corporation Cloning"
  ],
  [
    60013792,
    10000017,
    "L-TPN0 I - Jovian Directorate Academy"
  ],
  [
    60013579,
    10000017,
    "L-TPN0 II - Moon 2 - Jove Navy Testing Facilities"
  ],
  [
    60013798,
    10000017,
    "L-TPN0 IV - Moon 13 - Jovian Directorate Academy"
  ],
  [
    60013804,
    10000017,
    "L-TPN0 IV - Moon 6 - Jovian Directorate Treasury"
  ],
  [
    60015008,
    10000033,
    "Laah VIII - Moon 1 - Science and Trade Institute School"
  ],
  [
    60007849,
    10000036,
    "Laddiaha V - Moon 9 - Amarr Civil Service Bureau Offices"
  ],
  [
    60006772,
    10000036,
    "Laddiaha VI - Moon 7 - Ducia Foundry Mining Outpost"
  ],
  [
    60011596,
    10000064,
    "Ladistier VI - Moon 4 - President Bureau"
  ],
  [
    60011659,
    10000037,
    "Laic IX - Moon 2 - Federal Administration Archives"
  ],
  [
    60006832,
    10000038,
    "Lamaa IX - Moon 23 - Ducia Foundry Mineral Reserve"
  ],
  [
    60012115,
    10000032,
    "Lamadent I - Federation Customs Logistic Support"
  ],
  [
    60012625,
    10000042,
    "Lanngisi III - Moon 2 - Sisters of EVE Bureau"
  ],
  [
    60007681,
    10000030,
    "Lantorn VI - Moon 10 - Nurtura Food Packaging"
  ],
  [
    60002605,
    10000030,
    "Lantorn VI - Moon 4 - Expert Distribution Warehouse"
  ],
  [
    60013174,
    10000020,
    "Lari VI - Moon 4 - Genolution Biohazard Containment Facility"
  ],
  [
    60015039,
    10000030,
    "Larkugei IX - Republic Military School"
  ],
  [
    60011065,
    10000044,
    "Larryn II - FedMart Warehouse"
  ],
  [
    60011059,
    10000044,
    "Larryn IX - Moon 4 - FedMart Warehouse"
  ],
  [
    60006904,
    10000044,
    "Larryn V - Moon 1 - Ducia Foundry Mineral Reserve"
  ],
  [
    60004867,
    10000042,
    "Lasleinur II - Moon 3 - Republic Fleet Assembly Plant"
  ],
  [
    60005005,
    10000042,
    "Lasleinur II - Moon 5 - Republic Justice Department Accounting"
  ],
  [
    60001144,
    10000042,
    "Lasleinur IV - Moon 11 - Kaalakiota Corporation Factory"
  ],
  [
    60014143,
    10000042,
    "Lasleinur IV - Moon 16 - Thukker Mix Factory"
  ],
  [
    60004861,
    10000042,
    "Lasleinur V - Moon 11 - Republic Fleet Assembly Plant"
  ],
  [
    60001153,
    10000042,
    "Lasleinur VI - Moon 15 - Kaalakiota Corporation Factory"
  ],
  [
    60012973,
    10000042,
    "Lasleinur VI - Moon 17 - DED Assembly Plant"
  ],
  [
    60010420,
    10000065,
    "Latari X - Moon 4 - Poteque Pharmaceuticals Biotech Research Center"
  ],
  [
    60003280,
    10000064,
    "Laurvier IX - Moon 2 - Modern Finances Depository"
  ],
  [
    60011515,
    10000044,
    "Lazer VIII - Moon 2 - Garoun Investment Bank Depository"
  ],
  [
    60008275,
    10000067,
    "Lela VI - Moon 3 - Amarr Trade Registry Archives"
  ],
  [
    60007105,
    10000067,
    "Lela VII - Moon 22 - Imperial Shipment Storage"
  ],
  [
    60008824,
    10000067,
    "Leran VI - Civic Court Accounting"
  ],
  [
    60014725,
    10000037,
    "Leremblompes IV - Moon 11 - Center for Advanced Studies School"
  ],
  [
    60009304,
    10000037,
    "Leremblompes VIII - Moon 2 - Federal Freight Storage"
  ],
  [
    60012496,
    10000032,
    "Lermireve VIII - Moon 15 - CONCORD Treasury"
  ],
  [
    60014101,
    10000042,
    "Leurtmar III - Thukker Mix Factory"
  ],
  [
    60008611,
    10000065,
    "Leva II - Emperor Family Bureau"
  ],
  [
    60007003,
    10000065,
    "Leva IX - Moon 5 - Imperial Shipment Storage"
  ],
  [
    60007252,
    10000065,
    "Leva IX - Moon 5 - Joint Harvesting Plantation"
  ],
  [
    60006967,
    10000065,
    "Leva VI - Inherent Implants Biotech Production"
  ],
  [
    60008602,
    10000065,
    "Leva XI - Moon 8 - Emperor Family Bureau"
  ],
  [
    60014329,
    10000022,
    "LGK-VP V - Moon 3 - True Power Assembly Plant"
  ],
  [
    60014041,
    10000017,
    "LH-J8H V - Moon 13 - Shapeset Shipyard"
  ],
  [
    60014038,
    10000017,
    "LH-J8H VI - Shapeset Shipyard"
  ],
  [
    60013630,
    10000017,
    "LH-J8H X - Moon 1 - Jove Navy Assembly Plant"
  ],
  [
    60003490,
    10000042,
    "Libold IX - Moon 19 - Caldari Business Tribunal Law School"
  ],
  [
    60005380,
    10000042,
    "Libold IX - Moon 20 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60005392,
    10000042,
    "Libold VII - Moon 5 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60002812,
    10000002,
    "Liekuri VI - Moon 4 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60004216,
    10000002,
    "Liekuri VI - Spacelane Patrol Assembly Plant"
  ],
  [
    60003139,
    10000002,
    "Liekuri VII - Moon 1 - Caldari Funds Unlimited Depository"
  ],
  [
    60002428,
    10000002,
    "Liekuri VII - Moon 22 - Expert Distribution Warehouse"
  ],
  [
    60007363,
    10000065,
    "Liparer I - Joint Harvesting Mining Outpost"
  ],
  [
    60007351,
    10000065,
    "Liparer V - Moon 3 - Joint Harvesting Plantation"
  ],
  [
    60007360,
    10000065,
    "Liparer VIII - Moon 4 - Joint Harvesting Plantation"
  ],
  [
    60010216,
    10000037,
    "Lirsautton I - CreoDron Factory"
  ],
  [
    60011506,
    10000037,
    "Lirsautton IV - Moon 1 - Garoun Investment Bank Depository"
  ],
  [
    60011686,
    10000037,
    "Lirsautton IX - Moon 15 - Federal Administration Information Center"
  ],
  [
    60011695,
    10000037,
    "Lirsautton IX - Moon 3 - Federal Administration Bureau Offices"
  ],
  [
    60009850,
    10000037,
    "Lirsautton VII - Quafe Company Factory"
  ],
  [
    60010618,
    10000037,
    "Lirsautton X - Moon 1 - Egonics Inc. Development Studio"
  ],
  [
    60000121,
    10000064,
    "Lisbaetanne I - CBD Corporation Storage"
  ],
  [
    60010444,
    10000064,
    "Lisbaetanne I - Moon 1 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60012604,
    10000064,
    "Lisbaetanne IV - Moon 15 - Sisters of EVE Bureau"
  ],
  [
    60014728,
    10000064,
    "Lisbaetanne V - Moon 8 - Center for Advanced Studies School"
  ],
  [
    60008296,
    10000036,
    "Lisudeh IV - Moon 13 - Amarr Trade Registry Information Center"
  ],
  [
    60008992,
    10000036,
    "Lisudeh IV - Moon 4 - Theology Council Tribunal"
  ],
  [
    60008218,
    10000036,
    "Lisudeh IV - Moon 9 - Ministry of Internal Order Logistic Support"
  ],
  [
    60001183,
    10000036,
    "Lisudeh V - Moon 10 - Kaalakiota Corporation Factory"
  ],
  [
    60008299,
    10000036,
    "Lisudeh V - Moon 14 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60001177,
    10000036,
    "Lisudeh V - Moon 16 - Kaalakiota Corporation Warehouse"
  ],
  [
    60007045,
    10000036,
    "Lisudeh VI - Moon 18 - Imperial Shipment Storage"
  ],
  [
    60001174,
    10000036,
    "Lisudeh VI - Moon 2 - Kaalakiota Corporation Factory"
  ],
  [
    60002923,
    10000016,
    "Litiura I - Caldari Constructions Production Plant"
  ],
  [
    60007369,
    10000016,
    "Litiura IX - Joint Harvesting Plantation"
  ],
  [
    60000733,
    10000016,
    "Litiura VII - Moon 4 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60002920,
    10000016,
    "Litiura VIII - Caldari Constructions Production Plant"
  ],
  [
    60003877,
    10000016,
    "Litiura VIII - Moon 12 - Caldari Navy Logistic Support"
  ],
  [
    60003124,
    10000016,
    "Litiura VIII - Moon 7 - Caldari Funds Unlimited Vault"
  ],
  [
    60006844,
    10000016,
    "Litiura VIII - Moon 8 - Ducia Foundry Mining Outpost"
  ],
  [
    60012778,
    10000012,
    "Litom III - Salvation Angels Trading Post"
  ],
  [
    60012904,
    10000012,
    "Litom XI - Moon 2 - Guardian Angels Assembly Plant"
  ],
  [
    60012841,
    10000012,
    "LJ-YSW IV - Moon 2 - Serpentis Corporation Reprocessing Facility"
  ],
  [
    60012772,
    10000012,
    "LJ-YSW VI - Moon 14 - Salvation Angels Trading Post"
  ],
  [
    60013066,
    10000012,
    "LJ-YSW VII - Moon 11 - Dominations Logistic Support"
  ],
  [
    60010366,
    10000068,
    "Loes III - Roden Shipyards Factory"
  ],
  [
    60010363,
    10000068,
    "Loes V - Moon 19 - Roden Shipyards Warehouse"
  ],
  [
    60015040,
    10000030,
    "Loguttur I - Republic Military School"
  ],
  [
    60007060,
    10000067,
    "Lor VII - Moon 7 - Imperial Shipment Storage"
  ],
  [
    60008026,
    10000020,
    "Lossa II - Ministry of Assessment Information Center"
  ],
  [
    60005950,
    10000044,
    "Lour V - Moon 13 - Freedom Extension Storage"
  ],
  [
    60009913,
    10000044,
    "Lour VI - Moon 7 - Quafe Company Factory"
  ],
  [
    60012685,
    10000044,
    "Lour VIII - Moon 1 - Sisters of EVE Bureau"
  ],
  [
    60010744,
    10000036,
    "Lower Debyl V - Chemal Tech Factory"
  ],
  [
    60002509,
    10000036,
    "Lower Debyl VII - Moon 13 - Expert Distribution Retail Center"
  ],
  [
    60010747,
    10000036,
    "Lower Debyl VIII - Moon 15 - Chemal Tech Factory"
  ],
  [
    60014884,
    10000003,
    "LS-JEP IX - Moon 1 - Serpentis Corporation Refining"
  ],
  [
    60009940,
    10000041,
    "LSC4-P I - Quafe Company Warehouse"
  ],
  [
    60010075,
    10000030,
    "Lulm III - Quafe Company Factory"
  ],
  [
    60015094,
    10000030,
    "Lulm IV - Tribal Liberation Force Logistic Support"
  ],
  [
    60010408,
    10000030,
    "Lulm V - Moon 10 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60000103,
    10000042,
    "Lumegen I - CBD Corporation Storage"
  ],
  [
    60012283,
    10000042,
    "Lumegen III - CONCORD Academy"
  ],
  [
    60012274,
    10000042,
    "Lumegen IV - Moon 2 - CONCORD Academy"
  ],
  [
    60011419,
    10000042,
    "Lumegen V - Moon 1 - Pend Insurance Vault"
  ],
  [
    60004696,
    10000042,
    "Lumegen V - Moon 1 - Republic Parliament Treasury"
  ],
  [
    60000097,
    10000042,
    "Lumegen V - Moon 2 - CBD Corporation Storage"
  ],
  [
    60004699,
    10000042,
    "Lumegen V - Republic Parliament Academy"
  ],
  [
    60010906,
    10000064,
    "Luminaire III (Astrin) - Moon 1 - Duvolle Laboratories Factory"
  ],
  [
    60011617,
    10000064,
    "Luminaire VII (Caldari Prime) - Federal Administration Information Center"
  ],
  [
    60012004,
    10000064,
    "Luminaire VII (Caldari Prime) - Moon 1 - Federation Customs Testing Facilities"
  ],
  [
    60011623,
    10000064,
    "Luminaire VII (Caldari Prime) - Moon 4 - Federal Administration Bureau Offices"
  ],
  [
    60012007,
    10000064,
    "Luminaire VII (Caldari Prime) - Moon 5 - Federation Customs Assembly Plant"
  ],
  [
    60011749,
    10000064,
    "Luminaire VII (Caldari Prime) - Moon 6 - Federation Navy Assembly Plant"
  ],
  [
    60007168,
    10000043,
    "Luromooh V - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60012103,
    10000068,
    "Luse VI - Moon 1 - Federation Customs Assembly Plant"
  ],
  [
    60011521,
    10000068,
    "Luse VII - Moon 4 - Garoun Investment Bank Depository"
  ],
  [
    60010054,
    10000030,
    "Lustrevik III - Moon 2 - Quafe Company Warehouse"
  ],
  [
    60005014,
    10000030,
    "Lustrevik V - Republic Justice Department Law School"
  ],
  [
    60010060,
    10000030,
    "Lustrevik VII - Moon 14 - Quafe Company Warehouse"
  ],
  [
    60004759,
    10000030,
    "Lustrevik VII - Moon 7 - Republic Fleet Logistic Support"
  ],
  [
    60005737,
    10000030,
    "Lustrevik VII - Moon 7 - Six Kin Development Warehouse"
  ],
  [
    60004609,
    10000030,
    "Lustrevik VII - Moon 9 - Brutor Tribe Academy"
  ],
  [
    60005734,
    10000030,
    "Lustrevik VIII - Moon 7 - Six Kin Development Warehouse"
  ],
  [
    60004612,
    10000030,
    "Lustrevik VIII - Moon 9 - Brutor Tribe Bureau"
  ],
  [
    60005056,
    10000030,
    "Lustrevik VIII - Moon 9 - Republic Security Services Assembly Plant"
  ],
  [
    60014851,
    10000017,
    "M-FDTD I - Material Institute School"
  ],
  [
    60014374,
    10000011,
    "M-MD3B IV - Trust Partners Warehouse"
  ],
  [
    60014059,
    10000011,
    "M-MD3B X - Moon 3 - Thukker Mix Factory"
  ],
  [
    60013063,
    10000012,
    "M-N7WD VIII - Moon 12 - Dominations Assembly Plant"
  ],
  [
    60012766,
    10000012,
    "M-N7WD VIII - Moon 18 - Salvation Angels Trading Post"
  ],
  [
    60013546,
    10000041,
    "M2-CF1 X - Moon 3 - Intaki Syndicate Bureau"
  ],
  [
    60014887,
    10000007,
    "M53-1V VI - Moon 4 - Serpentis Corporation Refining"
  ],
  [
    60013918,
    10000019,
    "M9-OS2 I - Moon 1 - Prosper Depository"
  ],
  [
    60006184,
    10000054,
    "Maalna VI - Moon 16 - Amarr Constructions Warehouse"
  ],
  [
    60008500,
    10000043,
    "Mabnen IV - Moon 1 - Emperor Family Bureau"
  ],
  [
    60010558,
    10000043,
    "Mabnen V - Moon 16 - Impetus Development Studio"
  ],
  [
    60002554,
    10000043,
    "Mabnen V - Moon 5 - Expert Distribution Warehouse"
  ],
  [
    60010561,
    10000043,
    "Mabnen VII - Moon 5 - Impetus Development Studio"
  ],
  [
    60005860,
    10000043,
    "Mabnen VII - Moon 6 - Freedom Extension Storage"
  ],
  [
    60010714,
    10000043,
    "Mabnen VIII - Moon 2 - The Scope Development Studio"
  ],
  [
    60007390,
    10000043,
    "Madimal VI - Moon 18 - Joint Harvesting Food Packaging"
  ],
  [
    60006358,
    10000043,
    "Madirmilire VI - Moon 11 - Carthum Conglomerate Warehouse"
  ],
  [
    60005074,
    10000043,
    "Madirmilire VI - Moon 12 - Republic Security Services Assembly Plant"
  ],
  [
    60006361,
    10000043,
    "Madirmilire VII - Moon 3 - Carthum Conglomerate Warehouse"
  ],
  [
    60007921,
    10000067,
    "Madomi V - Moon 6 - Ministry of War Information Center"
  ],
  [
    60005998,
    10000043,
    "Mai IV - Moon 7 - Freedom Extension Warehouse"
  ],
  [
    60005992,
    10000043,
    "Mai V - Moon 13 - Freedom Extension Storage"
  ],
  [
    60006784,
    10000043,
    "Maiah IV - Moon 1 - Ducia Foundry Refinery"
  ],
  [
    60006787,
    10000043,
    "Maiah VIII - Moon 3 - Ducia Foundry Refinery"
  ],
  [
    60003142,
    10000002,
    "Maila III - Moon 1 - Caldari Funds Unlimited Depository"
  ],
  [
    60000925,
    10000002,
    "Maila IV - Caldari Provisions Warehouse"
  ],
  [
    60006853,
    10000002,
    "Maila IV - Moon 1 - Ducia Foundry Mineral Reserve"
  ],
  [
    60001801,
    10000002,
    "Maila IV - Zainou Biotech Production"
  ],
  [
    60004081,
    10000002,
    "Maila V - Moon 2 - Peace and Order Unit Assembly Plant"
  ],
  [
    60001804,
    10000002,
    "Maila VI - Moon 1 - Zainou Biotech Production"
  ],
  [
    60000916,
    10000002,
    "Maila VI - Moon 2 - Caldari Provisions Plantation"
  ],
  [
    60003046,
    10000002,
    "Maila VII - Expert Housing Warehouse"
  ],
  [
    60010915,
    10000044,
    "Maire IV - Moon 4 - Duvolle Laboratories Factory"
  ],
  [
    60010516,
    10000044,
    "Maire V - Moon 2 - Impetus Development Studio"
  ],
  [
    60009904,
    10000044,
    "Maire V - Moon 2 - Quafe Company Factory"
  ],
  [
    60011956,
    10000044,
    "Maire VI - Moon 23 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60005965,
    10000044,
    "Maire VI - Moon 9 - Freedom Extension Retail Center"
  ],
  [
    60007555,
    10000016,
    "Malkalen I - Nurtura Plantation"
  ],
  [
    60003424,
    10000016,
    "Malkalen II - Mercantile Club Bureau"
  ],
  [
    60003964,
    10000016,
    "Malkalen III - Ishukone Watch Assembly Plant"
  ],
  [
    60003154,
    10000016,
    "Malkalen IV - Moon 1 - Caldari Funds Unlimited Depository"
  ],
  [
    60002065,
    10000016,
    "Malkalen V - Moon 1 - Ishukone Corporation Factory"
  ],
  [
    60009199,
    10000067,
    "Malma I - TransStellar Shipping Storage"
  ],
  [
    60009205,
    10000067,
    "Malma VI - TransStellar Shipping Storage"
  ],
  [
    60007192,
    10000067,
    "Malma VII - Amarr Certified News Development Studio"
  ],
  [
    60009196,
    10000067,
    "Malma X - Moon 2 - TransStellar Shipping Storage"
  ],
  [
    60000061,
    10000038,
    "Malpara II - CBD Corporation Storage"
  ],
  [
    60015041,
    10000030,
    "Malukker I - Republic University"
  ],
  [
    60012937,
    10000043,
    "Mamenkhanar IX - Moon 11 - DED Logistic Support"
  ],
  [
    60006451,
    10000043,
    "Mamet IV - Moon 10 - Imperial Armaments Factory"
  ],
  [
    60006652,
    10000043,
    "Mamet IV - Moon 6 - Zoar and Sons Factory"
  ],
  [
    60006457,
    10000043,
    "Mamet V - Moon 7 - Imperial Armaments Factory"
  ],
  [
    60007978,
    10000067,
    "Manatirid VII - Moon 8 - Ministry of War Archives"
  ],
  [
    60010276,
    10000052,
    "Mandoo III - Moon 11 - CreoDron Factory"
  ],
  [
    60008467,
    10000052,
    "Mandoo III - Moon 13 - Amarr Navy Testing Facilities"
  ],
  [
    60010282,
    10000052,
    "Mandoo III - Moon 5 - CreoDron Factory"
  ],
  [
    60008422,
    10000020,
    "Mani VII - Moon 10 - Amarr Navy Assembly Plant"
  ],
  [
    60004315,
    10000033,
    "Manjonakko VI - Moon 3 - Corporate Police Force Testing Facilities"
  ],
  [
    60010591,
    10000037,
    "Mannar IV - Moon 1 - Egonics Inc. Publisher"
  ],
  [
    60011347,
    10000037,
    "Mannar IV - Moon 4 - Bank of Luminaire Depository"
  ],
  [
    60003277,
    10000037,
    "Mannar IV - Moon 7 - Modern Finances Depository"
  ],
  [
    60011350,
    10000037,
    "Mannar V - Moon 17 - Bank of Luminaire Depository"
  ],
  [
    60003274,
    10000037,
    "Mannar VII - Moon 12 - Modern Finances Depository"
  ],
  [
    60001375,
    10000037,
    "Mannar VII - Moon 18 - Wiyrkomi Corporation Factory"
  ],
  [
    60008122,
    10000054,
    "Marmeha II - Ministry of Assessment Archives"
  ],
  [
    60008119,
    10000054,
    "Marmeha V - Moon 3 - Ministry of Assessment Archives"
  ],
  [
    60010219,
    10000037,
    "Marosier IV - Moon 2 - CreoDron Factory"
  ],
  [
    60011689,
    10000037,
    "Marosier IX - Moon 1 - Federal Administration Information Center"
  ],
  [
    60009862,
    10000037,
    "Marosier VIII - Moon 7 - Quafe Company Retail Center"
  ],
  [
    60015051,
    10000020,
    "Marthia I - Royal Amarr Institute School"
  ],
  [
    60005158,
    10000068,
    "Masalle IX - Republic Security Services Logistic Support"
  ],
  [
    60011905,
    10000068,
    "Masalle VI - Moon 9 - Federation Navy Logistic Support"
  ],
  [
    60005152,
    10000068,
    "Masalle VII - Moon 17 - Republic Security Services Logistic Support"
  ],
  [
    60014491,
    10000068,
    "Masalle VIII - Moon 1 - X-Sense Chemical Refinery"
  ],
  [
    60002218,
    10000065,
    "Masanuh V - Moon 8 - Ishukone Corporation Factory"
  ],
  [
    60006190,
    10000054,
    "Maseera IV - Moon 1 - Amarr Constructions Production Plant"
  ],
  [
    60011461,
    10000054,
    "Maseera VII - Moon 15 - Pend Insurance Depository"
  ],
  [
    60011467,
    10000054,
    "Maseera VII - Moon 5 - Pend Insurance Depository"
  ],
  [
    60012946,
    10000001,
    "Maspah IV - Moon 7 - DED Assembly Plant"
  ],
  [
    60012943,
    10000001,
    "Maspah V - Moon 6 - DED Assembly Plant"
  ],
  [
    60012316,
    10000002,
    "Mastakomon IX - CONCORD Bureau"
  ],
  [
    60012325,
    10000002,
    "Mastakomon IX - Moon 2 - CONCORD Assembly Plant"
  ],
  [
    60013042,
    10000002,
    "Mastakomon IX - Moon 3 - DED Assembly Plant"
  ],
  [
    60012310,
    10000002,
    "Mastakomon V - CONCORD Bureau"
  ],
  [
    60002377,
    10000002,
    "Mastakomon VI - Propel Dynamics Factory"
  ],
  [
    60007504,
    10000002,
    "Mastakomon VII - Joint Harvesting Food Packaging"
  ],
  [
    60012319,
    10000002,
    "Mastakomon VIII - Moon 1 - CONCORD Bureau"
  ],
  [
    60003181,
    10000002,
    "Mastakomon VIII - Moon 2 - Caldari Funds Unlimited Depository"
  ],
  [
    60013048,
    10000002,
    "Mastakomon XI - Moon 2 - DED Assembly Plant"
  ],
  [
    60003178,
    10000002,
    "Mastakomon XII - Caldari Funds Unlimited Depository"
  ],
  [
    60005257,
    10000042,
    "Mateber IX - Moon 15 - Minmatar Mining Corporation Refinery"
  ],
  [
    60005266,
    10000042,
    "Mateber VIII - Moon 5 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60009706,
    10000037,
    "Mattere V - Moon 12 - Astral Mining Inc. Refinery"
  ],
  [
    60006097,
    10000042,
    "Maturat IX - Moon 1 - The Leisure Group Development Studio"
  ],
  [
    60004945,
    10000042,
    "Maturat IX - Moon 15 - Republic Justice Department Tribunal"
  ],
  [
    60004942,
    10000042,
    "Maturat IX - Moon 2 - Republic Justice Department Law School"
  ],
  [
    60001357,
    10000042,
    "Maturat VI - Moon 11 - Wiyrkomi Corporation Factory"
  ],
  [
    60006094,
    10000042,
    "Maturat VI - Moon 13 - The Leisure Group Development Studio"
  ],
  [
    60004510,
    10000042,
    "Maturat VII - Moon 4 - Sebiestor Tribe Bureau"
  ],
  [
    60007609,
    10000020,
    "Matyas V - Moon 19 - Nurtura Food Packaging"
  ],
  [
    60008770,
    10000020,
    "Matyas V - Moon 8 - Tash-Murkon Family Bureau"
  ],
  [
    60009286,
    10000020,
    "Matyas VII - Moon 19 - TransStellar Shipping Storage"
  ],
  [
    60003763,
    10000002,
    "Maurasi IX - Moon 12 - Caldari Navy Assembly Plant"
  ],
  [
    60003454,
    10000002,
    "Maurasi VIII - Moon 14 - Caldari Business Tribunal"
  ],
  [
    60009427,
    10000048,
    "Maut VIII - Inner Zone Shipping Storage"
  ],
  [
    60012760,
    10000012,
    "MDD-79 VIII - Moon 15 - Salvation Angels Warehouse"
  ],
  [
    60008221,
    10000036,
    "Mehatoor I - Ministry of Internal Order Logistic Support"
  ],
  [
    60008305,
    10000036,
    "Mehatoor IV - Amarr Trade Registry Archives"
  ],
  [
    60015137,
    10000036,
    "Mehatoor VI - 24th Imperial Crusade Logistic Support"
  ],
  [
    60004639,
    10000042,
    "Meimungen VI - Republic Parliament Bureau"
  ],
  [
    60012073,
    10000068,
    "Melmaniel VI - Moon 5 - Federation Customs Assembly Plant"
  ],
  [
    60010612,
    10000068,
    "Melmaniel VI - Moon 6 - Egonics Inc. Development Studio"
  ],
  [
    60010369,
    10000068,
    "Melmaniel VII - Moon 8 - Roden Shipyards Factory"
  ],
  [
    60012070,
    10000068,
    "Melmaniel VIII - Moon 11 - Federation Customs Assembly Plant"
  ],
  [
    60005890,
    10000067,
    "Menai IV - Moon 9 - Freedom Extension Warehouse"
  ],
  [
    60008140,
    10000067,
    "Menai V - Ministry of Internal Order Logistic Support"
  ],
  [
    60005878,
    10000067,
    "Menai V - Moon 22 - Freedom Extension Storage"
  ],
  [
    60008071,
    10000036,
    "Mendori IV - Moon 1 - Ministry of Assessment Information Center"
  ],
  [
    60006511,
    10000036,
    "Mendori IX - Moon 9 - Imperial Armaments Factory"
  ],
  [
    60006865,
    10000052,
    "Menri V - Ducia Foundry Mineral Reserve"
  ],
  [
    60015087,
    10000048,
    "Mercomesier III - Federal Defense Union Logistic Support"
  ],
  [
    60009553,
    10000068,
    "Merolles IX - Moon 15 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60015032,
    10000064,
    "Mesokel I - Federal Navy Academy"
  ],
  [
    60010201,
    10000002,
    "Messoya VIII - Moon 6 - CreoDron Factory"
  ],
  [
    60009160,
    10000064,
    "Mesybier II - TransStellar Shipping Storage"
  ],
  [
    60009808,
    10000064,
    "Mesybier VII - Combined Harvest Food Packaging"
  ],
  [
    60009175,
    10000064,
    "Mesybier X - TransStellar Shipping Storage"
  ],
  [
    60009598,
    10000032,
    "Metserel V - Moon 8 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60013351,
    10000044,
    "Meunvon IV - Moon 3 - Impro Factory"
  ],
  [
    60008860,
    10000052,
    "Miah IV - Civic Court Tribunal"
  ],
  [
    60008863,
    10000052,
    "Miah VII - Moon 3 - Civic Court Law School"
  ],
  [
    60009646,
    10000064,
    "Mies I - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60011620,
    10000064,
    "Mies V - Moon 17 - Federal Administration Information Center"
  ],
  [
    60010780,
    10000064,
    "Mies V - Moon 3 - Chemal Tech Warehouse"
  ],
  [
    60011746,
    10000064,
    "Mies V - Moon 3 - Federation Navy Assembly Plant"
  ],
  [
    60010912,
    10000064,
    "Mies VII - Moon 3 - Duvolle Laboratories Factory"
  ],
  [
    60007156,
    10000043,
    "Mikhir II - Imperial Shipment Storage"
  ],
  [
    60006466,
    10000043,
    "Mikhir V - Moon 10 - Imperial Armaments Factory"
  ],
  [
    60007897,
    10000043,
    "Mikhir V - Moon 10 - Ministry of War Information Center"
  ],
  [
    60006469,
    10000043,
    "Mikhir V - Moon 23 - Imperial Armaments Factory"
  ],
  [
    60007732,
    10000043,
    "Mikhir V - Moon 23 - Imperial Chancellor Archives"
  ],
  [
    60007777,
    10000043,
    "Mikhir V - Moon 8 - Amarr Civil Service Bureau Offices"
  ],
  [
    60008254,
    10000043,
    "Mikhir V - Moon 8 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60005671,
    10000043,
    "Mikhir VI - Moon 1 - Core Complexion Inc. Factory"
  ],
  [
    60008257,
    10000043,
    "Mikhir VII - Moon 2 - Amarr Trade Registry Information Center"
  ],
  [
    60009178,
    10000036,
    "Mili V - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60006808,
    10000036,
    "Mili VIII - Moon 10 - Ducia Foundry Refinery"
  ],
  [
    60007864,
    10000036,
    "Mili VIII - Moon 12 - Amarr Civil Service Bureau Offices"
  ],
  [
    60009193,
    10000036,
    "Mili VIII - Moon 9 - TransStellar Shipping Storage"
  ],
  [
    60006814,
    10000036,
    "Mili X - Moon 3 - Ducia Foundry Refinery"
  ],
  [
    60007318,
    10000020,
    "Mimen IX - Joint Harvesting Plantation"
  ],
  [
    60008521,
    10000020,
    "Mimen VIII - Emperor Family Bureau"
  ],
  [
    60008527,
    10000020,
    "Mimen X - Emperor Family Bureau"
  ],
  [
    60006730,
    10000020,
    "Mimen X - Moon 2 - Zoar and Sons Factory"
  ],
  [
    60006727,
    10000020,
    "Mimen X - Zoar and Sons Factory"
  ],
  [
    60007315,
    10000020,
    "Mimen XI - Joint Harvesting Food Packaging"
  ],
  [
    60006145,
    10000052,
    "Minin VI - Moon 9 - Amarr Constructions Production Plant"
  ],
  [
    60011854,
    10000032,
    "Mirilene IV - Moon 1 - Federation Navy Logistic Support"
  ],
  [
    60002479,
    10000032,
    "Mirilene VII - Moon 3 - Expert Distribution Warehouse"
  ],
  [
    60010930,
    10000032,
    "Mirilene VIII - Moon 9 - Duvolle Laboratories Factory"
  ],
  [
    60010318,
    10000032,
    "Miroitem I - Roden Shipyards Factory"
  ],
  [
    60009346,
    10000032,
    "Miroitem VII - Moon 14 - Federal Freight Storage"
  ],
  [
    60013276,
    10000065,
    "Miroona IV - Moon 19 - Impro Factory"
  ],
  [
    60007354,
    10000065,
    "Miroona IV - Moon 19 - Joint Harvesting Plantation"
  ],
  [
    60013279,
    10000065,
    "Miroona IV - Moon 5 - Impro Factory"
  ],
  [
    60006658,
    10000043,
    "Misaba V - Moon 3 - Zoar and Sons Factory"
  ],
  [
    60008461,
    10000065,
    "Misha IV - Moon 3 - Amarr Navy Assembly Plant"
  ],
  [
    60008155,
    10000054,
    "Mishi VI - Moon 1 - Ministry of Internal Order Logistic Support"
  ],
  [
    60012385,
    10000054,
    "Mishi VII - Moon 4 - CONCORD Bureau"
  ],
  [
    60012397,
    10000054,
    "Mishi VIII - CONCORD Assembly Plant"
  ],
  [
    60012040,
    10000032,
    "Misneden IV - Moon 2 - Federation Customs Testing Facilities"
  ],
  [
    60002116,
    10000043,
    "Mista V - Moon 4 - Ishukone Corporation Factory"
  ],
  [
    60014617,
    10000043,
    "Mista VI - Moon 16 - Hedion University"
  ],
  [
    60003061,
    10000002,
    "Mitsolen I - Moon 1 - Expert Housing Warehouse"
  ],
  [
    60005602,
    10000002,
    "Mitsolen IV - Moon 12 - Core Complexion Inc. Warehouse"
  ],
  [
    60000283,
    10000002,
    "Mitsolen IV - Moon 9 - Prompt Delivery Storage"
  ],
  [
    60001480,
    10000002,
    "Mitsolen IV - Rapid Assembly Factory"
  ],
  [
    60012250,
    10000058,
    "MN5N-X VII - Moon 5 - Archangels Assembly Plant"
  ],
  [
    60012253,
    10000058,
    "MN5N-X VIII - Moon 15 - Archangels Assembly Plant"
  ],
  [
    60014880,
    10000060,
    "MO-GZ5 VIII - Moon 2 - Serpentis Corporation Manufacturing"
  ],
  [
    60010990,
    10000048,
    "Moclinamaud I - FedMart Retail Center"
  ],
  [
    60015086,
    10000048,
    "Moclinamaud VII - Federal Defense Union Logistic Support"
  ],
  [
    60009064,
    10000048,
    "Moclinamaud VIII - Moon 11 - TransStellar Shipping Storage"
  ],
  [
    60008314,
    10000052,
    "Mod II - Amarr Trade Registry Bureau Offices"
  ],
  [
    60007573,
    10000001,
    "Mohas I - Nurtura Plantation"
  ],
  [
    60009469,
    10000048,
    "Mollin VI - Moon 5 - Material Acquisition Mining Outpost"
  ],
  [
    60002215,
    10000065,
    "Mora VI - Moon 4 - Ishukone Corporation Factory"
  ],
  [
    60012376,
    10000037,
    "Mormelot I - CONCORD Testing Facilities"
  ],
  [
    60003655,
    10000037,
    "Mormoen II - Caldari Business Tribunal Accounting"
  ],
  [
    60003661,
    10000037,
    "Mormoen IV - Moon 1 - Caldari Business Tribunal Accounting"
  ],
  [
    60003664,
    10000037,
    "Mormoen V - Moon 2 - Caldari Business Tribunal Archives"
  ],
  [
    60011629,
    10000037,
    "Mormoen VI - Moon 2 - Federal Administration Archives"
  ],
  [
    60009523,
    10000037,
    "Mormoen VI - Moon 20 - Material Acquisition Mining Outpost"
  ],
  [
    60005263,
    10000042,
    "Moselgi IV - Minmatar Mining Corporation Refinery"
  ],
  [
    60006076,
    10000042,
    "Moselgi IV - The Leisure Group Development Studio"
  ],
  [
    60005251,
    10000042,
    "Moselgi XI - Minmatar Mining Corporation Refinery"
  ],
  [
    60000829,
    10000033,
    "Motsu III - Minedrill Mineral Reserve"
  ],
  [
    60003376,
    10000033,
    "Motsu VI - Moon 10 - Chief Executive Panel Academy"
  ],
  [
    60000721,
    10000033,
    "Motsu VI - Moon 13 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60002989,
    10000033,
    "Motsu VII - Moon 5 - Caldari Constructions Foundry"
  ],
  [
    60003787,
    10000033,
    "Motsu VII - Moon 6 - Caldari Navy Logistic Support"
  ],
  [
    60001450,
    10000033,
    "Motsu VIII - Moon 1 - Rapid Assembly Warehouse"
  ],
  [
    60014620,
    10000020,
    "Moutid II - Moon 14 - Hedion University"
  ],
  [
    60007129,
    10000020,
    "Moutid II - Moon 7 - Imperial Shipment Storage"
  ],
  [
    60008185,
    10000067,
    "Mozzidit VIII - Ministry of Internal Order Logistic Support"
  ],
  [
    60014879,
    10000059,
    "MP5-KR VI - Moon 1 - Republic Military School Manufacturing"
  ],
  [
    60006892,
    10000052,
    "Munory VII - Moon 9 - Ducia Foundry Mining Outpost"
  ],
  [
    60005170,
    10000043,
    "Murema IV - Republic Security Services Assembly Plant"
  ],
  [
    60012067,
    10000068,
    "Murethand VIII - Moon 2 - Federation Customs Assembly Plant"
  ],
  [
    60001156,
    10000052,
    "Murini II - Moon 6 - Kaalakiota Corporation Warehouse"
  ],
  [
    60006742,
    10000052,
    "Murini III - Moon 18 - Noble Appliances Factory"
  ],
  [
    60004093,
    10000033,
    "Muvolailen IX - Moon 11 - Spacelane Patrol Assembly Plant"
  ],
  [
    60004084,
    10000033,
    "Muvolailen VIII - Moon 2 - Spacelane Patrol Assembly Plant"
  ],
  [
    60001438,
    10000033,
    "Muvolailen VIII - Rapid Assembly Factory"
  ],
  [
    60002767,
    10000033,
    "Muvolailen X - Moon 16 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60000004,
    10000033,
    "Muvolailen X - Moon 3 - CBD Corporation Storage"
  ],
  [
    60001306,
    10000033,
    "Muvolailen X - Moon 7 - Wiyrkomi Corporation Factory"
  ],
  [
    60001684,
    10000033,
    "Muvolailen XI - Moon 3 - Caldari Steel Factory"
  ],
  [
    60013396,
    10000041,
    "MXYS-8 II - Intaki Commerce Warehouse"
  ],
  [
    60013543,
    10000041,
    "MXYS-8 IV - Moon 1 - Intaki Syndicate Treasury"
  ],
  [
    60012058,
    10000037,
    "Mya IV - Moon 2 - Federation Customs Testing Facilities"
  ],
  [
    60015135,
    10000038,
    "Myyhera III - 24th Imperial Crusade Logistic Support"
  ],
  [
    60006364,
    10000038,
    "Myyhera V - Moon 1 - Carthum Conglomerate Factory"
  ],
  [
    60006199,
    10000038,
    "Myyhera VIII - Moon 12 - Amarr Constructions Production Plant"
  ],
  [
    60010774,
    10000038,
    "Myyhera VIII - Moon 12 - Chemal Tech Factory"
  ],
  [
    60006202,
    10000038,
    "Myyhera VIII - Moon 2 - Amarr Constructions Production Plant"
  ],
  [
    60014377,
    10000011,
    "N-DQ0D IV - Trust Partners Trading Post"
  ],
  [
    60013714,
    10000017,
    "N-FKXV V - Moon 12 - Jovian Directorate Academy"
  ],
  [
    60012562,
    10000015,
    "N5Y-4N VII - Moon 20 - Guristas Logistic Support"
  ],
  [
    60014866,
    10000009,
    "N7-BIY IV - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60007174,
    10000043,
    "Nadohman IV - Moon 3 - Imperial Shipment Storage"
  ],
  [
    60007165,
    10000043,
    "Nadohman VIII - Moon 14 - Imperial Shipment Storage"
  ],
  [
    60002503,
    10000036,
    "Naeel III - Moon 1 - Expert Distribution Retail Center"
  ],
  [
    60014521,
    10000036,
    "Naeel III - X-Sense Chemical Storage"
  ],
  [
    60002500,
    10000036,
    "Naeel VI - Moon 15 - Expert Distribution Retail Center"
  ],
  [
    60008773,
    10000020,
    "Nafomeh VII - Moon 18 - Tash-Murkon Family Bureau"
  ],
  [
    60007618,
    10000020,
    "Nafomeh VII - Moon 7 - Nurtura Warehouse"
  ],
  [
    60008767,
    10000020,
    "Nafomeh VIII - Moon 2 - Tash-Murkon Family Bureau"
  ],
  [
    60008005,
    10000020,
    "Nafrivik VIII - Moon 6 - Ministry of War Bureau Offices"
  ],
  [
    60013156,
    10000054,
    "Naga X - Moon 16 - Genolution Biotech Production"
  ],
  [
    60012703,
    10000043,
    "Naguton VIII - Moon 1 - Sisters of EVE Academy"
  ],
  [
    60013018,
    10000065,
    "Nahol II - Moon 1 - DED Assembly Plant"
  ],
  [
    60013021,
    10000065,
    "Nahol IV - DED Assembly Plant"
  ],
  [
    60006172,
    10000065,
    "Nahol VII - Moon 6 - Amarr Constructions Production Plant"
  ],
  [
    60001975,
    10000065,
    "Nahol VII - Moon 8 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60010423,
    10000065,
    "Nahol X - Moon 1 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60013015,
    10000065,
    "Nahol X - Moon 2 - DED Assembly Plant"
  ],
  [
    60013831,
    10000049,
    "Nahrneder VI - Moon 15 - Khanid Transport Storage"
  ],
  [
    60007780,
    10000065,
    "Nahyeen IX - Moon 1 - Amarr Civil Service Information Center"
  ],
  [
    60008701,
    10000065,
    "Nahyeen IX - Moon 3 - Kor-Azor Family Bureau"
  ],
  [
    60008200,
    10000065,
    "Nahyeen IX - Moon 3 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60008209,
    10000065,
    "Nahyeen VI - Ministry of Internal Order Assembly Plant"
  ],
  [
    60007786,
    10000065,
    "Nahyeen VII - Amarr Civil Service Bureau Offices"
  ],
  [
    60006643,
    10000065,
    "Nahyeen VII - Zoar and Sons Factory"
  ],
  [
    60008695,
    10000065,
    "Nahyeen VIII - Moon 1 - Kor-Azor Family Bureau"
  ],
  [
    60008263,
    10000067,
    "Naka VI - Moon 2 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60014068,
    10000001,
    "Nakah I - Moon 1 - Thukker Mix Factory"
  ],
  [
    60012169,
    10000001,
    "Nakah IV - Moon 1 - Ammatar Fleet Logistic Support"
  ],
  [
    60008536,
    10000036,
    "Nakatre II - Emperor Family Bureau"
  ],
  [
    60003640,
    10000036,
    "Nakatre III - Moon 1 - Caldari Business Tribunal"
  ],
  [
    60006619,
    10000036,
    "Nakatre III - Zoar and Sons Factory"
  ],
  [
    60006622,
    10000036,
    "Nakatre IX - Zoar and Sons Factory"
  ],
  [
    60003646,
    10000036,
    "Nakatre VI - Moon 2 - Caldari Business Tribunal Information Center"
  ],
  [
    60006625,
    10000036,
    "Nakatre VI - Moon 3 - Zoar and Sons Factory"
  ],
  [
    60006616,
    10000036,
    "Nakatre VIII - Moon 13 - Zoar and Sons Factory"
  ],
  [
    60003634,
    10000036,
    "Nakatre VIII - Moon 16 - Caldari Business Tribunal"
  ],
  [
    60007822,
    10000065,
    "Nakregde I - Amarr Civil Service Bureau Offices"
  ],
  [
    60007183,
    10000065,
    "Nakregde II - Amarr Certified News Development Studio"
  ],
  [
    60007249,
    10000065,
    "Nakregde IV - Joint Harvesting Food Packaging"
  ],
  [
    60007012,
    10000065,
    "Nakregde VI - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60008605,
    10000065,
    "Nakregde VII - Moon 1 - Emperor Family Bureau"
  ],
  [
    60007006,
    10000065,
    "Nakregde VII - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60007816,
    10000065,
    "Nakregde VIII - Moon 2 - Amarr Civil Service Information Center"
  ],
  [
    60008671,
    10000043,
    "Nakri V - Moon 5 - Sarum Family Assembly Plant"
  ],
  [
    60008428,
    10000043,
    "Nakri VI - Moon 1 - Amarr Navy Logistic Support"
  ],
  [
    60005995,
    10000043,
    "Nakri VI - Moon 4 - Freedom Extension Storage"
  ],
  [
    60004546,
    10000042,
    "Nakugard V - Moon 12 - Krusual Tribe Bureau"
  ],
  [
    60014806,
    10000042,
    "Nakugard V - Republic University"
  ],
  [
    60004549,
    10000042,
    "Nakugard VII - Moon 12 - Krusual Tribe Bureau"
  ],
  [
    60004543,
    10000042,
    "Nakugard VII - Moon 2 - Krusual Tribe Bureau"
  ],
  [
    60001123,
    10000054,
    "Nalnifan II - Moon 8 - Kaalakiota Corporation Factory"
  ],
  [
    60013003,
    10000054,
    "Nalnifan IV - Moon 2 - DED Assembly Plant"
  ],
  [
    60001129,
    10000054,
    "Nalnifan VI - Moon 20 - Kaalakiota Corporation Factory"
  ],
  [
    60008446,
    10000054,
    "Nalnifan VI - Moon 3 - Amarr Navy Assembly Plant"
  ],
  [
    60007945,
    10000054,
    "Nalnifan VI - Moon 3 - Ministry of War Information Center"
  ],
  [
    60007177,
    10000043,
    "Nalu VII - Moon 11 - Imperial Shipment Storage"
  ],
  [
    60007180,
    10000043,
    "Nalu VII - Moon 4 - Imperial Shipment Storage"
  ],
  [
    60012955,
    10000043,
    "Nalu VII - Moon 7 - DED Testing Facilities"
  ],
  [
    60008737,
    10000043,
    "Nalu X - Moon 1 - Ardishapur Family Treasury"
  ],
  [
    60008734,
    10000043,
    "Nalu X - Moon 4 - Ardishapur Family Academy"
  ],
  [
    60004477,
    10000016,
    "Nalvula IV - Moon 1 - Science and Trade Institute School"
  ],
  [
    60004150,
    10000016,
    "Nalvula IX - Moon 2 - Spacelane Patrol Assembly Plant"
  ],
  [
    60006340,
    10000043,
    "Namaili IV - Carthum Conglomerate Production Plant"
  ],
  [
    60003694,
    10000043,
    "Namaili V - Moon 7 - Caldari Business Tribunal Law School"
  ],
  [
    60003703,
    10000043,
    "Namaili VI - Moon 25 - Caldari Business Tribunal Archives"
  ],
  [
    60007123,
    10000043,
    "Namaili VII - Imperial Shipment Storage"
  ],
  [
    60006343,
    10000043,
    "Namaili VII - Moon 2 - Carthum Conglomerate Warehouse"
  ],
  [
    60013966,
    10000049,
    "Nandeza IX - Moon 13 - Royal Khanid Navy Assembly Plant"
  ],
  [
    60011173,
    10000016,
    "Nani I - Aliastra Warehouse"
  ],
  [
    60011170,
    10000016,
    "Nani IV - Moon 2 - Aliastra Warehouse"
  ],
  [
    60010438,
    10000016,
    "Nani V - Moon 18 - Poteque Pharmaceuticals Biohazard Containment Facility"
  ],
  [
    60010441,
    10000016,
    "Nani VIII - Moon 2 - Poteque Pharmaceuticals Biohazard Containment Facility"
  ],
  [
    60013207,
    10000016,
    "Nannaras III - Moon 1 - Genolution Biotech Production"
  ],
  [
    60003976,
    10000016,
    "Nannaras VII - Ishukone Watch Assembly Plant"
  ],
  [
    60002350,
    10000016,
    "Nannaras VII - Moon 1 - Lai Dai Corporation Factory"
  ],
  [
    60001669,
    10000016,
    "Nannaras VIII - Moon 1 - Caldari Steel Factory"
  ],
  [
    60008749,
    10000043,
    "Narai III - Moon 1 - Ardishapur Family Bureau"
  ],
  [
    60005674,
    10000043,
    "Narai IX - Moon 1 - Core Complexion Inc. Factory"
  ],
  [
    60007735,
    10000043,
    "Narai VIII - Moon 8 - Imperial Chancellor Bureau Offices"
  ],
  [
    60010657,
    10000067,
    "Nardiarang II - The Scope Development Studio"
  ],
  [
    60010654,
    10000067,
    "Nardiarang VI - The Scope Development Studio"
  ],
  [
    60010465,
    10000065,
    "Nare IV - Moon 6 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60003481,
    10000065,
    "Nare VI - Moon 1 - Caldari Business Tribunal"
  ],
  [
    60008560,
    10000065,
    "Nare VI - Moon 16 - Emperor Family Bureau"
  ],
  [
    60002575,
    10000065,
    "Nare VII - Moon 19 - Expert Distribution Retail Center"
  ],
  [
    60010849,
    10000020,
    "Nasesharafa VIII - Moon 3 - Chemal Tech Warehouse"
  ],
  [
    60001057,
    10000067,
    "Nasreri III - Moon 1 - Kaalakiota Corporation Factory"
  ],
  [
    60008356,
    10000067,
    "Nasreri V - Moon 4 - Amarr Trade Registry Information Center"
  ],
  [
    60008365,
    10000067,
    "Nasreri VII - Moon 4 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60001213,
    10000032,
    "Nausschie IX - Kaalakiota Corporation Warehouse"
  ],
  [
    60001321,
    10000032,
    "Nausschie IX - Moon 2 - Wiyrkomi Corporation Factory"
  ],
  [
    60001225,
    10000032,
    "Nausschie VI - Kaalakiota Corporation Factory"
  ],
  [
    60001327,
    10000032,
    "Nausschie XI - Moon 10 - Wiyrkomi Corporation Factory"
  ],
  [
    60000205,
    10000065,
    "Nebian II - CBD Corporation Storage"
  ],
  [
    60008716,
    10000065,
    "Nebian V - Moon 14 - Kor-Azor Family Bureau"
  ],
  [
    60010501,
    10000065,
    "Nebian VIII - Moon 2 - Impetus Development Studio"
  ],
  [
    60008584,
    10000065,
    "Nebian VIII - Moon 4 - Emperor Family Bureau"
  ],
  [
    60007951,
    10000054,
    "Ned IV - Ministry of War Archives"
  ],
  [
    60007468,
    10000042,
    "Nedegulf V - Joint Harvesting Plantation"
  ],
  [
    60012352,
    10000042,
    "Nedegulf VII - Moon 4 - CONCORD Academy"
  ],
  [
    60007474,
    10000042,
    "Nedegulf VIII - Moon 10 - Joint Harvesting Mining Outpost"
  ],
  [
    60007462,
    10000042,
    "Nedegulf VIII - Moon 13 - Joint Harvesting Plantation"
  ],
  [
    60004630,
    10000042,
    "Nedegulf VIII - Moon 5 - Republic Parliament Academy"
  ],
  [
    60010711,
    10000065,
    "Neesher V - The Scope Development Studio"
  ],
  [
    60005179,
    10000065,
    "Neesher VI - Moon 15 - Republic Security Services Assembly Plant"
  ],
  [
    60005176,
    10000065,
    "Neesher VI - Moon 20 - Republic Security Services Assembly Plant"
  ],
  [
    60007636,
    10000020,
    "Nehkiah II - Moon 2 - Nurtura Food Packaging"
  ],
  [
    60009988,
    10000020,
    "Nehkiah II - Quafe Company Retail Center"
  ],
  [
    60002083,
    10000020,
    "Nehkiah IV - Moon 12 - Ishukone Corporation Factory"
  ],
  [
    60007297,
    10000020,
    "Nehkiah IV - Moon 14 - Joint Harvesting Plantation"
  ],
  [
    60009979,
    10000020,
    "Nehkiah IV - Moon 14 - Quafe Company Factory"
  ],
  [
    60007306,
    10000020,
    "Nehkiah IV - Moon 3 - Joint Harvesting Plantation"
  ],
  [
    60009985,
    10000020,
    "Nehkiah IV - Moon 7 - Quafe Company Factory"
  ],
  [
    60010753,
    10000042,
    "Nein II - Chemal Tech Factory"
  ],
  [
    60004660,
    10000042,
    "Nein IV - Republic Parliament Bureau"
  ],
  [
    60013273,
    10000042,
    "Nein VII - Moon 4 - Impro Factory"
  ],
  [
    60014623,
    10000054,
    "Nema X - Moon 6 - Hedion University"
  ],
  [
    60015126,
    10000069,
    "Nennamaila X - Wiyrkomi Peace Corps Assembly Plant"
  ],
  [
    60006100,
    10000043,
    "Nererut II - Moon 1 - Amarr Constructions Production Plant"
  ],
  [
    60006106,
    10000043,
    "Nererut V - Moon 12 - Amarr Constructions Production Plant"
  ],
  [
    60010792,
    10000043,
    "Nererut VIII - Moon 2 - Chemal Tech Factory"
  ],
  [
    60008113,
    10000038,
    "Netsalakka I - Ministry of Assessment Bureau Offices"
  ],
  [
    60010771,
    10000038,
    "Netsalakka VII - Moon 2 - Chemal Tech Factory"
  ],
  [
    60006373,
    10000038,
    "Netsalakka VIII - Carthum Conglomerate Factory"
  ],
  [
    60000688,
    10000002,
    "New Caldari I (Matigu) - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60014935,
    10000002,
    "New Caldari II (Matias) - Kaalakiota Corporation Factory"
  ],
  [
    60003334,
    10000002,
    "New Caldari Prime - Moon 1 - Chief Executive Panel Bureau"
  ],
  [
    60000682,
    10000002,
    "New Caldari Prime - Moon 1 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60003724,
    10000002,
    "New Caldari V (Oniteseru) - Moon 2 - House of Records Archives"
  ],
  [
    60011584,
    10000032,
    "Ney IV - University of Caille"
  ],
  [
    60000037,
    10000032,
    "Ney X - Moon 12 - CBD Corporation Storage"
  ],
  [
    60000022,
    10000032,
    "Ney X - Moon 15 - CBD Corporation Storage"
  ],
  [
    60012403,
    10000049,
    "Neyi VII - Moon 7 - CONCORD Academy"
  ],
  [
    60012940,
    10000043,
    "Neziel I - DED Assembly Plant"
  ],
  [
    60008206,
    10000065,
    "Nibainkier VII - Ministry of Internal Order Assembly Plant"
  ],
  [
    60011752,
    10000044,
    "Niballe V - Moon 1 - Federation Navy Testing Facilities"
  ],
  [
    60010645,
    10000052,
    "Nidupad VIII - Moon 17 - The Scope Publisher"
  ],
  [
    60009220,
    10000042,
    "Nifflung VII - Moon 9 - TransStellar Shipping Storage"
  ],
  [
    60010795,
    10000043,
    "Nifshed X - Moon 1 - Chemal Tech Warehouse"
  ],
  [
    60014407,
    10000001,
    "Nikh V - Moon 2 - Trust Partners Trading Post"
  ],
  [
    60004318,
    10000033,
    "Nikkishina IX - Moon 6 - Corporate Police Force Logistic Support"
  ],
  [
    60007258,
    10000065,
    "Nishah IV - Moon 9 - Joint Harvesting Mining Outpost"
  ],
  [
    60007255,
    10000065,
    "Nishah V - Moon 12 - Joint Harvesting Mining Outpost"
  ],
  [
    60007009,
    10000065,
    "Nishah VI - Moon 14 - Imperial Shipment Storage"
  ],
  [
    60007825,
    10000065,
    "Nishah VII - Moon 1 - Amarr Civil Service Archives"
  ],
  [
    60008608,
    10000065,
    "Nishah VII - Moon 5 - Emperor Family Treasury"
  ],
  [
    60008689,
    10000065,
    "Nishah VII - Moon 5 - Kor-Azor Family Treasury"
  ],
  [
    60015073,
    10000069,
    "Nisuwa VII - State Protectorate Logistic Support"
  ],
  [
    60003769,
    10000002,
    "Niyabainen IV - Moon 1 - Caldari Navy Assembly Plant"
  ],
  [
    60003457,
    10000002,
    "Niyabainen IX - Moon 10 - Caldari Business Tribunal Accounting"
  ],
  [
    60003766,
    10000002,
    "Niyabainen IX - Moon 19 - Caldari Navy Logistic Support"
  ],
  [
    60000457,
    10000002,
    "Niyabainen IX - Moon 21 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60003052,
    10000002,
    "Niyabainen IX - Moon 4 - Expert Housing Production Plant"
  ],
  [
    60000460,
    10000002,
    "Niyabainen IX - Moon 8 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60002950,
    10000002,
    "Niyabainen IX - Moon 9 - Caldari Constructions Warehouse"
  ],
  [
    60006886,
    10000002,
    "Niyabainen VII - Moon 11 - Ducia Foundry Mineral Reserve"
  ],
  [
    60000691,
    10000002,
    "Niyabainen VII - Moon 2 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60006883,
    10000002,
    "Niyabainen VIII - Moon 16 - Ducia Foundry Mining Outpost"
  ],
  [
    60000454,
    10000002,
    "Niyabainen VIII - Moon 16 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60003058,
    10000002,
    "Niyabainen VIII - Moon 6 - Expert Housing Production Plant"
  ],
  [
    60012589,
    10000057,
    "NM-OEA V - Moon 4 - Outer Ring Excavations Mining Outpost"
  ],
  [
    60012592,
    10000057,
    "NM-OEA VI - Moon 23 - Outer Ring Excavations Mining Outpost"
  ],
  [
    60010210,
    10000064,
    "Noghere VII - Moon 15 - CreoDron Warehouse"
  ],
  [
    60005512,
    10000064,
    "Noghere VIII - Moon 1 - Core Complexion Inc. Factory"
  ],
  [
    60010213,
    10000064,
    "Noghere VIII - Moon 18 - CreoDron Warehouse"
  ],
  [
    60014926,
    10000060,
    "NOL-M9 VI - Moon 2 - Serpentis Corporation Cloning"
  ],
  [
    60003079,
    10000002,
    "Nomaa I - Expert Housing Production Plant"
  ],
  [
    60004231,
    10000002,
    "Nomaa IV - Moon 2 - Spacelane Patrol Assembly Plant"
  ],
  [
    60003085,
    10000002,
    "Nomaa VI - Moon 4 - Expert Housing Production Plant"
  ],
  [
    60002917,
    10000016,
    "Nonni I - Caldari Constructions Production Plant"
  ],
  [
    60003862,
    10000016,
    "Nonni I - Caldari Navy Assembly Plant"
  ],
  [
    60000982,
    10000016,
    "Nonni I - Kaalakiota Corporation Factory"
  ],
  [
    60002308,
    10000016,
    "Nonni I - Lai Dai Corporation Factory"
  ],
  [
    60006847,
    10000016,
    "Nonni II - Ducia Foundry Refinery"
  ],
  [
    60003127,
    10000016,
    "Nonni III - Caldari Funds Unlimited Depository"
  ],
  [
    60000268,
    10000016,
    "Nonni III - CBD Corporation Storage"
  ],
  [
    60004000,
    10000016,
    "Nonni III - Home Guard Testing Facilities"
  ],
  [
    60004006,
    10000016,
    "Nonni III - Moon 1 - Home Guard Assembly Plant"
  ],
  [
    60000976,
    10000016,
    "Nonni III - Moon 1 - Kaalakiota Corporation Factory"
  ],
  [
    60000730,
    10000016,
    "Nonni III - Poksu Mineral Group Refinery"
  ],
  [
    60003871,
    10000016,
    "Nonni IV - Caldari Navy Assembly Plant"
  ],
  [
    60000262,
    10000016,
    "Nonni IV - CBD Corporation Storage"
  ],
  [
    60000988,
    10000016,
    "Nonni IV - Kaalakiota Corporation Factory"
  ],
  [
    60001516,
    10000016,
    "Nonni IV - Rapid Assembly Factory"
  ],
  [
    60003874,
    10000016,
    "Nonni V - Caldari Navy Assembly Plant"
  ],
  [
    60002311,
    10000016,
    "Nonni V - Lai Dai Corporation Factory"
  ],
  [
    60001519,
    10000016,
    "Nonni V - Rapid Assembly Factory"
  ],
  [
    60000259,
    10000016,
    "Nonni VI - CBD Corporation Storage"
  ],
  [
    60000985,
    10000016,
    "Nonni VI - Kaalakiota Corporation Factory"
  ],
  [
    60007381,
    10000016,
    "Nonni VI - Moon 1 - Joint Harvesting Refinery"
  ],
  [
    60000991,
    10000016,
    "Nonni VI - Moon 1 - Kaalakiota Corporation Factory"
  ],
  [
    60007714,
    10000067,
    "Noranim IV - Moon 16 - Royal Amarr Institute School"
  ],
  [
    60009148,
    10000052,
    "Nordar III - TransStellar Shipping Storage"
  ],
  [
    60006736,
    10000052,
    "Nordar VI - Moon 6 - Noble Appliances Factory"
  ],
  [
    60011386,
    10000020,
    "Nosodnis VII - Pend Insurance Vault"
  ],
  [
    60015129,
    10000069,
    "Notoras II - Lai Dai Protection Service Assembly Plant"
  ],
  [
    60015128,
    10000069,
    "Notoras III - Caldari Navy Assembly Plant"
  ],
  [
    60015127,
    10000069,
    "Notoras V - Caldari Navy Assembly Plant"
  ],
  [
    60003298,
    10000016,
    "Nourvukaiken II - Moon 1 - Modern Finances Depository"
  ],
  [
    60003832,
    10000016,
    "Nourvukaiken III - Caldari Navy Assembly Plant"
  ],
  [
    60003946,
    10000016,
    "Nourvukaiken III - Moon 1 - Lai Dai Protection Service Assembly Plant"
  ],
  [
    60001660,
    10000016,
    "Nourvukaiken IV - Moon 2 - Caldari Steel Factory"
  ],
  [
    60015133,
    10000016,
    "Nourvukaiken V - State Protectorate Logistic Support"
  ],
  [
    60003949,
    10000016,
    "Nourvukaiken VI - Lai Dai Protection Service Assembly Plant"
  ],
  [
    60003223,
    10000016,
    "Nourvukaiken VI - Moon 2 - State and Region Bank Depository"
  ],
  [
    60003835,
    10000016,
    "Nourvukaiken VII - Moon 10 - Caldari Navy Assembly Plant"
  ],
  [
    60003301,
    10000016,
    "Nourvukaiken VII - Moon 13 - Modern Finances Depository"
  ],
  [
    60003841,
    10000016,
    "Nourvukaiken VII - Moon 14 - Caldari Navy Assembly Plant"
  ],
  [
    60000376,
    10000016,
    "Nourvukaiken VII - Moon 18 - Ytiri Storage"
  ],
  [
    60002962,
    10000016,
    "Nourvukaiken VII - Moon 4 - Caldari Constructions Production Plant"
  ],
  [
    60003220,
    10000016,
    "Nourvukaiken VII - Moon 8 - State and Region Bank Depository"
  ],
  [
    60014323,
    10000022,
    "NRT4-U II - True Power Logistic Support"
  ],
  [
    60000877,
    10000002,
    "Nuken VI - Moon 12 - Caldari Provisions Plantation"
  ],
  [
    60000523,
    10000002,
    "Nuken VII - Moon 20 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60002356,
    10000002,
    "Nuken VIII - Moon 7 - Lai Dai Corporation Research Center"
  ],
  [
    60014161,
    10000022,
    "NZG-LF III - Moon 11 - True Creations Shipyard"
  ],
  [
    60014158,
    10000022,
    "NZG-LF III - Moon 5 - True Creations Shipyard"
  ],
  [
    60014293,
    10000022,
    "NZG-LF VI - True Power Assembly Plant"
  ],
  [
    60014904,
    10000061,
    "NZW-ZO VII - Moon 1 - Serpentis Corporation Refining"
  ],
  [
    60014278,
    10000022,
    "O-FTHE V - True Creations Storage Bay"
  ],
  [
    60014359,
    10000022,
    "O5Y3-W VI - Moon 1 - True Power Logistic Support"
  ],
  [
    60014179,
    10000022,
    "O5Y3-W VII - Moon 3 - True Creations Shipyard"
  ],
  [
    60007498,
    10000002,
    "Obe V - Joint Harvesting Plantation"
  ],
  [
    60000964,
    10000002,
    "Obe VI - Caldari Provisions Plantation"
  ],
  [
    60007495,
    10000002,
    "Obe VI - Moon 1 - Joint Harvesting Plantation"
  ],
  [
    60013045,
    10000002,
    "Obe VI - Moon 2 - DED Testing Facilities"
  ],
  [
    60009736,
    10000044,
    "Octanneve I - Combined Harvest Food Packaging"
  ],
  [
    60010918,
    10000044,
    "Octanneve III - Duvolle Laboratories Factory"
  ],
  [
    60012082,
    10000044,
    "Octanneve III - Federation Customs Assembly Plant"
  ],
  [
    60012079,
    10000044,
    "Octanneve III - Moon 1 - Federation Customs Logistic Support"
  ],
  [
    60012085,
    10000044,
    "Octanneve IV - Federation Customs Assembly Plant"
  ],
  [
    60009739,
    10000044,
    "Octanneve IV - Moon 1 - Combined Harvest Food Packaging"
  ],
  [
    60005962,
    10000044,
    "Octanneve IV - Moon 1 - Freedom Extension Retail Center"
  ],
  [
    60010660,
    10000044,
    "Octanneve IV - The Scope Development Studio"
  ],
  [
    60009499,
    10000044,
    "Octanneve V - Material Acquisition Mineral Reserve"
  ],
  [
    60012076,
    10000044,
    "Octanneve V - Moon 1 - Federation Customs Assembly Plant"
  ],
  [
    60012691,
    10000044,
    "Octanneve V - Sisters of EVE Bureau"
  ],
  [
    60009109,
    10000030,
    "Odatrik IX - Moon 2 - Urban Management Storage"
  ],
  [
    60009112,
    10000030,
    "Odatrik V - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60009115,
    10000030,
    "Odatrik VIII - Moon 3 - TransStellar Shipping Storage"
  ],
  [
    60007273,
    10000028,
    "Oddelulf I - Joint Harvesting Refinery"
  ],
  [
    60006073,
    10000028,
    "Oddelulf VII - Moon 1 - The Leisure Group Development Studio"
  ],
  [
    60012631,
    10000042,
    "Odebeinn III - Moon 10 - Sisters of EVE Academy"
  ],
  [
    60005812,
    10000042,
    "Odebeinn III - Moon 13 - Freedom Extension Storage"
  ],
  [
    60005821,
    10000042,
    "Odebeinn IV - Freedom Extension Warehouse"
  ],
  [
    60001030,
    10000042,
    "Odebeinn V - Moon 5 - Kaalakiota Corporation Factory"
  ],
  [
    60010945,
    10000032,
    "Odette VII - Moon 6 - Duvolle Laboratories Factory"
  ],
  [
    60011062,
    10000044,
    "Odinesyn VIII - Moon 15 - FedMart Warehouse"
  ],
  [
    60011656,
    10000037,
    "Odixie VII - Moon 1 - Federal Administration Bureau Offices"
  ],
  [
    60015013,
    10000032,
    "Odotte III - University of Caille"
  ],
  [
    60009907,
    10000044,
    "Oerse V - Moon 4 - Quafe Company Factory"
  ],
  [
    60009916,
    10000044,
    "Oerse VI - Moon 10 - Quafe Company Retail Center"
  ],
  [
    60009493,
    10000044,
    "Oerse VI - Moon 6 - Material Acquisition Mineral Reserve"
  ],
  [
    60010921,
    10000044,
    "Oerse VII - Moon 8 - Duvolle Laboratories Factory"
  ],
  [
    60006055,
    10000030,
    "Offugen VII - Moon 15 - The Leisure Group Development Studio"
  ],
  [
    60005848,
    10000030,
    "Offugen VII - Moon 8 - Freedom Extension Storage"
  ],
  [
    60015103,
    10000042,
    "Ofstold IV - Tribal Liberation Force Logistic Support"
  ],
  [
    60004864,
    10000042,
    "Ofstold V - Moon 13 - Republic Fleet Logistic Support"
  ],
  [
    60004996,
    10000042,
    "Ofstold VI - Moon 15 - Republic Justice Department Law School"
  ],
  [
    60010354,
    10000044,
    "Ogaria I - Roden Shipyards Warehouse"
  ],
  [
    60009631,
    10000044,
    "Ogaria II - Astral Mining Inc. Mining Outpost"
  ],
  [
    60005023,
    10000042,
    "Ogoten XII - Moon 2 - Republic Justice Department Accounting"
  ],
  [
    60007051,
    10000036,
    "Ohide II - Imperial Shipment Storage"
  ],
  [
    60007039,
    10000036,
    "Ohide VI - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60001186,
    10000036,
    "Ohide VI - Moon 2 - Kaalakiota Corporation Warehouse"
  ],
  [
    60001180,
    10000036,
    "Ohide VIII - Moon 6 - Kaalakiota Corporation Factory"
  ],
  [
    60004375,
    10000002,
    "Ohkunen IV - Moon 10 - Corporate Police Force Testing Facilities"
  ],
  [
    60000484,
    10000002,
    "Ohkunen V - Moon 19 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60007510,
    10000002,
    "Ohkunen VI - Joint Harvesting Mining Outpost"
  ],
  [
    60000397,
    10000002,
    "Ohmahailen IV - Moon 2 - Ytiri Storage"
  ],
  [
    60003112,
    10000002,
    "Ohmahailen V - Moon 12 - Expert Housing Production Plant"
  ],
  [
    60004360,
    10000002,
    "Ohmahailen V - Moon 6 - Corporate Police Force Assembly Plant"
  ],
  [
    60004369,
    10000002,
    "Ohmahailen V - Moon 7 - Corporate Police Force Assembly Plant"
  ],
  [
    60004114,
    10000033,
    "Ohvosamon VII - Spacelane Patrol Logistic Support"
  ],
  [
    60001342,
    10000033,
    "Oichiya I - Wiyrkomi Corporation Factory"
  ],
  [
    60002995,
    10000033,
    "Oichiya VI - Moon 1 - Caldari Constructions Production Plant"
  ],
  [
    60003778,
    10000033,
    "Oichiya VI - Moon 19 - Caldari Navy Assembly Plant"
  ],
  [
    60000418,
    10000033,
    "Oichiya VII - Moon 6 - Ytiri Storage"
  ],
  [
    60011011,
    10000048,
    "Oicx VI - Moon 11 - FedMart Warehouse"
  ],
  [
    60000325,
    10000033,
    "Oijamon III - Moon 12 - Ytiri Storage"
  ],
  [
    60003508,
    10000033,
    "Oijamon V - Moon 2 - Caldari Business Tribunal Accounting"
  ],
  [
    60003511,
    10000033,
    "Oijamon V - Moon 4 - Caldari Business Tribunal"
  ],
  [
    60004108,
    10000033,
    "Oijamon VI - Moon 17 - Spacelane Patrol Assembly Plant"
  ],
  [
    60004141,
    10000016,
    "Oimmo IV - Moon 10 - Spacelane Patrol Assembly Plant"
  ],
  [
    60003820,
    10000016,
    "Oimmo V - Moon 1 - Caldari Navy Assembly Plant"
  ],
  [
    60001501,
    10000016,
    "Oimmo V - Moon 4 - Rapid Assembly Factory"
  ],
  [
    60003817,
    10000016,
    "Oimmo VII - Caldari Navy Assembly Plant"
  ],
  [
    60002167,
    10000016,
    "Oimmo VII - Moon 10 - Ishukone Corporation Factory"
  ],
  [
    60003598,
    10000016,
    "Oimmo VII - Moon 2 - Caldari Business Tribunal"
  ],
  [
    60003727,
    10000033,
    "Oiniken III - Moon 1 - House of Records Information Center"
  ],
  [
    60010540,
    10000033,
    "Oiniken VII - Moon 2 - Impetus Development Studio"
  ],
  [
    60010543,
    10000033,
    "Oiniken XI - Moon 12 - Impetus Development Studio"
  ],
  [
    60003985,
    10000016,
    "Oipo II - Moon 19 - Ishukone Watch Logistic Support"
  ],
  [
    60002320,
    10000016,
    "Oipo II - Moon 21 - Lai Dai Corporation Factory"
  ],
  [
    60004198,
    10000016,
    "Oipo III - Moon 8 - Spacelane Patrol Logistic Support"
  ],
  [
    60004345,
    10000016,
    "Oipo IV - Corporate Police Force Assembly Plant"
  ],
  [
    60004339,
    10000016,
    "Oipo IV - Moon 10 - Corporate Police Force Assembly Plant"
  ],
  [
    60015014,
    10000032,
    "Oirtlair VI - Moon 1 - University of Caille"
  ],
  [
    60000808,
    10000016,
    "Oishami VII - Moon 12 - Minedrill Mining Outpost"
  ],
  [
    60000562,
    10000033,
    "Oisio III - Moon 1 - Hyasyoda Corporation Refinery"
  ],
  [
    60003856,
    10000033,
    "Oisio V - Moon 1 - Caldari Navy Assembly Plant"
  ],
  [
    60003859,
    10000033,
    "Oisio V - Moon 10 - Caldari Navy Assembly Plant"
  ],
  [
    60003844,
    10000033,
    "Oisio V - Moon 6 - Caldari Navy Assembly Plant"
  ],
  [
    60004417,
    10000033,
    "Oisio VI - Moon 1 - Corporate Police Force Assembly Plant"
  ],
  [
    60015106,
    10000069,
    "Okagaiken IV - Caldari Navy Logistic Support"
  ],
  [
    60015122,
    10000069,
    "Okkamon III - Home Guard Assembly Plant"
  ],
  [
    60015121,
    10000069,
    "Okkamon VII - Caldari Navy Assembly Plant"
  ],
  [
    60015052,
    10000042,
    "Olbra I - Pator Tech School"
  ],
  [
    60009937,
    10000064,
    "Old Man Star VIII - Moon 1 - Quafe Company Warehouse"
  ],
  [
    60011605,
    10000064,
    "Old Man Star VIII - Moon 2 - Senate Bureau"
  ],
  [
    60015015,
    10000032,
    "Olelon IV - University of Caille"
  ],
  [
    60002635,
    10000032,
    "Olettiers II - Moon 1 - Expert Distribution Warehouse"
  ],
  [
    60002629,
    10000032,
    "Olettiers VI - Moon 3 - Expert Distribution Warehouse"
  ],
  [
    60006550,
    10000032,
    "Olettiers VI - Moon 6 - Imperial Armaments Factory"
  ],
  [
    60002632,
    10000032,
    "Olettiers VII - Moon 2 - Expert Distribution Retail Center"
  ],
  [
    60002626,
    10000032,
    "Olettiers VII - Moon 20 - Expert Distribution Retail Center"
  ],
  [
    60005083,
    10000030,
    "Olfeim II - Republic Security Services Testing Facilities"
  ],
  [
    60015095,
    10000030,
    "Olfeim IV - Tribal Liberation Force Logistic Support"
  ],
  [
    60010081,
    10000030,
    "Olfeim V - Moon 1 - Quafe Company Warehouse"
  ],
  [
    60000154,
    10000030,
    "Olfeim V - Moon 3 - CBD Corporation Storage"
  ],
  [
    60014560,
    10000037,
    "Olide IV - Moon 1 - X-Sense Chemical Refinery"
  ],
  [
    60014746,
    10000037,
    "Olide IV - Moon 4 - Center for Advanced Studies School"
  ],
  [
    60012379,
    10000037,
    "Olide IV - Moon 7 - CONCORD Assembly Plant"
  ],
  [
    60001369,
    10000037,
    "Olide V - Moon 10 - Wiyrkomi Corporation Factory"
  ],
  [
    60011548,
    10000037,
    "Olide V - Moon 3 - Garoun Investment Bank Depository"
  ],
  [
    60011551,
    10000037,
    "Olide V - Moon 5 - Garoun Investment Bank Depository"
  ],
  [
    60012367,
    10000037,
    "Olide VI - Moon 10 - CONCORD Bureau"
  ],
  [
    60012370,
    10000037,
    "Olide VI - Moon 14 - CONCORD Bureau"
  ],
  [
    60009787,
    10000037,
    "Olide VI - Moon 3 - Combined Harvest Food Packaging"
  ],
  [
    60012640,
    10000067,
    "Olin II - Moon 13 - Sisters of EVE Bureau"
  ],
  [
    60005497,
    10000067,
    "Olin II - Moon 7 - Core Complexion Inc. Storage"
  ],
  [
    60011254,
    10000067,
    "Olin IV - Moon 3 - Aliastra Warehouse"
  ],
  [
    60003040,
    10000002,
    "Olo I - Moon 1 - Expert Housing Warehouse"
  ],
  [
    60002443,
    10000002,
    "Olo II - Expert Distribution Retail Center"
  ],
  [
    60004210,
    10000002,
    "Olo II - Moon 3 - Spacelane Patrol Assembly Plant"
  ],
  [
    60002815,
    10000002,
    "Olo III - Moon 1 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60008311,
    10000052,
    "Omam VII - Amarr Trade Registry Bureau Offices"
  ],
  [
    60008317,
    10000052,
    "Omam VII - Moon 6 - Amarr Trade Registry Information Center"
  ],
  [
    60008308,
    10000052,
    "Omam VII - Moon 7 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60006664,
    10000054,
    "Omigiav IV - Moon 12 - Zoar and Sons Warehouse"
  ],
  [
    60009466,
    10000048,
    "Ommaerrer VIII - Moon 5 - Material Acquisition Mining Outpost"
  ],
  [
    60009457,
    10000064,
    "Ommare IX - Moon 4 - Material Acquisition Mineral Reserve"
  ],
  [
    60011959,
    10000064,
    "Ommare VI - Federal Intelligence Office Assembly Plant"
  ],
  [
    60011962,
    10000064,
    "Ommare VII - Moon 5 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60009460,
    10000064,
    "Ommare VIII - Material Acquisition Mineral Reserve"
  ],
  [
    60010021,
    10000054,
    "Onanam VIII - Moon 12 - Quafe Company Factory"
  ],
  [
    60005206,
    10000033,
    "Onatoh IV - Republic Security Services Assembly Plant"
  ],
  [
    60003097,
    10000033,
    "Onatoh VII - Moon 23 - Expert Housing Production Plant"
  ],
  [
    60008974,
    10000020,
    "Onazel IX - Theology Council Accounting"
  ],
  [
    60008779,
    10000020,
    "Onazel VII - Moon 2 - Tash-Murkon Family Bureau"
  ],
  [
    60008980,
    10000020,
    "Onazel VII - Theology Council Tribunal"
  ],
  [
    60011329,
    10000044,
    "Ondree VII - Moon 21 - Bank of Luminaire Depository"
  ],
  [
    60011332,
    10000044,
    "Ondree VIII - Bank of Luminaire Depository"
  ],
  [
    60010291,
    10000030,
    "Onga VI - CreoDron Factory"
  ],
  [
    60006535,
    10000030,
    "Onga VIII - Moon 5 - Imperial Armaments Factory"
  ],
  [
    60010297,
    10000030,
    "Onga X - Moon 11 - CreoDron Warehouse"
  ],
  [
    60015131,
    10000069,
    "Onnamon I - State War Academy"
  ],
  [
    60015070,
    10000069,
    "Onnamon IV - State Protectorate Logistic Support"
  ],
  [
    60002755,
    10000033,
    "Ono V - Moon 15 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60000013,
    10000033,
    "Ono V - Moon 2 - CBD Corporation Storage"
  ],
  [
    60000613,
    10000033,
    "Ono V - Moon 2 - Deep Core Mining Inc. Mining Outpost"
  ],
  [
    60000007,
    10000033,
    "Ono V - Moon 9 - CBD Corporation Storage"
  ],
  [
    60000616,
    10000033,
    "Ono VI - Moon 6 - Deep Core Mining Inc. Mining Outpost"
  ],
  [
    60004099,
    10000033,
    "Ono VII - Moon 10 - Spacelane Patrol Testing Facilities"
  ],
  [
    60002761,
    10000033,
    "Ono VII - Moon 21 - Sukuuvestaa Corporation Foundry"
  ],
  [
    60003340,
    10000033,
    "Ono VII - Moon 3 - Chief Executive Panel Treasury"
  ],
  [
    60010525,
    10000042,
    "Ontorn VII - Moon 11 - Impetus Development Studio"
  ],
  [
    60004534,
    10000042,
    "Ontorn VIII - Moon 2 - Krusual Tribe Bureau"
  ],
  [
    60004060,
    10000002,
    "Onuse VII - Moon 11 - Peace and Order Unit Assembly Plant"
  ],
  [
    60000913,
    10000002,
    "Onuse VII - Moon 21 - Caldari Provisions Plantation"
  ],
  [
    60014281,
    10000022,
    "OOO-FS IV - Moon 10 - True Creations Logistic Support"
  ],
  [
    60012289,
    10000042,
    "Oppold III - CONCORD Assembly Plant"
  ],
  [
    60000106,
    10000042,
    "Oppold IV - Moon 1 - CBD Corporation Storage"
  ],
  [
    60006556,
    10000042,
    "Oppold IX - Moon 19 - Imperial Armaments Factory"
  ],
  [
    60000100,
    10000042,
    "Oppold IX - Moon 6 - CBD Corporation Storage"
  ],
  [
    60011422,
    10000042,
    "Oppold V - Moon 5 - Pend Insurance Depository"
  ],
  [
    60001276,
    10000042,
    "Oppold V - Wiyrkomi Corporation Factory"
  ],
  [
    60001273,
    10000042,
    "Oppold VI - Moon 11 - Wiyrkomi Corporation Factory"
  ],
  [
    60004702,
    10000042,
    "Oppold VI - Moon 16 - Republic Parliament Bureau"
  ],
  [
    60006559,
    10000042,
    "Oppold VIII - Moon 12 - Imperial Armaments Factory"
  ],
  [
    60011416,
    10000042,
    "Oppold VIII - Moon 7 - Pend Insurance Depository"
  ],
  [
    60013138,
    10000020,
    "Ordat I - Genolution Biotech Production"
  ],
  [
    60014635,
    10000020,
    "Ordat V - Moon 1 - Imperial Academy"
  ],
  [
    60013342,
    10000020,
    "Ordat VI - Moon 2 - Impro Factory"
  ],
  [
    60008458,
    10000065,
    "Ordion IV - Moon 2 - Amarr Navy Testing Facilities"
  ],
  [
    60008452,
    10000065,
    "Ordion VII - Moon 16 - Amarr Navy Testing Facilities"
  ],
  [
    60009241,
    10000042,
    "Orduin II - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60009244,
    10000042,
    "Orduin IV - Moon 5 - TransStellar Shipping Storage"
  ],
  [
    60014812,
    10000042,
    "Orduin IX - Moon 12 - Pator Tech School"
  ],
  [
    60009232,
    10000042,
    "Orduin IX - Moon 4 - TransStellar Shipping Storage"
  ],
  [
    60009247,
    10000042,
    "Orduin V - Moon 3 - TransStellar Shipping Storage"
  ],
  [
    60004714,
    10000042,
    "Orduin V - Moon 7 - Republic Parliament Bureau"
  ],
  [
    60004717,
    10000042,
    "Orduin VIII - Moon 1 - Republic Parliament Bureau"
  ],
  [
    60009235,
    10000042,
    "Orduin VIII - Moon 12 - TransStellar Shipping Storage"
  ],
  [
    60009238,
    10000042,
    "Orduin VIII - Moon 7 - TransStellar Shipping Storage"
  ],
  [
    60006541,
    10000030,
    "Oremmulf IX - Moon 2 - Imperial Armaments Warehouse"
  ],
  [
    60010288,
    10000030,
    "Oremmulf IX - Moon 6 - CreoDron Factory"
  ],
  [
    60014110,
    10000030,
    "Oremmulf V - Moon 20 - Thukker Mix Warehouse"
  ],
  [
    60004732,
    10000030,
    "Oremmulf V - Moon 4 - Republic Parliament Bureau"
  ],
  [
    60013234,
    10000030,
    "Oremmulf VII - Moon 11 - Genolution Biohazard Containment Facility"
  ],
  [
    60015102,
    10000042,
    "Orfrold IV - Tribal Liberation Force Logistic Support"
  ],
  [
    60010477,
    10000042,
    "Orfrold VII - Moon 8 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60015042,
    10000042,
    "Orgron VI - Moon 1 - Republic University"
  ],
  [
    60002695,
    10000028,
    "Orien II - Expert Distribution Retail Center"
  ],
  [
    60002692,
    10000028,
    "Orien III - Moon 3 - Expert Distribution Retail Center"
  ],
  [
    60014431,
    10000028,
    "Orien III - Moon 3 - Trust Partners Trading Post"
  ],
  [
    60002683,
    10000028,
    "Orien IV - Expert Distribution Warehouse"
  ],
  [
    60014428,
    10000028,
    "Orien IV - Trust Partners Warehouse"
  ],
  [
    60008170,
    10000043,
    "Orkashu VI - Moon 7 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60011824,
    10000048,
    "Orvolle I - Federation Navy Assembly Plant"
  ],
  [
    60009424,
    10000048,
    "Orvolle III - Moon 1 - Inner Zone Shipping Storage"
  ],
  [
    60011731,
    10000048,
    "Orvolle VI - Moon 1 - Federal Administration Bureau Offices"
  ],
  [
    60010636,
    10000048,
    "Orvolle VI - Moon 1 - The Scope Development Studio"
  ],
  [
    60015145,
    10000048,
    "Orvolle VII - Federal Defense Union Logistic Support"
  ],
  [
    60000967,
    10000002,
    "Osaa IV - Moon 11 - Caldari Provisions Plantation"
  ],
  [
    60010294,
    10000030,
    "Osaumuni VII - Moon 16 - CreoDron Factory"
  ],
  [
    60004735,
    10000030,
    "Osaumuni VIII - Moon 22 - Republic Parliament Bureau"
  ],
  [
    60015132,
    10000033,
    "Oshaima IV - State Protectorate Logistic Support"
  ],
  [
    60006010,
    10000033,
    "Oshaima IX - Moon 2 - Freedom Extension Storage"
  ],
  [
    60004414,
    10000033,
    "Oshaima VII - Moon 1 - Corporate Police Force Assembly Plant"
  ],
  [
    60009475,
    10000048,
    "Osmallanais VII - Moon 9 - Material Acquisition Refinery"
  ],
  [
    60011722,
    10000048,
    "Osmeden III - Federal Administration Information Center"
  ],
  [
    60011572,
    10000048,
    "Osmeden IX - Moon 6 - University of Caille"
  ],
  [
    60014572,
    10000048,
    "Osmeden IX - Moon 8 - X-Sense Chemical Refinery"
  ],
  [
    60011833,
    10000048,
    "Osmeden VII - Moon 18 - Federation Navy Assembly Plant"
  ],
  [
    60014578,
    10000048,
    "Osmeden VII - Moon 2 - X-Sense Chemical Refinery"
  ],
  [
    60009829,
    10000048,
    "Osmeden X - Moon 2 - Combined Harvest Plantation"
  ],
  [
    60011830,
    10000048,
    "Osmeden XII - Moon 1 - Federation Navy Assembly Plant"
  ],
  [
    60009790,
    10000068,
    "Osmomonne VI - Moon 6 - Combined Harvest Warehouse"
  ],
  [
    60012667,
    10000002,
    "Osmon II - Moon 1 - Sisters of EVE Bureau"
  ],
  [
    60000535,
    10000002,
    "Osmon IV - Moon 4 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60004459,
    10000002,
    "Osmon IV - Moon 5 - Science and Trade Institute School"
  ],
  [
    60003073,
    10000002,
    "Osmon VI - Moon 1 - Expert Housing Production Plant"
  ],
  [
    60002359,
    10000002,
    "Osmon VI - Moon 6 - Lai Dai Corporation Factory"
  ],
  [
    60005047,
    10000030,
    "Osoggur VI - Urban Management Information Center"
  ],
  [
    60002974,
    10000016,
    "Ossa IX - Moon 2 - Caldari Constructions Foundry"
  ],
  [
    60004267,
    10000016,
    "Ossa VII - Moon 11 - Wiyrkomi Peace Corps Logistic Support"
  ],
  [
    60005662,
    10000016,
    "Ossa VII - Moon 4 - Core Complexion Inc. Storage"
  ],
  [
    60000598,
    10000016,
    "Ossa VII - Moon 5 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60002368,
    10000016,
    "Ossa VII - Moon 7 - Propel Dynamics Factory"
  ],
  [
    60011143,
    10000016,
    "Ossa VII - Moon 8 - Aliastra Retail Center"
  ],
  [
    60015089,
    10000048,
    "Ostingele IV - Federal Defense Union Testing Facilities"
  ],
  [
    60009379,
    10000048,
    "Ostingele VI - Moon 4 - Federal Freight Storage"
  ],
  [
    60009661,
    10000048,
    "Ostingele VI - Moon 5 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60011371,
    10000048,
    "Ostingele VII - Pend Insurance Depository"
  ],
  [
    60010951,
    10000048,
    "Ostingele VIII - Moon 3 - FedMart Warehouse"
  ],
  [
    60004666,
    10000042,
    "Osvestmunnur IX - Republic Parliament Bureau"
  ],
  [
    60013270,
    10000042,
    "Osvestmunnur VIII - Moon 10 - Impro Factory"
  ],
  [
    60010756,
    10000042,
    "Osvestmunnur XI - Moon 4 - Chemal Tech Factory"
  ],
  [
    60012799,
    10000012,
    "OSY-UD IX - Moon 16 - Serpentis Corporation Chemical Storage"
  ],
  [
    60001738,
    10000016,
    "Otalieto VII - Moon 2 - Caldari Steel Warehouse"
  ],
  [
    60003994,
    10000016,
    "Otalieto VIII - Moon 10 - Ishukone Watch Logistic Support"
  ],
  [
    60002242,
    10000002,
    "Otanuomi IV - Moon 4 - Ishukone Corporation Factory"
  ],
  [
    60000382,
    10000002,
    "Otanuomi IV - Moon 5 - Ytiri Storage"
  ],
  [
    60000586,
    10000002,
    "Otanuomi V - Moon 16 - Hyasyoda Corporation Refinery"
  ],
  [
    60000583,
    10000002,
    "Otanuomi VI - Moon 7 - Hyasyoda Corporation Refinery"
  ],
  [
    60000391,
    10000002,
    "Otanuomi VI - Moon 9 - Ytiri Storage"
  ],
  [
    60003037,
    10000002,
    "Otela II - Expert Housing Foundry"
  ],
  [
    60002434,
    10000002,
    "Otela IV - Moon 9 - Expert Distribution Warehouse"
  ],
  [
    60003034,
    10000002,
    "Otela V - Moon 1 - Expert Housing Foundry"
  ],
  [
    60002290,
    10000002,
    "Otitoh IV - Moon 1 - Lai Dai Corporation Factory"
  ],
  [
    60003346,
    10000002,
    "Otitoh VII - Moon 3 - Chief Executive Panel Academy"
  ],
  [
    60000847,
    10000033,
    "Oto VIII - Moon 4 - Minedrill Mining Outpost"
  ],
  [
    60000697,
    10000033,
    "Oto VIII - Moon 6 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60001798,
    10000002,
    "Otosela V - Moon 13 - Zainou Biotech Production"
  ],
  [
    60010459,
    10000002,
    "Otosela V - Moon 7 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60010456,
    10000002,
    "Otosela VII - Moon 4 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60010627,
    10000032,
    "Otou V - Moon 7 - Egonics Inc. Development Studio"
  ],
  [
    60010858,
    10000030,
    "Otraren IV - Moon 5 - Chemal Tech Warehouse"
  ],
  [
    60006475,
    10000030,
    "Otraren VI - Moon 16 - Imperial Armaments Factory"
  ],
  [
    60013306,
    10000030,
    "Otraren VI - Moon 16 - Impro Factory"
  ],
  [
    60006478,
    10000030,
    "Otraren VI - Moon 18 - Imperial Armaments Warehouse"
  ],
  [
    60006481,
    10000030,
    "Otraren VII - Moon 3 - Imperial Armaments Warehouse"
  ],
  [
    60003607,
    10000016,
    "Otsasai VII - Moon 10 - Caldari Business Tribunal"
  ],
  [
    60003604,
    10000016,
    "Otsasai VII - Moon 6 - Caldari Business Tribunal Accounting"
  ],
  [
    60004153,
    10000016,
    "Otsasai VIII - Moon 18 - Spacelane Patrol Assembly Plant"
  ],
  [
    60003823,
    10000016,
    "Otsasai VIII - Moon 3 - Caldari Navy Assembly Plant"
  ],
  [
    60003811,
    10000016,
    "Otsasai VIII - Moon 8 - Caldari Navy Assembly Plant"
  ],
  [
    60007585,
    10000002,
    "Otsela VI - Moon 10 - Nurtura Plantation"
  ],
  [
    60002239,
    10000002,
    "Otsela VI - Moon 13 - Ishukone Corporation Factory"
  ],
  [
    60013141,
    10000002,
    "Otsela VI - Moon 17 - Genolution Biotech Production"
  ],
  [
    60015083,
    10000068,
    "Ouelletta II - Federal Defense Union Logistic Support"
  ],
  [
    60010615,
    10000068,
    "Ouelletta V - Moon 1 - Egonics Inc. Development Studio"
  ],
  [
    60014704,
    10000068,
    "Ouelletta V - Moon 5 - Federal Navy Academy"
  ],
  [
    60011836,
    10000048,
    "Oulley IV - Federation Navy Assembly Plant"
  ],
  [
    60011839,
    10000048,
    "Oulley IV - Moon 1 - Federation Navy Assembly Plant"
  ],
  [
    60000346,
    10000016,
    "Ouranienen IV - Ytiri Storage"
  ],
  [
    60003265,
    10000064,
    "Oursulaert I - Modern Finances Vault"
  ],
  [
    60009655,
    10000064,
    "Oursulaert II - Astral Mining Inc. Mining Outpost"
  ],
  [
    60011740,
    10000064,
    "Oursulaert III - Federation Navy Testing Facilities"
  ],
  [
    60009643,
    10000064,
    "Oursulaert IV - Astral Mining Inc. Mining Outpost"
  ],
  [
    60011743,
    10000064,
    "Oursulaert IV - Federation Navy Testing Facilities"
  ],
  [
    60012013,
    10000064,
    "Oursulaert IX - Federation Customs Testing Facilities"
  ],
  [
    60010783,
    10000064,
    "Oursulaert VI - Chemal Tech Research Center"
  ],
  [
    60011737,
    10000064,
    "Oursulaert VII - Moon 1 - Federation Navy Testing Facilities"
  ],
  [
    60011917,
    10000064,
    "Oursulaert VII - Moon 2 - Federal Intelligence Office Testing Facilities"
  ],
  [
    60009652,
    10000064,
    "Oursulaert VII - Moon 3 - Astral Mining Inc. Mining Outpost"
  ],
  [
    60011314,
    10000064,
    "Oursulaert VII - Moon 3 - Bank of Luminaire Vault"
  ],
  [
    60010909,
    10000064,
    "Oursulaert VII - Moon 3 - Duvolle Laboratories Research Center"
  ],
  [
    60011920,
    10000064,
    "Oursulaert VII - Moon 4 - Federal Intelligence Office Testing Facilities"
  ],
  [
    60009649,
    10000064,
    "Oursulaert VIII - Astral Mining Inc. Mining Outpost"
  ],
  [
    60003262,
    10000064,
    "Oursulaert VIII - Modern Finances Vault"
  ],
  [
    60009640,
    10000064,
    "Oursulaert VIII - Moon 2 - Astral Mining Inc. Mining Outpost"
  ],
  [
    60006430,
    10000002,
    "Outuni IX - Moon 3 - Imperial Armaments Factory"
  ],
  [
    60006433,
    10000002,
    "Outuni X - Moon 14 - Imperial Armaments Factory"
  ],
  [
    60012790,
    10000038,
    "Oyonata IV - Moon 1 - Amarr Navy Assembly Plant"
  ],
  [
    60015062,
    10000038,
    "Oyonata VI - 24th Imperial Crusade Logistic Support"
  ],
  [
    60012574,
    10000015,
    "P-VYVL VII - Moon 1 - Guristas Assembly Plant"
  ],
  [
    60013780,
    10000019,
    "P3UD-M VII - Moon 7 - Jovian Directorate Bureau"
  ],
  [
    60014864,
    10000007,
    "P7-45V IV - Moon 3 - Serpentis Corporation Manufacturing"
  ],
  [
    60000610,
    10000033,
    "Paara I - Deep Core Mining Inc. Mining Outpost"
  ],
  [
    60004087,
    10000033,
    "Paara I - Spacelane Patrol Logistic Support"
  ],
  [
    60001687,
    10000033,
    "Paara II - Caldari Steel Warehouse"
  ],
  [
    60001435,
    10000033,
    "Paara II - Rapid Assembly Factory"
  ],
  [
    60002752,
    10000033,
    "Paara II - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60001681,
    10000033,
    "Paara IV - Caldari Steel Factory"
  ],
  [
    60001441,
    10000033,
    "Paara IV - Rapid Assembly Factory"
  ],
  [
    60004438,
    10000033,
    "Paara VI - Moon 2 - School of Applied Knowledge"
  ],
  [
    60012388,
    10000054,
    "Pahineh V - Moon 1 - CONCORD Bureau"
  ],
  [
    60000133,
    10000054,
    "Pahineh VII - Moon 9 - CBD Corporation Storage"
  ],
  [
    60009331,
    10000048,
    "Pain IV - Moon 14 - Federal Freight Storage"
  ],
  [
    60011527,
    10000048,
    "Pain V - Garoun Investment Bank Vault"
  ],
  [
    60005446,
    10000048,
    "Pain VI - Core Complexion Inc. Storage"
  ],
  [
    60012265,
    10000067,
    "Pakhshi IX - Moon 20 - CONCORD Bureau"
  ],
  [
    60007603,
    10000016,
    "Pakkonen I - Moon 1 - Nurtura Plantation"
  ],
  [
    60002929,
    10000016,
    "Pakkonen II - Moon 1 - Caldari Constructions Foundry"
  ],
  [
    60001816,
    10000016,
    "Pakkonen IV - Moon 11 - Zainou Biotech Research Center"
  ],
  [
    60002932,
    10000016,
    "Pakkonen IV - Moon 18 - Caldari Constructions Foundry"
  ],
  [
    60002935,
    10000016,
    "Pakkonen IV - Moon 19 - Caldari Constructions Production Plant"
  ],
  [
    60002926,
    10000016,
    "Pakkonen V - Moon 4 - Caldari Constructions Foundry"
  ],
  [
    60007600,
    10000016,
    "Pakkonen V - Moon 6 - Nurtura Plantation"
  ],
  [
    60014530,
    10000016,
    "Pakkonen V - Moon 7 - X-Sense Reprocessing Facility"
  ],
  [
    60004249,
    10000016,
    "Pakkonen V - Spacelane Patrol Testing Facilities"
  ],
  [
    60013975,
    10000049,
    "Palas II - Royal Khanid Navy Assembly Plant"
  ],
  [
    60013978,
    10000049,
    "Palas VII - Moon 11 - Royal Khanid Navy Assembly Plant"
  ],
  [
    60011362,
    10000064,
    "Palmon IV - Moon 13 - Bank of Luminaire Vault"
  ],
  [
    60009718,
    10000064,
    "Palmon VI - Astral Mining Inc. Mining Outpost"
  ],
  [
    60009721,
    10000064,
    "Palmon VII - Moon 4 - Astral Mining Inc. Mining Outpost"
  ],
  [
    60007972,
    10000067,
    "Pamah II - Moon 1 - Ministry of War Bureau Offices"
  ],
  [
    60008827,
    10000067,
    "Pamah IV - Moon 10 - Civic Court Tribunal"
  ],
  [
    60008818,
    10000067,
    "Pamah IV - Moon 14 - Civic Court Accounting"
  ],
  [
    60007975,
    10000067,
    "Pamah V - Moon 20 - Ministry of War Information Center"
  ],
  [
    60009208,
    10000067,
    "Pamah V - Moon 9 - TransStellar Shipping Storage"
  ],
  [
    60006178,
    10000065,
    "Pananan VIII - Moon 3 - Amarr Constructions Warehouse"
  ],
  [
    60005614,
    10000032,
    "Parchanier III - Core Complexion Inc. Factory"
  ],
  [
    60010609,
    10000032,
    "Parchanier V - Egonics Inc. Development Studio"
  ],
  [
    60005620,
    10000032,
    "Parchanier VI - Core Complexion Inc. Warehouse"
  ],
  [
    60010606,
    10000032,
    "Parchanier VI - Moon 15 - Egonics Inc. Development Studio"
  ],
  [
    60001264,
    10000032,
    "Parchanier VI - Moon 16 - Wiyrkomi Corporation Factory"
  ],
  [
    60005623,
    10000032,
    "Parchanier VII - Moon 1 - Core Complexion Inc. Storage"
  ],
  [
    60013957,
    10000049,
    "Parses VI - Moon 11 - Royal Khanid Navy Assembly Plant"
  ],
  [
    60008236,
    10000067,
    "Partod VII - Moon 18 - Ministry of Internal Order Testing Facilities"
  ],
  [
    60015081,
    10000064,
    "Parts I - Federal Defense Union Logistic Support"
  ],
  [
    60011599,
    10000064,
    "Parts IV - Moon 3 - President Bureau"
  ],
  [
    60009931,
    10000064,
    "Parts IV - Moon 5 - Quafe Company Factory"
  ],
  [
    60011938,
    10000064,
    "Parts V - Moon 1 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60009934,
    10000064,
    "Parts V - Moon 1 - Quafe Company Warehouse"
  ],
  [
    60011611,
    10000064,
    "Parts VI - Supreme Court Tribunal"
  ],
  [
    60015010,
    10000020,
    "Pasha VII - Moon 3 - Royal Amarr Institute School"
  ],
  [
    60008401,
    10000067,
    "Pashanai III - Moon 2 - Amarr Navy Assembly Plant"
  ],
  [
    60007189,
    10000067,
    "Pashanai III - Moon 9 - Amarr Certified News Development Studio"
  ],
  [
    60007981,
    10000067,
    "Pashanai III - Moon 9 - Ministry of War Bureau Offices"
  ],
  [
    60009202,
    10000067,
    "Pashanai IV - Moon 18 - TransStellar Shipping Storage"
  ],
  [
    60006127,
    10000067,
    "Pashanai IV - Moon 3 - Amarr Constructions Production Plant"
  ],
  [
    60006133,
    10000067,
    "Pashanai IV - Moon 4 - Amarr Constructions Production Plant"
  ],
  [
    60008821,
    10000067,
    "Pashanai V - Moon 12 - Civic Court Accounting"
  ],
  [
    60002314,
    10000016,
    "Passari V - Moon 8 - Lai Dai Corporation Factory"
  ],
  [
    60006850,
    10000016,
    "Passari V - Moon 9 - Ducia Foundry Refinery"
  ],
  [
    60002005,
    10000016,
    "Passari VI - Echelon Entertainment Development Studio"
  ],
  [
    60007378,
    10000016,
    "Passari VIII - Joint Harvesting Food Packaging"
  ],
  [
    60005053,
    10000030,
    "Pator III (Huggar) - Moon 2 - Republic Security Services Assembly Plant"
  ],
  [
    60010051,
    10000030,
    "Pator V (Vakir) - Moon 1 - Quafe Company Factory"
  ],
  [
    60004747,
    10000030,
    "Pator V (Vakir) - Republic Fleet Logistic Support"
  ],
  [
    60004744,
    10000030,
    "Pator VII (Kulheim) - Moon 1 - Republic Fleet Testing Facilities"
  ],
  [
    60005059,
    10000030,
    "Pator VII (Kulheim) - Republic Security Services Assembly Plant"
  ],
  [
    60015114,
    10000069,
    "Pavanakka III - Caldari Constructions Warehouse"
  ],
  [
    60009073,
    10000020,
    "Paye IX - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60014644,
    10000020,
    "Paye VI - Moon 1 - Imperial Academy"
  ],
  [
    60009076,
    10000020,
    "Paye VI - Moon 14 - TransStellar Shipping Storage"
  ],
  [
    60009085,
    10000020,
    "Paye VII - Moon 4 - TransStellar Shipping Storage"
  ],
  [
    60013651,
    10000017,
    "PBXG-A IV - Jovian Directorate Bureau"
  ],
  [
    60013648,
    10000017,
    "PBXG-A IV - Moon 3 - Jovian Directorate Bureau"
  ],
  [
    60013387,
    10000041,
    "PC9-AY III - Intaki Commerce Trading Post"
  ],
  [
    60013390,
    10000041,
    "PC9-AY VIII - Moon 7 - Intaki Commerce Warehouse"
  ],
  [
    60006925,
    10000043,
    "Pedel IV - Moon 1 - HZO Refinery Mining Outpost"
  ],
  [
    60006931,
    10000043,
    "Pedel VII - HZO Refinery Mining Outpost"
  ],
  [
    60009580,
    10000048,
    "Pelille III - Astral Mining Inc. Refinery"
  ],
  [
    60012091,
    10000048,
    "Pelille III - Moon 5 - Federation Customs Assembly Plant"
  ],
  [
    60009571,
    10000048,
    "Pelille V - Moon 13 - Astral Mining Inc. Refinery"
  ],
  [
    60010903,
    10000048,
    "Pelille V - Moon 14 - Duvolle Laboratories Factory"
  ],
  [
    60005128,
    10000048,
    "Pelille VI - Moon 10 - Republic Security Services Assembly Plant"
  ],
  [
    60009568,
    10000048,
    "Pelille VI - Moon 2 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60007225,
    10000043,
    "Pelkia III - Moon 2 - Amarr Certified News Publisher"
  ],
  [
    60001405,
    10000064,
    "Pemene VI - Moon 10 - Wiyrkomi Corporation Factory"
  ],
  [
    60001411,
    10000064,
    "Pemene VI - Moon 2 - Wiyrkomi Corporation Factory"
  ],
  [
    60006400,
    10000043,
    "Penirgman IV - Imperial Armaments Factory"
  ],
  [
    60002179,
    10000043,
    "Penirgman IX - Moon 11 - Ishukone Corporation Factory"
  ],
  [
    60006406,
    10000043,
    "Penirgman IX - Moon 13 - Imperial Armaments Factory"
  ],
  [
    60010087,
    10000043,
    "Penirgman IX - Moon 13 - Quafe Company Factory"
  ],
  [
    60002182,
    10000043,
    "Penirgman IX - Moon 2 - Ishukone Corporation Factory"
  ],
  [
    60010084,
    10000043,
    "Penirgman IX - Moon 2 - Quafe Company Factory"
  ],
  [
    60008164,
    10000043,
    "Penirgman IX - Moon 3 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60008869,
    10000043,
    "Penirgman IX - Moon 6 - Civic Court Tribunal"
  ],
  [
    60010093,
    10000043,
    "Penirgman IX - Moon 6 - Quafe Company Factory"
  ],
  [
    60003271,
    10000043,
    "Penirgman IX - Moon 7 - Modern Finances Depository"
  ],
  [
    60010090,
    10000043,
    "Penirgman IX - Quafe Company Factory"
  ],
  [
    60006409,
    10000043,
    "Penirgman V - Imperial Armaments Factory"
  ],
  [
    60008947,
    10000043,
    "Penirgman V - Moon 1 - Theology Council Tribunal"
  ],
  [
    60003268,
    10000043,
    "Penirgman V - Moon 2 - Modern Finances Depository"
  ],
  [
    60002173,
    10000043,
    "Penirgman V - Moon 3 - Ishukone Corporation Factory"
  ],
  [
    60008173,
    10000043,
    "Penirgman VI - Ministry of Internal Order Assembly Plant"
  ],
  [
    60002176,
    10000043,
    "Penirgman VII - Ishukone Corporation Factory"
  ],
  [
    60008167,
    10000043,
    "Penirgman VII - Ministry of Internal Order Assembly Plant"
  ],
  [
    60008944,
    10000043,
    "Penirgman VIII - Moon 2 - Theology Council Tribunal"
  ],
  [
    60007081,
    10000020,
    "Pera II - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60006604,
    10000020,
    "Pera IV - Moon 3 - Viziam Factory"
  ],
  [
    60007438,
    10000020,
    "Perdan VI - Moon 12 - Joint Harvesting Mining Outpost"
  ],
  [
    60012961,
    10000020,
    "Perdan VI - Moon 16 - DED Testing Facilities"
  ],
  [
    60007435,
    10000020,
    "Perdan VI - Moon 8 - Joint Harvesting Mining Outpost"
  ],
  [
    60007432,
    10000020,
    "Perdan VII - Moon 5 - Joint Harvesting Plantation"
  ],
  [
    60007426,
    10000020,
    "Perdan VIII - Moon 1 - Joint Harvesting Plantation"
  ],
  [
    60003754,
    10000002,
    "Perimeter II - Moon 1 - Caldari Navy Assembly Plant"
  ],
  [
    60006880,
    10000002,
    "Perimeter II - Moon 1 - Ducia Foundry Mineral Reserve"
  ],
  [
    60002956,
    10000002,
    "Perimeter IX - Caldari Constructions Production Plant"
  ],
  [
    60000358,
    10000002,
    "Perimeter VI - Ytiri Storage"
  ],
  [
    60000685,
    10000002,
    "Perimeter VII - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60009910,
    10000044,
    "Pertnineere IV - Quafe Company Factory"
  ],
  [
    60011953,
    10000044,
    "Pertnineere VI - Federal Intelligence Office Logistic Support"
  ],
  [
    60010519,
    10000044,
    "Pertnineere VI - Moon 11 - Impetus Development Studio"
  ],
  [
    60009496,
    10000044,
    "Pertnineere VII - Moon 1 - Material Acquisition Refinery"
  ],
  [
    60005953,
    10000044,
    "Pertnineere VIII - Freedom Extension Storage"
  ],
  [
    60009919,
    10000044,
    "Pertnineere VIII - Moon 2 - Quafe Company Warehouse"
  ],
  [
    60005884,
    10000067,
    "Petidu IV - Moon 6 - Freedom Extension Storage"
  ],
  [
    60005887,
    10000067,
    "Petidu IX - Moon 8 - Freedom Extension Storage"
  ],
  [
    60011476,
    10000052,
    "Peyiri VIII - Moon 12 - Pend Insurance Depository"
  ],
  [
    60010285,
    10000052,
    "Peyiri XI - Moon 21 - CreoDron Warehouse"
  ],
  [
    60012577,
    10000015,
    "PF-QHK VII - Moon 6 - Guristas Logistic Support"
  ],
  [
    60010036,
    10000041,
    "PFP-GU II - Moon 10 - Quafe Company Factory"
  ],
  [
    60000265,
    10000016,
    "Piak II - Moon 3 - CBD Corporation Storage"
  ],
  [
    60003742,
    10000016,
    "Piak II - Moon 4 - House of Records Information Center"
  ],
  [
    60000739,
    10000016,
    "Piak II - Poksu Mineral Group Refinery"
  ],
  [
    60003865,
    10000016,
    "Piak III - Moon 19 - Caldari Navy Assembly Plant"
  ],
  [
    60000316,
    10000016,
    "Piak III - Moon 19 - Ytiri Storage"
  ],
  [
    60001522,
    10000016,
    "Piak III - Moon 2 - Rapid Assembly Warehouse"
  ],
  [
    60002914,
    10000016,
    "Piak III - Moon 5 - Caldari Constructions Production Plant"
  ],
  [
    60000736,
    10000016,
    "Piak III - Moon 6 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60000979,
    10000016,
    "Piak IV - Moon 14 - Kaalakiota Corporation Warehouse"
  ],
  [
    60000313,
    10000016,
    "Piak IV - Moon 22 - Ytiri Storage"
  ],
  [
    60000340,
    10000016,
    "Piekura VII - Moon 1 - Ytiri Storage"
  ],
  [
    60004258,
    10000016,
    "Piekura VII - Spacelane Patrol Assembly Plant"
  ],
  [
    60014662,
    10000016,
    "Piekura VIII - Moon 11 - State War Academy"
  ],
  [
    60004276,
    10000016,
    "Piekura VIII - Moon 11 - Wiyrkomi Peace Corps Assembly Plant"
  ],
  [
    60001465,
    10000016,
    "Piekura VIII - Moon 15 - Rapid Assembly Factory"
  ],
  [
    60001813,
    10000016,
    "Piekura VIII - Moon 15 - Zainou Biotech Production"
  ],
  [
    60004261,
    10000016,
    "Piekura VIII - Moon 8 - Spacelane Patrol Assembly Plant"
  ],
  [
    60006232,
    10000020,
    "Pimebeka IV - Moon 1 - Carthum Conglomerate Warehouse"
  ],
  [
    60006226,
    10000020,
    "Pimebeka VI - Moon 1 - Carthum Conglomerate Warehouse"
  ],
  [
    60012982,
    10000020,
    "Pimebeka VII - Moon 13 - DED Logistic Support"
  ],
  [
    60006220,
    10000020,
    "Pimebeka VII - Moon 16 - Carthum Conglomerate Factory"
  ],
  [
    60000196,
    10000020,
    "Pimebeka VIII - Moon 9 - CBD Corporation Storage"
  ],
  [
    60001084,
    10000020,
    "Pimebeka X - Kaalakiota Corporation Factory"
  ],
  [
    60007612,
    10000020,
    "Pimsu VIII - Moon 5 - Nurtura Food Packaging"
  ],
  [
    60009292,
    10000020,
    "Pimsu VIII - Moon 6 - TransStellar Shipping Storage"
  ],
  [
    60012811,
    10000012,
    "PO4F-3 V - Moon 10 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60012877,
    10000012,
    "PO4F-3 V - Moon 6 - Guardian Angels Assembly Plant"
  ],
  [
    60012805,
    10000012,
    "PO4F-3 VI - Moon 18 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60012193,
    10000012,
    "PO4F-3 VI - Moon 4 - Archangels Assembly Plant"
  ],
  [
    60012808,
    10000012,
    "PO4F-3 VI - Moon 7 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60011809,
    10000044,
    "Pochelympe IX - Federation Navy Assembly Plant"
  ],
  [
    60012661,
    10000044,
    "Pochelympe IX - Sisters of EVE Bureau"
  ],
  [
    60009448,
    10000044,
    "Pochelympe VI - Material Acquisition Refinery"
  ],
  [
    60012658,
    10000044,
    "Pochelympe VII - Moon 2 - Sisters of EVE Bureau"
  ],
  [
    60013867,
    10000001,
    "Podion VIII - Moon 15 - Nefantar Miner Association Mining Outpost"
  ],
  [
    60004222,
    10000002,
    "Poinen I - Moon 2 - Spacelane Patrol Logistic Support"
  ],
  [
    60002440,
    10000002,
    "Poinen II - Moon 3 - Expert Distribution Retail Center"
  ],
  [
    60004213,
    10000002,
    "Poinen III - Moon 16 - Spacelane Patrol Logistic Support"
  ],
  [
    60001831,
    10000002,
    "Poinen IV - Moon 13 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60002437,
    10000002,
    "Poinen IV - Moon 6 - Expert Distribution Retail Center"
  ],
  [
    60002818,
    10000002,
    "Poinen IV - Moon 8 - Sukuuvestaa Corporation Factory"
  ],
  [
    60003934,
    10000002,
    "Poinen V - Moon 12 - Internal Security Assembly Plant"
  ],
  [
    60002806,
    10000002,
    "Poinen V - Moon 16 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60003937,
    10000002,
    "Poinen V - Moon 26 - Internal Security Assembly Plant"
  ],
  [
    60002809,
    10000002,
    "Poinen VI - Moon 5 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60013465,
    10000041,
    "Poitot V - Moon 14 - Intaki Syndicate Bureau"
  ],
  [
    60013405,
    10000041,
    "Poitot VI - Moon 17 - Intaki Space Police Assembly Plant"
  ],
  [
    60014839,
    10000004,
    "Polaris I - Polaris Corporation Plantation"
  ],
  [
    60014842,
    10000004,
    "Polaris II - Polaris Corporation Plantation"
  ],
  [
    60014845,
    10000004,
    "Polaris III - Polaris Corporation Plantation"
  ],
  [
    60014848,
    10000004,
    "Polaris IV - Polaris Corporation Plantation"
  ],
  [
    60014929,
    10000004,
    "Polaris VI - Serpentis Corporation Manufacturing"
  ],
  [
    60014930,
    10000004,
    "Polaris VII - Serpentis Corporation Refining"
  ],
  [
    60014931,
    10000004,
    "Polaris VIII - Serpentis Corporation Cloning"
  ],
  [
    60008203,
    10000065,
    "Polfaly V - Moon 2 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60006640,
    10000065,
    "Polfaly VI - Moon 7 - Zoar and Sons Warehouse"
  ],
  [
    60007789,
    10000065,
    "Polfaly VIII - Moon 3 - Amarr Civil Service Bureau Offices"
  ],
  [
    60001939,
    10000042,
    "Polstodur VI - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60005029,
    10000042,
    "Polstodur VIII - Moon 6 - Republic Justice Department Tribunal"
  ],
  [
    60003550,
    10000032,
    "Pozirblant IV - Caldari Business Tribunal"
  ],
  [
    60003547,
    10000032,
    "Pozirblant IX - Moon 4 - Caldari Business Tribunal"
  ],
  [
    60003544,
    10000032,
    "Pozirblant V - Caldari Business Tribunal"
  ],
  [
    60003553,
    10000032,
    "Pozirblant VI - Caldari Business Tribunal"
  ],
  [
    60003556,
    10000032,
    "Pozirblant VIII - Moon 2 - Caldari Business Tribunal Information Center"
  ],
  [
    60014026,
    10000017,
    "PQA-9K IV - Shapeset Storage Bay"
  ],
  [
    60014011,
    10000019,
    "PQWA-L I - Shapeset Shipyard"
  ],
  [
    60014008,
    10000019,
    "PQWA-L IX - Moon 1 - Shapeset Shipyard"
  ],
  [
    60013588,
    10000019,
    "PQWA-L VII - Jove Navy Assembly Plant"
  ],
  [
    60013915,
    10000019,
    "PQWA-L XI - Moon 6 - Prosper Depository"
  ],
  [
    60014946,
    10000060,
    "PR-8CA III - Blood Raiders Logistic Support"
  ],
  [
    60015123,
    10000069,
    "Prism VII - Wiyrkomi Peace Corps Assembly Plant"
  ],
  [
    60006718,
    10000054,
    "Pserz III - Moon 1 - Zoar and Sons Factory"
  ],
  [
    60006715,
    10000054,
    "Pserz VI - Zoar and Sons Factory"
  ],
  [
    60000169,
    10000054,
    "Pserz VIII - Moon 3 - CBD Corporation Storage"
  ],
  [
    60011389,
    10000054,
    "Pserz X - Pend Insurance Depository"
  ],
  [
    60000175,
    10000054,
    "Pserz XII - Moon 4 - CBD Corporation Storage"
  ],
  [
    60008845,
    10000054,
    "Pserz XII - Moon 4 - Civic Court Tribunal"
  ],
  [
    60002464,
    10000032,
    "Pucherie IV - Moon 1 - Expert Distribution Warehouse"
  ],
  [
    60002473,
    10000032,
    "Pucherie V - Moon 2 - Expert Distribution Warehouse"
  ],
  [
    60011857,
    10000032,
    "Pucherie VI - Moon 11 - Federation Navy Testing Facilities"
  ],
  [
    60011554,
    10000032,
    "Pucherie VI - Moon 18 - Garoun Investment Bank Vault"
  ],
  [
    60011557,
    10000032,
    "Pucherie VI - Moon 2 - Garoun Investment Bank Vault"
  ],
  [
    60002470,
    10000032,
    "Pucherie VI - Moon 8 - Expert Distribution Warehouse"
  ],
  [
    60010582,
    10000032,
    "Pulin V - Moon 8 - Egonics Inc. Development Studio"
  ],
  [
    60003145,
    10000002,
    "Purjola VI - Moon 5 - Caldari Funds Unlimited Depository"
  ],
  [
    60003049,
    10000002,
    "Purjola VII - Expert Housing Production Plant"
  ],
  [
    60003238,
    10000002,
    "Purjola VII - Moon 10 - State and Region Bank Depository"
  ],
  [
    60014089,
    10000041,
    "PVH8-0 VI - Moon 8 - Thukker Mix Factory"
  ],
  [
    60014023,
    10000017,
    "PZP1-D IX - Moon 1 - Shapeset Shipyard"
  ],
  [
    60013606,
    10000017,
    "PZP1-D IX - Moon 5 - Jove Navy Assembly Plant"
  ],
  [
    60014909,
    10000006,
    "Q-GQHN VIII - Moon 3 - Serpentis Corporation Cloning"
  ],
  [
    60012895,
    10000012,
    "QFEW-K IV - Guardian Angels Assembly Plant"
  ],
  [
    60012769,
    10000012,
    "QFEW-K IV - Salvation Angels Chemical Refinery"
  ],
  [
    60012832,
    10000012,
    "QFEW-K V - Moon 1 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60012892,
    10000012,
    "QFEW-K VI - Moon 1 - Guardian Angels Assembly Plant"
  ],
  [
    60013921,
    10000017,
    "QO-3LC IV - Moon 2 - Prosper Depository"
  ],
  [
    60013930,
    10000019,
    "QU7-EE V - Moon 7 - Prosper Vault"
  ],
  [
    60009694,
    10000037,
    "Quier III - Moon 11 - Astral Mining Inc. Mining Outpost"
  ],
  [
    60005827,
    10000037,
    "Quier III - Moon 14 - Freedom Extension Storage"
  ],
  [
    60009709,
    10000037,
    "Quier III - Moon 7 - Astral Mining Inc. Mining Outpost"
  ],
  [
    60012655,
    10000037,
    "Quier IV - Moon 27 - Sisters of EVE Treasury"
  ],
  [
    60005830,
    10000037,
    "Quier IV - Moon 3 - Freedom Extension Storage"
  ],
  [
    60005836,
    10000037,
    "Quier IV - Moon 7 - Freedom Extension Warehouse"
  ],
  [
    60012208,
    10000012,
    "RA-NXN I - Archangels Assembly Plant"
  ],
  [
    60012883,
    10000012,
    "RA-NXN VII - Moon 18 - Guardian Angels Assembly Plant"
  ],
  [
    60012154,
    10000001,
    "Radima VIII - Moon 1 - Ammatar Fleet Testing Facilities"
  ],
  [
    60012505,
    10000032,
    "Raeghoscon VIII - CONCORD Logistic Support"
  ],
  [
    60005779,
    10000042,
    "Ragnarg I - Freedom Extension Storage"
  ],
  [
    60002542,
    10000042,
    "Ragnarg III - Moon 1 - Expert Distribution Warehouse"
  ],
  [
    60011296,
    10000042,
    "Ragnarg IV - Moon 2 - Aliastra Warehouse"
  ],
  [
    60002551,
    10000042,
    "Ragnarg IV - Moon 2 - Expert Distribution Warehouse"
  ],
  [
    60011293,
    10000042,
    "Ragnarg VI - Moon 6 - Aliastra Warehouse"
  ],
  [
    60008905,
    10000036,
    "Rahadalon VI - Moon 3 - Civic Court Accounting"
  ],
  [
    60008911,
    10000036,
    "Rahadalon VI - Moon 4 - Civic Court Accounting"
  ],
  [
    60008074,
    10000036,
    "Rahadalon VIII - Moon 2 - Ministry of Assessment Bureau Offices"
  ],
  [
    60001477,
    10000033,
    "Rairomon VI - Rapid Assembly Factory"
  ],
  [
    60013255,
    10000033,
    "Rairomon VIII - Moon 1 - Genolution Biohazard Containment Facility"
  ],
  [
    60001699,
    10000033,
    "Rairomon VIII - Moon 7 - Caldari Steel Warehouse"
  ],
  [
    60001609,
    10000033,
    "Rairomon VIII - Moon 7 - Perkone Warehouse"
  ],
  [
    60015077,
    10000069,
    "Rakapas II - State Protectorate Logistic Support"
  ],
  [
    60015130,
    10000069,
    "Rakapas V - Home Guard Assembly Plant"
  ],
  [
    60010324,
    10000032,
    "Rancer IV - Moon 18 - Roden Shipyards Factory"
  ],
  [
    60010624,
    10000032,
    "Rancer V - Moon 7 - Egonics Inc. Development Studio"
  ],
  [
    60009340,
    10000032,
    "Rancer VI - Moon 3 - Federal Freight Storage"
  ],
  [
    60014716,
    10000032,
    "Rancer VI - Moon 6 - Federal Navy Academy"
  ],
  [
    60010321,
    10000032,
    "Rancer VII - Moon 17 - Roden Shipyards Warehouse"
  ],
  [
    60009343,
    10000032,
    "Rancer VII - Moon 22 - Federal Freight Storage"
  ],
  [
    60011155,
    10000020,
    "Rand V - Aliastra Warehouse"
  ],
  [
    60005107,
    10000020,
    "Rand VI - Moon 15 - Republic Security Services Logistic Support"
  ],
  [
    60012991,
    10000068,
    "Raneilles III - DED Assembly Plant"
  ],
  [
    60012988,
    10000068,
    "Raneilles V - Moon 2 - DED Assembly Plant"
  ],
  [
    60011518,
    10000068,
    "Raneilles VI - Moon 1 - Garoun Investment Bank Depository"
  ],
  [
    60005584,
    10000068,
    "Raneilles VI - Moon 14 - Core Complexion Inc. Factory"
  ],
  [
    60010567,
    10000065,
    "Ranni IX - Moon 10 - Impetus Development Studio"
  ],
  [
    60011443,
    10000065,
    "Ranni VII - Moon 2 - Pend Insurance Depository"
  ],
  [
    60005554,
    10000065,
    "Ranni VIII - Moon 2 - Core Complexion Inc. Storage"
  ],
  [
    60008707,
    10000065,
    "Ranni VIII - Moon 5 - Kor-Azor Family Academy"
  ],
  [
    60008710,
    10000065,
    "Ranni VIII - Moon 6 - Kor-Azor Family Bureau"
  ],
  [
    60001960,
    10000065,
    "Rannoze V - Moon 16 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60012475,
    10000065,
    "Rannoze V - Moon 8 - CONCORD Bureau"
  ],
  [
    60012487,
    10000065,
    "Rannoze VII - Moon 2 - CONCORD Assembly Plant"
  ],
  [
    60007117,
    10000043,
    "Raravath III - Imperial Shipment Storage"
  ],
  [
    60008413,
    10000043,
    "Raravath IV - Amarr Navy Assembly Plant"
  ],
  [
    60006331,
    10000043,
    "Raravath VI - Carthum Conglomerate Factory"
  ],
  [
    60006334,
    10000043,
    "Raravath XII - Moon 1 - Carthum Conglomerate Factory"
  ],
  [
    60003688,
    10000043,
    "Raravath XII - Moon 3 - Caldari Business Tribunal"
  ],
  [
    60008326,
    10000054,
    "Rashagh III - Moon 1 - Amarr Trade Registry Information Center"
  ],
  [
    60008329,
    10000054,
    "Rashagh IV - Moon 2 - Amarr Trade Registry Information Center"
  ],
  [
    60008320,
    10000054,
    "Rashagh VI - Amarr Trade Registry Bureau Offices"
  ],
  [
    60013030,
    10000001,
    "Rashy VI - DED Assembly Plant"
  ],
  [
    60010633,
    10000044,
    "Ratillose V - Moon 14 - Egonics Inc. Development Studio"
  ],
  [
    60011812,
    10000044,
    "Ratillose V - Moon 19 - Federation Navy Logistic Support"
  ],
  [
    60011818,
    10000044,
    "Ratillose V - Moon 8 - Federation Navy Logistic Support"
  ],
  [
    60010630,
    10000044,
    "Ratillose VI - Moon 4 - Egonics Inc. Development Studio"
  ],
  [
    60000715,
    10000016,
    "Raussinen IX - Moon 13 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60000349,
    10000016,
    "Raussinen X - Moon 3 - Ytiri Storage"
  ],
  [
    60013114,
    10000016,
    "Raussinen XI - Moon 2 - Genolution Biotech Research Center"
  ],
  [
    60010801,
    10000032,
    "Ravarin III - Moon 4 - Chemal Tech Research Center"
  ],
  [
    60011803,
    10000032,
    "Ravarin IV - Moon 2 - Federation Navy Testing Facilities"
  ],
  [
    60010798,
    10000032,
    "Ravarin V - Moon 13 - Chemal Tech Research Center"
  ],
  [
    60006262,
    10000043,
    "Rayl VIII - Moon 7 - Carthum Conglomerate Factory"
  ],
  [
    60006256,
    10000043,
    "Rayl X - Moon 3 - Carthum Conglomerate Factory"
  ],
  [
    60005149,
    10000068,
    "Reblier IV - Republic Security Services Logistic Support"
  ],
  [
    60011902,
    10000068,
    "Reblier VI - Federation Navy Logistic Support"
  ],
  [
    60011896,
    10000068,
    "Reblier VII - Moon 10 - Federation Navy Assembly Plant"
  ],
  [
    60011911,
    10000068,
    "Reblier VII - Moon 4 - Federation Navy Assembly Plant"
  ],
  [
    60001948,
    10000068,
    "Reblier VIII - Moon 10 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60012928,
    10000068,
    "Reblier VIII - Moon 7 - DED Logistic Support"
  ],
  [
    60010192,
    10000002,
    "Reisen VI - CreoDron Factory"
  ],
  [
    60008332,
    10000020,
    "Remoriu IV - Moon 1 - Amarr Trade Registry Information Center"
  ],
  [
    60008335,
    10000020,
    "Remoriu V - Moon 6 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60008338,
    10000020,
    "Remoriu V - Moon 7 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60008341,
    10000020,
    "Remoriu VI - Moon 1 - Amarr Trade Registry Bureau Offices"
  ],
  [
    60010996,
    10000048,
    "Renarelle III - Moon 10 - FedMart Warehouse"
  ],
  [
    60009742,
    10000048,
    "Renarelle III - Moon 4 - Combined Harvest Food Packaging"
  ],
  [
    60004588,
    10000030,
    "Rens VI - Moon 8 - Brutor Tribe Treasury"
  ],
  [
    60005725,
    10000030,
    "Rens VI - Six Kin Development Warehouse"
  ],
  [
    60004594,
    10000030,
    "Rens VII - Moon 17 - Brutor Tribe Bureau"
  ],
  [
    60012727,
    10000030,
    "Rens VII - Moon 19 - Sisters of EVE Bureau"
  ],
  [
    60012721,
    10000030,
    "Rens VII - Moon 20 - Sisters of EVE Bureau"
  ],
  [
    60012724,
    10000030,
    "Rens VII - Moon 21 - Sisters of EVE Bureau"
  ],
  [
    60009106,
    10000030,
    "Rens VIII - Moon 3 - TransStellar Shipping Storage"
  ],
  [
    60012010,
    10000064,
    "Renyn IX - Federation Customs Assembly Plant"
  ],
  [
    60011914,
    10000064,
    "Renyn IX - Moon 4 - Federal Intelligence Office Logistic Support"
  ],
  [
    60010786,
    10000064,
    "Renyn X - Moon 14 - Chemal Tech Factory"
  ],
  [
    60004891,
    10000042,
    "Resbroko I - Moon 7 - Republic Fleet Assembly Plant"
  ],
  [
    60007408,
    10000042,
    "Reset II - Joint Harvesting Plantation"
  ],
  [
    60007405,
    10000042,
    "Reset III - Moon 1 - Joint Harvesting Food Packaging"
  ],
  [
    60005305,
    10000042,
    "Reset IV - Moon 4 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60005308,
    10000042,
    "Reset V - Moon 13 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60010432,
    10000042,
    "Reset V - Moon 14 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60005317,
    10000042,
    "Reset V - Moon 22 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60005314,
    10000042,
    "Reset V - Moon 4 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60007420,
    10000042,
    "Reset VI - Moon 8 - Joint Harvesting Mining Outpost"
  ],
  [
    60010435,
    10000042,
    "Reset VII - Moon 11 - Poteque Pharmaceuticals Biotech Research Center"
  ],
  [
    60005320,
    10000042,
    "Reset VII - Moon 19 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60013135,
    10000020,
    "Rethan VII - Moon 21 - Genolution Biotech Production"
  ],
  [
    60008083,
    10000043,
    "Reyi VII - Moon 1 - Ministry of Assessment Bureau Offices"
  ],
  [
    60005431,
    10000048,
    "Reynire IV - Core Complexion Inc. Factory"
  ],
  [
    60003592,
    10000048,
    "Reynire IX - Moon 2 - Caldari Business Tribunal Archives"
  ],
  [
    60005437,
    10000048,
    "Reynire VI - Core Complexion Inc. Warehouse"
  ],
  [
    60012022,
    10000048,
    "Reynire VIII - Moon 2 - Federation Customs Logistic Support"
  ],
  [
    60005443,
    10000048,
    "Reynire X - Moon 1 - Core Complexion Inc. Storage"
  ],
  [
    60013483,
    10000041,
    "RF-GGF V - Intaki Syndicate Academy"
  ],
  [
    60014119,
    10000041,
    "RF-GGF VI - Moon 4 - Thukker Mix Factory"
  ],
  [
    60008539,
    10000036,
    "Riavayed II - Emperor Family Bureau"
  ],
  [
    60014611,
    10000036,
    "Riavayed IX - Moon 12 - Hedion University"
  ],
  [
    60007846,
    10000036,
    "Riavayed IX - Moon 2 - Amarr Civil Service Bureau Offices"
  ],
  [
    60008533,
    10000036,
    "Riavayed IX - Moon 2 - Emperor Family Bureau"
  ],
  [
    60003649,
    10000036,
    "Riavayed X - Moon 1 - Caldari Business Tribunal Information Center"
  ],
  [
    60007843,
    10000036,
    "Riavayed XI - Moon 11 - Amarr Civil Service Information Center"
  ],
  [
    60007840,
    10000036,
    "Riavayed XI - Moon 7 - Amarr Civil Service Information Center"
  ],
  [
    60004708,
    10000042,
    "Ridoner VI - Moon 1 - Republic Parliament Bureau"
  ],
  [
    60009298,
    10000020,
    "Riramia VI - Moon 12 - TransStellar Shipping Storage"
  ],
  [
    60014260,
    10000022,
    "RLDS-R I - True Creations Shipyard"
  ],
  [
    60013423,
    10000041,
    "RLL-9R IX - Intaki Space Police Assembly Plant"
  ],
  [
    60013078,
    10000023,
    "ROIR-Y II - Moon 2 - Food Relief Food Packaging"
  ],
  [
    60012601,
    10000023,
    "ROIR-Y II - Sisters of EVE Bureau"
  ],
  [
    60001117,
    10000030,
    "Rokofur IX - Kaalakiota Corporation Factory"
  ],
  [
    60006049,
    10000030,
    "Rokofur IX - The Leisure Group Development Studio"
  ],
  [
    60010705,
    10000030,
    "Rokofur VIII - Moon 11 - The Scope Development Studio"
  ],
  [
    60000052,
    10000042,
    "Roleinn X - Moon 13 - CBD Corporation Storage"
  ],
  [
    60005938,
    10000052,
    "Romi V - Moon 1 - Freedom Extension Storage"
  ],
  [
    60007807,
    10000052,
    "Romi VII - Moon 11 - Amarr Civil Service Bureau Offices"
  ],
  [
    60000067,
    10000038,
    "Ronne I - Moon 1 - CBD Corporation Storage"
  ],
  [
    60009349,
    10000032,
    "Rorsins II - Moon 1 - Federal Freight Storage"
  ],
  [
    60012121,
    10000032,
    "Rorsins II - Moon 1 - Federation Customs Testing Facilities"
  ],
  [
    60012118,
    10000032,
    "Rorsins IV - Moon 1 - Federation Customs Testing Facilities"
  ],
  [
    60008551,
    10000036,
    "Roushzar II - Emperor Family Bureau"
  ],
  [
    60007036,
    10000036,
    "Roushzar VI - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60007021,
    10000036,
    "Roushzar VII - Moon 12 - Imperial Shipment Storage"
  ],
  [
    60007030,
    10000036,
    "Roushzar X - Moon 4 - Imperial Shipment Storage"
  ],
  [
    60014335,
    10000022,
    "RPS-0K VIII - Moon 1 - True Power Assembly Plant"
  ],
  [
    60014218,
    10000022,
    "RRWI-5 III - True Creations Logistic Support"
  ],
  [
    60009262,
    10000041,
    "RSS-KA VIII - Moon 15 - TransStellar Shipping Storage"
  ],
  [
    60009253,
    10000041,
    "RSS-KA VIII - Moon 19 - TransStellar Shipping Storage"
  ],
  [
    60012934,
    10000043,
    "Ruchy I - DED Testing Facilities"
  ],
  [
    60005479,
    10000043,
    "Ruchy II - Moon 8 - Core Complexion Inc. Storage"
  ],
  [
    60009823,
    10000048,
    "Ruerrotta II - Combined Harvest Plantation"
  ],
  [
    60009814,
    10000048,
    "Ruerrotta IV - Moon 2 - Combined Harvest Plantation"
  ],
  [
    60011326,
    10000048,
    "Ruerrotta IV - Moon 5 - Bank of Luminaire Depository"
  ],
  [
    60011164,
    10000020,
    "Rumida IV - Moon 12 - Aliastra Retail Center"
  ],
  [
    60014605,
    10000020,
    "Rumida V - Moon 1 - Hedion University"
  ],
  [
    60011161,
    10000020,
    "Rumida V - Moon 21 - Aliastra Retail Center"
  ],
  [
    60002788,
    10000016,
    "Ruvas II - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60004399,
    10000016,
    "Ruvas IV - Moon 1 - Corporate Police Force Assembly Plant"
  ],
  [
    60000472,
    10000016,
    "Ruvas VI - Moon 10 - Hyasyoda Corporation Refinery"
  ],
  [
    60003199,
    10000016,
    "Ruvas VII - State and Region Bank Depository"
  ],
  [
    60014317,
    10000022,
    "RV5-DW VII - Moon 2 - True Power Assembly Plant"
  ],
  [
    60014809,
    10000042,
    "Ryddinjorn VI - Moon 2 - Pator Tech School"
  ],
  [
    60014242,
    10000022,
    "S-BWWQ III - Moon 4 - True Creations Storage Bay"
  ],
  [
    60014919,
    10000045,
    "S-EVIQ III - Moon 1 - Serpentis Corporation Cloning"
  ],
  [
    60002518,
    10000041,
    "S-U8A4 IV - Moon 1 - Expert Distribution Warehouse"
  ],
  [
    60013447,
    10000041,
    "S-U8A4 V - Intaki Space Police Logistic Support"
  ],
  [
    60002104,
    10000041,
    "S-U8A4 V - Moon 1 - Ishukone Corporation Factory"
  ],
  [
    60002101,
    10000041,
    "S-U8A4 VI - Moon 1 - Ishukone Corporation Factory"
  ],
  [
    60012226,
    10000012,
    "S1DP-Y IX - Moon 17 - Archangels Testing Facilities"
  ],
  [
    60012835,
    10000012,
    "S1DP-Y VIII - Moon 15 - Serpentis Corporation Reprocessing Facility"
  ],
  [
    60005065,
    10000043,
    "Saana III - Moon 6 - Republic Security Services Logistic Support"
  ],
  [
    60014533,
    10000016,
    "Saatuban I - X-Sense Chemical Refinery"
  ],
  [
    60002389,
    10000016,
    "Saatuban III - Propel Dynamics Warehouse"
  ],
  [
    60000334,
    10000016,
    "Saatuban IX - Moon 1 - Ytiri Storage"
  ],
  [
    60004273,
    10000016,
    "Saatuban IX - Moon 2 - Wiyrkomi Peace Corps Assembly Plant"
  ],
  [
    60004252,
    10000016,
    "Saatuban V - Moon 2 - Spacelane Patrol Logistic Support"
  ],
  [
    60014527,
    10000016,
    "Saatuban V - Moon 2 - X-Sense Chemical Storage"
  ],
  [
    60002386,
    10000016,
    "Saatuban VI - Moon 2 - Propel Dynamics Warehouse"
  ],
  [
    60007606,
    10000016,
    "Saatuban VII - Moon 2 - Nurtura Warehouse"
  ],
  [
    60004246,
    10000016,
    "Saatuban VIII - Moon 2 - Spacelane Patrol Assembly Plant"
  ],
  [
    60007924,
    10000054,
    "Sadana I - Ministry of War Information Center"
  ],
  [
    60008125,
    10000054,
    "Sadana VII - Moon 10 - Ministry of Assessment Bureau Offices"
  ],
  [
    60008116,
    10000054,
    "Sadana VIII - Ministry of Assessment Bureau Offices"
  ],
  [
    60007933,
    10000054,
    "Sadana VIII - Moon 2 - Ministry of War Bureau Offices"
  ],
  [
    60010024,
    10000054,
    "Sadana VIII - Quafe Company Warehouse"
  ],
  [
    60015011,
    10000020,
    "Safilbab VIII - Moon 4 - Royal Amarr Institute School"
  ],
  [
    60008368,
    10000043,
    "Safizon II - Moon 1 - Amarr Navy Assembly Plant"
  ],
  [
    60013840,
    10000049,
    "Safshela V - Moon 6 - Khanid Transport Storage"
  ],
  [
    60006961,
    10000020,
    "Sagain V - Inherent Implants Biotech Production"
  ],
  [
    60009082,
    10000020,
    "Sagain VIII - Moon 11 - TransStellar Shipping Storage"
  ],
  [
    60007828,
    10000043,
    "Sahda II - Amarr Civil Service Information Center"
  ],
  [
    60007831,
    10000043,
    "Sahda IV - Moon 14 - Amarr Civil Service Bureau Offices"
  ],
  [
    60008287,
    10000043,
    "Sahda IV - Moon 7 - Amarr Trade Registry Information Center"
  ],
  [
    60011197,
    10000043,
    "Sahda VII - Moon 2 - Aliastra Retail Center"
  ],
  [
    60007171,
    10000043,
    "Sahdil II - Moon 13 - Imperial Shipment Storage"
  ],
  [
    60012958,
    10000043,
    "Sahdil III - DED Logistic Support"
  ],
  [
    60008731,
    10000043,
    "Sahdil III - Moon 1 - Ardishapur Family Bureau"
  ],
  [
    60012793,
    10000038,
    "Sahtogas IV - Moon 2 - Amarr Navy Logistic Support"
  ],
  [
    60006367,
    10000038,
    "Saikamon III - Moon 2 - Carthum Conglomerate Factory"
  ],
  [
    60006379,
    10000038,
    "Saikamon VI - Moon 2 - Carthum Conglomerate Production Plant"
  ],
  [
    60003514,
    10000033,
    "Saikanen III - Moon 3 - Caldari Business Tribunal Accounting"
  ],
  [
    60002380,
    10000033,
    "Saikanen III - Propel Dynamics Warehouse"
  ],
  [
    60001444,
    10000033,
    "Saila VII - Moon 11 - Rapid Assembly Factory"
  ],
  [
    60003784,
    10000033,
    "Saila VII - Moon 14 - Caldari Navy Assembly Plant"
  ],
  [
    60002044,
    10000033,
    "Saila VII - Moon 15 - Echelon Entertainment Development Studio"
  ],
  [
    60000421,
    10000033,
    "Saila VII - Moon 15 - Ytiri Storage"
  ],
  [
    60001345,
    10000033,
    "Saila VII - Moon 5 - Wiyrkomi Corporation Factory"
  ],
  [
    60001771,
    10000033,
    "Saila VIII - Moon 16 - Zainou Biotech Production"
  ],
  [
    60004048,
    10000002,
    "Saisio VII - Moon 1 - Peace and Order Unit Testing Facilities"
  ],
  [
    60000649,
    10000002,
    "Saisio VIII - Moon 16 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60002734,
    10000002,
    "Saisio VIII - Moon 20 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60001642,
    10000002,
    "Saisio VIII - Moon 4 - Perkone Factory"
  ],
  [
    60015025,
    10000002,
    "Sakenta I - State War Academy"
  ],
  [
    60006673,
    10000054,
    "Sakht VI - Moon 6 - Zoar and Sons Factory"
  ],
  [
    60013159,
    10000054,
    "Sakht VI - Moon 7 - Genolution Biotech Production"
  ],
  [
    60007228,
    10000043,
    "Sakhti IX - Moon 7 - Amarr Certified News Development Studio"
  ],
  [
    60008743,
    10000043,
    "Sakhti VIII - Moon 5 - Ardishapur Family Bureau"
  ],
  [
    60002284,
    10000002,
    "Sakkikainen VI - Moon 1 - Lai Dai Corporation Factory"
  ],
  [
    60001879,
    10000002,
    "Sakkikainen VI - Moon 1 - Nugoeihuvi Corporation Publisher"
  ],
  [
    60004435,
    10000002,
    "Sakkikainen VI - Moon 8 - School of Applied Knowledge"
  ],
  [
    60004780,
    10000028,
    "Sakulda IX - Moon 2 - Republic Fleet Testing Facilities"
  ],
  [
    60008644,
    10000052,
    "Salah III - Kador Family Bureau"
  ],
  [
    60008812,
    10000052,
    "Salah V - Moon 1 - Civic Court Law School"
  ],
  [
    60012148,
    10000001,
    "Salashayama VII - Moon 8 - Ammatar Fleet Logistic Support"
  ],
  [
    60015115,
    10000069,
    "Samanuni III - Wiyrkomi Corporation Factory"
  ],
  [
    60015116,
    10000069,
    "Samanuni VIII - Caldari Constructions Logistic Support"
  ],
  [
    60015117,
    10000069,
    "Samanuni XI - Caldari Navy Warehouse"
  ],
  [
    60009070,
    10000020,
    "Saminer IX - TransStellar Shipping Storage"
  ],
  [
    60004168,
    10000033,
    "Sankkasen II - Spacelane Patrol Assembly Plant"
  ],
  [
    60003121,
    10000033,
    "Sankkasen IX - Moon 10 - Expert Housing Production Plant"
  ],
  [
    60003421,
    10000033,
    "Sankkasen IX - Moon 12 - Mercantile Club Bureau"
  ],
  [
    60003130,
    10000033,
    "Sankkasen IX - Moon 20 - Caldari Funds Unlimited Depository"
  ],
  [
    60004165,
    10000033,
    "Sankkasen VII - Moon 10 - Spacelane Patrol Assembly Plant"
  ],
  [
    60000883,
    10000033,
    "Sankkasen VII - Moon 4 - Caldari Provisions Plantation"
  ],
  [
    60003115,
    10000033,
    "Sankkasen VII - Moon 6 - Expert Housing Production Plant"
  ],
  [
    60004456,
    10000033,
    "Sankkasen VII - Moon 6 - Science and Trade Institute School"
  ],
  [
    60004162,
    10000033,
    "Sankkasen VII - Moon 8 - Spacelane Patrol Assembly Plant"
  ],
  [
    60003118,
    10000033,
    "Santola IV - Moon 1 - Expert Housing Production Plant"
  ],
  [
    60003133,
    10000033,
    "Santola VIII - Moon 11 - Caldari Funds Unlimited Depository"
  ],
  [
    60004156,
    10000033,
    "Santola VIII - Moon 9 - Spacelane Patrol Testing Facilities"
  ],
  [
    60011227,
    10000067,
    "Saphthar IX - Moon 16 - Aliastra Warehouse"
  ],
  [
    60009892,
    10000016,
    "Saranen V - Moon 12 - Quafe Company Warehouse"
  ],
  [
    60003979,
    10000016,
    "Saranen V - Moon 16 - Ishukone Watch Testing Facilities"
  ],
  [
    60009898,
    10000016,
    "Saranen V - Moon 9 - Quafe Company Warehouse"
  ],
  [
    60001666,
    10000016,
    "Sarekuwa III - Moon 6 - Caldari Steel Warehouse"
  ],
  [
    60003838,
    10000016,
    "Sarekuwa III - Moon 8 - Caldari Navy Assembly Plant"
  ],
  [
    60015109,
    10000069,
    "Sarenemi V - Home Guard Assembly Plant"
  ],
  [
    60011365,
    10000044,
    "Sarline IX - Moon 10 - Bank of Luminaire Depository"
  ],
  [
    60011368,
    10000044,
    "Sarline IX - Moon 15 - Bank of Luminaire Depository"
  ],
  [
    60011074,
    10000044,
    "Sarline IX - Moon 20 - FedMart Storage"
  ],
  [
    60009325,
    10000044,
    "Sarline IX - Moon 26 - Federal Freight Storage"
  ],
  [
    60011764,
    10000044,
    "Sarline VII - Moon 16 - Federation Navy Assembly Plant"
  ],
  [
    60011755,
    10000044,
    "Sarline VII - Moon 18 - Federation Navy Assembly Plant"
  ],
  [
    60011068,
    10000044,
    "Sarline VIII - Moon 1 - FedMart Warehouse"
  ],
  [
    60011761,
    10000044,
    "Sarline VIII - Moon 7 - Federation Navy Assembly Plant"
  ],
  [
    60014632,
    10000043,
    "Sarum Prime III - Moon 2 - Imperial Academy"
  ],
  [
    60008650,
    10000043,
    "Sarum Prime VI - Moon 7 - Sarum Family Assembly Plant"
  ],
  [
    60013096,
    10000038,
    "Sasiekko I - Genolution Biotech Production"
  ],
  [
    60015066,
    10000038,
    "Sasiekko III - 24th Imperial Crusade Logistic Support"
  ],
  [
    60006205,
    10000038,
    "Sasiekko IV - Moon 2 - Amarr Constructions Warehouse"
  ],
  [
    60008989,
    10000036,
    "Sasoutikh V - Moon 11 - Theology Council Accounting"
  ],
  [
    60008212,
    10000036,
    "Sasoutikh VI - Moon 3 - Ministry of Internal Order Logistic Support"
  ],
  [
    60012124,
    10000001,
    "Sasta VI - Moon 3 - Ammatar Fleet Assembly Plant"
  ],
  [
    60008350,
    10000038,
    "Satalama II - Amarr Trade Registry Archives"
  ],
  [
    60009280,
    10000043,
    "Sayartchen II - TransStellar Shipping Storage"
  ],
  [
    60008659,
    10000043,
    "Sayartchen V - Moon 2 - Sarum Family Logistic Support"
  ],
  [
    60006919,
    10000043,
    "Sayartchen VII - Moon 12 - HZO Refinery Mineral Reserve"
  ],
  [
    60006916,
    10000043,
    "Sayartchen VIII - HZO Refinery Mineral Reserve"
  ],
  [
    60010342,
    10000068,
    "Scheenins II - Moon 2 - Roden Shipyards Factory"
  ],
  [
    60001924,
    10000068,
    "Scheenins III - Moon 3 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001921,
    10000068,
    "Scheenins III - Moon 7 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60010834,
    10000068,
    "Scheenins IV - Chemal Tech Factory"
  ],
  [
    60010837,
    10000068,
    "Scheenins V - Moon 8 - Chemal Tech Factory"
  ],
  [
    60014656,
    10000065,
    "Schmaeel VIII - Moon 9 - Imperial Academy"
  ],
  [
    60000028,
    10000032,
    "Schoorasana VI - Moon 1 - CBD Corporation Storage"
  ],
  [
    60000031,
    10000032,
    "Schoorasana VI - Moon 6 - CBD Corporation Storage"
  ],
  [
    60012931,
    10000068,
    "Scolluzer VI - DED Logistic Support"
  ],
  [
    60011587,
    10000068,
    "Scolluzer VII - Moon 1 - University of Caille"
  ],
  [
    60011899,
    10000068,
    "Scolluzer VII - Moon 2 - Federation Navy Logistic Support"
  ],
  [
    60014695,
    10000068,
    "Scolluzer VII - Moon 3 - Federal Navy Academy"
  ],
  [
    60014497,
    10000068,
    "Scolluzer VIII - Moon 1 - X-Sense Chemical Storage"
  ],
  [
    60001954,
    10000068,
    "Scolluzer VIII - Moon 10 - Nugoeihuvi Corporation Publisher"
  ],
  [
    60014494,
    10000068,
    "Scolluzer XI - Moon 2 - X-Sense Chemical Storage"
  ],
  [
    60001951,
    10000068,
    "Scolluzer XI - Moon 4 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60005155,
    10000068,
    "Scolluzer XI - Republic Security Services Assembly Plant"
  ],
  [
    60011653,
    10000037,
    "Scuelazyns III - Moon 1 - Federal Administration Information Center"
  ],
  [
    60010867,
    10000037,
    "Scuelazyns VII - Moon 1 - Duvolle Laboratories Factory"
  ],
  [
    60011494,
    10000052,
    "Sechmaren IX - Pend Insurance Depository"
  ],
  [
    60011491,
    10000052,
    "Sechmaren VIII - Moon 10 - Pend Insurance Depository"
  ],
  [
    60003631,
    10000020,
    "Sehmosh VIII - Moon 22 - Caldari Business Tribunal Information Center"
  ],
  [
    60014599,
    10000065,
    "Sehmy VIII - Moon 2 - Hedion University"
  ],
  [
    60003628,
    10000020,
    "Seil IV - Moon 9 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60015012,
    10000020,
    "Seitam VI - Royal Amarr Institute School"
  ],
  [
    60001780,
    10000016,
    "Semiki IV - Zainou Biohazard Containment Facility"
  ],
  [
    60004270,
    10000016,
    "Semiki IX - Moon 4 - Wiyrkomi Peace Corps Testing Facilities"
  ],
  [
    60005659,
    10000016,
    "Semiki IX - Moon 5 - Core Complexion Inc. Storage"
  ],
  [
    60011146,
    10000016,
    "Semiki V - Aliastra Warehouse"
  ],
  [
    60015026,
    10000002,
    "Senda III - Moon 1 - State War Academy"
  ],
  [
    60012301,
    10000001,
    "Sendaya V - CONCORD Bureau"
  ],
  [
    60012139,
    10000001,
    "Serad IV - Moon 12 - Ammatar Fleet Logistic Support"
  ],
  [
    60012247,
    10000058,
    "Serpentis Prime II - Archangels Testing Facilities"
  ],
  [
    60013993,
    10000058,
    "Serpentis Prime VI - Moon 1 - Serpentis Inquest Biotech Research Center"
  ],
  [
    60012859,
    10000058,
    "Serpentis Prime VIII - Moon 2 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60007885,
    10000067,
    "Serren VIII - Moon 15 - Amarr Civil Service Information Center"
  ],
  [
    60010372,
    10000064,
    "Seyllin VI - Moon 3 - Roden Shipyards Factory"
  ],
  [
    60010204,
    10000064,
    "Seyllin VIII - Moon 14 - CreoDron Warehouse"
  ],
  [
    60006310,
    10000043,
    "Shabura IX - Moon 7 - Carthum Conglomerate Factory"
  ],
  [
    60006319,
    10000043,
    "Shabura VI - Moon 10 - Carthum Conglomerate Warehouse"
  ],
  [
    60001120,
    10000054,
    "Shafrak VIII - Moon 13 - Kaalakiota Corporation Factory"
  ],
  [
    60008443,
    10000054,
    "Shafrak VIII - Moon 9 - Amarr Navy Assembly Plant"
  ],
  [
    60008455,
    10000065,
    "Shaha IV - Moon 1 - Amarr Navy Assembly Plant"
  ],
  [
    60005173,
    10000065,
    "Shaha IV - Moon 2 - Republic Security Services Assembly Plant"
  ],
  [
    60011251,
    10000067,
    "Shalne VII - Moon 1 - Aliastra Retail Center"
  ],
  [
    60012298,
    10000001,
    "Shamahi IX - Moon 12 - CONCORD Bureau"
  ],
  [
    60012643,
    10000067,
    "Shapisin I - Sisters of EVE Bureau"
  ],
  [
    60005485,
    10000067,
    "Shapisin II - Core Complexion Inc. Factory"
  ],
  [
    60005491,
    10000067,
    "Shapisin VII - Moon 2 - Core Complexion Inc. Factory"
  ],
  [
    60008434,
    10000043,
    "Sharhelund VI - Moon 3 - Amarr Navy Assembly Plant"
  ],
  [
    60005989,
    10000043,
    "Sharhelund VIII - Moon 4 - Freedom Extension Storage"
  ],
  [
    60008674,
    10000043,
    "Sharhelund VIII - Moon 5 - Sarum Family Assembly Plant"
  ],
  [
    60008239,
    10000067,
    "Sharza III - Ministry of Internal Order Assembly Plant"
  ],
  [
    60008593,
    10000067,
    "Sharza VI - Moon 4 - Emperor Family Bureau"
  ],
  [
    60008599,
    10000067,
    "Sharza VII - Moon 3 - Emperor Family Bureau"
  ],
  [
    60008590,
    10000067,
    "Sharza VII - Moon 5 - Emperor Family Bureau"
  ],
  [
    60007984,
    10000052,
    "Shemah V - Moon 1 - Ministry of War Information Center"
  ],
  [
    60006280,
    10000052,
    "Shemah VI - Moon 12 - Carthum Conglomerate Warehouse"
  ],
  [
    60006277,
    10000052,
    "Shemah VI - Moon 16 - Carthum Conglomerate Factory"
  ],
  [
    60001006,
    10000052,
    "Shemah VII - Moon 10 - Kaalakiota Corporation Factory"
  ],
  [
    60007990,
    10000052,
    "Shemah VIII - Moon 19 - Ministry of War Bureau Offices"
  ],
  [
    60008632,
    10000052,
    "Shemah VIII - Moon 2 - Kador Family Bureau"
  ],
  [
    60008323,
    10000054,
    "Shenda VI - Moon 12 - Amarr Trade Registry Information Center"
  ],
  [
    60010531,
    10000054,
    "Shenda VIII - Moon 15 - Impetus Development Studio"
  ],
  [
    60007066,
    10000067,
    "Shera IX - Moon 4 - Imperial Shipment Storage"
  ],
  [
    60014500,
    10000067,
    "Sheroo VII - X-Sense Chemical Refinery"
  ],
  [
    60014503,
    10000067,
    "Sheroo VIII - X-Sense Chemical Refinery"
  ],
  [
    60007195,
    10000067,
    "Sheroo X - Moon 11 - Amarr Certified News Publisher"
  ],
  [
    60014506,
    10000067,
    "Sheroo X - Moon 11 - X-Sense Chemical Refinery"
  ],
  [
    60012616,
    10000067,
    "Sheroo X - Moon 3 - Sisters of EVE Bureau"
  ],
  [
    60006631,
    10000067,
    "Sheroo X - Moon 5 - Zoar and Sons Factory"
  ],
  [
    60002494,
    10000020,
    "Shesha I - Expert Distribution Retail Center"
  ],
  [
    60006583,
    10000020,
    "Shesha II - Viziam Warehouse"
  ],
  [
    60006223,
    10000020,
    "Shesha III - Carthum Conglomerate Factory"
  ],
  [
    60000184,
    10000020,
    "Shesha III - CBD Corporation Storage"
  ],
  [
    60002194,
    10000020,
    "Shesha V - Ishukone Corporation Factory"
  ],
  [
    60007513,
    10000020,
    "Shesha VII - Nurtura Plantation"
  ],
  [
    60005461,
    10000002,
    "Shihuken VI - Moon 2 - Core Complexion Inc. Storage"
  ],
  [
    60000295,
    10000002,
    "Shihuken VII - Moon 10 - Prompt Delivery Storage"
  ],
  [
    60005449,
    10000002,
    "Shihuken VII - Moon 9 - Core Complexion Inc. Warehouse"
  ],
  [
    60004243,
    10000002,
    "Shihuken VIII - Moon 2 - Spacelane Patrol Logistic Support"
  ],
  [
    60006193,
    10000054,
    "Shirshocin III - Moon 2 - Amarr Constructions Warehouse"
  ],
  [
    60001966,
    10000065,
    "Shokal VIII - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60007090,
    10000020,
    "Shousran VII - Imperial Shipment Storage"
  ],
  [
    60007696,
    10000043,
    "Shumam VII - Further Foodstuffs Plantation"
  ],
  [
    60008131,
    10000043,
    "Shuria IV - Moon 1 - Ministry of Internal Order Logistic Support"
  ],
  [
    60007768,
    10000043,
    "Shuria X - Moon 10 - Amarr Civil Service Bureau Offices"
  ],
  [
    60008137,
    10000043,
    "Shuria X - Moon 16 - Ministry of Internal Order Assembly Plant"
  ],
  [
    60007162,
    10000043,
    "Shuria XI - Imperial Shipment Storage"
  ],
  [
    60008755,
    10000043,
    "Shuria XI - Moon 2 - Ardishapur Family Bureau"
  ],
  [
    60013123,
    10000067,
    "Sibe VI - Moon 1 - Genolution Biotech Production"
  ],
  [
    60006304,
    10000043,
    "Sibot XII - Carthum Conglomerate Production Plant"
  ],
  [
    60007393,
    10000043,
    "Sieh II - Moon 1 - Joint Harvesting Plantation"
  ],
  [
    60007534,
    10000043,
    "Sieh II - Moon 9 - Nurtura Plantation"
  ],
  [
    60007528,
    10000043,
    "Sieh III - Moon 13 - Nurtura Plantation"
  ],
  [
    60007399,
    10000043,
    "Sieh III - Moon 16 - Joint Harvesting Mining Outpost"
  ],
  [
    60012619,
    10000067,
    "Sigga VIII - Moon 15 - Sisters of EVE Bureau"
  ],
  [
    60006634,
    10000067,
    "Sigga VIII - Moon 4 - Zoar and Sons Factory"
  ],
  [
    60002851,
    10000002,
    "Silen III - Moon 15 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60002275,
    10000002,
    "Silen III - Moon 9 - Lai Dai Corporation Research Center"
  ],
  [
    60003367,
    10000002,
    "Silen IV - Moon 18 - Chief Executive Panel Treasury"
  ],
  [
    60002638,
    10000032,
    "Sileperer IV - Moon 9 - Expert Distribution Warehouse"
  ],
  [
    60005875,
    10000043,
    "Simbeloud IX - Freedom Extension Retail Center"
  ],
  [
    60002566,
    10000043,
    "Simbeloud IX - Moon 1 - Expert Distribution Warehouse"
  ],
  [
    60005863,
    10000043,
    "Simbeloud IX - Moon 2 - Freedom Extension Storage"
  ],
  [
    60002560,
    10000043,
    "Simbeloud VI - Expert Distribution Warehouse"
  ],
  [
    60005869,
    10000043,
    "Simbeloud VI - Moon 1 - Freedom Extension Storage"
  ],
  [
    60011260,
    10000067,
    "Simela III - Aliastra Warehouse"
  ],
  [
    60012646,
    10000067,
    "Simela IV - Moon 7 - Sisters of EVE Academy"
  ],
  [
    60010426,
    10000067,
    "Simela VI - Moon 2 - Poteque Pharmaceuticals Biotech Research Center"
  ],
  [
    60006694,
    10000020,
    "Sinid I - Zoar and Sons Warehouse"
  ],
  [
    60000220,
    10000020,
    "Sinid VI - CBD Corporation Storage"
  ],
  [
    60002446,
    10000020,
    "Sinid VI - Moon 12 - Expert Distribution Warehouse"
  ],
  [
    60000232,
    10000020,
    "Sinid VI - Moon 2 - CBD Corporation Storage"
  ],
  [
    60002452,
    10000020,
    "Sinid VI - Moon 9 - Expert Distribution Warehouse"
  ],
  [
    60014788,
    10000042,
    "Sirekur VIII - Moon 1 - Republic University"
  ],
  [
    60001195,
    10000033,
    "Sirppala I - Moon 1 - Kaalakiota Corporation Warehouse"
  ],
  [
    60001741,
    10000033,
    "Sirppala II - Caldari Steel Factory"
  ],
  [
    60001204,
    10000033,
    "Sirppala II - Moon 3 - Kaalakiota Corporation Factory"
  ],
  [
    60001513,
    10000033,
    "Sirppala II - Moon 3 - Rapid Assembly Factory"
  ],
  [
    60001201,
    10000033,
    "Sirppala IV - Moon 16 - Kaalakiota Corporation Warehouse"
  ],
  [
    60001507,
    10000033,
    "Sirppala IV - Moon 4 - Rapid Assembly Factory"
  ],
  [
    60003394,
    10000002,
    "Sirseshin VI - Moon 1 - Mercantile Club Bureau"
  ],
  [
    60004234,
    10000002,
    "Sirseshin VIII - Moon 3 - Spacelane Patrol Assembly Plant"
  ],
  [
    60002593,
    10000030,
    "Siseide VII - Expert Distribution Retail Center"
  ],
  [
    60007336,
    10000030,
    "Siseide VII - Moon 17 - Joint Harvesting Food Packaging"
  ],
  [
    60002602,
    10000030,
    "Siseide VIII - Expert Distribution Warehouse"
  ],
  [
    60004993,
    10000030,
    "Sist VI - Moon 2 - Republic Justice Department Law School"
  ],
  [
    60004987,
    10000030,
    "Sist VI - Moon 4 - Republic Justice Department Accounting"
  ],
  [
    60005329,
    10000042,
    "Situner VI - Moon 13 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60003169,
    10000033,
    "Sivala VI - Moon 1 - Caldari Funds Unlimited Depository"
  ],
  [
    60002860,
    10000033,
    "Sivala VIII - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60007642,
    10000020,
    "Siyi I - Nurtura Plantation"
  ],
  [
    60011305,
    10000020,
    "Siyi II - Aliastra Warehouse"
  ],
  [
    60007303,
    10000020,
    "Siyi III - Moon 12 - Joint Harvesting Plantation"
  ],
  [
    60011308,
    10000020,
    "Siyi IV - Moon 11 - Aliastra Warehouse"
  ],
  [
    60008788,
    10000020,
    "Siyi IV - Moon 14 - Tash-Murkon Family Treasury"
  ],
  [
    60007633,
    10000020,
    "Siyi IV - Moon 9 - Nurtura Plantation"
  ],
  [
    60008791,
    10000020,
    "Siyi V - Moon 2 - Tash-Murkon Family Treasury"
  ],
  [
    60011299,
    10000020,
    "Siyi V - Moon 6 - Aliastra Warehouse"
  ],
  [
    60008785,
    10000020,
    "Siyi VI - Tash-Murkon Family Academy"
  ],
  [
    60011383,
    10000020,
    "Sizamod V - Moon 1 - Pend Insurance Vault"
  ],
  [
    60011380,
    10000020,
    "Sizamod VIII - Moon 5 - Pend Insurance Vault"
  ],
  [
    60004651,
    10000028,
    "Skarkon III - Moon 14 - Republic Parliament Bureau"
  ],
  [
    60010882,
    10000048,
    "Slays II - Duvolle Laboratories Factory"
  ],
  [
    60006871,
    10000048,
    "Slays V - Moon 1 - Ducia Foundry Mineral Reserve"
  ],
  [
    60005914,
    10000048,
    "Slays VI - Moon 9 - Freedom Extension Storage"
  ],
  [
    60014731,
    10000048,
    "Slays VII - Moon 3 - Center for Advanced Studies School"
  ],
  [
    60011704,
    10000048,
    "Slays VII - Moon 3 - Federal Administration Bureau Offices"
  ],
  [
    60000895,
    10000016,
    "Sobaseki IX - Moon 9 - Caldari Provisions Food Packaging"
  ],
  [
    60000844,
    10000016,
    "Sobaseki VI - Minedrill Mineral Reserve"
  ],
  [
    60003916,
    10000016,
    "Sobaseki VII - Caldari Navy Logistic Support"
  ],
  [
    60004018,
    10000016,
    "Sobaseki VIII - Moon 1 - Home Guard Assembly Plant"
  ],
  [
    60003925,
    10000016,
    "Sobaseki X - Moon 1 - Caldari Navy Assembly Plant"
  ],
  [
    60002419,
    10000016,
    "Sobaseki X - Moon 12 - Propel Dynamics Factory"
  ],
  [
    60000892,
    10000016,
    "Sobaseki X - Moon 15 - Caldari Provisions Warehouse"
  ],
  [
    60004012,
    10000016,
    "Sobaseki XI - Moon 1 - Home Guard Assembly Plant"
  ],
  [
    60000763,
    10000016,
    "Sobaseki XIII - Moon 3 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60003094,
    10000016,
    "Sobaseki XIII - Moon 4 - Expert Housing Warehouse"
  ],
  [
    60013312,
    10000054,
    "Soliara IX - Moon 13 - Impro Factory"
  ],
  [
    60008830,
    10000054,
    "Soliara IX - Moon 18 - Civic Court Tribunal"
  ],
  [
    60008836,
    10000054,
    "Soliara VII - Moon 7 - Civic Court Tribunal"
  ],
  [
    60006922,
    10000043,
    "Somouh IX - Moon 1 - HZO Refinery"
  ],
  [
    60009277,
    10000043,
    "Somouh V - Moon 6 - TransStellar Shipping Storage"
  ],
  [
    60009880,
    10000043,
    "Somouh VII - Moon 11 - Quafe Company Retail Center"
  ],
  [
    60006208,
    10000052,
    "Sonama IV - Moon 1 - Amarr Constructions Production Plant"
  ],
  [
    60000241,
    10000052,
    "Sonama VI - Moon 12 - CBD Corporation Storage"
  ],
  [
    60014596,
    10000052,
    "Sonama VI - Moon 15 - X-Sense Chemical Refinery"
  ],
  [
    60014593,
    10000052,
    "Sonama VII - Moon 14 - X-Sense Chemical Refinery"
  ],
  [
    60014590,
    10000052,
    "Sonama VII - Moon 16 - X-Sense Chemical Refinery"
  ],
  [
    60006214,
    10000052,
    "Sonama VII - Moon 4 - Amarr Constructions Production Plant"
  ],
  [
    60000247,
    10000052,
    "Sonama VII - Moon 5 - CBD Corporation Storage"
  ],
  [
    60012295,
    10000001,
    "Sooma X - CONCORD Academy"
  ],
  [
    60008068,
    10000036,
    "Soosat X - Moon 7 - Ministry of Assessment Archives"
  ],
  [
    60011908,
    10000068,
    "Sortet V - Moon 1 - Federation Navy Assembly Plant"
  ],
  [
    60012925,
    10000068,
    "Sortet VI - Moon 5 - DED Logistic Support"
  ],
  [
    60009274,
    10000043,
    "Sorzielang VII - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60009868,
    10000043,
    "Sorzielang VII - Moon 17 - Quafe Company Factory"
  ],
  [
    60015065,
    10000038,
    "Sosala IV - 24th Imperial Crusade Logistic Support"
  ],
  [
    60008545,
    10000036,
    "Sosan II - Emperor Family Academy"
  ],
  [
    60008548,
    10000036,
    "Sosan III - Moon 4 - Emperor Family Academy"
  ],
  [
    60012715,
    10000002,
    "Soshin II - Sisters of EVE Bureau"
  ],
  [
    60002854,
    10000002,
    "Soshin V - Moon 2 - Sukuuvestaa Corporation Factory"
  ],
  [
    60002278,
    10000002,
    "Soshin VII - Moon 1 - Lai Dai Corporation Factory"
  ],
  [
    60000907,
    10000002,
    "Soshin VII - Moon 4 - Caldari Provisions Plantation"
  ],
  [
    60002857,
    10000002,
    "Soshin VIII - Sukuuvestaa Corporation Factory"
  ],
  [
    60010528,
    10000054,
    "Sota III - Moon 12 - Impetus Development Studio"
  ],
  [
    60000709,
    10000016,
    "Sotrentaira VI - Moon 11 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60000955,
    10000016,
    "Sotrentaira VI - Moon 3 - Caldari Provisions Warehouse"
  ],
  [
    60000958,
    10000016,
    "Sotrentaira VI - Moon 5 - Caldari Provisions Plantation"
  ],
  [
    60004030,
    10000016,
    "Sotrentaira VII - Moon 15 - Home Guard Logistic Support"
  ],
  [
    60013108,
    10000016,
    "Sotrentaira VII - Moon 3 - Genolution Biotech Production"
  ],
  [
    60014443,
    10000030,
    "Sotrenzur IX - Moon 1 - Trust Partners Warehouse"
  ],
  [
    60010855,
    10000030,
    "Sotrenzur V - Chemal Tech Factory"
  ],
  [
    60010852,
    10000030,
    "Sotrenzur XI - Moon 1 - Chemal Tech Factory"
  ],
  [
    60008557,
    10000065,
    "Soumi I - Moon 1 - Emperor Family Bureau"
  ],
  [
    60008554,
    10000065,
    "Soumi V - Moon 4 - Emperor Family Bureau"
  ],
  [
    60003487,
    10000065,
    "Soumi VII - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60008563,
    10000065,
    "Soumi VII - Moon 1 - Emperor Family Bureau"
  ],
  [
    60000172,
    10000054,
    "Soza XII - Moon 14 - CBD Corporation Storage"
  ],
  [
    60013600,
    10000017,
    "SQ-2XA II - Jove Navy Testing Facilities"
  ],
  [
    60013603,
    10000017,
    "SQ-2XA IV - Jove Navy Testing Facilities"
  ],
  [
    60013768,
    10000019,
    "SQVI-U V - Moon 1 - Jovian Directorate Treasury"
  ],
  [
    60013330,
    10000048,
    "Stacmon V - Impro Factory"
  ],
  [
    60011893,
    10000048,
    "Stacmon V - Moon 9 - Federation Navy Assembly Plant"
  ],
  [
    60005923,
    10000048,
    "Stacmon VI - Moon 1 - Freedom Extension Storage"
  ],
  [
    60013333,
    10000048,
    "Stacmon VII - Moon 1 - Impro Factory"
  ],
  [
    60005929,
    10000048,
    "Stacmon VIII - Moon 22 - Freedom Extension Warehouse"
  ],
  [
    60009508,
    10000048,
    "Stacmon VIII - Moon 6 - Material Acquisition Refinery"
  ],
  [
    60011701,
    10000048,
    "Stacmon X - Moon 1 - Federal Administration Bureau Offices"
  ],
  [
    60014545,
    10000032,
    "Stayme VI - Moon 3 - X-Sense Chemical Refinery"
  ],
  [
    60010942,
    10000032,
    "Stegette III - Moon 6 - Duvolle Laboratories Factory"
  ],
  [
    60003328,
    10000032,
    "Stegette IV - Moon 10 - Modern Finances Depository"
  ],
  [
    60011035,
    10000032,
    "Stegette IV - Moon 11 - FedMart Storage"
  ],
  [
    60003331,
    10000032,
    "Stegette IV - Moon 15 - Modern Finances Depository"
  ],
  [
    60011542,
    10000032,
    "Stegette IV - Moon 4 - Garoun Investment Bank Depository"
  ],
  [
    60011545,
    10000032,
    "Stegette V - Moon 19 - Garoun Investment Bank Depository"
  ],
  [
    60011032,
    10000032,
    "Stegette V - Moon 3 - FedMart Warehouse"
  ],
  [
    60010513,
    10000032,
    "Stetille II - Impetus Publisher"
  ],
  [
    60014515,
    10000032,
    "Stetille IV - Moon 11 - X-Sense Chemical Refinery"
  ],
  [
    60009763,
    10000032,
    "Stetille IX - Moon 2 - Combined Harvest Food Packaging"
  ],
  [
    60010603,
    10000032,
    "Stetille IX - Moon 2 - Egonics Inc. Development Studio"
  ],
  [
    60003571,
    10000032,
    "Stetille IX - Moon 4 - Caldari Business Tribunal"
  ],
  [
    60003568,
    10000032,
    "Stetille IX - Moon 7 - Caldari Business Tribunal"
  ],
  [
    60009046,
    10000032,
    "Stetille V - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60003562,
    10000032,
    "Stetille V - Moon 5 - Caldari Business Tribunal"
  ],
  [
    60014512,
    10000032,
    "Stetille V - X-Sense Chemical Refinery"
  ],
  [
    60003574,
    10000032,
    "Stetille VI - Moon 1 - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60014509,
    10000032,
    "Stetille VII - Moon 1 - X-Sense Chemical Refinery"
  ],
  [
    60010510,
    10000032,
    "Stetille VII - Moon 2 - Impetus Development Studio"
  ],
  [
    60009037,
    10000032,
    "Stetille VII - Moon 3 - TransStellar Shipping Storage"
  ],
  [
    60007471,
    10000042,
    "Stirht VII - Moon 13 - Joint Harvesting Mining Outpost"
  ],
  [
    60012349,
    10000042,
    "Stirht VII - Moon 14 - CONCORD Bureau"
  ],
  [
    60006436,
    10000042,
    "Stirht VII - Moon 4 - Imperial Armaments Warehouse"
  ],
  [
    60007465,
    10000042,
    "Stirht VII - Moon 5 - Joint Harvesting Plantation"
  ],
  [
    60004927,
    10000042,
    "Stirht VII - Republic Justice Department Accounting"
  ],
  [
    60009619,
    10000068,
    "Stou I - Moon 1 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60009616,
    10000068,
    "Stou II - Astral Mining Inc. Mining Outpost"
  ],
  [
    60009604,
    10000068,
    "Stou IV - Moon 1 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60009793,
    10000068,
    "Stou IV - Moon 1 - Combined Harvest Plantation"
  ],
  [
    60007660,
    10000068,
    "Stou IV - Moon 1 - Nurtura Plantation"
  ],
  [
    60009796,
    10000068,
    "Stou V - Moon 1 - Combined Harvest Warehouse"
  ],
  [
    60011563,
    10000068,
    "Stou V - Moon 3 - Garoun Investment Bank Depository"
  ],
  [
    60007663,
    10000068,
    "Stou VII - Moon 1 - Nurtura Food Packaging"
  ],
  [
    60009613,
    10000068,
    "Stou VIII - Astral Mining Inc. Mining Outpost"
  ],
  [
    60010483,
    10000044,
    "Stoure IX - Moon 1 - Poteque Pharmaceuticals Biotech Research Center"
  ],
  [
    60009529,
    10000044,
    "Stoure VI - Moon 4 - Material Acquisition Mining Outpost"
  ],
  [
    60009442,
    10000044,
    "Straloin IX - Moon 10 - Material Acquisition Mineral Reserve"
  ],
  [
    60009451,
    10000044,
    "Straloin IX - Moon 15 - Material Acquisition Mining Outpost"
  ],
  [
    60009445,
    10000044,
    "Straloin IX - Moon 17 - Material Acquisition Mining Outpost"
  ],
  [
    60011806,
    10000044,
    "Straloin VI - Moon 11 - Federation Navy Assembly Plant"
  ],
  [
    60011821,
    10000044,
    "Straloin VI - Moon 17 - Federation Navy Logistic Support"
  ],
  [
    60015072,
    10000033,
    "Sujarento IV - State Protectorate Logistic Support"
  ],
  [
    60005197,
    10000033,
    "Sujarento VIII - Moon 1 - Republic Security Services Assembly Plant"
  ],
  [
    60007150,
    10000043,
    "Sukirah IX - Moon 2 - Imperial Shipment Storage"
  ],
  [
    60001024,
    10000043,
    "Sukirah IX - Moon 7 - Kaalakiota Corporation Research Center"
  ],
  [
    60007894,
    10000043,
    "Sukirah V - Moon 3 - Ministry of War Archives"
  ],
  [
    60008251,
    10000043,
    "Sukirah VII - Moon 7 - Amarr Trade Registry Archives"
  ],
  [
    60007159,
    10000043,
    "Sukirah VII - Moon 7 - Imperial Shipment Storage"
  ],
  [
    60007147,
    10000043,
    "Sukirah VII - Moon 9 - Imperial Shipment Storage"
  ],
  [
    60008248,
    10000043,
    "Sukirah VIII - Moon 5 - Amarr Trade Registry Archives"
  ],
  [
    60006745,
    10000052,
    "Suner VI - Moon 13 - Noble Appliances Factory"
  ],
  [
    60006751,
    10000052,
    "Suner VI - Moon 7 - Noble Appliances Warehouse"
  ],
  [
    60000253,
    10000052,
    "Suner VII - Moon 16 - CBD Corporation Storage"
  ],
  [
    60006748,
    10000052,
    "Suner VII - Moon 7 - Noble Appliances Factory"
  ],
  [
    60003790,
    10000033,
    "Suroken IX - Moon 18 - Caldari Navy Assembly Plant"
  ],
  [
    60005557,
    10000033,
    "Suroken IX - Moon 2 - Core Complexion Inc. Factory"
  ],
  [
    60002827,
    10000033,
    "Suroken V - Moon 2 - Sukuuvestaa Corporation Production Plant"
  ],
  [
    60004120,
    10000033,
    "Suroken VI - Spacelane Patrol Assembly Plant"
  ],
  [
    60004300,
    10000033,
    "Suroken VII - Moon 1 - Corporate Police Force Assembly Plant"
  ],
  [
    60000430,
    10000033,
    "Suroken VII - Moon 2 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60004126,
    10000033,
    "Suroken VIII - Moon 12 - Spacelane Patrol Assembly Plant"
  ],
  [
    60003793,
    10000033,
    "Suroken VIII - Moon 13 - Caldari Navy Assembly Plant"
  ],
  [
    60005560,
    10000033,
    "Suroken VIII - Moon 15 - Core Complexion Inc. Factory"
  ],
  [
    60002410,
    10000033,
    "Suroken VIII - Moon 7 - Propel Dynamics Factory"
  ],
  [
    60005569,
    10000033,
    "Suroken X - Moon 1 - Core Complexion Inc. Storage"
  ],
  [
    60000679,
    10000033,
    "Suroken X - Moon 1 - Poksu Mineral Group Refinery"
  ],
  [
    60000862,
    10000033,
    "Suroken XI - Caldari Provisions Plantation"
  ],
  [
    60015049,
    10000064,
    "Synchelle I - Federal Navy Academy"
  ],
  [
    60014311,
    10000022,
    "T-8UOF VII - Moon 2 - True Power Logistic Support"
  ],
  [
    60013567,
    10000019,
    "T-C5A0 X - Moon 9 - Jove Navy Logistic Support"
  ],
  [
    60013690,
    10000019,
    "T-C5A0 XII - Moon 17 - Jovian Directorate Bureau"
  ],
  [
    60003316,
    10000041,
    "T-LIWS IV - Moon 6 - Modern Finances Depository"
  ],
  [
    60014197,
    10000022,
    "T-NNJZ V - Moon 2 - True Creations Storage Bay"
  ],
  [
    60013693,
    10000019,
    "T-YWDD V - Moon 5 - Jovian Directorate Bureau"
  ],
  [
    60013696,
    10000019,
    "T-YWDD VI - Moon 21 - Jovian Directorate Bureau"
  ],
  [
    60013687,
    10000019,
    "T-YWDD VII - Moon 1 - Jovian Directorate Bureau"
  ],
  [
    60013564,
    10000019,
    "T-YWDD VII - Moon 13 - Jove Navy Assembly Plant"
  ],
  [
    60013681,
    10000019,
    "T-YWDD VII - Moon 18 - Jovian Directorate Bureau"
  ],
  [
    60014446,
    10000041,
    "T22-QI IV - Moon 8 - Trust Partners Warehouse"
  ],
  [
    60013525,
    10000041,
    "T22-QI V - Moon 14 - Intaki Syndicate Academy"
  ],
  [
    60013519,
    10000041,
    "T22-QI VI - Moon 12 - Intaki Syndicate Academy"
  ],
  [
    60014449,
    10000041,
    "T22-QI VI - Moon 13 - Trust Partners Warehouse"
  ],
  [
    60013522,
    10000041,
    "T22-QI VI - Moon 6 - Intaki Syndicate Academy"
  ],
  [
    60013417,
    10000041,
    "T22-QI VI - Moon 9 - Intaki Space Police Testing Facilities"
  ],
  [
    60007627,
    10000042,
    "Tabbetzur VII - Moon 1 - Nurtura Plantation"
  ],
  [
    60001972,
    10000065,
    "Tadadan V - Moon 1 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001978,
    10000065,
    "Tadadan VI - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60004771,
    10000042,
    "Taff V - Moon 13 - Republic Fleet Assembly Plant"
  ],
  [
    60004777,
    10000042,
    "Taff V - Moon 16 - Republic Fleet Assembly Plant"
  ],
  [
    60005278,
    10000042,
    "Taff V - Moon 4 - Minmatar Mining Corporation Refinery"
  ],
  [
    60007915,
    10000067,
    "Tahli I - Moon 1 - Ministry of War Bureau Offices"
  ],
  [
    60001336,
    10000067,
    "Tahli III - Moon 5 - Wiyrkomi Corporation Factory"
  ],
  [
    60000826,
    10000016,
    "Taisy III - Minedrill Refinery"
  ],
  [
    60005203,
    10000033,
    "Tama VII - Moon 9 - Republic Security Services Testing Facilities"
  ],
  [
    60005323,
    10000042,
    "Tamekamur V - Moon 17 - Minmatar Mining Corporation Refinery"
  ],
  [
    60006064,
    10000042,
    "Tamekamur V - Moon 17 - The Leisure Group Development Studio"
  ],
  [
    60013210,
    10000016,
    "Tamo I - Genolution Biotech Production"
  ],
  [
    60009889,
    10000016,
    "Tamo IX - Quafe Company Factory"
  ],
  [
    60003958,
    10000016,
    "Tamo V - Moon 11 - Lai Dai Protection Service Assembly Plant"
  ],
  [
    60013204,
    10000016,
    "Tamo V - Moon 2 - Genolution Biotech Production"
  ],
  [
    60003973,
    10000016,
    "Tamo V - Moon 2 - Ishukone Watch Logistic Support"
  ],
  [
    60002341,
    10000016,
    "Tamo V - Moon 5 - Lai Dai Corporation Factory"
  ],
  [
    60002347,
    10000016,
    "Tamo V - Moon 9 - Lai Dai Corporation Factory"
  ],
  [
    60009886,
    10000016,
    "Tamo VI - Moon 10 - Quafe Company Factory"
  ],
  [
    60002401,
    10000016,
    "Tamo VI - Moon 12 - Propel Dynamics Warehouse"
  ],
  [
    60001672,
    10000016,
    "Tamo VI - Moon 15 - Caldari Steel Factory"
  ],
  [
    60009901,
    10000016,
    "Tamo VI - Moon 15 - Quafe Company Warehouse"
  ],
  [
    60002398,
    10000016,
    "Tamo VI - Moon 18 - Propel Dynamics Factory"
  ],
  [
    60002344,
    10000016,
    "Tamo VIII - Moon 2 - Lai Dai Corporation Factory"
  ],
  [
    60015063,
    10000038,
    "Tannakan VII - 24th Imperial Crusade Logistic Support"
  ],
  [
    60005200,
    10000033,
    "Tannolen VI - Moon 14 - Republic Security Services Testing Facilities"
  ],
  [
    60000853,
    10000033,
    "Tannolen VI - Moon 7 - Minedrill Mining Outpost"
  ],
  [
    60000694,
    10000033,
    "Tannolen VIII - Moon 14 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60014437,
    10000001,
    "Tanoo IV - Trust Partners Trading Post"
  ],
  [
    60012526,
    10000001,
    "Tanoo V - Moon 1 - Ammatar Consulate Bureau"
  ],
  [
    60012739,
    10000067,
    "Tar III - Secure Commerce Commission Depository"
  ],
  [
    60015056,
    10000036,
    "Tararan IV - 24th Imperial Crusade Logistic Support"
  ],
  [
    60010672,
    10000036,
    "Tararan VI - Moon 4 - The Scope Publisher"
  ],
  [
    60012919,
    10000067,
    "Tarta IX - Moon 14 - DED Assembly Plant"
  ],
  [
    60013201,
    10000016,
    "Tartoken III - Moon 3 - Genolution Biotech Production"
  ],
  [
    60002944,
    10000016,
    "Tartoken V - Moon 8 - Caldari Constructions Production Plant"
  ],
  [
    60002947,
    10000016,
    "Tartoken VI - Caldari Constructions Production Plant"
  ],
  [
    60002938,
    10000016,
    "Tartoken VII - Moon 17 - Caldari Constructions Production Plant"
  ],
  [
    60003235,
    10000016,
    "Tartoken VII - Moon 7 - State and Region Bank Depository"
  ],
  [
    60010504,
    10000020,
    "Taru IV - Moon 1 - Impetus Development Studio"
  ],
  [
    60001903,
    10000020,
    "Taru IX - Moon 17 - Nugoeihuvi Corporation Publisher"
  ],
  [
    60001906,
    10000020,
    "Taru VI - Moon 1 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001900,
    10000020,
    "Taru X - Moon 7 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60007996,
    10000020,
    "Taru X - Moon 9 - Ministry of War Information Center"
  ],
  [
    60004090,
    10000033,
    "Tasabeshi I - Spacelane Patrol Assembly Plant"
  ],
  [
    60002704,
    10000033,
    "Tasabeshi II - CBD Sell Division Warehouse"
  ],
  [
    60002698,
    10000033,
    "Tasabeshi IV - Moon 10 - CBD Sell Division Retail Center"
  ],
  [
    60004096,
    10000033,
    "Tasabeshi IV - Moon 13 - Spacelane Patrol Logistic Support"
  ],
  [
    60003343,
    10000033,
    "Tasabeshi IV - Moon 2 - Chief Executive Panel Academy"
  ],
  [
    60000019,
    10000033,
    "Tasabeshi VI - Moon 1 - CBD Corporation Storage"
  ],
  [
    60000016,
    10000033,
    "Tasabeshi VIII - Moon 13 - CBD Corporation Storage"
  ],
  [
    60001096,
    10000020,
    "Tash-Murkon Prime II - Moon 1 - Kaalakiota Corporation Factory"
  ],
  [
    60012985,
    10000020,
    "Tash-Murkon Prime III - Moon 1 - DED Assembly Plant"
  ],
  [
    60002485,
    10000020,
    "Tash-Murkon Prime III - Moon 1 - Expert Distribution Retail Center"
  ],
  [
    60008764,
    10000020,
    "Tash-Murkon Prime V - Moon 1 - Tash-Murkon Family Bureau"
  ],
  [
    60002497,
    10000020,
    "Tash-Murkon Prime V - Moon 5 - Expert Distribution Warehouse"
  ],
  [
    60008758,
    10000020,
    "Tash-Murkon Prime V - Moon 5 - Tash-Murkon Family Bureau"
  ],
  [
    60006154,
    10000020,
    "Tash-Murkon Prime V - Moon 7 - Amarr Constructions Warehouse"
  ],
  [
    60002491,
    10000020,
    "Tash-Murkon Prime V - Moon 7 - Expert Distribution Retail Center"
  ],
  [
    60001621,
    10000002,
    "Tasti IX - Moon 10 - Perkone Factory"
  ],
  [
    60003175,
    10000002,
    "Tasti IX - Moon 12 - Caldari Funds Unlimited Depository"
  ],
  [
    60004468,
    10000002,
    "Tasti V - Moon 1 - Science and Trade Institute School"
  ],
  [
    60001627,
    10000002,
    "Tasti VI - Moon 16 - Perkone Factory"
  ],
  [
    60001630,
    10000002,
    "Tasti VI - Moon 2 - Perkone Factory"
  ],
  [
    60012259,
    10000067,
    "Tekaima I - Moon 1 - CONCORD Bureau"
  ],
  [
    60012268,
    10000067,
    "Tekaima V - Moon 9 - CONCORD Assembly Plant"
  ],
  [
    60001069,
    10000020,
    "Tendhyes VIII - Kaalakiota Corporation Factory"
  ],
  [
    60013192,
    10000033,
    "Tennen VIII - Moon 11 - Genolution Biotech Production"
  ],
  [
    60000550,
    10000033,
    "Tennen VIII - Moon 13 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60012523,
    10000033,
    "Tennen VIII - Moon 4 - CONCORD Assembly Plant"
  ],
  [
    60000547,
    10000033,
    "Tennen VIII - Moon 4 - Hyasyoda Corporation Refinery"
  ],
  [
    60004813,
    10000028,
    "Teonusude III - Moon 1 - Republic Fleet Assembly Plant"
  ],
  [
    60014383,
    10000028,
    "Teonusude III - Moon 6 - Trust Partners Trading Post"
  ],
  [
    60006499,
    10000028,
    "Teonusude III - Moon 8 - Imperial Armaments Factory"
  ],
  [
    60006070,
    10000028,
    "Teonusude IV - Moon 8 - The Leisure Group Development Studio"
  ],
  [
    60006505,
    10000028,
    "Teonusude VI - Imperial Armaments Factory"
  ],
  [
    60004552,
    10000028,
    "Teonusude VII - Moon 1 - Vherokior Tribe Treasury"
  ],
  [
    60009271,
    10000043,
    "Teshi I - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60009883,
    10000043,
    "Teshi I - Quafe Company Retail Center"
  ],
  [
    60009283,
    10000043,
    "Teshi II - Moon 6 - TransStellar Shipping Storage"
  ],
  [
    60005536,
    10000043,
    "Teshi V - Moon 6 - Core Complexion Inc. Storage"
  ],
  [
    60010846,
    10000020,
    "Teshkat V - Chemal Tech Factory"
  ],
  [
    60010843,
    10000020,
    "Teshkat VI - Chemal Tech Factory"
  ],
  [
    60013345,
    10000020,
    "Teshkat VI - Impro Factory"
  ],
  [
    60015124,
    10000069,
    "Teskanen IV - Caldari Navy Assembly Plant"
  ],
  [
    60008044,
    10000020,
    "Tew IX - Moon 13 - Ministry of Assessment Bureau Offices"
  ],
  [
    60002449,
    10000020,
    "Tew IX - Moon 14 - Expert Distribution Retail Center"
  ],
  [
    60000229,
    10000020,
    "Tew IX - Moon 9 - CBD Corporation Storage"
  ],
  [
    60006592,
    10000020,
    "Tew IX - Moon 9 - Viziam Factory"
  ],
  [
    60006691,
    10000020,
    "Tew V - Moon 1 - Zoar and Sons Factory"
  ],
  [
    60014653,
    10000020,
    "Tew VII - Imperial Academy"
  ],
  [
    60014227,
    10000022,
    "TG-Z23 II - Moon 4 - True Creations Logistic Support"
  ],
  [
    60014350,
    10000022,
    "TG-Z23 II - Moon 7 - True Power Refinery"
  ],
  [
    60014353,
    10000022,
    "TG-Z23 III - Moon 8 - True Power Logistic Support"
  ],
  [
    60014224,
    10000022,
    "TG-Z23 V - Moon 7 - True Creations Storage Bay"
  ],
  [
    60002512,
    10000036,
    "Thakala I - Expert Distribution Warehouse"
  ],
  [
    60014518,
    10000036,
    "Thakala III - Moon 2 - X-Sense Reprocessing Facility"
  ],
  [
    60014524,
    10000036,
    "Thakala III - Moon 21 - X-Sense Reprocessing Facility"
  ],
  [
    60002515,
    10000036,
    "Thakala IV - Moon 11 - Expert Distribution Warehouse"
  ],
  [
    60002506,
    10000036,
    "Thakala IV - Moon 17 - Expert Distribution Warehouse"
  ],
  [
    60006724,
    10000020,
    "Thashkarai VI - Zoar and Sons Factory"
  ],
  [
    60008518,
    10000020,
    "Thashkarai VII - Moon 1 - Emperor Family Bureau"
  ],
  [
    60006529,
    10000036,
    "Thasinaz VII - Moon 12 - Imperial Armaments Warehouse"
  ],
  [
    60007762,
    10000043,
    "Thebeka VI - Moon 19 - Imperial Chancellor Information Center"
  ],
  [
    60007765,
    10000043,
    "Thebeka VI - Moon 20 - Imperial Chancellor Bureau Offices"
  ],
  [
    60012112,
    10000032,
    "Thelan VI - Moon 8 - Federation Customs Testing Facilities"
  ],
  [
    60015148,
    11000031,
    "Thera XII - The Sanctuary Institute of Paleocybernetics"
  ],
  [
    60015149,
    11000031,
    "Thera XII - The Sanctuary Surveillance Observatory"
  ],
  [
    60015150,
    11000031,
    "Thera XIII - The Sanctuary Applied Gravitation Laboratory"
  ],
  [
    60015151,
    11000031,
    "Thera XIV - The Sanctuary Fullerene Loom"
  ],
  [
    60012151,
    10000001,
    "Thiarer VII - Moon 4 - Ammatar Fleet Assembly Plant"
  ],
  [
    60012553,
    10000001,
    "Tidacha VIII - Moon 13 - Ammatar Consulate Bureau"
  ],
  [
    60007657,
    10000068,
    "Tierijev V - Moon 8 - Nurtura Warehouse"
  ],
  [
    60002776,
    10000033,
    "Tintoh V - Moon 5 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60000664,
    10000033,
    "Tintoh VI - Moon 1 - Poksu Mineral Group Mining Outpost"
  ],
  [
    60002782,
    10000033,
    "Tintoh VI - Moon 2 - Sukuuvestaa Corporation Factory"
  ],
  [
    60004159,
    10000033,
    "Tintoh VII - Moon 10 - Spacelane Patrol Logistic Support"
  ],
  [
    60015146,
    10000033,
    "Tintoh VIII - Caldari Navy Testing Facilities"
  ],
  [
    60013153,
    10000054,
    "Tisot V - Moon 1 - Genolution Biotech Production"
  ],
  [
    60012697,
    10000054,
    "Tisot VI - Sisters of EVE Bureau"
  ],
  [
    60001081,
    10000020,
    "Tividu III - Kaalakiota Corporation Factory"
  ],
  [
    60013033,
    10000020,
    "Tividu IV - Moon 10 - DED Assembly Plant"
  ],
  [
    60013036,
    10000020,
    "Tividu IV - Moon 3 - DED Assembly Plant"
  ],
  [
    60001078,
    10000020,
    "Tividu IV - Moon 3 - Kaalakiota Corporation Factory"
  ],
  [
    60003307,
    10000020,
    "Tividu IV - Moon 9 - Modern Finances Depository"
  ],
  [
    60010492,
    10000020,
    "Tividu V - Moon 7 - Impetus Development Studio"
  ],
  [
    60013888,
    10000017,
    "TO21-U VII - Prosper Depository"
  ],
  [
    60013594,
    10000017,
    "TO21-U VIII - Moon 1 - Jove Navy Assembly Plant"
  ],
  [
    60004420,
    10000016,
    "Todaki VI - Moon 1 - School of Applied Knowledge"
  ],
  [
    60015043,
    10000030,
    "Todeko VII - Republic University"
  ],
  [
    60014836,
    10000042,
    "Todifrauan VII - Moon 19 - Pator Tech School"
  ],
  [
    60012976,
    10000042,
    "Todifrauan VII - Moon 8 - DED Assembly Plant"
  ],
  [
    60003529,
    10000037,
    "Tolle IV - Caldari Business Tribunal"
  ],
  [
    60011650,
    10000037,
    "Tolle VI - Moon 19 - Federal Administration Information Center"
  ],
  [
    60013285,
    10000037,
    "Tolle VI - Moon 6 - Impro Factory"
  ],
  [
    60001933,
    10000042,
    "Tollus VIII - Moon 3 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001942,
    10000042,
    "Tollus VIII - Nugoeihuvi Corporation Publisher"
  ],
  [
    60005020,
    10000042,
    "Tollus X - Moon 4 - Republic Justice Department Tribunal"
  ],
  [
    60001936,
    10000042,
    "Tollus X - Moon 5 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60005026,
    10000042,
    "Tollus XI - Moon 1 - Republic Justice Department Law School"
  ],
  [
    60001102,
    10000030,
    "Tongofur VII - Kaalakiota Corporation Factory"
  ],
  [
    60001105,
    10000030,
    "Tongofur VIII - Kaalakiota Corporation Warehouse"
  ],
  [
    60013120,
    10000067,
    "Toon VIII - Moon 2 - Genolution Biotech Research Center"
  ],
  [
    60000946,
    10000016,
    "Torrinos V - Moon 10 - Caldari Provisions Food Packaging"
  ],
  [
    60004201,
    10000016,
    "Torrinos V - Moon 15 - Spacelane Patrol Logistic Support"
  ],
  [
    60004045,
    10000016,
    "Torrinos V - Moon 16 - Home Guard Logistic Support"
  ],
  [
    60002326,
    10000016,
    "Torrinos V - Moon 5 - Lai Dai Corporation Factory"
  ],
  [
    60004036,
    10000016,
    "Torrinos V - Moon 6 - Home Guard Assembly Plant"
  ],
  [
    60004042,
    10000016,
    "Torrinos VI - Moon 16 - Home Guard Logistic Support"
  ],
  [
    60012055,
    10000037,
    "Torvi VII - Moon 1 - Federation Customs Logistic Support"
  ],
  [
    60008959,
    10000043,
    "Toshabia I - Theology Council Tribunal"
  ],
  [
    60010717,
    10000043,
    "Toshabia VI - Moon 1 - The Scope Development Studio"
  ],
  [
    60008503,
    10000043,
    "Toshabia VI - Moon 6 - Emperor Family Bureau"
  ],
  [
    60005866,
    10000043,
    "Toshabia VII - Freedom Extension Storage"
  ],
  [
    60008953,
    10000043,
    "Toshabia VII - Moon 5 - Theology Council Tribunal"
  ],
  [
    60014083,
    10000042,
    "Totkubad III - Thukker Mix Factory"
  ],
  [
    60010399,
    10000068,
    "Tourier I - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60005209,
    10000068,
    "Tourier III - Republic Security Services Assembly Plant"
  ],
  [
    60005218,
    10000068,
    "Tourier VI - Moon 13 - Republic Security Services Assembly Plant"
  ],
  [
    60012664,
    10000044,
    "Toustain V - Moon 7 - Sisters of EVE Bureau"
  ],
  [
    60011815,
    10000044,
    "Toustain VI - Moon 16 - Federation Navy Assembly Plant"
  ],
  [
    60014906,
    10000063,
    "TPAR-G IX - Moon 3 - Serpentis Corporation Refining"
  ],
  [
    60012280,
    10000042,
    "Tratokard II - Moon 1 - CONCORD Bureau"
  ],
  [
    60004705,
    10000042,
    "Tratokard IV - Moon 2 - Republic Parliament Bureau"
  ],
  [
    60007294,
    10000042,
    "Traun X - Moon 14 - Joint Harvesting Mining Outpost"
  ],
  [
    60012622,
    10000042,
    "Traun X - Moon 6 - Sisters of EVE Bureau"
  ],
  [
    60009958,
    10000030,
    "Trer IV - Moon 1 - Quafe Company Warehouse"
  ],
  [
    60004678,
    10000030,
    "Trer IV - Moon 2 - Republic Parliament Bureau"
  ],
  [
    60001840,
    10000030,
    "Trer VII - Moon 9 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60009973,
    10000030,
    "Trer VII - Quafe Company Warehouse"
  ],
  [
    60001843,
    10000030,
    "Trer VIII - Moon 11 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60014764,
    10000030,
    "Trer VIII - Moon 16 - Republic Military School"
  ],
  [
    60009964,
    10000030,
    "Trer VIII - Moon 21 - Quafe Company Factory"
  ],
  [
    60001846,
    10000030,
    "Trer VIII - Moon 7 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60009961,
    10000030,
    "Trer X - Moon 2 - Quafe Company Factory"
  ],
  [
    60010894,
    10000032,
    "Trosquesere V - Moon 10 - Duvolle Laboratories Factory"
  ],
  [
    60015016,
    10000032,
    "Trossere VII - Moon 3 - University of Caille"
  ],
  [
    60007486,
    10000030,
    "Trytedald III - Moon 1 - Joint Harvesting Plantation"
  ],
  [
    60005050,
    10000030,
    "Trytedald V - Moon 12 - Urban Management Archives"
  ],
  [
    60007477,
    10000030,
    "Trytedald V - Moon 2 - Joint Harvesting Plantation"
  ],
  [
    60007489,
    10000030,
    "Trytedald VII - Moon 16 - Joint Harvesting Mining Outpost"
  ],
  [
    60009118,
    10000030,
    "Trytedald VII - Moon 19 - TransStellar Shipping Storage"
  ],
  [
    60007492,
    10000030,
    "Trytedald VII - Moon 22 - Joint Harvesting Mining Outpost"
  ],
  [
    60007480,
    10000030,
    "Trytedald VIII - Moon 20 - Joint Harvesting Plantation"
  ],
  [
    60007483,
    10000030,
    "Trytedald VIII - Moon 23 - Joint Harvesting Plantation"
  ],
  [
    60001657,
    10000016,
    "Tsuguwa III - Moon 10 - Caldari Steel Factory"
  ],
  [
    60002965,
    10000016,
    "Tsuguwa IV - Moon 13 - Caldari Constructions Warehouse"
  ],
  [
    60000379,
    10000016,
    "Tsuguwa IV - Moon 15 - Ytiri Storage"
  ],
  [
    60003358,
    10000016,
    "Tsuguwa IV - Moon 4 - Chief Executive Panel Bureau"
  ],
  [
    60003829,
    10000016,
    "Tsuguwa VI - Caldari Navy Assembly Plant"
  ],
  [
    60002020,
    10000016,
    "Tsukuras II - Echelon Entertainment Development Studio"
  ],
  [
    60003388,
    10000016,
    "Tsukuras IX - Moon 3 - Chief Executive Panel Bureau"
  ],
  [
    60001552,
    10000016,
    "Tsukuras VII - Moon 9 - Perkone Factory"
  ],
  [
    60013315,
    10000054,
    "Tukanas VIII - Moon 6 - Impro Factory"
  ],
  [
    60000370,
    10000016,
    "Tunttaras IX - Moon 11 - Ytiri Storage"
  ],
  [
    60003826,
    10000016,
    "Tunttaras X - Moon 3 - Caldari Navy Logistic Support"
  ],
  [
    60001618,
    10000033,
    "Tunudan IX - Perkone Warehouse"
  ],
  [
    60001471,
    10000033,
    "Tunudan VII - Moon 4 - Rapid Assembly Warehouse"
  ],
  [
    60006826,
    10000038,
    "Tuomuta III - Ducia Foundry Mining Outpost"
  ],
  [
    60008008,
    10000052,
    "Turba VI - Ministry of Assessment Archives"
  ],
  [
    60006817,
    10000052,
    "Turba X - Moon 4 - Ducia Foundry Refinery"
  ],
  [
    60004723,
    10000042,
    "Turnur I - Republic Parliament Bureau"
  ],
  [
    60005119,
    10000042,
    "Turnur II - Moon 5 - Republic Security Services Assembly Plant"
  ],
  [
    60005692,
    10000042,
    "Turnur III - Moon 17 - Boundless Creation Factory"
  ],
  [
    60006022,
    10000042,
    "Turnur III - Moon 18 - Freedom Extension Storage"
  ],
  [
    60005452,
    10000002,
    "Tuuriainas II - Core Complexion Inc. Factory"
  ],
  [
    60004240,
    10000002,
    "Tuuriainas II - Spacelane Patrol Assembly Plant"
  ],
  [
    60003229,
    10000002,
    "Tuuriainas II - State and Region Bank Depository"
  ],
  [
    60005458,
    10000002,
    "Tuuriainas III - Core Complexion Inc. Factory"
  ],
  [
    60003082,
    10000002,
    "Tuuriainas III - Expert Housing Production Plant"
  ],
  [
    60005455,
    10000002,
    "Tuuriainas IV - Core Complexion Inc. Factory"
  ],
  [
    60003247,
    10000002,
    "Tuuriainas IV - Modern Finances Depository"
  ],
  [
    60003226,
    10000002,
    "Tuuriainas IV - State and Region Bank Depository"
  ],
  [
    60013369,
    10000041,
    "TXW-EI I - Intaki Bank Depository"
  ],
  [
    60013372,
    10000041,
    "TXW-EI IX - Moon 2 - Intaki Bank Depository"
  ],
  [
    60014413,
    10000041,
    "TXW-EI VI - Trust Partners Trading Post"
  ],
  [
    60011278,
    10000041,
    "TXW-EI VIII - Moon 8 - Aliastra Retail Center"
  ],
  [
    60015058,
    10000036,
    "Tzvi VI - 24th Imperial Crusade Logistic Support"
  ],
  [
    60002521,
    10000041,
    "U4-Q2V IV - Expert Distribution Warehouse"
  ],
  [
    60005905,
    10000042,
    "Ualkin VI - Freedom Extension Storage"
  ],
  [
    60004975,
    10000042,
    "Ualkin VI - Moon 4 - Republic Justice Department Accounting"
  ],
  [
    60005275,
    10000042,
    "Ualkin VII - Moon 3 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60006739,
    10000052,
    "Uanim VI - Moon 12 - Noble Appliances Factory"
  ],
  [
    60014455,
    10000001,
    "Uanzin V - Moon 1 - Trust Partners Warehouse"
  ],
  [
    60014901,
    10000056,
    "UB5Z-3 II - Moon 1 - Serpentis Corporation Refining"
  ],
  [
    60005167,
    10000043,
    "Uchat X - Moon 18 - Republic Security Services Assembly Plant"
  ],
  [
    60012313,
    10000002,
    "Uchoshi I - CONCORD Bureau"
  ],
  [
    60004381,
    10000002,
    "Uchoshi I - Corporate Police Force Assembly Plant"
  ],
  [
    60012322,
    10000002,
    "Uchoshi IX - Moon 2 - CONCORD Assembly Plant"
  ],
  [
    60004372,
    10000002,
    "Uchoshi IX - Moon 4 - Corporate Police Force Logistic Support"
  ],
  [
    60007507,
    10000002,
    "Uchoshi X - Moon 1 - Joint Harvesting Mineral Reserve"
  ],
  [
    60004465,
    10000002,
    "Uchoshi X - Moon 11 - Science and Trade Institute School"
  ],
  [
    60000496,
    10000002,
    "Uchoshi XI - Moon 12 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60004426,
    10000002,
    "Uchoshi XI - Moon 14 - School of Applied Knowledge"
  ],
  [
    60000973,
    10000002,
    "Uchoshi XI - Moon 4 - Caldari Provisions Food Packaging"
  ],
  [
    60010012,
    10000054,
    "Udianoor I - Quafe Company Factory"
  ],
  [
    60010018,
    10000054,
    "Udianoor IX - Moon 17 - Quafe Company Factory"
  ],
  [
    60010015,
    10000054,
    "Udianoor V - Moon 3 - Quafe Company Warehouse"
  ],
  [
    60010027,
    10000054,
    "Udianoor VII - Moon 4 - Quafe Company Warehouse"
  ],
  [
    60001696,
    10000033,
    "Uedama III - Moon 1 - Caldari Steel Warehouse"
  ],
  [
    60004189,
    10000033,
    "Uedama VI - Moon 8 - Spacelane Patrol Logistic Support"
  ],
  [
    60002332,
    10000033,
    "Uedama VII - Lai Dai Corporation Factory"
  ],
  [
    60004291,
    10000016,
    "Uemisaisen V - Moon 5 - Wiyrkomi Peace Corps Assembly Plant"
  ],
  [
    60013105,
    10000016,
    "Uemisaisen VII - Moon 12 - Genolution Biotech Production"
  ],
  [
    60004027,
    10000016,
    "Uemisaisen VII - Moon 16 - Home Guard Assembly Plant"
  ],
  [
    60004294,
    10000016,
    "Uemisaisen VII - Wiyrkomi Peace Corps Assembly Plant"
  ],
  [
    60000352,
    10000016,
    "Uemisaisen VIII - Moon 10 - Ytiri Storage"
  ],
  [
    60001795,
    10000002,
    "Uemon VIII - Moon 10 - Zainou Biotech Production"
  ],
  [
    60001624,
    10000002,
    "Uemon VIII - Moon 3 - Perkone Factory"
  ],
  [
    60002056,
    10000016,
    "Uesuro II - Echelon Entertainment Development Studio"
  ],
  [
    60000802,
    10000016,
    "Uesuro II - Moon 1 - Minedrill Refinery"
  ],
  [
    60014674,
    10000016,
    "Uesuro IV - State War Academy"
  ],
  [
    60003952,
    10000016,
    "Uesuro V - Moon 15 - Lai Dai Protection Service Assembly Plant"
  ],
  [
    60004429,
    10000016,
    "Uesuro VI - Moon 1 - School of Applied Knowledge"
  ],
  [
    60014356,
    10000022,
    "UF-KKH III - Moon 2 - True Power Mineral Reserve"
  ],
  [
    60014176,
    10000022,
    "UF-KKH III - Moon 4 - True Creations Shipyard"
  ],
  [
    60014940,
    10000060,
    "UHKL-N V - Moon 1 - Blood Raiders Testing Facilities"
  ],
  [
    60006607,
    10000020,
    "Uhodoh IX - Viziam Factory"
  ],
  [
    60007216,
    10000020,
    "Uhodoh VI - Moon 1 - Amarr Certified News Development Studio"
  ],
  [
    60005698,
    10000042,
    "Uisper I - Moon 1 - Boundless Creation Factory"
  ],
  [
    60005122,
    10000042,
    "Uisper IX - Moon 5 - Republic Security Services Assembly Plant"
  ],
  [
    60009100,
    10000042,
    "Uisper V - Moon 2 - TransStellar Shipping Storage"
  ],
  [
    60005410,
    10000042,
    "Uisper VI - Moon 5 - Minmatar Mining Corporation Refinery"
  ],
  [
    60015027,
    10000002,
    "Uitra VI - Moon 4 - State War Academy"
  ],
  [
    60000910,
    10000002,
    "Ukkalen IV - Moon 1 - Caldari Provisions Plantation"
  ],
  [
    60002842,
    10000002,
    "Ukkalen IX - Moon 15 - Sukuuvestaa Corporation Foundry"
  ],
  [
    60002848,
    10000002,
    "Ukkalen IX - Moon 16 - Sukuuvestaa Corporation Foundry"
  ],
  [
    60000904,
    10000002,
    "Ukkalen VII - Moon 1 - Caldari Provisions Plantation"
  ],
  [
    60006811,
    10000036,
    "Uktiad VII - Moon 21 - Ducia Foundry Mineral Reserve"
  ],
  [
    60007867,
    10000036,
    "Ulerah I - Moon 10 - Amarr Civil Service Bureau Offices"
  ],
  [
    60009184,
    10000036,
    "Ulerah I - Moon 2 - TransStellar Shipping Storage"
  ],
  [
    60007201,
    10000036,
    "Ulerah II - Moon 12 - Amarr Certified News Development Studio"
  ],
  [
    60009190,
    10000036,
    "Ulerah II - Moon 7 - TransStellar Shipping Storage"
  ],
  [
    60003319,
    10000041,
    "UM-Q7F X - Modern Finances Depository"
  ],
  [
    60010039,
    10000041,
    "UM-Q7F X - Quafe Company Factory"
  ],
  [
    60000520,
    10000002,
    "Uminas IV - Moon 1 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60000868,
    10000002,
    "Uminas V - Moon 3 - Caldari Provisions Plantation"
  ],
  [
    60000532,
    10000002,
    "Uminas VI - Moon 6 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60000871,
    10000002,
    "Uminas VI - Moon 7 - Caldari Provisions Plantation"
  ],
  [
    60000469,
    10000016,
    "Umokka VI - Moon 2 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60002794,
    10000016,
    "Umokka VI - Moon 2 - Sukuuvestaa Corporation Foundry"
  ],
  [
    60004396,
    10000016,
    "Umokka VII - Corporate Police Force Testing Facilities"
  ],
  [
    60003883,
    10000016,
    "Umokka VII - Moon 5 - Caldari Navy Testing Facilities"
  ],
  [
    60000478,
    10000016,
    "Umokka VII - Moon 9 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60003196,
    10000016,
    "Umokka VII - State and Region Bank Vault"
  ],
  [
    60000817,
    10000016,
    "Umokka X - Moon 12 - Minedrill Mining Outpost"
  ],
  [
    60002791,
    10000016,
    "Umokka X - Moon 15 - Sukuuvestaa Corporation Foundry"
  ],
  [
    60000466,
    10000016,
    "Umokka X - Moon 21 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60003886,
    10000016,
    "Umokka X - Moon 4 - Caldari Navy Testing Facilities"
  ],
  [
    60001426,
    10000016,
    "Umokka X - Moon 6 - Top Down Factory"
  ],
  [
    60010729,
    10000032,
    "Unel IX - Chemal Tech Factory"
  ],
  [
    60004648,
    10000028,
    "Unertek IX - Moon 16 - Republic Parliament Bureau"
  ],
  [
    60013318,
    10000028,
    "Unertek IX - Moon 2 - Impro Factory"
  ],
  [
    60007327,
    10000020,
    "Unkah IX - Joint Harvesting Mineral Reserve"
  ],
  [
    60008524,
    10000020,
    "Unkah VI - Moon 7 - Emperor Family Bureau"
  ],
  [
    60007324,
    10000020,
    "Unkah VII - Moon 2 - Joint Harvesting Food Packaging"
  ],
  [
    60004228,
    10000002,
    "Unpas IX - Moon 5 - Spacelane Patrol Logistic Support"
  ],
  [
    60005464,
    10000002,
    "Unpas VI - Moon 10 - Core Complexion Inc. Storage"
  ],
  [
    60004237,
    10000002,
    "Unpas VI - Moon 3 - Spacelane Patrol Assembly Plant"
  ],
  [
    60003397,
    10000002,
    "Unpas VI - Moon 4 - Mercantile Club Bureau"
  ],
  [
    60000298,
    10000002,
    "Unpas VIII - Moon 11 - Prompt Delivery Storage"
  ],
  [
    60002011,
    10000016,
    "Uosusuokko III - Moon 1 - Echelon Entertainment Publisher"
  ],
  [
    60014671,
    10000016,
    "Uosusuokko VII - Moon 1 - State War Academy"
  ],
  [
    60011500,
    10000016,
    "Uosusuokko VII - Moon 11 - Pend Insurance Depository"
  ],
  [
    60007672,
    10000016,
    "Uosusuokko VII - Moon 8 - Nurtura Food Packaging"
  ],
  [
    60003379,
    10000033,
    "Uotila V - Moon 14 - Chief Executive Panel Bureau"
  ],
  [
    60003451,
    10000033,
    "Uotila V - Moon 5 - Mercantile Club Bureau"
  ],
  [
    60001633,
    10000002,
    "Uoyonen IX - Perkone Warehouse"
  ],
  [
    60015091,
    10000048,
    "Uphallant II - Federal Defense Union Logistic Support"
  ],
  [
    60011884,
    10000048,
    "Uphallant III - Federation Navy Testing Facilities"
  ],
  [
    60009502,
    10000048,
    "Uphallant III - Moon 4 - Material Acquisition Mining Outpost"
  ],
  [
    60001849,
    10000048,
    "Uphallant III - Moon 4 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001855,
    10000048,
    "Uphallant IV - Moon 1 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60011887,
    10000048,
    "Uphallant V - Moon 14 - Federation Navy Assembly Plant"
  ],
  [
    60006877,
    10000048,
    "Uphallant V - Moon 18 - Ducia Foundry Mineral Reserve"
  ],
  [
    60011881,
    10000048,
    "Uphallant VII - Federation Navy Testing Facilities"
  ],
  [
    60005920,
    10000048,
    "Uphallant VII - Moon 2 - Freedom Extension Storage"
  ],
  [
    60009511,
    10000048,
    "Uphallant VII - Moon 2 - Material Acquisition Refinery"
  ],
  [
    60010885,
    10000048,
    "Uphallant VIII - Moon 2 - Duvolle Laboratories Factory"
  ],
  [
    60011698,
    10000048,
    "Uphallant VIII - Moon 2 - Federal Administration Archives"
  ],
  [
    60009310,
    10000037,
    "Uphene IX - Moon 13 - Federal Freight Storage"
  ],
  [
    60010576,
    10000037,
    "Uphene VI - Moon 16 - Egonics Inc. Development Studio"
  ],
  [
    60013870,
    10000001,
    "Uplingur II - Moon 1 - Nefantar Miner Association Mining Outpost"
  ],
  [
    60007582,
    10000001,
    "Uplingur III - Moon 8 - Nurtura Plantation"
  ],
  [
    60007579,
    10000001,
    "Uplingur IV (Ndoria) - Moon 16 - Nurtura Plantation"
  ],
  [
    60015028,
    10000033,
    "Urhinichi IX - State War Academy"
  ],
  [
    60003337,
    10000002,
    "Urlen VI - Chief Executive Panel Bureau"
  ],
  [
    60000448,
    10000002,
    "Urlen VII - Moon 6 - Hyasyoda Corporation Refinery"
  ],
  [
    60000367,
    10000002,
    "Urlen VII - Moon 8 - Ytiri Storage"
  ],
  [
    60003502,
    10000042,
    "Urnhard I - Caldari Business Tribunal Bureau Offices"
  ],
  [
    60015067,
    10000033,
    "Usi III - State Protectorate Logistic Support"
  ],
  [
    60001606,
    10000033,
    "Usi IV - Moon 11 - Perkone Factory"
  ],
  [
    60002032,
    10000033,
    "Usi IV - Moon 13 - Echelon Entertainment Development Studio"
  ],
  [
    60001597,
    10000033,
    "Usi IV - Moon 9 - Perkone Factory"
  ],
  [
    60004312,
    10000033,
    "Usi V - Moon 1 - Corporate Police Force Logistic Support"
  ],
  [
    60002029,
    10000033,
    "Usi VI - Moon 21 - Echelon Entertainment Publisher"
  ],
  [
    60014677,
    10000033,
    "Usi VI - Moon 23 - State War Academy"
  ],
  [
    60008908,
    10000036,
    "Ussad VI - Moon 7 - Civic Court Accounting"
  ],
  [
    60015044,
    10000030,
    "Usteli V - Republic University"
  ],
  [
    60012853,
    10000012,
    "Utopia VI - Moon 12 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60013069,
    10000012,
    "Utopia VI - Moon 22 - Dominations Assembly Plant"
  ],
  [
    60012850,
    10000012,
    "Utopia VI - Moon 6 - Serpentis Corporation Chemical Refinery"
  ],
  [
    60005239,
    10000042,
    "Uttindar V - Moon 17 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60002545,
    10000042,
    "Uttindar V - Moon 5 - Expert Distribution Retail Center"
  ],
  [
    60005776,
    10000042,
    "Uttindar V - Moon 9 - Freedom Extension Storage"
  ],
  [
    60005245,
    10000042,
    "Uttindar VI - Moon 6 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60005242,
    10000042,
    "Uttindar VII - Moon 4 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60015118,
    10000069,
    "Uuhulanen VIII - Caldari Navy Logistic Support"
  ],
  [
    60015119,
    10000069,
    "Uuhulanen X - Lai Dai Protection Service Assembly Plant"
  ],
  [
    60003436,
    10000033,
    "Uuna V - Moon 5 - Mercantile Club Academy"
  ],
  [
    60003382,
    10000033,
    "Uuna VI - Moon 22 - Chief Executive Panel Bureau"
  ],
  [
    60006370,
    10000038,
    "Uusanen I - Carthum Conglomerate Factory"
  ],
  [
    60008110,
    10000038,
    "Uusanen IV - Moon 1 - Ministry of Assessment Information Center"
  ],
  [
    60013099,
    10000038,
    "Uusanen IV - Moon 2 - Genolution Biotech Production"
  ],
  [
    60006376,
    10000038,
    "Uusanen V - Carthum Conglomerate Production Plant"
  ],
  [
    60012871,
    10000012,
    "UW9B-F X - Guardian Angels Logistic Support"
  ],
  [
    60012175,
    10000001,
    "Uzistoon VI - Moon 3 - Ammatar Fleet Assembly Plant"
  ],
  [
    60012172,
    10000001,
    "Uzistoon VII - Moon 15 - Ammatar Fleet Assembly Plant"
  ],
  [
    60014095,
    10000001,
    "Uzistoon VII - Moon 2 - Thukker Mix Factory"
  ],
  [
    60012748,
    10000012,
    "V-IUEL VII - Moon 15 - Salvation Angels Warehouse"
  ],
  [
    60014914,
    10000014,
    "V2-VC2 II - Moon 5 - Serpentis Corporation Cloning"
  ],
  [
    60013441,
    10000041,
    "V4-L0X IV - Moon 1 - Intaki Space Police Assembly Plant"
  ],
  [
    60010033,
    10000041,
    "V4-L0X IV - Moon 7 - Quafe Company Factory"
  ],
  [
    60014873,
    10000045,
    "V7-MID IX - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60012199,
    10000012,
    "V7D-JD IX - Moon 17 - Archangels Assembly Plant"
  ],
  [
    60002890,
    10000016,
    "Vaajaita I - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60001708,
    10000016,
    "Vaajaita III - Caldari Steel Factory"
  ],
  [
    60003415,
    10000016,
    "Vaajaita VI - Mercantile Club Bureau"
  ],
  [
    60002878,
    10000016,
    "Vaajaita VI - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60003064,
    10000002,
    "Vaankalen I - Moon 3 - Expert Housing Production Plant"
  ],
  [
    60005215,
    10000068,
    "Vaere III - Moon 1 - Republic Security Services Logistic Support"
  ],
  [
    60010876,
    10000068,
    "Vaere VII - Duvolle Laboratories Warehouse"
  ],
  [
    60009565,
    10000068,
    "Vaere VIII - Moon 11 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60003250,
    10000068,
    "Vaere VIII - Moon 3 - Modern Finances Depository"
  ],
  [
    60003211,
    10000002,
    "Vahunomi X - Moon 4 - State and Region Bank Vault"
  ],
  [
    60008842,
    10000054,
    "Vaini I - Moon 1 - Civic Court Law School"
  ],
  [
    60000178,
    10000054,
    "Vaini III - CBD Corporation Storage"
  ],
  [
    60011395,
    10000054,
    "Vaini III - Moon 1 - Pend Insurance Depository"
  ],
  [
    60006712,
    10000054,
    "Vaini III - Moon 1 - Zoar and Sons Factory"
  ],
  [
    60009463,
    10000064,
    "Vale II - Moon 1 - Material Acquisition Mining Outpost"
  ],
  [
    60010762,
    10000064,
    "Vale VI - Moon 2 - Chemal Tech Research Center"
  ],
  [
    60006187,
    10000054,
    "Van III - Moon 1 - Amarr Constructions Warehouse"
  ],
  [
    60005758,
    10000030,
    "Vard III - Six Kin Development Production Plant"
  ],
  [
    60005755,
    10000030,
    "Vard VI - Moon 14 - Six Kin Development Production Plant"
  ],
  [
    60007594,
    10000002,
    "Vasala IV - Nurtura Food Packaging"
  ],
  [
    60002233,
    10000002,
    "Vasala V - Moon 15 - Ishukone Corporation Factory"
  ],
  [
    60001585,
    10000002,
    "Vasala V - Moon 3 - Perkone Factory"
  ],
  [
    60010819,
    10000002,
    "Vasala VI - Moon 10 - Chemal Tech Factory"
  ],
  [
    60013150,
    10000002,
    "Vasala VI - Moon 10 - Genolution Biotech Production"
  ],
  [
    60000787,
    10000002,
    "Vasala VI - Moon 10 - Minedrill Refinery"
  ],
  [
    60007699,
    10000043,
    "Vashkah IV - Moon 2 - Further Foodstuffs Food Packaging"
  ],
  [
    60006103,
    10000043,
    "Vashkah VI - Moon 2 - Amarr Constructions Warehouse"
  ],
  [
    60010789,
    10000043,
    "Vashkah VI - Moon 2 - Chemal Tech Research Center"
  ],
  [
    60003364,
    10000002,
    "Vattuolen IX - Chief Executive Panel Bureau"
  ],
  [
    60004063,
    10000002,
    "Vattuolen X - Moon 14 - Peace and Order Unit Assembly Plant"
  ],
  [
    60012718,
    10000002,
    "Vattuolen X - Moon 15 - Sisters of EVE Bureau"
  ],
  [
    60004057,
    10000002,
    "Vattuolen XII - Moon 2 - Peace and Order Unit Logistic Support"
  ],
  [
    60009859,
    10000037,
    "Vaurent II - Quafe Company Factory"
  ],
  [
    60005578,
    10000068,
    "Vay I - Core Complexion Inc. Factory"
  ],
  [
    60008095,
    10000067,
    "Vecamia V - Moon 1 - Ministry of Assessment Archives"
  ],
  [
    60008092,
    10000067,
    "Vecamia VII - Moon 2 - Ministry of Assessment Archives"
  ],
  [
    60007072,
    10000067,
    "Vecamia VII - Moon 5 - Imperial Shipment Storage"
  ],
  [
    60009526,
    10000044,
    "Vecodie I - Material Acquisition Mineral Reserve"
  ],
  [
    60011989,
    10000044,
    "Vecodie II - Federal Intelligence Office Testing Facilities"
  ],
  [
    60007930,
    10000054,
    "Vehan V - Moon 1 - Ministry of War Archives"
  ],
  [
    60007927,
    10000054,
    "Vehan VI - Moon 10 - Ministry of War Archives"
  ],
  [
    60001717,
    10000016,
    "Veisto V - Caldari Steel Factory"
  ],
  [
    60001720,
    10000016,
    "Veisto V - Moon 15 - Caldari Steel Factory"
  ],
  [
    60002911,
    10000016,
    "Veisto V - Moon 15 - Sukuuvestaa Corporation Factory"
  ],
  [
    60000754,
    10000016,
    "Veisto V - Moon 4 - Poksu Mineral Group Refinery"
  ],
  [
    60002416,
    10000016,
    "Veisto V - Moon 4 - Propel Dynamics Factory"
  ],
  [
    60000757,
    10000016,
    "Veisto V - Moon 5 - Poksu Mineral Group Refinery"
  ],
  [
    60012328,
    10000016,
    "Vellaine V - Moon 2 - CONCORD Bureau"
  ],
  [
    60002038,
    10000016,
    "Vellaine V - Moon 4 - Echelon Entertainment Development Studio"
  ],
  [
    60001711,
    10000016,
    "Vellaine VI - Moon 8 - Caldari Steel Warehouse"
  ],
  [
    60002407,
    10000016,
    "Vellaine VI - Moon 9 - Propel Dynamics Factory"
  ],
  [
    60002623,
    10000033,
    "Venilen IX - Moon 10 - Expert Distribution Warehouse"
  ],
  [
    60002620,
    10000033,
    "Venilen IX - Moon 2 - Expert Distribution Warehouse"
  ],
  [
    60003853,
    10000033,
    "Venilen IX - Moon 7 - Caldari Navy Testing Facilities"
  ],
  [
    60002617,
    10000033,
    "Venilen VIII - Expert Distribution Warehouse"
  ],
  [
    60000565,
    10000033,
    "Venilen VIII - Moon 3 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60006019,
    10000033,
    "Venilen VIII - Moon 5 - Freedom Extension Warehouse"
  ],
  [
    60000568,
    10000033,
    "Venilen VIII - Moon 8 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60000571,
    10000033,
    "Venilen XI - Moon 14 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60003748,
    10000033,
    "Venilen XII - Moon 1 - House of Records Archives"
  ],
  [
    60011245,
    10000048,
    "Vestouve IX - Moon 11 - Aliastra Warehouse"
  ],
  [
    60011776,
    10000048,
    "Vestouve IX - Moon 14 - Federation Navy Logistic Support"
  ],
  [
    60011773,
    10000048,
    "Vestouve VIII - Moon 13 - Federation Navy Logistic Support"
  ],
  [
    60013348,
    10000044,
    "Vevelonel VI - Moon 1 - Impro Factory"
  ],
  [
    60009436,
    10000044,
    "Vevelonel VI - Moon 3 - Material Acquisition Mineral Reserve"
  ],
  [
    60009673,
    10000048,
    "Vey VI - Moon 10 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60010957,
    10000048,
    "Vey VIII - Moon 15 - FedMart Warehouse"
  ],
  [
    60009670,
    10000048,
    "Vey VIII - Moon 19 - Astral Mining Inc. Mining Outpost"
  ],
  [
    60013987,
    10000049,
    "Vezila IV - Royal Khanid Navy Assembly Plant"
  ],
  [
    60014917,
    10000035,
    "VFK-IV VI - Moon 1 - Serpentis Corporation Cloning"
  ],
  [
    60009472,
    10000048,
    "Vilinnon I - Material Acquisition Mining Outpost"
  ],
  [
    60015108,
    10000069,
    "Villasen V - Lai Dai Protection Service Logistic Support"
  ],
  [
    60015144,
    10000064,
    "Villore VI - Federal Defense Union Logistic Support"
  ],
  [
    60011602,
    10000064,
    "Villore VII - Moon 6 - Senate Bureau"
  ],
  [
    60009928,
    10000064,
    "Villore VII - Moon 8 - Quafe Company Factory"
  ],
  [
    60011608,
    10000064,
    "Villore VIII - Moon 2 - Supreme Court Law School"
  ],
  [
    60011935,
    10000064,
    "Villore VIII - Moon 7 - Federal Intelligence Office Logistic Support"
  ],
  [
    60002143,
    10000042,
    "Vilur VI - Moon 2 - Ishukone Corporation Factory"
  ],
  [
    60007414,
    10000042,
    "Vilur VII - Moon 4 - Joint Harvesting Food Packaging"
  ],
  [
    60009103,
    10000042,
    "Vimeini VI - Moon 4 - TransStellar Shipping Storage"
  ],
  [
    60004720,
    10000042,
    "Vimeini VII - Moon 19 - Republic Parliament Bureau"
  ],
  [
    60009715,
    10000064,
    "Vitrauze XI - Moon 10 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60014710,
    10000064,
    "Vitrauze XI - Moon 2 - Federal Navy Academy"
  ],
  [
    60010681,
    10000064,
    "Vitrauze XI - Moon 8 - The Scope Development Studio"
  ],
  [
    60009727,
    10000064,
    "Vitrauze XII - Moon 1 - Astral Mining Inc. Refinery"
  ],
  [
    60002476,
    10000032,
    "Vittenyn IV - Moon 6 - Expert Distribution Warehouse"
  ],
  [
    60011848,
    10000032,
    "Vittenyn VI - Moon 13 - Federation Navy Assembly Plant"
  ],
  [
    60009124,
    10000048,
    "Vivanier I - TransStellar Shipping Storage"
  ],
  [
    60012097,
    10000048,
    "Vivanier II - Federation Customs Assembly Plant"
  ],
  [
    60009583,
    10000048,
    "Vivanier III - Moon 1 - Astral Mining Inc. Refinery"
  ],
  [
    60010900,
    10000048,
    "Vivanier V - Moon 3 - Duvolle Laboratories Factory"
  ],
  [
    60009136,
    10000048,
    "Vivanier VI - Moon 1 - TransStellar Shipping Storage"
  ],
  [
    60013216,
    10000048,
    "Vivanier VI - Moon 5 - Genolution Biotech Production"
  ],
  [
    60012094,
    10000048,
    "Vivanier VI - Moon 8 - Federation Customs Assembly Plant"
  ],
  [
    60005134,
    10000048,
    "Vivanier VII - Moon 12 - Republic Security Services Assembly Plant"
  ],
  [
    60009841,
    10000048,
    "Vivanier VII - Moon 17 - Combined Harvest Food Packaging"
  ],
  [
    60009127,
    10000048,
    "Vivanier VII - Moon 19 - TransStellar Shipping Storage"
  ],
  [
    60012676,
    10000048,
    "Vivanier VII - Moon 24 - Sisters of EVE Bureau"
  ],
  [
    60009139,
    10000048,
    "Vivanier VII - Moon 3 - TransStellar Shipping Storage"
  ],
  [
    60009130,
    10000048,
    "Vivanier VII - Moon 4 - TransStellar Shipping Storage"
  ],
  [
    60012679,
    10000048,
    "Vivanier VII - Moon 5 - Sisters of EVE Bureau"
  ],
  [
    60013477,
    10000041,
    "VLGD-R III - Moon 2 - Intaki Syndicate Academy"
  ],
  [
    60013438,
    10000041,
    "VLGD-R V - Moon 3 - Intaki Space Police Logistic Support"
  ],
  [
    60001396,
    10000048,
    "Vlillirier III - Moon 2 - Wiyrkomi Corporation Factory"
  ],
  [
    60001399,
    10000048,
    "Vlillirier IV - Moon 11 - Wiyrkomi Corporation Factory"
  ],
  [
    60001393,
    10000048,
    "Vlillirier IV - Moon 13 - Wiyrkomi Corporation Warehouse"
  ],
  [
    60010327,
    10000048,
    "Vlillirier IV - Roden Shipyards Factory"
  ],
  [
    60011017,
    10000048,
    "Vlillirier V - Moon 1 - FedMart Storage"
  ],
  [
    60001390,
    10000048,
    "Vlillirier V - Moon 2 - Wiyrkomi Corporation Factory"
  ],
  [
    60010330,
    10000048,
    "Vlillirier VI - Moon 1 - Roden Shipyards Factory"
  ],
  [
    60006799,
    10000048,
    "Vlillirier VII - Moon 1 - Ducia Foundry Refinery"
  ],
  [
    60006805,
    10000048,
    "Vlillirier VII - Moon 15 - Ducia Foundry Mineral Reserve"
  ],
  [
    60011008,
    10000048,
    "Vlillirier VII - Moon 19 - FedMart Warehouse"
  ],
  [
    60010333,
    10000048,
    "Vlillirier VII - Roden Shipyards Factory"
  ],
  [
    60014924,
    10000056,
    "VNGJ-U V - Moon 1 - Serpentis Corporation Cloning"
  ],
  [
    60000046,
    10000042,
    "Vorsk IV - Moon 1 - CBD Corporation Storage"
  ],
  [
    60007540,
    10000042,
    "Vorsk IX - Moon 5 - Nurtura Plantation"
  ],
  [
    60007543,
    10000042,
    "Vorsk IX - Moon 9 - Nurtura Plantation"
  ],
  [
    60007537,
    10000042,
    "Vorsk VIII - Moon 3 - Nurtura Plantation"
  ],
  [
    60013144,
    10000002,
    "Vouskiaho III - Genolution Biotech Production"
  ],
  [
    60000574,
    10000002,
    "Vouskiaho III - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60000385,
    10000002,
    "Vouskiaho IV - Moon 1 - Ytiri Storage"
  ],
  [
    60001588,
    10000002,
    "Vouskiaho V - Moon 9 - Perkone Factory"
  ],
  [
    60000388,
    10000002,
    "Vouskiaho VI - Moon 14 - Ytiri Storage"
  ],
  [
    60000580,
    10000002,
    "Vouskiaho VI - Moon 15 - Hyasyoda Corporation Mineral Reserve"
  ],
  [
    60010816,
    10000002,
    "Vouskiaho VI - Moon 2 - Chemal Tech Factory"
  ],
  [
    60000589,
    10000002,
    "Vouskiaho VIII - Moon 17 - Hyasyoda Corporation Refinery"
  ],
  [
    60009259,
    10000041,
    "VSIG-K V - Moon 8 - TransStellar Shipping Storage"
  ],
  [
    60013504,
    10000041,
    "VSIG-K VIII - Moon 1 - Intaki Syndicate Bureau"
  ],
  [
    60009250,
    10000041,
    "VSIG-K VIII - Moon 3 - TransStellar Shipping Storage"
  ],
  [
    60009265,
    10000041,
    "VSIG-K VIII - Moon 5 - TransStellar Shipping Storage"
  ],
  [
    60005746,
    10000030,
    "Vullat I - Six Kin Development Foundry"
  ],
  [
    60005749,
    10000030,
    "Vullat IX - Moon 2 - Six Kin Development Foundry"
  ],
  [
    60005743,
    10000030,
    "Vullat VII - Moon 1 - Six Kin Development Foundry"
  ],
  [
    60013228,
    10000030,
    "Vullat VII - Moon 11 - Genolution Biotech Research Center"
  ],
  [
    60004738,
    10000030,
    "Vullat VII - Moon 9 - Republic Parliament Academy"
  ],
  [
    60013225,
    10000030,
    "Vullat VIII - Moon 1 - Genolution Biohazard Containment Facility"
  ],
  [
    60003601,
    10000016,
    "Vuorrassi I - Moon 1 - Caldari Business Tribunal"
  ],
  [
    60001504,
    10000016,
    "Vuorrassi IV - Moon 1 - Rapid Assembly Factory"
  ],
  [
    60001498,
    10000016,
    "Vuorrassi IV - Moon 10 - Rapid Assembly Factory"
  ],
  [
    60000823,
    10000016,
    "Vuorrassi IV - Moon 2 - Minedrill Mineral Reserve"
  ],
  [
    60004138,
    10000016,
    "Vuorrassi V - Moon 1 - Spacelane Patrol Assembly Plant"
  ],
  [
    60002164,
    10000016,
    "Vuorrassi V - Moon 13 - Ishukone Corporation Factory"
  ],
  [
    60004147,
    10000016,
    "Vuorrassi V - Moon 13 - Spacelane Patrol Assembly Plant"
  ],
  [
    60002170,
    10000016,
    "Vuorrassi V - Moon 6 - Ishukone Corporation Factory"
  ],
  [
    60004447,
    10000016,
    "Vuorrassi V - Moon 9 - Caldari Provisions School"
  ],
  [
    60003814,
    10000016,
    "Vuorrassi VI - Moon 2 - Caldari Navy Logistic Support"
  ],
  [
    60004144,
    10000016,
    "Vuorrassi VI - Moon 3 - Spacelane Patrol Assembly Plant"
  ],
  [
    60003613,
    10000016,
    "Vuorrassi VI - Moon 4 - Caldari Business Tribunal Information Center"
  ],
  [
    60010546,
    10000041,
    "VV-VCR VII - Moon 2 - Impetus Development Studio"
  ],
  [
    60009682,
    10000032,
    "Vylade IV - Moon 16 - Astral Mining Inc. Mineral Reserve"
  ],
  [
    60009685,
    10000032,
    "Vylade VII - Moon 3 - Astral Mining Inc. Refinery"
  ],
  [
    60011875,
    10000032,
    "Vylade VII - Moon 6 - Federation Navy Logistic Support"
  ],
  [
    60014344,
    10000022,
    "W-Q233 V - Moon 10 - True Power Refinery"
  ],
  [
    60014275,
    10000022,
    "W-Q233 VI - Moon 1 - True Creations Shipyard"
  ],
  [
    60014191,
    10000022,
    "W-VXL9 IV - Moon 21 - True Creations Assembly Plant"
  ],
  [
    60013816,
    10000017,
    "W6H6-K II - Jovian Directorate Bureau"
  ],
  [
    60013819,
    10000017,
    "W6H6-K IV - Moon 15 - Jovian Directorate Bureau"
  ],
  [
    60000889,
    10000033,
    "Waira V - Moon 1 - Caldari Provisions Food Packaging"
  ],
  [
    60000886,
    10000033,
    "Waira VIII - Moon 15 - Caldari Provisions Food Packaging"
  ],
  [
    60000661,
    10000033,
    "Waira VIII - Moon 17 - Poksu Mineral Group Mineral Reserve"
  ],
  [
    60007387,
    10000043,
    "Warouh V - Moon 9 - Joint Harvesting Food Packaging"
  ],
  [
    60006958,
    10000043,
    "Warouh VI - Moon 18 - Inherent Implants Biotech Production"
  ],
  [
    60007402,
    10000043,
    "Warouh VI - Moon 5 - Joint Harvesting Mineral Reserve"
  ],
  [
    60010141,
    10000043,
    "Warouh VII - Moon 1 - CreoDron Factory"
  ],
  [
    60001207,
    10000033,
    "Waskisen I - Moon 2 - Kaalakiota Corporation Factory"
  ],
  [
    60004351,
    10000033,
    "Waskisen IX - Moon 11 - Corporate Police Force Logistic Support"
  ],
  [
    60001192,
    10000033,
    "Waskisen IX - Moon 11 - Kaalakiota Corporation Warehouse"
  ],
  [
    60002260,
    10000033,
    "Waskisen VII - Moon 7 - Lai Dai Corporation Factory"
  ],
  [
    60005365,
    10000028,
    "Weld III - Moon 5 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60004876,
    10000028,
    "Weld III - Moon 6 - Republic Fleet Logistic Support"
  ],
  [
    60005374,
    10000028,
    "Weld IV - Moon 10 - Minmatar Mining Corporation Mineral Reserve"
  ],
  [
    60000079,
    10000028,
    "Weld IV - Moon 14 - CBD Corporation Storage"
  ],
  [
    60010180,
    10000028,
    "Weld IV - Moon 4 - CreoDron Factory"
  ],
  [
    60005371,
    10000028,
    "Weld IV - Moon 9 - Minmatar Mining Corporation Mining Outpost"
  ],
  [
    60005359,
    10000028,
    "Weld VI - Moon 1 - Minmatar Mining Corporation Refinery"
  ],
  [
    60014290,
    10000022,
    "WEQT-K I - Moon 12 - True Power Mineral Reserve"
  ],
  [
    60000490,
    10000002,
    "Wirashoda V - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60000487,
    10000002,
    "Wirashoda VII - Moon 5 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60000970,
    10000002,
    "Wirashoda VIII - Moon 5 - Caldari Provisions Plantation"
  ],
  [
    60004669,
    10000042,
    "Wirdalen VII - Moon 17 - Republic Parliament Bureau"
  ],
  [
    60004663,
    10000042,
    "Wirdalen VII - Moon 8 - Republic Parliament Bureau"
  ],
  [
    60011179,
    10000030,
    "Wiskeber VII - Moon 9 - Aliastra Warehouse"
  ],
  [
    60000526,
    10000002,
    "Wuos V - Moon 1 - Hyasyoda Corporation Mining Outpost"
  ],
  [
    60001786,
    10000002,
    "Wuos VI - Zainou Biotech Research Center"
  ],
  [
    60012787,
    10000058,
    "WY-9LL IX - Moon 1 - Salvation Angels Reprocessing Facility"
  ],
  [
    60012865,
    10000058,
    "WY-9LL IX - Moon 1 - Serpentis Corporation Reprocessing Facility"
  ],
  [
    60013072,
    10000058,
    "WY-9LL VIII - Moon 3 - Dominations Testing Facilities"
  ],
  [
    60011092,
    10000064,
    "Wysalan VIII - Moon 1 - FedMart Storage"
  ],
  [
    60005221,
    10000064,
    "Wysalan VIII - Moon 1 - Republic Security Services Assembly Plant"
  ],
  [
    60014056,
    10000023,
    "X-7OMU II - Moon 7 - The Sanctuary School"
  ],
  [
    60013075,
    10000023,
    "X-7OMU IV - Moon 16 - Food Relief Plantation"
  ],
  [
    60012595,
    10000023,
    "X-7OMU IV - Moon 3 - Sisters of EVE Academy"
  ],
  [
    60013357,
    10000041,
    "X-BV98 VIII - Moon 5 - Intaki Bank Depository"
  ],
  [
    60013384,
    10000041,
    "X-M2LR VI - Moon 8 - Intaki Commerce Warehouse"
  ],
  [
    60013705,
    10000017,
    "X7-8IG VIII - Moon 9 - Jovian Directorate Treasury"
  ],
  [
    60014194,
    10000022,
    "XFBE-T I - Moon 5 - True Creations Shipyard"
  ],
  [
    60013057,
    10000012,
    "XX9-WV VII - Moon 1 - Dominations Logistic Support"
  ],
  [
    60012754,
    10000012,
    "XX9-WV VII - Moon 3 - Salvation Angels Trading Post"
  ],
  [
    60011284,
    10000041,
    "XYY-IA III - Moon 10 - Aliastra Warehouse"
  ],
  [
    60011281,
    10000041,
    "XYY-IA IV - Moon 6 - Aliastra Warehouse"
  ],
  [
    60014876,
    10000051,
    "XZH-4X VI - Moon 3 - Serpentis Corporation Manufacturing"
  ],
  [
    60012559,
    10000015,
    "Y-4CFK V - Moon 17 - Guristas Testing Facilities"
  ],
  [
    60014215,
    10000022,
    "Y-4U62 V - Moon 1 - True Creations Shipyard"
  ],
  [
    60014212,
    10000022,
    "Y-4U62 VIII - Moon 2 - True Creations Shipyard"
  ],
  [
    60012223,
    10000012,
    "Y-DW5K IV - Moon 5 - Archangels Logistic Support"
  ],
  [
    60001885,
    10000041,
    "Y-W6GF I - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60013510,
    10000041,
    "Y-W6GF IX - Moon 3 - Intaki Syndicate Bureau"
  ],
  [
    60013453,
    10000041,
    "Y-W6GF VIII - Moon 17 - Intaki Space Police Logistic Support"
  ],
  [
    60001891,
    10000041,
    "Y-W6GF X - Moon 1 - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60001894,
    10000041,
    "Y-W6GF X - Nugoeihuvi Corporation Development Studio"
  ],
  [
    60013498,
    10000041,
    "Y9G-KS VI - Moon 14 - Intaki Syndicate Bureau"
  ],
  [
    60008449,
    10000054,
    "Yahyerer IV - Moon 9 - Amarr Navy Testing Facilities"
  ],
  [
    60007999,
    10000020,
    "Yanuel XI - Moon 16 - Ministry of War Information Center"
  ],
  [
    60008002,
    10000020,
    "Yanuel XI - Moon 4 - Ministry of War Information Center"
  ],
  [
    60011470,
    10000052,
    "Yarebap VI - Moon 11 - Pend Insurance Depository"
  ],
  [
    60008473,
    10000052,
    "Yarebap VI - Moon 5 - Amarr Navy Assembly Plant"
  ],
  [
    60008470,
    10000052,
    "Yarebap VII - Moon 18 - Amarr Navy Assembly Plant"
  ],
  [
    60011473,
    10000052,
    "Yarebap VII - Moon 20 - Pend Insurance Depository"
  ],
  [
    60008854,
    10000052,
    "Yarebap VII - Moon 8 - Civic Court Tribunal"
  ],
  [
    60010279,
    10000052,
    "Yarebap VII - Moon 8 - CreoDron Factory"
  ],
  [
    60013195,
    10000033,
    "Yashunen III - Genolution Biotech Production"
  ],
  [
    60002875,
    10000033,
    "Yashunen III - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60002866,
    10000033,
    "Yashunen V - Moon 1 - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60012511,
    10000033,
    "Yashunen VII - CONCORD Bureau"
  ],
  [
    60012514,
    10000033,
    "Yashunen VII - Moon 2 - CONCORD Bureau"
  ],
  [
    60002872,
    10000033,
    "Yashunen VII - Sukuuvestaa Corporation Warehouse"
  ],
  [
    60013165,
    10000020,
    "Yasud VI - Moon 18 - Genolution Biotech Production"
  ],
  [
    60007135,
    10000020,
    "Yasud VIII - Moon 1 - Imperial Shipment Storage"
  ],
  [
    60013732,
    10000017,
    "YBYX-1 I - Jovian Directorate Academy"
  ],
  [
    60007141,
    10000020,
    "Yeder VII - Moon 6 - Imperial Shipment Storage"
  ],
  [
    60007858,
    10000043,
    "Yeeramoun VII - Moon 2 - Amarr Civil Service Bureau Offices"
  ],
  [
    60007852,
    10000043,
    "Yeeramoun VII - Moon 5 - Amarr Civil Service Information Center"
  ],
  [
    60006121,
    10000054,
    "Yehaba VII - Amarr Constructions Warehouse"
  ],
  [
    60006142,
    10000052,
    "Yehnifi VI - Amarr Constructions Production Plant"
  ],
  [
    60006136,
    10000052,
    "Yehnifi X - Moon 22 - Amarr Constructions Foundry"
  ],
  [
    60006139,
    10000052,
    "Yehnifi XI - Moon 2 - Amarr Constructions Foundry"
  ],
  [
    60010693,
    10000054,
    "Yiratal VIII - Moon 4 - The Scope Publisher"
  ],
  [
    60012886,
    10000012,
    "YKE4-3 III - Moon 1 - Guardian Angels Testing Facilities"
  ],
  [
    60001768,
    10000016,
    "Ylandoki II - Zainou Biotech Production"
  ],
  [
    60005143,
    10000016,
    "Ylandoki V - Moon 10 - Republic Security Services Assembly Plant"
  ],
  [
    60003322,
    10000016,
    "Ylandoki V - Moon 7 - Modern Finances Depository"
  ],
  [
    60003427,
    10000016,
    "Ylandoki VI - Moon 15 - Mercantile Club Bureau"
  ],
  [
    60003157,
    10000016,
    "Ylandoki VI - Moon 8 - Caldari Funds Unlimited Depository"
  ],
  [
    60003325,
    10000016,
    "Ylandoki VII - Moon 1 - Modern Finances Depository"
  ],
  [
    60005503,
    10000064,
    "Yona II - Core Complexion Inc. Factory"
  ],
  [
    60005509,
    10000064,
    "Yona VI - Moon 18 - Core Complexion Inc. Factory"
  ],
  [
    60010207,
    10000064,
    "Yona VI - Moon 5 - CreoDron Factory"
  ],
  [
    60005506,
    10000064,
    "Yona VII - Moon 8 - Core Complexion Inc. Factory"
  ],
  [
    60005227,
    10000064,
    "Yona VIII - Moon 8 - Republic Security Services Assembly Plant"
  ],
  [
    60008887,
    10000020,
    "Yong VII - Moon 6 - Civic Court Accounting"
  ],
  [
    60008431,
    10000043,
    "Youl VII - Moon 10 - Amarr Navy Logistic Support"
  ],
  [
    60000631,
    10000033,
    "Yria II - Moon 11 - Deep Core Mining Inc. Refinery"
  ],
  [
    60002614,
    10000033,
    "Yria III - Moon 1 - Expert Distribution Retail Center"
  ],
  [
    60004411,
    10000033,
    "Yria III - Moon 6 - Corporate Police Force Assembly Plant"
  ],
  [
    60006007,
    10000033,
    "Yria IV - Moon 9 - Freedom Extension Storage"
  ],
  [
    60005422,
    10000042,
    "Yrmori IV - Moon 17 - Core Complexion Inc. Factory"
  ],
  [
    60006040,
    10000042,
    "Yrmori V - Moon 4 - The Leisure Group Development Studio"
  ],
  [
    60006412,
    10000043,
    "Yuhelia V - Moon 1 - Imperial Armaments Factory"
  ],
  [
    60012736,
    10000067,
    "Yulai III - Moon 1 - Secure Commerce Commission Depository"
  ],
  [
    60012256,
    10000067,
    "Yulai IX - CONCORD Bureau"
  ],
  [
    60013354,
    10000067,
    "Yulai VIII - Inner Circle Tribunal"
  ],
  [
    60012271,
    10000067,
    "Yulai VIII - Moon 10 - CONCORD Logistic Support"
  ],
  [
    60012916,
    10000067,
    "Yulai VIII - Moon 12 - DED Logistic Support"
  ],
  [
    60012922,
    10000067,
    "Yulai X - DED Assembly Plant"
  ],
  [
    60013861,
    10000001,
    "Yuzier III - Nefantar Miner Association Mining Outpost"
  ],
  [
    60012127,
    10000001,
    "Yuzier V - Moon 1 - Ammatar Fleet Assembly Plant"
  ],
  [
    60014434,
    10000001,
    "Yuzier VII - Trust Partners Trading Post"
  ],
  [
    60011044,
    10000044,
    "Yvaeroure VI - Moon 1 - FedMart Retail Center"
  ],
  [
    60011992,
    10000044,
    "Yvaeroure X - Moon 14 - Federal Intelligence Office Assembly Plant"
  ],
  [
    60011056,
    10000044,
    "Yvaeroure X - Moon 15 - FedMart Storage"
  ],
  [
    60011047,
    10000044,
    "Yvaeroure X - Moon 8 - FedMart Warehouse"
  ],
  [
    60011041,
    10000044,
    "Yvaeroure XI - Moon 14 - FedMart Retail Center"
  ],
  [
    60010480,
    10000044,
    "Yvaeroure XI - Moon 7 - Poteque Pharmaceuticals Biotech Production"
  ],
  [
    60009535,
    10000044,
    "Yvaeroure XII - Moon 11 - Material Acquisition Refinery"
  ],
  [
    60009532,
    10000044,
    "Yvaeroure XII - Moon 9 - Material Acquisition Refinery"
  ],
  [
    60009166,
    10000064,
    "Yvangier V - TransStellar Shipping Storage"
  ],
  [
    60014536,
    10000064,
    "Yvangier VIII - X-Sense Chemical Storage"
  ],
  [
    60011050,
    10000044,
    "Yvelet VI - Moon 2 - FedMart Warehouse"
  ],
  [
    60012910,
    10000058,
    "YZ-LQL VI - Moon 19 - Guardian Angels Logistic Support"
  ],
  [
    60012913,
    10000058,
    "YZ-LQL VII - Moon 1 - Guardian Angels Assembly Plant"
  ],
  [
    60014949,
    10000060,
    "YZ9-F6 V - Blood Raiders Assembly Plant"
  ],
  [
    60014882,
    10000062,
    "Z-7OK1 III - Moon 2 - Serpentis Corporation Manufacturing"
  ],
  [
    60014869,
    10000025,
    "Z-H2MA IV - Moon 1 - Serpentis Corporation Manufacturing"
  ],
  [
    60013735,
    10000019,
    "Z-KPAR VIII - Moon 21 - Jovian Directorate Academy"
  ],
  [
    60014870,
    10000031,
    "Z-N9IP VII - Moon 2 - Serpentis Corporation Manufacturing"
  ],
  [
    60014941,
    10000060,
    "Z3V-1W VII - Blood Raiders Assembly Plant"
  ],
  [
    60005986,
    10000043,
    "Zaimeth II - Moon 2 - Freedom Extension Storage"
  ],
  [
    60008437,
    10000043,
    "Zaimeth IX - Moon 15 - Amarr Navy Assembly Plant"
  ],
  [
    60008683,
    10000043,
    "Zanka V - Moon 9 - Sarum Family Testing Facilities"
  ],
  [
    60013126,
    10000067,
    "Zarer VI - Moon 10 - Genolution Biotech Production"
  ],
  [
    60012478,
    10000065,
    "Zatamaka VII - Moon 2 - CONCORD Bureau"
  ],
  [
    60012481,
    10000065,
    "Zatamaka X - Moon 2 - CONCORD Bureau"
  ],
  [
    60012472,
    10000065,
    "Zatamaka XI - CONCORD Bureau"
  ],
  [
    60011464,
    10000054,
    "Zayi X - Moon 7 - Pend Insurance Depository"
  ],
  [
    60006595,
    10000020,
    "Zehru IX - Moon 10 - Viziam Warehouse"
  ],
  [
    60006589,
    10000020,
    "Zehru IX - Moon 4 - Viziam Factory"
  ],
  [
    60014140,
    10000001,
    "Zemalu IX - Moon 2 - Thukker Mix Factory"
  ],
  [
    60013846,
    10000049,
    "Zephan VIII - Moon 1 - Khanid Transport Storage"
  ],
  [
    60014272,
    10000022,
    "ZG8Q-N VII - Moon 6 - True Creations Testing Facilities"
  ],
  [
    60014239,
    10000022,
    "ZH-KEV VI - Moon 6 - True Creations Storage Bay"
  ],
  [
    60006415,
    10000043,
    "Zhilshinou IX - Imperial Armaments Factory"
  ],
  [
    60013117,
    10000067,
    "Ziasad IX - Moon 3 - Genolution Biotech Production"
  ],
  [
    60006166,
    10000052,
    "Zimse V - Moon 11 - Amarr Constructions Production Plant"
  ],
  [
    60006163,
    10000052,
    "Zimse VI - Moon 7 - Amarr Constructions Production Plant"
  ],
  [
    60003478,
    10000065,
    "Zinkon VII - Moon 1 - Caldari Business Tribunal Accounting"
  ],
  [
    60001027,
    10000043,
    "Ziona III - Moon 1 - Kaalakiota Corporation Warehouse"
  ],
  [
    60006460,
    10000043,
    "Ziona V - Moon 1 - Imperial Armaments Warehouse"
  ],
  [
    60001018,
    10000043,
    "Ziona V - Moon 1 - Kaalakiota Corporation Warehouse"
  ],
  [
    60005665,
    10000043,
    "Ziona VI - Moon 11 - Core Complexion Inc. Factory"
  ],
  [
    60005677,
    10000043,
    "Ziona VI - Moon 6 - Core Complexion Inc. Storage"
  ],
  [
    60001021,
    10000043,
    "Ziona VI - Moon 6 - Kaalakiota Corporation Factory"
  ],
  [
    60007774,
    10000043,
    "Ziona VI - Moon 8 - Amarr Civil Service Bureau Offices"
  ],
  [
    60001012,
    10000043,
    "Ziona VII - Moon 1 - Kaalakiota Corporation Factory"
  ],
  [
    60007891,
    10000043,
    "Ziona VII - Moon 13 - Ministry of War Archives"
  ],
  [
    60001015,
    10000043,
    "Ziona VII - Moon 3 - Kaalakiota Corporation Warehouse"
  ],
  [
    60006661,
    10000043,
    "Ziriert VI - Zoar and Sons Factory"
  ],
  [
    60006448,
    10000043,
    "Ziriert VIII - Moon 12 - Imperial Armaments Factory"
  ],
  [
    60006655,
    10000043,
    "Ziriert VIII - Moon 3 - Zoar and Sons Factory"
  ],
  [
    60013834,
    10000049,
    "Zirsem IX - Khanid Transport Storage"
  ],
  [
    60013942,
    10000049,
    "Zirsem IX - Moon 4 - Royal Khanid Navy Testing Facilities"
  ],
  [
    60013939,
    10000049,
    "Zirsem VII - Royal Khanid Navy Testing Facilities"
  ],
  [
    60000223,
    10000020,
    "Zith IX - Moon 2 - CBD Corporation Storage"
  ],
  [
    60002461,
    10000020,
    "Zith IX - Moon 4 - Expert Distribution Retail Center"
  ],
  [
    60006688,
    10000020,
    "Zith IX - Zoar and Sons Factory"
  ],
  [
    60008053,
    10000020,
    "Zith VII - Moon 1 - Ministry of Assessment Bureau Offices"
  ],
  [
    60002458,
    10000020,
    "Zith VIII - Moon 2 - Expert Distribution Retail Center"
  ],
  [
    60014907,
    10000003,
    "ZLZ-1Z IV - Moon 3 - Serpentis Corporation Cloning"
  ],
  [
    60013366,
    10000041,
    "ZN0-SR III - Intaki Bank Depository"
  ],
  [
    60013363,
    10000041,
    "ZN0-SR V - Moon 7 - Intaki Bank Depository"
  ],
  [
    60013420,
    10000041,
    "ZN0-SR VI - Moon 4 - Intaki Space Police Assembly Plant"
  ],
  [
    60009031,
    10000067,
    "Zoohen III - Theology Council Tribunal"
  ],
  [
    60005638,
    10000067,
    "Zoohen VII - Core Complexion Inc. Factory"
  ],
  [
    60006241,
    10000052,
    "Zororzih VII - Moon 12 - Carthum Conglomerate Factory"
  ],
  [
    60007813,
    10000052,
    "Zororzih VIII - Moon 1 - Amarr Civil Service Information Center"
  ],
  [
    60008638,
    10000052,
    "Zorrabed IX - Moon 14 - Kador Family Academy"
  ],
  [
    60007987,
    10000052,
    "Zorrabed VII - Moon 19 - Ministry of War Archives"
  ],
  [
    60006952,
    10000052,
    "Zorrabed VII - Moon 26 - Inherent Implants Biotech Research Center"
  ],
  [
    60006949,
    10000052,
    "Zorrabed VII - Moon 4 - Inherent Implants Biotech Research Center"
  ],
  [
    60013399,
    10000041,
    "ZV-72W IX - Moon 1 - Intaki Commerce Trading Post"
  ],
  [
    60002533,
    10000041,
    "ZV-72W VII - Moon 8 - Expert Distribution Retail Center"
  ]
];

var region_ids = [
  [
    10000001,
    "Derelik"
  ],
  [
    10000002,
    "The Forge"
  ],
  [
    10000003,
    "Vale of the Silent"
  ],
  [
    10000004,
    "UUA-F4"
  ],
  [
    10000005,
    "Detorid"
  ],
  [
    10000006,
    "Wicked Creek"
  ],
  [
    10000007,
    "Cache"
  ],
  [
    10000008,
    "Scalding Pass"
  ],
  [
    10000009,
    "Insmother"
  ],
  [
    10000010,
    "Tribute"
  ],
  [
    10000011,
    "Great Wildlands"
  ],
  [
    10000012,
    "Curse"
  ],
  [
    10000013,
    "Malpais"
  ],
  [
    10000014,
    "Catch"
  ],
  [
    10000015,
    "Venal"
  ],
  [
    10000016,
    "Lonetrek"
  ],
  [
    10000017,
    "J7HZ-F"
  ],
  [
    10000018,
    "The Spire"
  ],
  [
    10000019,
    "A821-A"
  ],
  [
    10000020,
    "Tash-Murkon"
  ],
  [
    10000021,
    "Outer Passage"
  ],
  [
    10000022,
    "Stain"
  ],
  [
    10000023,
    "Pure Blind"
  ],
  [
    10000025,
    "Immensea"
  ],
  [
    10000027,
    "Etherium Reach"
  ],
  [
    10000028,
    "Molden Heath"
  ],
  [
    10000029,
    "Geminate"
  ],
  [
    10000030,
    "Heimatar"
  ],
  [
    10000031,
    "Impass"
  ],
  [
    10000032,
    "Sinq Laison"
  ],
  [
    10000033,
    "The Citadel"
  ],
  [
    10000034,
    "The Kalevala Expanse"
  ],
  [
    10000035,
    "Deklein"
  ],
  [
    10000036,
    "Devoid"
  ],
  [
    10000037,
    "Everyshore"
  ],
  [
    10000038,
    "The Bleak Lands"
  ],
  [
    10000039,
    "Esoteria"
  ],
  [
    10000040,
    "Oasa"
  ],
  [
    10000041,
    "Syndicate"
  ],
  [
    10000042,
    "Metropolis"
  ],
  [
    10000043,
    "Domain"
  ],
  [
    10000044,
    "Solitude"
  ],
  [
    10000045,
    "Tenal"
  ],
  [
    10000046,
    "Fade"
  ],
  [
    10000047,
    "Providence"
  ],
  [
    10000048,
    "Placid"
  ],
  [
    10000049,
    "Khanid"
  ],
  [
    10000050,
    "Querious"
  ],
  [
    10000051,
    "Cloud Ring"
  ],
  [
    10000052,
    "Kador"
  ],
  [
    10000053,
    "Cobalt Edge"
  ],
  [
    10000054,
    "Aridia"
  ],
  [
    10000055,
    "Branch"
  ],
  [
    10000056,
    "Feythabolis"
  ],
  [
    10000057,
    "Outer Ring"
  ],
  [
    10000058,
    "Fountain"
  ],
  [
    10000059,
    "Paragon Soul"
  ],
  [
    10000060,
    "Delve"
  ],
  [
    10000061,
    "Tenerifis"
  ],
  [
    10000062,
    "Omist"
  ],
  [
    10000063,
    "Period Basis"
  ],
  [
    10000064,
    "Essence"
  ],
  [
    10000065,
    "Kor-Azor"
  ],
  [
    10000066,
    "Perrigen Falls"
  ],
  [
    10000067,
    "Genesis"
  ],
  [
    10000068,
    "Verge Vendor"
  ],
  [
    10000069,
    "Black Rise"
  ]
];

