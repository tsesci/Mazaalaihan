var dictionary = {};
dictionary._data = null;
dictionary._filename = 'data/engmon.json';

dictionary.load = function() {
    if (dictionary._data !== null) {
    	log('dictionary is already loaded');

        return;
    }

    sendMessage(null, 'loading', true);
    $.getJSON(chrome.extension.getURL(dictionary._filename), function(result) {
        dictionary._data = result;
        sendMessage(null, 'loading', false);

        log('dictionary is loaded(' + result.length + ' words)');
    });
}

dictionary.unload = function() {
	dictionary._data = null;

	log('dictionary is unloaded');
}

dictionary.findNearestIndex = function(word, start, end) {
	if (dictionary._data === null) {
		log('dictionary is not yet loaded');

		return null;
	}

	if (typeof start === 'undefined') {
		start = 0;
		end = dictionary._data.length;
	}

	if (start >= end) {
		return start;
	}

	var middle = Math.floor((start + end) / 2);
	var compareResult = word.localeCompare(dictionary._data[middle]['eng']);

	if (compareResult === 0) {
		return middle;
	} else if (compareResult === -1) {
		return dictionary.findNearestIndex(word, start, middle - 1);
	} else if (compareResult === 1) {
		return dictionary.findNearestIndex(word, middle + 1, end);
	}
}

dictionary.find = function(word) {
	if (word === null) {
		return null;
	}

	var nearestIndex = dictionary.findNearestIndex(word);

	if (dictionary._data[nearestIndex]['eng'] === word) {
		log('"' + word + '" is found');

		return [dictionary._data[nearestIndex]];
	}

	log('"' + word + '" is not found');

	if (word.match(/(ed|s|ing)$/) !== null) {
		var preTransformWord = word.replace(/(ed|s|ing)$/, '');
		var nearestIndexOfPreTransformWord = dictionary.findNearestIndex(preTransformWord);

		log('"' + word + '" seems a transformed word');
		log('tries again with "' + preTransformWord + '"');

		if (dictionary._data[nearestIndexOfPreTransformWord]['eng'] === preTransformWord) {
			log('"' + preTransformWord + '" is found');

			return [dictionary._data[nearestIndexOfPreTransformWord]];
		}

		log('"' + preTransformWord + '" is not found');
	}

	var result = [];
	var start = nearestIndex - 3;
	var end = nearestIndex + 3;
	start = start < 0 ? 0 : start;
	end = end < dictionary._data.length ? end : dictionary._data.length - 1;

	for (var i = start; i <= end; i++) {
		result.push(dictionary._data[i]);
	}

	return result;
}
