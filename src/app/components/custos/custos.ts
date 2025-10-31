import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustosService } from '../../services/custos.services';
import { Custo, DadosFinanceiros } from '../../models/custo.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-custos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './custos.html',
  styleUrl: './custos.css'
})
export class CustosComponent implements OnInit {
  @ViewChild('graficoCategoriasCanvas') graficoCategoriasCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoDespesasCanvas') graficoDespesasCanvas?: ElementRef<HTMLCanvasElement>;

  custos: Custo[] = [];
  custosFiltrados: Custo[] = [];
  filtro = '';
  ordenarPor = '';
  ordemAscendente = true;

  mostrarFormulario = false;
  editando = false;
  custoEdicao: Custo | null = null;

  dadosFinanceiros: DadosFinanceiros = {
    salarioBruto: 0,
    salarioLiquido: 0,
    metaSavings: 60
  };

  mostrarFormularioDados = false;

  novoCusto: any = {
    id: 0,
    nome: '',
    valor: '',
    frequencia: 'mensal',
    categoria: ''
  };

  categorias = [
    'Saúde',
    'Lazer',
    'Moradia',
    'Alimentação',
    'Transporte',
    'Educação',
    'Vestuário',
    'Outros'
  ];

  chartCategorias: Chart | null = null;
  chartDespesas: Chart | null = null;

  constructor(private custosService: CustosService) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  ngAfterViewInit(): void {
    if (this.custos.length > 0) {
      this.atualizarGraficos();
    }
  }

  carregarDados(): void {
    this.custosService.getCustos().subscribe(custos => {
      this.custos = custos;
      this.custosFiltrados = [...this.custos];
      this.aplicarFiltro();
      
      setTimeout(() => {
        this.atualizarGraficos();
      }, 100);
    });

    this.custosService.getDadosFinanceiros().subscribe(dados => {
      this.dadosFinanceiros = dados;
    });
  }

  aplicarFiltro(): void {
    if (this.filtro.trim() === '') {
      this.custosFiltrados = [...this.custos];
    } else {
      const filtroLower = this.filtro.toLowerCase();
      this.custosFiltrados = this.custos.filter(custo =>
        custo.nome.toLowerCase().includes(filtroLower) ||
        custo.categoria.toLowerCase().includes(filtroLower)
      );
    }
    this.aplicarOrdenacao();
  }

  ordenarTabela(coluna: string): void {
    if (this.ordenarPor === coluna) {
      this.ordemAscendente = !this.ordemAscendente;
    } else {
      this.ordenarPor = coluna;
      this.ordemAscendente = true;
    }
    this.aplicarOrdenacao();
  }

  aplicarOrdenacao(): void {
    this.custosFiltrados.sort((a, b) => {
      let valorA: any = '';
      let valorB: any = '';

      switch (this.ordenarPor) {
        case 'nome':
          valorA = a.nome;
          valorB = b.nome;
          break;
        case 'categoria':
          valorA = a.categoria;
          valorB = b.categoria;
          break;
        case 'frequencia':
          valorA = a.frequencia;
          valorB = b.frequencia;
          break;
        case 'valor':
          valorA = a.valor;
          valorB = b.valor;
          break;
        default:
          return 0;
      }

      if (typeof valorA === 'string') {
        valorA = valorA.toLowerCase();
        valorB = (valorB as string).toLowerCase();
        return this.ordemAscendente
          ? valorA.localeCompare(valorB)
          : valorB.localeCompare(valorA);
      } else {
        return this.ordemAscendente ? valorA - valorB : valorB - valorA;
      }
    });
  }

  atualizarGraficos(): void {
    this.atualizarGraficoCategorias();
    this.atualizarGraficoDespesas();
  }

  atualizarGraficoCategorias(): void {
    if (!this.graficoCategoriasCanvas) return;

    const categorias = new Map<string, number>();
    
    this.custos.forEach(custo => {
      const valorMensal = this.custosService.converterParaMensal(custo);
      categorias.set(
        custo.categoria, 
        (categorias.get(custo.categoria) || 0) + valorMensal
      );
    });

    const labels = Array.from(categorias.keys());
    const dados = Array.from(categorias.values());
    const cores = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
    ];

    if (this.chartCategorias) {
      this.chartCategorias.destroy();
    }

