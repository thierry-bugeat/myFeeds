
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
    this.unsortedEntries = [];
    this.nbFeedsLoaded = 0;

    _GoogleFeed = this;
}

/* ================ */
/* --- Methodes --- */
/* ================ */

GoogleFeed.prototype.getVersion         = function()        { return this.gf.version;       }
GoogleFeed.prototype.getOuput           = function()        { return this.gf.output;        }
GoogleFeed.prototype.getNum             = function()        { return this.gf.num;           }
GoogleFeed.prototype.getEntries         = function()        { return this.unsortedEntries;  }
GoogleFeed.prototype.getNbFeedsLoaded   = function()        { return this.nbFeedsLoaded;    }

GoogleFeed.prototype._setUrl            = function(q)       { this.gf.q = q;                }
GoogleFeed.prototype.setNum             = function(num)     { this.gf.num = num;            }
GoogleFeed.prototype.setFeeds           = function(myFeeds) { this.myFeeds = myFeeds;       }
GoogleFeed.prototype.setNbFeedsLoaded   = function()        { this.nbFeedsLoaded++;         }

GoogleFeed.prototype.addEntries = function(entries) {
    for (var entryId in entries) {
        var _entry = entries[entryId];
        //_entry['_myFeedLink']   = event.detail.responseData.feed.link;
        _entry['_myTimestamp']  = Math.round(new Date(_entry.publishedDate).getTime()/1000);
        this.unsortedEntries.push(_entry);
    }
}

GoogleFeed.prototype.loadFeeds  = function() {
    
    this.nbFeedsLoaded = 0;
    this.unsortedEntries = [];
    
    var _params = {"nbFeeds": this.myFeeds.length};
    
    for (var i = 0; i < this.myFeeds.length; i++) {

        var _myFeed = myFeeds[i];
        
        this._setUrl(_myFeed.url);
        
        var _urlParams = '&output=' + this.gf.output + '&num=' + this.gf.num + '&q=' + encodeURIComponent(this.gf.q) + '&key=' + this.gf.key + '&v=' + this.gf.v;
        var _url    = this.gf.ServiceBase + _urlParams;
        
        var promise = this.get(_url, _params);
    
        promise.then(function(response) {
            document.body.dispatchEvent(new CustomEvent('GoogleFeed.load.done', {"detail": response}));
        }, function(response) {
            console.response("ERROR : ", error);
        });
    }

}

GoogleFeed.prototype.get = function (url, myParams) 
{
    console.log(url);
    console.log(params);
    return new Promise(function(resolve, reject) {
        
        var xhr = new XMLHttpRequest({ mozSystem: true });
        
        xhr.open('GET', url);

        xhr.onload = function() {
            if (xhr.status == 200) {

                //console.log(xhr.response);
                var _response = JSON.parse(xhr.response);
                
                _response.responseData._myParams = myParams; // Add extra values
                
                resolve(_response);
                //resolve(JSON.parse(xhr.response));
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
