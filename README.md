# Scope

## Descrição
Scope é um **projeto pessoal** para gerenciar seu **portfólio de ações e FIIs**.  
Permite visualizar, adicionar, editar e excluir ativos, acompanhar valores e distribuição da carteira de investimentos.


## Como rodar

1. Instale as dependências:
```bash
npm install
```

2. Rode o projeto com backend fake e frontend juntos:

```bash
npm run dev
```

Isso irá:
- Subir o Angular (localhost:4200)
- Rodar o JSON-server para ações (localhost:3000)
- Rodar o JSON-server para FIIs (localhost:3001)

Acesse no navegador:

```bash
http://localhost:4200
```