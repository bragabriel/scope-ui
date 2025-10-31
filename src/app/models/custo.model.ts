export interface Custo {
  id: number;
  nome: string;
  valor: number;
  frequencia: 'mensal' | 'semanal' | 'anual';
  categoria: string;
}