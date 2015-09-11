/*
 * @param {array} entries
 * @param {int} nbDaysAgo
 * @param {string} feedUrl
 * @param {string} theme
 * */

var entries = [];
var nbDaysAgo = 1;
var feedUrl = '';
var theme = '';
var dontDisplayEntriesOlderThan = 7;
var maxLengthForSmallEntries = 400;

var _myTimestamp;   // Value set by function "_setMyTimestamp()"

/*importScripts('/libs/l10n.js');*/

self.addEventListener('message', function(e) {
    var data = e.data;
    
    switch (data.cmd) {
        case 'start':
            console.log('Posting message back to main script : ' + data.msg);
            self.postMessage('Worker STARTED: ' + data.msg);
            break;
        case 'stop':
            console.log('Posting message back to main script : ' + data.msg);
            self.postMessage('Worker STOPPED: ' + data.msg);
            self.close();
            break;
        case 'dspEntries':
            console.log('worker > dspEntries()', data);
            _setMyTimestamp();
            entries     = data.entries;
            nbDaysAgo   = data.nbDaysAgo;
            feedUrl     = data.feedUrl;
            theme       = data.theme;
            dontDisplayEntriesOlderThan = data.dontDisplayEntriesOlderThan;
            dspEntries(entries, nbDaysAgo, feedUrl, theme);
            break;
        default:
            self.postMessage('worker > entries unknown command');
    };
    
}, false);

// =================
// --- Functions ---
// =================

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
    
