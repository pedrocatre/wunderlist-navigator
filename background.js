(function () {
    'use strict';

    chrome.commands.onCommand.addListener(function(command) {
        console.log('got command');
        // Send a message to the active tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var activeTab = tabs[0];
            chrome.tabs.sendMessage(activeTab.id, {'message': 'open-wunderlist-navigator'});
        });
    });
}());