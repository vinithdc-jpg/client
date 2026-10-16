import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';
import { ProjectListComponent } from './features/projects/project-list/project-list';
import { ProjectCreateComponent } from './features/projects/project-create/project-create';
import { ProjectDetailComponent } from './features/projects/project-detail/project-detail';
import { MyBidsComponent } from './features/bids/my-bids/my-bids';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'projects',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'projects/new',
    component: ProjectCreateComponent,
    canActivate: [authGuard, roleGuard('client')],
  },
  {
    path: 'projects/:projectId',
    component: ProjectDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'projects',
    component: ProjectListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'bids',
    component: MyBidsComponent,
    canActivate: [authGuard, roleGuard('freelancer')],
  },
  {
    path: '**',
    redirectTo: 'projects',
  },
];
