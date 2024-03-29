# ewu_cs527_f17
## Project Repository for CS527, Modern Database Systems

###### Author: Matt Zinke <mzinke@eagles.ewu.net>
###### Author: Raymond Swannack

## Introduction

A stream reader for Twitters sample and filter streams.

This sofwtare will connect to Twitter's streaming API endpoint and recieve, record, and categorize tweet data.

## Requirements

* Node.js v8.x
* MySQL 5.7

Requires oauth and mysql npm modules. Navigate to the repo root directory and enter the following commands:

* ```$ npm install oauth```
* ```$ npm install mysql```

## First Time Setup

Run mysql and Create a MySQL User Ex:

```
mysql> GRANT ALL PRIVILEGES ON *.* TO 'cs527'@'%' IDENTIFIED BY 'megaman4';
```

To initialize the DB, Navigate to repo root directory and type:

```
$ cd bin
$ ./init_mysql.sh
```

Populate myconfig with Twitter credentials:

First you will need to create Twitter app credentials here: 
https://apps.twitter.com/

Once you have created an access token and consumer key, enter them into myconfig

From repo root:

```
cd lib
cp myconfig.example myconfig
```

Open myconfig in a text editor, populate this object with auth values for the Twitter app. 

## Usage

Navigate to the repo root directory and type:

```node .```

This will start the twitter stream reader as well as the server for the HTML UI.
The default port is 8000. If run locally, connect to the server via http://localhost:8000/

