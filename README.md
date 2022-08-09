# EVE Trade Finder

## System Status

Application Deploy: [![Netlify Status](https://api.netlify.com/api/v1/badges/4daf6162-578e-4ff5-a99a-ab44e8cbdace/deploy-status)](https://app.netlify.com/sites/evetrade/deploys)

Database Resources: [![Convert SDE to JSON](https://github.com/awhipp/evetrade_resources/actions/workflows/download.yml/badge.svg)](https://github.com/awhipp/evetrade_resources/actions/workflows/download.yml)

Elasticsearch Ingestion: [![Data Ingestion Process](https://github.com/awhipp/evetrade_api/actions/workflows/check_data_sync.yml/badge.svg)](https://github.com/awhipp/evetrade_api/actions/workflows/check_data_sync.yml)

Redis Cache Status: [![Synchronize Redis Cache](https://github.com/awhipp/evetrade_resources/actions/workflows/redis-push.yml/badge.svg)](https://github.com/awhipp/evetrade_resources/actions/workflows/redis-push.yml)

API Status: [![API Service Check](https://github.com/awhipp/evetrade_api/actions/workflows/check_endpoints.yml/badge.svg)](https://github.com/awhipp/evetrade_api/actions/workflows/check_endpoints.yml)


## About
Implements the [EVE ESI API](https://esi.tech.ccp.is/) on the [backend](https://github.com/awhipp/evetrade_api) in order to find:

* the best margins inside your own station.
* the best trades between stations.
* the best trades between systems.
* the best trades between regions.

### Recommended Development

* [Live Server](https://github.com/ritwickdey/vscode-live-server) or other tool required to build and serve locally to avoid CORs issues
* Other options include `jekyll`, `browsersync`, `http-server`, `npx serve` `python SimpleHTTPServer`, and more...