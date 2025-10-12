import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, CarteiraTotal } from '../../services/dashboard.services';
import { AcoesService } from '../../services/acoes.services';
import { FiisService } from '../../services/fiis.services';
import Chart from 'chart.js/auto';
import { RendaFixaService } from 'src/app/services/renda-fixa.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  @ViewChild('graficoTotalCanvas') graficoTotalCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoComparativoCanvas') graficoComparativoCanvas?: ElementRef<HTMLCanvasElement>;

  carteiraTotal: CarteiraTotal | null = null;
  totalAcoes = 0;
  totalFiis = 0;
  totalCarteira = 0;
  quantidadeAcoes = 0;
  quantidadeFiis = 0;
  totalRendaFixa = 0;
  quantidadeRendaFixa = 0;

  chartTotal: Chart | null = null;
  chartComparativo: Chart | null = null;

  constructor(
    private dashboardService: DashboardService,
    private acoeService: AcoesService,
    private fiisService: FiisService,
    private rendaFixaService: RendaFixaService
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  ngAfterViewInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    // Carregar carteira total
    this.dashboardService.getCarteiraTotalizada().subscribe(carteira => {
      this.carteiraTotal = carteira;
      this.totalCarteira = carteira.total;

      // Extrair totais por tipo
      carteira.items.forEach(item => {
        if (item.tipo === 'Ações') {
          this.totalAcoes = item.valor;
        } else if (item.tipo === 'FIIs') {
          this.totalFiis = item.valor;
        }
      });

      setTimeout(() => {
        if (this.graficoTotalCanvas) {
          this.atualizarGraficoTotal();
        }
        if (this.graficoComparativoCanvas) {
          this.atualizarGraficoComparativo();
        }
      }, 100);
    });

    // Carregar quantidade de itens
    this.acoeService.getAcoes().subscribe(acoes => {
      this.quantidadeAcoes = acoes.length;
    });

    this.fiisService.getFiis().subscribe(fiis => {
      this.quantidadeFiis = fiis.length;
    });

    this.rendaFixaService.getRendasFixas().subscribe(rendasFixas => {
      this.totalRendaFixa = rendasFixas.reduce((sum, rf) => sum + rf.valor, 0);
      this.quantidadeRendaFixa = rendasFixas.length;
    });
  }

  atualizarGraficoTotal(): void {
    if (!this.graficoTotalCanvas || !this.carteiraTotal) return;

    const labels = this.carteiraTotal.items.map(item => item.tipo);
    const dados = this.carteiraTotal.items.map(item => item.valor);
    const cores = this.carteiraTotal.items.map(item => item.cor);

    if (this.chartTotal) {
      this.chartTotal.destroy();
    }

    const ctx = this.graficoTotalCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chartTotal = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [
            {
              data: dados,
              backgroundColor: cores,
              borderColor: '#fff',
              borderWidth: 2,
              borderRadius: 4,
              hoverOffset: 10
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                padding: 15,
                font: {
                  size: 14,
                  weight: 600
                }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const valor = context.parsed as number;
                  const percentual = this.carteiraTotal?.items[context.dataIndex].percentual.toFixed(2) || '0.00';
                  return `${label}: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentual}%)`;
                }
              }
            }
          }
        }
      });
    }
  }

  atualizarGraficoComparativo(): void {
    if (!this.graficoComparativoCanvas) return;

    const dados = [this.totalAcoes, this.totalFiis];
    const labels = ['Ações', 'FIIs'];
    const cores = ['#667eea', '#764ba2'];

    if (this.chartComparativo) {
      this.chartComparativo.destroy();
    }

    const ctx = this.graficoComparativoCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chartComparativo = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Valor Total (R$)',
              data: dados,
              backgroundColor: cores,
              borderColor: cores,
              borderWidth: 2,
              borderRadius: 6,
              hoverBackgroundColor: ['#5568d3', '#6a4096']
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          indexAxis: 'y',
          plugins: {
            legend: {
              display: true,
              labels: {
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const valor = context.parsed.x as number;
                  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  return 'R$ ' + (value as number).toLocaleString('pt-BR');
                }
              }
            }
          }
        }
      });
    }
  }

  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}