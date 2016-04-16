# Crest Trade Finder v1.1.3

## About
Implements the EVE Crest API to find the best trades between the major trade hubs.
Select which of the 5 trade hubs you are docked in:
* Amarr
* Dodixie
* Rens
* Hek
* Jita

It will return a lazyloaded table of trades you can make at other trade hubs. Allows table sorting on any of the fields to see what items are selling at your hub for a low price and can be sold at another hub for a higher price.

## Minor Updates
### v1.1.3
* Improved breakpoints for text and buttons on smaller screens
* Updated color scheme
* Moved CSS away from JS into CSS
* Updated footer
* Added stop functionality to stop loading if the user does not wish to continue
* If same destination and start point occurs it throws an error
* Unhighlights destination if start location is selected

### v1.1.2
* Buy Cost was not being calculated properly

### v1.1.1
* Update no longer returns just the top trade for all 3 slots
* Update graphic now just changes opacity. Less intrusive.
* Update now removes any lingering updates if not updated in 25 seconds.
* Algorithm was not always returning the most profitable runs  if runs > 3
* CTRL or SHIFT available to select all of an item type

## Functionality Update v1.1.0
* Minified CSS and Javascript to improve performance
* Addition of multiple orders (up to top 3 for an item)
* Buy/Sell quantity columns added with highlighted recommendation
* Highlighting capabilities improved. Highlight one or multiple.
* Right-click to update the item.
* Updated UI to include start location, and end location(s) to reduce calls to hubs you are not intending to go
* Updated UI to better fit on smaller screens


Copyright © 2016 Alexander Whipp
