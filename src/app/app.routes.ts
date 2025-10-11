import { Routes } from '@angular/router';
import { AcoesComponent } from './components/acoes/acoes';
import { HomeComponent } from './components/home/home';
import { FiisComponent } from './components/fiis/fiis';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'acoes', component: AcoesComponent },
  { path: 'fiis', component: FiisComponent },
];