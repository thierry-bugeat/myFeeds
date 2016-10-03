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

/* ============================== */
/* --- Listeners Feedly Class --- */
/* ============================== */

var MyListeners_Feedly = function() {

        document.body.addEventListener('Feedly.login.done', function(response){
            liveValues['login']['inProgress']['feedly'] = true;
            my.log(feedly.getToken());
            params.accounts.feedly.logged = true;
            _saveParams();
            document.getElementById('feedlyLogin').checked = true; // Enable settings checkbox
            feedly.getSubscriptions(); // CustomEvent Feedly.getSubscriptions.done, Feedly.getSubscriptions.error
        });

        document.body.addEventListener('Feedly.login.error', function(response){
            my.log('CustomEvent : Feedly.login.error', arguments);
            my.message('Feedly login error');
        });

        document.body.addEventListener('Feedly.getSubscriptions.done', function(response){
            my.log('CustomEvent : Feedly.getSubscriptions.done');
            var _subscriptions = response.detail;
            var _feed = '';
            var _newFeeds = [];
            for (var i = 0; i < _subscriptions.length; i++) {
                _feed = {
                    'url': _subscriptions[i].id.substr(5, _subscriptions[i].id.length),
                    'pulsations': params['feeds']['defaultPulsations'],
                    'account': 'feedly',
                    'id': _subscriptions[i].id
                };
                _newFeeds.push(_feed);
            }
            addNewSubscriptions(_newFeeds);
            sp.setFeedsSubscriptions(myFeedsSubscriptions);
            
            if (liveValues['login']['inProgress']['feedly'] == true ) {
                liveValues['login']['inProgress']['feedly'] = false;
                loadFeeds();
            }
            
            my._save("subscriptions.feedly.json", "application/json", JSON.stringify(myFeedsSubscriptions.feedly)).then(function(results) {
                my.log("Save file subscriptions.feedly.json");
            }).catch(function(error) {
                my.error("ERROR saving file subscriptions.feedly.json", error);
                my.alert("ERROR saving file subscriptions.feedly.json");
            });
            my._save("cache/feedly/subscriptions.json", "application/json", JSON.stringify(_subscriptions)).then(function(results) {
                my.log("Save file cache/feedly/subscriptions.json");
            }).catch(function(error) {
                my.error("ERROR saving file cache/feedly/subscriptions.json", error);
                my.alert("ERROR saving file cache/feedly/subscriptions.json");
            });
        });

        document.body.addEventListener('Feedly.getSubscriptions.error', function(response) {
            my.log('CustomEvent : Feedly.getSubscriptions.error', arguments);
            my.alert(document.webL10n.get('feedly-get-subscriptions-error') + JSON.stringify(response.detail.message));
        });

}

