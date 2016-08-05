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
    
// DOM elements :

var main                    = document.getElementById('main');
var main_entry_container    = document.getElementById("main-entry-container");
var main_entry              = document.getElementById("main-entry");
var browser                 = document.getElementById("browser");
var loading                 = document.getElementById("loading");
var feeds_list              = document.getElementById("feeds-list");
var sync                    = document.getElementById("sync");
var menu                    = document.getElementById("menu");
var dom = {
    "topups": {
        "entries":  document.getElementById("topup"),
        "feeds":    document.getElementById("topupFeedsList")
    },
    "entry": {
        "next": {
            "button":   document.getElementById("nextEntry"),
            "title":    document.getElementById("nextEntryTitle")
        },
        "previous": {
            "button":   document.getElementById("previousEntry"),
            "title":    document.getElementById("previousEntryTitle")
        }
    },
    "screens": {
        "entries": {
            "scroll":   document.getElementById("feeds-entries-scroll"),
            "content":  document.getElementById("feeds-entries-content"),
        },
        "settings": document.getElementById('settings-container'),
        "feeds": document.getElementById('feeds-list-container'),
        "find": document.getElementById('find-feeds-container')
    }
};
var search                  = document.getElementById("search");
var settingsOpen            = document.getElementById("settingsOpen");
var settingsClose           = document.getElementById("settingsClose");
var find_feeds              = document.getElementById("find-feeds");
var findFeedsOpen           = document.getElementById("findFeedsOpen");
var findFeedsClose          = document.getElementById("findFeedsClose");
var findFeedsSubmit         = document.getElementById("findFeedsSubmit");
var shareFeedsList          = document.getElementById("shareFeedsList");
var feedsEntriesNbDaysAgo   = document.getElementById("feedsEntriesNbDaysAgo");
//var feedsEntriesFooter      = document.getElementById("feeds-entries-footer");
var displayGrid             = document.getElementById("displayGrid");
var displayCard             = document.getElementById("displayCard");
var displayList             = document.getElementById("displayList");
var searchEntries           = document.getElementById("searchEntries");
var resetSearchEntries      = document.getElementById("resetSearchEntries");
var findFeedsReset          = document.getElementById("findFeedsReset");
var useAnimations           = document.getElementById("useAnimations");

/* ============ */
/* --- MyUi --- */
/* ============ */
   
var MyUi = function() {
    _MyUi = this;
}

MyUi.prototype.init = function() {

    _MyUi._onclick(dom.topups['entries'], 'disable');   // Disable "topup" button when application start
    _MyUi._onclick(dom.topups['feeds'], 'disable');     // Disable "topupFeedsList" button when application start
    _MyUi._onclick(sync, 'disable');                // Disable "sync" button when application start
    _MyUi._onclick(nextDay, 'disable');
    
    _MyUi.selectThemeIcon();
    
    // ================================================
    // --- Button [topupFeedsList] enable / disable ---
    // ================================================
    
    var _topupFeedsList = {
        "previousScrollTop": 0, 
        "previousStatus": "disabled"
    };
    
    setInterval(function() {
        
        if (!liveValues.animations.inProgress) {
        
            // Scroll in progress

            if (feeds_list.scrollTop != _topupFeedsList['previousScrollTop']) {
                
                if (_topupFeedsList['previousScrollTop'] == 0) { 
                    _MyUi._onclick(dom.topups['feeds'], 'enable'); 
                    _topupFeedsList['previousStatus'] = 'enabled'; 
                }
                
                _topupFeedsList['previousScrollTop'] = feeds_list.scrollTop;
            } 
            
            // End scroll
            
            else {
                
                if ((_topupFeedsList['previousStatus'] == 'enabled') && (feeds_list.scrollTop == 0)) {
                    _MyUi._onclick(dom.topups['feeds'], 'disable'); 
                    _topupFeedsList['previousStatus'] = 'disabled';
                }
            }

        }
        
    }, 500);
    
    topupFeedsList.onclick = function(event) { 
        _MyUi._vibrate();
        _MyUi._onclick(dom.topups['feeds'], 'disable'); 
        feeds_list.scrollTop = 0; 
    }
        
    // =======================================
    // --- Button [topup] enable / disable ---
    // =======================================
    
    var _topup = {
        "previousScrollTop": 0, 
        "previousStatus": "disabled"
    };
    
    setInterval(function() {
        
        if (!liveValues.animations.inProgress) {
        
            // Scroll in progress
            
            if (dom['screens']['entries']['scroll'].scrollTop != _topup['previousScrollTop']) {
                
                if (_topup['previousScrollTop'] == 0) { 
                    _MyUi._onclick(dom.topups['entries'], 'enable'); 
                    _topup['previousStatus'] = 'enabled'; 
                }
                
                _topup['previousScrollTop'] = dom['screens']['entries']['scroll'].scrollTop;
            } 
            
            // End scroll
            
            else {
                
                if ((_topup['previousStatus'] == 'enabled') && (dom['screens']['entries']['scroll'].scrollTop == 0)) {
                    _MyUi._onclick(dom.topups['entries'], 'disable'); 
                    _topup['previousStatus'] = 'disabled';
                }
            }

        }
        
    }, 500);
    
    topup.onclick = function(event) { 
        _MyUi._vibrate();
        _MyUi._onclick(dom.topups['entries'], 'disable'); 
        dom['screens']['entries']['scroll'].scrollTop = 0; 
    }
    
    // ==============
    // --- Events ---
    // ==============
        
    this.bind();
};

