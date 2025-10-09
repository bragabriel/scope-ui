import { Routes } from '@angular/router';
import { AcoesComponent } from './components/acoes/acoes';

export const routes: Routes = [
  { path: '', redirectTo: '/acoes', pathMatch: 'full' },
  { path: 'acoes', component: AcoesComponent },
];