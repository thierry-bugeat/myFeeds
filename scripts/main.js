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
        {"url": "http://www.gameblog.fr/rss.php",               "num": 150, "includeHistoricalEntries": false },
        {"url": "http://linuxfr.org/news.atom",                 "num": 20,  "includeHistoricalEntries": false },
        {"url": "http://carlchenet.wordpress.com/feed/",        "num": 7,   "includeHistoricalEntries": false },
        {"url": "http://le-libriste.fr/feed/",                  "num": 7,   "includeHistoricalEntries": false },
        {"url": "http://www.nextinpact.com/rss/news.xml",       "num": 130, "includeHistoricalEntries": false },
        {"url": "http://www.minimachines.net/feed/",            "num": 30,  "includeHistoricalEntries": false },
        {"url": "http://www.planet-libre.org/rss10.php",        "num": 30,  "includeHistoricalEntries": false },
        {"url": "http://www.webupd8.org/feeds/posts/default",   "num": 7,   "includeHistoricalEntries": false },
        {"url": "http://feeds.feedburner.com/frandroid",        "num": 140, "includeHistoricalEntries": false },
        {"url": "http://planet.gnome.org/atom.xml",             "num": 20,  "includeHistoricalEntries": false },
        {"url": "http://raphaelhertzog.fr/feed/",               "num": 7,   "includeHistoricalEntries": false },
        {"url": "http://www.dadall.info/blog/feed.php?rss",     "num": 7,   "includeHistoricalEntries": false },
        {"url": "http://www.gamekult.com/feeds/actu.html",      "num": 100, "includeHistoricalEntries": false },
        {"url": "https://www.debian.org/security/dsa",          "num": 10,  "includeHistoricalEntries": false },
        {"url": "http://www.theguardian.com/media/bbc/rss",     "num": 30,  "includeHistoricalEntries": false },
        {"url": "http://www.lalibre.be/rss/section/actu.xml",   "num": 210, "includeHistoricalEntries": false },
        {"url": "http://planete-play.fr/feed/",                 "num": 20,  "includeHistoricalEntries": false },
        {"url": "http://www.gamergen.com/rss/ps4",              "num": 190, "includeHistoricalEntries": false }
    ];
    
    /*var myFeeds = [
        {"url": "http://www.gamergen.com/rss/ps4",              "num": 190, "includeHistoricalEntries": false }
    ];*/
    
    
    //addFeedsFromMyOnlineAccounts();
    
    var params = {
        "entries": {
            "maxLengthForSmallEntries": "400", // Max number of characters to display an entry as small entry
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
    var feeds_entries           = document.getElementById("feeds-entries");
    
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
    topup.onclick           = function(event) { _onclick(topup, 'disable'); document.getElementById("feeds-entries").scrollTop = 0; }
    closeMainEntry.onclick  = function(event) { closeWindow("main-entry-container", "right"); echo("browser", "", ""); }
    closeFeedsList.onclick  = function(event) { closeWindow("feeds-list-container", "left"); }
    
    //load.onclick            = function(event) { loadFile(); }
    //save.onclick            = function(event) { saveFeed(); }
    
    function loadFeeds() {
        
        console.log('loadFeeds()');
        
        //document.body.dispatchEvent(new CustomEvent('loadFeeds.start', {"detail": ""}));
        
        echo("feeds-list", "Loading...", "");
        
        gf.loadFeeds();
        
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
        
        console.log('dspFeeds()');

        console.log(feeds);
        console.log(feeds.length + ' feeds');
        
        var _htmlFeeds = "";
        
        // ==========================
        // --- Display feeds list ---
        // ==========================
        
        _htmlFeeds = _htmlFeeds + '<h2 data-l10n-id="my-subscriptions-sources">Sources</h2>';
        _htmlFeeds = _htmlFeeds + '<ul>';

        for (var i = 0; i < feeds.length; i++) {
            var _feed = feeds[i];
            _htmlFeeds = _htmlFeeds + '<li><a href="#"><p><button><span data-icon="' + _feed._myPulsationsIcone + '"></span></button>' + (i+1) + '/' + _feed.title + ' <em>(' + _feed._myNbEntries + ')</em> <em>' + _feed._myPulsations + '</em></p><p><time datetime="17:43">' + new Date(_feed._myLastPublishedDate) + '</time></p></a></li>';
        }
        
        _htmlFeeds = _htmlFeeds + '</ul>';
        
        // --- Display ---
        
        echo("feeds-list", _htmlFeeds, "");
    }
    
    function dspEntries(entries) {

        console.log("dspEntries()");
        console.log(entries);
        
        sortedEntries = entries;
        
        var _myTimestamp        = Math.floor(_mySod.getTime() / 1000);
        var _myTimestampInMs    = Math.floor(_mySod.getTime());
        
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
                    //console.log("============================================ " + _previousDaysAgo + ' day(s) ago');
                    _htmlEntries = _htmlEntries + '<div class="feeds-entries-next-day">' + myExtraTranslations['nb-days-ago'].replace('{{n}}', _previousDaysAgo) + '</div>';
                }
                
                //console.log(_entrie._myTimestamp + ' ('+(new Date(_entrie.publishedDate).toUTCString()) +') | '+_myTimestamp+' (' + (new Date(_myTimestamp*1000)).toUTCString() + ') ==> Diff = ' + (_myTimestamp - _entrie._myTimestamp) + ' / ' + _entrieNbDaysAgo + ' day(s) ago / ' + _entrie.title);
                
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
                        _imageUrl = '<div class="my-image-container ratio-image-s"><img src="' + _entrie._myFirstImageUrl + '"/></div>'; 
                    } else {
                        _imageUrl = '<div class="my-image-container ratio-image-l"><img src="' + _entrie._myFirstImageUrl + '"/></div>'; 
                    }
                }
                
                // Entry class ratio ?
                
                var _ratioClass = 'ratio-entry-l';
                
                if ((_diff <= params.entries.maxLengthForSmallEntries) && (!_entrie._myFirstImageUrl)) {
                    _ratioClass = 'ratio-entry-s';
                }
                
                else if ((_diff <= params.entries.maxLengthForSmallEntries) || (!_entrie._myFirstImageUrl)) {
                    _ratioClass = 'ratio-entry-m';
                }
                
                // Content ( Normal / Small )
                
                var _content = "";
                
                if (_diff >= params.entries.maxLengthForSmallEntries) {
                    _content = _content + '<div class="my-entry-l ' + _ratioClass + '" i="' + i + '">';
                    _content = _content + '<div class="my-title">' + i + '/ ' + _entrie.title + '</div>';
                    _content = _content + '<div class="my-feed-title">' + _entrie._myFeedInformations.title + '</div>';
                    _content = _content + _imageUrl;
                    _content = _content + '<div class="my-date">' + _date + '</div>';
                    _content = _content + '<div class="my-snippet">' + _entrie.contentSnippet + '</div>';
                    _content = _content + '</div>';
                    
                } else {
                    _content = _content + '<div class="my-entry-s ' + _ratioClass + '" entry_link="' + _entrie.link + '">';
                    _content = _content + '<div class="my-title">' + i + '/ ' + _entrie.title + '</div>';
                    _content = _content + _imageUrl;
                    _content = _content + '<div class="my-date">' + _date + '</div>';
                    _content = _content + '</div>';
                }
                
                // Add to html entries
                
                _htmlEntries = _htmlEntries + _content;
            
            } else { break; }
            
        }
        
        // Display entries
        
        echo("feeds-entries", _htmlEntries, "");
        
        // ==================
        // --- Add Events ---
        // ==================
        
        // onclick Small Entries:
        
        var _small_entries = document.querySelectorAll(".my-entry-s");
        
        for (var i = 0; i < _small_entries.length; i++) {
            _small_entries[i].onclick = function() { entryFade(this); mainEntryOpenInBrowser(null, this.getAttribute("entry_link")); }
        }
        
        // onclick Normal Entries :
        
        var _entries = document.querySelectorAll(".my-entry-l");
        
        for (var i = 0; i < _entries.length; i++) {
            _entries[i].onclick = function() { entryFade(this); mainEntryOpenInBrowser(this.getAttribute("i"), ""); }
        }

    }
    
    function entryFade(_this) {
        _this.style.cssText = "opacity : 0.4;";
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

            _srcDoc = _srcDoc + _srcDocCss; // Inline CSS from file "style/inline.css.js"
            _srcDoc = _srcDoc + '<div class="entrie-title">' + _entry.title.replace(_regex, "&#39;") + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-date">' + new Date(_entry.publishedDate) + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-author">' + myExtraTranslations['by'] + ' ' + _entry.author + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-feed-title"><a href="' + _entry._myFeedInformations.link + '">' + _entry._myFeedInformations.title + '</a></div>';
            _srcDoc = _srcDoc + '<div class="entrie-contentSnippet">' + _entry.content.replace(_regex, "&#39;") + '</div>';
            
            echo("browser", '<iframe srcdoc=\'' + _srcDoc + '\' sandbox="allow-same-origin allow-scripts" mozbrowser remote></iframe>', "");
        } else {
            echo("browser", '<iframe src="' + url + '" sandbox="allow-same-origin allow-scripts" mozbrowser remote></iframe>', "");
        }
        
        document.getElementById("browser").style.cssText = "display: block;";
        
        main_entry.scrollTop = 0;
        
        openWindow("main-entry-container", "right");
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
        
    /**
     * Open window from left or right
     * @param string divId Div identifiant
     * @param string placement "left", "right" Initial window placement.
     * */
    function openWindow(divId, placement) {
        document.body.style.cssText = "overflow: hidden;"; // Disable scroll in entries list.
        
        var _window = document.getElementById(divId);
        
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
            _window.style.cssText = "transform: translateX(0%);";
        } else {
            _window.style.cssText = "transform: translateX(100%);";
        }
    }
    
    // ======================
    // --- Ready to start ---
    // ======================
    
    window.onload = function () {
        
        // =======================================
        // --- Button [topup] enable / disable ---
        // =======================================
        
        var _topup = {
            "previousScrollTop": 0, 
            "previousStatus": "disabled"
        };
        
        setInterval(function() {

            // Scroll in progress
            
            if (feeds_entries.scrollTop != _topup['previousScrollTop']) {
                
                if (_topup['previousScrollTop'] == 0) { 
                    _onclick(topup, 'enable'); 
                    _topup['previousStatus'] = 'enabled'; 
                }
                
                _topup['previousScrollTop'] = feeds_entries.scrollTop;
            } 
            
            // End scroll
            
            else {
                
                if ((_topup['previousStatus'] == 'enabled') && (feeds_entries.scrollTop == 0)) {
                    _onclick(topup, 'disable'); 
                    _topup['previousStatus'] = 'disabled';
                }
            }
            
        }, 500);
        
        // ==============
        // --- Events ---
        // ==============
        
        browser.addEventListener('mozbrowsererror', function (event) {
            console.dir("Moz Browser loading error : " + event.detail);
        });
    
        document.body.addEventListener('GoogleFeed.load.done', function(event){

            // Add feed entries to array "unsortedEntries"

                gf.addFeed(event.detail.responseData.feed);
            
            // Check if all feeds were loaded
            
                var _nbFeedsToLoad = event.detail.responseData._myParams.nbFeeds;
                var _nbFeedsLoaded = gf.getNbFeedsLoaded();
                gf.setNbFeedsLoaded(++_nbFeedsLoaded);
                
                // Percentage of loading ?
                
                _loading(Math.round((100 * _nbFeedsLoaded) / _nbFeedsToLoad));
                
                // ---

                if (_nbFeedsLoaded == _nbFeedsToLoad) {
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
                    dspEntries(gf.getEntries());
                    dspFeeds(gf.getFeeds());
                    _loading(100); echo("loading", "", "");
                    _onclick(sync, 'enable');
                }
            
            // ---
            
        }, true);
    
        // ============
        // --- Main ---
        // ============

        _onclick(topup, 'disable');     // Disable "topup" button when application start
        _onclick(sync, 'disable');      // Disable "sync" button when application start
        
        _onclick(search, 'disable');    // Not yet implemented
        _onclick(settings, 'disable');  // Not yet implemented
        
        gf.setFeeds(myFeeds);
        gf.loadFeeds();

    };
