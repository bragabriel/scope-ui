import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Setor {
  nome: string;
  segmentos: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SetoresService {
  constructor(private http: HttpClient) {}

  // caminho corrigido pra assets/setores.json
  getSetores(): Observable<{ setores: Setor[] }> {
    return this.http.get<{ setores: Setor[] }>('assets/data/setores.json');
  }

  getSegmentosPorSetor(setor: string): Observable<string[]> {
    return new Observable(observer => {
      this.getSetores().subscribe({
        next: data => {
          const setorEncontrado = data.setores.find(s => s.nome === setor);
          observer.next(setorEncontrado ? setorEncontrado.segmentos : []);
          observer.complete();
        },
        error: err => {
          console.error('Erro ao buscar setores', err);
          observer.next([]);
          observer.complete();
        }
      });
    });
  }
}
