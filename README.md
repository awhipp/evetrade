# EVE Trade Finder

Application Deploy: [![Netlify Status](https://api.netlify.com/api/v1/badges/4daf6162-578e-4ff5-a99a-ab44e8cbdace/deploy-status)](https://app.netlify.com/sites/evetrade/deploys)

Database Resources: [![Convert SDE to JSON](https://github.com/awhipp/evetrade_resources/actions/workflows/download.yml/badge.svg)](https://github.com/awhipp/evetrade_resources/actions/workflows/download.yml)

## About
Implements the [EVE ESI API](https://esi.tech.ccp.is/) on the [backend](https://github.com/awhipp/evetrade_api) in order to find:

* the best margins inside your own station.
* the best trades between stations.
* the best trades between systems.
* the best trades between regions.

### Recommended Development

* [Live Server](https://github.com/ritwickdey/vscode-live-server) or other tool required to build and serve locally to avoid CORs issues
* Other options include `jekyll`, `browsersync`, `http-server`, `npx serve` `python SimpleHTTPServer`, and more...