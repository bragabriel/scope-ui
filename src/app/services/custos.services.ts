import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Custo } from '../models/custo.model';
import { DadosFinanceiros } from '../models/dados-financeiros.model';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CustosService {
  private readonly apiUrl = 'http://localhost:3000/custos';
  private readonly dadosFinanceirosUrl = 'http://localhost:3000/dadosFinanceiros';
  
  private custosSubject = new BehaviorSubject<Custo[]>([]);
  private dadosFinanceirosSubject = new BehaviorSubject<DadosFinanceiros>({
    salarioBruto: 0,
    salarioLiquido: 0,
    metaSavings: 0
  });

  constructor(private http: HttpClient) {
    this.carregarCustos();
    this.carregarDadosFinanceiros();
  }

  carregarCustos(): void {
    this.http.get<Custo[]>(this.apiUrl).subscribe(
      custos => {
        this.custosSubject.next(custos);
      },
      error => {
        console.error('Erro ao carregar custos:', error);
      }
    );
  }

  carregarDadosFinanceiros(): void {
    this.http.get<DadosFinanceiros>(this.dadosFinanceirosUrl).subscribe(
      dados => {
        this.dadosFinanceirosSubject.next(dados);
      },
      error => {
        console.error('Erro ao carregar dados financeiros:', error);
      }
    );
  }

  getCustos(): Observable<Custo[]> {
    return this.custosSubject.asObservable();
  }

  getDadosFinanceiros(): Observable<DadosFinanceiros> {
    return this.dadosFinanceirosSubject.asObservable();
  }

  adicionarCusto(custo: Custo): Observable<Custo> {
    return this.http.post<Custo>(this.apiUrl, custo).pipe(
      tap(novoCusto => {
        const custosAtuais = this.custosSubject.value;
        this.custosSubject.next([...custosAtuais, novoCusto]);
      })
    );
  }

  editarCusto(custo: Custo): Observable<Custo> {
    return this.http.put<Custo>(`${this.apiUrl}/${custo.id}`, custo).pipe(
      tap(custoAtualizado => {
        const custosAtuais = this.custosSubject.value;
        const index = custosAtuais.findIndex(c => c.id === custo.id);
        if (index > -1) {
          custosAtuais[index] = custoAtualizado;
          this.custosSubject.next([...custosAtuais]);
        }
      })
    );
  }

  excluirCusto(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const custosAtuais = this.custosSubject.value.filter(c => c.id !== id);
        this.custosSubject.next(custosAtuais);
      })
    );
  }

  atualizarDadosFinanceiros(dados: DadosFinanceiros): Observable<DadosFinanceiros> {
    return this.http.put<DadosFinanceiros>(this.dadosFinanceirosUrl, dados).pipe(
      tap(dadosAtualizados => {
        this.dadosFinanceirosSubject.next(dadosAtualizados);
      })
    );
  }

  // Converter custos para mensal
  converterParaMensal(custo: Custo): number {
    switch (custo.frequencia) {
      case 'mensal':
        return custo.valor;
      case 'semanal':
        return custo.valor * 4.33; // média de semanas por mês
      case 'anual':
        return custo.valor / 12;
      default:
        return custo.valor;
    }
  }

  calcularTotalMensal(custos: Custo[]): number {
    return custos.reduce((total, custo) => total + this.converterParaMensal(custo), 0);
  }
}