MyUi.prototype.bind = function() {
    
};

/**
 * Enable or disable UI element.
 * Change opacity and enable or disable click event.
 * @param {string} DOM ID element
 * @param {string} "enable", "disable"
 * https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
 * */
MyUi.prototype._onclick = function(_this, pointerEvents) {
    //console.log(_this);
    
    if (_this !== null) {
        if (pointerEvents == 'enable') {
            _this.classList.remove("disable");
            _this.classList.add("enable");
            if (_this.id == 'sync') {sync.classList.remove("rotation");}
        } else {
            _this.classList.remove("enable");
            _this.classList.add("disable");
            if (_this.id == 'sync' && (liveValues.network.status == 'online')) {sync.classList.add("rotation");}
        }
    }
}

/**
 * Return status of specified element id
 * @param {string} _this
 * @return {string} enable|disable|
 * */
MyUi.prototype._status = function(_this) {
    var _status = "";

    if (_this !== null) {
        if (_this.classList.contains("enable")) {
            _status = "enable";
        } else {
            _status = "disable";
        }
    }

    return _status;
}

/**
 * Enable UI elements.
 * */
MyUi.prototype._enable = function() {
    _MyUi.toggle('enable');
}

/**
 * Disable UI elements.
 * */
MyUi.prototype._disable = function() {
    _MyUi.toggle('disable');
}

/**
 * Change opacity of UI elements when network connection change.
 * @param {string} _status "enable", "disable"
 * */
MyUi.prototype.toggle = function(_status) {
    
    // ==========================
    // --- CSS class _online_ ---
    // ==========================
    
    var _items = document.querySelectorAll("._online_");
    for (var i = 0; i < _items.length; i++) {
        _MyUi._onclick(_items[i], _status);
    }
    
    // Small entries :
                
    if (!params.entries.displaySmallEntries) {
        _MyUi._smallEntries('hide');
    }
    
    // =======================
    // --- Settings screen ---
    // =======================
    
    // 1) Update settings message

       try {
            _MyUi.echo("onLine", liveValues.network.status, "");
       } catch(e) {
            _MyUi.echo("onLine", _status, "");
       }

    // =============
    // --- Proxy ---
    // =============
    // If proxy is in use, disable online account(s) who
    // does not support proxy.

    if (_status == 'enable') { 
        _MyUi.toggleProxy();
    }
}

/**
 * Change opacity of UI elements when proxy checkbox change.
 * Affect elements with class _proxyNotAvailable_
 * */
