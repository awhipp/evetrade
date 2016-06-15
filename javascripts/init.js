var JITA = [10000002,60003760];
var AMARR = [10000043,60008494];
var DODIXIE = [10000032,60011866];
var RENS = [10000030,60004588];
var HEK = [10000042,60005686];
var IGNORE = [-1,-1];

var NUMBER_RETURNED = 3;

var threshold_lower = 30;
var threshold_upper = 45;

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

var start_location = "";
var popup_table_buy;
var popup_table_sell;

var routeTrading = null;

var page = 1;
var has_shown = false;
var curr;

//var ENDPOINT = "https://public-crest.eveonline.com";
var ENDPOINT = "https://crest-tq.eveonline.com";

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
    $.ajax({
        type: "get",
        dataType: "json",
        url: ENDPOINT + "/market/types/?page=" + page,
        success: function(data){
            if(data && data.items){
                var items = shuffle(data.items);
                for(var i = 0; i < items.length; i ++){
                    itemIds.push(items[i].id);
                }
                page++;
                if(page == 3){
                    $("#loading").hide();
                    $("#selection").show();
                }
                if(data.next){
                    getMoreItems();
                }else if(page < 3){
                    $("#loading").hide();
                    $("#selection").show();
                }
            }
        },
        error: function (request, error) {
            getMoreItems();
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
        destinations = ["Jita","Amarr"];
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

    $("#numberInput").on('blur', updateNumber);
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
    $("#buyLocation").text("Buy at " + start_location);
    $("#sellLocation").text("Sell at " + location);
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
    $.each($(".end-selected"), function(){
        destinations.push($(this).val());
    });

    if(routeTrading == false){
        destinations = ["Jita", "Amarr"];
        if($("#lower-threshold").val().length > 0 && !isNaN($("#lower-threshold").val())){
            threshold_lower = parseInt($("#lower-threshold").val());
        }

        if($("#upper-threshold").val().length > 0 && !isNaN($("#upper-threshold").val())){
            threshold_upper = parseInt($("#upper-threshold").val());
        }
    }

    var add_jita = destinations.indexOf("Jita") > -1 ? true : false;
    var add_amarr = destinations.indexOf("Amarr") > -1 ? true : false;
    var add_dodixie = destinations.indexOf("Dodixie") > -1 ? true : false;
    var add_rens = destinations.indexOf("Rens") > -1 ? true : false;
    var add_hek = destinations.indexOf("Hek") > -1 ? true : false;

    if((destinations.indexOf(start_location) > -1 && destinations.length == 1)|| (destinations.length == 0 || start_location === "")){
        $(".error").show();
        return;
    }else{
        $(".error").hide();
        $("#selection").hide();
        $("#stop").show();
    }

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
    $("#title-banner").slideToggle();
    if(routeTrading){
        $('#dataTable').append("<thead><tr><th>Item</th><th>Buy Price</th><th>Total Cost</th><th>Buy Quantity</th><th>Sell At</th><th>Sell Quantity</th><th>Total Profit</th><th>R.O.I.</th><th>Sell Price</th><th>Profit Per Item</th></tr></thead>")
        $('#dataTable thead:last').after("<tbody id='tableBody'></tbody>");
        $("#buyingHeader").text("Buying from " + location);

        var including = "";
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
        if(including.length > 0){
            including = "( routes to " + including.substring(0,including.length-2) + " )";
        }
        $("#buyingFooter").html(including + "<br/>*Profit is not guaranteed. <span class='avoidwrap'>Use at your own risk. <span class='avoidwrap'>Verify in game that prices are accurate.</span></span><div class='loading'>Loading. Please wait...</div>");
        $("#buyingFooter").show();
        $("#buyingHeader").show();
        beginRoute(station_buy,station_sell1,station_sell2,station_sell3,station_sell4);
    }else{
        $("#buyingHeader").text("Station Trading at " + location);
        $("#buyingFooter").html("Margins between " + threshold_lower + " and " + threshold_upper + "<div class='loading'>Loading. Please wait...</div>");
        $("#buyingFooter").show();
        $("#buyingHeader").show();

        $('#dataTable').append("<thead><tr><th>Item</th><th>Buy Price</th><th>Sell Price</th><th>Profit Per Item</th><th>Margin</th></tr></thead>");
        $('#dataTable thead:last').after("<tbody id='tableBody'></tbody>");
        beginStation(station_buy);
    }



}
