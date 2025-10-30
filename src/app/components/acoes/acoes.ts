import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcoesService } from '../../services/acoes.services';
import { SetoresService, Setor } from '../../services/types/tipos-setores.service';
import { Acao } from '../../models/acao.model';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-acoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acoes.html',
  styleUrl: './acoes.css'
})
export class AcoesComponent implements OnInit {
  @ViewChild('graficoCanvas') graficoCanvas?: ElementRef<HTMLCanvasElement>;

  acoes: Acao[] = [];
  acoesFiltradas: Acao[] = [];
  filtro = '';
  ordenarPor = '';
  ordemAscendente = true;

  mostrarFormulario = false;
  editando = false;
  acaoEdicao: Acao | null = null;

  setores: Setor[] = [];
  segmentosDisponiveis: string[] = [];

  novaAcao: any = {
    id: 0,
    nome: '',
    tag: '',
    setor: '',
    segmento: '',
    valor: ''
  };

  chart: Chart | null = null;

  cores = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];

  constructor(
    private acoeService: AcoesService,
    private setoresService: SetoresService
  ) {}

  ngOnInit(): void {
    this.carregarSetores();
    this.carregarAcoes();
  }

  ngAfterViewInit(): void {
    if (this.acoes.length > 0) {
      this.atualizarGrafico();
    }
  }

  carregarSetores(): void {
    this.setoresService.getSetores().subscribe(data => {
      this.setores = data.setores;
    });
  }

  carregarAcoes(): void {
    this.acoeService.getAcoes().subscribe(
      acoes => {
        this.acoes = acoes;
        this.acoesFiltradas = [...this.acoes];
        this.aplicarFiltro();
        
        setTimeout(() => {
          if (this.graficoCanvas) {
            this.atualizarGrafico();
          }
        }, 100);
      },
      error => {
        console.error('Erro ao carregar ações:', error);
        alert('Erro ao conectar ao servidor!');
      }
    );
  }

  atualizarSegmentos(): void {
    if (this.novaAcao.setor) {
      const setor = this.setores.find(s => s.nome === this.novaAcao.setor);
      this.segmentosDisponiveis = setor ? setor.segmentos : [];
      this.novaAcao.segmento = '';
    } else {
      this.segmentosDisponiveis = [];
      this.novaAcao.segmento = '';
    }
  }

  aplicarFiltro(): void {
    if (this.filtro.trim() === '') {
      this.acoesFiltradas = [...this.acoes];
    } else {
      const filtroLower = this.filtro.toLowerCase();
      this.acoesFiltradas = this.acoes.filter(acao =>
        acao.nome.toLowerCase().includes(filtroLower) ||
        acao.tag.toLowerCase().includes(filtroLower) ||
        acao.setor.toLowerCase().includes(filtroLower) ||
        acao.segmento.toLowerCase().includes(filtroLower)
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
    this.acoesFiltradas.sort((a, b) => {
      let valorA: any = '';
      let valorB: any = '';

      switch (this.ordenarPor) {
        case 'acao':
          valorA = a.nome;
          valorB = b.nome;
          break;
        case 'tag':
          valorA = a.tag;
          valorB = b.tag;
          break;
        case 'setor':
          valorA = a.setor;
          valorB = b.setor;
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

    const setores = new Map<string, number>();
    const cores = new Map<string, string>();

    this.acoes.forEach((acao, index) => {
      const setor = acao.setor;
      setores.set(setor, (setores.get(setor) || 0) + acao.valor);
      if (!cores.has(setor)) {
        cores.set(setor, this.cores[index % this.cores.length]);
      }
    });

    const labels = Array.from(setores.keys());
    const dados = Array.from(setores.values());
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
    this.acaoEdicao = null;
    this.novaAcao = {
      id: 0,
      nome: '',
      tag: '',
      setor: '',
      segmento: '',
      valor: ''
    };
    this.segmentosDisponiveis = [];
  }

  editarAcao(acao: Acao): void {
    console.log('Editando ação:', acao);
    this.mostrarFormulario = true;
    this.editando = true;
    this.acaoEdicao = { ...acao };
    this.novaAcao = { ...acao };
    this.atualizarSegmentos();
    console.log('Forma preenchido com:', this.novaAcao);
  }

 salvarAcao(): void {
    console.log('Salvando ação:', this.novaAcao);
    console.log('Editando?', this.editando);
    console.log('acaoEdicao:', this.acaoEdicao);
    
    const valor = parseFloat(this.novaAcao.valor);
    
    if (!this.novaAcao.nome || !this.novaAcao.setor || !this.novaAcao.segmento || !this.novaAcao.valor || valor <= 0) {
      alert('Por favor, preencha todos os campos corretamente!');
      return;
    }

    this.novaAcao.valor = valor;

    if (this.editando && this.acaoEdicao) {
      console.log('Entrando no modo EDIÇÃO');
      this.novaAcao.id = this.acaoEdicao.id;
      console.log('Enviando para editar:', this.novaAcao);
      
      this.acoeService.editarAcao(this.novaAcao).subscribe(
        (response) => {
          console.log('✓ Ação editada com sucesso:', response);
          this.fecharFormulario();
          this.carregarAcoes();
        },
        error => {
          console.error('✗ Erro ao editar ação:', error);
          alert('Erro ao editar ação!');
        }
      );
    } else {
      console.log('Entrando no modo ADICIONAR');
      const maxId = this.acoes.length > 0 ? Math.max(...this.acoes.map(a => a.id)) : 0;
      this.novaAcao.id = maxId + 1;
      
      this.acoeService.adicionarAcao(this.novaAcao).subscribe(
        (response) => {
          console.log('✓ Ação adicionada com sucesso:', response);
          this.fecharFormulario();
          this.carregarAcoes();
        },
        error => {
          console.error('✗ Erro ao adicionar ação:', error);
          alert('Erro ao adicionar ação!');
        }
      );
    }
  }

  excluirAcao(id: number): void {
    if (confirm('Tem certeza que deseja excluir esta ação?')) {
      this.acoeService.excluirAcao(id).subscribe(
        () => {
          console.log('✓ Ação excluída com sucesso');
          this.carregarAcoes();
        },
        error => {
          console.error('✗ Erro ao excluir ação:', error);
          alert('Erro ao excluir ação!');
        }
      );
    }
  }

  fecharFormulario(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.acaoEdicao = null;
  }

  calcularTotal(): number {
    return this.acoes.reduce((total, acao) => total + acao.valor, 0);
  }

  calcularPercentual(valor: number): string {
    const total = this.calcularTotal();
    return total > 0 ? ((valor / total) * 100).toFixed(2) : '0.00';
  }
}