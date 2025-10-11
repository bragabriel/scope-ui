import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Acao } from '../models/acao.model';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AcoesService {
  private readonly apiUrl = 'http://localhost:3000/acoes';
  private acoesSubject = new BehaviorSubject<Acao[]>([]);

  constructor(private http: HttpClient) {
    this.carregarAcoes();
  }

  carregarAcoes(): void {
    this.http.get<Acao[]>(this.apiUrl).subscribe(
      acoes => {
        this.acoesSubject.next(acoes);
      },
      error => {
        console.error('Erro ao carregar ações:', error);
      }
    );
  }

  getAcoes(): Observable<Acao[]> {
    return this.acoesSubject.asObservable();
  }

  adicionarAcao(acao: Acao): Observable<Acao> {
    return this.http.post<Acao>(this.apiUrl, acao).pipe(
      tap(novaAcao => {
        const acoesAtuais = this.acoesSubject.value;
        this.acoesSubject.next([...acoesAtuais, novaAcao]);
      })
    );
  }

  editarAcao(acao: Acao): Observable<Acao> {
    return this.http.put<Acao>(`${this.apiUrl}/${acao.id}`, acao).pipe(
      tap(acaoAtualizada => {
        const acoesAtuais = this.acoesSubject.value;
        const index = acoesAtuais.findIndex(a => a.id === acao.id);
        if (index > -1) {
          acoesAtuais[index] = acaoAtualizada;
          this.acoesSubject.next([...acoesAtuais]);
        }
      })
    );
  }

  excluirAcao(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const acoesAtuais = this.acoesSubject.value.filter(a => a.id !== id);
        this.acoesSubject.next(acoesAtuais);
      })
    );
  }
}