import {Component, ElementRef, OnInit, Output, ViewEncapsulation} from '@angular/core';

@Component({
	selector: 'page-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss'],
	encapsulation: ViewEncapsulation.Native
})

export class HomeComponent implements OnInit {

	@Output() self = this;

	constructor(public elementRef: ElementRef) {
		window['test2'] = elementRef.nativeElement;

		// let counter = 0;
		// setInterval(() => {
		// 	elementRef.nativeElement.style.setProperty(`--footer-height`, (counter += 10) + 'px');
		// }, 100)
	}

	ngOnInit() {
	}
}