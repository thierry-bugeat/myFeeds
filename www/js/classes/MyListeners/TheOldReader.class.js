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

/* ==================================== */
/* --- Listeners TheOldReader Class --- */
/* ==================================== */

var MyListeners_TheOldReader = function() {

        document.body.addEventListener('TheOldReader.login.done', function(response){
            liveValues['login']['inProgress']['theoldreader'] = true;
            my.log('TheOldReader.getToken()', theoldreader.getToken());
            params.accounts.theoldreader.logged = true;
            _saveParams();
            document.getElementById('theoldreaderCheckbox').checked = true; // Enable settings checkbox
            document.getElementById('theoldreaderForm').style.cssText = 'display: none';
            theoldreader.getSubscriptions(); // CustomEvent TheOldReader.getSubscriptions.done, TheOldReader.getSubscriptions.error
        });

        document.body.addEventListener('TheOldReader.login.error', function(response){
            my.log('CustomEvent : TheOldReader.login.error', arguments);
            my.message('The Old Reader login error');
        });

        document.body.addEventListener('TheOldReader.getSubscriptions.done', function(response){
            my.log('CustomEvent : TheOldReader.getSubscriptions.done', response);
            var _subscriptions = response.detail.subscriptions;
            var _feed = '';
            var _newFeeds = [];
            for (var i = 0; i < _subscriptions.length; i++) {
                _feed = {
                    'url': _subscriptions[i].url,
                    'pulsations': params['feeds']['defaultPulsations'],
                    'account': 'theoldreader',
                    'id': _subscriptions[i].id
                };
                _newFeeds.push(_feed);
            }
            addNewSubscriptions(_newFeeds);
            sp.setFeedsSubscriptions(myFeedsSubscriptions);
            
            if (liveValues['login']['inProgress']['theoldreader'] == true ) {
                liveValues['login']['inProgress']['theoldreader'] = false;
                loadFeeds();
            }
            
            my._save("subscriptions.theoldreader.json", "application/json", JSON.stringify(myFeedsSubscriptions.theoldreader)).then(function(results) {
                my.log("Save file subscriptions.theoldreader.json");
            }).catch(function(error) {
                my.error("ERROR saving file subscriptions.theoldreader.json", error);
                my.alert("ERROR saving file subscriptions.theoldreader.json");
            });
            my._save("cache/theoldreader/subscriptions.json", "application/json", JSON.stringify(_subscriptions)).then(function(results) {
                my.log("Save file cache/theoldreader/subscriptions.json");
            }).catch(function(error) {
                my.error("ERROR saving file cache/theoldreader/subscriptions.json", error);
                my.alert("ERROR saving file cache/theoldreader/subscriptions.json");
            });
        });

        document.body.addEventListener('TheOldReader.getSubscriptions.error', function(response) {
            my.log('CustomEvent : TheOldReader.getSubscriptions.error', arguments);
            my.alert(document.webL10n.get('theoldreader-get-subscriptions-error') + JSON.stringify(response.detail.message));
        });
 
}
