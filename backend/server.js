const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// CONFIGURAÇÃO DA CONEXÃO COM O BANCO DE DADOS
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: 'senai103', // 👈 Insira aqui a senha do seu MySQL
    database: 'petong' 
});

db.connect(err => {
    if (err) {
        console.error('Erro de conexao no MySQL:', err);
    } else {
        console.log('Banco de dados MySQL conectado com sucesso.');
    }
});

// ====== AUTENTICAÇÃO: LOGIN ======
app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (email === 'admin@petong.com' && senha === 'admin123') {
        return res.status(200).json({ id: 0, nome: 'Administrador Principal', email: 'admin@petong.com', tipo: 'admin' });
    }

    const sql = "SELECT id, nome, email, tipo FROM usuarios WHERE email = ? AND senha = ?";
    db.query(sql, [email, senha], (err, results) => {
        if (err) return res.status(500).send({ mensagem: 'Erro interno no servidor.' });
        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            res.status(401).send({ mensagem: 'Credenciais inválidas.' });
        }
    });
});

// ====== AUTENTICAÇÃO: CADASTRO ======
app.post('/usuarios', (req, res) => {
    const { nome, email, senha } = req.body;
    
    const sql = "INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, 'user')";
    db.query(sql, [nome, email, senha], (err, result) => {
        if (err) return res.status(400).send({ message: 'O e-mail informado ja esta em uso.' });
        
        const novoUsuarioId = result.insertId;
        const sqlAdotante = "INSERT INTO adotantes (id, nome, email) VALUES (?, ?, ?)";
        db.query(sqlAdotante, [novoUsuarioId, nome, email], (errAdotante) => {
            if (errAdotante) return res.status(500).send({ mensagem: 'Erro ao vincular perfil de adotante.' });
            res.status(201).send({ mensagem: 'Cadastro realizado com sucesso.' });
        });
    });
});

// ====== CRUD DE PETS: APENAS PAGINAÇÃO GERAL ======
app.get('/pets', (req, res) => {
    const { pagina } = req.query;
    
    const itensPorPagina = 6; 
    const atualPagina = parseInt(pagina) || 1;
    const offset = (atualPagina - 1) * itensPorPagina;

    const sqlContagem = "SELECT COUNT(*) AS total FROM pets";
    
    db.query(sqlContagem, (errCount, countResults) => {
        if (errCount) return res.status(500).send(errCount);
        
        const totalItens = countResults[0].total;
        const totalPaginas = Math.ceil(totalItens / itensPorPagina);

        const sqlDados = `
            SELECT pets.*, adotantes.nome AS nome_adotante 
            FROM pets 
            LEFT JOIN adotantes ON pets.adotante_id = adotantes.id
            ORDER BY pets.id DESC
            LIMIT ? OFFSET ?
        `;
        
        db.query(sqlDados, [itensPorPagina, offset], (errData, dataResults) => {
            if (errData) return res.status(500).send(errData);
            
            res.json({
                pets: dataResults,
                totalPaginas: totalPaginas || 1,
                paginaAtual: atualPagina
            });
        });
    });
});

app.post('/pets', (req, res) => {
    const { nome, especie, idade, historia } = req.body;
    const sql = "INSERT INTO pets (nome, especie, idade, historia, status_adocao) VALUES (?, ?, ?, ?, 'disponivel')";
    db.query(sql, [nome, especie, idade, historia || ''], (err) => {
        if (err) return res.status(500).send({ mensagem: 'Erro ao registrar pet.' });
        res.status(201).send({ mensagem: 'Pet incluído com sucesso.' });
    });
});

app.put('/pets/:id', (req, res) => {
    const { id } = req.params;
    const { nome, especie, idade, adotante_id, historia } = req.body;
    
    const status = adotante_id ? 'adotado' : 'disponivel';
    const valAdotante = adotante_id || null;

    const sql = "UPDATE pets SET nome = ?, especie = ?, idade = ?, adotante_id = ?, status_adocao = ?, historia = ? WHERE id = ?";
    db.query(sql, [nome, especie, idade, valAdotante, status, historia || '', id], (err) => {
        if (err) return res.status(500).send({ mensagem: 'Erro ao atualizar dados.' });
        res.send({ mensagem: 'Registro modificado com sucesso.' });
    });
});

app.delete('/pets/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM pets WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).send({ mensagem: 'Incapaz de remover o registro.' });
        res.send({ message: 'Pet excluído com sucesso.' });
    });
});

// ====== HISTÓRICO E SOLICITAÇÕES ======
app.post('/solicitacoes', (req, res) => {
    const { usuario_id, pet_id } = req.body;
    const sqlVerificar = "SELECT * FROM solicitacoes_adocao WHERE pet_id = ? AND status = 'pendente'";
    
    db.query(sqlVerificar, [pet_id], (err, results) => {
        if (err) return res.status(500).send(err);
        if (results.length > 0) return res.status(400).send({ mensagem: 'Este animal ja possui uma intencao em analise.' });

        const sqlSolicitacao = "INSERT INTO solicitacoes_adocao (usuario_id, pet_id) VALUES (?, ?)";
        db.query(sqlSolicitacao, [usuario_id, pet_id], (err) => {
            if (err) return res.status(500).send(err);
            db.query("UPDATE pets SET status_adocao = 'pendente' WHERE id = ?", [pet_id], () => {
                res.status(201).send({ mensagem: 'Intencao enviada para analise.' });
            });
        });
    });
});

app.get('/solicitacoes', (req, res) => {
    const sql = `
        SELECT solicitacoes_adocao.*, usuarios.nome AS nome_usuario, usuarios.email AS email_usuario, pets.nome AS nome_pet, pets.especie 
        FROM solicitacoes_adocao
        JOIN usuarios ON solicitacoes_adocao.usuario_id = usuarios.id
        JOIN pets ON solicitacoes_adocao.pet_id = pets.id
        WHERE solicitacoes_adocao.status = 'pendente'
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.get('/solicitacoes/usuario/:id', (req, res) => {
    const { id } = req.params;
    const sql = `
        SELECT solicitacoes_adocao.*, pets.nome AS nome_pet, pets.especie, pets.idade
        FROM solicitacoes_adocao
        JOIN pets ON solicitacoes_adocao.pet_id = pets.id
        WHERE solicitacoes_adocao.usuario_id = ?
        ORDER BY solicitacoes_adocao.id DESC
    `;
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.put('/solicitacoes/:id', (req, res) => {
    const { id } = req.params;
    const { acao } = req.body;

    db.query("SELECT * FROM solicitacoes_adocao WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).send({ mensagem: 'Solicitacao nao localizada.' });
        const { usuario_id, pet_id } = results[0];

        if (acao === 'aprovar') {
            db.query("UPDATE pets SET adotante_id = ?, status_adocao = 'adotado' WHERE id = ?", [usuario_id, pet_id], () => {
                db.query("UPDATE solicitacoes_adocao SET status = 'aprovado' WHERE id = ?", [id], () => {
                    res.send({ mensagem: 'Adocao homologada com sucesso.' });
                });
            });
        } else {
            db.query("UPDATE pets SET status_adocao = 'disponivel' WHERE id = ?", [pet_id], () => {
                db.query("UPDATE solicitacoes_adocao SET status = 'recusado' WHERE id = ?", [id], () => {
                    res.send({ mensagem: 'Solicitacao arquivada.' });
                });
            });
        }
    });
});

app.get('/adotantes', (req, res) => {
    db.query("SELECT * FROM adotantes", (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.listen(5000, () => {
    console.log('Servidor backend ativo na porta 5000');
});