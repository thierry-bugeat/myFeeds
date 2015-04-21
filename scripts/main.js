    // Firefox OS 
    // Style Guide          : https://www.mozilla.org/en-US/styleguide/products/firefox-os/
    // Icones               : http://buildingfirefoxos.com/downloads/
    // APIs List            : https://developer.mozilla.org/fr/Apps/Reference/Firefox_OS_device_APIs
    // Device Storage API   : https://developer.mozilla.org/en-US/docs/Web/API/Device_Storage_API
    // Browser API          : https://developer.mozilla.org/fr/docs/WebAPI/Browser
    // CSP                  : https://developer.mozilla.org/fr/Apps/PSC
    // <iframe> : https://developer.mozilla.org/fr/docs/Web/HTML/Element/iframe
    
    // A voir : 
    // http://imikado.developpez.com/tutoriels/firefoxOS/ma-premier-application/
    // http://toddmotto.com/is-it-time-to-drop-jquery-essentials-to-learning-javascript-from-a-jquery-background/
    
    var _now    = new Date();
    var _year   = _now.getFullYear();
    var _month  = _now.getMonth();
    var _day    = _now.getDate();
    
    var _mySod = new Date(_year, _month, _day, '00','00','00');             // Start of today
    var _myUtc = new Date(Date.UTC(_year, _month, _day, '00','00','00'));   // Start of today (UTC time)
    
    var _myTimestamp        = Math.floor(_mySod.getTime() / 1000);
    var _myTimestampInMs    = Math.floor(_mySod.getTime());
    
    var _myTimestampUtc     = Math.floor(_myUtc.getTime() / 1000);
    var _myTimestampUtcInMs = Math.floor(_myUtc.getTime());
    
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
    
    /*var myFeeds = [
        {"url": "http://www.gameblog.fr/rss.php",               "num": 20 }
    ];*/
    
    
    //addFeedsFromMyOnlineAccounts();
    
    var params = {
        "entries": {
            "maxLengthForSmallEntries": "400", // Max number of characters to display an entry as small entry
            "numberOfEntriesToLoadPerFeed": "20", // Default 4
            "dontDisplayEntriesOlderThan": "7" // In days
        }
    };
    
    var sortedEntries = [];
    var sortedFeeds = [];
    
    // DOM elements :
    
    var main_entry_container    = document.getElementById("main-entry-container");
    var main_entry              = document.getElementById("main-entry");
    var browser                 = document.getElementById("browser");
    var loading                 = document.getElementById("loading");
    
    var sync                    = document.getElementById("sync");
    var menu                    = document.getElementById("menu");
    var topup                   = document.getElementById("topup");
    var search                  = document.getElementById("search");
    var settings                = document.getElementById("settings");
    
    //var load                    = document.getElementById("load");
    //var save                    = document.getElementById("save");
    
    
    // DOM clicks :
    
    sync.onclick            = function(event) { _onclick(this, 'disable'); console.log('loadFeeds ### 2 ###'); loadFeeds(); }
    menu.onclick            = function(event) { openWindow("feeds-list-container", "left"); }
    topup.onclick           = function(event) { document.getElementById("feeds-entries").scrollTop = 0; }
    closeMainEntry.onclick  = function(event) { closeWindow("main-entry-container", "right"); echo("browser", "", ""); }
    closeFeedsList.onclick  = function(event) { closeWindow("feeds-list-container", "left"); }
    
    //load.onclick            = function(event) { loadFile(); }
    //save.onclick            = function(event) { saveFeed(); }
    
    // ---
    
    browser.addEventListener('mozbrowsererror', function (event) {
        console.dir("Erreur de chargement : " + event.detail);
    });
    
    function loadFeeds() {
        
        //document.body.dispatchEvent(new CustomEvent('loadFeeds.start', {"detail": ""}));
        
        echo("feeds-list", "Loading...", "");
        
        console.log('loadFeeds ### 3 ###'); gf.loadFeeds();
        
    }
    
    function _loading(percentage) {
        if (percentage >= 100) {
            loading.style.cssText = "width: 0%";
        } else {
            loading.style.cssText = "width: " + percentage + "%";
        }
    }
    
    /**
     *
     * https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
     * */
    function _onclick(_this, pointerEvents) {
        console.log(_this);
        
        if (pointerEvents == 'enable') {
            _this.style.cssText = "opacity: 1";
            _this.style.pointerEvents = 'auto';
        } else {
            _this.style.cssText = "opacity: 0.3";
            _this.style.pointerEvents = 'none';
        }
    }
    
    function dspFeeds(feeds) {
        
        var _htmlFeeds = "";
        
        // --- NAV start ---
        
        //_htmlFeeds = _htmlFeeds + '<nav>';
        
        // ==========================
        // --- Display feeds list ---
        // ==========================
        
        _htmlFeeds = _htmlFeeds + '<h2 data-l10n-id="my-subscriptions-sources">Sources</h2>';
        _htmlFeeds = _htmlFeeds + '<ul>';

        for (var i = 0; i < feeds.length; i++) {
            var _feed = feeds[i];
            _htmlFeeds = _htmlFeeds + '<li><a href="#"><p>' + _feed.title + ' <em>(' + _feed._myNbEntries + ')</em></p><p><time datetime="17:43">' + new Date(_feed._myLastPublishedDate) + '</time></p></a></li>';
        }
        
        _htmlFeeds = _htmlFeeds + '</ul>';
        
        // --- NAV end ---
        
        //_htmlFeeds = _htmlFeeds + '</nav>';
        
        // --- Display ---
        
        echo("feeds-list", _htmlFeeds, "");
    }
    
    function dspEntries(entries) {
        
        console.log("dspEntries()");
        console.log(entries);
        
        sortedEntries = entries;
        
        var _previousDaysAgo    = 0; // Count days to groups entries by day.
        var _entrieNbDaysAgo    = 0;
        
        // =======================
        // --- Display entries ---
        // =======================
                    
        var _htmlEntries = "";

        for (var i = 0; i < sortedEntries.length; i++) {
            
            var _entrie = sortedEntries[i];
            

            if ((_myTimestamp - _entrie._myTimestamp) < (params.entries.dontDisplayEntriesOlderThan * 86400)) {
                
                // --- Day separator ? ---

                _entrieNbDaysAgo = (1 + Math.floor((_myTimestamp - _entrie._myTimestamp) / 86400));
                
                if (_entrieNbDaysAgo != _previousDaysAgo ) {
                    _previousDaysAgo = _entrieNbDaysAgo;
                    console.log("============================================ " + _previousDaysAgo + ' day(s) ago');
                    _htmlEntries = _htmlEntries + '<div class="feeds-entries-next-day">' + myExtraTranslations['nb-days-ago'].replace('{{n}}', _previousDaysAgo) + '</div>';
                }
                
                console.log(_entrie._myTimestamp + ' ('+(new Date(_entrie.publishedDate).toUTCString()) +') | '+_myTimestamp+' (' + (new Date(_myTimestamp*1000)).toUTCString() + ') ==> Diff = ' + (_myTimestamp - _entrie._myTimestamp) + ' / ' + _entrieNbDaysAgo + ' day(s) ago / ' + _entrie.title);
                
                // ---

                // Date analyse
                // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Date/toLocaleString
                // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/DateTimeFormat
                
                var _date = new Date(_entrie.publishedDate);
                
                // Diff between "contentSnippet" et "content" ?
                // Small article or not ?
                
                var _diff = _entrie.content.length - _entrie.contentSnippet.length;
                
                // 1st image 
                
                var _imageUrl = "";
                
                if (_entrie._myFirstImageUrl) {
                    if (_diff < params.entries.maxLengthForSmallEntries) {
                        _imageUrl = '<img class="entry-small-image" src="' + _entrie._myFirstImageUrl + '"/>';
                    } else {
                        _imageUrl = '<img class="entrie-image" src="' + _entrie._myFirstImageUrl + '"/>'; 
                    }
                }
                
                // Entry composition
                
                // (1) Content too short so no link to open entry.
                
                if (_diff < params.entries.maxLengthForSmallEntries) {
                    _htmlEntries = _htmlEntries + '<div class="entry-small" entry_link="' + _entrie.link + '">';
                    _htmlEntries = _htmlEntries + _imageUrl;
                    _htmlEntries = _htmlEntries + '<div class="entry-small-title">' + _entrie.title + '</div>';
                    _htmlEntries = _htmlEntries + '<div class="entry-small-date">' + _date + '</div>';
                    //_htmlEntries = _htmlEntries + '<div class="entry-small-date">' + _entrie.link + '</div>';
                    _htmlEntries = _htmlEntries + "</div>";
                }
                
                // (2) Else
                
                else {
                    _htmlEntries = _htmlEntries + '<div class="entrie" i="' + i + '" >';
                    _htmlEntries = _htmlEntries + '<div class="entrie-feed-title">' + _entrie.author + '</div>';
                    _htmlEntries = _htmlEntries + '<div class="entrie-title">' + _entrie.title + '</div>';
                    _htmlEntries = _htmlEntries + '<div class="entrie-date">' + _date + '</div>';
                    _htmlEntries = _htmlEntries + _imageUrl;
                    _htmlEntries = _htmlEntries + '<p class="entrie-contentSnippet">' + _entrie.contentSnippet + '</p>';
                    _htmlEntries = _htmlEntries + '<div class="entrie-more"><button id="more"><span data-icon="more"></span></button></div>';
                    _htmlEntries = _htmlEntries + "</div>";
                }
            
            }
            
        }
        
        // Display entries
        
        echo("feeds-entries", _htmlEntries, "");
        
        // ==================
        // --- Add Events ---
        // ==================
        
        // onclick Small Entries : 
        
        var _small_entries = document.querySelectorAll(".entry-small");
        
        for (var i = 0; i < _small_entries.length; i++) {
            _small_entries[i].onclick = function() { entryFade(this); mainEntryOpenInBrowser(null, this.getAttribute("entry_link")); }
        }

        // onclick Entries :
        
        var _entries = document.querySelectorAll(".entrie");
        
        for (var i = 0; i < _entries.length; i++) {
            _entries[i].onclick = function() { entryFade(this); mainEntryOpenInBrowser(this.getAttribute("i"), ""); }
        }

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
    
    function mainEntryOpenInBrowser(entryId, url) {
        document.body.style.cssText = "overflow: hidden;";  // Disable scroll in entries list.

        if (entryId !== null) {
            var _entry = sortedEntries[entryId];
            var _srcDoc = "";
            var _regex = new RegExp("'", "g");

            // Inline CSS. @todo Find an other way
            var _srcDocCss = '<style>* {box-sizing: border-box; background-color: #FFFFFF; max-width: 100%; height: auto; overflow-x:hidden;} html{margin:0; font-size: 62.5%; padding:2%;} .entrie-title {font-size: 2.3rem;} .entrie-date {font-size:1.4rem; color:#c4c4c4;} .entrie-contentSnippet{font-size: 1.7rem;}</style>';

            _srcDoc = _srcDoc + _srcDocCss;
            _srcDoc = _srcDoc + '<div class="entrie-title">' + _entry.title.replace(_regex, "&#39;") + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-date">' + new Date(_entry.publishedDate) + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-author">' + _entry.author + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-contentSnippet">' + _entry.content.replace(_regex, "&#39;") + '</div>';
            
            echo("browser", '<iframe srcdoc=\'' + _srcDoc + '\' sandbox="allow-same-origin allow-scripts" mozbrowser remote></iframe>', "");
        } else {
            echo("browser", '<iframe src="' + url + '" sandbox="allow-same-origin allow-scripts" mozbrowser remote></iframe>', "");
        }
        
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
    
    /**
     * Open window from left or right
     * @param string divId Div identifiant
     * @param string placement "left", "right" Initial window placement.
     * */
    function openWindow(divId, placement) {
        document.body.style.cssText = "overflow: hidden;"; // Disable scroll in entries list.
        
        var _window = document.getElementById(divId);
        
        _window.scrollTop = 0;
        
        if (placement == "left") {
            _window.style.cssText = "transform: translateX(100%); -webkit-transition-duration: 0.5s; transition-duration: 0.5s;";
        } else {
            _window.style.cssText = "transform: translateX(-100%); -webkit-transition-duration: 0.5s; transition-duration: 0.5s;";
        }
    }
    
    /**
     * Close window from left or right
     * @param string divId Div identifiant
     * @param string placement "left", "right" Initial window placement.
     * */
    function closeWindow(divId, placement) {
        document.body.style.cssText = "overflow: auto;"; // Re-enable scroll in entries list.
        
        var _window = document.getElementById(divId);
        
        if (placement == "left") {
            _window.style.cssText = "transform: translateX(0%); -webkit-transition-duration: 0.5s; transition-duration: 0.5s;";
        } else {
            _window.style.cssText = "transform: translateX(100%); -webkit-transition-duration: 0.5s; transition-duration: 0.5s;";
        }
    }
    
    // ======================
    // --- Ready to start ---
    // ======================
    
    window.onload = function () {
        
        // ==============
        // --- Events ---
        // ==============
    
        document.body.addEventListener('GoogleFeed.load.done', function(event){

            // Add feed entries to array "unsortedEntries"

                gf.addEntries(event.detail.responseData.feed.entries);
                gf.addFeed(event.detail.responseData.feed);
            
            // Check if all feeds were loaded
            
                var _nbFeedsToLoad = event.detail.responseData._myParams.nbFeeds;
                var _nbFeedsLoaded = gf.getNbFeedsLoaded();
                gf.setNbFeedsLoaded(++_nbFeedsLoaded);
                
                console.log('Feed ' + _nbFeedsLoaded + ' / ' + _nbFeedsToLoad + ' loaded.');
                
                // Percentage of loading ?
                
                _loading(Math.round((100 * _nbFeedsLoaded) / _nbFeedsToLoad));
                
                // ---

                if (++_nbFeedsLoaded == _nbFeedsToLoad) {
                    console.log('*** ALL FEEDS LOADED *** :D ' + _nbFeedsLoaded + ' / ' + _nbFeedsToLoad);
                    //document.body.dispatchEvent(new CustomEvent('loadFeeds.end', {"detail": ""}));
                    console.log('dspEntries ### 1 ###'); 
                    dspEntries(gf.getEntries());
                    dspFeeds(gf.getFeeds());
                }
                
                if (_nbFeedsLoaded >= _nbFeedsToLoad) {
                    _loading(100); echo("loading", "", "");
                    _onclick(sync, 'enable');
                }
            
            // ---
            
        }, true);
        
        document.body.addEventListener('GoogleFeed.load.error', function(event){
            
            // Check if all feeds were loaded
            
                console.error(event);
                
                var _nbFeedsToLoad = event.detail._myParams.nbFeeds; // different de "done"
                var _nbFeedsLoaded = gf.getNbFeedsLoaded();
                gf.setNbFeedsLoaded(++_nbFeedsLoaded);
                
                // Percentage of loading ?
                
                _loading(Math.round((100 * _nbFeedsLoaded) / _nbFeedsToLoad));
                
                // ---

                if (++_nbFeedsLoaded >= _nbFeedsToLoad) {
                    console.log('*** ALL FEEDS LOADED *** :D ' + _nbFeedsLoaded + ' / ' + _nbFeedsToLoad);
                    console.log('dspEntries ### 2 ###'); dspEntries(gf.getEntries());
                    dspFeeds(gf.getFeeds());
                    _loading(100); echo("loading", "", "");
                    _onclick(sync, 'enable');
                }
            
            // ---
            
        }, true);
    
        // ============
        // --- Main ---
        // ============

        _onclick(sync, 'disable');      // Disable "sync" button when application start
        
        _onclick(search, 'disable');    // Not yet implemented
        _onclick(settings, 'disable');  // Not yet implemented
        
        gf.setFeeds(myFeeds);
        gf.setNum(params.entries.numberOfEntriesToLoadPerFeed); // Load "num" entries per feed.
        console.log('loadFeeds ### 1 ###'); gf.loadFeeds();

    };
