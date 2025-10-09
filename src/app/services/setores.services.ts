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
  constructor(private http: HttpClient) { }

  getSetores(): Observable<{ setores: Setor[] }> {
    return this.http.get<{ setores: Setor[] }>('assets/data/setores.json');
  }

  getSegmentosPorSetor(setor: string): Observable<string[]> {
    return new Observable(observer => {
      this.getSetores().subscribe(data => {
        const setorEncontrado = data.setores.find(s => s.nome === setor);
        observer.next(setorEncontrado ? setorEncontrado.segmentos : []);
        observer.complete();
      });
    });
  }
}