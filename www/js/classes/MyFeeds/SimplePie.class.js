/**
 * Copyright 2015 Thierry BUGEAT
 * 
 * This file is part of myFeeds.
 * 
 * myFeeds is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * myFeeds is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with myFeeds.  If not, see <http://www.gnu.org/licenses/>.
 */

/* ======================= */
/* --- SimplePie Class --- */
/* ======================= */

var SimplePie = function() {
    
    //MyFeeds.call(this); /* Appel du constructeur de la classe parente */

    this.gf = {
        "output"        : "json",                                                   // Output format: json, xml, json_xml
        "num"           : 4,                                                        // Number of news to read
        "url"           : "",                                                       // Encoded feed url
        "key"           : "notsupplied",                                            // Google API key
        "v"             : "1.0" ,                                                   // Google API version
        "scoring"       : "h",                                                      // Include historical entries
        "servers"       : [
            {"id": 0, "name": "SimplePie @ Amazon EC2",     "url": "http://54.229.143.103/simplepie/" }, 
            {"id": 1, "name": "SimplePie @ OVH",            "url": "http://quiksiivjq.cluster002.ovh.net/simplepie/" },
            {"id": 2, "name": "SimplePie @ Home eeepc701",  "url": "http://thierry.bugeat.com/simplepie/" }
        ],
        "serverId"      : 0,
        "method"        : "GET"
    };
    
    this.myFeedsSubscriptions = [];
    this.gf_sortedEntries = [];
    this.sortedFeeds = [];
    this.gf_unsortedEntries = [];
    this.gf_mySha256 = [];              // Store sha256 sum for each news(entry), based on _entry.feedId + _entry.link
    this.unsortedFeeds = [];
    this.nbFeedsLoaded = 0;
    this.timestampMax = 0;              // Timestamp of most recent news.
    this.timestampMin = 0;              // Timestamp of beginning of day.
    this.firstSync = true;
    this.currentSynchroTimestamp = 0;   // Timestamp of current synchro.

    _SimplePie = this;
}
SimplePie.prototype = new MyFeeds();

/* ================ */
/* --- Methodes --- */
/* ================ */

SimplePie.prototype.getVersion         = function()        { return this.gf.version;       }
SimplePie.prototype.getOuput           = function()        { return this.gf.output;        }
SimplePie.prototype.getNum             = function()        { return this.gf.num;           }
SimplePie.prototype.getEntries         = function()        { this._sortEntries();  return this.gf_sortedEntries;   }
SimplePie.prototype.getFeeds           = function()        { this._sortFeeds();    return this.sortedFeeds;        }
SimplePie.prototype.getNbFeedsLoaded   = function()        { return this.nbFeedsLoaded;    }
SimplePie.prototype.getServers         = function()        { return this.gf.servers;       }
SimplePie.prototype.getServerId        = function()        { return this.gf.serverId;      }
SimplePie.prototype.setServerId        = function(serverId){ this.gf.serverId = serverId;  }

SimplePie.prototype._setUrl            = function(url)     { this.gf.url = url;            }

