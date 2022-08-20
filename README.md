# EVE Trade Finder

## System Status

* UI Deployment Status on Netlify (on commit):
    * [![Netlify Status](https://api.netlify.com/api/v1/badges/4daf6162-578e-4ff5-a99a-ab44e8cbdace/deploy-status)](https://app.netlify.com/sites/evetrade/deploys)

* Static Data Asset Compilation (daily):
    * [![Convert SDE to JSON](https://github.com/awhipp/evetrade_resources/actions/workflows/download.yml/badge.svg)](https://github.com/awhipp/evetrade_resources/actions/workflows/download.yml)

* Historical Volume Redis Cache Ingestion (every 2 hours):
    * [![Synchronize Redis Cache (Historical Volume Data)](https://github.com/awhipp/evetrade_resources/actions/workflows/sync-volume-data.yml/badge.svg)](https://github.com/awhipp/evetrade_resources/actions/workflows/sync-volume-data.yml)

* Elasticsearch data and healthcheck (every 15-30 minutes): 
    * [![Data Ingestion Process](https://github.com/awhipp/evetrade_api/actions/workflows/check_data_sync.yml/badge.svg)](https://github.com/awhipp/evetrade_api/actions/workflows/check_data_sync.yml)

* Backend API healthcheck: 
    * [![API Service Check](https://github.com/awhipp/evetrade_api/actions/workflows/check_endpoints.yml/badge.svg)](https://github.com/awhipp/evetrade_api/actions/workflows/check_endpoints.yml)


## About
Implements the [EVE ESI API](https://esi.evetech.net/ui/) on the [backend](https://github.com/awhipp/evetrade_api) in order to find:

* the best trades within a station (ie: station trading or margin trading).
* the best hauling trades between stations and regions.

## Architecture Diagram

![EVETrade Architecture Diagram](/documentation/evetrade_architecture.png?raw=true "EVETrade Architecture Diagram")

## Other Repositories

* [EVETrade API](https://github.com/awhipp/evetrade_api)
* [EVETrade Resources](https://github.com/awhipp/evetrade_resources)
* [EVETrade Discord Bot](https://github.com/awhipp/evetrade_discord_bot)

## Recommended Development

* [Live Server](https://github.com/ritwickdey/vscode-live-server) or other tool required to build and serve locally to avoid CORs issues
* Other options include `jekyll`, `browsersync`, `http-server`, `npx serve` `python SimpleHTTPServer`, and more...