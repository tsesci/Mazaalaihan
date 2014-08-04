// it seems like javascripts don't conflict each other, but css can be conflicted
// http://stackoverflow.com/questions/7213883/how-can-i-use-jquery-in-a-chrome-extension-content-script-when-an-older-version
// https://developer.chrome.com/extensions/content_scripts#execution-environment
// http://stackoverflow.com/questions/10568065/limit-the-scope-of-bootstrap-styles/14145510#14145510

var popoverWindow = ' \
<div class="mazaalai"> \
    <div class="popover" id="_mazaalaiPopoverWindow"> \
    </div> \
</div>';
$('body').prepend(popoverWindow);
$popoverWindow = $('#_mazaalaiPopoverWindow');

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

    matches = word.toLocaleLowerCase().match(/[a-z,а-я,өүё]+/);

    if (matches === null) {
        return null;
    }

    return matches[0];
}

function buildPopoverWindow(word, found, result) {
    var titleClass = 'bg-success';
    var resultHTML = '';

    $popoverWindow.html('');

    if (!found) {
        titleClass = 'bg-danger';

        if (result.length > 0) {
            resultHTML += '<div class="popover-title" style="background-color:#f7f7f7;"><p class="small"><b>&ldquo;' + word + '&rdquo;</b> гэсэн үг олдоогүй тул, ойролцоох үгнүүдийг харуулж байна.</p></div>';
        } else {
            resultHTML += '<div class="popover-title" style="background-color:#f7f7f7;"><p class="small"><b>&ldquo;' + word + '&rdquo;</b> гэсэн үг олдсонгүй.</p></div>';
        }
    }

    for (var i = 0; i < result.length; i++) {
        resultHTML += '<div class="popover-title ' + titleClass + '"><p>' + result[i][0] + '</p></div>';
        resultHTML += '<div class="popover-content"><p class="small">' + result[i][1] + '</p></div>';
    }

    resultHTML += '<div class="popover-title" style="background-color:#f7f7f7;"><p class="small" style="text-align:right;">&copy; 2014, Barbayar Dashzeveg</p></div>';

    $popoverWindow.append(resultHTML);
}

function showPopoverWindow(x, y) {
    var spareSpace = 20;
    var popoverWindowWidth = $popoverWindow.width();
    var popoverWindowHeight = $popoverWindow.height();

    var popoverWindowTop = y - popoverWindowHeight / 2;
    var popoverWindowBottom = popoverWindowTop + popoverWindowHeight;
    var popoverWindowLeft = x + spareSpace;
    var popoverWindowRight = popoverWindowLeft + popoverWindowWidth;
    var windowTop = $(window).scrollTop();
    var windowBottom = windowTop + $(window).height();
    var windowLeft = $(window).scrollLeft();
    var windowRight = windowLeft + $(window).width();

    if (popoverWindowRight + spareSpace > windowRight) {
        popoverWindowLeft = x - popoverWindowWidth - spareSpace;
        popoverWindowRight = popoverWindowLeft + popoverWindowWidth;
    }

    if (popoverWindowBottom + spareSpace > windowBottom) {
        popoverWindowTop = windowBottom - popoverWindowHeight - spareSpace;
        popoverWindowBottom = popoverWindowTop + popoverWindowHeight;
    }

    if (popoverWindowTop - spareSpace < windowTop) {
        popoverWindowTop = windowTop + spareSpace;
        popoverWindowBottom = popoverWindowTop + popoverWindowHeight;
    }

    $popoverWindow.css('left', popoverWindowLeft + 'px');
    $popoverWindow.css('top', popoverWindowTop + 'px');
    $popoverWindow.show();
}

function onMouseMove(event) {
    if (!event.ctrlKey) {
        $popoverWindow.hide();

        return;
    }

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
        command: 'search',
        parameter: word,
    }, function(response) {
        buildPopoverWindow(word, response.found, response.result);
        showPopoverWindow(event.pageX, event.pageY);
    });
}

window.addEventListener('mousemove', onMouseMove, false);
