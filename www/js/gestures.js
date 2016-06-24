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

function _swipe(_element, callback) {
    myGesture = new Object();
    
    _element.addEventListener("touchstart", function(event) {
        
        myGesture._mouseX       = 0;
        myGesture._mouseY       = 0;
        myGesture._mouseH       = "";
        myGesture._mouseV       = "";
        myGesture._startX       = 0;
        myGesture._startY       = 0;
        myGesture._endX         = 0;
        myGesture._endY         = 0;
        myGesture._action       = "";
        myGesture._scrollTop    = false;
        myGesture._direction    = "";
        myGesture._id           = _element.id;
        
        var _t = event.touches[0];
        myGesture._startX = _t.screenX;
        myGesture._startY = _t.screenY;
        
    }, false);
    
    _element.addEventListener('touchmove', function(event) {
        
        if (document.getElementById('feeds-entries-scroll').scrollTop <= 10) {
            myGesture._scrollTop = true;
        }

        var t = event.touches[0];
        
        if (t.screenX > myGesture._mouseX) { // Mouse direction
            myGesture._mouseH = 'right';
        } else if (t.screenX < myGesture._mouseX) {
            myGesture._mouseH = 'left';
        } else {
        }
        
        if (t.screenY > myGesture._mouseY) { // Mouse direction
            myGesture._mouseV = 'down';
        } else if (t.screenY < myGesture._mouseY) {
            myGesture._mouseV = 'up';
        } else {
        }
        
        myGesture._mouseX = t.screenX;
        myGesture._mouseY = t.screenY;
        myGesture._endX = t.screenX;
        myGesture._endY = t.screenY;
        
        myGesture._direction = _getDirection(myGesture);
        
        // Screen entries : Sync / Open Feeds / Open Settings
        
        if (myGesture._id == 'feeds-entries-scroll') {
                    
            if ((myGesture._scrollTop) && (myGesture._direction == "down")) {
                if (liveValues.network.status == 'online') {
                    ui._loading(1);
                    sync.classList.add("rotation");
                    myGesture._action = 'sync';
                    document.getElementById('feeds-entries-scroll').classList.remove('scroll');
                }
            } else {
                ui._loading(0);
                sync.classList.remove("rotation");
                myGesture._action = "";
            }
        }
        
        // Logs

        my.log('gestures touchmove: id= ' + myGesture._id + ' / direction = ' + myGesture._direction + ' / startX,Y = ' + myGesture._startX + ',' + myGesture._startY + ' / endX,Y = ' + myGesture._endX + ',' + myGesture._endY + " / mouseH = " + myGesture._mouseH + " / mouseV = " + myGesture._mouseV); 

    }, false);

    _element.addEventListener('touchend', function(event) {

        my.log('gestures touchend: id = ' + myGesture._id + ' / scrollTop = ' + myGesture._scrollTop + " / direction = " + myGesture._direction + " / gesture = " + myGesture._action + " / pointerEvents = " + sync.style.pointerEvents + " / mouseH = " + myGesture._mouseH); 
        ui._loading(0);

        // ===============
        // --- Results ---
        // ===============
        
        if (myGesture._id == 'feeds-list-container') {
            if (myGesture._direction == 'left') {
                ui._scrollTo(0);
            }
        }

        if (myGesture._id == 'feeds-entries-scroll') {
            
            // Sync : Launch a sync if no synchro is in progress

            if ((myGesture._scrollTop) && (myGesture._direction == 'down') && sync.classList.contains("enable")) {
                ui._onclick(sync, 'disable');
                loadFeeds();
            }

            // Open feeds from entries screen

            if (myGesture._direction == 'right') {
                ui._scrollTo(-1);
            } 

            // Open Settings from entries screen

            if (myGesture._direction == 'left') {
                ui._translate(dom['screens']['settings'], 'left');
            }
            
            // Re-enable scroll
            
            document.getElementById('feeds-entries-scroll').classList.add('scroll');
        }
        
        if (myGesture._id == 'settings-container') {
            if (myGesture._direction == 'right') {
                ui._translate(dom['screens']['settings'], 'right');
            }
        }

        // ---

        if (myGesture._direction != "") {
            if (typeof callback == 'function') {
                callback(_element, myGesture._direction);
            }
        }
        
        myGesture._mouseX       = 0;
        myGesture._mouseY       = 0;
        myGesture._mouseH       = "";
        myGesture._mouseV       = "";
        myGesture._startX       = 0;
        myGesture._startY       = 0;
        myGesture._endX         = 0;
        myGesture._endY         = 0;
        myGesture._action       = "";
        myGesture._scrollTop    = false;
        myGesture._direction    = "";
        myGesture._id           = "";
        
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
            
        if ((_myGesture._endX > _myGesture._startX) && (_myGesture._mouseH == 'right')) {
            _direction = "right";
        } else if ((_myGesture._endX < _myGesture._startX) && (_myGesture._mouseH == 'left')) { 
            _direction = "left";
        } else {
            _direction = "";
        }

    }
        
    // Vertical gesture
    
    else if ((_distanceY > _distanceX) && (_distanceY > _minY)) {
        
        if ((_myGesture._endY > _myGesture._startY) && (_myGesture._mouseV == 'down')) {
            _direction = "down";
        } else if ((_myGesture._endY < _myGesture._startY) && (_myGesture._mouseV == 'up')) { 
            _direction = "up";
        } else {
            _direction = "";
        }
        
    }
    
    return _direction;
}
