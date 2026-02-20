import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import './app/app.component.spec';
import './app/components/home/home.component.spec';
import './app/components/health/health.component.spec';
import './app/components/task-form/task-form.component.spec';
import './app/components/task-list/task-list.component.spec';
import './app/components/task-page/task-page.component.spec';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