MyUi.prototype.toggleProxy = function() {
    
    // Enable online accounts when proxy is not used.
    
    if (!params.settings.proxy.use) {
        var _items = document.querySelectorAll("._proxyNotAvailable_");
        for (var i = 0; i < _items.length; i++) {
            _MyUi._onclick(_items[i], 'enable');
        }
    }

    // Disable elements for which proxy is not yet implemented
    
    else {
        var _items = document.querySelectorAll("._proxyNotAvailable_");
        for (var i = 0; i < _items.length; i++) {
            _MyUi._onclick(_items[i], 'disable');
        }
    }

}

/**
 * Output one html string in div element
 * 
 * @param {string} divId    : Div id element
 * @param {string} msg      : Html string to write
 * @param {string} placement: "append", "prepend", ""
 * */
MyUi.prototype.echo = function(divId, msg, placement) {
    var _out = document.getElementById(divId);
    if (!_out) { return; }
    
    if (placement == 'prepend') {
        //_out.innerHTML = msg + _out.innerHTML;
        _out.insertAdjacentHTML('afterbegin', msg);
    } else if (Boolean(placement)) {
        //_out.innerHTML = _out.innerHTML + msg;
        _out.insertAdjacentHTML('beforeend', msg);
    } else {
        _out.innerHTML = msg;
    }

}

/**
 * Display loading bar.
 * param {int} percentage
 * */
MyUi.prototype._loading = function(percentage) {
    if (percentage >= 100) {
        loading.style.cssText = "width: 0%";
    } else {
        loading.style.cssText = "width: " + percentage + "%";
    }
}

/**
 * Scroll main div to specified screen.
 * @param {screenX} int
 * 0 : Search feed  (mainLeft)
 * 1 : Feeds list   (mainLeft)
 * 0 : Entries list (main)
 * 1 : Entry        (main)
 * */
MyUi.prototype._scrollTo = function(screenX) {
    if (screenX == 0) {
        liveValues.screens.feedsList.opened = false;
    } else if (screenX == -1) {
        liveValues.screens.feedsList.opened = true;
    }

    if (params.settings.ui.animations) {
        _MyUi._smoothScrollTo(screenX, 250);
    } else {
        _MyUi._quickScrollTo(screenX);
    }
}

MyUi.prototype._quickScrollTo = function(screenX) {
    window.setTimeout(function() {
        
        if (screenX == -1) {
            var _x = (dom['screens']['feeds'].scrollWidth + 'px').toString();   /* Screen feeds list */
            dom['screens']['feeds'].classList.remove('back');
        } else if (screenX == -2) {
            dom['screens']['feeds'].classList.add('back'); return;              /* Screen find feeds */
        } else {
            var _x = ('-' + (screenX * 50) + '%').toString();                   /* Screens entries or main entry */
        }

        main.style.cssText = 'transform: translateX('+_x+');';
        
    }); // Schedule the execution for later
}

MyUi.prototype._smoothScrollTo = function(screenX, duration) {
    
    window.setTimeout(function() {
        
        if (screenX == -1) {
            var _x = (dom['screens']['feeds'].scrollWidth + 'px').toString();
            dom['screens']['feeds'].classList.remove('back');
        } else if (screenX == -2) {
            dom['screens']['feeds'].classList.add('back'); return;
        } else {
            var _x = ('-' + (screenX * 50) + '%').toString();
        }

        main.style.cssText = 'transition: transform 0.25s ease; transform: translateX('+_x+');';
        
    }); // Schedule the execution for later
}

MyUi.prototype._translate = function(id, direction) {
    window.setTimeout(function() {
        
        if (direction == 'left') {
            var _x = '-100%';
        } else {
            var _x = '100%';
        }
           
        if (params.settings.ui.animations) {
            id.style.cssText = 'transition: transform 0.25s ease; transform: translateX('+_x+');';
        } else {
            id.style.cssText = 'transform: translateX(' + _x + ');';
        }

    }); // Schedule the execution for later
}

/**
 * Show/Hide small entries
 * @param {string} status "hide" "show"
 * */
