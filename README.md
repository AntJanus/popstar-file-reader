[![Stories in Ready](https://badge.waffle.io/antjanus/popstar-file-reader.png?label=ready&title=Ready)](https://waffle.io/antjanus/popstar-cms)
![build status](https://travis-ci.org/AntJanus/popstar-file-reader.svg?branch=master) ![dependencies](https://david-dm.org/antjanus/popstar-file-reader.png) [![Coverage Status](https://coveralls.io/repos/AntJanus/popstar-file-reader/badge.png?branch=master)](https://coveralls.io/r/AntJanus/popstar-cms?branch=code-coverage)

Popstar File Reader
===================

The engine behind Popstar CMS - https://github.com/AntJanus/popstar-cms. After working on Popstar for months and months, and finally finding great utility in the file-reading engine whilst building [Proverbs App](http://proverbs-app.antjan.us) and [Jumbotron App](http://jumbotron.antjan.us/), I realized that the heart Popstar deserved its own package and ability to be used outside of the CMS.

Why? Because for both Proverbs and Jumbotron, I found myself removing views and changing up routes (in order to build a proper API feed) and using Public for a javascript front-end driven app rather than a back-end app. Doing so, however, meant that I no longer used Popstar as a dependency and could no longer update it! D= The horror!

Instead, I am splitting up Popstar CMS into Popstar File Reader (an NPM package with all the logic and tests), and a Yo generator that will (essentially) clone the Popstar CMS repo without `.git`.
