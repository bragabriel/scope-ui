import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { FII } from '../models/fii.model';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FiisService {
  private readonly apiUrl = 'http://localhost:3001/fiis';
  private fiisSubject = new BehaviorSubject<FII[]>([]);

  constructor(private http: HttpClient) {
    this.carregarFiis();
  }

  carregarFiis(): void {
    this.http.get<FII[]>(this.apiUrl).subscribe(
      fiis => {
        this.fiisSubject.next(fiis);
      },
      error => {
        console.error('Erro ao carregar FIIs:', error);
      }
    );
  }

  getFiis(): Observable<FII[]> {
    return this.fiisSubject.asObservable();
  }

  adicionarFii(fii: FII): Observable<FII> {
    return this.http.post<FII>(this.apiUrl, fii).pipe(
      tap(novoFii => {
        const fiisAtuais = this.fiisSubject.value;
        this.fiisSubject.next([...fiisAtuais, novoFii]);
      })
    );
  }

  editarFii(fii: FII): Observable<FII> {
    return this.http.put<FII>(`${this.apiUrl}/${fii.id}`, fii).pipe(
      tap(fiiAtualizado => {
        const fiisAtuais = this.fiisSubject.value;
        const index = fiisAtuais.findIndex(f => f.id === fii.id);
        if (index > -1) {
          fiisAtuais[index] = fiiAtualizado;
          this.fiisSubject.next([...fiisAtuais]);
        }
      })
    );
  }

  excluirFii(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const fiisAtuais = this.fiisSubject.value.filter(f => f.id !== id);
        this.fiisSubject.next(fiisAtuais);
      })
    );
  }
}