MyUi.prototype._smallEntries = function (status) {
    
    var _small_entries = document.querySelectorAll("._small_");

    for (var i = 0; i < _small_entries.length; i++) {
        if (status == "show") {
            _small_entries[i].classList.remove("_hide");
            _small_entries[i].classList.add("_show"); 
        } else {
            _small_entries[i].classList.remove("_show");
            _small_entries[i].classList.add("_hide"); 
        }
    }
    
    // From status hide (unchecked) to status show (checked)
    // => Reset small entries opacity
    
    if (status == "show") {
        var _tmp = (liveValues.network.status == 'online') ? "enable" : "disable";
        for (var i = 0; i < _small_entries.length; i++) {
            _MyUi._onclick(_small_entries[i], _tmp); 
        }
    }
}
    
/**
 * Change element opacity
 * @param {string} _this DOM element
 * @return {null}
 * */
MyUi.prototype.fade = function (_this) {
    _MyFeeds.log('MyUi.prototype.fade()', _this);
    _this.style.cssText = "opacity : 0.4;";
}

/**
 * Colorize specified DOM element
 * @param {string|object} DOM id or DOM element
 * @return {null}
 * */
MyUi.prototype.colorize = function (_domElement) {
     try {
        _domElement.classList.add('colorize');
    } catch (e) {
        try {
            document.getElementById(_domElement).classList.add('colorize');
        } catch (e) {
        }
    }
}

/**
 * Uncolorize all childs of specified DOM element
 * @param {string} DOM ID element
 * @return {null}
 * */
MyUi.prototype.uncolorize = function (_domId) {
    var _childs = document.getElementById(_domId).querySelectorAll("*");
    for (var i = 0; i < _childs.length; i++) {
        _childs[i].classList.remove('colorize');
    }
}

MyUi.prototype.selectThemeIcon = function () {
    if (params.entries.theme == 'grid') {
        _MyUi._onclick(displayGrid, 'disable');
        _MyUi._onclick(displayCard, 'enable');
        _MyUi._onclick(displayList, 'enable');
    } else if (params.entries.theme == 'card') {
        _MyUi._onclick(displayGrid, 'enable');
        _MyUi._onclick(displayCard, 'disable');
        _MyUi._onclick(displayList, 'enable');
    } else {
        _MyUi._onclick(displayGrid, 'enable');
        _MyUi._onclick(displayCard, 'enable');
        _MyUi._onclick(displayList, 'disable');
    }
};

MyUi.prototype._vibrate = function () {
    if (params.settings.ui.vibrate) {
        try {
            window.navigator.vibrate(50);
        } catch (e) {
        }
    }
}

/**
 * Load images who are visibles in viewport.
 * Use images from navigator cache if network is offline.
 * */
MyUi.prototype.loadImages = function () {
    var images = document.getElementsByTagName('img');
    
    for (var i = 0; i < images.length; i++) {
        
        var _dataSrc = images[i].getAttribute('data-src');
        
        if (liveValues.network.status == 'online') {
            
            if (_MyUi.isInViewport(images[i]) 
                && (_dataSrc != "")
                && (images[i].getAttribute('src') == "img/loading.png")
            ){
                images[i].setAttribute('src', _dataSrc);
                if (!liveValues.entries.imagesPreviouslyDisplayed.contains(_dataSrc)) {
                    liveValues.entries.imagesPreviouslyDisplayed.push(_dataSrc);
                }
            }
            
        } else {
        
            if (_MyUi.isInViewport(images[i]) 
                && liveValues.entries.imagesPreviouslyDisplayed.contains(_dataSrc)
            ){
                images[i].setAttribute('src', _dataSrc);
            }
            
        }
    }
}

/**
 * Show entries who are in viewport.
 * Content of entry is displayed only when entry is in viewport.
 * */
