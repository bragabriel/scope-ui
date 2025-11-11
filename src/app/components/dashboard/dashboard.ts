import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService, CarteiraTotal } from '../../services/dashboard.services';
import { AcoesService } from '../../services/acoes.services';
import { FiisService } from '../../services/fiis.services';
import { RendaFixaService } from '../../services/renda-fixa.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  @ViewChild('graficoTotalCanvas') graficoTotalCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoComparativoCanvas') graficoComparativoCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoProjecaoCanvas') graficoProjecaoCanvas?: ElementRef<HTMLCanvasElement>;

  carteiraTotal: CarteiraTotal | null = null;
  totalAcoes = 0;
  totalFiis = 0;
  totalRendaFixa = 0;
  totalCarteira = 0;
  quantidadeAcoes = 0;
  quantidadeFiis = 0;
  quantidadeRendaFixa = 0;

  // Projeção de Meta
  metaValor = 0;
  rentabilidadeAnual = 0;
  aporteMensal = 0;
  mesesParaMeta = 0;
  projecaoCalculada = false;

  // Projeção de Renda
  rendaMensalProjetada = 0;

  chartTotal: Chart | null = null;
  chartComparativo: Chart | null = null;
  chartProjecao: Chart | null = null;

  constructor(
    private dashboardService: DashboardService,
    private acoeService: AcoesService,
    private fiisService: FiisService,
    private rendaFixaService: RendaFixaService
  ) { }

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
        } else if (item.tipo === 'Renda Fixa') {
          this.totalRendaFixa = item.valor;
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
      this.quantidadeRendaFixa = rendasFixas.length;
    });
  }

  calcularProjecao(): void {
    if (this.metaValor <= this.totalCarteira) {
      alert('A meta deve ser maior que o valor atual da carteira!');
      return;
    }

    if (this.rentabilidadeAnual < 0 || this.aporteMensal < 0) {
      alert('Rentabilidade e aporte devem ser valores positivos!');
      return;
    }

    // Fórmula de valor futuro com aportes mensais
    // FV = PV * (1 + r)^n + PMT * [((1 + r)^n - 1) / r]
    // Resolvendo para n (meses)

    const pv = this.totalCarteira;
    const fv = this.metaValor;
    const rAnual = this.rentabilidadeAnual / 100; 
    const r = Math.pow(1 + rAnual, 1 / 12) - 1;     
    const pmt = this.aporteMensal;

    if (r === 0) {
      // Sem juros, cálculo simples
      this.mesesParaMeta = Math.ceil((fv - pv) / pmt);
    } else {
      // Com juros compostos, iteração para encontrar n
      let n = 0;
      let valorAtual = pv;

      while (valorAtual < fv && n < 600) { 
        valorAtual = valorAtual * (1 + r) + pmt;
        n++;
      }

      this.mesesParaMeta = n;
    }

    this.projecaoCalculada = true;
    this.calcularRendaMensal();

    setTimeout(() => {
      if (this.graficoProjecaoCanvas) {
        this.atualizarGraficoProjecao();
      }
    }, 100);
  }

  calcularRendaMensal(): void {
    const rAnual = this.rentabilidadeAnual / 100;
    const rMensal = Math.pow(1 + rAnual, 1 / 12) - 1;
    this.rendaMensalProjetada = this.totalCarteira * rMensal;
  }

  atualizarGraficoProjecao(): void {
    if (!this.graficoProjecaoCanvas) return;

    const labels: string[] = [];
    const dados: number[] = [];

    const rAnual = this.rentabilidadeAnual / 100;
    const r = Math.pow(1 + rAnual, 1 / 12) - 1;

    let valorAtual = this.totalCarteira;

    for (let mes = 0; mes <= this.mesesParaMeta; mes += Math.ceil(this.mesesParaMeta / 12)) {
      labels.push(`Mês ${mes}`);
      dados.push(valorAtual);

      // Calcular próximo valor
      for (let i = 0; i < Math.ceil(this.mesesParaMeta / 12); i++) {
        valorAtual = valorAtual * (1 + r) + this.aporteMensal;
      }
    }

    if (this.chartProjecao) {
      this.chartProjecao.destroy();
    }

    const ctx = this.graficoProjecaoCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chartProjecao = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Projeção de Crescimento',
              data: dados,
              borderColor: '#667eea',
              backgroundColor: 'rgba(102, 126, 234, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: true
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const valor = context.parsed.y as number;
                  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: false,
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

    const dados = [this.totalAcoes, this.totalFiis, this.totalRendaFixa];
    const labels = ['Ações', 'FIIs', 'Renda Fixa'];
    const cores = ['#667eea', '#764ba2', '#44cc44'];

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
              hoverBackgroundColor: ['#5568d3', '#6a4096', '#33aa33']
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

  formatarMeses(meses: number): string {
    const anos = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;

    if (anos === 0) {
      return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
    } else if (mesesRestantes === 0) {
      return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
    } else {
      return `${anos} ${anos === 1 ? 'ano' : 'anos'} e ${mesesRestantes} ${mesesRestantes === 1 ? 'mês' : 'meses'}`;
    }
  }
}