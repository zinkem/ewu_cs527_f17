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

* ```npm install oauth```
* ```npm install mysql```

## Usage

Navigate to the repo root directory and type:

```node .```

This will start the twitter stream reader as well as the server for the HTML UI.
The default port is 8000. If run locally, connect to the server via http://localhost:8000/

