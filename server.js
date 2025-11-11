const jsonServer = require('json-server')
const path = require('path')
const fs = require('fs')
const db = require(path.join(__dirname, 'src/assets/data/db.js'))

const server = jsonServer.create()
const router = jsonServer.router(db)
const middlewares = jsonServer.defaults()

function salvarArquivo(nomeArquivo, chave, dados) {
  const filePath = path.join(__dirname, 'src/assets/data', nomeArquivo)
  const conteudo = { [chave]: dados }
  fs.writeFileSync(filePath, JSON.stringify(conteudo, null, 2))
  console.log(`✅ ${nomeArquivo} atualizado`)
}

server.use(jsonServer.bodyParser)

// CORS 
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  
  next()
})

server.put('/dadosFinanceiros', (req, res) => {
  const filePath = path.join(__dirname, 'src/assets/data/dados-financeiros.json')
  const newData = req.body
  
  console.log('📥 Recebendo dados financeiros:', newData)
  
  if (!newData || typeof newData !== 'object') {
    console.error('❌ Dados inválidos recebidos')
    return res.status(400).json({ error: 'Dados inválidos' })
  }
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2))
    db.dadosFinanceiros = newData
    res.status(200).json(newData)
    console.log('✅ Dados financeiros atualizados com sucesso')
  } catch (error) {
    console.error('❌ Erro ao atualizar dados financeiros:', error)
    res.status(500).json({ error: 'Erro ao salvar dados' })
  }
})

// Middleware para / para listar endpoints
server.get('/', (req, res) => {
  res.json({
    endpoints: [
      '/acoes',
      '/fiis',
      '/rendasFixas',
      '/custos',
      '/dadosFinanceiros'
    ]
  })
})

// Middlewares padrão do json-server
server.use(middlewares)

// Middleware para interceptar requisições e salvar nos arquivos
server.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const originalSend = res.send
    
    res.send = function(data) {
      originalSend.call(this, data)
      
      setTimeout(() => {
        try {
          if (req.path.includes('/acoes')) {
            salvarArquivo('acoes.json', 'acoes', db.acoes)
          } else if (req.path.includes('/fiis')) {
            salvarArquivo('fiis.json', 'fiis', db.fiis)
          } else if (req.path.includes('/rendasFixas')) {
            salvarArquivo('rendas-fixas.json', 'rendasFixas', db.rendasFixas)
          } else if (req.path.includes('/custos')) {
            salvarArquivo('custos.json', 'custos', db.custos)
          }
        } catch (error) {
          console.error('❌ Erro ao salvar:', error)
        }
      }, 100)
    }
  }
  
  next()
})

server.use(router)

server.listen(3000, () => {
  console.log('✅ JSON Server rodando em http://localhost:3000')
  console.log('📚 Endpoints disponíveis:')
  console.log('   GET/POST/PUT/DELETE  http://localhost:3000/acoes')
  console.log('   GET/POST/PUT/DELETE  http://localhost:3000/fiis')
  console.log('   GET/POST/PUT/DELETE  http://localhost:3000/rendasFixas')
  console.log('   GET/POST/PUT/DELETE  http://localhost:3000/custos')
  console.log('   GET/PUT              http://localhost:3000/dadosFinanceiros')
})