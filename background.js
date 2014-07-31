// var debugMode = true;

function log(message) {
    if (typeof debugMode === 'undefined' || !debugMode) {
        return;
    }

    console.log(message);
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

chrome.runtime.onMessage.addListener(onRuntimeMessage);
