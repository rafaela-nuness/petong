const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Conexão com o banco local
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      
    password: 'senai103', 
    database: 'petong'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar no MySQL:', err);
    } else {
        console.log('Conectado com sucesso ao banco petong! 🚀');
    }
});

// ==========================================
// 🐾 CRUD: PETS (INTEGRADO COM RELACIONAMENTO)
// ==========================================

// 1. Cadastrar (INSERT)
app.post('/pets', (req, res) => {
    const { nome, especie, idade, adotante_id } = req.body;
    
    const valAdotanteId = (adotante_id === '' || adotante_id === undefined || adotante_id === null) ? null : Number(adotante_id);

    const sql = "INSERT INTO pets (nome, especie, idade, adotante_id) VALUES (?, ?, ?, ?)";
    db.query(sql, [nome, especie, idade, valAdotanteId], (err, result) => {
        if (err) return res.status(500).send({ error: err.message });
        res.status(201).send('Pet cadastrado com sucesso! 🎉');
    });
});

// 2. Listar (SELECT COM LEFT JOIN)
app.get('/pets', (req, res) => {
    const sql = `
        SELECT 
            pets.id, 
            pets.nome, 
            pets.especie, 
            pets.idade, 
            pets.adotante_id,
            adotantes.nome AS nome_adotante 
        FROM pets
        LEFT JOIN adotantes ON pets.adotante_id = adotantes.id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send({ error: err.message });
        res.status(200).json(results);
    });
});

// 3. Atualizar (UPDATE) — COM LOGS DE DIAGNÓSTICO
app.put('/pets/:id', (req, res) => {
    const { id } = req.params;
    const { nome, especie, idade, adotante_id } = req.body;

    // ← DIAGNÓSTICO: mostra tudo que chegou do frontend
    console.log("📥 PUT /pets/" + id + " — body recebido:", req.body);
    console.log("🔎 adotante_id:", adotante_id, "| tipo:", typeof adotante_id);

    const valAdotanteId = (adotante_id === '' || adotante_id === undefined || adotante_id === null) ? null : Number(adotante_id);

    console.log("💾 valAdotanteId que vai pro banco:", valAdotanteId);

    const sql = "UPDATE pets SET nome = ?, especie = ?, idade = ?, adotante_id = ? WHERE id = ?";
    db.query(sql, [nome, especie, idade, valAdotanteId, id], (err, result) => {
        if (err) {
            console.error("❌ Erro no UPDATE:", err.message);
            return res.status(500).send({ error: err.message });
        }
        console.log("✅ UPDATE executado — affectedRows:", result.affectedRows);
        res.status(200).send('Pet atualizado com sucesso! 🔄');
    });
});

// 4. Deletar (DELETE)
app.delete('/pets/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM pets WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send({ error: err.message });
        res.status(200).send('Pet removido com sucesso! 🗑️');
    });
});

// ==========================================
// 👤 CRUD: ADOTANTES
// ==========================================

// 1. Cadastrar (INSERT)
app.post('/adotantes', (req, res) => {
    const { nome, telefone, email } = req.body;
    const sql = "INSERT INTO adotantes (nome, telefone, email) VALUES (?, ?, ?)";
    db.query(sql, [nome, telefone, email], (err, result) => {
        if (err) return res.status(500).send({ error: err.message });
        res.status(201).send('Adotante cadastrado com sucesso! 👤✨');
    });
});

// 2. Listar (SELECT)
app.get('/adotantes', (req, res) => {
    const sql = "SELECT * FROM adotantes";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send({ error: err.message });
        res.status(200).json(results);
    });
});

// 3. Deletar (DELETE)
app.delete('/adotantes/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM adotantes WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).send({ error: err.message });
        res.status(200).send('Adotante removido com sucesso! 🗑️');
    });
});

// Ligar o Servidor
app.listen(5000, () => {
    console.log('Servidor rodando na porta 5000 🔥');
});