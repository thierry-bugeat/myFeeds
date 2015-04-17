
/* ======================== */
/* --- GoogleFeed Class --- */
/* ======================== */

// Call example :
// https://www.google.com/uds/Gfeeds?&num=4&hl=en&output=json&q=http%3A%2F%2Fwww.nextinpact.com%2Frss%2Fnews.xml&key=notsupplied&v=1.0

var GoogleFeed = function() {

    this.gf = {
        "output"        : "json",                               // Output format: json, xml
        "num"           : 4,                                    // Number of news to read
        "q"             : "",                                   // Encoded feed url
        "key"           : "notsupplied",                        // Google API key
        "v"             : "1.0" ,                               // Google API version
        "ServiceBase"   : "https://www.google.com/uds/Gfeeds?", //
        "method"        : "GET"
    };
    
    this.myFeeds = [];
    this.sortedEntries = [];
    this.sortedFeeds = [];
    this.unsortedEntries = [];
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
GoogleFeed.prototype.getEntries         = function()        { this._sortEntries();  return this.sortedEntries;  }
GoogleFeed.prototype.getFeeds           = function()        { this._sortFeeds();    return this.sortedFeeds;    }
GoogleFeed.prototype.getNbFeedsLoaded   = function()        { return this.nbFeedsLoaded;    }

GoogleFeed.prototype._setUrl            = function(q)       { this.gf.q = q;                }
GoogleFeed.prototype._sortEntries       = function() {
    
    // Sort entries by "_myTimestamp" 
    // using library "underscore.js"
    // http://documentcloud.github.io/underscore/
        
    this.sortedEntries = (_.sortBy(this.unsortedEntries, '_myTimestamp')).reverse();
}
GoogleFeed.prototype._sortFeeds         = function()        { this.sortedFeeds = _.sortBy(this.unsortedFeeds, 'title'); }
GoogleFeed.prototype.setNum             = function(num)     { this.gf.num = num;            }
GoogleFeed.prototype.setFeeds           = function(myFeeds) { this.myFeeds = myFeeds;       }
GoogleFeed.prototype.setNbFeedsLoaded   = function()        { this.nbFeedsLoaded++;         }

GoogleFeed.prototype.addEntries = function(entries) {
    for (var entryId in entries) {
        var _entry = entries[entryId];
        
        // 1st image extraction
        
            var _imageUrl   = '';
            var _regex      = /<img[^>]+src="(http:\/\/[^">]+)/g
            var _results    = _regex.exec(_entry.content);
            
            if ((_results !== null) && (Boolean(_results[1]))) { 
                _entry['_myFirstImageUrl'] = _results[1];
            }

        // ---
        

        _entry['_myTimestamp']  = Math.round(new Date(_entry.publishedDate).getTime()/1000);
        
        this.unsortedEntries.push(_entry);
    }
}

GoogleFeed.prototype.addFeed = function(_myNewFeed) {

    // Add custom values.
    
    _myNewFeed['_myNbEntries']            = _myNewFeed.entries.length;
    _myNewFeed['_myLastPublishedDate']    = _myNewFeed['entries'][0].publishedDate;
    _myNewFeed['_myLastTimestamp']        = _myNewFeed['entries'][0]._myTimestamp;
    
    // Remove values.
    
    delete _myNewFeed['entries'];
    
    // Store feed
    
    this.unsortedFeeds.push(_myNewFeed);
}

GoogleFeed.prototype.loadFeeds  = function() {
    
    this.nbFeedsLoaded = 0;
    this.unsortedEntries = [];
    this.unsortedFeeds = [];
    
    var _params = {"nbFeeds": this.myFeeds.length};
    
    for (var i = 0; i < this.myFeeds.length; i++) {

        var _myFeed = myFeeds[i];
        
        this._setUrl(_myFeed.url);
        
        var _urlParams = '&output=' + this.gf.output + '&num=' + this.gf.num + '&q=' + encodeURIComponent(this.gf.q) + '&key=' + this.gf.key + '&v=' + this.gf.v;
        var _url    = this.gf.ServiceBase + _urlParams;
        
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
