// it seems like javascripts don't conflict each other, but css can be conflicted
// http://stackoverflow.com/questions/7213883/how-can-i-use-jquery-in-a-chrome-extension-content-script-when-an-older-version
// https://developer.chrome.com/extensions/content_scripts#execution-environment
// http://stackoverflow.com/questions/10568065/limit-the-scope-of-bootstrap-styles/14145510#14145510

var loadingWindow = ' \
<div class="mazaalai"> \
    <div class="modal fade" id="_mazaalaiLoadingWindow" tabindex="-1" role="dialog" aria-hidden="true" style="display: none;"> \
        <div class="modal-dialog"> \
            <div class="modal-content"> \
                <div class="modal-header"> \
                    <h2 class="modal-title" align="left">Мазаалайхан</h2> \
                </div> \
                <div class="modal-body"> \
                    <p>Ачааллаж байна. Түр хүлээнэ үү...</p> \
                    <div class="progress progress-striped active"> \
                        <div class="progress-bar progress-bar-info" role="progressbar" style="width: 100%"> \
                        </div> \
                    </div> \
                </div> \
            </div> \
        </div> \
    </div> \
</div>';
var popoverWindow = ' \
<div class="mazaalai"> \
    <div class="popover" id="_mazaalaiPopoverWindow"> \
    </div> \
</div>';
$('body').prepend(loadingWindow);
$('body').prepend(popoverWindow);
$popoverWindow = $('#_mazaalaiPopoverWindow');
$loadingWindow = $('#_mazaalaiLoadingWindow');

var lastWord = null;

function log(message) {
    chrome.runtime.sendMessage({
        command: 'log',
        parameter: message,
    });
}

// http://stackoverflow.com/a/3710561
// http://dom.spec.whatwg.org/#dom-range-detach
function getWordAtPoint(element, x, y) {
    if (element.nodeType == element.TEXT_NODE) {
        var range = element.ownerDocument.createRange();
        range.selectNodeContents(element);
        var currentPos = 0;
        var endPos = range.endOffset;

        while (currentPos + 1 < endPos) {
            range.setStart(element, currentPos);
            range.setEnd(element, currentPos + 1);

            if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right >= x && range.getBoundingClientRect().top <= y && range.getBoundingClientRect().bottom >= y) {
                range.expand('word');
                var ret = range.toString();

                return ret;
            }

            currentPos += 1;
        }
    } else {
        for (var i = 0; i < element.childNodes.length; i++) {
            var range = element.childNodes[i].ownerDocument.createRange();
            range.selectNodeContents(element.childNodes[i]);

            if (range.getBoundingClientRect().left <= x && range.getBoundingClientRect().right >= x && range.getBoundingClientRect().top <= y && range.getBoundingClientRect().bottom >= y) {
                return getWordAtPoint(element.childNodes[i], x, y);
            }
        }
    }

    return null;
}

// it cleans non-word characters
function cleanWord(word) {
    if (word === null) {
        return null;
    }

    matches = word.toLowerCase().match(/[a-z]+/);

    if (matches === null) {
        return null;
    }

    return matches[0];
}

function showLoadingWindow() {
    $loadingWindow.modal({
        backdrop: 'static',
        keyboard: false
    });
}

function hideLoadingWindow() {
    $loadingWindow.modal('hide');
}

function buildPopoverWindow(result) {
    var titleClass = 'bg-success';
    var resultHTML = '';

    $popoverWindow.html('');
    if (result.length !== 1) {
        titleClass = 'bg-danger';
    }

    for (var i = 0; i < result.length; i++) {
        resultHTML += '<div class="popover-title ' + titleClass + '"><p>' + result[i]['eng'] + '</p></div>';
        resultHTML += '<div class="popover-content"><p class="small">' + result[i]['mon'] + '</p></div>';
    }

    resultHTML += '<div class="popover-title" style="background-color: #f7f7f7;"><p class="small" align="right">&copy; 2014, Barbayar Dashzeveg</p></div>';

    $popoverWindow.append(resultHTML);
}

function showPopoverWindow(x, y) {
    var popoverWindowWidth = $popoverWindow.width();
    var popoverWindowHeight = $popoverWindow.height();
    var popoverWindowX = x + 10;
    var popoverWindowY = y - popoverWindowHeight / 2;

    var popoverWindowTop = popoverWindowY;
    var popoverWindowBottom = popoverWindowTop + popoverWindowHeight;
    var popoverWindowLeft = popoverWindowX;
    var popoverWindowRight = popoverWindowLeft + popoverWindowWidth;
    var windowTop = $(window).scrollTop();
    var windowBottom = windowTop + $(window).height();
    var windowLeft = $(window).scrollLeft();
    var windowRight = windowLeft + $(window).width();

    if (popoverWindowRight > windowRight) {
        popoverWindowX = x - popoverWindowWidth - 10;
    }

    if (popoverWindowBottom > windowBottom) {
        popoverWindowY = windowBottom - popoverWindowHeight;
    }

    if (popoverWindowTop < windowTop) {
        popoverWindowY = windowTop;
    }

    $popoverWindow.css('left', popoverWindowX + 'px');
    $popoverWindow.css('top', popoverWindowY + 'px');
    $popoverWindow.show();
}

function onMouseMove(event) {
    var word = getWordAtPoint(event.target, event.x, event.y);
    word = cleanWord(word);

    if (word === lastWord) {
        return;
    }

    lastWord = word;

    if (word === null) {
        $popoverWindow.hide();

        return;
    }

    chrome.runtime.sendMessage({
        command: 'find',
        parameter: word,
    }, function(result) {
        buildPopoverWindow(result);
        showPopoverWindow(event.pageX, event.pageY);
    });
}

function onRuntimeMessage(message) {
    log('received [' + message.command + '] from background');

    switch (message.command) {
        case 'activate':
            window.removeEventListener('mousemove', onMouseMove, false);
            window.addEventListener('mousemove', onMouseMove, false);
        break;
        case 'deactivate':
            window.removeEventListener('mousemove', onMouseMove, false);
        break;
        case 'loading':
            if (message.parameter) {
                showLoadingWindow();
            } else {
                hideLoadingWindow();
            }
        break;
    }
}

chrome.runtime.onMessage.addListener(onRuntimeMessage);
log('injected the injection');
