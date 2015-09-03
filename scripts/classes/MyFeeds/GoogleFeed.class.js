
/* ======================== */
/* --- GoogleFeed Class --- */
/* ======================== */

// Call example :
// https://www.google.com/uds/Gfeeds?&num=4&hl=en&output=json&q=http%3A%2F%2Fwww.nextinpact.com%2Frss%2Fnews.xml&key=notsupplied&v=1.0

var GoogleFeed = function() {
    
    MyFeeds.call(this); /* Appel du constructeur de la classe parente */

    this.gf = {
        "output"        : "json",                                                   // Output format: json, xml, json_xml
        "num"           : 4,                                                        // Number of news to read
        "q"             : "",                                                       // Encoded feed url
        "key"           : "notsupplied",                                            // Google API key
        "v"             : "1.0" ,                                                   // Google API version
        "scoring"       : "h",                                                      // Include historical entries
        "ServiceBase"   : "https://www.google.com/uds/Gfeeds?",                     //
        "ServiceFind"   : "https://ajax.googleapis.com/ajax/services/feed/find?",   //
        "method"        : "GET"
    };
    
    this.myFeedsSubscriptions = [];
    this.gf_sortedEntries = [];
    this.sortedFeeds = [];
    this.gf_unsortedEntries = [];
    this.gf_mySha256 = [];          // Store sha256 sum for each news(entry), based on _entry.feedId + _entry.link
    this.unsortedFeeds = [];
    this.nbFeedsLoaded = 0;

    _GoogleFeed = this;
}
GoogleFeed.prototype = new MyFeeds();

/* ================ */
/* --- Methodes --- */
/* ================ */

GoogleFeed.prototype.getVersion         = function()        { return this.gf.version;       }
GoogleFeed.prototype.getOuput           = function()        { return this.gf.output;        }
GoogleFeed.prototype.getNum             = function()        { return this.gf.num;           }
GoogleFeed.prototype.getEntries         = function()        { this._sortEntries();  return this.gf_sortedEntries;   }
GoogleFeed.prototype.getFeeds           = function()        { this._sortFeeds();    return this.sortedFeeds;        }
GoogleFeed.prototype.getNbFeeds         = function()        { return this.myFeedsSubscriptions.length;              }
GoogleFeed.prototype.getNbFeedsLoaded   = function()        { return this.nbFeedsLoaded;    }

GoogleFeed.prototype._setUrl            = function(q)       { this.gf.q = q;                }

GoogleFeed.prototype._sortEntries       = function() {
    
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
    
    this.gf_sortedEntries = [];
    var _tmp = []; // It will contain all timestamps in ms.
    
    for (var i = 0; i < this.gf_unsortedEntries.length; i++) {
        _tmp.push(this.gf_unsortedEntries[i]._myTimestampInMs);
    }
    
    _tmp.sort().reverse();
    
    for (var i = 0; i < _tmp.length; i++) {

        for (var j = 0; j < this.gf_unsortedEntries.length; j++) {
            if (_tmp[i] == this.gf_unsortedEntries[j]._myTimestampInMs) {
                this.gf_sortedEntries.push(this.gf_unsortedEntries[j]);
                break;
            }
        }
    }

    //_MyFeeds.log(this.gf_sortedEntries);
}

GoogleFeed.prototype._sortFeeds = function() { 
    this.sortedFeeds = this.unsortedFeeds;
    this.sortedFeeds.sort(function(a, b){ return b.title < a.title });
}

