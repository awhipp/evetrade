# EVE Trade 

The top-searched EVE Online trading tool that lets you discover what to trade between stations and regions. This tool enables making ISK through hauling or station trading.

## Support

[![EVETrade Discord Server](https://discordapp.com/api/guilds/999342296522821722/widget.png?style=banner2)](https://discord.gg/9xZh5qKCeR)

## System Status

* UI Deployment Status on Netlify (on commit):
  * [![Netlify Status](https://api.netlify.com/api/v1/badges/4daf6162-578e-4ff5-a99a-ab44e8cbdace/deploy-status)](https://app.netlify.com/sites/evetrade/deploys)

* Static Data Asset Compilation (daily):
  * [![Convert SDE to JSON](https://github.com/awhipp/evetrade_resources/actions/workflows/download.yml/badge.svg)](https://github.com/awhipp/evetrade_resources/actions/workflows/download.yml)

* Historical Market Volume Pull (every hour):
  * [![Historical Volume Ingest](https://github.com/awhipp/evetrade_historical_volume/actions/workflows/historical-volume-ingest.yml/badge.svg)](https://github.com/awhipp/evetrade_historical_volume/actions/workflows/historical-volume-ingest.yml)

* Market Data Ingestion (Every 5 min)
  * [![Check Data Sync](https://github.com/awhipp/evetrade-data-sync-service/actions/workflows/check.yml/badge.svg)](https://github.com/awhipp/evetrade-data-sync-service/actions/workflows/check.yml)
 
* API Deployments
  * [![EVETrade API Deploy - Dev](https://github.com/awhipp/evetrade_api/actions/workflows/evetrade_deploy_dev.yml/badge.svg)](https://github.com/awhipp/evetrade_api/actions/workflows/evetrade_deploy_dev.yml)
  * [![EVETrade API Deploy - Prod](https://github.com/awhipp/evetrade_api/actions/workflows/evetrade_deploy_prod.yml/badge.svg)](https://github.com/awhipp/evetrade_api/actions/workflows/evetrade_deploy_prod.yml)

## About

Implements the [EVE ESI API](https://esi.evetech.net/ui/) on the [backend](https://github.com/awhipp/evetrade_api) in order to find:

* the best trades within a station (ie: station trading or margin trading).
* the best hauling trades between stations and regions.

## Architecture Diagram

![EVETrade Architecture Diagram](/documentation/evetrade_architecture.png?raw=true "EVETrade Architecture Diagram")

## Other Repositories

* [EVETrade API](https://github.com/awhipp/evetrade_api)
* [EVETrade Market Data Sync](https://github.com/awhipp/evetrade-data-sync-service)
* [EVETrade Resources](https://github.com/awhipp/evetrade_resources)
* [EVETrade Historical Volume Ingest](https://github.com/awhipp/evetrade_historical_volume)

## Recommended Development

* [Live Server](https://github.com/ritwickdey/vscode-live-server) or other tool required to build and serve locally to avoid CORs issues
* Other options include `jekyll`, `browsersync`, `http-server`, `npx serve` `python SimpleHTTPServer`, and more...
