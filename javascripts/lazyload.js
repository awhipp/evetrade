
var successful = [];
var JITA = [10000002,60003760];
var AMARR = [10000043,60008494];
var DODIXIE = [10000032,60011866];
var RENS = [10000030,60004588];
var HEK = [10000042,60005686];

$('#dataTable').hide();
$("#loading").hide();
$("#more").hide();

var BOLD = "style='font-weight: bold;'";

function init(location){
   var station_buy, station_sell1, station_sell2, station_sell3, station_sell4;
   if(location === "Jita"){
      station_buy = JITA;
      station_sell1 = AMARR;
      station_sell2 = DODIXIE;
      station_sell3 = RENS;
      station_sell4 = HEK;
      $('#dataTable').append("<tr><td  " + BOLD + ">Item</td><td  " + BOLD + ">Buy at Jita</td><td  " + BOLD + ">Max Profit Per Item</td><td  " + BOLD + ">Sell at Amarr</td><td  " + BOLD + ">Sell at Dodixie</td><td  " + BOLD + ">Sell at Rens</td><td  " + BOLD + ">Sell at Hek</td></tr>")
   }else if(location === "Amarr"){
      station_buy = AMARR;
      station_sell1 = JITA;
      station_sell2 = DODIXIE;
      station_sell3 = RENS;
      station_sell4 = HEK;
      $('#dataTable').append("<tr><td  " + BOLD + ">Item</td><td  " + BOLD + ">Buy at Amarr</td><td  " + BOLD + ">Max Profit Per Item</td><td  " + BOLD + ">Sell at Jita</td><td  " + BOLD + ">Sell at Dodixie</td><td  " + BOLD + ">Sell at Rens</td><td  " + BOLD + ">Sell at Hek</td></tr>")
   }else if(location === "Dodixie"){
      station_buy = DODIXIE;
      station_sell1 = AMARR;
      station_sell2 = JITA;
      station_sell3 = RENS;
      station_sell4 = HEK;
      $('#dataTable').append("<tr><td  " + BOLD + ">Item</td><td  " + BOLD + ">Buy at Dodoxie</td><td  " + BOLD + ">Max Profit Per Item</td><td  " + BOLD + ">Sell at Amarr</td><td  " + BOLD + ">Sell at Jita</td><td  " + BOLD + ">Sell at Rens</td><td  " + BOLD + ">Sell at Hek</td></tr>")
   }else if(location === "Rens"){
      station_buy = RENS;
      station_sell1 = AMARR;
      station_sell2 = DODIXIE;
      station_sell3 = JITA;
      station_sell4 = HEK;
      $('#dataTable').append("<tr><td  " + BOLD + ">Item</td><td  " + BOLD + ">Buy at Rens</td><td  " + BOLD + ">Max Profit Per Item</td><td  " + BOLD + ">Sell at Amarr</td><td  " + BOLD + ">Sell at Dodixie</td><td  " + BOLD + ">Sell at Jita</td><td  " + BOLD + ">Sell at Hek</td></tr>")
   }else {
      station_buy = HEK;
      station_sell1 = AMARR;
      station_sell2 = DODIXIE;
      station_sell3 = RENS;
      station_sell4 = JITA;
      $('#dataTable').append("<tr><td  " + BOLD + ">Item</td><td  " + BOLD + ">Buy at Hekk</td><td  " + BOLD + ">Max Profit Per Item</td><td  " + BOLD + ">Sell at Amarr</td><td  " + BOLD + ">Sell at Dodixie</td><td  " + BOLD + ">Sell at Rens</td><td  " + BOLD + ">Sell at Jita</td></tr>")
   }


   //document.write(successful.join(", "));
   var itemIds = [34, 36, 35, 39, 38, 37, 40, 41, 45, 44, 43, 42, 178, 179, 180, 181, 184, 185, 187, 182, 183, 186,
      188, 190, 189, 192, 193, 191, 194, 197, 196, 195, 199, 198, 202, 201, 203, 204, 205,
      206, 207, 200, 208, 209, 210, 212, 211, 213, 215, 217, 216, 219, 218, 220, 221, 222,
      224, 223, 225, 226, 227, 228, 232, 230, 231, 229, 233, 234, 235, 237, 238, 236, 240,
      239, 241, 242, 243, 244, 245, 246, 247, 248, 250, 249, 251, 252, 253, 254, 255, 256,
      257, 259, 258, 260, 263, 261, 262, 264, 270, 267, 265, 269, 266, 377, 380, 393, 399,
      400, 394, 406, 405, 421, 434, 438, 442, 439, 444, 447, 448, 450, 453, 452, 454, 455,
      456, 443, 440, 457, 459, 458, 460, 461, 462, 463, 451, 482, 483, 484, 485, 487, 464,
      488, 490, 489, 491, 486, 492, 493, 496, 495, 494, 497, 501, 503, 499, 508, 509, 506,
      518, 520, 519, 522, 498, 521, 524, 523, 526, 529, 527, 530, 533, 561, 563, 564, 565,
      566, 567, 568, 570, 571, 572, 574, 562, 573, 575, 577, 581, 578, 580, 582, 584, 585,
      569, 587, 588, 590, 589, 591, 592, 593, 596, 597, 598, 599, 586, 600, 601, 603,
      602, 583, 605, 606, 607, 608, 609, 594, 613, 615, 617, 616, 620, 621, 614, 622, 623,
      624, 618, 619, 625, 626, 630, 627, 628, 629, 631, 632, 634, 635, 633, 639, 642, 638,
      640, 645, 648, 649, 650, 651, 654, 652, 653, 656, 641, 657, 643, 644, 655, 670, 671,
      672, 681, 683, 684, 687, 688, 685, 689, 690, 691, 692, 693, 682, 686, 784, 785, 786,
      788, 790, 803, 804, 806, 807, 805, 808, 809, 810, 813, 814, 812, 820, 819, 811, 822,
      821, 823, 825, 824, 826, 827, 830, 828, 831, 829, 832, 833, 835, 837, 836, 838, 834,
      839, 840, 842, 844, 841, 846, 845, 847, 843, 848, 879, 880, 881, 882, 883, 886, 885,
      887, 884, 889, 888, 890, 891, 892, 893, 894, 896, 897, 898, 895, 899, 900, 901, 902,
      936, 937, 935, 939, 940, 941, 943, 944, 938, 946, 945, 947, 949, 948, 950, 952, 953,
      954, 955, 956, 960, 961, 962, 963, 964, 965, 967, 968, 969, 970, 966, 971, 972, 975,
      974, 977, 976, 978, 979, 983, 985, 984, 986, 987, 990, 989, 991, 992, 994, 995, 996];

      getRows(itemIds, station_buy, station_sell1, station_sell2, station_sell3, station_sell4);
   }