SimplePie.prototype._sortEntries       = function() {
    
    // Sort entries by "_myTimestampInMs" 
    
    // =============================================
    // --- Sort using javascript "sort" function ---
    // =============================================
    // Doesn't works !!!
    
    /*this.gf_sortedEntries = this.gf_unsortedEntries;
    
    this.gf_sortedEntries.sort(function(a, b){
        return a._myTimestamp - b._myTimestamp
    });
    
    this.gf_sortedEntries.reverse();
    
    _MyFeeds.log(this.gf_sortedEntries);*/
    
    // ==========================================
    // --- Sort using "underscore.js" library ---
    // ==========================================
    // Doesn't works.
    
    //this.gf_sortedEntries = (_.sortBy(this.gf_unsortedEntries, '_myTimestamp')).reverse();        // Doesn't works !!!
    //this.gf_sortedEntries = (_.sortBy(this.gf_unsortedEntries, '_myTimestampInMs')).reverse();    // Doesn't works !!!
    
    // ===================
    // --- My own sort ---
    // ===================
    // Works only if publications dates are UNIQUES.
    //
    // See function "addEntries" below.
    // In this function for values "_myTimestampInMs" I add a random 
    // number between 0 & 500. (I add 0 to 0.5 seconde)
    
    this.gf_sortedEntries = {};
    var _tmp = []; // It will contain all timestamps in ms.
    
    for (var i = 0; i < this.gf_unsortedEntries.length; i++) {
        _tmp.push(this.gf_unsortedEntries[i]._myTimestampInMs);
    }
    
    _tmp.sort().reverse();
    
    for (var i = 0; i < _tmp.length; i++) {

        for (var j = 0; j < this.gf_unsortedEntries.length; j++) {
            if (_tmp[i] == this.gf_unsortedEntries[j]._myTimestampInMs) {
                this.gf_sortedEntries[(this.gf_unsortedEntries[j]._myTimestampInMs)] = this.gf_unsortedEntries[j];
                break;
            }
        }
    }

    _MyFeeds.log('_sortEntries()', this.gf_sortedEntries);
    _MyFeeds.log(this.gf_sortedEntries);
}

/**
 * Sort feeds
 * @param {null}
 * @returns {null}
 */
SimplePie.prototype._sortFeeds = function() { 
    this.sortedFeeds = this.unsortedFeeds;
    this.sortedFeeds.sort(function(a, b){ return b.title < a.title });
}

/**
 * Set num
 * @param {int} num - Number of entries to download
 * @returns {null}
 */
SimplePie.prototype._setNum = function(num) { 
    if (num == "Infinity") {
        this.gf.num = 1;
        _MyFeeds.warn("_setNum : incorrect value " + num + " => Set to 1");
    } else if (isNaN(num) || !Number.isInteger(num)) {
        this.gf.num = 20;
        _MyFeeds.warn("_setNum : incorrect value " + num + " => Set to 20");
    } else {
        this.gf.num = num;
    }
}

/**
 * 
 * @param {array} myFeedsSubscriptions
 * @returns {null}
 */
SimplePie.prototype.setFeedsSubscriptions = function(myFeedsSubscriptions) { 
    _MyFeeds.log('SimplePie.prototype.setFeedsSubscriptions()', arguments);
    
    var _tmp = [];
    
    for (var _account in myFeedsSubscriptions) {
        for (var i = 0 ; i < myFeedsSubscriptions[_account].length ; i++) {
            myFeedsSubscriptions[_account][i].account = _account;
            _tmp.push(myFeedsSubscriptions[_account][i]);
        }
    }
    
    this.myFeedsSubscriptions = _tmp;
}

SimplePie.prototype.setNbFeedsLoaded = function() { 
    this.nbFeedsLoaded++; 
}

/** 
 * addEntries
 * Entries (news) are added by feed.
 * Feeds are loaded randomly.
 * Entries are added once ONE feed has been downloaded.
 * @param {object} entries
 * @return {null}
 */
