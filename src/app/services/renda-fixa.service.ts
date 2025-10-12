import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { RendaFixa } from '../models/renda-fixa.model';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RendaFixaService {
  private readonly apiUrl = 'http://localhost:3002/rendasFixas';
  private rendasFixasSubject = new BehaviorSubject<RendaFixa[]>([]);

  constructor(private http: HttpClient) {
    this.carregarRendasFixas();
  }

  carregarRendasFixas(): void {
    this.http.get<RendaFixa[]>(this.apiUrl).subscribe(
      rendasFixas => {
        this.rendasFixasSubject.next(rendasFixas);
      },
      error => {
        console.error('Erro ao carregar rendas fixas:', error);
      }
    );
  }

  getRendasFixas(): Observable<RendaFixa[]> {
    return this.rendasFixasSubject.asObservable();
  }

  adicionarRendaFixa(rendaFixa: RendaFixa): Observable<RendaFixa> {
    return this.http.post<RendaFixa>(this.apiUrl, rendaFixa).pipe(
      tap(novaRendaFixa => {
        const rendasAtuais = this.rendasFixasSubject.value;
        this.rendasFixasSubject.next([...rendasAtuais, novaRendaFixa]);
      })
    );
  }

  editarRendaFixa(rendaFixa: RendaFixa): Observable<RendaFixa> {
    return this.http.put<RendaFixa>(`${this.apiUrl}/${rendaFixa.id}`, rendaFixa).pipe(
      tap(rendaFixaAtualizada => {
        const rendasAtuais = this.rendasFixasSubject.value;
        const index = rendasAtuais.findIndex(r => r.id === rendaFixa.id);
        if (index > -1) {
          rendasAtuais[index] = rendaFixaAtualizada;
          this.rendasFixasSubject.next([...rendasAtuais]);
        }
      })
    );
  }

  excluirRendaFixa(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const rendasAtuais = this.rendasFixasSubject.value.filter(r => r.id !== id);
        this.rendasFixasSubject.next(rendasAtuais);
      })
    );
  }
}