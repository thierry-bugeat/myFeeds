
/* ======================== */
/* --- GoogleFeed Class --- */
/* ======================== */

// Call example :
// https://www.google.com/uds/Gfeeds?&num=4&hl=en&output=json&q=http%3A%2F%2Fwww.nextinpact.com%2Frss%2Fnews.xml&key=notsupplied&v=1.0

var GoogleFeed = function() {

    this.gf = {
        "output"        : "json",                               // Output format: json, xml, json_xml
        "num"           : 4,                                    // Number of news to read
        "q"             : "",                                   // Encoded feed url
        "key"           : "notsupplied",                        // Google API key
        "v"             : "1.0" ,                               // Google API version
        "scoring"       : "h",                                  // Include historical entries
        "ServiceBase"   : "https://www.google.com/uds/Gfeeds?", //
        "method"        : "GET"
    };
    
    this.myFeeds = [];
    this.gf_sortedEntries = [];
    this.sortedFeeds = [];
    this.gf_unsortedEntries = [];
    this.unsortedFeeds = [];
    this.nbFeedsLoaded = 0;

    _GoogleFeed = this;
}

/* ================ */
/* --- Methodes --- */
/* ================ */

GoogleFeed.prototype.getVersion         = function()        { return this.gf.version;       }
GoogleFeed.prototype.getOuput           = function()        { return this.gf.output;        }
GoogleFeed.prototype.getNum             = function()        { return this.gf.num;           }
GoogleFeed.prototype.getEntries         = function()        { this._sortEntries();  return this.gf_sortedEntries;   }
GoogleFeed.prototype.getFeeds           = function()        { this._sortFeeds();    return this.sortedFeeds;        }
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
    
    console.log(this.gf_sortedEntries);*/
    
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
        //console.log(_tmp[i]);
        for (var j = 0; j < this.gf_unsortedEntries.length; j++) {
            if (_tmp[i] == this.gf_unsortedEntries[j]._myTimestampInMs) {
                this.gf_sortedEntries.push(this.gf_unsortedEntries[j]);
                break;
            }
        }
    }

    console.log(this.gf_sortedEntries);
}

GoogleFeed.prototype._sortFeeds         = function() { 
    this.sortedFeeds = this.unsortedFeeds;
    this.sortedFeeds.sort(function(a, b){ return b.title < a.title });
}
GoogleFeed.prototype._setNum            = function(num)     { this.gf.num = num;            }
GoogleFeed.prototype.setFeeds           = function(myFeeds) { this.myFeeds = myFeeds;       }
GoogleFeed.prototype.setNbFeedsLoaded   = function()        { this.nbFeedsLoaded++;         }

GoogleFeed.prototype.addEntries = function(entries) {
    for (var entryId in entries) {
        var _entry = entries[entryId];
        
        // Detect & update bad images urls in content
        // Transform '<img src="//...' to '<img src="http://...'
        
        _entry.content = _entry.content.replace(/src="\/\//g, 'src="http:\/\/');
        
        // 1st image extraction
        
            _entry['_myFirstImageUrl'] = "";
        
            var _results    = [];
            var _imageUrl   = '';
            var _regex      = /<img[^>]+src="(http(|s):\/\/[^">]+)/g

            _results    = _regex.exec(_entry.content);
            
            if ((_results !== null) && (Boolean(_results[1]))) { 
                _entry['_myFirstImageUrl'] = _results[1];
            }

        // ---

        // @todo
        // A changer...
        // Dans les 2 lignes ci-dessous j'ajoute une valer aléatoire pour ne pas avoir 2 dates de publication identiques.
        // Sinon cela provoque un bug d'affichage dans l'ordre des news.
        // Sur la 1ère ligne j'ajoute -120 à +120 secondes
        // Sur la 2ième j'ajoute de 0 à 0.5 seconde.
        _entry['_myTimestamp']          = Math.round(new Date(_entry.publishedDate).getTime()/1000);
        _entry['_myTimestampInMs']      = Math.round(new Date(_entry.publishedDate).getTime()) + (Math.floor(Math.random()*500));
        
        _entry['_myPublishedDateUTC']   = new Date(_entry.publishedDate).toUTCString();
        
        this.gf_unsortedEntries.push(_entry);
    }
}

