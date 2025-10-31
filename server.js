const jsonServer = require('json-server')
const path = require('path')
const db = require(path.join(__dirname, 'src/assets/data/db.js'))

const server = jsonServer.create()
const router = jsonServer.router(db)
const middlewares = jsonServer.defaults()

// Middleware para / para listar endpoints
server.get('/', (req, res) => {
  res.json({
    endpoints: ['/acoes', '/fiis', '/rendasFixas', '/custos', '/dadosFinanceiros']
  })
})

server.use(middlewares)
server.use(router)

server.listen(3000, () => {
  console.log('✅ JSON Server rodando em http://localhost:3000')
  console.log('📚 Endpoints disponíveis:')
  console.log('   GET  http://localhost:3000/acoes')
  console.log('   GET  http://localhost:3000/fiis')
  console.log('   GET  http://localhost:3000/rendasFixas')
  console.log('   GET  http://localhost:3000/custos')
  console.log('   GET  http://localhost:3000/dadosFinanceiros')
})