GoogleFeed.prototype._setNum = function(num) { 
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

GoogleFeed.prototype.setFeedsSubscriptions = function(myFeedsSubscriptions) { 
    _MyFeeds.log('GoogleFeed.prototype.setFeedsSubscriptions()', myFeedsSubscriptions);
    
    var _tmp = [];
    
    for (var _account in myFeedsSubscriptions) {
        for (var i = 0 ; i < myFeedsSubscriptions[_account].length ; i++) {
            myFeedsSubscriptions[_account][i].account = _account;
            _tmp.push(myFeedsSubscriptions[_account][i]);
        }
    }
    
    this.myFeedsSubscriptions = _tmp;
}

GoogleFeed.prototype.setNbFeedsLoaded   = function()        { this.nbFeedsLoaded++;         }

GoogleFeed.prototype.addEntries = function(entries) {
    _MyFeeds.log('GoogleFeed.prototype.addEntries', arguments);
    
    for (var i = 0; i < entries.length; i++) {
        var _entry = entries[i];
        
        // Detect & update bad images urls in content
        // Transform '<img src="//...' to '<img src="http://...'
        
        _entry.content = _entry.content.replace(/src="\/\//g, 'src="http:\/\/');
        
        // 1st image extraction
        
            _entry['_myFirstImageUrl'] = "";
        
            var _results    = [];
            var _imageUrl   = '';
            var _regex      = /<img[^>]+src="(http(|s):\/\/[^">]+(?!gif))/g

            _results    = _regex.exec(_entry.content);
            
            if ((_results !== null) && (Boolean(_results[1]))) { 
                _entry['_myFirstImageUrl'] = _results[1];
            }

        // ---

        // @todo
        // A changer...
        // Dans le timestamp en "ms" j'ajoute une valeur aléatoire pour ne pas avoir 2 dates de publication identiques.
        // J'ajoute une valeur comprise entre 0 et 500 (0 à 0.5 seconde).
        //
        _entry['_myTimestamp']          = Math.round(new Date(_entry.publishedDate).getTime()/1000);
        _entry['_myTimestampInMs']      = Math.round(new Date(_entry.publishedDate).getTime()) + (Math.floor(Math.random()*500));
        
        _entry['_myPublishedDateUTC']   = new Date(_entry.publishedDate).toUTCString();
        _entry['_mySha256_title']       = CryptoJS.SHA256(_entry['_myFeedInformations']['_myFeedId'] + _entry['title']).toString(CryptoJS.enc.Hex);
        _entry['_mySha256_link']        = CryptoJS.SHA256(_entry['_myFeedInformations']['_myFeedId'] + _entry['link']).toString(CryptoJS.enc.Hex);
        
        if (this.gf_mySha256.contains(_entry['_mySha256_link'])) {
            // Old news same link: Do nothing.
        } else if (this.gf_mySha256.contains(_entry['_mySha256_title'])) {
            // Old news same title: Do nothing.
        } else {
            this.gf_mySha256.push(_entry['_mySha256_link']);
            this.gf_mySha256.push(_entry['_mySha256_title']);
            this.gf_unsortedEntries.push(_entry);
        }
    }
    _MyFeeds.log(this.gf_mySha256);
    _MyFeeds.log('GoogleFeed.prototype.addEntries : ' + this.gf_unsortedEntries.length + ' entrie(s)');
}

/**
 * Delete entries for specified account & feed
 * @param {string} account "local", "feedly", "theoldreader"...
 * @param {string} feedId
 * */
GoogleFeed.prototype.deleteEntries = function(account, feedId) {
    _MyFeeds.log('deleteEntries(' + account + ', ' + feedId + ')');

    var _tmp = [];
    
    for (var i = 0; i < this.gf_unsortedEntries.length; i++) {
        if ((this.gf_unsortedEntries[i]['_myFeedInformations']['_myAccount'] == account)
            && (this.gf_unsortedEntries[i]['_myFeedInformations']['_myFeedId'] == feedId)
        ){
            // Don't keep this entry.
        } else {
            _tmp.push(this.gf_unsortedEntries[i]);
        }
    }
    
    this.gf_unsortedEntries = _tmp;
}

/**
 * Delete entries older than specified timestamp
 * @param {int} timestamp 
 * @return {null}
 * */
