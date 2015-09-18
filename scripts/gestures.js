/**
 * Example : https://developer.mozilla.org/en-US/docs/Web/API/Touch_events#Example
 * */

function _swipe(callback) {
    myGesture = new Object();
    
    myGesture._startX       = 0;
    myGesture._startY       = 0;
    myGesture._endX         = 0;
    myGesture._endY         = 0;
    myGesture._action       = "";
    myGesture._scrollTop    = false;
    
    var _element = document.getElementById("feeds-entries");
    
    var direction = "";
    
    _element.addEventListener("touchstart", function(event) {
        //event.preventDefault();
        direction = "";
        var _t = event.touches[0];
        myGesture._startX = _t.screenX;
        myGesture._startY = _t.screenY;
        
        // (1) Sync
        
        if (document.getElementById('feeds-entries').scrollTop == 0) {
            myGesture._scrollTop = true;
        }
        
    }, false);
    
    _element.addEventListener('touchmove', function(event) {

        var t = event.touches[0];
        
        myGesture._endX = t.screenX;
        myGesture._endY = t.screenY;
        
        myGesture._direction = _getDirection(myGesture);
        
        var _deltaX = myGesture._startX - myGesture._endX;
        var _deltaY = myGesture._endY - myGesture._startY;
        if (_deltaX > 60) {_deltaX = 60;}
        if (_deltaX < -60) {_deltaX = -60;}
        if (_deltaY > 60) {_deltaY = 60;}
        if (_deltaY < -60) {_deltaY = -60;}
        
        // Sync animation
        
        if ((_deltaY >= 0) && (myGesture._scrollTop)) {
            if (navigator.onLine) {
                ui._loading(1);
                sync.classList.add("rotation");
            }
        } else {
            ui._loading(0);
            sync.classList.remove("rotation");
        }
       
        // (1) Sync
        
        if ((myGesture._direction == "down") && (myGesture._scrollTop)) {

            myGesture._action = 'sync';
            
            if ((myGesture._startY - myGesture._endY) <= -60) {
                myGesture._startY -= ((myGesture._startY - myGesture._endY) + 60); // Move _startY
            } else if ((myGesture._startY - myGesture._endY) >= 60) {
                myGesture._startY -= ((myGesture._startY - myGesture._endY) - 60); // Move _startY
            }
        }
        
        // (2) Open feeds
        // (3) Open settings
        
        else if ((myGesture._startX - myGesture._endX) <= -60) {
            myGesture._startX -= ((myGesture._startX - myGesture._endX) + 60); // Move _startX
            if (params.settings.ui.animations) {ui._scrollTo(1.9);}
            myGesture._action = 'openFeeds';
        } else if ((myGesture._startX - myGesture._endX) >= 60) {
            myGesture._startX -= ((myGesture._startX - myGesture._endX) - 60); // Move _startX
            if (params.settings.ui.animations) {ui._scrollTo(2.1);}
            myGesture._action = 'openSettings';
        } else {
            if (params.settings.ui.animations) {ui._scrollTo(2);}
            myGesture._action = '';
        }
        
        my.log('startX,Y = ' + myGesture._startX + ',' + myGesture._startY + ' / endX,Y = ' + myGesture._endX + ',' + myGesture._endY + ' / delta X,Y = ' + _deltaX + ',' + _deltaY);
        
    }, false);
    
    _element.addEventListener('touchend', function(event) {
        
        my.log('scrollTop = ' + myGesture._scrollTop + " / direction = " + myGesture._direction + " / gesture = " + myGesture._action + " / pointerEvents = " + sync.style.pointerEvents); 
        
        ui._loading(0);
        
        // ===============
        // --- Results ---
        // ===============
        
        // Sync : Launch a sync if no synchro is in progress
        
        if ((myGesture._action == "sync") && sync.classList.contains("enable")) {
            ui._onclick(sync, 'disable');
            gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
        }
        
        // Open feeds from entries screen
        
        if ((myGesture._action = 'openFeeds') && (myGesture._direction == 'right')) {
            ui._scrollTo(1);
        } 
        
        // Open Settings from entries screen
        
        if ((myGesture._action = 'openSettings') && (myGesture._direction == 'left')) {
            ui._scrollTo(3);
        } 

        // ---

        if (myGesture._direction != "") {
            if (typeof callback == 'function') {
                callback(_element, myGesture._direction);
            }
        }
        
        myGesture._startX       = 0;
        myGesture._startY       = 0;
        myGesture._endX         = 0;
        myGesture._endY         = 0;
        myGesture._action       = "";
        myGesture._scrollTop    = false;
        myGesture._direction    = "";
        
    }, false); 
    
}

function _getDirection(_myGesture) {
    
    var _minX = 55;  // Min X swipe for horizontal swipe
    var _minY = 55;  // Min Y swipe for vertical swipe
    
    var _distanceX = 0;
    var _distanceY = 0;
    var _direction = "";
    
    _distanceX = Math.abs(_myGesture._startX - _myGesture._endX); 
    _distanceY = Math.abs(_myGesture._startY - _myGesture._endY); 
    
    // Horizontal detection
    
    if ((_distanceX > _distanceY) && (_distanceX > _minX)) {
            
        if (_myGesture._endX > _myGesture._startX) {
            _direction = "right";
        } else { 
            _direction = "left";
        }

    }
        
    // Vertical gesture
    
    else if ((_distanceY > _distanceX) && (_distanceY > _minY)) {
        
        if (_myGesture._endY > _myGesture._startY) {
            _direction = "down";
        } else {
            _direction = "up";
        }
        
    }
    
    return _direction;
}
