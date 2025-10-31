export interface Custo {
  id: number;
  nome: string;
  valor: number;
  frequencia: 'mensal' | 'semanal' | 'anual';
  categoria: string;
}

export interface DadosFinanceiros {
  salarioBruto: number;
  salarioLiquido: number;
  metaSavings: number; // em percentual
}