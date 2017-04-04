/**
 * Copyright 2016 Thierry BUGEAT
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

/* =================================== */
/* --- Listeners TinyTinyRss Class --- */
/* =================================== */

var MyListeners_TinyTinyRss = function() {
 
        document.body.addEventListener('TinyTinyRss.login.done', function(response){
            liveValues['login']['inProgress']['tinytinyrss'] = true;
            my.log('TinyTinyRss.getToken()', tinytinyrss.getToken());
            params.accounts.tinytinyrss.logged = true;
            _save('params');
            document.getElementById('tinytinyrssCheckbox').checked = true; // Enable settings checkbox
            document.getElementById('tinytinyrssForm').style.cssText = 'display: none';
            tinytinyrss.getSubscriptions(); // CustomEvent TinyTinyRss.getSubscriptions.done, TinyTinyRss.getSubscriptions.error
        });

        document.body.addEventListener('TinyTinyRss.login.error', function(response){
            var _error = response.detail.message || "";
            my.log('CustomEvent : TinyTinyRss.login.error', arguments);
            my.message("Tiny Tiny Rss login error\n" + _error);
        });

        document.body.addEventListener('TinyTinyRss.getSubscriptions.done', function(response){
            my.log('CustomEvent : TinyTinyRss.getSubscriptions.done', response);
            var _subscriptions = response.detail.content;
            var _feed = '';
            var _newFeeds = [];
            for (var i = 0; i < _subscriptions.length; i++) {
                _feed = {
                    'url': _subscriptions[i].feed_url,
                    'pulsations': params['feeds']['defaultPulsations'],
                    'account': 'tinytinyrss',
                    'id': _subscriptions[i].id
                };
                _newFeeds.push(_feed);
            }
            addNewSubscriptions(_newFeeds);
            sp.setFeedsSubscriptions(myFeedsSubscriptions);
            
            if (liveValues['login']['inProgress']['tinytinyrss'] == true ) {
                liveValues['login']['inProgress']['tinytinyrss'] = false;
                loadFeeds();
            }
            
            my._save("subscriptions.tinytinyrss.json", "application/json", JSON.stringify(myFeedsSubscriptions.tinytinyrss)).then(function(results) {
                my.log("Save file subscriptions.tinytinyrss.json");
            }).catch(function(error) {
                my.error("ERROR saving file subscriptions.tinytinyrss.json", error);
                my.alert("ERROR saving file subscriptions.tinytinyrss.json");
            });
            my._save("cache/tinytinyrss/subscriptions.json", "application/json", JSON.stringify(_subscriptions)).then(function(results) {
                my.log("Save file cache/tinytinyrss/subscriptions.json");
            }).catch(function(error) {
                my.error("ERROR saving file cache/tinytinyrss/subscriptions.json", error);
                my.alert("ERROR saving file cache/tinytinyrss/subscriptions.json");
            });
        });

        document.body.addEventListener('TinyTinyRss.getSubscriptions.error', function(response) {
            my.log('CustomEvent : TinyTinyRss.getSubscriptions.error', arguments);
            my.alert(document.webL10n.get('tinytinyrss-get-subscriptions-error') + JSON.stringify(response.detail.message));
        });


}

