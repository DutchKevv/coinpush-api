import { Directive, ComponentFactoryResolver, ComponentRef, ViewContainerRef } from '@angular/core';

import { ModalComponent } from '../components/modal/modal.component';
import { ModalService } from '../services/modal.service';

declare let $: any;

@Directive({
	selector: '[modalAnchor]'
})

export class ModalAnchorDirective {

	public modalComponentRef;
	public options;

	private _$el;

	constructor(private viewContainer: ViewContainerRef,
		private componentFactoryResolver: ComponentFactoryResolver,
		private _modalService: ModalService) {
		_modalService.directive = this;
	}

	create(modalComponent: any, options = <any>{}): ComponentRef<ModalComponent> {
		this.options = options;

		this.viewContainer.clear();

		let modalComponentFactory = this.componentFactoryResolver.resolveComponentFactory(modalComponent);
		this.modalComponentRef = <any>this.viewContainer.createComponent(modalComponentFactory);
		this.modalComponentRef.instance.model = options.model;
		this.modalComponentRef.instance.options = options;

		if (this.modalComponentRef.instance.close) {
			this.modalComponentRef.instance.close.subscribe(() => this.destroy());
		}

		this._$el = $(this.modalComponentRef.instance.elementRef.nativeElement.querySelector('.modal'));

		this._$el.on('hidden.bs.modal', () => this.destroy());

		this.show();

		return this.modalComponentRef;
	}

	show() {
		$(this.modalComponentRef.instance.elementRef.nativeElement.querySelector('.modal')).modal('show');
		this.viewContainer.element.nativeElement.appendChild(this.modalComponentRef.instance.elementRef.nativeElement);
	}

	hide() {
		$(this.modalComponentRef.instance.elementRef.nativeElement.querySelector('.modal')).modal('hide');
	}

	destroy() {
		if (this.modalComponentRef.instance && this.modalComponentRef.instance.destroy)
			this.modalComponentRef.instance.destroy();
			
		this.viewContainer.clear();
	}
}
