# EVE Trade Finder

## About
Implements the EVE ESI API to find:

* the best margins inside your own station.
* the best trades between stations.
* the best trades between systems.
* the best trades between regions.

## Requirements

The following are the base requirements to develop against this codebase. They are split up amongst base package requirements and Jekyll plugins.

### Base Packages

* [Ruby](https://www.ruby-lang.org/en/documentation/installation/)
* [RubyGems](https://rubygems.org/pages/download)
* [GCC](https://gcc.gnu.org/install/)
* [Make](https://www.gnu.org/software/make/)
* [Jekyll](https://jekyllrb.com/docs/installation/)

### Jekyll Plugins

* [Minifier](https://github.com/digitalsparky/jekyll-minifier) via `gem install jekyll-minifier`
* [Last Modified](jekyll-last-modified-at) via `gem install jekyll-last-modified-at`

## Development

* Deployment: `jekyll serve`
* Production Build: `JEKYLL_ENV=production jekyll build`
  - Must run production build command before committing
