import { Component, OnInit, Inject, ComponentFactoryResolver, ViewChild, AfterViewInit, ViewContainerRef, ComponentRef, ComponentFactory, TemplateRef, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface IModalComponent {
  modalFooterRef?: ElementRef;
  modalHeaderRef?: ElementRef;
  data?: { [key: string]: any };
  modalOptions?: {
      width?: string;
      title?: string;
  }
}

export interface IModalOptions {
  component?: any;
  // component?: Type<any> | TemplateRef<any>;
  message?: string;
  title?: string;
  closeButton?: boolean;
  width?: string;
  autoFocus?: boolean;
  type?: number;
  data?: any;
  buttons?: any[];
  template?: any;
  footerTemplate?: any;
}

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  @ViewChild('headerContainer', { read: ViewContainerRef }) private _headerContainerRef: ViewContainerRef;
  @ViewChild('contentContainer', { read: ViewContainerRef }) private _contentContainerRef: ViewContainerRef;
  @ViewChild('footerContainer', { read: ViewContainerRef }) private _footerContainerRef: ViewContainerRef;

  public contentRef: ComponentRef<any>;
  public templateRef: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public options: IModalOptions,
    private _dialogRef: MatDialogRef<ComponentRef<any>>,
    private _componentFactoryResolver: ComponentFactoryResolver
  ) { }

  ngOnInit() {
    if (this.options.message && this.options.component)
      throw new Error('only component, template or message can be set');

    if (this.options.component) {
      this._injectComponent();
    }
    else if (this.options.template) {
      this._injectTemplate();
    }
  }

  /**
   * 
   * @param value 
   */
  public close(value?: any): void {
    this._dialogRef.close(value);
  }

  /**
   * 
   * @param button 
   */
  public onClickClose(button): void {
    if (button.close !== false) {
      const returnValue = typeof button.value === 'undefined' ? button : button.value;
      this._dialogRef.close(returnValue);
    }
  }

  private _injectTemplate() {
    this.templateRef = this._contentContainerRef.createEmbeddedView(this.options.template);

    // add footer buttons
    if (this.options.footerTemplate) {
      this._footerContainerRef.createEmbeddedView(this.options.footerTemplate);
    }
  }

  /**
   * inject the given component into content
   */
  private _injectComponent(): void {
    const componentFactory: ComponentFactory<ComponentRef<IModalComponent>> = this._componentFactoryResolver.resolveComponentFactory(this.options.component);

    // create component instance
    this.contentRef = this._contentContainerRef.createComponent(componentFactory);

    // set component instance @Input('data')
    this.contentRef.instance['data'] = this.options.data;

    // merge component instance [modalOptions] - (optional)
    if (this.contentRef.instance.modalOptions) {
      Object.assign(this.options, this.contentRef.instance.modalOptions);
    }

    // add custom header (optional)
    if (this.contentRef.instance.modalHeaderRef) {
      this._headerContainerRef.createEmbeddedView(this.contentRef.instance.modalHeaderRef)
    }

    // add custom footer buttons (optional)
    if (this.contentRef.instance.modalFooterRef) {
      this._footerContainerRef.createEmbeddedView(this.contentRef.instance.modalFooterRef)
    }

    // update to new size
    this._dialogRef.updateSize(this.options.width);
  }
}