SimplePie.prototype.addEntries = function(entries) {
    var start = performance.now();
    _MyFeeds.log('SimplePie.prototype.addEntries', arguments);
    
    var _nb = entries.length;
    
    this._setTimestampMin(); // Store timestamp of beginning of day.
    
    for (var i = 0; i < _nb; i++) {
        var _entry = entries[i];
        
        _entry['_mySha256_title']       = (_entry['_myFeedInformations']['feed']['_myFeedId'] + _entry['title']).toString().toLowerCase();
        _entry['_mySha256_link']        = (_entry['_myFeedInformations']['feed']['_myFeedId'] + _entry['link']).toString().toLowerCase();
        //_entry['_mySha256_title']       = btoa(encodeURI(_entry['_myFeedInformations']['_myFeedId'] + _entry['title'])).toString();
        //_entry['_mySha256_link']        = btoa(_entry['_myFeedInformations']['_myFeedId'] + _entry['link']).toString();

        if (this.gf_mySha256.contains(_entry['_mySha256_link'])) {
            // Old news same link: Do nothing.
        } else if (this.gf_mySha256.contains(_entry['_mySha256_title'])) {
            // Old news same title: Do nothing.
        } else {
            // New entry.
            // Detect & update bad images urls in content
            // Transform '<img src="//...' to '<img src="http://...'
            
            _entry.content = _entry.content.replace(/src="\/\//g, 'src="http:\/\/');
            
            // 1st image extraction from enclosure or content
            
            _entry['_myFirstImageUrl'] = "";
        
            var _results    = [];
            var _imageUrl   = '';
            var _regex      = /<img[^>]+src="(http(|s):\/\/[^">]+(?!gif))/g;

            _results    = _regex.exec(_entry.content);
            
            if ((typeof _entry.enclosure !== 'undefined') && (_entry.enclosure.link)) {
                _entry['_myFirstImageUrl'] = _entry.enclosure.link;
            } else if ((_results !== null) && (Boolean(_results[1]))) { 
                _entry['_myFirstImageUrl'] = _results[1];
            }

            // Add custom values

            // To have an unique timestamp in "ms" for each entry (news),
            // I had a random value between 0 and 500 (+0 to +0.5sec).
            
            var _date = new Date(_entry.publishedDate);

            _entry['_myTimestamp']          = Math.round(_date.getTime()/1000);
            _entry['_myTimestampInMs']      = Math.round(_date.getTime()) + Math.floor(Math.random()*500);

            _entry['_myLocalizedDate']      = ""; // Due to severe performances issues dates are generated later
            _entry['_myLocalizedTime']      = ""; // Due to severe performances issues times are generated later
        
            // Don't keep entries in the future.
            // Keep only entries before now (Current timestamp).
            
            if (_entry['_myTimestamp'] < this.currentSynchroTimestamp) {
                
                // Timestamp correction for very old news.
                // (Before timestamp of most recent news in previous synchro).
                // Maybe a network issue or feed was outdated during previous synchro.
                // @todo : => Align published date on new timestamp.
                
                if ((!this.firstSync) && (_entry['_myTimestamp'] <= this.timestampMax) && (_entry['_myTimestamp'] >= this.timestampMin)) {
                    _MyFeeds.log('SimplePie.prototype.addEntries : ' + this.timestampMin + ' < ' + _entry['_myTimestamp'] + ' < ' + this.timestampMax + ' : ' + _entry.title);
                    _entry['_myTimestamp'] = (this.timestampMax) + 1;
                    _entry['_myTimestampInMs'] = ((this.timestampMax + 1)*1000) + Math.floor(Math.random()*500);
                } 

                // Keep entry

                this.gf_mySha256.push(_entry['_mySha256_link']);
                this.gf_mySha256.push(_entry['_mySha256_title']);
                this.gf_unsortedEntries.push(_entry);
            }
        }
    }
    
    // All feeds has been loaded
    
    if (this.getNbFeedsLoaded() == this.myFeedsSubscriptions.length) {
        this.firstSync = false; // Change 1st sync status 
        this._setTimestampMax(); // Store timestamp of most recent entry.
    }
    
    _MyFeeds.log(this.gf_mySha256);
    _MyFeeds.log('SimplePie.prototype.addEntries : ' + this.gf_unsortedEntries.length + ' entrie(s)');
    
    var end = performance.now();
    _MyFeeds.log("SimplePie.prototype.addEntries() " + (end - start) + " milliseconds.");
}

/**
 * Delete entries for specified account & feed
 * @param {string} account - "local", "feedly", "theoldreader"...
 * @param {string} feedId - Feed ID or empty value "" for all feeds
 * @return {null}
 */
