import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Acao } from '../models/acao.model';

@Injectable({
  providedIn: 'root'
})
export class AcoesService {
  private acoes$ = new BehaviorSubject<Acao[]>([]);

  constructor(private http: HttpClient) {
    this.carregarAcoes();
  }

  carregarAcoes(): void {
    // 1) Prioriza localStorage (persistência local após adicionar/editar/excluir)
    const saved = localStorage.getItem('acoes_scope');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.acoes)) {
          this.acoes$.next(parsed.acoes);
          return;
        }
      } catch (e) {
        console.warn('Erro ao parsear localStorage acoes_scope', e);
      }
    }

    // 2) Se não tiver localStorage, carrega do assets (caminho corrigido)
    this.http.get<{ acoes: Acao[] }>('assets/data/acoes.json').subscribe({
      next: data => this.acoes$.next(data?.acoes ?? []),
      error: err => {
        console.error('Erro ao carregar assets/acoes.json', err);
        this.acoes$.next([]);
      }
    });
  }

  getAcoes(): Observable<Acao[]> {
    return this.acoes$.asObservable();
  }

  adicionarAcao(acao: Acao): void {
    const acoes = this.acoes$.value || [];
    const nextId = acoes.length ? Math.max(...acoes.map(a => a.id)) + 1 : 1;
    const nova = { ...acao, id: nextId };
    const novasAcoes = [...acoes, nova];
    this.acoes$.next(novasAcoes);
    this.salvarAcoes(novasAcoes);
  }

  editarAcao(acao: Acao): void {
    const acoes = this.acoes$.value.map(a => a.id === acao.id ? { ...acao } : a);
    this.acoes$.next(acoes);
    this.salvarAcoes(acoes);
  }

  excluirAcao(id: number): void {
    const acoes = this.acoes$.value.filter(a => a.id !== id);
    this.acoes$.next(acoes);
    this.salvarAcoes(acoes);
  }

  private salvarAcoes(acoes: Acao[]): void {
    localStorage.setItem('acoes_scope', JSON.stringify({ acoes }));
    console.log('Ações salvas localmente');
  }
}
