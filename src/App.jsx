import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // Estados para os formulários de Cadastro
  const [formPet, setFormPet] = useState({ nome: '', especie: '', idade: '', adotante_id: '' });
  const [formAdotante, setFormAdotante] = useState({ nome: '', telefone: '', email: '' });

  // Listas vindas do banco de dados
  const [listaPets, setListaPets] = useState([]);
  const [listaAdotantes, setListaAdotantes] = useState([]);

  // Estado para controlar quem está sendo editado neste momento
  const [editandoPetId, setEditandoPetId] = useState(null);
  const [formEdicaoPet, setFormEdicaoPet] = useState({ nome: '', especie: '', idade: '', adotante_id: '' });

  // Carregar dados automaticamente ao abrir a tela
  useEffect(() => {
    buscarPets();
    buscarAdotantes();
  }, []);

  const buscarPets = async () => {
    try {
      const response = await fetch('http://localhost:5000/pets');
      const data = await response.json();
      console.log("🐾 Pets recebidos do banco:", data); // ← DIAGNÓSTICO
      setListaPets(data);
    } catch (err) {
      console.error("Erro ao buscar pets:", err);
    }
  };

  const buscarAdotantes = async () => {
    try {
      const response = await fetch('http://localhost:5000/adotantes');
      const data = await response.json();
      setListaAdotantes(data);
    } catch (err) {
      console.error("Erro ao buscar adotantes:", err);
    }
  };

  // 🐾 Criar Pet
  const handleSubmitPet = async (e) => {
    e.preventDefault();
    try {
      const dadosParaEnvio = {
        nome: formPet.nome,
        especie: formPet.especie,
        idade: formPet.idade,
        adotante_id: formPet.adotante_id === "" ? null : Number(formPet.adotante_id)
      };

      const response = await fetch('http://localhost:5000/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaEnvio)
      });
      const text = await response.text();
      alert(text);
      setFormPet({ nome: '', especie: '', idade: '', adotante_id: '' });
      buscarPets();
    } catch (error) {
      alert('Erro ao conectar ao servidor backend.');
    }
  };

  // 👤 Criar Adotante
  const handleSubmitAdotante = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/adotantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formAdotante)
      });
      const text = await response.text();
      alert(text);
      setFormAdotante({ nome: '', telefone: '', email: '' });
      buscarAdotantes();
      buscarPets(); // ✅ CORREÇÃO: atualiza o select dos cards após novo adotante
    } catch (error) {
      alert('Erro ao conectar ao servidor backend.');
    }
  };

  //  Excluir Pet
  const handleDeletarPet = async (id) => {
    if (window.confirm("Deseja realmente remover este pet?")) {
      try {
        const response = await fetch(`http://localhost:5000/pets/${id}`, { method: 'DELETE' });
        const text = await response.text();
        alert(text);
        buscarPets();
      } catch (err) {
        alert("Erro ao excluir.");
      }
    }
  };

  //  Excluir Adotante
  const handleDeletarAdotante = async (id) => {
    if (window.confirm("Deseja realmente remover este adotante? Isso pode afetar os pets vinculados a ele.")) {
      try {
        const response = await fetch(`http://localhost:5000/adotantes/${id}`, { method: 'DELETE' });
        const text = await response.text();
        alert(text);
        buscarAdotantes();
        buscarPets();
      } catch (err) {
        alert("Erro ao excluir.");
      }
    }
  };

  // ✍️ Entrar no modo de edição do Pet
  const iniciarEdicao = (pet) => {
    setEditandoPetId(pet.id);
    setFormEdicaoPet({
      nome: pet.nome,
      especie: pet.especie,
      idade: pet.idade,
      // Se já tem adotante, usa o ID dele. Se não, string vazia = disponível
      adotante_id: pet.adotante_id !== null && pet.adotante_id !== undefined ? String(pet.adotante_id) : ''
    });
  };

  // 💾 Salvar Edição do Pet (UPDATE)
  const handleSalvarEdicaoPet = async (id) => {
    try {
      // ← DIAGNÓSTICO: mostra o valor bruto do select antes de qualquer conversão
      console.log("🔍 adotante_id bruto do formulário:", formEdicaoPet.adotante_id, "| tipo:", typeof formEdicaoPet.adotante_id);

      const dadosParaEnvio = {
        nome: formEdicaoPet.nome,
        especie: formEdicaoPet.especie,
        idade: formEdicaoPet.idade,
        adotante_id: formEdicaoPet.adotante_id === "" ? null : Number(formEdicaoPet.adotante_id)
      };

      // ← DIAGNÓSTICO: mostra o objeto final que vai pro backend
      console.log("📦 Dados enviados ao backend:", dadosParaEnvio);

      const response = await fetch(`http://localhost:5000/pets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosParaEnvio)
      });
      const text = await response.text();
      alert(text);
      setEditandoPetId(null);
      buscarPets();
      buscarAdotantes(); // ✅ CORREÇÃO: mantém lista de adotantes sincronizada
    } catch (err) {
      alert("Erro ao salvar alterações.");
    }
  };

  return (
    <div className="painel-page">
      {/* ===== HEADER FIXO ===== */}
      <header className="painel-header">
        <div className="painel-logo"> PetONG</div>
        <nav className="painel-nav">
          <a href="#dashboard">Dashboard</a>
          <a href="#pets">Pets</a>
          <a href="#adotantes">Adotantes</a>
          <a href="#gerenciamento">Mural de Pets</a>
        </nav>
        <div className="painel-badge">Painel Admin</div>
      </header>

      {/* ===== HERO / DASHBOARD ===== */}
      <section id="dashboard" className="painel-hero">
        <div className="painel-hero-circulo"></div>
        <div className="painel-hero-conteudo">
          <p className="painel-tagline">Um lar muda tudo</p>
          <h1>Gerencie sua ONG com <span className="destaque-laranja">facilidade</span></h1>
          <p>Cadastre pets, acompanhe adotantes e mantenha tudo organizado em tempo real no banco MySQL.</p>
          <div className="painel-hero-btns">
            <a href="#pets" className="btn-hero-laranja">Cadastrar Pet</a>
            <a href="#adotantes" className="btn-hero-outline">Cadastrar Adotante</a>
          </div>
        </div>
      </section>

      {/* ===== CARDS INDICADORES INTEGRADOS ===== */}
      <section className="stats-section">
        <div className="stat-card azul">
          <div className="stat-icon">🐶</div>
          <h3>{listaPets.length}</h3>
          <p>Total de Pets no Banco</p>
        </div>
        <div className="stat-card laranja">
          <div className="stat-icon">👤</div>
          <h3>{listaAdotantes.length}</h3>
          <p>Adotantes Registrados</p>
        </div>
      </section>

      {/* ===== SEÇÃO: CADASTRAR PET ===== */}
      <section id="pets" className="form-section form-section-esquerda">
        <div className="form-section-texto">
          <p className="section-tag">Animais</p>
          <h2>Cadastrar <span className="destaque-laranja">Novo Pet</span></h2>
          <p>Adiciona um novo pet na tabela “pets” do banco de dados.</p>
        </div>
        <div className="form-card">
          <form className="meu-formulario" onSubmit={handleSubmitPet}>
            <div className="input-group">
              <label>Nome do Pet</label>
              <input type="text" value={formPet.nome} onChange={(e) => setFormPet({ ...formPet, nome: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Espécie</label>
              <input type="text" value={formPet.especie} onChange={(e) => setFormPet({ ...formPet, especie: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Idade</label>
              <input type="text" value={formPet.idade} onChange={(e) => setFormPet({ ...formPet, idade: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Quem Adotou? (Opcional)</label>
              <select
                value={formPet.adotante_id}
                onChange={(e) => setFormPet({ ...formPet, adotante_id: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', background: '#fff', marginTop: '5px' }}
              >
                <option value="">-- Selecione uma Opção (Disponível) --</option>
                {listaAdotantes.map(adotante => (
                  <option key={adotante.id} value={String(adotante.id)}>
                    {adotante.nome} (ID: #{adotante.id})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-sucesso">🐾 Salvar no Banco</button>
          </form>
        </div>
      </section>

      {/* ===== SEÇÃO: CADASTRAR ADOTANTE ===== */}
      <section id="adotantes" className="form-section form-section-direita">
        <div className="form-card">
          <form className="meu-formulario" onSubmit={handleSubmitAdotante}>
            <div className="input-group">
              <label>Nome Completo</label>
              <input type="text" value={formAdotante.nome} onChange={(e) => setFormAdotante({ ...formAdotante, nome: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>Telefone</label>
              <input type="text" value={formAdotante.telefone} onChange={(e) => setFormAdotante({ ...formAdotante, telefone: e.target.value })} required />
            </div>
            <div className="input-group">
              <label>E-mail</label>
              <input type="email" value={formAdotante.email} onChange={(e) => setFormAdotante({ ...formAdotante, email: e.target.value })} required />
            </div>
            <button type="submit" className="btn-sucesso btn-sucesso-laranja"> Cadastrar Adotante</button>
          </form>
        </div>
        <div className="form-section-texto">
          <p className="section-tag">Pessoas</p>
          <h2>Cadastrar <span className="destaque-laranja">Adotante</span></h2>
          <p>Gerencia os dados dos adotantes e suas informações de contato.</p>
        </div>
      </section>

      {/* ===== SEÇÃO DE CARDS DO PET ===== */}
      <section id="gerenciamento" style={{ padding: '60px 5%', background: '#f9f9f9' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}> Mural de Pets Cadastrados</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '40px' }}>Gerenciamento do CRUD (Visualizar, Editar e Deletar) em tempo real no MySQL</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '25px', justifyContent: 'center' }}>
          {listaPets.map(pet => (
            <div key={pet.id} style={{
              background: '#fff',
              borderRadius: '15px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              padding: '25px',
              width: '280px',
              borderTop: '5px solid #ff7a00',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>

              {editandoPetId === pet.id ? (
                // ===== MODO EDIÇÃO =====
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Nome:</label>
                  <input
                    type="text"
                    style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                    value={formEdicaoPet.nome}
                    onChange={(e) => setFormEdicaoPet({ ...formEdicaoPet, nome: e.target.value })}
                  />

                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Espécie:</label>
                  <input
                    type="text"
                    style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                    value={formEdicaoPet.especie}
                    onChange={(e) => setFormEdicaoPet({ ...formEdicaoPet, especie: e.target.value })}
                  />

                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Idade:</label>
                  <input
                    type="text"
                    style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
                    value={formEdicaoPet.idade}
                    onChange={(e) => setFormEdicaoPet({ ...formEdicaoPet, idade: e.target.value })}
                  />

                  {/* ✅ CAMPO DE ADOTANTE — presente e funcional */}
                  <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Alterar Adotante:</label>
                  <select
                    value={formEdicaoPet.adotante_id}
                    onChange={(e) => setFormEdicaoPet({ ...formEdicaoPet, adotante_id: e.target.value })}
                    style={{ padding: '5px', borderRadius: '5px', border: '1px solid #ccc', background: '#fff', width: '100%' }}
                  >
                    {/* ✅ CORREÇÃO: texto indica que selecionar vazio remove o adotante */}
                    <option value="">-- Remover Adotante (Disponível) --</option>
                    {listaAdotantes.map(adotante => (
                      <option key={adotante.id} value={String(adotante.id)}>
                        {adotante.nome} (ID: #{adotante.id})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleSalvarEdicaoPet(pet.id)}
                    style={{ background: '#28a745', color: '#fff', border: 'none', padding: '8px', borderRadius: '5px', cursor: 'pointer', marginTop: '10px', fontWeight: 'bold' }}
                  >
                     Salvar
                  </button>
                  <button
                    onClick={() => setEditandoPetId(null)}
                    style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                // ===== MODO VISUALIZAÇÃO =====
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <span style={{ background: '#ffe6d5', color: '#ff7a00', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>ID: #{pet.id}</span>
                    <span style={{ fontSize: '24px' }}>{pet.especie && pet.especie.toLowerCase().includes('gato') ? '🐈' : '🐶'}</span>
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '22px' }}>{pet.nome}</h3>
                  <p style={{ margin: '5px 0', color: '#666' }}><strong>Espécie:</strong> {pet.especie}</p>
                  <p style={{ margin: '5px 0', color: '#666' }}><strong>Idade:</strong> {pet.idade || 'Não informada'}</p>

                  {pet.nome_adotante && pet.nome_adotante.trim() !== "" ? (
                    <p style={{ margin: '12px 0 5px 0', color: '#28a745', fontSize: '14px', fontWeight: 'bold' }}>
                       Adotante: {pet.nome_adotante}
                    </p>
                  ) : (
                    <p style={{ margin: '12px 0 5px 0', color: '#007bff', fontSize: '14px', fontWeight: 'bold' }}>
                       Disponível para Adoção
                    </p>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button
                      onClick={() => iniciarEdicao(pet)}
                      style={{ flex: 1, background: '#ffc107', color: '#000', border: 'none', padding: '8px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                       Editar
                    </button>
                    <button
                      onClick={() => handleDeletarPet(pet.id)}
                      style={{ flex: 1, background: '#dc3545', color: '#fff', border: 'none', padding: '8px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                       Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 👤 LISTA DE ADOTANTES */}
        <div style={{ marginTop: '60px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}> Adotantes Responsáveis Cadastrados</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center' }}>
            {listaAdotantes.map(adotante => (
              <div key={adotante.id} style={{
                background: '#fff',
                padding: '15px 20px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
              }}>
                <div>
                  <h4 style={{ margin: 0, color: '#333' }}>
                    {adotante.nome} <span style={{ fontSize: '11px', color: '#999' }}>(ID: #{adotante.id})</span>
                  </h4>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#666' }}>
                    📞 {adotante.telefone} | ✉️ {adotante.email}
                  </p>
                </div>
                <button
                  onClick={() => handleDeletarAdotante(adotante.id)}
                  style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '16px' }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="painel-footer">
        <p>© 2026 PetONG — Desenvolvido por Rafaela Nunes.</p>
      </footer>
    </div>
  );
}

export default App;