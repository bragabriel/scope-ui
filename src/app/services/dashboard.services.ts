import { Injectable } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';
import { AcoesService } from './acoes.services';
import { FiisService } from './fiis.services';
import { RendaFixaService } from './renda-fixa.service';

export interface CarteiraTotalItem {
  tipo: string;
  valor: number;
  percentual: number;
  cor: string;
}

export interface CarteiraTotal {
  total: number;
  items: CarteiraTotalItem[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private cores = {
    'Ações': '#667eea',
    'FIIs': '#764ba2',
    'Renda Fixa': '#44cc44',
    'Criptomoedas': '#ff9f40'
  };

  constructor(
    private acoeService: AcoesService,
    private fiisService: FiisService,
    private rendaFixaService: RendaFixaService
  ) { }

  getCarteiraTotalizada(): Observable<CarteiraTotal> {
    return combineLatest([
      this.acoeService.getAcoes(),
      this.fiisService.getFiis(),
      this.rendaFixaService.getRendasFixas()
    ]).pipe(
      map(([acoes, fiis, rendasFixas]) => {
        const items: CarteiraTotalItem[] = [];
        let total = 0;

        // Adicionar Ações
        const totalAcoes = acoes.reduce((sum, acao) => sum + acao.valor, 0);
        if (totalAcoes > 0) {
          items.push({
            tipo: 'Ações',
            valor: totalAcoes,
            percentual: 0,
            cor: this.cores['Ações']
          });
          total += totalAcoes;
        }

        // Adicionar FIIs
        const totalFiis = fiis.reduce((sum, fii) => sum + fii.valor, 0);
        if (totalFiis > 0) {
          items.push({
            tipo: 'FIIs',
            valor: totalFiis,
            percentual: 0,
            cor: this.cores['FIIs']
          });
          total += totalFiis;
        }

        // Adicionar Renda Fixa
        const totalRendaFixa = rendasFixas.reduce((sum, rf) => sum + rf.valor, 0);
        if (totalRendaFixa > 0) {
          items.push({
            tipo: 'Renda Fixa',
            valor: totalRendaFixa,
            percentual: 0,
            cor: this.cores['Renda Fixa']
          });
          total += totalRendaFixa;
        }

        // Calcular percentuais
        items.forEach(item => {
          item.percentual = total > 0 ? (item.valor / total) * 100 : 0;
        });

        return {
          total,
          items
        };
      })
    );
  }
}