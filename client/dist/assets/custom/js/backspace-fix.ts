export const simulateBackspace = function (element) {
	let start = element.selectionStart, end = element.selectionEnd, event;

	if (!element.setRangeText) {
		return;
	}
	if (start >= end) {
		if (start <= 0 || !element.setSelectionRange) {
			return;
		}
		element.setSelectionRange(start - 1, start);
	}

	element.setRangeText('');
	event = document.createEvent('HTMLEvents');
	event.initEvent('input', true, false);
	element.dispatchEvent(event);
}

export const attachBackspaceFix = (element) => {
	element.onkeyup = (event) => {
		const key = event.which || event.keyCode || event.charCode;

		if (key === 8)
			simulateBackspace(element);
	}
};