GoogleFeed.prototype.addFeed = function(_myNewFeed) {

    // Add custom values.
    
    _myNewFeed['_myNbEntries']          = _myNewFeed.entries.length;
    _myNewFeed['_myLastPublishedDate']  = _myNewFeed['entries'][0].publishedDate;       // Non, les news ne sont pas ordonnées par date
    _myNewFeed['_myLastTimestamp']      = _myNewFeed['entries'][0]._myTimestamp;        // Non, les news ne sont pas ordonnées par date
    _myNewFeed['_myLastTimestampInMs']  = _myNewFeed['entries'][0]._myTimestampInMs;    // Non, les news ne sont pas ordonnées par date
    
    // Pulsations ?
    
    var _timestamps = [];
    
    for (var i = 0; i < _myNewFeed.entries.length; i++) {
        _timestamps.push(Math.round(new Date(_myNewFeed.entries[i].publishedDate).getTime() / 1000));
    }
    
    var _timestampMin = Math.min.apply(Math, _timestamps);
    var _timestampMax = Math.max.apply(Math, _timestamps);
    var _nbDaysInFeed = (_timestampMax - _timestampMin) / 86400;
    var _myPulsations = (_myNewFeed.entries.length / _nbDaysInFeed).toFixed(2);
    
    _myNewFeed['_myPulsations'] = _myPulsations; // Estimation of news number per day
    
    if      (isNaN(_myPulsations))  { _myNewFeed['_myPulsationsIcone'] = 'signal-0'; }
    else if (_myPulsations > 20)    { _myNewFeed['_myPulsationsIcone'] = 'signal-5'; }
    else if (_myPulsations > 10)    { _myNewFeed['_myPulsationsIcone'] = 'signal-4'; }
    else if (_myPulsations > 5 )    { _myNewFeed['_myPulsationsIcone'] = 'signal-3'; }
    else if (_myPulsations > 3 )    { _myNewFeed['_myPulsationsIcone'] = 'signal-2'; }
    else                            { _myNewFeed['_myPulsationsIcone'] = 'signal-1'; }
    
    // Remove values.
    
    delete _myNewFeed['entries'];
    
    // Store feed
    
    this.unsortedFeeds.push(_myNewFeed);
}

GoogleFeed.prototype.loadFeeds  = function() {
    
    this.nbFeedsLoaded = 0;
    this.gf_unsortedEntries = [];
    this.unsortedFeeds = [];
    
    var _params = {"nbFeeds": this.myFeeds.length};
    
    for (var i = 0; i < this.myFeeds.length; i++) {

        var _myFeed = myFeeds[i];
        
        this._setUrl(_myFeed.url);
        this._setNum(_myFeed.num);
        
        var _urlParams = '&output=' + this.gf.output + '&num=' + this.gf.num + '&scoring=' + this.gf.scoring + '&q=' + encodeURIComponent(this.gf.q) + '&key=' + this.gf.key + '&v=' + this.gf.v;
        var _url    = this.gf.ServiceBase + _urlParams;
        
        console.log(_url);
        
        var promise = this.get(_url, _params);
    
        promise.then(function(response) {
            document.body.dispatchEvent(new CustomEvent('GoogleFeed.load.done', {"detail": response}));
        }, function(error) {
            error._myParams = _params;
            document.body.dispatchEvent(new CustomEvent('GoogleFeed.load.error', {"detail": error}));
            console.error("ERROR ", error);
        });
    }

}

/**
 * get(url, myParams)
 * 
 * @param string url Url to load.
 * @param object myParams You can retrieve this object in response.
 * 
 * */
 
GoogleFeed.prototype.get = function (url, myParams) 
{
    return new Promise(function(resolve, reject) {
        
        var xhr = new XMLHttpRequest({ mozSystem: true });
        
        xhr.open('GET', url);

        xhr.onload = function() {
            if (xhr.status == 200) {

                var _response = JSON.parse(xhr.response);

                try {
                    _response.responseData._myParams = myParams; // Add extra values
                    resolve(_response);
                } catch(err) {
                    reject(Error(err));
                }
                
            } else {
                reject(Error(xhr.statusText));
            }
        };

        xhr.onerror = function() {
            reject(Error("Network error."));
        };
        
        xhr.send();
    });
}
