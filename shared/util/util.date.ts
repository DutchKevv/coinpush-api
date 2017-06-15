export const timeFrameSteps = {
	'S5': 5000,
	'S10': 10000,
	'S15': 15000,
	'S30': 30000,
	'M1': 60000,
	'M5': 300000,
	'M15': 900000,
	'M30': 1800000,
	'H1': 3600000,
	'H4': 14400000
};

const _timeFrameSteps = {
	s: 1000,
	m: 1000 * 60,
	h: 1000 * 60 * 60,
	d: 1000 * 60 * 60 * 24,
	w: 1000 * 60 * 60 * 24 * 7
};

export function timeFrameCountToMilliseconds(timeFrame, count) {
	let step = timeFrame[0].toLowerCase(),
		number = parseInt(timeFrame, 10);

	return _timeFrameSteps[step] * number * count;
}


export function getEstimatedTimeFromCount(timeFrame, count) {
	return timeFrameSteps[timeFrame] * count;
}

// TODO: STOLEN FROM NPM MERGE-RANGES
export function mergeRanges(ranges) {
	if (!(ranges && ranges.length)) {
		return [];
	}

	// Stack of final ranges
	var stack = [];

	// Sort according to start value
	ranges.sort(function (a, b) {
		return a[0] - b[0];
	});

	// Add first range to stack
	stack.push(ranges[0]);

	ranges.slice(1).forEach(function (range, i) {
		var top = stack[stack.length - 1];

		if (top[1] < range[0]) {

			// No overlap, push range onto stack
			stack.push(range);
		} else if (top[1] < range[1]) {

			// Add bars counter
			if (typeof range[1][2] === 'number') {
				range[1][2] += top[1][2];
			}

			// Update previous range
			top[1] = range[1];
		}
	});

	return stack;
};