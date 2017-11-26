$.fn['contextMenu'] = function (settings) {

	return this.each(function () {

		// Open context menu
		$(this).on("contextmenu", function (e) {
			setTimeout(() => {
				if (e.ctrlKey || (settings.beforeCreate && settings.beforeCreate(settings, e) === false)) {
					return;
				}

				let $menu = $(createMenuHTML(settings)).hide();
					// pos = getMenuPosition(e.clientX, e.clientX);

				//open menu
				$menu
					.appendTo('body')
					.css('position', 'absolute')
					.css('left', getMenuPosition(e.clientX, 'width', 'scrollLeft'))
					.css('right', getMenuPosition(e.clientY, 'height', 'scrollTop'))
					.on('click', 'li', function (e2) {
						settings.menuSelected(e2.target.getAttribute('data-value'), e);
					})
					.show();

				setTimeout(() => {
					$('body').one('click contextmenu', function () {
						$menu.remove();
						if (settings.afterDestroy) {
							settings.afterDestroy();
						}
					});
				}, 0);
			}, 0);

			e.preventDefault();
		});

		//make sure menu closes on any click

	});

	function createMenuHTML(settings) {
		if (!settings.items || !settings.items.length) {
			throw new Error('No items given')
		}

		let HTML = '<div class="contextMenu"><ul>',
			items = settings.items,
			i = 0, len = items.length;

		for (; i < len; ++i) {
			HTML += `<li data-value="${items[i].value}">${items[i].text}</li>`;
		}

		HTML += '</ul></div>';

		return HTML;
	}

	// function getMenuPosition(mouse, direction, scrollDir) {
	// 	var winW = window.document.body.clientWidth,
	// 		winH = window.document.body.clientHeight,
	// 		scroll = $(window)[scrollDir](),
	// 		menu = $(settings.menuSelector)[direction](),
	// 		position = mouse + scroll;
	//
	// 	// opening menu would pass the side of the page
	// 	if (mouse + menu > win && menu < mouse)
	// 		position -= menu;
	//
	// 	return position;
	// }

	function getMenuPosition(mouse, direction, scrollDir): number {
		// var $win = $(window),
		// 	win = $win[direction](),
		// 	scroll = $win[scrollDir](),
		// 	menu = $(settings.menuSelector)[direction](),
		// 	position = mouse + scroll;

		// console.log('sadf', menu, mouse, scroll, win);

		// // opening menu would pass the side of the page
		// if (mouse + menu > win && menu < mouse)
		// 	position -= menu;

		// return position;
		return 0;
	}

};