GoogleFeed.prototype.deleteOldEntries = function(timestamp) {
    _MyFeeds.log('deleteOldEntries(' + timestamp + ')');

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

GoogleFeed.prototype.addFeed = function(feed) {
    _MyFeeds.group('GoogleFeed.prototype.addFeed()', feed.title);
    _MyFeeds.log('GoogleFeed.prototype.addFeed()', arguments);
    _MyFeeds.log('GoogleFeed.prototype.addFeed()', feed.entries);
    console.groupEnd();

    var _myNewfeed = feed;
    var _myNewEntries = feed.entries;
    
    for (var i = 0; i < _myNewEntries.length; i++) {
        _myNewEntries[i]._myFeedInformations = feed;
        delete _myNewEntries[i]._myFeedInformations.entries;
    }

    // Add custom values.
    
    _myNewfeed['_myNbEntries']          = _myNewEntries.length;
    _myNewfeed['_myLastPublishedDate']  = _myNewEntries[0].publishedDate;       // Non, les news ne sont pas ordonnées par date
    _myNewfeed['_myLastTimestamp']      = _myNewEntries[0]._myTimestamp;        // Non, les news ne sont pas ordonnées par date
    _myNewfeed['_myLastTimestampInMs']  = _myNewEntries[0]._myTimestampInMs;    // Non, les news ne sont pas ordonnées par date
    //_myNewfeed['_myFeedId']             = _myNewfeed._myFeedId;
    
    // Pulsations ?
    
    var _timestamps = [];
    
    for (var i = 0; i < _myNewEntries.length; i++) {
        _timestamps.push(Math.round(new Date(_myNewEntries[i].publishedDate).getTime() / 1000));
    }
    
    var _timestampMin = Math.min.apply(Math, _timestamps);
    var _timestampMax = Math.max.apply(Math, _timestamps);
    var _nbDaysInFeed = (_timestampMax - _timestampMin) / 86400; if (_nbDaysInFeed <= 0) { _nbDaysInFeed = 1; }
    var _myPulsations = (_myNewEntries.length / _nbDaysInFeed).toFixed(2);
    
    _myNewfeed['_myPulsations'] = _myPulsations; // Estimation of news number per day
    
    if      (isNaN(_myPulsations))  { _myNewfeed['_myPulsationsIcone'] = 'signal-0'; }
    else if (_myPulsations > 15)    { _myNewfeed['_myPulsationsIcone'] = 'wifi-4'; }
    else if (_myPulsations > 8 )    { _myNewfeed['_myPulsationsIcone'] = 'wifi-3'; }
    else if (_myPulsations > 3 )    { _myNewfeed['_myPulsationsIcone'] = 'wifi-2'; }
    else                            { _myNewfeed['_myPulsationsIcone'] = 'wifi-1'; }
    
    // Remove values.
    
    delete _myNewfeed.entries;
    
    // Add entries.
    
    this.addEntries(_myNewEntries);
    
    // Store feed
    
    this.unsortedFeeds.push(_myNewfeed);
}

/**
 * Load all feeds
 * @param {int} nbDaysToLoad Limit loading to N days.
 * */
GoogleFeed.prototype.loadFeeds = function(nbDaysToLoad) {
    
    _MyFeeds.log('GoogleFeed.prototype.loadFeeds()', this.myFeedsSubscriptions);

    this.nbFeedsLoaded = 0;
    //this.gf_unsortedEntries = []; // Store all entries of all feeds
    this.unsortedFeeds = [];
    
    //var _params = {"nbFeeds": this.myFeedsSubscriptions.length};

    if (this.myFeedsSubscriptions.length > 0) {
        for (var i = 0; i < this.myFeedsSubscriptions.length; i++) {

            var _myFeed = this.myFeedsSubscriptions[i];
            this._setUrl(_myFeed.url);

            this._setNum(1 + Math.floor(_myFeed.pulsations * nbDaysToLoad)); // Pulsations = Estimation of news per day.

            var _urlParams = '&output=' + this.gf.output + '&num=' + this.gf.num + '&scoring=' + this.gf.scoring + '&q=' + encodeURIComponent(this.gf.q) + '&key=' + this.gf.key + '&v=' + this.gf.v;
            var _url    = this.gf.ServiceBase + _urlParams;

            //_MyFeeds.log("GoogleFeed.load.done : " + _url);
            //_MyFeeds.log("GoogleFeed.load.done : ", _myFeed);
            
            var _params = {"nbFeeds": this.myFeedsSubscriptions.length, "account": _myFeed.account, "url": _myFeed.url, "id": _myFeed.id, "pulsations": _myFeed.pulsations};
            
            var promise = this.get(_url, _params);
        
            promise.then(function(response) {
                response.responseData.feed._myAccount = response.responseData._myParams.account; // Add _myAccount value
                response.responseData.feed._myFeedId = response.responseData._myParams.id; // Add __id value
                _MyFeeds.log("GoogleFeed.prototype.loadFeeds() > get > response : ", response);
                
                try {
                    document.body.dispatchEvent(new CustomEvent('GoogleFeed.load.done', {"detail": response}));
                } catch (e) {
                    // --- For worker ---
                    // It's not possible to use CustomEvent in worker 
                    // so new feed content are added from here.
                    self.dispatchEvent(new Event('GoogleFeed.load.done'));
                    try { _GoogleFeed.addFeed(response.responseData.feed); } catch (e) {console.error(e.message);}
                }
            }, function(error) {
                // Network error then try to load feed from cache
                
                try {
                    var _message = JSON.parse(error.message);
                } catch (e) {
                    window.alert("ERROR: Loading from cache\n" + e.message + ' / ' + JSON.stringify(error));
                    error._myParams = _params;
                    error._myFeedUrl = _myFeed.url;
                    document.body.dispatchEvent(new CustomEvent('GoogleFeed.load.error', {"detail": error}));
                }
                
                my._load('cache/google/feeds/' + btoa(_message.responseData._myParams.url) + ".json").then(function(_cacheContent){
                    _message.responseData.feed = _cacheContent;
                    document.body.dispatchEvent(new CustomEvent('GoogleFeed.load.done', {"detail": _message}));
                }).catch(function(error) {
                    // @todo
                    error._myParams = _params;
                    error._myFeedUrl = _myFeed.url;
                    document.body.dispatchEvent(new CustomEvent('GoogleFeed.load.error', {"detail": error}));
                });
                // ---
            });
        }
    }

}

/**
 * findFeeds(keywords)
 * 
 * @param {string} keywords
 * 
 * Documentation : https://developers.google.com/feed/v1/jsondevguide
 * */
GoogleFeed.prototype.findFeeds = function(keywords) {
    
    _MyFeeds.log('GoogleFeed.prototype.findFeeds()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var _params     = {};
        var _urlParams  = '&q=' + encodeURIComponent(keywords) + '&v=' + _GoogleFeed.gf.v;
        var _url        = _GoogleFeed.gf.ServiceFind + _urlParams;
        var promise     = _GoogleFeed.get(_url, _params);

        promise.then(function(response) {
            _MyFeeds.log(response);
            document.body.dispatchEvent(new CustomEvent('GoogleFeed.find.done', {"detail": response}));
            resolve(response);
        }).catch(function(error) {
            error._myParams = _params;
            document.body.dispatchEvent(new CustomEvent('GoogleFeed.find.error', {"detail": error}));
            _MyFeeds.error("ERROR ", error);
            reject(Error(JSON.stringify(error)));
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
 
GoogleFeed.prototype.get = function (url, myParams) {
    
    _MyFeeds.log('GoogleFeed.prototype.get()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var xhr = new XMLHttpRequest({ mozSystem: true });
        
        xhr.open('GET', url + "&rnd="+ Math.random());

        xhr.onload = function() {
            if (xhr.status == 200) {

                var _response = JSON.parse(xhr.response);

                try {
                    _response.responseData._myParams = myParams; // Add extra values
                    resolve(_response);
                } catch(err) {
                    var _response = {"responseData": {"_myParams": myParams}};
                    reject(Error(JSON.stringify(_response)));
                }
                
            } else {
                _MyFeeds.error('ERROR ' + url);
                var _response = {"responseData": {"_myParams": myParams}};
                reject(Error(JSON.stringify(_response)));
            }
        };

        xhr.onerror = function(e) {
            _MyFeeds.error('ERROR ' + url);
            _MyFeeds.error(e);
            var _response = {"responseData": {"_myParams": myParams}};
            reject(Error(JSON.stringify(_response)));
        };
        
        xhr.send();
    });
}