SimplePie.prototype.deleteEntries = function(account, feedId) {
    _MyFeeds.log('deleteEntries(' + account + ', ' + feedId + ')');
    
    var start = performance.now();

    var _tmp = [];
    var _tmpSha256 = [];
    
    for (var i = 0; i < this.gf_unsortedEntries.length; i++) {
        if (((this.gf_unsortedEntries[i]['_myFeedInformations']['_myAccount'] == account)
            && (this.gf_unsortedEntries[i]['_myFeedInformations']['_myFeedId'] == feedId))
            || ((feedId == "") && (this.gf_unsortedEntries[i]['_myFeedInformations']['_myAccount'] == account))
        ){
            // Don't keep this entry.
        } else {
            _tmp.push(this.gf_unsortedEntries[i]);
            _tmpSha256.push(this.gf_unsortedEntries[i]['_mySha256_link']);
            _tmpSha256.push(this.gf_unsortedEntries[i]['_mySha256_title']);
        }
    }
    
    this.gf_unsortedEntries = _tmp;
    this.gf_mySha256 = _tmpSha256;
    
    var end = performance.now();
    _MyFeeds.log("deleteEntries() " + (end - start) + " milliseconds.");
}

/**
 * Delete entries older than specified timestamp
 * @param {int} timestamp 
 * @return {null}
 * */
 
SimplePie.prototype.deleteOldEntries = function(timestamp) {
    _MyFeeds.log('deleteOldEntries(' + timestamp + ')');
    
    var date = new Date(timestamp * 1000);
    var dateTimeString = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2) + ' ' + ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
    
    _MyFeeds.log('deleteOldEntries(' + dateTimeString + ') => ' + this.gf_unsortedEntries.length + ' entrie(s)');
    

    var _tmp = [];
    var _oldEntries = 0;
    
    for (var i = 0; i < this.gf_unsortedEntries.length; i++) {
        if (this.gf_unsortedEntries[i]['_myTimestamp'] > timestamp) {
            _tmp.push(this.gf_unsortedEntries[i]);
        } else {
            _oldEntries++ ;
        }
    }
    
    this.gf_unsortedEntries = _tmp;
    
    _MyFeeds.log('deleteOldEntries(' + timestamp + ') => ' + _oldEntries + ' old entrie(s) has been deleted');
}

SimplePie.prototype.addFeed = function(feed) {
    var start = performance.now();
    //_MyFeeds.group('SimplePie.prototype.addFeed()', feed.title);
    _MyFeeds.log('SimplePie.prototype.addFeed()', feed);
    //_MyFeeds.log('SimplePie.prototype.addFeed()', feed.entries);
    //console.groupEnd();

    var _myNewfeed = feed;
    var _myNewEntries = feed.entries;
    var _lastUpdateTimestamp = 0;
    
    // Add feed informations to each entry
    
    for (var i = 0; i < _myNewEntries.length; i++) {
        _myNewEntries[i]._myFeedInformations = feed;
        delete _myNewEntries[i]._myFeedInformations.entries;
    }

    // Add custom values.
 
    // Pulsations ?
    
    var _timestamps = [];
    var _timestamp = 0;
    
    for (var i = 0; i < _myNewEntries.length; i++) {
        _timestamp = Math.round(new Date(_myNewEntries[i].publishedDate).getTime() / 1000);
        _timestamps.push(_timestamp);
        if ((_lastUpdateTimestamp < _timestamp)
            && (((params.entries.displaySmallEntries == false) && (!_MyFeeds.isSmallEntry(_myNewEntries[i])))
                || (params.entries.displaySmallEntries == true))
        ){
            _lastUpdateTimestamp = _timestamp;
        }
    }
    
    // !!! COUNT BELOW IS ONLY FROM FEED !!!
    // This count does not consider entries already in cache.
    // @todo : Don't count news in the future (Between "now" and "23:59:59")
    //         Replace "liveValues.timestamps.max" below
    
    _myNewfeed['_myNbEntries'] = 0;
    
    for (var i = 0; i < _timestamps.length; i++) {
        if ((_timestamps[i] > liveValues.timestamps.min) && (_timestamps[i] < liveValues.timestamps.max)) {
            _myNewfeed['_myNbEntries'] += 1;
        }
    }
    
    // DOM id

    _myNewfeed['_myDomId'] = btoa(_myNewfeed.feed._myAccount + _myNewfeed.feed._myFeedId);

    // ---
    
    var _timestampMin = Math.min.apply(Math, _timestamps);
    var _timestampMax = Math.max.apply(Math, _timestamps);
    
    _MyFeeds.log(feed.feedUrl+' ('+liveValues.timestamps.min+') Timestamps : ', _timestamps);

    var _myPulsations = (_myNewfeed['_myNbEntries'] / params.entries.dontDisplayEntriesOlderThan).toFixed(2);
    
    _myNewfeed['_myPulsations'] = _myPulsations; // Estimation of news number per day

    _myNewfeed['_myPulsationsIcone'] = this.getIconPulsations(_myPulsations);
    
    // /!\ The 3 following values are false. Entries are not sorted by dates.
    
    var _date = new Date(_lastUpdateTimestamp * 1000);
    
    _myNewfeed['_myLastPublishedDate']  = _date.toLocaleString(userLocale);
    _myNewfeed['_myLastTimestamp']      = _lastUpdateTimestamp;
    _myNewfeed['_myLastTimestampInMs']  = _lastUpdateTimestamp;
    
    // Remove values.
    
    delete _myNewfeed.entries;
    
    // Add entries.
    
    this.addEntries(_myNewEntries);
    
    // Store feed
    
    this.unsortedFeeds.push(_myNewfeed);
    
    // ---
    
    var end = performance.now();
    _MyFeeds.log("addFeed() " + (end - start) + " milliseconds.");
}

