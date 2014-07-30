// chrome.browserAction.debugMode = true;

if (typeof chrome.browserAction.isEnabled === 'undefined') {
    chrome.browserAction.isEnabled = false;
}

function log(message) {
    if (typeof chrome.browserAction.debugMode === 'undefined' || !chrome.browserAction.debugMode) {
        return;
    }

    console.log(message);
}

function sendMessage(tabId, command, parameter) {
    var message = {
        command: command,
        parameter: parameter,
    };

    if (tabId !== null) {
        chrome.tabs.sendMessage(tabId, message);

        return;
    }

    chrome.tabs.query({}, function(tabs) {
        for (var i = 0; i < tabs.length; ++i) {
            chrome.tabs.sendMessage(tabs[i].id, message);
        }
    });
}

function activateInjection() {
    log('activating injection...');

    chrome.browserAction.isEnabled = true;
    chrome.browserAction.setIcon({
        path: 'icons/icon_38.png',
    });
    dictionary.load();
    sendMessage(null, 'activate');

    log('activated injection');
}

function deactivateInjection() {
    log('deactivating injection...');

    chrome.browserAction.isEnabled = false;
    chrome.browserAction.setIcon({
        path: 'icons/disabled_icon_38.png',
    });
    dictionary.unload();
    sendMessage(null, 'deactivate');

    log('deactivated injection');
}

function onBrowserActionClicked(tab) {
    if (chrome.browserAction.isEnabled) {
        deactivateInjection();

        return;
    }

    activateInjection();
};

function onTabsUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status !== 'complete') {
        return;
    }

    log('tab:' + tabId + ' is reloaded or updated');

    if (chrome.browserAction.isEnabled) {
        sendMessage(tabId, 'activate');
    }
}

function onRuntimeMessage(message, sender, callback) {
    log('received [' + message.command + '] from tab:' + sender.tab.id);

    switch (message.command) {
        case 'log':
            log(message.parameter);
        break;
        case 'find':
            var result = dictionary.find(message.parameter);
            callback(result);
        break;
    }
}

chrome.browserAction.onClicked.addListener(onBrowserActionClicked);
chrome.tabs.onUpdated.addListener(onTabsUpdated);
chrome.runtime.onMessage.addListener(onRuntimeMessage);
