# EVE Trade Finder v5.0

## About
Implements the EVE ESI API to find:

* the best trades between stations.
* the best trades between regions.
* the best margins inside your own station.

Select which of the station you are docked in. It will return a lazy-loaded table of trades you can make at other station. Allows table sorting on any of the fields to see what items are selling at your hub for a low price and can be sold at another hub for a higher price.

## V5.0
    * Complete back and front end refactoring to promote future feature viability.
    * Revised frontend for a better user experience.
    * Improved performance and results.
    * Introducing region to region trade finding.

## V4.X
    * Minor performance gains due to refactoring 3-year old code.
    * Allow users to refresh the table with the last query they submitted.
    * Added user analytics when selecting different options to better track user perferences and prioritize bugs.
    * If an endpoint fails that many times that means its probably not up.
    * Improved number of results for station trading
    * Numbers were flipped for buy and sell orders
    * Probably the biggest request of the server has finally been added. You may now station trade and filter by the current daily volume.
    * Bug fixes for firefox where backspace would not work
    * Bug fixes for safari where you could not use margin
    * In light of EVE Crest being shutdown soon. The entire website is now ESI compliant.
    * Also reduced amount of network traffic required.
    * Fixed a bug where the best price was not actually returned.
    * Users were being confused with the sell/buy terminology so it now reads whether you are looking at the buy orders or the sell orders
    * Announce when EVE servers are not connecting properly
    * Able to export the tables to CSV, Excel, or PDF
    * Able to print or copy to clipboard as well
    * Due to popular demand and crowdsourced requests we have overhauled the theme and overall look of the website
    * We have added filtering to the table to enable users to filter on station, item, or any other text within the table
    * Correctly calculates the weight. It used to be per item rather than the total weight. Thanks to Nikolay for this report.
    * Cut down load times to seconds instead of minutes (instead of 7 minutes)
    * Currently only applies to Route trading (Station trading overhaul to come but its still pretty fast)
    * No longer show scams (filters by min volume required = 1)
    * Updating rows currently disabled
    * Restricted to 25 stations in custom route trading instead of 10.
    * Slightly updated UI

## V3.X
    * Allow for decimals to be entered
    * Fixed bug where backspacing on input dialogues for specific browsers would not work.
    * Minimize time spent editing forms
    * Downside is that ship weights retrieved by the API are unpackaged weights
    * You may now select up to 10 destination stations for trade routes
    * Station trading was broken
    * Modified requests to abide by rate limit
    * Improved return performance.
    * Simplified request calls to enable future development of cross region trading
    * Progress Bar
    * Due to popular demand we have now implemented a 1-to-1 trading drop down for finding the best deals between two stations
    * Also added custom select station trading
    * These features is in BETA as the EVE CREST API does not currently support getting all these stations so we are working off of a fixed backend, please report any bugs you find

## V2.X
    * Ability to filter profits to show only rows where ISK is greater than N on route trades
    * Ability to filter ROI to show only rows where ROI % is greater than M on route trades
    * Ability to filter Buy Cost to show only rows where Cost is less than O on route trades
    * Fixed a bug with station trading where it shows the wrong station's information
    * Updated UI to appear a little more clean
    * Now by shift + clicking a header row you are able to sort on additional properties.
    * Added a Release Notes page
    * Easier to select intro button
    * Added description of each selector
    * Removed minified files as they are minified automatically on the server
    * Updated wording and about pages to be more concise
    * Added designed and developed by fields
    * Route changed to https://crest-tq.eveonline.com/market/{ID}/orders/sell/?type=https://crest-tq.eveonline.com**/INVENTORY**/types/{TYPE}/
    * Addition of filtering of columns with preset columns to make tables a little more mobile responsive on small width screens.
    * Added functionality for margin trading within a station

## V1.X
    * Allows user to view all active orders - buy and sell for a specific item on shift + click
    * Only ctrl + click selects all now
    * Updates algorithm to return better profit results
    * Lazy load the item IDs from EVE's API and shuffles them
    * Added YUI Compressor and Scripts to automatically created and deposit minimized code to proper directories
    * Improved Trade info layout to use bootstrap columns
    * Removed unused log statements
    * Trade info sets to fixed decimals to improve sorting
    * Made error messages more hospitable and do not show up multiple times
    * Updated endpoint to not receive CORS as frequently
    * Minified CSS and Javascript to improve performance
    * Addition of multiple orders (up to top 3 for an item)
    * Buy/Sell quantity columns added with highlighted recommendation
    * Highlighting capabilities improved. Highlight one or multiple.
    * Right-click to update the item.
    * Updated UI to include start location, and end location(s) to reduce calls to hubs you are not intending to go
    * Updated UI to better fit on smaller screens
    * Stop button updates and provides feedback
    * Moved init.js to the top through an on document ready function
    * Added an unreachable notification if EVE's servers are down
    * Moved to AJAX call structure rather than simple Jquery GET
    * Updated number returned to between 1-10
    * Moved all minified JS to one file
    * Improved breakpoints for text and buttons on smaller screens
    * Updated color scheme
    * Moved CSS away from JS into CSS
    * Updated footer
    * Added stop functionality to stop loading if the user does not wish to continue
    * If same destination and start point occurs it throws an error
    * Unhighlights destination if start location is selected
    * Buy Cost was not being calculated properly
    * Update no longer returns just the top trade for all 3 slots
    * Update graphic now just changes opacity. Less intrusive.
    * Update now removes any lingering updates if not updated in 25 seconds.
    * Algorithm was not always returning the most profitable runs  if runs > 3
    * CTRL or SHIFT available to select all of an item type

Copyright © 2016-2017 Alexander Whipp
