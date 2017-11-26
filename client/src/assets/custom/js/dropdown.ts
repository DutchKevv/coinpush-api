(<any>$.fn).dropdown2 = function (settings) {

	return this.each(function () {

		const menu = this.querySelector('.dropdown-menu');

		// Open context menu
		$(this).on('mouseover', function (e) {
			if (this.hasAttribute('disabled'))
				return;

			menu.style.display = 'block';
		});

		$(this).on('mouseleave', function (e) {
			menu.style.display = 'none';
		});
	});
};