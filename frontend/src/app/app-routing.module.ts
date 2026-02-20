import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { HealthComponent } from './components/health/health.component';
import { TaskPageComponent } from './components/task-page/task-page.component';

const routes: Routes = [
  { path: '', component: TaskPageComponent },
  { path: 'home', component: HomeComponent },
  { path: 'health', component: HealthComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
