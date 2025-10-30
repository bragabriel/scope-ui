import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FiisService } from '../../services/fiis.services';
import { TiposFiiService, TipoFII } from '../../services/types/tipos-fii.service';
import { FII } from '../../models/fii.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-fiis',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fiis.html',
  styleUrl: './fiis.css'
})
export class FiisComponent implements OnInit {
  @ViewChild('graficoCanvas') graficoCanvas?: ElementRef<HTMLCanvasElement>;

  fiis: FII[] = [];
  fiisFiltradas: FII[] = [];
  filtro = '';
  ordenarPor = '';
  ordemAscendente = true;

  mostrarFormulario = false;
  editando = false;
  fiiEdicao: FII | null = null;

  tipos: TipoFII[] = [];
  segmentosDisponiveis: string[] = [];

  novoFii: any = {
    id: 0,
    nome: '',
    tag: '',
    tipo: '',
    segmento: '',
    valor: ''
  };

  chart: Chart | null = null;

  cores = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];

  constructor(
    private fiisService: FiisService,
    private tiposFiiService: TiposFiiService
  ) {}

  ngOnInit(): void {
    this.carregarTipos();
    this.carregarFiis();
  }

  ngAfterViewInit(): void {
    if (this.fiis.length > 0) {
      this.atualizarGrafico();
    }
  }

  carregarTipos(): void {
    this.tiposFiiService.getTipos().subscribe(data => {
      this.tipos = data.tipos;
    });
  }

  carregarFiis(): void {
    this.fiisService.getFiis().subscribe(
      fiis => {
        this.fiis = fiis;
        this.fiisFiltradas = [...this.fiis];
        this.aplicarFiltro();
        
        setTimeout(() => {
          if (this.graficoCanvas) {
            this.atualizarGrafico();
          }
        }, 100);
      },
      error => {
        console.error('Erro ao carregar FIIs:', error);
        alert('Erro ao conectar ao servidor!');
      }
    );
  }

  atualizarSegmentos(): void {
    if (this.novoFii.tipo) {
      const tipo = this.tipos.find(t => t.nome === this.novoFii.tipo);
      this.segmentosDisponiveis = tipo ? tipo.segmentos : [];
      this.novoFii.segmento = '';
    } else {
      this.segmentosDisponiveis = [];
      this.novoFii.segmento = '';
    }
  }

  aplicarFiltro(): void {
    if (this.filtro.trim() === '') {
      this.fiisFiltradas = [...this.fiis];
    } else {
      const filtroLower = this.filtro.toLowerCase();
      this.fiisFiltradas = this.fiis.filter(fii =>
        fii.nome.toLowerCase().includes(filtroLower) ||
        fii.tag.toLowerCase().includes(filtroLower) ||
        fii.tipo.toLowerCase().includes(filtroLower) ||
        fii.segmento.toLowerCase().includes(filtroLower)
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
    this.fiisFiltradas.sort((a, b) => {
      let valorA: any = '';
      let valorB: any = '';

      switch (this.ordenarPor) {
        case 'nome':
          valorA = a.nome;
          valorB = b.nome;
          break;
        case 'tag':
          valorA = a.tag;
          valorB = b.tag;
          break;
        case 'tipo':
          valorA = a.tipo;
          valorB = b.tipo;
          break;
        case 'segmento':
          valorA = a.segmento;
          valorB = b.segmento;
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

  atualizarGrafico(): void {
    if (!this.graficoCanvas) return;

    const tipos = new Map<string, number>();
    const cores = new Map<string, string>();

    this.fiis.forEach((fii, index) => {
      const tipo = fii.tipo;
      tipos.set(tipo, (tipos.get(tipo) || 0) + fii.valor);
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
    this.fiiEdicao = null;
    this.novoFii = {
      id: 0,
      nome: '',
      tag: '',
      tipo: '',
      segmento: '',
      valor: ''
    };
    this.segmentosDisponiveis = [];
  }

  editarFii(fii: FII): void {
    this.mostrarFormulario = true;
    this.editando = true;
    this.fiiEdicao = { ...fii };
    this.novoFii = { ...fii };
    this.atualizarSegmentos();
  }

  salvarFii(): void {
    const valor = parseFloat(this.novoFii.valor);
    
    if (!this.novoFii.nome || !this.novoFii.tipo || !this.novoFii.segmento || !this.novoFii.valor || valor <= 0) {
      alert('Por favor, preencha todos os campos corretamente!');
      return;
    }

    this.novoFii.valor = valor;

    if (this.editando && this.fiiEdicao) {
      this.novoFii.id = this.fiiEdicao.id;
      
      this.fiisService.editarFii(this.novoFii).subscribe(
        (response) => {
          this.fecharFormulario();
          this.carregarFiis();
        },
        error => {
          console.error('Erro ao editar FII:', error);
          alert('Erro ao editar FII!');
        }
      );
    } else {
      const maxId = this.fiis.length > 0 ? Math.max(...this.fiis.map(f => f.id)) : 0;
      this.novoFii.id = maxId + 1;
      
      this.fiisService.adicionarFii(this.novoFii).subscribe(
        (response) => {
          this.fecharFormulario();
          this.carregarFiis();
        },
        error => {
          console.error('Erro ao adicionar FII:', error);
          alert('Erro ao adicionar FII!');
        }
      );
    }
  }

  excluirFii(id: number): void {
    if (confirm('Tem certeza que deseja excluir este FII?')) {
      this.fiisService.excluirFii(id).subscribe(
        () => {
          this.carregarFiis();
        },
        error => {
          console.error('Erro ao excluir FII:', error);
          alert('Erro ao excluir FII!');
        }
      );
    }
  }

  fecharFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.fiiEdicao = null;
  }

  calcularTotal(): number {
    return this.fiis.reduce((total, fii) => total + fii.valor, 0);
  }

  calcularPercentual(valor: number): string {
    const total = this.calcularTotal();
    return total > 0 ? ((valor / total) * 100).toFixed(2) : '0.00';
  }
}