/**
 * Get icon for feed strength
 * @param (int) _myPulsations
 * */
SimplePie.prototype.getIconPulsations = function(_myPulsations) {
    var _icon = 'signal-0';
    
    if      (isNaN(_myPulsations))  { _icon = 'signal-0'; }
    else if (_myPulsations > 15)    { _icon = 'wifi-4'; }
    else if (_myPulsations > 8 )    { _icon = 'wifi-3'; }
    else if (_myPulsations > 3 )    { _icon = 'wifi-2'; }
    else if (_myPulsations > 0 )    { _icon = 'wifi-1'; }
    else                            { _icon = 'signal-0'; }
    
    return _icon;
} 

/**
 * Load all feeds
 * @param {int} nbDaysToLoad Limit loading to N days.
 * */
 
SimplePie.prototype.loadFeeds = function(nbDaysToLoad) {
    
    _MyFeeds.log('SimplePie.prototype.loadFeeds()', this.myFeedsSubscriptions);

    this.currentSynchroTimestamp = Math.floor(Date.now() / 1000);
    this.nbFeedsLoaded = 0;
    this.unsortedFeeds = [];

    if (this.myFeedsSubscriptions.length > 0) {
        for (var i = 0; i < this.myFeedsSubscriptions.length; i++) {
 
            var _myFeed = this.myFeedsSubscriptions[i];
            this._setUrl(_myFeed.url);

            this._setNum(1 + Math.floor(_myFeed.pulsations * nbDaysToLoad)); // Pulsations = Estimation of news per day.

            var _urlParams = '?url=' + encodeURIComponent(this.gf.url) + '&num=' + this.gf.num;
            var _url    = this.gf.servers[this.gf.serverId].url + _urlParams;

            if (params.settings.proxy.use) {
                _urlParams = '?url=' + encodeURIComponent(this.gf.servers[this.gf.serverId].url) + _urlParams;
                _url = 'http://' + params.settings.proxy.host + '/proxy/' + _urlParams;
            }
            
            var _params = {"nbFeeds": this.myFeedsSubscriptions.length, "account": _myFeed.account, "url": _myFeed.url, "id": _myFeed.id, "pulsations": _myFeed.pulsations};
            
            this.get(_url, _params).then(function(response) {
                _MyFeeds.log('### Loading feed from network (0) ###');
                response.feed = {};
                response.feed._myAccount = response._myParams.account; // Add _myAccount value
                response.feed._myFeedId = response._myParams.id; // Add __id value
                _MyFeeds.log("SimplePie.prototype.loadFeeds() > get > response : ", response);
                document.body.dispatchEvent(new CustomEvent('SimplePie.load.done', {"detail": response}));
            }, function(error) { // Error then try to load feed from cache

                var _message = error.responseData;

                _MyFeeds.error('### Loading feed from cache (0) ' + _message._myParams.account + '/' + _message._myParams.url + ' ###', error);
                
                _MyFeeds._load('cache/simplepie/feeds/' + _message._myParams.account + '/' + btoa(_message._myParams.url) + ".json").then(function(_cacheContent){
                    _MyFeeds.log('### Loading feed from cache DONE (2a) ###', _cacheContent);
                    document.body.dispatchEvent(new CustomEvent('SimplePie.load.done', {"detail": _cacheContent}));
                }).catch(function() {
                    // --- Test
                    _MyFeeds.error('### Loading feed from cache ERROR (2b) ###');
                    var _response = {};
                    _response._myLastPublishedDate = "1/1/1970, 1:00:00 AM";
                    _response._myLastTimestamp = 0;
                    _response._myLastTimestampInMs = 0;
                    //_response._myNbEntries = 0;
                    _response._myParams = _message._myParams;
                    //_response._myPulsations = _message._myParams.pulsations;
                    //_response._myPulsationsIcone = "crashed";
                    _response.author = "";
                    _response.description = "";
                    _response.feed = {};
                    _response.feed._myAccount = _message._myParams.account; // Add _myAccount value
                    _response.feed._myFeedId = _message._myParams.id;
                    _response.feedUrl = _message._myParams.url;
                    _response.link = _message._myParams.url;
                    _response.title = _message._myParams.url;
                    _response.type = "rss";
                    _response.entries = [];
                    _MyFeeds.error('### Loading feed from cache ERROR (2b) ###', _response);
                    document.body.dispatchEvent(new CustomEvent('SimplePie.load.done', {"detail": _response}));
                    // ---
                    /*_MyFeeds.error('### Load feed from cache (2b) ###', error);
                    error._myParams = _params;
                    error._myFeedUrl = _myFeed.url;
                    document.body.dispatchEvent(new CustomEvent('SimplePie.load.error', {"detail": error}));*/
                });

            }).catch(function(e){
                _MyFeeds.error('### Loading (6) ###', e);
                document.body.dispatchEvent(new CustomEvent('SimplePie.load.error', {"detail": e}));
            });
            
        }
    }

}

