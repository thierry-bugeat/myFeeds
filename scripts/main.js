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
    
    var _myTimestamp;       // Value set by function "_setMyTimestamp()"
    var _idb;               // IndexedDb
    
    var myFeeds = [];       // Store informations about feeds (urls)
    
    //addFeedsFromMyOnlineAccounts();
    
    var params = {
        "feeds": {
            "selectedFeed": ""                  // Display all feeds if empty otherwise display specified feed url
        },
        "entries": {
            "nbDaysAgo": 0,                     // Display only today's entries
            "maxLengthForSmallEntries": "400",  // Max number of characters to display an entry as small entry
            "dontDisplayEntriesOlderThan": "7", // In days
            "displaySmallEntries": false,       // Display small entries. true, false
            "updateEvery": 900                  // Update entries every N seconds
        }
    };
    
    My._load('params.json', function(_myParams){
        console.log('loading params from file params.json ...', _myParams);
        params = _myParams;
    });
    
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
    var settingsOpen            = document.getElementById("settingsOpen");
    var find_feeds              = document.getElementById("find-feeds");
    var findFeedsOpen           = document.getElementById("findFeedsOpen");
    var findFeedsClose          = document.getElementById("findFeedsClose");
    var findFeedsSubmit         = document.getElementById("findFeedsSubmit");
    var share                   = document.getElementById("share");
    var feedsEntriesNbDaysAgo   = document.getElementById("feedsEntriesNbDaysAgo");
        
    //var loadSubscriptions     = document.getElementById("loadSubscriptions");
    //var saveSubscriptions     = document.getElementById("saveSubscriptions");
    
    // DOM clicks :
    
    sync.onclick            = function(event) { _onclick(this, 'disable'); echo("feeds-list", "Loading...", ""); gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan); }
    menu.onclick            = function(event) { openWindow("feeds-list-container", "left"); }
    topup.onclick           = function(event) { _onclick(topup, 'disable'); document.getElementById("feeds-entries").scrollTop = 0; }
    closeMainEntry.onclick  = function(event) { closeWindow("main-entry-container", "right"); echo("browser", "", ""); }
    closeFeedsList.onclick  = function(event) { closeWindow("feeds-list-container", "left"); }
    findFeedsOpen.onclick   = function(event) { openWindow("find-feeds-container", "left"); }
    findFeedsClose.onclick  = function(event) { closeWindow("find-feeds-container", "left"); }
    findFeedsSubmit.onclick = function(event) { var _keywords = document.getElementById("findFeedsText").value; if (_keywords) {echo("find-feeds", "Loading...", ""); gf.findFeeds(_keywords);} }
    settingsOpen.onclick    = function(event) { openWindow("settings-container", "right"); }
    settingsClose.onclick   = function(event) { closeWindow("settings-container", "right"); }
    
    loadSubscriptions.onclick   = function(event) { 
        if (window.confirm(document.webL10n.get('confirm-load-subscriptions'))) {
            My._load(
                'subscriptions.json', 
                function (_mySubscriptions) {
                    console.log(_mySubscriptions);
                    _idb.deleteAll("mySubscriptions");
                    for (var i = 0 ; i < _mySubscriptions.length; i++ ) {
                        _idb.insert("mySubscriptions", _mySubscriptions[i]);
                    }
                    myFeeds = _mySubscriptions;
                    gf.setFeeds(myFeeds);
                    gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
                }
            );
        }
    }
    
    /*saveSubscriptions.onclick   = function(event) {
        if (window.confirm(document.webL10n.get('confirm-save-subscriptions'))) {
            My._save("subscriptions.json", "application/json", JSON.stringify(myFeeds)); 
        }
    }*/
    
    saveSubscriptions.onclick   = function(event) { 
        if (window.confirm(document.webL10n.get('confirm-save-subscriptions'))) {
            var _output = [];
            var _feeds = gf.getFeeds();
            var _feed = "";
            for (var i = 0 ; i < _feeds.length; i++) {
                _url = _feeds[i].feedUrl;
                _feed = {"url": _url, "pulsations": _feeds[i]._myPulsations};
                _output.push(_feed);
            }
            My._save("subscriptions.json", "application/json", JSON.stringify(_output));
        }
    }
    
    nextDay.onclick = function(event) {
        if (params.entries.nbDaysAgo > 0 ) {
            params.entries.nbDaysAgo--;
        }
        _onclick(previousDay, 'enable');
        if (params.entries.nbDaysAgo == 0) {
            _onclick(nextDay, 'disable');
        } else {
            _onclick(nextDay, 'enable');
        }
        dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
        feeds_entries.scrollTop = 0;
    }
    
    previousDay.onclick = function(event) {
        if (params.entries.nbDaysAgo < params.entries.dontDisplayEntriesOlderThan) {
            params.entries.nbDaysAgo++;
        }
        _onclick(nextDay, 'enable');
        if (params.entries.nbDaysAgo == params.entries.dontDisplayEntriesOlderThan) {
            _onclick(previousDay, 'disable');
        } else {
            _onclick(previousDay, 'enable');
        }
        dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
        feeds_entries.scrollTop = 0;
    }
    
    /**
     * Display loading bar.
     * param {int} percentage
     * */
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
    
    function deleteFeed(_this) {
        console.log('deleteFeed() ', arguments);
        
        var _feedUrl = _this.getAttribute("feedUrl");
        var _confirm = window.confirm(document.webL10n.get('confirm-delete-feed'));
        
        if (_confirm) {

            var _tmp = [];
            
            entryFade(_this);
            
            // (1) Delete feedUrl from array "myFeeds"
            
            for (var i = 0; i < myFeeds.length; i++) {
                if (myFeeds[i].url != _feedUrl) {
                    //delete myFeeds[i];
                    _tmp.push(myFeeds[i]);
                    //break;
                }
            }

            myFeeds = _tmp;
            
            // (2) Delete from database
            
            _idb._delete_('mySubscriptions', _feedUrl);
            
            // (3) Reload UI

            if (myFeeds.length > 0) {
                gf.setFeeds(myFeeds);
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            } else {
                echo("feeds-list", "", "");
                echo("feeds-entries", "", "");
                _onclick(sync, 'disable');
            }
        }
    }
    
    function findFeedsDisplayResults(event) {
        console.log('findFeedsDisplayResults()', arguments);
        console.log(event);
        
        if (event.detail.responseStatus == 200) {
            var _results = event.detail.responseData.entries;
            var _htmlResults = "<ul>";
            
            for (var i = 0 ; i < _results.length; i++) {
                _htmlResults = _htmlResults + '<li><a href="#"><p><button class="addNewFeed" feedUrl="' + _results[i].url + '"><span data-icon="add"></span></button>' + _results[i].title + '</p><p><time>' + _results[i].url + '</time></p></a></li>';
            }
            
            _htmlResults = _htmlResults + "</ul>";
        
            echo("find-feeds", _htmlResults, "");
            
            // ==================
            // --- Add Events ---
            // ==================
            
            // onclick delete button :
            
            var _adds = document.querySelectorAll(".addNewFeed");
            
            for (var i = 0; i < _adds.length; i++) {
                _adds[i].onclick = function() { findFeedsAddNewFeed(this);}
            }
        
        } else {
            echo("find-feeds", "Find feeds : Network error", "prepend");
        }
    }
    
    function findFeedsAddNewFeed(_this) {
        console.log('findFeedsAddNewFeed() ', arguments);
        
        var _feedUrl = _this.getAttribute("feedUrl");
        var _confirm = window.confirm(document.webL10n.get('confirm-add-feed'));
        
        if (_confirm) {
            
            var _myNewFeed = {"url": _feedUrl, "pulsations": 20};
            
            // (1) Add feedUrl to array "myFeeds"

            myFeeds.push(_myNewFeed);
            
            // (2) Add into database
            
            _idb.insert('mySubscriptions', _myNewFeed);
            
            // (3) Reload UI
            
            gf.setFeeds(myFeeds);
            gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
        }
    }
    
    function dspSettings() {
        var _now = new Date();
        var _minutes = _now.getMinutes();
        
        if (_minutes < 10) {
            _minutes = "0" + _minutes;
        }
        
        // Small entries selector
        
        if (params.entries.displaySmallEntries) {
            _displaySmallEntriesChecked = 'checked=""';
        } else {
            _displaySmallEntriesChecked = "";
        }
        
        // Update every 
        
        var _every = [900, 1800, 3600]; // In seconds
        var _htmlSelectUpdateEvery = "";
        var _selected = "";
        
        _htmlSelectUpdateEvery = _htmlSelectUpdateEvery + '<select id="selectUpdateEvery">';

        for (var i = 0; i < _every.length; i++) {
            if (params.entries.updateEvery == _every[i]) {
                _selected = "selected";
            } else {
                _selected = "";
            }
            _htmlSelectUpdateEvery = _htmlSelectUpdateEvery + '<option value="' + _every[i] + '" ' + _selected + ' >' + Math.floor(_every[i] / 60) + 'min</option>';
        }
        
        _htmlSelectUpdateEvery = _htmlSelectUpdateEvery + '</select>';
        
        // Max nb Days 
        
        var _days = [3, 5, 7, 10];
        var _htmlMaxNbDays = "";
        var _selected = "";
        
        _htmlMaxNbDays = _htmlMaxNbDays + '<select id="selectMaxNbDays">';

        for (var i = 0; i < _days.length; i++) {
            if (params.entries.dontDisplayEntriesOlderThan == _days[i]) {
                _selected = "selected";
            } else {
                _selected = "";
            }
            _htmlMaxNbDays = _htmlMaxNbDays + '<option value="' + _days[i] + '" ' + _selected + ' >' + _days[i] + '</option>';
        }
        
        _htmlMaxNbDays = _htmlMaxNbDays + '</select>';
        
        // ---
        
        var _htmlSettings = [
        '<h2>' + document.webL10n.get('settings-feeds') + '</h2>                                                                                            ',
        '<ul>                                                                                                                                               ',
        '   <li><span data-icon="reload"></span>' + document.webL10n.get('settings-last-update') + _now.getHours() + ':' + _minutes + '</li>                ',
        '   <li><span data-icon="sync"></span>' + document.webL10n.get('settings-update-every') + _htmlSelectUpdateEvery + '</li>                               ',
        '</ul>                                                                                                                                              ',
        '<h2>' + document.webL10n.get('settings-news') + '</h2>                                                                                             ',
        '<ul>                                                                                                                                               ',
        '   <li><span data-icon="messages"></span>' + document.webL10n.get('settings-small-news') + '<div><label class="pack-switch"><input id="toggleDisplaySmallEntries" type="checkbox" ' + _displaySmallEntriesChecked + '><span></span></label></div></li>',
        '   <li><span data-icon="messages"></span>' + document.webL10n.get('settings-number-of-days') + _htmlMaxNbDays + '</li> ',
        '</ul>                                                                                                                                              '
        ].join(''); 

        echo("settings", _htmlSettings, "");
        
        // ==================
        // --- Add Events ---
        // ==================
        
        document.getElementById('toggleDisplaySmallEntries').onclick = function(e) {
            params.entries.displaySmallEntries = !params.entries.displaySmallEntries;
            _saveParams();
        }
        
        var _selectUpdateEvery = document.getElementById('selectUpdateEvery');
        _selectUpdateEvery.onchange = function(e) {
            params.entries.updateEvery = _selectUpdateEvery.options[_selectUpdateEvery.selectedIndex].value;
            _saveParams();
        }
        
        var _selectMaxNbDays = document.getElementById('selectMaxNbDays');
        _selectMaxNbDays.onchange = function(e) {
            params.entries.dontDisplayEntriesOlderThan = _selectMaxNbDays.options[_selectMaxNbDays.selectedIndex].value;
            _saveParams();
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
        
        _htmlFeeds = _htmlFeeds + '<li><a href="#" class="open" feedUrl=""><p>' + document.webL10n.get('all-feeds') + '</p></a></li>';

        for (var i = 0; i < feeds.length; i++) {
            var _feed = feeds[i];
            _htmlFeeds = _htmlFeeds + '<li><a href="#" class="open" feedUrl="' + _feed.feedUrl + '"><p><button class="delete" feedUrl="' + _feed.feedUrl + '"><span data-icon="delete"></span></button><button><span data-icon="' + _feed._myPulsationsIcone + '"></span></button>' + (i+1) + '/' + _feed.title + ' <em>(' + _feed._myPulsations + ')</em></p><p><time>' + new Date(_feed._myLastPublishedDate) + '</time></p></a></li>';
        }

        _htmlFeeds = _htmlFeeds + '</ul>';
        
        // --- Display ---
        
        echo("feeds-list", _htmlFeeds, "");
        
        // ==================
        // --- Add Events ---
        // ==================
        
        // onclick delete button :
        
        var _deletes = document.querySelectorAll(".delete");
        
        for (var i = 0; i < _deletes.length; i++) {
            _deletes[i].onclick = function(e) { 
                e.stopPropagation();
                e.preventDefault();
                deleteFeed(this);
            }
        }
        
        // onclick open feed : 
        
        var _opens = document.querySelectorAll(".open");
        
        for (var i = 0; i < _opens.length; i++) {
            _opens[i].onclick = function() { 
                closeWindow("feeds-list-container", "left");
                params.entries.nbDaysAgo = 0;
                params.feeds.selectedFeed = this.getAttribute("feedUrl");
                _saveParams();
                dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
            }
        }
    }
    
    function dspEntries(entries, nbDaysAgo, feedUrl) {

        console.log("dspEntries()", arguments);
        console.log(entries);
        
        sortedEntries = entries;
        
        _setMyTimestamp();
        
        var _timestampMin = _myTimestamp - (86400 * nbDaysAgo);
        var _timestampMax = _myTimestamp - (86400 * nbDaysAgo) + 86400;
        
        var _previousDaysAgo    = -1; // Count days to groups entries by day.
        var _entrieNbDaysAgo    = 0;
        
        var _nbEntriesDisplayed = 0;
        
        // =======================
        // --- Display entries ---
        // =======================
                    
        var _htmlEntries = "";
        var _htmlFeedTitle = "";
        var _firstEntrie = true;

        for (var i = 0; i < sortedEntries.length; i++) {

            // Get entries of specific feed or get all entries.
            
            var _entrie = "";
            
            if ((feedUrl !== "") && (feedUrl == sortedEntries[i]._myFeedInformations.feedUrl)) {
                var _entrie = sortedEntries[i];
                if (_firstEntrie) {
                    _htmlFeedTitle = _htmlFeedTitle + '<h2>' + _entrie._myFeedInformations.title + '</h2>'; // Specific feed title
                    _firstEntrie = false;
                }
            } else if (feedUrl == "") {
                var _entrie = sortedEntries[i];
            }
            
            // ---
            
            if ((_entrie._myTimestamp >= _timestampMin) && (_entrie._myTimestamp < _timestampMax)) {
                
                if ((_myTimestamp - _entrie._myTimestamp) < (params.entries.dontDisplayEntriesOlderThan * 86400)) {
                    
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
                        
                        _nbEntriesDisplayed++;
                        
                    } else if (params.entries.displaySmallEntries) {
                        _content = _content + '<div class="my-entry-s ' + _ratioClass + '" entry_link="' + _entrie.link + '">';
                        _content = _content + '<div class="my-title">' + i + '/ ' + _entrie.title + '</div>';
                        _content = _content + _imageUrl;
                        _content = _content + '<div class="my-date">' + _date + '</div>';
                        _content = _content + '</div>';
                        
                        _nbEntriesDisplayed++;
                    }
                    
                    // Add to html entries
                    
                    _htmlEntries = _htmlEntries + _content;
                
                } else { break; }
            }
            
        }
        
        // --- Display Today / Yesterday / Nb days ago ---

        if (nbDaysAgo == 0) {
            _daySeparator = document.webL10n.get('nb-days-ago-today');
        } else if (nbDaysAgo == 1) {
            _daySeparator = document.webL10n.get('nb-days-ago-yesterday');
        } else {
            _daySeparator = myExtraTranslations['nb-days-ago'].replace('{{n}}', nbDaysAgo);
        }
        
        echo('feedsEntriesNbDaysAgo', _daySeparator, '');
        
        // Display entries
        
        if (_nbEntriesDisplayed > 0) {
            echo("feeds-entries", _htmlFeedTitle + _htmlEntries, "");
        } else {
            echo("feeds-entries", _htmlFeedTitle + '<div class="notification">' + document.webL10n.get('no-news-today') + '</div>', "");
        }
        
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
    
    function _file_informations(filename) {
        var sdcard = navigator.getDeviceStorage('sdcard');

        var request = sdcard.get("myFeeds/" + filename);

        request.onsuccess = function () {
            var file = this.result;
            console.log("Get the file: ", file);
        }

        request.onerror = function () {
            console.warn("Unable to get the file: " + this.error);
        }
    }
    
    function mainEntryOpenInBrowser(entryId, url) {
        console.log('mainEntryOpenInBrowser()', arguments);
        document.body.style.cssText = "overflow: hidden;";  // Disable scroll in entries list.

        if (entryId !== null) {
            var _entry = sortedEntries[entryId];
            var _srcDoc = "";
            var _regex = new RegExp("'", "g");
            var _author = "";
            
            share.setAttribute("i", entryId);
            
            if (_entry.author !== "") {
                _author = '<div class="entrie-author">' + myExtraTranslations['by'] + ' ' + _entry.author + '</div>';
            }

            _srcDoc = _srcDoc + _srcDocCss; // Inline CSS from file "style/inline.css.js"
            _srcDoc = _srcDoc + '<div class="entrie-title">' + _entry.title.replace(_regex, "&#39;") + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-date">' + new Date(_entry.publishedDate) + '</div>';
            _srcDoc = _srcDoc + _author;
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
     * @param {null}
     * Update feeds pulsations once all feeds are loaded.
     * Update array "myFeeds" & indexedDb database.
     * */
    function updateFeedsPulsations() {
        var _tmp = [];
        var _feeds = gf.getFeeds();
        var _pulsations;
        var _feed = '';

        for (var i = 0 ; i < myFeeds.length; i++) {
            
            for (var j = 0 ; j < _feeds.length; j++) {
                
                if (myFeeds[i].url == _feeds[j].feedUrl) {

                    _url        = _feeds[j].feedUrl;
                    _pulsations = _feeds[j]._myPulsations;
                    
                    if (isNaN(_pulsations)) {
                        // do nothing
                    } else {
                        myFeeds[i].pulsations = _pulsations;
                        _idb.update("mySubscriptions", _url, {url: _url, pulsations: _pulsations});
                    }
                    
                    break;
                }
            }
        }
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
            _window.style.cssText = "transform: translateX(0%); -webkit-transition-duration: 0.5s; transition-duration: 0.5s;";
        } else {
            _window.style.cssText = "transform: translateX(100%); -webkit-transition-duration: 0.5s; transition-duration: 0.5s;";
        }
    }
    
    /**
     * Set start of day timestamp.
     * @param {null}
     * */
    function _setMyTimestamp() {
        var _now    = new Date();
        var _year   = _now.getFullYear();
        var _month  = _now.getMonth();
        var _day    = _now.getDate();
        
        var _mySod = new Date(_year, _month, _day, '00','00','00');
        
        _myTimestamp = Math.floor(_mySod.getTime() / 1000);
    }
    
    // Callback from event "idb.open.onsuccess"
    // 1st feeds loading.
    
    function initAndLoadFeeds(results) {
        console.log('start arguments: ', arguments);

        // Add feeds from indexedDb database
        
        for (var i = 0; i < results.length; i++) {
            myFeeds.push(results[i]);
        }        
        
        // No feeds sets.
        // Use default feeds ?
        
        if (myFeeds.length == 0) {
            var _confirm = window.confirm(document.webL10n.get('confirm-populate-database'));
            if (_confirm) {
                var _populateDatabase = [
                    {"url": "https://www.reddit.com/r/FireFoxOS/.rss",          "pulsations": 2},
                    {"url": "http://www.webupd8.org/feeds/posts/default",       "pulsations": 2},
                    {"url": "http://metro.co.uk/sport/football/feed/",          "pulsations": 5},
                    {"url": "http://sourceforge.net/blog/feed/",                "pulsations": 2},
                    {"url": "http://www.gorillavsbear.net/category/mp3/feed/",  "pulsations": 2},
                    {"url": "http://www.wired.com/feed/",                       "pulsations": 5}
                ];
                
                for (var i = 0; i < _populateDatabase.length; i++) {
                    _idb.insert('mySubscriptions', _populateDatabase[i]);
                    myFeeds.push(_populateDatabase[i]);
                }
            }
        }
        
        // 1st feeds loading
        
        gf.setFeeds(myFeeds);
        gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
    }
    
    function _saveParams() {
        var _tmpParams = params;
        _tmpParams.entries.nbDaysAgo = 0;   // Reset nbDaysAgo value before saving file.
        My._save("params.json", "application/json", JSON.stringify(_tmpParams));
    }
    
    // ======================
    // --- Ready to start ---
    // ======================
    
    window.onload = function () {
        
        _swipe("");

        // =====================
        // --- Open Database ---
        // =====================

        var _idbParams = {
            "databaseName"  : "myFeeds",
            "tableName"     : "mySubscriptions",
            "version"       : 1,
            "keyPath"       : "url",
            "indexs": {
                "url"       : {"unique": true  },
                "pulsations": {"unique": false }
            }
        };
        
        _idb.open(_idbParams);
        
        // =================================
        // --- Button load subscriptions ---
        // =================================
        // Disable button if subscriptions file doesn't exists.
        
        My._file_exists('subscriptions.json', function(exists){
            if (!exists) {
                _onclick(loadSubscriptions, 'disable');
            }
        });
        
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
        
        // Automatic update entries every N seconds :
        
        setInterval(function() {
            _onclick(sync, 'disable');
            gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
        }, (params.entries.updateEvery * 1000));
        
        // Share entry :
        
        share.onclick = function() {
            console.log(this);
            var _entryId = this.getAttribute("i");
            var _entry = sortedEntries[_entryId];
            console.log(_entry);
            new MozActivity({
                name: "share",
                data: {
                    number: 1,
                    url: "mailto:?subject=" + encodeURIComponent(_entry.title) + "&body=" + encodeURIComponent(_entry.link)
                }
            });
        };
        
        // ---
        
        document.body.addEventListener('idb.open.onsuccess', function(event){
        
            _idb.select("mySubscriptions", "url", "*", initAndLoadFeeds); // Load feeds from indexedDb database then initAndLoadFeeds()
            //_idb.deleteDatabase('myFeeds');
        });
    
        document.body.addEventListener('GoogleFeed.load.done', function(event){
            
            // Save feed as file
            
                My._save('cache/feeds/' + btoa(event.detail.responseData.feed.feedUrl) + ".json", "application/json", JSON.stringify(event.detail.responseData.feed));

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
                    dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
                    dspFeeds(gf.getFeeds());
                    dspSettings();
                    updateFeedsPulsations();
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

                if (_nbFeedsLoaded == _nbFeedsToLoad) {
                    dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
                    dspFeeds(gf.getFeeds());
                    dspSettings();
                    updateFeedsPulsations();
                }
                
                if (_nbFeedsLoaded >= _nbFeedsToLoad) {
                    _loading(100); echo("loading", "", "");
                    _onclick(sync, 'enable');
                }
            
            // ---
            
        }, true);
        
        document.body.addEventListener('GoogleFeed.find.done', findFeedsDisplayResults, true)
    
        // ============
        // --- Main ---
        // ============

        _onclick(topup, 'disable');     // Disable "topup" button when application start
        _onclick(sync, 'disable');      // Disable "sync" button when application start
        _onclick(nextDay, 'disable');
        
        _onclick(search, 'disable');    // Not yet implemented
    };
