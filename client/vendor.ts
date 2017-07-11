// Angular
import './polyfills';

// import {
// 	enableProdMode, NgModule, Injectable, Component, Directive, OnInit, AfterViewInit, OnDestroy,
// 	ChangeDetectionStrategy, ViewEncapsulation, ModuleWithProviders, ElementRef, Input, Output, NgZone,
// 	QueryList, ViewChildren, EventEmitter, ViewChild, Pipe, PipeTransform, ViewContainerRef, ComponentFactoryResolver
// } from '@angular/core';

// import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule}				from '@angular/forms';
// import {platformBrowserDynamic} 			from '@angular/platform-browser-dynamic';
// import {RouterModule, Route, CanActivate}  	from '@angular/router';
// import {CookieService} from 'ngx-cookie';

/**
 * Angular
 */
import '@angular/core';
import '@angular/forms';
import '@angular/router';
import '@angular/platform-browser-dynamic';
import 'angular-2-dropdown-multiselect';
import 'ngx-cookie';

/**
 * Helper tools
 */
import 'rxjs';
import 'moment';
import {forEach, throttle, debounce, random} from 'lodash';

/**
 * jQuery (plugins)
 */
import 'jquery/dist/jquery.min.js';
import './node_modules/jquery-touchswipe/jquery.touchSwipe.js';

/**
 * Bootstrap
 */
import 'tether';
import './node_modules/bootstrap/dist/js/bootstrap.min.js';
// import './node_modules/bootstrap/js/dist/util.js'
// import './node_modules/bootstrap/js/dist/modal.js'
// import './node_modules/bootstrap/js/dist/button.js'
// import './node_modules/bootstrap/js/dist/dropdown.js'

/**
 * File tree
 */
import './node_modules/jstree/dist/jstree.js';

/**
 * Ace editor
 */
import './assets/vendor/js/ace/ace.js';
import './assets/vendor/js/ace/theme-tomorrow_night_bright.js';
import './assets/vendor/js/ace/mode-javascript.js';
import './assets/vendor/js/ace/mode-typescript.js';

/**
 *  CanvasJS
 */
import './node_modules/canvasjs/dist/canvasjs.min.js';

/**
 * Web Assembly
 */
import './index.js';

/**
 * Custom
 */
import './assets/custom/js/electron.js';
import './assets/custom/js/contextMenu.js';
import './assets/custom/css/contextMenu.css';