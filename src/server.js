const express = require('express');
const routes = require('./routes');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware para parsear JSON
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// Configuração das rotas
app.use(routes);

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public', 'build')));

// Todas as rotas devem servir o index.html do build
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'build', 'index.html'));
});

module.exports = app;

// Se executado diretamente, conectar ao MongoDB e iniciar o listener
if (require.main === module) {
  const mongoUri = process.env.MONGO_URI || 'mongodb+srv://studiomprojeto3d:studiomprojeto3d@m3d.wzn7h7u.mongodb.net/?retryWrites=true&w=majority&appName=m3d';
  mongoose.connect(mongoUri)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

  const port = process.env.PORT_ADMIN || 4444;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
}