MyUi.prototype.showEntries = function () {
    //var _divs = document.querySelectorAll("div.my-list-entry-s, div.my-list-entry-m, div.my-list-entry-l, div.my-grid-entry-s, div.my-grid-entry-m, div.my-grid-entry-l, div.my-card-entry-s, div.my-card-entry-m, div.my-card-entry-l");
    var _divs = document.querySelectorAll("div.i");

    // --- v1

    for (var i = 0; i < _divs.length; i++) {
        if ((_divs[i].innerHTML === '') && ui.isInViewport(_divs[i])) {
            var _tsms = _divs[i].getAttribute('tsms');
            _MyFeeds.log('MyUi.prototype.showEntries()', _tsms);
            _divs[i].innerHTML = liveValues['entries']['html'][_tsms];
        }
    }
    
    // --- v2
    
    // Estimate starting "i" value :
    
    /*var _scrollHeight = dom['screens']['entries']['scroll'].scrollHeight;
    var _scrollPosition = dom['screens']['entries']['scroll'].scrollTop;
    
    var _i = Math.round(_divs.length * (_scrollPosition / _scrollHeight));
    
    var j = _divs[_i].getAttribute('i');
    _divs[_i].innerHTML = liveValues['entries']['html'][j];*/
    
}

/**
 * Change opacity of news previously displayed
 * */
MyUi.prototype.markAsReadV1 = function () {
    for (_tsms in liveValues.entries.newsPreviouslyDisplayed) { 
        try {
            ui.fade(document.getElementById(liveValues.entries.newsPreviouslyDisplayed[_tsms])); 
        } catch (e) {
            _MyFeeds.log('MyUi.prototype.markAsRead : Error ' + _tsms);
        }
    }
}

/**
 * Mark news as read by changing CSS style.
 * Change opacity of news previously displayed.
 * @param {object} elem DOM element or not set
 * @return null
 * */
MyUi.prototype.markAsRead = function (entryId) {
    _MyFeeds.log('MyUi.prototype.markAsRead(' + entryId + ')');

    if (typeof entryId !== 'undefined') {
        if (!liveValues.entries.newsPreviouslyDisplayed.contains(entryId)) {
            liveValues.entries.newsPreviouslyDisplayed.push(entryId);
            try {
                ui.fade(document.getElementById(entryId)); 
            } catch(e) {
                _MyFeeds.log('MyUi.prototype.markAsRead(' + entryId + ') Error ');
            }
        }
    } else {
        for (_tsms in liveValues.entries.newsPreviouslyDisplayed) { 
            try {
                ui.fade(document.getElementById(liveValues.entries.newsPreviouslyDisplayed[_tsms])); 
            } catch (e) {
                _MyFeeds.log('MyUi.prototype.markAsRead(' + _tsms + ') Error ');
            }
        }
    }
}

/**
 * Check if element is visible in viewport
 * @param {object} elem DOM element
 * @return {boolean} true / false
 * */
MyUi.prototype.isInViewport = function (element) {
    //var firstElementHeight = dom['screens']['entries']['content'].children[0].clientHeight;
    var rect = element.getBoundingClientRect()
    
    var windowHeight = (window.innerHeight || document.documentElement.clientHeight) * 2;
    var windowWidth = window.innerWidth || document.documentElement.clientWidth

    return rect.bottom > 0 && rect.top < windowHeight && rect.right > 0 && rect.left < windowWidth
}

/* ================= */
/* --- UI Events --- */
/* ================= */

settingsOpen.onclick    = function(event) {ui._vibrate(); ui._translate(dom['screens']['settings'], 'left');}
settingsClose.onclick   = function(event) {ui._vibrate(); ui._translate(dom['screens']['settings'], 'right');}

menu.onclick            = function(event) {
    ui._vibrate();
    (liveValues.screens.feedsList.opened) ? ui._scrollTo(0) : ui._scrollTo(-1);
}

closeFeedsList.onclick  = function(event) {ui._vibrate(); ui._scrollTo(0);}

/* Class _startAnimation_ */

var _animations = document.querySelectorAll("._startAnimation_");

for (var i = 0; i < _animations.length; i++) {
    _animations[i].onmousedown = function() {
        if (params.settings.ui.animations) {
            liveValues.animations.inProgress = true;
        } else {
            liveValues.animations.inProgress = false;
        }
    }
}

/* Detect end of animation */

document.addEventListener("transitionend", function(){liveValues.animations.inProgress = false;}, false);

