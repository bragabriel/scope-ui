const acoes = require('./acoes.json')
const fiis = require('./fiis.json')
const rendasFixas = require('./rendas-fixas.json')
const custos = require('./custos.json')
const dadosFinanceiros = require('./dados-financeiros.json')

module.exports = {
  acoes: acoes.acoes,
  fiis: fiis.fiis,
  rendasFixas: rendasFixas.rendasFixas,
  custos: custos.custos,
  dadosFinanceiros: dadosFinanceiros
}