/**
 * isValidUrl(url)
 * Check if feed exists.
 * 
 * @param {string} url
 * @return {boolean}
 * 
 * */
 
SimplePie.prototype.isValidUrl = function(url) {
    
    _MyFeeds.log('SimplePie.prototype.isValidUrl()', arguments);
    
    return new Promise(function(resolve, reject) {
        var _urlParams  = '?url=' + encodeURIComponent(url) + '&num=1';
        var _url        = _SimplePie.gf.servers[_SimplePie.gf.serverId].url + _urlParams;
        
        var promise = _SimplePie.get(_url, {});

        promise.then(function(response) {
            document.body.dispatchEvent(new CustomEvent('SimplePie.isValidUrl.done', {"detail": response}));
        }).catch(function(error){
            document.body.dispatchEvent(new CustomEvent('SimplePie.isValidUrl.error', {"detail": error}));
        });

    });
}

/**
 * get(url, myParams)
 * 
 * @param {string} url Url to load.
 * @param {object} myParams You can retrieve this object in response.
 * 
 * */
 
SimplePie.prototype.get = function (url, myParams) {
    
    _MyFeeds.log('SimplePie.prototype.get()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        window.setTimeout(function() {
            
            var xhr = new XMLHttpRequest({ mozSystem: true });

            xhr.open("GET", url);

            _MyFeeds.log('SimplePie.prototype.get()', url);

            xhr.onload = function() {
                _SimplePie.setNbFeedsLoaded();
                if (xhr.status == 200) {

                    var _response;

                    try {
                        _response = JSON.parse(xhr.response);
                    } catch(err) {
                       _MyFeeds.error('Loading ERROR 110 ' + url);
                        _response = {"responseData": {"_myParams": myParams}};
                        reject(_response);
                    }
                    
                    if (typeof _response.error === 'string') {
                       _MyFeeds.error('Loading ERROR 111 ' + url);
                        _response = {"responseData": {"_myParams": myParams}};
                        reject(_response);
                    }

                    else if ((typeof _response.entries == 'undefined') || (_response.entries.length == 0) || (typeof _response.feedUrl === 'null')) {
                       _MyFeeds.error('Loading ERROR 112 ' + url);
                        _response = {"responseData": {"_myParams": myParams}};
                        reject(_response);
                    }

                    try {
                        _response._myParams = myParams; // myParams; // Add extra values
                        resolve(_response);
                    } catch(err) {
                        _MyFeeds.error('Loading ERROR 113 ' + url);
                        _response = {"responseData": {"_myParams": myParams}};
                        reject(_response);
                    }
                    
                } else {
                    _MyFeeds.error('Loading ERROR 114 ' + url);
                    var _response = {"responseData": {"_myParams": myParams}};
                    reject(_response);
                }
            };

            xhr.onerror = function(e) {
                _SimplePie.setNbFeedsLoaded();
                _MyFeeds.error('Loading ERROR 115 ' + url);
                _MyFeeds.error(e);
                var _response = {"responseData": {"_myParams": myParams}};
                reject(_response);
            };
           
            xhr.timeout = 15000; // Set timeout to 15 seconds
            xhr.ontimeout = function(e) {
                //_MyFeeds.error('Loading ERROR 116 ', e);
                _SimplePie.setNbFeedsLoaded();
                _MyFeeds.error('Loading ERROR 116 ', myParams);
                var _response = {"responseData": {"_myParams": myParams}};
                e.responseData = {"_myParams": myParams};
                reject(_response);
            }

            xhr.send();
            
        }); // Schedule the execution for later
    });
}

