    // Firefox OS 
    // Style Guide          : https://www.mozilla.org/en-US/styleguide/products/firefox-os/
    // Icones               : http://buildingfirefoxos.com/downloads/
    // APIs List            : https://developer.mozilla.org/fr/Apps/Reference/Firefox_OS_device_APIs
    // Device Storage API   : https://developer.mozilla.org/en-US/docs/Web/API/Device_Storage_API
    // Browser API          : https://developer.mozilla.org/fr/docs/WebAPI/Browser
    // CSP                  : https://developer.mozilla.org/fr/Apps/PSC
    // <iframe> : https://developer.mozilla.org/fr/docs/Web/HTML/Element/iframe
    
    // A voir : http://imikado.developpez.com/tutoriels/firefoxOS/ma-premier-application/
    
    var _myTimestamp = Math.floor(Date.now() / 1000);
    
    var myFeeds = [
        {"url": "http://www.gameblog.fr/rss.php",               "num": 20 },
        {"url": "http://linuxfr.org/news.atom",                 "num": 20 },
        {"url": "http://carlchenet.wordpress.com/feed/",        "num": 20 },
        {"url": "http://le-libriste.fr/feed/",                  "num": 20 },
        {"url": "http://www.nextinpact.com/rss/news.xml",       "num": 20 },
        {"url": "http://www.minimachines.net/feed/",            "num": 20 },
        {"url": "http://www.planet-libre.org/rss10.php",        "num": 20 },
        {"url": "http://www.webupd8.org/feeds/posts/default",   "num": 20 },
        {"url": "http://feeds.feedburner.com/frandroid",        "num": 20 },
        {"url": "http://planet.gnome.org/atom.xml",             "num": 20 },
        {"url": "http://raphaelhertzog.fr/feed/",               "num": 20 },
        {"url": "http://www.dadall.info/blog/feed.php?rss",     "num": 20 }
    ];
    
    //addFeedsFromMyOnlineAccounts();
    
    var params = {
        "entries": {
            "maxLengthForSmallEntries": "400", // Max number of characters to display an entry as small entry
            "numberOfEntriesToLoadPerFeed": "2", // Default 4
            "dontDisplayEntriesOlderThan": "8" // In days
        }
    };
    
    var sortedEntries = [];
    
    // DOM elements :
    
    var main_entry_container    = document.getElementById("main-entry-container");
    var main_entry              = document.getElementById("main-entry");
    var browser                 = document.getElementById("browser");
    
    var sync                    = document.getElementById("sync");
    var menu                    = document.getElementById("menu");
    var topup                   = document.getElementById("topup");
    
    var load                    = document.getElementById("load");
    var save                    = document.getElementById("save");
    
    // DOM clicks :
    
    sync.onclick            = function(event) { loadFeeds(); }
    menu.onclick            = function(event) { openWindow("feeds-list-container"); }
    topup.onclick           = function(event) { document.getElementById("feeds-entries-container").scrollTop = 0; }
    closeMainEntry.onclick  = function(event) { closeWindow("main-entry-container"); }
    closeFeedsList.onclick  = function(event) { closeWindow("feeds-list-container"); }
    
    load.onclick            = function(event) { loadFile(); }
    save.onclick            = function(event) { saveFeed(); }
    
    // ---
    
    browser.addEventListener('mozbrowsererror', function (event) {
        console.dir("Erreur de chargement : " + event.detail);
    });
    
    function loadFeeds() {
        
        //syncRotation();
        
        echo("feeds-list", "Loading...", "");
        echo("feeds-entries", "Loading...", "");
        
        //        gf.setFeeds(myFeeds);
        //gf.setNum(params.entries.numberOfEntriesToLoadPerFeed); // Load "num" entries per feed.
        gf.loadFeeds();
        
    }
    
    function dspEntries(_unsortedEntries) {
        
        console.log("dspEntries()");
        console.log(_unsortedEntries);
        
        // Add "_myTimestamp" for each entry :
        
        for (var i = 0; i < _unsortedEntries.length; i++) {
            var _publishedDate = new Date(_unsortedEntries[i].publishedDate);
            _unsortedEntries[i]._myTimestamp = Math.round(_publishedDate.getTime()/1000);
        }
        
        // Sort entries by "_myTimestamp" 
        // using library "underscore.js"
        // http://documentcloud.github.io/underscore/
        
        sortedEntries = _.sortBy(_unsortedEntries, '_myTimestamp');
        //sortedEntries = _.sortBy(_unsortedEntries, 'title'); // Works fine

        sortedEntries.reverse();
        
        // Display entries
                    
        var _htmlEntries = "";

        for (var i = 0; i < sortedEntries.length; i++) {
            
            var _entrie = sortedEntries[i];
            
            if ((_myTimestamp - _entrie._myTimestamp) < (params.entries.dontDisplayEntriesOlderThan * 86400)) {

                // Date analyse
                // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Date/toLocaleString
                // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/DateTimeFormat
                
                var _date = new Date(_entrie.publishedDate);
                
                // 1st image extraction
                
                var _imageUrl   = '';
                var _regex      = /<img[^>]+src="(http:\/\/[^">]+)/g
                var _results    = _regex.exec(_entrie.content);
                
                if (_results !== null) {
                    var _imageUrl = _results[1];
                    
                    if (Boolean(_imageUrl)) { 
                        _imageUrl = '<img class="entrie-image" src="' + _imageUrl + '"/>'; 
                    }
                }
                
                // Diff between "contentSnippet" et "content" ?
                
                var _diff = _entrie.content.length - _entrie.contentSnippet.length;
                
                // Entry composition
                
                // (1) Content too short so no link to open entry.
                
                if (_diff < params.entries.maxLengthForSmallEntries) {
                    //_htmlEntries = _htmlEntries + '<div class="entrie-small" onclick="javascript:entryFade(this); mainEntryOpenInBrowser(\'' + _entrie.link + '\');" >';
                    _htmlEntries = _htmlEntries + _imageUrl;
                    _htmlEntries = _htmlEntries + '<div class="entrie-title">' + _entrie.title + '</div>';
                    _htmlEntries = _htmlEntries + '<div class="entrie-date">' + _date + '</div>';
                    _htmlEntries = _htmlEntries + '<div class="entrie-date">' + _entrie.feed_link + '</div>';
                    _htmlEntries = _htmlEntries + "</div>";
                }
                
                // (2) Else
                
                else {
                    //_htmlEntries = _htmlEntries + '<div class="entrie" onclick="javascript:entryFade(this); mainEntryOpen(' + i + ');" >';
                    _htmlEntries = _htmlEntries + '<div class="entrie-title">' + _entrie.title + '</div>';
                    _htmlEntries = _htmlEntries + '<div class="entrie-date">' + _date + '</div>';
                    _htmlEntries = _htmlEntries + '<div class="entrie-date">' + _entrie.feed_link + '</div>';
                    _htmlEntries = _htmlEntries + _imageUrl;
                    _htmlEntries = _htmlEntries + '<p class="entrie-contentSnippet">' + _entrie.contentSnippet + '</p>';
                    _htmlEntries = _htmlEntries + '<div class="entrie-more"><a><img src="images/more.svg"/></a></div>';
                    _htmlEntries = _htmlEntries + "</div>";
                }
            
            }
            
        }
        
        // Display entries
        
        echo("feeds-entries", _htmlEntries, "");
    }
    
    function entryFade(_this) {
        _this.style.cssText = "opacity : 0.4; z-index: -1;";
    }
    
    function saveFeed(filename, data) {

        console.log("saveFeed(" + filename + ")");
        
        var myStorage = navigator.getDeviceStorage("apps");
        var file   = new Blob(["This is a text file."], {type: "text/plain"});

        var request = myStorage.addNamed(file, filename);
        //var request = myStorage.add(file);

        request.onsuccess = function () {
            console.log('File "' + this.name + '" successfully wrote on the sdcard storage area');
            //console.log("====> Saved file " + this.result.name);
            
        }

        // An error typically occur if a file with the same name already exist
        request.onerror = function () {
            console.log("Unable to write the file: " + this.error);
        }
    }
    
    // TESTS
    function loadFile() {
        console.log("loadFile()");
        
        //var myStorage = navigator.getDeviceStorage("apps");
        
        /*var cursor = files.enumerate();

        cursor.onsuccess = function () {
            console.log(this.result);
        }*/
        /*var request = myStorage.get("feed-11.txt");
        
        request.onsuccess = function () {

        var file = this.result;
            console.dir("Get the file: " + file.name);
        }

        request.onerror = function () {
            console.log("Unable to get the file: " + this.error);
            console.log(this);
        }*/
    }
    
    function mainEntryOpen(id) {
        document.getElementById("browser").style.cssText = "display: none;";
        document.body.style.cssText = "overflow: hidden;"; // Disable scroll in entries list.
        
        echo("browser", "", ""); // Remove browser content
        
        var _entry = sortedEntries[id];
        
        var _htmlEntry = "";
        
        _htmlEntry = _htmlEntry + '<div class="entrie-title">' + _entry.title + '</div>';
        _htmlEntry = _htmlEntry + '<p class="entrie-contentSnippet">' + _entry.content + '</p>';
                            
        echo("content", _htmlEntry, "");

        main_entry.scrollTop = 0;
        
        main_entry_container.style.cssText = "transform: translateX(-100%); -webkit-transition-duration: 1s; transition-duration: 1s;";
    }
    
    function mainEntryOpenInBrowser(url) {
        //window.console && console.log(url);
        document.body.style.cssText = "overflow: hidden;"; // Disable scroll in entries list.
        
        echo("content", "", ""); // Remove main entry content
        
        echo("browser", '<iframe src="' + url + '" sandbox="" mozbrowser remote></iframe>', "");
        
        document.getElementById("browser").style.cssText = "display: block;";
        
        main_entry.scrollTop = 0;
        
        main_entry_container.style.cssText = "transform: translateX(-100%); -webkit-transition-duration: 1s; transition-duration: 1s;";
    }
    
    /**
     * Output one html string in div element
     * 
     * param string divId    : Div id element
     * param string msg      : Html string to write
     * param string placement: "append", "prepend", ""
     * */
    function echo(divId, msg, placement) {
        var _out = document.getElementById(divId);
        
        if (placement == 'prepend') {
            _out.innerHTML = msg + _out.innerHTML;
        } else if (Boolean(placement)) {
            _out.innerHTML = _out.innerHTML + msg;
        } else {
            _out.innerHTML = msg;
        }
    }
    
    function syncRotation() {

        //var _sync = document.getElementById("sync");
        
        //console.dir(_sync);
        //_translateX = _sync.x + 10;
        
        //_sync.style.cssText = "transform: translateX(" + _translateX + "px); ";
        //_sync.style.cssText = "transform: rotate(-720deg); transform-origin: 50% 50%;"
        //_sync.style.cssText = "transform: rotate(720deg); transform-origin: 50% 50%; -webkit-transition-duration: 3s; transition-duration: 3s;"

    }
    
    function openWindow(divId) {
        document.body.style.cssText = "overflow: hidden;"; // Disable scroll in entries list.
        
        var _window = document.getElementById(divId);
        
        _window.scrollTop = 0;
        _window.style.cssText = "transform: translateX(-100%); -webkit-transition-duration: 0.5s; transition-duration: 0.5s;";
    }
    
    function closeWindow(divId) {
        document.body.style.cssText = "overflow: auto;"; // Re-enable scroll in entries list.
        
        var _window = document.getElementById(divId);
        
        _window.style.cssText = "transform: translateX(100%); -webkit-transition-duration: 1s; transition-duration: 1s;";
    }

    function sleep(milliseconds) {
        var start = new Date().getTime();
        for (var i = 0; i < 1e7; i++) {
            if ((new Date().getTime() - start) > milliseconds){
                break;
            }
        }
    }
    
    // ======================
    // --- Ready to start ---
    // ======================
    
    window.onload = function () {
        
        // Events :
    
        document.body.addEventListener('GoogleFeed.load.done', function(event){

            console.log(event);
            
            // Add feed entries to array "unsortedEntries"
            
                gf.addEntries(event.detail.responseData.feed.entries);

            // Check if all feeds were loaded
            
                var _nbFeeds = event.detail.responseData._myParams.nbFeeds;
            
                console.log(gf.getNbFeedsLoaded() + ' / ' + _nbFeeds );
                var _nbFeedsLoaded = gf.getNbFeedsLoaded();
                gf.setNbFeedsLoaded(++_nbFeedsLoaded);

                if (++_nbFeedsLoaded == _nbFeeds) {
                    console.log('*** ALL FEEDS LOADED *** :D');
                    dspEntries(gf.getEntries());
                }
            
            // ---
            
        }, true);
    
        // Main :
        
        gf.setFeeds(myFeeds);
        gf.setNum(params.entries.numberOfEntriesToLoadPerFeed); // Load "num" entries per feed.
        gf.loadFeeds();

    };