function dspEntries(entries, nbDaysAgo, feedUrl, _theme) {
    var start = performance.now();

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

    for (var i = 0; i < entries.length; i++) {

        // Get entries of specific feed or get all entries.

        var _entrie = "";

        if ((feedUrl !== "") && (feedUrl == entries[i]._myFeedInformations.feedUrl)) {
            var _entrie = entries[i];
            if (_firstEntrie) {
                _htmlFeedTitle = _htmlFeedTitle + '<h2>' + _entrie._myFeedInformations.title + '</h2>'; // Specific feed title
                _firstEntrie = false;
            }
        } else if (feedUrl == "") {
            var _entrie = entries[i];
        }

        // ---

        if ((_entrie._myTimestamp >= _timestampMin) && (_entrie._myTimestamp < _timestampMax)) {

            if ((_myTimestamp - _entrie._myTimestamp) < (dontDisplayEntriesOlderThan * 86400)) {

                //console.log(_entrie._myTimestamp + ' ('+(new Date(_entrie.publishedDate).toUTCString()) +') | '+_myTimestamp+' (' + (new Date(_myTimestamp*1000)).toUTCString() + ') ==> Diff = ' + (_myTimestamp - _entrie._myTimestamp) + ' / ' + _entrieNbDaysAgo + ' day(s) ago / ' + _entrie.title);

                // ---

                // Date analyse
                // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Date/toLocaleString
                // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/DateTimeFormat

                // Time
                
                var _date = new Date(_entrie.publishedDate);
                var _minutes = (_date.getMinutes() < 10) ? '0' + _date.getMinutes() : _date.getMinutes();
                var _time = _date.getHours() + ':' + _minutes;

                // Diff between "contentSnippet" et "content" ?
                // Small article or not ?

                var _diff = _entrie.content.length - _entrie.contentSnippet.length;

                // 1st image

                var _imageUrl = "";
                
                // Try to detect broken image
                /*var _img = new Image(); 
                _img.src = _entrie._myFirstImageUrl; 

                if (!_img.complete) {
                    _entrie._myFirstImageUrl = "";
                }*/

                if (_entrie._myFirstImageUrl) {
                    if (_diff < maxLengthForSmallEntries) {
                        _imageUrl = '<span class="my-'+_theme+'-image-container '+_theme+'-ratio-image-s"><img src="' + _entrie._myFirstImageUrl + '"/></span>';
                    } else {
                        _imageUrl = '<span class="my-'+_theme+'-image-container '+_theme+'-ratio-image-l"><img src="' + _entrie._myFirstImageUrl + '"/></span>';
                    }
                }

                // Entry class ratio ?

                var _ratioClass = _theme + '-ratio-entry-l';

                if ((_diff <= maxLengthForSmallEntries) && (!_entrie._myFirstImageUrl)) {
                    _ratioClass = _theme + '-ratio-entry-s';
                }

                else if ((_diff <= maxLengthForSmallEntries) || (!_entrie._myFirstImageUrl)) {
                    _ratioClass = _theme + '-ratio-entry-m';
                }

                // Account icone ?

                var _accountIcone = '';

                if (_entrie._myFeedInformations._myAccount != 'local') {
                    _accountIcone = '<img src="images/' + _entrie._myFeedInformations._myAccount + '.' + _theme + '.png" />';
                }

                // Content ( Normal / Small )

                var _content = "";

                if ((theme == 'list') && (_diff >= maxLengthForSmallEntries)) {
                    _content = _content + '<div class="my-'+_theme+'-entry-l ' + _ratioClass + '" i="' + i + '">';
                    _content = _content + '<span class="my-'+_theme+'-feed-title">' + _entrie._myFeedInformations.title + '</span>';
                    _content = _content + '<span class="my-'+_theme+'-date">' + _time + '</span>';
                    _content = _content + '<div class="my-'+_theme+'-image-wrapper">' + _imageUrl + '</div>';
                    _content = _content + '<span class="my-'+_theme+'-title">' + _accountIcone + _entrie.title + '</span>';
                    _content = _content + '<span class="my-'+_theme+'-snippet">' + _entrie.contentSnippet + '</span>';
                    _content = _content + '<div class="my-'+_theme+'-footer"></div>';
                    _content = _content + '</div>';

                    _nbEntriesDisplayed++;

                } else if (theme == 'list') {
                    _content = _content + '<div class="_online_ small my-'+_theme+'-entry-s ' + _ratioClass + '" i="' + i + '" entry_link="' + _entrie.link + '">';
                    _content = _content + '<span class="my-'+_theme+'-feed-title">' + _entrie._myFeedInformations.title + '</span>';
                    _content = _content + '<span class="my-'+_theme+'-date">' + _time + '</span>';
                    _content = _content + '<div class="my-'+_theme+'-image-wrapper">' + _imageUrl + '</div>';
                    _content = _content + '<span class="my-'+_theme+'-title">' + _accountIcone + _entrie.title + '</span>';
                    _content = _content + '<span class="my-'+_theme+'-snippet">' + _entrie.contentSnippet + '</span>';
                    _content = _content + '<div class="my-'+_theme+'-footer"></div>';
                    _content = _content + '</div>';

                    _nbEntriesDisplayed++;

                } else if (_diff >= maxLengthForSmallEntries) {
                    _content = _content + '<div class="my-'+_theme+'-entry-l ' + _ratioClass + '" i="' + i + '">';
                    _content = _content + '<span class="my-'+_theme+'-title">' + _accountIcone + _entrie.title + '</span>';
                    _content = _content + '<span class="my-'+_theme+'-feed-title">' + _entrie._myFeedInformations.title + '</span>';
                    _content = _content + _imageUrl;
                    _content = _content + '<span class="my-'+_theme+'-date">' + _time + '</span>';
                    _content = _content + '<span class="my-'+_theme+'-snippet">' + _entrie.contentSnippet + '</span>';
                    _content = _content + '</div>';

                    _nbEntriesDisplayed++;

                } else {
                    _content = _content + '<div class="_online_ small my-'+_theme+'-entry-s ' + _ratioClass + '" i="' + i + '" entry_link="' + _entrie.link + '">';
                    _content = _content + '<span class="my-'+_theme+'-title">' + _accountIcone + _entrie.title + '</span>';
                    _content = _content + '<span class="my-'+_theme+'-feed-title">' + _entrie._myFeedInformations.title + '</span>';
                    _content = _content + _imageUrl;
                    _content = _content + '<span class="my-'+_theme+'-date">' + _time + '</span>';
                    _content = _content + '</div>';

                    _nbEntriesDisplayed++;
                }

                // Add to html entries

                _htmlEntries = _htmlEntries + _content;

            } else { break; }
        }

    }

    // =========================
    // --- Send html content ---
    // =========================

    if (_nbEntriesDisplayed > 0) {
        
        self.postMessage({
            "cmd": "end",
            "html": _htmlFeedTitle + _htmlEntries,
            "params": {
                "feedUrl": feedUrl,
                "nbDaysAgo": nbDaysAgo,
                "theme": theme
            }
        });
        
    } else if (_nbEntriesDisplayed == 0) {

        self.postMessage({
            "cmd": "end",
            "html": '<div class="notification">no-news-today</div>',
            "params": {
                "feedUrl": feedUrl,
                "nbDaysAgo": nbDaysAgo,
                "theme": theme
            }
        });
        
    } else {

        self.postMessage({
            "cmd": "end",
            "html": '<div class="notification">error-no-network-connection</div>',
            "params": {
                "feedUrl": feedUrl,
                "nbDaysAgo": nbDaysAgo,
                "theme": theme
            }
        });
        
    } 


    var end = performance.now();
    console.log("dspEntries() " + (end - start) + " milliseconds.")
}
