# EVE Trade Finder

A speghetti code SPA that gets the job done. The goal is to eventually move it over to react and rebuild it from the ground up.

[![Netlify Status](https://api.netlify.com/api/v1/badges/4daf6162-578e-4ff5-a99a-ab44e8cbdace/deploy-status)](https://app.netlify.com/sites/evetrade/deploys)

## About
Implements the [EVE ESI API](https://esi.tech.ccp.is/) to find:

* the best margins inside your own station.
* the best trades between stations.
* the best trades between systems.
* the best trades between regions.

### Requirements

The following are the base requirements to develop against this codebase.
They are split up amongst base package requirements and Jekyll plugins.

#### Base Packages
* [Ruby](https://www.ruby-lang.org/en/documentation/installation/)
* [RubyGems](https://rubygems.org/pages/download)
* [GCC](https://gcc.gnu.org/install/)
* [Make](https://www.gnu.org/software/make/)
* [Jekyll](https://jekyllrb.com/docs/installation/)

#### Jekyll Plugins
* [Minifier](https://github.com/digitalsparky/jekyll-minifier)
  - `gem install jekyll-minifier`


### Development and Deployment

The following explain the development guidelines and requirements.

#### Commands
  * To develop locally execute `jekyll serve` (ensure `JEKYLL_ENV=dev` -- you should be fine by default)
  * To kick off a Production build:
    - On Mac open any terminal: Run `JEKYLL_ENV=production jekyll build`
    - On Windows go into CMD Prompt: Run `set JEKYLL_ENV=production` and then `jekyll build`
    - **The production build must run production build command before committing as minify**

#### Development vs. Production Sites
  * The `master` branch deploys is the live hosted code
    - Automatically deploys to https://evetrade.space
    - Only `dev` can be merged into `master` so feature branches need to submit pull requests to `dev`.
  * `dev` is the development branch where all features will be merged first
    - Automatically deploys to https://dev.evetrade.space
    - New features added to `dev` will be tested extensively before merged into `master`
    - All feature branch pull requests are made to `dev`
