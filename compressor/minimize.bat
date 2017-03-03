echo "Compressing Javascript..."
java -jar yui.jar ../javascripts/route-calculator.js -o ../javascripts/route-calculator.min.js
java -jar yui.jar ../javascripts/station-calculator.js -o ../javascripts/station-calculator.min.js
java -jar yui.jar ../javascripts/init.js -o ../javascripts/init.min.js

echo "Compressing Stylesheets..."
java -jar yui.jar ../stylesheets/styles.css -o ../stylesheets/styles.min.css
