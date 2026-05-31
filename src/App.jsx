import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- ESTADOS DE SESSÃO ---
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [telaAutenticacao, setTelaAutenticacao] = useState('login');
  
  // --- FORMULÁRIOS ---
  const [formAuth, setFormAuth] = useState({ nome: '', email: '', senha: '' });
  const [formPet, setFormPet] = useState({ nome: '', especie: '', idade: '', historia: '' });
  const [formEdicaoPet, setFormEdicaoPet] = useState({ nome: '', especie: '', idade: '', adotante_id: '', historia: '' });

  // --- PAGINAÇÃO (SEM FILTROS DE BUSCA) ---
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // --- ARMAZENAMENTO DE DADOS ---
  const [listaPets, setListaPets] = useState([]);
  const [listaAdotantes, setListaAdotantes] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]); 
  const [historicoUsuario, setHistoricoUsuario] = useState([]); 
  const [editandoPetId, setEditandoPetId] = useState(null);
  const [petExclusaoId, setPetExclusaoId] = useState(null);

  // --- TOAST NOTIFICATION ---
  const [toast, setToast] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  const dispararToast = (mensagem, tipo = 'sucesso') => {
    setToast({ visivel: true, mensagem, tipo });
    setTimeout(() => {
      setToast({ visivel: false, message: '', tipo: 'sucesso' });
    }, 4000);
  };

  // Carrega os dados dependendo da página atual
  useEffect(() => {
    if (usuarioLogado) {
      buscarPets();
    }
  }, [usuarioLogado, paginaAtual]);

  useEffect(() => {
    if (usuarioLogado) {
      buscarAdotantes();
      if (usuarioLogado.tipo === 'admin') {
        buscarSolicitacoes();
      } else {
        buscarHistoricoUsuario();
      }
    }
  }, [usuarioLogado]);

  const buscarPets = async () => {
    try {
      const response = await fetch(`http://localhost:5000/pets?pagina=${paginaAtual}`);
      const data = await response.json();
      setListaPets(data.pets || []);
      setTotalPaginas(data.totalPaginas || 1);
    } catch (err) {
      console.error("Erro ao buscar pets:", err);
    }
  };

  const buscarHistoricoUsuario = async () => {
    try {
      const response = await fetch(`http://localhost:5000/solicitacoes/usuario/${usuarioLogado.id}`);
      const data = await response.json();
      setHistoricoUsuario(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const buscarAdotantes = async () => {
    try {
      const response = await fetch('http://localhost:5000/adotantes');
      const data = await response.json();
      setListaAdotantes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const buscarSolicitacoes = async () => {
    try {
      const response = await fetch('http://localhost:5000/solicitacoes');
      const data = await response.json();
      setSolicitacoes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formAuth.email, senha: formAuth.senha })
      });
      const data = await response.json();
      if (response.ok) {
        setUsuarioLogado(data);
        setFormAuth({ nome: '', email: '', senha: '' });
      } else {
        dispararToast(data.mensagem || 'E-mail ou senha incorretos.', 'erro');
      }
    } catch (err) {
      dispararToast('O servidor está indisponível no momento.', 'erro');
    }
  };

  const handleCadastroUsuario = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formAuth)
      });
      const data = await response.json();
      if (response.ok) {
        dispararToast('Conta criada com sucesso! Faça seu login.', 'sucesso');
        setFormAuth({ nome: '', email: '', senha: '' });
        setTelaAutenticacao('login');
      } else {
        dispararToast(data.mensagem || 'Este e-mail já está em uso.', 'erro');
      }
    } catch (err) {
      dispararToast('Erro na conexão com o servidor.', 'erro');
    }
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    setPaginaAtual(1);
  };

  const handleCriarPet = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formPet)
      });
      const data = await response.json();
      if (response.ok) {
        dispararToast('Animal cadastrado e publicado com sucesso!', 'sucesso');
        setFormPet({ nome: '', especie: '', idade: '', historia: '' });
        buscarPets();
      } else {
        dispararToast(data.mensagem || 'Erro ao cadastrar o animal.', 'erro');
      }
    } catch (err) {
      dispararToast('Erro operacional no servidor.', 'erro');
    }
  };

  const handleConfirmarExclusaoPet = async () => {
    try {
      const response = await fetch(`http://localhost:5000/pets/${petExclusaoId}`, { method: 'DELETE' });
      if (response.ok) {
        dispararToast('Ficha do animal removida com sucesso.', 'sucesso');
        setPetExclusaoId(null);
        buscarPets();
      }
    } catch (err) {
      dispararToast('Falha ao remover o registro.', 'erro');
    }
  };

  const iniciarEdicao = (pet) => {
    setEditandoPetId(pet.id);
    setFormEdicaoPet({ 
      nome: pet.nome, 
      especie: pet.especie, 
      idade: pet.idade, 
      adotante_id: pet.adotante_id || '',
      historia: pet.historia || ''
    });
  };

  const handleSalvarEdicaoPet = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/pets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formEdicaoPet)
      });
      if (response.ok) {
        dispararToast('Informações atualizadas com sucesso.', 'sucesso');
        setEditandoPetId(null);
        buscarPets();
        buscarAdotantes();
      } else {
        dispararToast('Erro ao atualizar dados no servidor.', 'erro');
      }
    } catch (err) {
      dispararToast('Erro ao salvar as alterações.', 'erro');
    }
  };

  const handleSolicitarAdocao = async (petId) => {
    try {
      const response = await fetch('http://localhost:5000/solicitacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioLogado.id, pet_id: petId })
      });
      const data = await response.json();
      if (response.ok) {
        dispararToast('Manifestação de interesse enviada para análise!', 'sucesso');
        buscarPets();
        buscarHistoricoUsuario();
      } else {
        dispararToast(data.mensagem || 'Você já possui uma solicitação em andamento para este pet.', 'erro');
      }
    } catch (err) {
      dispararToast('Erro ao processar o pedido de adoção.', 'erro');
    }
  };

  const handleDecidirSolicitacao = async (id, acao) => {
    try {
      const response = await fetch(`http://localhost:5000/solicitacoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao })
      });
      if (response.ok) {
        dispararToast(acao === 'aprovar' ? 'Adoção aprovada com sucesso!' : 'Solicitação arquivada.', 'sucesso');
        buscarSolicitacoes();
        buscarPets();
        buscarAdotantes();
      }
    } catch (err) {
      dispararToast('Falha ao processar a decisão.', 'erro');
    }
  };

  // ====== VISÃO: TELA DE AUTENTICAÇÃO (LOGIN / CADASTRO) ======
  if (!usuarioLogado) {
    return (
      <div className="login-page-container">
        {toast.visivel && <div className={`site-toast ${toast.tipo}`}>{toast.mensagem}</div>}
        <div className="login-split-wrapper">
          
          {/* LADO BRANDING (BANNER DINÂMICO) */}
          <div className="login-brand-side">
            <div className="brand-logo-tag"> PetONG</div>
            <h1>Conectando histórias, transformando vidas.</h1>
            <p>Uma plataforma dedicada à gestão transparente, ágil e humanizada de adoções responsáveis para animais resgatados.</p>
          </div>
          
          {/* LADO DO FORMULÁRIO (CARD PREMIUM) */}
          <div className="login-card-side">
            <div className="auth-card-inner">
              <h2>{telaAutenticacao === 'login' ? 'Acessar Conta' : 'Criar Conta'}</h2>
              <p className="subtitle-card-auth">
                {telaAutenticacao === 'login' 
                  ? 'Insira suas credenciais para entrar no painel administrativo' 
                  : 'Preencha o formulário abaixo para fazer parte da nossa rede de proteção'}
              </p>
              
              {telaAutenticacao === 'login' ? (
                <form onSubmit={handleLogin} className="meu-formulario">
                  <div className="login-field-group">
                    <label>E-mail Corporativo ou Pessoal</label>
                    <input type="email" placeholder="seu@email.com" value={formAuth.email} required onChange={(e) => setFormAuth({ ...formAuth, email: e.target.value })} />
                  </div>
                  <div className="login-field-group">
                    <label>Senha de Acesso</label>
                    <input type="password" placeholder="••••••••" value={formAuth.senha} required onChange={(e) => setFormAuth({ ...formAuth, senha: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-login-submit">Entrar no Sistema</button>
                  <p className="auth-switch-text">
                    Ainda não tem cadastro? <span onClick={() => { setTelaAutenticacao('cadastro'); setFormAuth({ nome: '', email: '', senha: '' }); }}>Crie uma conta agora</span>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleCadastroUsuario} className="meu-formulario">
                  <div className="login-field-group">
                    <label>Nome Completo</label>
                    <input type="text" placeholder="Ex: Maria Souza" value={formAuth.nome} required onChange={(e) => setFormAuth({ ...formAuth, nome: e.target.value })} />
                  </div>
                  <div className="login-field-group">
                    <label>E-mail de Contato</label>
                    <input type="email" placeholder="seu@email.com" value={formAuth.email} required onChange={(e) => setFormAuth({ ...formAuth, email: e.target.value })} />
                  </div>
                  <div className="login-field-group">
                    <label>Crie uma Senha Segura</label>
                    <input type="password" placeholder="Mínimo de 6 caracteres" value={formAuth.senha} required onChange={(e) => setFormAuth({ ...formAuth, senha: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-login-submit unique-register-btn">Finalizar e Criar Conta</button>
                  <p className="auth-switch-text">
                    Já possui uma conta ativa? <span onClick={() => { setTelaAutenticacao('login'); setFormAuth({ nome: '', email: '', senha: '' }); }}>Fazer Login</span>
                  </p>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ====== VISÃO: CONTEÚDO PRINCIPAL (DASHBOARD) ======
  return (
    <div className="painel-page">
      {toast.visivel && <div className={`site-toast ${toast.tipo}`}>{toast.mensagem}</div>}
      
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {petExclusaoId && (
        <div className="custom-overlay" style={{ display: 'flex', zIndex: 9999 }}>
          <div className="custom-modal">
            <div className="modal-icon-warning">⚠️</div>
            <h3>Excluir Registro?</h3>
            <p>Esta ação é permanente e removerá permanentemente a ficha deste animal do banco de dados.</p>
            <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button onClick={() => handleConfirmarExclusaoPet()} className="btn-modal-confirm" type="button">Confirmar Exclusão</button>
              <button onClick={() => setPetExclusaoId(null)} className="btn-modal-cancel" type="button">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* NAVBAR HEADER */}
      <header className="painel-header">
        <div className="painel-logo"><span>🐾</span> PetONG</div>
        <nav className="painel-nav">
          <div className="user-badge">
            <div className="avatar-placeholder">{usuarioLogado.nome ? usuarioLogado.nome.charAt(0) : 'U'}</div>
            <span className="user-identification">{usuarioLogado.nome} <small>{usuarioLogado.tipo === 'admin' ? 'ADMINISTRADOR' : 'ADOTANTE'}</small></span>
          </div>
          <button onClick={handleLogout} className="btn-logout">Sair</button>
        </nav>
      </header>

      {/* CONTEÚDO EXCLUSIVO DO ADMINISTRADOR */}
      {usuarioLogado.tipo === 'admin' && (
        <>
          <section className="stats-section">
            <div className="stat-card">
              <div className="stat-icon azul">📁</div>
              <div>
                <h3>{listaPets.length}</h3>
                <p>Animais nesta página</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-iconSub naranja">⏳</div>
              <div>
                <h3>{solicitacoes.length}</h3>
                <p>Análises de adoção pendentes</p>
              </div>
            </div>
          </section>

          <section className="admin-notifications-area">
            <div className="area-title-container">
              <h2>Solicitações de Adoção em Aberto</h2>
              <p>Analise o perfil dos interessados para homologar a guarda e formalizar o novo tutor.</p>
            </div>
            {solicitacoes.length === 0 ? (
              <p className="no-data-alert">Não há processos de adoção aguardando análise no momento.</p>
            ) : (
              <div className="notifications-list">
                {solicitacoes.map(sol => (
                  <div key={sol.id} className="notification-row">
                    <div className="notification-info">
                      <p>O interessado <strong>{sol.nome_usuario}</strong> ({sol.email_usuario}) manifestou interesse na adoção de <strong>{sol.nome_pet}</strong> ({sol.especie}).</p>
                    </div>
                    <div className="notification-control">
                      <button onClick={() => handleDecidirSolicitacao(sol.id, 'aprovar')} className="btn-action-approve">Aprovar Guarda</button>
                      <button onClick={() => handleDecidirSolicitacao(sol.id, 'rejeitar')} className="btn-action-decline">Recusar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="form-section">
            <div className="form-section-texto">
              <span className="section-tag">Painel de Controle</span>
              <h2>Cadastrar Animal Resgatado</h2>
              <p>Insira os dados cadastrais, porte ou idade estimada e um breve resumo sobre o histórico de resgate do animal para disponibilizá-lo para adoção.</p>
            </div>
            <div className="form-card">
              <form onSubmit={handleCriarPet} className="meu-formulario">
                <div className="form-row-duplo">
                  <div className="input-group">
                    <label>Nome do Pet</label>
                    <input type="text" placeholder="Ex: Fred" value={formPet.nome} required onChange={(e) => setFormPet({ ...formPet, nome: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Espécie</label>
                    <input type="text" placeholder="Ex: Cão, Gato..." value={formPet.especie} required onChange={(e) => setFormPet({ ...formPet, especie: e.target.value })} />
                  </div>
                </div>
                <div className="input-group">
                  <label>Idade Estimada</label>
                  <input type="text" placeholder="Ex: 2 anos" value={formPet.idade} required onChange={(e) => setFormPet({ ...formPet, idade: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>História / Detalhes do Resgate</label>
                  <textarea rows="3" placeholder="Conte um pouco sobre as características e o resgate do pet..." value={formPet.historia} onChange={(e) => setFormPet({ ...formPet, historia: e.target.value })} />
                </div>
                <button type="submit" className="btn-sucesso">Publicar Ficha no Mural</button>
              </form>
            </div>
          </section>
        </>
      )}

      {/* CONTEÚDO EXCLUSIVO DO ADOTANTE */}
      {usuarioLogado.tipo === 'user' && (
        <>
          <section className="institucional-section">
            <div className="institucional-banner">
              <div className="institucional-content">
                <span className="section-tag">Espaço do Adotante</span>
                <h1>Adotar é transformar um futuro.</h1>
                <p>
                  Seja bem-vindo à nossa rede de proteção. Abaixo, você pode conferir todos os animais que aguardam um lar e acompanhar o andamento das suas solicitações em tempo real.
                </p>
              </div>
            </div>
          </section>

          <section className="table-section-wrapper" style={{ marginTop: '40px' }}>
            <div className="table-section-header">
              <span className="section-tag" style={{ marginBottom: '5px' }}>Acompanhamento</span>
              <h3>Minhas Solicitações de Adoção</h3>
              <p>Consulte abaixo os pedidos de adoção enviados e confira o parecer da equipe técnica.</p>
            </div>
            {historicoUsuario.length === 0 ? (
              <p className="no-data-alert">Você ainda não enviou intenções de adoção. Escolha um amigo no mural abaixo e mude uma vida!</p>
            ) : (
              <div className="adotantes-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Nome do Animal</th>
                      <th>Espécie</th>
                      <th>Idade</th>
                      <th>Data do Pedido</th>
                      <th>Status do Processo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicoUsuario.map(item => (
                      <tr key={item.id}>
                        <td><strong>{item.nome_pet}</strong></td>
                        <td>{item.especie}</td>
                        <td>{item.idade}</td>
                        <td>{item.data_solicitacao ? new Date(item.data_solicitacao).toLocaleDateString('pt-BR') : '---'}</td>
                        <td>
                          <span className={`premium-status-badge ${item.status === 'pendente' ? 'pendente' : item.status === 'aprovado' ? 'disponivel' : 'adotado'}`}>
                            {item.status === 'pendente' && '⏳ Em Análise'}
                            {item.status === 'aprovado' && '✅ Aprovado'}
                            {item.status === 'recusado' && '❌ Cancelado'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* SECTION MURAL: LISTAGEM DIRETA SEM FILTROS */}
      <section className="mural-principal">
        <div className="mural-section-title">
          <h2>Mural de Animais Cadastrados</h2>
          <p>Navegue pelas fichas completas integradas em tempo real com nossa base de dados.</p>
        </div>

        {/* MURAL DE CARDS */}
        <div className="grid-mural-pets" style={{ marginTop: '20px' }}>
          {listaPets.length === 0 ? (
            <div className="no-data-alert" style={{ gridColumn: '1/-1', padding: '60px' }}>
              Nenhum animal listado nesta página ou cadastrado no banco de dados.
            </div>
          ) : (
            listaPets.map(pet => (
              <div key={pet.id} className={`pet-card-premium ${pet.status_adocao}`}>
                {editandoPetId === pet.id ? (
                  <div className="meu-formulario form-edicao-inline">
                    <input type="text" value={formEdicaoPet.nome} onChange={(e) => setFormEdicaoPet({ ...formEdicaoPet, nome: e.target.value })} placeholder="Nome" />
                    <input type="text" value={formEdicaoPet.especie} onChange={(e) => setFormEdicaoPet({ ...formEdicaoPet, especie: e.target.value })} placeholder="Espécie" />
                    <input type="text" value={formEdicaoPet.idade} onChange={(e) => setFormEdicaoPet({ ...formEdicaoPet, idade: e.target.value })} placeholder="Idade" />
                    <textarea rows="3" value={formEdicaoPet.historia} onChange={(e) => setFormEdicaoPet({ ...formEdicaoPet, historia: e.target.value })} placeholder="História" />
                    
                    <div className="input-group">
                      <label style={{ fontSize: '11px', fontWeight: '700' }}>Vincular Tutor Fixo</label>
                      <select value={formEdicaoPet.adotante_id} onChange={(e) => setFormEdicaoPet({ ...formEdicaoPet, adotante_id: e.target.value })}>
                        <option value="">Disponível para Adoção</option>
                        {listaAdotantes.map(ad => (
                          <option key={ad.id} value={ad.id}>{ad.nome} (ID: #{ad.id})</option>
                        ))}
                      </select>
                    </div>
                    <div className="edicao-inline-buttons">
                      <button onClick={() => handleSalvarEdicaoPet(pet.id)} className="btn-sucesso-salvar">Gravar</button>
                      <button onClick={() => setEditandoPetId(null)} className="btn-cancelar-edicao">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="premium-card-inner">
                    <div className="premium-card-top">
                      <span className="premium-specie">{pet.especie}</span>
                      <span className={`premium-status-badge ${pet.status_adocao}`}>
                        {pet.status_adocao === 'disponivel' && 'Disponível'}
                        {pet.status_adocao === 'pendente' && 'Em Análise'}
                        {pet.status_adocao === 'adotado' && 'Adotado'}
                      </span>
                    </div>
                    
                    <div className="premium-card-mid">
                      <h3>{pet.nome}</h3>
                      <div className="premium-age-tag">🕒 {pet.idade || 'Idade não informada'}</div>
                      <p className="premium-story-text">
                        {pet.historia ? `"${pet.historia}"` : '"História carinhosa em fase de catalogação por nossos voluntários."'}
                      </p>
                    </div>

                    <div className="premium-card-bottom">
                      {pet.status_adocao === 'adotado' && (
                        <div className="tutor-assigned-box">
                          👤 Tutor Responsável: <strong>{pet.nome_adotante || 'Perfil Vinculado'}</strong>
                        </div>
                      )}

                      <div className="premium-actions-wrapper">
                        {usuarioLogado.tipo === 'admin' ? (
                          <div className="admin-grid-actions">
                            <button onClick={() => iniciarEdicao(pet)} className="btn-grid-edit">Editar Ficha</button>
                            <button onClick={() => setPetExclusaoId(pet.id)} className="btn-grid-delete">Remover</button>
                          </div>
                        ) : (
                          !pet.adotante_id && pet.status_adocao === 'disponivel' && (
                            <button onClick={() => handleSolicitarAdocao(pet.id)} className="btn-solicitar-adocao">Quero Adotar</button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* CONTAINER DA PAGINAÇÃO REAL */}
        <div className="pagination-bar-wrapper">
          <button 
            disabled={paginaAtual === 1} 
            onClick={() => setPaginaAtual(prev => prev - 1)}
            className="btn-pagination-nav"
          >
            ← Anterior
          </button>
          
          <span className="pagination-info-text">
            Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
          </span>

          <button 
            disabled={paginaAtual === totalPaginas} 
            onClick={() => setPaginaAtual(prev => prev + 1)}
            className="btn-pagination-nav"
          >
            Próxima →
          </button>
        </div>
      </section>

      {/* TABELA DE ADOTANTES (ADMIN) */}
      {usuarioLogado.tipo === 'admin' && (
        <section className="table-section-wrapper">
          <div className="table-section-header">
            <h3>Base de Usuários e Adotantes Cadastrados</h3>
            <p>Relação de perfis registrados no ecossistema PetONG.</p>
          </div>
          <div className="adotantes-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Código Identificador</th>
                  <th>Nome Completo</th>
                  <th>E-mail de Contato</th>
                </tr>
              </thead>
              <tbody>
                {listaAdotantes.map(ad => (
                  <tr key={ad.id}>
                    <td><strong>#{ad.id}</strong></td>
                    <td>{ad.nome}</td>
                    <td><span className="table-email-span">{ad.email}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="painel-footer">
        <p>© 2026 PetONG Platform — Painel Corporativo de Gestão de Bem-Estar Animal.</p>
      </footer>
    </div>
  );
}

export default App;