/**
 * Is it a small entry ?
 * @param {object} entry
 * @return {boolean} true, false
 * */
 
SimplePie.prototype.isSmallEntry = function (entry) {

    var _out;
    var _diff = entry.content.length - entry.contentSnippet.length;
    
    if (_diff < params.entries.maxLengthForSmallEntries) {
        _out = true;
    } else {
        _out = false;
    }
    
    return _out;
}

/**
 * Set timestamp max from most recent news
 * @return {null}
 * */
SimplePie.prototype._setTimestampMax = function () {
    _MyFeeds.log('SimplePie.prototype._setTimestampMax()');

    var _entries = this.getEntries();
    var _entryId = Object.keys(_entries)[0];
    var _timestampMax = _entries[_entryId]['_myTimestamp'];
    
    if (_timestampMax > this.timestampMax) {
        this.timestampMax = _timestampMax;
    }
}

/**
 * Get timestamp max of most recent news
 * @return {Number|_timestampMax}
 */
SimplePie.prototype._getTimestampMax = function () {
    return this.timestampMax;
}

/**
 * Set timestamp min. Beginning of the day.
 * @param {null}
 * @return {null}
 */
SimplePie.prototype._setTimestampMin = function () {
    
    var _now    = new Date();
    var _year   = _now.getFullYear();
    var _month  = _now.getMonth();
    var _day    = _now.getDate();

    var _myDate = new Date(_year, _month, _day, '00','00','00');
    
    this.timestampMin = Math.floor(_myDate.getTime() / 1000);
}

/**
 * Get timestamp min. Beginning of the day.
 * @return {int}
 */
SimplePie.prototype._getTimestampMin = function () {
    return this.timestampMin;
}
