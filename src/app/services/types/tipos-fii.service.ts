import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TipoFII {
  nome: string;
  segmentos: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TiposFiiService {
  constructor(private http: HttpClient) { }

  getTipos(): Observable<{ tipos: TipoFII[] }> {
    return this.http.get<{ tipos: TipoFII[] }>('assets/data-types/tipos-fiis.json');
  }

  getSegmentosPorTipo(tipo: string): Observable<string[]> {
    return new Observable(observer => {
      this.getTipos().subscribe(data => {
        const tipoEncontrado = data.tipos.find(t => t.nome === tipo);
        observer.next(tipoEncontrado ? tipoEncontrado.segmentos : []);
        observer.complete();
      });
    });
  }
}