# EVE Trade Finder

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
* [Last Modified](jekyll-last-modified-at)
  - `gem install jekyll-last-modified-at`

### Development and Deployment

The following explain the development guidelines and requirements.

#### Commands
  * To develop locally execute `jekyll serve`
  * To kick off a Production build execute `JEKYLL_ENV=production jekyll build`
    - This must run production build command before committing as minify
    and add the current date to the distribution

#### Development vs. Production Sites
  * `gh-pages` is the **"master"** branch
    - Automatically deploys to https://evetrade.space
    - Only `dev` can be merged into `gh-pages` so feature branches need to submit pull requests to `gh-pages`.
  * `dev` is the development branch where all features will be merged first
    - Automatically deploys to https://dev.evetrade.space
    - New features added to `dev` will be tested extensively before merged into `gh-pages`
    - All feature branch pull requests are made to `dev`
