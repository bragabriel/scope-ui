import { Routes } from '@angular/router';
import { AcoesComponent } from './components/acoes/acoes';
import { HomeComponent } from './components/home/home';
import { FiisComponent } from './components/fiis/fiis';
import { DashboardComponent } from './components/dashboard/dashboard';
import { RendaFixaComponent } from './components/renda-fixa/renda-fixa';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'acoes', component: AcoesComponent },
  { path: 'fiis', component: FiisComponent },
  { path: 'renda-fixa', component: RendaFixaComponent }
];