import { ChangeDetectionStrategy, Component, OnInit, ElementRef, Input, Output, EventEmitter, ChangeDetectorRef, HostListener } from '@angular/core';

@Component({
	selector: 'app-timeline',
	styleUrls: ['./timeline.component.scss'],
	templateUrl: 'timeline.component.html',
	changeDetection: ChangeDetectionStrategy.OnPush
})

export class TimelineComponent {

	constructor(public elementRef: ElementRef) { }
}