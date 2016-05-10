#!/bin/bash

echo "Compressing Javascript..."
java -jar yui.jar ../javascripts/route-calculator.js -o ../javascripts/min/route-calculator.min.js
java -jar yui.jar ../javascripts/station-calculator.js -o ../javascripts/min/station-calculator.min.js
java -jar yui.jar ../javascripts/init.js -o ../javascripts/min/init.min.js

echo "Compressing Stylesheets..."
java -jar yui.jar ../stylesheets/styles.css -o ../stylesheets/min/styles.min.css