    const ctx = this.graficoCategoriasCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chartCategorias = new Chart(ctx, {
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
                  size: 12
                }
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || '';
                  const valor = context.parsed as number;
                  return `${label}: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                }
              }
            }
          }
        }
      });
    }
  }

  atualizarGraficoDespesas(): void {
    if (!this.graficoDespesasCanvas) return;

    const totalDespesas = this.calcularTotalMensal();
    const savingsValor = this.calcularSavings();
    const disponivel = this.dadosFinanceiros.salarioLiquido - totalDespesas;

    const labels = ['Savings', 'Despesas', 'Disponível'];
    const dados = [savingsValor, totalDespesas, disponivel > 0 ? disponivel : 0];
    const cores = ['#44cc44', '#ff6384', '#36A2EB'];

    if (this.chartDespesas) {
      this.chartDespesas.destroy();
    }

    const ctx = this.graficoDespesasCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chartDespesas = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Valor (R$)',
              data: dados,
              backgroundColor: cores,
              borderColor: cores,
              borderWidth: 2,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
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

  abrirFormulario(): void {
    this.mostrarFormulario = true;
    this.editando = false;
    this.custoEdicao = null;
    this.novoCusto = {
      id: 0,
      nome: '',
      valor: '',
      frequencia: 'mensal',
      categoria: ''
    };
  }

  editarCusto(custo: Custo): void {
    this.mostrarFormulario = true;
    this.editando = true;
    this.custoEdicao = { ...custo };
    this.novoCusto = { ...custo };
  }

  salvarCusto(): void {
    const valor = parseFloat(this.novoCusto.valor);
    
    if (!this.novoCusto.nome || !this.novoCusto.categoria || !this.novoCusto.valor || valor <= 0) {
      alert('Por favor, preencha todos os campos corretamente!');
      return;
    }

    this.novoCusto.valor = valor;

    if (this.editando && this.custoEdicao) {
      this.novoCusto.id = this.custoEdicao.id;
      
      this.custosService.editarCusto(this.novoCusto).subscribe(
        () => {
          this.fecharFormulario();
          this.carregarDados();
        },
        error => {
          console.error('Erro ao editar custo:', error);
          alert('Erro ao editar custo!');
        }
      );
    } else {
      const maxId = this.custos.length > 0 ? Math.max(...this.custos.map(c => c.id)) : 0;
      this.novoCusto.id = maxId + 1;
      
      this.custosService.adicionarCusto(this.novoCusto).subscribe(
        () => {
          this.fecharFormulario();
          this.carregarDados();
        },
        error => {
          console.error('Erro ao adicionar custo:', error);
          alert('Erro ao adicionar custo!');
        }
      );
    }
  }

  excluirCusto(id: number): void {
    if (confirm('Tem certeza que deseja excluir este custo?')) {
      this.custosService.excluirCusto(id).subscribe(
        () => {
          this.carregarDados();
        },
        error => {
          console.error('Erro ao excluir custo:', error);
          alert('Erro ao excluir custo!');
        }
      );
    }
  }

  fecharFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.custoEdicao = null;
  }

  abrirFormularioDados(): void {
    this.mostrarFormularioDados = true;
  }

  fecharFormularioDados(): void {
    this.mostrarFormularioDados = false;
  }

  salvarDadosFinanceiros(): void {
    if (this.dadosFinanceiros.salarioBruto <= 0 || this.dadosFinanceiros.salarioLiquido <= 0) {
      alert('Por favor, preencha os salários corretamente!');
      return;
    }

    this.custosService.atualizarDadosFinanceiros(this.dadosFinanceiros).subscribe(
      () => {
        this.fecharFormularioDados();
        this.atualizarGraficos();
      },
      error => {
        console.error('Erro ao atualizar dados financeiros:', error);
        alert('Erro ao atualizar dados financeiros!');
      }
    );
  }

  calcularTotalMensal(): number {
    return this.custosService.calcularTotalMensal(this.custos);
  }

  calcularSavings(): number {
    return this.dadosFinanceiros.salarioLiquido * (this.dadosFinanceiros.metaSavings / 100);
  }

  calcularDisponivel(): number {
    return this.dadosFinanceiros.salarioLiquido - this.calcularTotalMensal();
  }

  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  traduzirFrequencia(frequencia: string): string {
    const traducoes: any = {
      'mensal': 'Mensal',
      'semanal': 'Semanal',
      'anual': 'Anual'
    };
    return traducoes[frequencia] || frequencia;
  }
}