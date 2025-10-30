import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RendaFixaService } from '../../services/renda-fixa.service';
import { TiposRendaFixaService, TipoRendaFixa } from '../../services/types/tipos-renda-fixa.service';
import { RendaFixa } from '../../models/renda-fixa.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-renda-fixa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './renda-fixa.html',
  styleUrl: './renda-fixa.css'
})
export class RendaFixaComponent implements OnInit {
  @ViewChild('graficoCanvas') graficoCanvas?: ElementRef<HTMLCanvasElement>;

  rendasFixas: RendaFixa[] = [];
  rendasFixasFiltradas: RendaFixa[] = [];
  filtro = '';
  ordenarPor = '';
  ordemAscendente = true;

  mostrarFormulario = false;
  editando = false;
  rendaFixaEdicao: RendaFixa | null = null;

  tipos: TipoRendaFixa[] = [];
  instituicoesDisponiveis: string[] = [];

  novaRendaFixa: any = {
    id: 0,
    nome: '',
    tipo: '',
    instituicao: '',
    dataVencimento: '',
    taxaAnual: '',
    valor: ''
  };

  chart: Chart | null = null;

  cores = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];

  constructor(
    private rendaFixaService: RendaFixaService,
    private tiposRendaFixaService: TiposRendaFixaService
  ) {}

  ngOnInit(): void {
    this.carregarTipos();
    this.carregarRendasFixas();
  }

  ngAfterViewInit(): void {
    if (this.rendasFixas.length > 0) {
      this.atualizarGrafico();
    }
  }

  carregarTipos(): void {
    this.tiposRendaFixaService.getTipos().subscribe(data => {
      this.tipos = data.tipos;
    });
  }

  carregarRendasFixas(): void {
    this.rendaFixaService.getRendasFixas().subscribe(
      rendasFixas => {
        this.rendasFixas = rendasFixas;
        this.rendasFixasFiltradas = [...this.rendasFixas];
        this.aplicarFiltro();
        
        setTimeout(() => {
          if (this.graficoCanvas) {
            this.atualizarGrafico();
          }
        }, 100);
      },
      error => {
        console.error('Erro ao carregar rendas fixas:', error);
        alert('Erro ao conectar ao servidor!');
      }
    );
  }

  atualizarInstituicoes(): void {
    if (this.novaRendaFixa.tipo) {
      const tipo = this.tipos.find(t => t.nome === this.novaRendaFixa.tipo);
      this.instituicoesDisponiveis = tipo ? tipo.instituicoes : [];
      this.novaRendaFixa.instituicao = '';
    } else {
      this.instituicoesDisponiveis = [];
      this.novaRendaFixa.instituicao = '';
    }
  }

  aplicarFiltro(): void {
    if (this.filtro.trim() === '') {
      this.rendasFixasFiltradas = [...this.rendasFixas];
    } else {
      const filtroLower = this.filtro.toLowerCase();
      this.rendasFixasFiltradas = this.rendasFixas.filter(rf =>
        rf.nome.toLowerCase().includes(filtroLower) ||
        rf.tipo.toLowerCase().includes(filtroLower) ||
        rf.instituicao.toLowerCase().includes(filtroLower)
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
    this.rendasFixasFiltradas.sort((a, b) => {
      let valorA: any = '';
      let valorB: any = '';

      switch (this.ordenarPor) {
        case 'nome':
          valorA = a.nome;
          valorB = b.nome;
          break;
        case 'tipo':
          valorA = a.tipo;
          valorB = b.tipo;
          break;
        case 'instituicao':
          valorA = a.instituicao;
          valorB = b.instituicao;
          break;
        case 'taxa':
          valorA = a.taxaAnual;
          valorB = b.taxaAnual;
          break;
        case 'valor':
          valorA = a.valor;
          valorB = b.valor;
          break;
        case 'vencimento':
          valorA = a.dataVencimento;
          valorB = b.dataVencimento;
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

  atualizarGrafico(): void {
    if (!this.graficoCanvas) return;

    const tipos = new Map<string, number>();
    const cores = new Map<string, string>();

    this.rendasFixas.forEach((rf, index) => {
      const tipo = rf.tipo;
      tipos.set(tipo, (tipos.get(tipo) || 0) + rf.valor);
      if (!cores.has(tipo)) {
        cores.set(tipo, this.cores[index % this.cores.length]);
      }
    });

    const labels = Array.from(tipos.keys());
    const dados = Array.from(tipos.values());
    const coresArray = labels.map(label => cores.get(label)!);

    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.graficoCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [
            {
              data: dados,
              backgroundColor: coresArray,
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
                  const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                  const percentual = ((valor / total) * 100).toFixed(2);
                  return `${label}: R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentual}%)`;
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
    this.rendaFixaEdicao = null;
    this.novaRendaFixa = {
      id: 0,
      nome: '',
      tipo: '',
      instituicao: '',
      dataVencimento: '',
      taxaAnual: '',
      valor: ''
    };
    this.instituicoesDisponiveis = [];
  }

  editarRendaFixa(rf: RendaFixa): void {
    this.mostrarFormulario = true;
    this.editando = true;
    this.rendaFixaEdicao = { ...rf };
    this.novaRendaFixa = { ...rf };
    this.atualizarInstituicoes();
  }

  salvarRendaFixa(): void {
    const valor = parseFloat(this.novaRendaFixa.valor);
    const taxa = parseFloat(this.novaRendaFixa.taxaAnual);
    
    if (!this.novaRendaFixa.nome || !this.novaRendaFixa.tipo || !this.novaRendaFixa.instituicao || 
        !this.novaRendaFixa.valor || valor <= 0 || !this.novaRendaFixa.dataVencimento) {
      alert('Por favor, preencha todos os campos corretamente!');
      return;
    }

    this.novaRendaFixa.valor = valor;
    this.novaRendaFixa.taxaAnual = taxa || 0;

    if (this.editando && this.rendaFixaEdicao) {
      this.novaRendaFixa.id = this.rendaFixaEdicao.id;
      
      this.rendaFixaService.editarRendaFixa(this.novaRendaFixa).subscribe(
        (response) => {
          this.fecharFormulario();
          this.carregarRendasFixas();
        },
        error => {
          console.error('Erro ao editar renda fixa:', error);
          alert('Erro ao editar renda fixa!');
        }
      );
    } else {
      const maxId = this.rendasFixas.length > 0 ? Math.max(...this.rendasFixas.map(r => r.id)) : 0;
      this.novaRendaFixa.id = maxId + 1;
      
      this.rendaFixaService.adicionarRendaFixa(this.novaRendaFixa).subscribe(
        (response) => {
          this.fecharFormulario();
          this.carregarRendasFixas();
        },
        error => {
          console.error('Erro ao adicionar renda fixa:', error);
          alert('Erro ao adicionar renda fixa!');
        }
      );
    }
  }

  excluirRendaFixa(id: number): void {
    if (confirm('Tem certeza que deseja excluir esta renda fixa?')) {
      this.rendaFixaService.excluirRendaFixa(id).subscribe(
        () => {
          this.carregarRendasFixas();
        },
        error => {
          console.error('Erro ao excluir renda fixa:', error);
          alert('Erro ao excluir renda fixa!');
        }
      );
    }
  }

  fecharFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.rendaFixaEdicao = null;
  }

  calcularTotal(): number {
    return this.rendasFixas.reduce((total, rf) => total + rf.valor, 0);
  }

  calcularPercentual(valor: number): string {
    const total = this.calcularTotal();
    return total > 0 ? ((valor / total) * 100).toFixed(2) : '0.00';
  }

  calcularRendimentoAnual(valor: number, taxa: number): number {
    return (valor * taxa) / 100;
  }

  formatarData(data: string): string {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  getBadgeClass(tipo: string): string {
    return 'badge-' + tipo.toLowerCase().replace(/\s+/g, '-');
  }
}