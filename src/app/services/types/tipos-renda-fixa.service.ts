import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TipoRendaFixa {
  nome: string;
  instituicoes: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TiposRendaFixaService {
  constructor(private http: HttpClient) { }

  getTipos(): Observable<{ tipos: TipoRendaFixa[] }> {
    return this.http.get<{ tipos: TipoRendaFixa[] }>('assets/data-types/tipos-renda-fixa.json');
  }

  getInstituicoesPorTipo(tipo: string): Observable<string[]> {
    return new Observable(observer => {
      this.getTipos().subscribe(data => {
        const tipoEncontrado = data.tipos.find(t => t.nome === tipo);
        observer.next(tipoEncontrado ? tipoEncontrado.instituicoes : []);
        observer.complete();
      });
    });
  }
}