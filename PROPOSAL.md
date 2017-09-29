# CS 527 Project Proposal
## Twitter Stream Reader with Persistent Storage
#### Authors Matthew Zinke, Raymond Swannack

## Contents

* Introduction
* Technologies and Tools
* Modules
  * Twitter Stream Database
  * Twitter Stream Reader
  * REST Interface
  * HTML Web Client
* Delegation of Tasks
* Outstanding Questions to Consider

## Introduction

> 7. Twitter provides a fire hose of data. Automatically filtering, aggregating, analyzing such data can allow to harness the full vlue of the data, extracting valuable information. The idea of this project is to investigate stream processing technology to operate on social streams, or extract structure from them and store them in a database system.


Using twitter’s REST API we will fetch streams of tweets based on search criteria. These tweets will then be stored in a MySQL database. We will build a simple web interface for searching and displaying these tweets from the database.


## Technologies and Tools

- HTML5, Javascript (web client)
- Javascript (Node.js v8.x), npm  (server)
- npm packages: 
  - oauth -- required for twitter authorization
  - mysql -- required for database connection
- MySQL
- git
- Chrome
- Twitter


## Modules

### Twitter Stream Database
MySQL database will store tweets and stats (retweets, replies, likes)

**Database Schema**

* Table: TWEETS
(uid, date, userid (=USERS.id), tweet_text, likes, is_reply, reply_id, retweets)

* Table: USERS
(uid, username, location)

* Table: REPLIES
(uid, this_id (=TWEETS.uid), reply_id (=TWEETS.id))

* Table: HASHTAGS
(uid, hashtag (unique), num_tweets)?
(uid, hashtag (non unique)), tweet_id(=TWEETS.uid))?

* (Stretch) Table: FOLLOWS
(user_id (=USERS.uid), follower_id(=USERS.uid))

### Twitter Stream Reader
Node.js application will open connection to twitter stream, receive tweets, and store them to MySQL database. The stream reader will be able to filter out unwanted tweets so they are not recorded to the database. 

Some data may be uninteresting, unwanted, or too large. The stream reader may need to filter some tweets before committing to DB.

Some Example filters would be:
* Blacklist users (filter out users)
* Whitelist users (filter for certain users)
* Filter for keyword (contains/does not contain)
* Filter for hashtag (contains/does not contain)
* Location filters (within N miles of set location(s))


### Application Interface
**Rest Interface**
We will write a RESTful application server in Node.js to make tweet database contents available to other applications, mainly an HTML5 client application that will be served via HTTP. 

**HTML5 Client Application**
A client application will be developed to display calls to the REST interface and navigate the data.

**Proposed HTML Client Views**
* **Statistics View showing global statistics**
  * Total tweets seen
  * Number of unique hashtags
  * Performance statistics
  * Tweets per second/minute/hour
  * Bytes per second/minute/hour
* **Graph showing tweet frequency over time.** User should have the ability to filter tweets used to generate this graph
  * Use all data (no filter)
  * Filter for time period (start/end time)
  * Filter for user (all tweets for selected user)
  * Filter for hashtag (all tweets for selected hashtag)
  * Filter for keyword (keyword search on all data)
* **Most/least popular hashtags (top 100, bottom 100 etc)**
  * Time period
  * All data
  * Keyword search
  * By user
* **Most/least active users**
  * Time period
  * All data
  * Hashtag
  * Most followers
  * Most follows
* **Configuration Editor for editing the server configuration.**
  * Change filters on stream reader
  * Change stream query search terms
  

## Delegation of Tasks

 Database Schema -- Matthew, Raymond 
 
 Stream Reader -- Matthew 
 
 REST Interface (server) -- Matthew, Raymond 
 
 HTML5 webapp (client) -- Raymond 


## Outstanding Questions

1. How much data is there? Is it feasible to store every tweet or do tweets need to be filtered?
2. Are there other filters than the ones already identified that might be interesting?
3. How might we use like, retweet, and reply data?
4. Other stream readers?
  * Heron - https://github.com/twitter/heron
  * Apache Storm - http://storm.apache.org/
