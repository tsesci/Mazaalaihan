function Dictionary(filename, stemmer) {
    this._data = null;
    this._stemmer = stemmer;

    var currentObject = this;

    $.getJSON(chrome.extension.getURL(filename), function(result) {
        currentObject._data = result;

        log('"' + filename + '" is loaded(' + result.length + ' words)');
    });
}

Dictionary.prototype._findNearestIndex = function(word, start, end) {
    if (typeof start === 'undefined') {
        start = 0;
        end = this._data.length;
    }

    if (start >= end) {
        return start;
    }

    var middle = Math.floor((start + end) / 2);
    var compareResult = word.localeCompare(this._data[middle][0]);

    if (compareResult === 0) {
        return middle;
    } else if (compareResult === -1) {
        return this._findNearestIndex(word, start, middle - 1);
    } else if (compareResult === 1) {
        return this._findNearestIndex(word, middle + 1, end);
    }
}

Dictionary.prototype.find = function(word) {
    if (word === null) {
        return null;
    }

    if (this._data === null) {
        log('this is not yet loaded');

        return null;
    }

    var nearestIndex = this._findNearestIndex(word);

    if (this._data[nearestIndex][0] === word) {
        log('"' + word + '" is found');

        return [this._data[nearestIndex]];
    }

    log('"' + word + '" is not found');

    if (typeof this._stemmer !== 'undefined') {
        var stem = this._stemmer(word);

        if (stem !== word) {
            log('tries again with "' + stem + '"');

            var nearestIndexOfStem = this._findNearestIndex(stem);

            if (this._data[nearestIndexOfStem][0] === stem) {
                log('"' + stem + '" is found');

                return [this._data[nearestIndexOfStem]];
            }

            log('"' + stem + '" is not found');
        }
    }

    var result = [];
    var start = nearestIndex - 3;
    var end = nearestIndex + 3;
    start = start < 0 ? 0 : start;
    end = end < this._data.length ? end : this._data.length - 1;

    for (var i = start; i <= end; i++) {
        result.push(this._data[i]);
    }

    return result;
}

engmon = new Dictionary('data/engmon.json', englishStemmer);
moneng = new Dictionary('data/moneng.json');
