export function rateLimit(fn, context, rate, warningThreshold) {
	let queue = [], timeout;

	function next() {
		if (queue.length === 0) {
			timeout = null;
			return;
		}

		fn.apply(context, queue.shift());
		timeout = setTimeout(next, rate);
	}

	return function () {
		if (!timeout) {
			timeout = setTimeout(next, rate);
			fn.apply(context, arguments);
			return;
		}
		queue.push(arguments);
	};
}

