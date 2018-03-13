echo "Compressing Javascript..."
java -jar yui.jar ../js/route-calculator.js -o ../js/route-calculator.min.js
java -jar yui.jar ../js/init.js -o ../js/init.min.js

echo "Compressing Stylesheets..."
java -jar yui.jar ../css/styles.css -o ../css/styles.min.css
