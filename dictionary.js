var dictionary = {};
dictionary._data = null;
dictionary._filename = 'data/engmon.json';

dictionary._findNearestIndex = function(word, start, end) {
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
		return dictionary._findNearestIndex(word, start, middle - 1);
	} else if (compareResult === 1) {
		return dictionary._findNearestIndex(word, middle + 1, end);
	}
}

dictionary._load = function() {
    if (dictionary._data !== null) {
        log('dictionary is already loaded');

        return;
    }

    $.getJSON(chrome.extension.getURL(dictionary._filename), function(result) {
        dictionary._data = result;

        log('dictionary is loaded(' + result.length + ' words)');
    });
}

dictionary.find = function(word) {
	if (word === null) {
		return null;
	}

	if (dictionary._data === null) {
		log('dictionary is not yet loaded');

		return null;
	}

	var nearestIndex = dictionary._findNearestIndex(word);

	if (dictionary._data[nearestIndex]['eng'] === word) {
		log('"' + word + '" is found');

		return [dictionary._data[nearestIndex]];
	}

	log('"' + word + '" is not found');

	var stem = stemmer(word);

	if (stem !== word) {
		log('tries again with "' + stem + '"');

		var nearestIndexOfStem = dictionary._findNearestIndex(stem);

		if (dictionary._data[nearestIndexOfStem]['eng'] === stem) {
			log('"' + stem + '" is found');

			return [dictionary._data[nearestIndexOfStem]];
		}

		log('"' + stem + '" is not found');
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

dictionary._load();
