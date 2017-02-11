/**
 * Copyright 2017 Thierry BUGEAT
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

/* ================================ */
/* --- Listeners Wallabag Class --- */
/* ================================ */

var MyListeners_Wallabag = function() {
 
        document.body.addEventListener('Wallabag.login.done', function(response){
            liveValues['login']['inProgress']['wallabag'] = true;
            my.log('Wallabag.getToken()', wallabag.getToken());
            params.accounts.wallabag.logged = true;
            _saveParams();
            document.getElementById('wallabagCheckbox').checked = true; // Enable settings checkbox
            document.getElementById('wallabagForm').style.cssText = 'display: none';
            /////////wallabag.getSubscriptions(); // CustomEvent Wallabag.getSubscriptions.done, Wallabag.getSubscriptions.error
        });

        document.body.addEventListener('Wallabag.login.error', function(response){
            var _error = response.detail.message || "";
            my.log('CustomEvent : Wallabag.login.error', arguments);
            my.message("Wallabag login error\n" + _error);
        });
        
        document.body.addEventListener('Wallabag.add.done', function(response){
            my.log('CustomEvent : Wallabag.add.done', response);
            my.message(document.webL10n.get('wallabag-add-url-done'));
        });
        
        document.body.addEventListener('Wallabag.add.error', function(response){
            my.log('CustomEvent : Wallabag.add.error', response);
            my.message(document.webL10n.get('wallabag-add-url-error'));
        });

        document.body.addEventListener('Wallabag.getSubscriptions.done', function(response){
            my.log('CustomEvent : Wallabag.getSubscriptions.done', response);
            var _subscriptions = response.detail.content;
            var _feed = '';
            var _newFeeds = [];
            for (var i = 0; i < _subscriptions.length; i++) {
                _feed = {
                    'url': _subscriptions[i].feed_url,
                    'pulsations': params['feeds']['defaultPulsations'],
                    'account': 'wallabag',
                    'id': _subscriptions[i].id
                };
                _newFeeds.push(_feed);
            }
            addNewSubscriptions(_newFeeds);
            sp.setFeedsSubscriptions(myFeedsSubscriptions);
            
            if (liveValues['login']['inProgress']['wallabag'] == true ) {
                liveValues['login']['inProgress']['wallabag'] = false;
                loadFeeds();
            }
            
            my._save("subscriptions.wallabag.json", "application/json", JSON.stringify(myFeedsSubscriptions.wallabag)).then(function(results) {
                my.log("Save file subscriptions.wallabag.json");
            }).catch(function(error) {
                my.error("ERROR saving file subscriptions.wallabag.json", error);
                my.alert("ERROR saving file subscriptions.wallabag.json");
            });
            my._save("cache/wallabag/subscriptions.json", "application/json", JSON.stringify(_subscriptions)).then(function(results) {
                my.log("Save file cache/wallabag/subscriptions.json");
            }).catch(function(error) {
                my.error("ERROR saving file cache/wallabag/subscriptions.json", error);
                my.alert("ERROR saving file cache/wallabag/subscriptions.json");
            });
        });

        document.body.addEventListener('Wallabag.getSubscriptions.error', function(response) {
            my.log('CustomEvent : Wallabag.getSubscriptions.error', arguments);
            my.alert(document.webL10n.get('wallabag-get-subscriptions-error') + JSON.stringify(response.detail.message));
        });


}

