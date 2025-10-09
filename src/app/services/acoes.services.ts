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
    this.http.get<{ acoes: Acao[] }>('assets/data/acoes.json')
      .subscribe(data => {
        this.acoes$.next(data.acoes);
      });
  }

  getAcoes(): Observable<Acao[]> {
    return this.acoes$.asObservable();
  }

  adicionarAcao(acao: Acao): void {
    const acoes = this.acoes$.value;
    acao.id = Math.max(...acoes.map(a => a.id), 0) + 1;
    const novasAcoes = [...acoes, acao];
    this.acoes$.next(novasAcoes);
    this.salvarAcoes(novasAcoes);
  }

  editarAcao(acao: Acao): void {
    const acoes = this.acoes$.value.map(a => 
      a.id === acao.id ? acao : a
    );
    this.acoes$.next(acoes);
    this.salvarAcoes(acoes);
  }

  excluirAcao(id: number): void {
    const acoes = this.acoes$.value.filter(a => a.id !== id);
    this.acoes$.next(acoes);
    this.salvarAcoes(acoes);
  }

  private salvarAcoes(acoes: Acao[]): void {
    // Simular salvamento em banco de dados
    // Em produção, você faria uma chamada POST/PUT para um servidor
    localStorage.setItem('acoes_scope', JSON.stringify({ acoes }));
    console.log('Ações salvas localmente');
  }
}