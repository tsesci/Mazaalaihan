// var debugMode = true;

function log(message) {
    if (typeof debugMode === 'undefined' || !debugMode) {
        return;
    }

    console.log(message);
}

function isEnglish(word) {
    return word.match(/^[a-z]/) !== null;
}

function onRuntimeMessage(message, sender, callback) {
    log('received [' + message.command + '] from tab:' + sender.tab.id);

    switch (message.command) {
        case 'log':
            log(message.parameter);
        break;
        case 'find':
            var word = message.parameter;

            if (isEnglish(word)) {
                callback(engmon.find(word));
            } else {
                callback(moneng.find(word));
            }
        break;
    }
}

chrome.runtime.onMessage.addListener(onRuntimeMessage);
