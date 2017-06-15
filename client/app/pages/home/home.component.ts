import {Component, OnInit} from '@angular/core';

@Component({
	selector: 'page-home',
	templateUrl: './home.component.html',
	styleUrls: ['../../style/helpers/three-column.scss', './home.component.scss']
})

export class HomeComponent implements OnInit {

	ngOnInit() {
	}

	onDrag(event) {
		event.preventDefault();

		let target = event.target,
			x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;

		// translate the element
		target.style.webkitTransform = target.style.transform = 'translateX(' + x + 'px)';

		// update the position attributes
		target.setAttribute('data-x', x);
	}
}