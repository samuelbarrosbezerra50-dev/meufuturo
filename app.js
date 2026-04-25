/* ============================================================
   ⚙️ CONFIGURAÇÃO DO SUPABASE
   
   👉 SUBSTITUA os 2 valores abaixo pelas suas chaves do Supabase.
   👉 Tutorial completo no arquivo SETUP-SUPABASE.md (passo 4-5).
   
   Onde encontrar:
   1. Acesse https://supabase.com e entre no seu projeto
   2. Menu lateral: Project Settings (⚙️) → API
   3. Copie "Project URL" e cole em SUPABASE_URL
   4. Copie "anon public" e cole em SUPABASE_KEY
============================================================ */
const SUPABASE_URL = 'https://lodvefqzlugdwubmwufy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZHZlZnF6bHVnZHd1Ym13dWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTUxMTEsImV4cCI6MjA5MjYzMTExMX0.E-na0bU1u_eBFbxz9sAYDEU9Xa1bZzct4dxVOwSUFYw';

/* ============================================================
   CLIENTE SUPABASE + AUTENTICAÇÃO
============================================================ */
let supa = null;
let currentUser = null;
let syncTimeout = null;

/* ============================================================
   PAINEL DE DEBUG (temporário — para investigar problemas)
============================================================ */
function debugLog(msg, type){
  type = type || 'info';
  let panel = document.getElementById('debugPanel');
  if(!panel){
    panel = document.createElement('div');
    panel.id = 'debugPanel';
    panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#000;color:#9EE493;padding:10px 14px;font-family:monospace;font-size:11px;line-height:1.5;max-height:40vh;overflow-y:auto;z-index:99999;border-top:2px solid #D4B272;box-shadow:0 -4px 16px rgba(0,0,0,.5)';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><strong style="color:#D4B272">🔍 DEBUG (toque para fechar)</strong><span id="debugCount" style="color:#888">0 logs</span></div><div id="debugLogs"></div>';
    panel.addEventListener('click', ()=>{panel.style.display='none'});
    document.body.appendChild(panel);
  }
  const logsEl = document.getElementById('debugLogs');
  const countEl = document.getElementById('debugCount');
  const colors = {info:'#9EE493',warn:'#FBE9A0',error:'#FF8A80',ok:'#9EE493'};
  const time = new Date().toLocaleTimeString('pt-BR');
  const item = document.createElement('div');
  item.style.cssText = 'padding:3px 0;border-bottom:1px dotted rgba(255,255,255,.1);color:'+(colors[type]||'#fff')+';word-break:break-word';
  item.innerHTML = '<span style="color:#888">'+time+'</span> '+msg;
  logsEl.appendChild(item);
  countEl.textContent = logsEl.children.length+' logs';
  panel.scrollTop = panel.scrollHeight;
}

window.addEventListener('error', function(e){
  debugLog('❌ ERRO JS: <strong>'+(e.message||'desconhecido')+'</strong> em '+(e.filename||'?')+':'+(e.lineno||'?'),'error');
});
window.addEventListener('unhandledrejection', function(e){
  debugLog('❌ PROMISE REJEITADA: <strong>'+(e.reason?.message||e.reason||'desconhecido')+'</strong>','error');
});

debugLog('✓ Página carregou, JavaScript executando','ok');

function initSupabase(){
  debugLog('initSupabase() chamada','info');
  const configured = SUPABASE_URL && SUPABASE_URL !== 'https://lodvefqzlugdwubmwufy.supabase.co && SUPABASE_KEY && SUPABASE_KEY' !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZHZlZnF6bHVnZHd1Ym13dWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNTUxMTEsImV4cCI6MjA5MjYzMTExMX0.E-na0bU1u_eBFbxz9sAYDEU9Xa1bZzct4dxVOwSUFYw';
  debugLog('Configurado: '+configured+' | URL OK: '+(!!SUPABASE_URL && SUPABASE_URL.startsWith('https://'))+' | KEY OK: '+(!!SUPABASE_KEY && SUPABASE_KEY.startsWith('eyJ')),'info');
  if(!configured){
    debugLog('⚠ Mostrando aviso de configuração','warn');
    document.getElementById('authConfigWarn').style.display = 'block';
    document.getElementById('authTabs').style.display = 'none';
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
    return false;
  }
  if(typeof window.supabase === 'undefined'){
    debugLog('❌ window.supabase NÃO existe — biblioteca não carregou','error');
    return false;
  }
  try {
    supa = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    debugLog('✓ Cliente Supabase criado','ok');
    return true;
  } catch(e){
    debugLog('❌ Erro ao criar cliente: '+e.message,'error');
    return false;
  }
}

function showAuthMsg(id, text, type){
  const el = document.getElementById(id);
  if(!el) return;
  el.textContent = text;
  el.className = 'auth-msg show '+type;
}

function switchAuthTab(tab){
  document.querySelectorAll('.auth-tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
  document.getElementById('loginForm').style.display = tab==='login'?'block':'none';
  document.getElementById('signupForm').style.display = tab==='signup'?'block':'none';
  document.getElementById('loginMsg').classList.remove('show');
  document.getElementById('signupMsg').classList.remove('show');
}
window.switchAuthTab = switchAuthTab;
window.doLogin = doLogin;
window.doSignup = doSignup;
window.doForgot = doForgot;
window.doLogout = doLogout;

async function doSignup(){
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass = document.getElementById('signupPass').value;
  const btn = document.getElementById('btnSignup');

  if(!name || name.length<2) return showAuthMsg('signupMsg','Digite seu nome (mínimo 2 letras).','error');
  if(!email.includes('@')) return showAuthMsg('signupMsg','Email inválido.','error');
  if(pass.length<6) return showAuthMsg('signupMsg','A senha precisa ter pelo menos 6 caracteres.','error');

  btn.disabled = true;
  btn.textContent = 'Criando conta...';

  try{
    const {data, error} = await supa.auth.signUp({
      email, password: pass,
      options:{data:{name:name}}
    });
    if(error) throw error;
    if(data.user && !data.session){
      showAuthMsg('signupMsg','✓ Conta criada! Verifique seu email para confirmar. Depois volte e faça login.','success');
      setTimeout(()=>switchAuthTab('login'),3000);
    } else if(data.session){
      // Login direto (quando confirmação de email está desabilitada)
      currentUser = data.user;
      await ensureUserRow(name);
      await enterApp();
    }
  } catch(err){
    showAuthMsg('signupMsg','Erro: '+(err.message||'falha ao criar conta'),'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12 7a4 4 0 11-8 0 4 4 0 018 0zM20 8v6M23 11h-6"/></svg> Criar conta grátis';
  }
}

async function doLogin(){
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  const btn = document.getElementById('btnLogin');

  if(!email.includes('@')) return showAuthMsg('loginMsg','Email inválido.','error');
  if(!pass) return showAuthMsg('loginMsg','Digite sua senha.','error');

  btn.disabled = true;
  btn.textContent = 'Entrando...';

  try{
    const {data, error} = await supa.auth.signInWithPassword({email, password: pass});
    if(error) throw error;
    currentUser = data.user;
    await enterApp();
  } catch(err){
    let msg = err.message||'falha ao entrar';
    if(msg.includes('Invalid login')) msg = 'Email ou senha incorretos.';
    if(msg.includes('Email not confirmed')) msg = 'Confirme seu email primeiro (verifique a caixa de entrada).';
    showAuthMsg('loginMsg',msg,'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg> Entrar';
  }
}

async function doForgot(){
  const email = document.getElementById('loginEmail').value.trim();
  if(!email.includes('@')) return showAuthMsg('loginMsg','Digite seu email primeiro no campo acima.','error');
  try{
    const {error} = await supa.auth.resetPasswordForEmail(email);
    if(error) throw error;
    showAuthMsg('loginMsg','✓ Email de recuperação enviado. Verifique sua caixa de entrada.','success');
  } catch(err){
    showAuthMsg('loginMsg','Erro: '+(err.message||'falha'),'error');
  }
}

async function ensureUserRow(nameFromSignup){
  // Garante que existe uma linha em user_data para este usuário
  const {data, error} = await supa.from('user_data').select('user_id').eq('user_id', currentUser.id).maybeSingle();
  if(!data && !error){
    const nome = nameFromSignup || currentUser.user_metadata?.name || currentUser.email.split('@')[0];
    await supa.from('user_data').insert({
      user_id: currentUser.id,
      data: {},
      display_name: nome,
    });
  }
}

async function doLogout(){
  if(!confirm('Sair da conta? Seus dados estão salvos na nuvem, você pode voltar a qualquer momento.')) return;
  // Força sync pendente
  if(syncTimeout){ clearTimeout(syncTimeout); await syncNow(); }
  await supa.auth.signOut();
  currentUser = null;
  location.reload();
}

function setSyncStatus(state, text){
  const el = document.getElementById('syncStatus');
  const txt = document.getElementById('syncText');
  if(!el) return;
  el.classList.remove('saving','error');
  if(state==='saving') el.classList.add('saving');
  else if(state==='error') el.classList.add('error');
  if(txt) txt.textContent = text || (state==='saving'?'salvando...':state==='error'?'erro':'sincronizado');
}

async function enterApp(){
  await ensureUserRow();
  // Carrega dados do usuário
  try {
    setSyncStatus('saving','carregando...');
    const {data, error} = await supa.from('user_data').select('data, display_name').eq('user_id', currentUser.id).single();
    if(error) throw error;
    const serverData = data.data || {};
    const displayName = data.display_name || currentUser.email.split('@')[0];

    // Aplica dados carregados ao state
    if(serverData && Object.keys(serverData).length > 0){
      Object.assign(state, serverData);
    }
    state.displayName = displayName;

    // Atualiza UI
    document.getElementById('userName').textContent = displayName;
    const initials = displayName.split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase() || 'FA';
    document.getElementById('userAvatar').textContent = initials;

    // Atualiza saudação
    const heroName = document.querySelector('.hero-name');
    if(heroName) heroName.innerHTML = `Olá, ${displayName} 👋`;
    const metaSub = document.querySelector('#page-metas .page-subtitle');
    if(metaSub) metaSub.innerHTML = `👋 Oi, ${displayName}. Continue cumprindo as suas metas para terminar seus estudos no dia <strong id="endDate">${state.dataFinal?formatDateBR(state.dataFinal):'—'}</strong>.`;

    setSyncStatus('ok','sincronizado');
  } catch(err){
    console.error('Erro carregar dados:',err);
    setSyncStatus('error','erro ao carregar');
    toast('Erro ao carregar seus dados. Usando dados locais.','error');
  }

  // Esconde tela de auth, mostra app
  document.getElementById('authWrap').style.display = 'none';
  document.getElementById('mainApp').style.display = 'flex';

  // Dispara render inicial
  renderTopbar();
  renderHome();
}

function formatDateBR(iso){
  if(!iso) return '';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Sincroniza o state atual com o Supabase (com debounce de 1.5s)
 */
function syncToSupabase(){
  if(!supa || !currentUser) return;
  if(syncTimeout) clearTimeout(syncTimeout);
  setSyncStatus('saving','salvando...');
  syncTimeout = setTimeout(syncNow, 1500);
}

async function syncNow(){
  if(!supa || !currentUser) return;
  try {
    // Remove dados transitórios que não precisam ir pro servidor
    const toSave = {...state};
    delete toSave.displayName; // vai em coluna separada
    const {error} = await supa.from('user_data').update({
      data: toSave,
      updated_at: new Date().toISOString(),
    }).eq('user_id', currentUser.id);
    if(error) throw error;
    setSyncStatus('ok','sincronizado');
  } catch(err){
    console.error('Erro sync:',err);
    setSyncStatus('error','erro — tentando de novo');
    setTimeout(syncToSupabase, 5000); // tenta de novo em 5s
  }
}

// Listeners de autenticação
document.addEventListener('DOMContentLoaded', async ()=>{
  debugLog('DOMContentLoaded disparado','ok');
  if(!initSupabase()){
    debugLog('initSupabase retornou false — parando','warn');
    return;
  }

  // Enter submete form
  ['loginEmail','loginPass'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});
  });
  ['signupName','signupEmail','signupPass'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('keydown',e=>{if(e.key==='Enter')doSignup()});
  });

  // Botão sair
  const lo = document.getElementById('btnLogout');
  if(lo) lo.addEventListener('click', doLogout);

  debugLog('Listeners ligados, verificando sessão...','info');
  try {
    const {data:{session}} = await supa.auth.getSession();
    debugLog('Tem sessão? '+!!session,'info');
    if(session){
      currentUser = session.user;
      debugLog('Usuário logado: '+currentUser.email,'ok');
      await enterApp();
    } else {
      debugLog('Sem sessão — aguardando login','info');
    }
  } catch(e){
    debugLog('❌ Erro em getSession: '+e.message,'error');
  }
});

/* ============================================================
   DADOS DO PLANO
============================================================ */
/* ============================================================
   EDITAIS CRUZADOS: AFRFB (FGV 2023) + TCU AUFC (FGV 2022) + BACEN Analista (Cebraspe 2024)
   Matérias priorizadas por FREQUÊNCIA cruzada nos 3 editais:
     COMUNS AOS 3: Português, RLM, Constitucional, Administrativo, Contabilidade
     COMUNS A 2: Auditoria (RFB/TCU), Tributário (RFB/TCU), AFO (TCU/BACEN)
     ESPECÍFICAS: LTC (RFB), Controle Externo (TCU), Economia/Finanças (BACEN)
============================================================ */
const SUBJECTS = [
  {id:'portugues',name:'Língua Portuguesa',short:'PORTUGUÊS',color:'#4A6B4E',peso:3,
    editais:['AFRFB','TCU','BACEN'],
    topics:[
      'Compreensão e interpretação de textos',
      'Tipologia e gêneros textuais',
      'Ortografia oficial (novo acordo)',
      'Acentuação gráfica',
      'Classes de palavras — substantivo, adjetivo, pronome',
      'Classes de palavras — verbo, advérbio, preposição',
      'Sintaxe da oração — termos essenciais e integrantes',
      'Sintaxe do período — coordenação',
      'Sintaxe do período — subordinação',
      'Concordância verbal',
      'Concordância nominal',
      'Regência verbal e nominal',
      'Emprego do sinal indicativo de crase',
      'Pontuação',
      'Colocação pronominal',
      'Semântica — sinônimos, antônimos, parônimos, homônimos',
      'Coesão e coerência textual',
      'Redação oficial — Manual da Presidência',
      'Figuras de linguagem',
      'Reescrita de frases',
    ]},
  {id:'rlm',name:'Raciocínio Lógico e Matemática',short:'RLM',color:'#8B5A3C',peso:3,
    editais:['AFRFB','TCU','BACEN'],
    topics:[
      'Estruturas lógicas — proposições e conectivos',
      'Tabelas-verdade',
      'Equivalências lógicas (Leis de De Morgan)',
      'Negação de proposições compostas',
      'Argumentação — validade de argumentos',
      'Lógica de primeira ordem e quantificadores',
      'Diagramas lógicos e de Venn',
      'Conjuntos — operações e problemas',
      'Sequências numéricas e lógicas',
      'Análise combinatória — arranjos, permutações, combinações',
      'Probabilidade',
      'Estatística descritiva — médias, variância, desvio padrão',
      'Regra de três simples e composta',
      'Porcentagem',
      'Juros simples e compostos',
      'Equações e inequações de 1º e 2º grau',
      'Progressões aritmética e geométrica',
      'Funções — afim, quadrática, exponencial, logarítmica',
      'Matrizes, determinantes e sistemas lineares',
      'Geometria plana e espacial básica',
    ]},
  {id:'constitucional',name:'Direito Constitucional',short:'CONSTITUCIONAL',color:'#2E86AB',peso:3,
    editais:['AFRFB','TCU','BACEN'],
    topics:[
      'Teoria geral da Constituição — conceitos e classificações',
      'Poder constituinte — originário e derivado',
      'Princípios fundamentais (arts. 1º ao 4º CF)',
      'Direitos e deveres individuais e coletivos — art. 5º',
      'Remédios constitucionais (HC, MS, MI, HD, ação popular)',
      'Direitos sociais (art. 6º ao 11)',
      'Nacionalidade',
      'Direitos políticos e partidos políticos',
      'Organização político-administrativa',
      'União, Estados, DF e Municípios — competências',
      'Administração Pública Constitucional (art. 37)',
      'Servidores públicos — regras constitucionais',
      'Poder Legislativo — estrutura e atribuições',
      'Processo legislativo',
      'Fiscalização contábil, financeira e orçamentária',
      'Tribunais de Contas — TCU (art. 70 a 75)',
      'Poder Executivo — atribuições do Presidente',
      'Poder Judiciário — organização e competências',
      'Funções essenciais à justiça (MP, AGU, Defensoria)',
      'Controle de constitucionalidade',
      'Sistema Tributário Nacional (art. 145 a 162)',
      'Finanças Públicas e Orçamento (art. 163 a 169)',
      'Ordem econômica e financeira',
      'Sistema Financeiro Nacional (art. 192)',
    ]},
  {id:'administrativo',name:'Direito Administrativo',short:'ADMINISTRATIVO',color:'#5A3B82',peso:3,
    editais:['AFRFB','TCU','BACEN'],
    topics:[
      'Estado, governo e Administração Pública',
      'Princípios do Direito Administrativo',
      'Regime jurídico-administrativo',
      'Organização administrativa — direta e indireta',
      'Autarquias, fundações, empresas públicas e SEM',
      'Atos administrativos — conceito, requisitos, atributos',
      'Atos administrativos — classificação e extinção',
      'Poderes da Administração',
      'Agentes públicos — classificação',
      'Lei 8.112/90 — regime dos servidores federais',
      'Responsabilidade civil do Estado',
      'Contratos administrativos — Lei 14.133/21',
      'Licitações — Nova Lei de Licitações 14.133/21',
      'Convênios e consórcios',
      'Serviços públicos — concessão e permissão',
      'Intervenção do Estado na propriedade',
      'Improbidade administrativa — Lei 8.429/92',
      'Processo administrativo federal — Lei 9.784/99',
      'Controle da Administração Pública',
      'LAI — Lei de Acesso à Informação (12.527/11)',
      'LGPD — Lei Geral de Proteção de Dados',
    ]},
  {id:'contabilidade',name:'Contabilidade Geral e Avançada',short:'CONTABILIDADE',color:'#C9A961',peso:3,
    editais:['AFRFB','TCU','BACEN'],
    topics:[
      'Conceitos, objetivos e finalidades da contabilidade',
      'Patrimônio — ativo, passivo e patrimônio líquido',
      'Equação fundamental do patrimônio',
      'Atos e fatos contábeis',
      'Método das partidas dobradas',
      'Plano de contas',
      'Lançamentos e livros contábeis',
      'Balancete de verificação',
      'Operações com mercadorias',
      'Tributos sobre compras e vendas (ICMS, IPI, PIS, COFINS)',
      'Folha de pagamento',
      'Depreciação, amortização e exaustão',
      'Teste de recuperabilidade (impairment)',
      'Ajuste a valor presente',
      'Estoques — CPC 16',
      'Ativo imobilizado — CPC 27',
      'Ativo intangível — CPC 04',
      'Investimentos — MEP, custo, valor justo',
      'Provisões e passivos contingentes — CPC 25',
      'Patrimônio líquido',
      'Demonstração do Resultado (DRE)',
      'DMPL e DLPA',
      'Demonstração dos Fluxos de Caixa (DFC)',
      'Demonstração do Valor Adicionado (DVA)',
      'Consolidação de demonstrações',
      'Combinação de negócios — CPC 15',
      'Análise de balanços — índices de liquidez, endividamento, rentabilidade',
    ]},
  {id:'tributario',name:'Direito Tributário',short:'TRIBUTÁRIO',color:'#B83A3A',peso:2,
    editais:['AFRFB','TCU'],
    topics:[
      'Sistema Tributário Nacional — princípios constitucionais',
      'Imunidades tributárias',
      'Competência tributária',
      'Conceito e classificação dos tributos',
      'Impostos — federais, estaduais e municipais',
      'Taxas — poder de polícia e serviço público',
      'Contribuições — de melhoria, sociais, CIDE',
      'Empréstimos compulsórios',
      'Fontes do Direito Tributário',
      'Vigência, aplicação e interpretação da legislação',
      'Obrigação tributária — principal e acessória',
      'Fato gerador, sujeito ativo e passivo',
      'Solidariedade e capacidade tributária',
      'Domicílio tributário',
      'Responsabilidade tributária',
      'Crédito tributário — constituição e lançamento',
      'Suspensão do crédito tributário',
      'Extinção do crédito tributário',
      'Exclusão do crédito tributário',
      'Garantias e privilégios do crédito',
      'Administração tributária — fiscalização e dívida ativa',
      'Processo Administrativo Fiscal (PAF)',
    ]},
  {id:'auditoria',name:'Auditoria',short:'AUDITORIA',color:'#3A6B3A',peso:2,
    editais:['AFRFB','TCU'],
    topics:[
      'Conceitos, objetivos e classificação de auditoria',
      'Normas Brasileiras de Contabilidade — NBC TAs',
      'Auditoria interna x externa — diferenças',
      'Auditoria governamental — conceitos e modalidades',
      'Planejamento de auditoria',
      'Materialidade e risco de auditoria',
      'Avaliação do controle interno (COSO)',
      'Procedimentos substantivos e de controle',
      'Técnicas de auditoria — inspeção, observação, confirmação',
      'Amostragem em auditoria',
      'Papéis de trabalho',
      'Evidências de auditoria',
      'Achados de auditoria',
      'Relatório e parecer de auditoria',
      'Fraude e erro em auditoria — NBC TA 240',
      'Auditoria de conformidade e de desempenho',
      'Responsabilidade do auditor',
      'Continuidade (going concern)',
      'Eventos subsequentes',
    ]},
  {id:'afo',name:'AFO — Administração Financeira e Orçamentária',short:'AFO',color:'#1B5E7F',peso:2,
    editais:['TCU','BACEN'],
    topics:[
      'Orçamento Público — conceitos e princípios',
      'Orçamento-Programa',
      'Ciclo orçamentário',
      'Plano Plurianual (PPA)',
      'Lei de Diretrizes Orçamentárias (LDO)',
      'Lei Orçamentária Anual (LOA)',
      'Receita pública — classificação e estágios',
      'Despesa pública — classificação e estágios',
      'Créditos adicionais — suplementar, especial, extraordinário',
      'Lei de Responsabilidade Fiscal (LC 101/00)',
      'Gestão fiscal responsável',
      'Dívida pública e endividamento',
      'Transferências voluntárias e vinculações',
      'Execução orçamentária e financeira',
      'Restos a pagar e despesas de exercícios anteriores',
      'Sistema de Administração Financeira (SIAFI)',
    ]},
  {id:'controle',name:'Controle Externo e Auditoria Governamental',short:'CONTROLE EXT.',color:'#7A3E3E',peso:1,
    editais:['TCU'],
    topics:[
      'Controle interno e externo — fundamentos',
      'Sistema de Controle Externo brasileiro',
      'Competências constitucionais do TCU (art. 70-75)',
      'Lei Orgânica do TCU (Lei 8.443/92)',
      'Regimento Interno do TCU',
      'Julgamento de contas dos administradores',
      'Fiscalizações do TCU — levantamento, auditoria, inspeção',
      'Processo no TCU — fases e recursos',
      'Responsabilização — multas, débitos, inabilitação',
      'Tomada de contas especial',
      'Auditoria operacional e de desempenho',
      'Controles concomitantes e a posteriori',
      'Jurisprudência do TCU — súmulas relevantes',
    ]},
  {id:'ltc',name:'Legislação Tributária sobre Consumo (LTC)',short:'LTC',color:'#C2410C',peso:1,
    editais:['AFRFB'],
    topics:[
      'IPI — hipótese de incidência, base de cálculo, alíquotas',
      'IPI — não-cumulatividade e créditos',
      'II e IE — Imposto de Importação e Exportação',
      'ICMS — aspectos gerais e Lei Kandir',
      'ICMS — substituição tributária',
      'ISS — LC 116/2003',
      'PIS/COFINS — regime cumulativo',
      'PIS/COFINS — regime não-cumulativo',
      'PIS/COFINS-Importação',
      'Simples Nacional — LC 123/06',
      'Regime Aduaneiro — classificação e controle',
      'Reforma Tributária — CBS, IBS e Imposto Seletivo',
      'Imposto sobre a Renda — Pessoa Física (IRPF)',
      'Imposto sobre a Renda — Pessoa Jurídica (IRPJ)',
      'Contribuição Social sobre o Lucro Líquido (CSLL)',
    ]},
  {id:'economia',name:'Economia e Finanças',short:'ECONOMIA',color:'#D97706',peso:1,
    editais:['BACEN'],
    topics:[
      'Microeconomia — teoria do consumidor',
      'Microeconomia — teoria da firma',
      'Estruturas de mercado — concorrência, monopólio, oligopólio',
      'Falhas de mercado e externalidades',
      'Macroeconomia — contabilidade nacional',
      'Demanda e oferta agregadas',
      'Modelo IS-LM',
      'Política fiscal',
      'Política monetária e mercado de moedas',
      'Inflação — causas e consequências',
      'Desemprego e curva de Phillips',
      'Crescimento econômico',
      'Economia do setor público',
      'Economia internacional — comércio e câmbio',
      'Balanço de pagamentos',
      'Sistema Financeiro Nacional — estrutura e instituições',
      'Banco Central — funções e atuação',
      'Mercado financeiro e de capitais',
      'Política monetária brasileira',
      'Lei 4.595/64 e Lei 9.069/95',
    ]},
  {id:'contpub',name:'Contabilidade Pública',short:'CONT. PÚBLICA',color:'#8B6B1F',peso:1,
    editais:['TCU'],
    topics:[
      'Conceitos e princípios da contabilidade aplicada ao setor público',
      'Plano de Contas Aplicado ao Setor Público (PCASP)',
      'MCASP — Manual de Contabilidade Aplicada ao Setor Público',
      'Patrimônio público — bens, direitos e obrigações',
      'Receita e despesa sob enfoque patrimonial',
      'Variações patrimoniais aumentativas e diminutivas',
      'Demonstrações contábeis aplicadas ao setor público',
      'Balanço Orçamentário',
      'Balanço Financeiro',
      'Balanço Patrimonial',
      'Demonstração das Variações Patrimoniais',
      'Demonstração dos Fluxos de Caixa',
      'Consolidação das contas públicas',
      'NBC TSP — Normas Brasileiras de Contabilidade do Setor Público',
    ]},
  {id:'ti',name:'Noções de Informática',short:'INFORMÁTICA',color:'#1E3A8A',peso:2,
    editais:['AFRFB','BACEN'],
    topics:[
      'Conceitos de hardware e software',
      'Sistemas operacionais Windows e Linux',
      'Pacote Office — Word, Excel, PowerPoint',
      'Google Workspace — Docs, Sheets, Slides',
      'Redes de computadores — LAN, WAN, Internet',
      'Internet — navegadores, correio eletrônico',
      'Segurança da informação — princípios',
      'Malware, phishing e engenharia social',
      'Criptografia e certificação digital',
      'Backup e recuperação',
      'Computação em nuvem',
      'LGPD — Lei Geral de Proteção de Dados',
      'Banco de dados — conceitos básicos',
    ]},
];


/* ============================================================
   UTIL
============================================================ */
const $  = (q,el=document)=>el.querySelector(q);
const $$ = (q,el=document)=>el.querySelectorAll(q);
const pad = n=>String(n).padStart(2,'0');
const fmt = d=>`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
const fmtShort = d=>`${pad(d.getDate())}/${pad(d.getMonth()+1)}`;
const weekNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const weekNamesShort = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const monthNames = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const fullMonthNames = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function dateISO(d){return d.toISOString().slice(0,10)}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function startOfWeek(d){const x=new Date(d);x.setDate(x.getDate()-x.getDay());x.setHours(0,0,0,0);return x}

function toast(msg,type='info'){
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show '+(type==='success'?'success':type==='error'?'error':'');
  setTimeout(()=>t.classList.remove('show'),3000);
}

/* ============================================================
   STATE (salvo no localStorage)
============================================================ */
const state = loadState();

function loadState(){
  const def = {
    metas: {},
    questions: [],
    editalProgress: {},
    pomodoro: {today:0,total:0,lastDate:null,streak:0},
    heroHours: 0,
    heroCron: 0,
    heroDays: 0,
    heroProgress: 0,
    xp: 0,
    hoursByDay: [],
    horarios: {0:7, 1:5, 2:5, 3:5, 4:5, 5:7, 6:7},
    dataInicio: null,
    dataFinal: null,
    dataConcurso: '',
    pausa: null,
    assuntosConcluidos: {},
    simuladoHoje: null,
    displayName: '',
  };
  // Define data de início como hoje e fim como 18 meses à frente
  const hoje = new Date();
  const fim = new Date(hoje);
  fim.setMonth(fim.getMonth() + 18);
  def.dataInicio = hoje.toISOString().slice(0,10);
  def.dataFinal = fim.toISOString().slice(0,10);
  return def;
}
function saveState(){
  try{ localStorage.setItem('mentoria_state',JSON.stringify(state)); }catch(e){}
  // Se estiver logado, sincroniza com Supabase (com debounce)
  if(typeof syncToSupabase === 'function' && currentUser) syncToSupabase();
}

/* ============================================================
   GERAÇÃO DE METAS (baseado na data atual)
============================================================ */
// Pool de tópicos por matéria (prontos para rodar)
// Rotação prioriza matérias que caem nos 3 concursos (peso 3), depois as de 2, depois específicas
// Matérias peso 3 aparecem 2x no ciclo (mais frequência)
const CYCLE_ROTATION = [
  'portugues','constitucional','contabilidade','administrativo','rlm',  // peso 3 (AFRFB+TCU+BACEN)
  'tributario','auditoria','afo',                                        // peso 2 (em 2 concursos)
  'portugues','constitucional','contabilidade','administrativo','rlm',  // peso 3 novamente
  'ltc','economia','controle','contpub','ti'                            // específicas e peso 2
];
const MODES = [
  {key:'study',label:'Estudo'},
  {key:'resume',label:'Resumo/Mapa Mental'},
  {key:'review',label:'Revisão'},
  {key:'exercise',label:'Exercício'},
];

function generateMetasForDate(dateStr){
  if(state.metas[dateStr]) return state.metas[dateStr];

  // Se está antes da data de início do plano, não gera metas
  if(state.dataInicio && dateStr < state.dataInicio){
    state.metas[dateStr] = [];
    saveState();
    return [];
  }

  // Se está no período de pausa, não gera metas
  if(state.pausa){
    if(dateStr >= state.pausa.inicio && dateStr <= state.pausa.fim){
      state.metas[dateStr] = [];
      saveState();
      return [];
    }
  }

  const d = new Date(dateStr+'T12:00:00');
  const day = d.getDate();
  const dow = d.getDay();
  // Quantas horas tem disponíveis neste dia
  const horasDia = (state.horarios && state.horarios[dow] !== undefined) ? state.horarios[dow] : 5;
  if(horasDia <= 0){
    state.metas[dateStr] = [];
    saveState();
    return [];
  }
  // Quantas metas gerar (cada meta tem em média 60 min no ciclo)
  // Usaremos blocos de 30 e 90 min
  let minutosDisponiveis = horasDia * 60;
  const metas = [];
  let i = 0;
  while(minutosDisponiveis >= 30 && metas.length < 8){
    const subjIdx = (day*3 + i*2 + dow) % CYCLE_ROTATION.length;
    const subj = SUBJECTS.find(s=>s.id===CYCLE_ROTATION[subjIdx]);
    // Se o assunto já foi concluído, pular para o próximo
    const topicIdx = (day + i*5) % subj.topics.length;
    const topicKey = subj.id+'::'+subj.topics[topicIdx];
    const modeIdx = (day+i) % MODES.length;
    const mode = MODES[modeIdx];
    let mins = mode.key==='study'?90:30;
    if(mins > minutosDisponiveis) mins = minutosDisponiveis;
    if(mins < 30) break;
    const isConcluded = state.assuntosConcluidos[topicKey];
    metas.push({
      id: `${dateStr}-${i}`,
      subject: subj.id,
      subjectName: subj.name,
      subjectShort: subj.short,
      topic: subj.topics[topicIdx],
      topicKey: topicKey,
      mode: mode.key,
      modeLabel: mode.label,
      mins: mins,
      assuntoTotalMin: mode.key==='study'?180:60,
      done: isConcluded && mode.key==='study',
      ref: getRefForSubject(subj.id),
    });
    minutosDisponiveis -= mins;
    i++;
  }
  state.metas[dateStr] = metas;
  saveState();
  return metas;
}
function getRefForSubject(id){
  const refs = {
    tributario: 'Pacote Estratégia Regular Fiscal: AULA 2 / Livro Ricardo Alexandre: Cap. 2',
    contabilidade: 'Pacote Estratégia: Ramonilson Alves / Livro Contabilidade Geral',
    administrativo: 'Livro Matheus Carvalho — Manual de Direito Administrativo',
    rlm: 'Direção Concursos — Professor Arthur Lima',
    constitucional: 'Livro Nathalia Masson — Manual de Direito Constitucional',
    portugues: 'Décio Terror / Fernando Pestana — Gramática para Concursos',
    ti: 'Estratégia Concursos — TI para Fiscal',
    auditoria: 'William Attie — Auditoria: conceitos e aplicações',
    ltc: 'Material Felipe Lessa — LTC',
  };
  return refs[id] || '';
}

/* ============================================================
   BANCO DE MOTIVACIONAIS DIÁRIOS
   Rotaciona com base no dia do ano. Cada entrada é sobre a vida,
   benefícios, dia a dia e o futuro como Auditor/Servidor de alto escalão.
============================================================ */
const MOTIVATIONAL_QUOTES = [
  {tag:'SALÁRIO',title:'R$ 22.921,71 + bônus de eficiência',body:'O Auditor Fiscal da Receita Federal começa com salário-base superior a R$ 22 mil, mais bônus que podem ultrapassar R$ 11 mil. Estamos falando de mais de R$ 34 mil logo de entrada. Seu esforço hoje é investimento direto aí.'},
  {tag:'ROTINA',title:'Sua rotina como AFRFB',body:'Você trabalhará em Delegacias da Receita analisando processos, fiscalizando empresas, atuando em aduanas ou na investigação de grandes esquemas. Cada dia um desafio novo, sempre no topo da carreira fiscal brasileira.'},
  {tag:'ESTABILIDADE',title:'Estabilidade vitalícia',body:'Depois do estágio probatório de 3 anos, você tem estabilidade garantida pela Constituição. Nunca mais precisa temer demissão por crise econômica. Essa paz vale cada hora de estudo.'},
  {tag:'TCU',title:'R$ 26.159,01 e prestígio máximo',body:'Auditor do TCU começa com R$ 26 mil e pode chegar a R$ 37 mil. Mas o melhor: você fiscaliza o próprio governo federal. Ministros, estatais, contratos bilionários passam pelo seu olhar.'},
  {tag:'BACEN',title:'R$ 20.924,80 no coração do sistema financeiro',body:'Como Analista do BACEN, você formula a política monetária do Brasil, supervisiona bancos e atua no combate à lavagem de dinheiro. Um dos cargos mais técnicos e respeitados do país.'},
  {tag:'APOSENTADORIA',title:'Aposentadoria integral garantida',body:'Ingressando até 2024 com abono permanência, você tem direito à aposentadoria integral com todos os benefícios. Enquanto amigos lutam com INSS, você descansa com salário cheio.'},
  {tag:'LOCALIZAÇÃO',title:'Trabalhe em qualquer cidade do Brasil',body:'A RFB tem unidades em mais de 400 municípios. Você escolhe morar em capital, interior, fronteira ou aeroporto internacional. Flexibilidade de localização que poucos cargos oferecem.'},
  {tag:'FOCO',title:'Cada hora hoje = 30 anos de tranquilidade',body:'Pense: uma hora de estudo hoje te aproxima de 30+ anos recebendo um dos melhores salários do serviço público. Essa é a matemática mais lucrativa da sua vida.'},
  {tag:'VIDA SOCIAL',title:'Status e respeito da sociedade',body:'Auditor Fiscal é autoridade pública. Você será chamado de "doutor", tratado com deferência, convidado para eventos importantes. O prestígio social do cargo é imenso.'},
  {tag:'DISCIPLINA',title:'Quem estuda hoje, não trabalha amanhã',body:'Na verdade, trabalha sim. Mas trabalha em algo que ama, com colegas brilhantes e um salário que muda a vida da família. Troca justa, né?'},
  {tag:'FAMÍLIA',title:'Seu filho vai estudar na melhor escola',body:'Com salário de Auditor, escola particular top, plano de saúde premium, viagens internacionais anuais. Você quebra ciclos de dificuldade financeira para as próximas gerações.'},
  {tag:'PROGRESSÃO',title:'Da classe inicial até o topo',body:'A carreira tem progressão automática por tempo e mérito. Em 20 anos você pode estar no último nível, ganhando 35% a mais do que no início. E sem precisar de nova prova.'},
  {tag:'FÉRIAS',title:'30 dias de férias + licenças',body:'Férias de 30 dias, licença prêmio a cada 5 anos (3 meses pagos), licença capacitação, licença para mestrado/doutorado. O tempo para você viver é protegido por lei.'},
  {tag:'HOJE É O DIA',title:'Um dia a mais é um dia a menos',body:'Cada dia de estudo não feito é um dia a mais na concorrência. Enquanto os outros assistem Netflix, você está construindo um futuro que eles não conseguem nem imaginar.'},
  {tag:'REFORMA TRIBUTÁRIA',title:'O momento é AGORA',body:'A Reforma Tributária criou demanda enorme por Auditores. São mais de 12 mil vagas ociosas na RFB. Nunca houve momento tão propício. Você está no lugar certo, na hora certa.'},
  {tag:'MENTE',title:'Seu cérebro está construindo uma fortaleza',body:'Cada conceito que você aprende hoje está formando uma base sólida. Direito Tributário, Contabilidade, Auditoria — não são matérias, são ferramentas da sua nova profissão.'},
  {tag:'AUXÍLIOS',title:'Auxílio-alimentação de R$ 1.000 + auxílio-saúde',body:'Além do salário, auxílio-alimentação, auxílio-saúde, auxílio-creche, auxílio-transporte. Benefícios somam mais R$ 2 mil mensais. Tudo isso não tributário, sem desconto no holerite.'},
  {tag:'PROVA',title:'A concorrência dorme enquanto você estuda',body:'Dos 20 mil inscritos em concursos grandes, cerca de 5 mil nem aparecem na prova, e outros 10 mil não estudaram direito. A vaga é disputada por apenas 5 mil. Seja um deles.'},
  {tag:'IDENTIDADE',title:'Da sua carteira funcional à sua história',body:'Imagina o dia da posse: você recebe a carteira funcional de Auditor, presta juramento, assina seu primeiro processo. Esse momento está sendo construído agora, por você.'},
  {tag:'VIAGENS',title:'Missões e fiscalizações pelo Brasil',body:'Auditores viajam em missão oficial com diárias. Você conhecerá Brasília, aeroportos internacionais, portos, regiões remotas. Viagens pagas pelo governo, hotéis, alimentação.'},
  {tag:'NUNCA DESISTA',title:'O sonho não é grande demais',body:'Todo Auditor Fiscal já foi concurseiro batalhando como você. A diferença? Persistência. Eles não pararam. Não pare também. O cargo te espera.'},
  {tag:'PRESSÃO',title:'Dia difícil? Lembre do POR QUÊ',body:'Cansou? Queima? Pensou em parar? Lembre: você não está estudando por obrigação, está construindo liberdade. Liberdade financeira, liberdade de escolha, liberdade de ser.'},
  {tag:'HOME OFFICE',title:'Muitos cargos permitem teletrabalho',body:'RFB, TCU e BACEN têm regimes de home office para boa parte das funções. Qualidade de vida com produtividade alta. Você escolhe: presencial ou remoto.'},
  {tag:'CARGO',title:'Você vai mudar a forma como pensa',body:'Auditor não é profissão — é mindset. Analítico, cético, meticuloso, ético. Você sai do cursinho diferente. Ganha não só dinheiro, mas uma nova versão de si mesmo.'},
  {tag:'PODER',title:'Servidor Federal = poder real',body:'Você terá autoridade para fiscalizar grandes empresas, deter mercadorias na fronteira, autuar contribuintes. Poder exercido com responsabilidade, mas poder real e reconhecido.'},
  {tag:'IRMANDADE',title:'Você entra para um grupo seleto',body:'Somente ~12 mil pessoas no Brasil são Auditores Fiscais da RFB. Você fará parte da elite técnica do Estado brasileiro. Uma irmandade de profissionais excepcionais.'},
  {tag:'INVESTIMENTOS',title:'Salário sobrando todo mês',body:'Com R$ 22 mil+, você consegue viver bem e ainda investir R$ 5-8 mil por mês. Em 10 anos, patrimônio de sete dígitos sem esforço extra. Liberdade financeira garantida.'},
  {tag:'DIA DA PROVA',title:'Você vai chegar preparado',body:'No dia da prova, você vai abrir o caderno e reconhecer questão por questão. "Esse tema eu revisei semana passada". Esse sentimento é a recompensa de cada hora investida hoje.'},
  {tag:'REDE DE CONTATOS',title:'Colegas que moldam o país',body:'Seus colegas serão outros Auditores brilhantes, pessoas que já passaram por uma das provas mais difíceis do Brasil. Networking de altíssimo nível garantido.'},
  {tag:'DESAFIO',title:'É difícil? Ótimo. Por isso paga bem.',body:'Se fosse fácil, qualquer um estaria lá. É o nível de dificuldade que filtra os candidatos e mantém o salário alto. Agradeça a dificuldade — ela protege sua futura vaga.'},
  {tag:'AUTORIDADE FISCAL',title:'Respeito no primeiro aperto de mão',body:'Ao se apresentar como Auditor da Receita, você vê a postura das pessoas mudar. Empresários, advogados, contadores te tratam com deferência. Cargo que abre portas em qualquer lugar.'},
  {tag:'PLANO DE SAÚDE',title:'GEAP e plano premium',body:'Acesso ao GEAP e planos premium com coparticipação mínima. Atendimento em qualquer hospital de referência do Brasil. Sua saúde e da sua família garantidas para sempre.'},
  {tag:'VOCÊ MERECE',title:'Todo sacrifício tem volta',body:'Madrugadas estudando, finais de semana em livros, amigos reclamando que você "sumiu". Lembre: eles terão reclamações a vida toda. Você terá um cargo público federal.'},
  {tag:'RITMO',title:'A constância vence a intensidade',body:'Estudar 4h todos os dias vence estudar 12h nos fins de semana. A AFRFB premia quem tem ritmo. Meta simples: estude hoje. E amanhã. E depois. Todos os dias.'},
  {tag:'DESENVOLVIMENTO',title:'Você se tornará um especialista',body:'Depois de aprovado, o Curso de Formação te profissionaliza. Você aprende a usar sistemas da RFB, técnicas de fiscalização, legislação aplicada. Expertise que vale ouro no mercado.'},
  {tag:'MENTALIDADE',title:'Direito Tributário vira quase prazer',body:'Uma vez que o tributário engrena na sua cabeça, vira quase um hobby. Ler CTN, STF, jurisprudência se torna natural. A matéria que hoje assusta vai virar paixão.'},
  {tag:'VIDA SAUDÁVEL',title:'Sua rotina sustentável pós-aprovação',body:'40h semanais, flexibilidade de horário, muitos benefícios. Você terá tempo para academia, família, hobbies. Qualidade de vida que a iniciativa privada raramente oferece.'},
  {tag:'COMPROMISSO',title:'Contrato consigo mesmo',body:'Você se prometeu a si mesmo que tentaria. Honre esse compromisso. A única pessoa que não pode te decepcionar é você. Prove amanhã que hoje não era blefe.'},
  {tag:'RECONHECIMENTO',title:'Ministro quer falar com você',body:'Auditor Fiscal da RFB é convocado para Comissões Parlamentares, reuniões no Ministério da Fazenda, grupos técnicos. Sua opinião importa nas decisões de Estado.'},
  {tag:'SEMPRE EM DIA',title:'Salário no dia 5 de cada mês',body:'Enquanto o amigo da CLT tem medo da rescisão, você tem salário pago pontualmente todo dia 5. Cartão de crédito tranquilo, financiamentos aprovados na hora. Paz financeira.'},
  {tag:'EVOLUÇÃO',title:'Você não é o mesmo de 3 meses atrás',body:'Compare-se apenas consigo mesmo. O que você sabia há 90 dias? Quantas questões acertava? O progresso é real, só precisa de tempo para ser visível. Continua.'},
  {tag:'ELITE',title:'Você está na elite dos concursos',body:'Auditor RFB é o "Barcelona" dos concursos. Quem chega a concorrer aqui já está no top 1% de seriedade no país. Só estar aqui já é vitória — agora faltam detalhes.'},
  {tag:'TEMPO É SEU',title:'Flexibilidade horária pós-posse',body:'A maioria das repartições da RFB tem banco de horas. Você pode começar cedo e sair cedo, compensar em dias específicos. Você controla seu tempo, não o contrário.'},
  {tag:'SONHO É PLANO',title:'Transforme desejo em rotina',body:'Sonho sem plano é fantasia. Você tem plano. Cumprir 5h por dia de estudo é plano. Revisar semanalmente é plano. Fazer simulados é plano. Você já está saindo do sonho.'},
  {tag:'FAMÍLIA DO SERVIDOR',title:'Proteja quem você ama',body:'Pensão por morte integral para cônjuge, auxílio-educação para filhos, plano de saúde para dependentes. Mesmo depois que você não estiver mais aqui, sua família fica amparada.'},
  {tag:'MERITOCRACIA',title:'Só depende de você',body:'Concurso público é a meritocracia mais pura do Brasil. Não precisa conhecer ninguém, não precisa ter família rica, não precisa de sorte. Só estudar. Só você, com você mesmo.'},
  {tag:'VIAGENS PAGAS',title:'Diárias nacionais e internacionais',body:'Fiscalizações em aeroportos, portos, fronteiras vêm com diárias. Capacitações no exterior (ONU, OCDE, FMI) fazem parte da carreira. Você verá o mundo custeado pelo governo.'},
  {tag:'PÓS-GRADUAÇÃO',title:'Mestrado e doutorado com licença paga',body:'Quer fazer doutorado? A carreira permite licença remunerada para pós-graduação. Salário integral enquanto você estuda. Cenário real para Auditores.'},
  {tag:'VOCÊ VAI CONSEGUIR',title:'Todo aprovado já foi você',body:'Todo Auditor Fiscal, todo Auditor do TCU, todo Analista do BACEN já teve o mesmo medo, a mesma dúvida, o mesmo cansaço. Eles continuaram. Você também vai.'},
  {tag:'LEGADO',title:'O nome da família muda',body:'Seu sobrenome será lembrado por gerações como "o primeiro auditor da família". Seus pais vão se orgulhar até o último dia. Seus filhos terão um pai/mãe referência.'},
  {tag:'CARGOS VAGOS',title:'Mais de 22 mil cargos vagos na RFB',body:'A Receita Federal tem 22 mil cargos vagos. TCU precisa renovar quadros. BACEN solicita 560 vagas novas. O mercado está mais aquecido do que nunca. É a hora exata.'},
  {tag:'FOCUS MODE',title:'Uma semana fantástica começa hoje',body:'Cada segunda-feira é um recomeço. Hoje você decide a semana inteira. Faça hoje bem feito, e o efeito multiplicador te leva adiante. Uma semana boa vira um ano bom.'},
  {tag:'VENCIMENTO',title:'Primeiro contracheque = choro',body:'Prepara o lenço. Quando você receber o primeiro salário de Auditor, a emoção é indescritível. Todo aquele estudo, toda aquela noite sem dormir — tudo recompensado.'},
  {tag:'EXPERTISE',title:'Você já é um semi-profissional',body:'Quem estuda para AFRFB/TCU sabe mais Tributário que 90% dos advogados, mais Contabilidade que muitos contadores, mais Constitucional que muitos juízes. Você já é fera.'},
  {tag:'DISCIPLINA VS VONTADE',title:'Vontade falha, disciplina salva',body:'Vontade é emoção do momento. Disciplina é compromisso com o futuro. Nos dias em que a vontade sumir, a disciplina te leva para a mesa de estudos. Cultive-a.'},
  {tag:'SUA META',title:'Termine o que começou',body:'Você começou essa jornada com um objetivo claro. Não importa quanto falta — importa continuar andando. Cada passo conta. Cada página lida conta. Cada questão feita conta.'},
  {tag:'COMPARAÇÃO',title:'CLT comum: R$ 3.500. Você: R$ 22.000+',body:'Salário médio no Brasil: R$ 3.500. Salário inicial Auditor: R$ 22.000. Você vai ganhar mais em 1 mês do que muitos amigos em 6. Isso muda absolutamente tudo.'},
  {tag:'RESPIRA',title:'Calma na alma — o processo é longo',body:'Concurso não é sprint, é maratona. Hoje foi ruim? Tudo bem. Amanhã é novo dia. O que importa é não abandonar o plano. Continue, com paciência.'},
  {tag:'PODER DE CHOQUE',title:'Quando o Auditor chega, tudo para',body:'Quando Auditor Fiscal aparece, empresa para. Contador pede café. Advogado pede prazo. Você é a autoridade. Esse tipo de respeito se conquista só com aprovação.'},
  {tag:'SIMULADOS',title:'Simulados são o maior laboratório',body:'Fazer simulado é atravessar o rio com o peso verdadeiro. Ensina gestão de tempo, controle emocional, estratégia. Não pule simulados. Eles valem por 10h de teoria.'},
  {tag:'EDUCAÇÃO',title:'Você está se formando na vida',body:'Cada edital estudado é um MBA particular. Você vai sair dessa preparação formado em Direito Público, Contabilidade, Auditoria e Gestão. Vale por qualquer faculdade.'},
  {tag:'AMIGOS ESPECIAIS',title:'Aprovados atraem aprovados',body:'Quem entra para essas carreiras conhece gente fantástica. Pessoas disciplinadas, inteligentes, ambiciosas. Seu círculo social muda completamente — para melhor.'},
  {tag:'POSTURA',title:'Estude como se já fosse Auditor',body:'Aja como se já tivesse passado. Vista-se com orgulho. Postura ereta. Fale com segurança. O inconsciente se ajusta ao comportamento. Em breve, será realidade.'},
  {tag:'MÃE ORGULHOSA',title:'Orgulho eterno de quem te criou',body:'Imagina sua mãe contando para as amigas: "meu filho é Auditor Fiscal da Receita Federal". Esse momento existe para ser criado. Hoje. Agora. Página por página.'},
  {tag:'TRIBUNAL DE CONTAS',title:'Quem controla os controladores?',body:'Como Auditor do TCU, você controla bilhões em gastos públicos, julga contas de ministros, fiscaliza o próprio governo. Poder de Estado nas mãos do concurseiro que não desistiu.'},
  {tag:'BANCO CENTRAL',title:'Você influencia os juros do Brasil',body:'Analistas do BACEN participam do COPOM, influenciam a política monetária que afeta 215 milhões de pessoas. Como Bacenista, sua caneta pesa nos rumos do país.'},
  {tag:'TICKS E CHECKS',title:'Marcar meta hoje é vitória micro',body:'Cada check na lista de metas é dopamina justa. Você está literalmente remodelando o cérebro para amar o processo. Continue marcando. Continue progredindo.'},
  {tag:'VIDA DUPLA',title:'Hoje concurseiro — amanhã autoridade',body:'Você vive hoje entre PDFs e vade mecums. Amanhã, entre relatórios oficiais e processos federais. A transição acontece rápido quando você se prepara direito.'},
  {tag:'O RELÓGIO CORRE',title:'Editais saem em 2026',body:'Receita Federal pediu autorização para 2026-2027. TCU já abriu. BACEN solicitou 560 vagas. A janela está se abrindo. Quem estiver preparado hoje, colhe amanhã.'},
  {tag:'PACIÊNCIA ESTRATÉGICA',title:'Vitória é para quem espera sem parar',body:'Preparar-se sem edital é o maior ato de fé e estratégia. Quando edital sair, quem começou do zero terá 6 meses de atraso. Você terá meses de vantagem. Continue.'},
  {tag:'CONEXÃO',title:'Estudo hoje é gratidão ao seu futuro',body:'Você no futuro vai agradecer você de hoje por não desistir. Escreva uma carta mental para o "você daqui a 2 anos". Ele vai morar numa boa casa por sua causa.'},
  {tag:'ESCADA',title:'Não olhe pro topo — olhe pro próximo degrau',body:'Não pense na prova final. Pense no capítulo de hoje. Na meta de hoje. Na revisão de hoje. Um degrau por vez. O topo aparece sem você perceber.'},
  {tag:'VITÓRIA DIÁRIA',title:'Cumpriu a meta? Comemore!',body:'Parabenize-se hoje por cada meta cumprida. Pequenas vitórias alimentam grandes objetivos. Você está construindo um vencedor, tijolo por tijolo.'},
  {tag:'ACORDE CEDO',title:'A manhã é do aprovado',body:'Muitos Auditores aprovados eram madrugadores. Acordar 5h30 e estudar 2h antes de todos te dá vantagem brutal. 2h por dia = 60h por mês = uma matéria inteira.'},
  {tag:'SEM DESCULPAS',title:'Você é a causa e a consequência',body:'Não terá chefe exigindo estudo, coach cobrando, família obrigando. É só você. Isso é assustador — e é a beleza. Toda aprovação depende 100% de você, e só de você.'},
  {tag:'SACRIFÍCIO QUE VALE',title:'2 anos difíceis por 30 anos incríveis',body:'Troca justa: 2 anos de estudo intenso por 30+ anos de carreira de alto padrão. Matemática imbatível. Todo Auditor faria essa troca mil vezes.'},
  {tag:'ESCRITA DE OURO',title:'Redação bem feita = aprovação',body:'Muitos concursos têm prova discursiva. Treine redação semanalmente. Quem sabe escrever bem passa, mesmo com teoria mediana. Escrita é ferramenta do Auditor.'},
  {tag:'FÉ MOVE',title:'Fé move montanhas e aprova concursos',body:'Acredite. Reze. Peça força. A espiritualidade é combustível importante para concurseiros. Muitos aprovados relatam que a fé foi decisiva nos dias mais difíceis.'},
  {tag:'PROTEÇÃO FUTURA',title:'Pandemia? Crise? Você está seguro',body:'Enquanto o país enfrenta crises, servidor federal está protegido. Crise de 2008, pandemia de 2020, qualquer tempestade — salário do servidor público não falha.'},
  {tag:'CONEXÃO COM O PAÍS',title:'Você fará parte da história',body:'Trabalhar para o Estado brasileiro é contribuir com o país. Cada auto de infração bem lavrado, cada auditoria consciente — você ajuda a melhorar o Brasil.'},
  {tag:'ORGANIZE SEU ESTUDO',title:'Quem se organiza, economiza tempo',body:'Plano de estudos claro vale 2x mais que esforço descoordenado. Você já tem o plano. Siga ele. Cada dia na planilha é vitória. Cada check vale ouro.'},
  {tag:'REAJUSTES',title:'Salário reajustado acima da inflação',body:'Carreira fiscal federal recebe reajustes periódicos. Em 2023, 2024 e 2025 houve aumentos que repuseram poder de compra. Seu salário não fica para trás ao longo do tempo.'},
  {tag:'APOSENTE CEDO',title:'Aposentadoria com 55-60 anos',body:'Com o tempo certo de contribuição, muitos servidores se aposentam entre 55 e 60 anos. Aposentadoria ativa, viajando, com saúde e dinheiro — algo raríssimo no mercado privado.'},
  {tag:'DIFERENCIAL',title:'Você não quer só estar bem — quer estar no TOPO',body:'Se você escolheu AFRFB, TCU ou BACEN, você é ambicioso. Não quer cargo qualquer — quer o melhor. Honre essa ambição com trabalho compatível. Você é parte do 1%.'},
  {tag:'VOZ INTERNA',title:'Silencie a dúvida — alimente a certeza',body:'Sua mente vai gritar que "não dá, é muito difícil". Responda: "Difícil é para quem não tenta". Converse melhor com você mesmo. Suas palavras criam sua realidade.'},
  {tag:'CURSO DE FORMAÇÃO',title:'Último degrau: aprovado mas ainda não é',body:'Depois da prova há Curso de Formação. Mais estudo. Mas já remunerado. Já com nomeação garantida. Você estuda sendo pago. Transição perfeita para a posse final.'},
  {tag:'SE OUTROS CONSEGUIRAM',title:'Você também vai conseguir',body:'Milhares passaram antes de você. Nenhum era super-humano. Todos eram gente comum com disciplina extraordinária. Você é capaz. Só precisa continuar fazendo o simples todo dia.'},
  {tag:'ESCOLHA IMPORTANTE',title:'Qual versão de você terá em 2 anos?',body:'Em 2 anos, você será: (A) aprovado, realizado, mudando a vida da família; ou (B) onde está hoje. A diferença entre A e B é o que você faz nas próximas 24 horas.'},
  {tag:'PARABÉNS',title:'Só de estar aqui, você é acima da média',body:'99% das pessoas desistem de sonhos ambiciosos. Você não. Só o fato de abrir o app e estudar já te coloca acima da média. Continue. A aprovação chega.'},
];

/**
 * Atualiza o mural com 3 mensagens motivacionais que rotacionam diariamente.
 * Mesma mensagem durante todo o dia; muda automaticamente ao virar meia-noite.
 */
/* ============================================================
   BANCO DE CONTRACHEQUES
   Valores REAIS baseados em dados públicos (Portal da Transparência,
   tabelas salariais oficiais, matérias sobre os cargos).
   Nomes são fictícios para respeitar privacidade.
   Estrutura de rubricas fiel aos contracheques do serviço público.
============================================================ */
const CONTRACHEQUES = [
  // ===== AUDITORES FISCAIS DA RECEITA FEDERAL =====
  {org:'Auditor-Fiscal da RFB — Classe A, Padrão I',nome:'Carlos M.',sigla:'RFB',mes:'JAN/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 22.921,71',tipo:'pos'},
      {label:'Bônus de Eficiência',valor:'R$ 11.460,85',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Auxílio-Saúde',valor:'R$ 215,00',tipo:'pos'},
      {label:'Contribuição Previdenciária (14%)',valor:'-R$ 3.209,04',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 7.324,12',tipo:'neg'},
      {label:'GEAP — Plano de Saúde',valor:'-R$ 580,00',tipo:'neg'},
    ],liquido:'R$ 24.484,40'},

  {org:'Auditor-Fiscal da RFB — Classe B, Padrão III',nome:'Mariana T.',sigla:'RFB',mes:'FEV/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 24.523,54',tipo:'pos'},
      {label:'Bônus de Eficiência',valor:'R$ 11.460,85',tipo:'pos'},
      {label:'Adicional por Tempo de Serviço',valor:'R$ 1.226,18',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Contribuição Previdenciária (14%)',valor:'-R$ 3.604,98',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 8.142,87',tipo:'neg'},
      {label:'Associação Sindical',valor:'-R$ 180,00',tipo:'neg'},
    ],liquido:'R$ 26.282,72'},

  {org:'Auditor-Fiscal da RFB — Classe Especial, Padrão III',nome:'Paulo R.',sigla:'RFB',mes:'MAR/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 29.760,95',tipo:'pos'},
      {label:'Bônus de Eficiência',valor:'R$ 11.460,85',tipo:'pos'},
      {label:'Adicional por Tempo de Serviço',valor:'R$ 4.464,14',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Auxílio-Saúde',valor:'R$ 215,00',tipo:'pos'},
      {label:'Contribuição Previdenciária (14%)',valor:'-R$ 4.791,31',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 10.124,45',tipo:'neg'},
      {label:'GEAP Premium',valor:'-R$ 720,00',tipo:'neg'},
    ],liquido:'R$ 31.265,18'},

  {org:'Auditor-Fiscal da RFB — Aposentado Especial',nome:'Roberto F.',sigla:'RFB',mes:'ABR/2026',
    rubricas:[
      {label:'Provento Básico (integral)',valor:'R$ 29.760,95',tipo:'pos'},
      {label:'Bônus Proporcional',valor:'R$ 8.595,64',tipo:'pos'},
      {label:'Adicional Tempo de Serviço',valor:'R$ 5.952,19',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 4.104,84',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 9.876,00',tipo:'neg'},
    ],liquido:'R$ 30.327,94'},

  {org:'Auditor-Fiscal da RFB — Classe A, Padrão II + Função DAS',nome:'Juliana S.',sigla:'RFB',mes:'MAI/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 23.715,97',tipo:'pos'},
      {label:'Bônus de Eficiência',valor:'R$ 11.460,85',tipo:'pos'},
      {label:'Função DAS-4 (Delegado)',valor:'R$ 6.324,00',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 3.320,24',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 8.452,30',tipo:'neg'},
    ],liquido:'R$ 30.728,28'},

  // ===== AUDITORES TCU =====
  {org:'Auditor Federal de Controle Externo — TCU, Classe A',nome:'Felipe A.',sigla:'TCU',mes:'JAN/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 26.159,01',tipo:'pos'},
      {label:'Gratif. de Desempenho',valor:'R$ 3.924,00',tipo:'pos'},
      {label:'Gratif. de Controle Externo',valor:'R$ 1.308,00',tipo:'pos'},
      {label:'Abono Lei 10.698/2003',valor:'R$ 59,87',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 3.662,26',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 6.487,10',tipo:'neg'},
    ],liquido:'R$ 22.301,52'},

  {org:'Auditor Federal de Controle Externo — TCU, Classe C',nome:'Ana P.',sigla:'TCU',mes:'FEV/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 31.390,81',tipo:'pos'},
      {label:'Gratif. de Desempenho',valor:'R$ 4.708,62',tipo:'pos'},
      {label:'Gratif. de Controle Externo',valor:'R$ 1.569,54',tipo:'pos'},
      {label:'Adicional Qualificação (pós)',valor:'R$ 1.569,54',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 4.394,71',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 8.712,93',tipo:'neg'},
    ],liquido:'R$ 27.130,87'},

  {org:'Auditor Federal TCU — Topo de Carreira (Especial III)',nome:'Bruno D.',sigla:'TCU',mes:'MAR/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 37.465,00',tipo:'pos'},
      {label:'Gratif. Desempenho (máx)',valor:'R$ 5.619,75',tipo:'pos'},
      {label:'Gratif. Controle Externo',valor:'R$ 1.873,25',tipo:'pos'},
      {label:'Adicional Qualificação',valor:'R$ 2.810,00',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 5.244,40',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 10.912,65',tipo:'neg'},
    ],liquido:'R$ 32.610,95'},

  {org:'Auditor Federal TCU — Aposentado',nome:'Helena L.',sigla:'TCU',mes:'ABR/2026',
    rubricas:[
      {label:'Provento Integral',valor:'R$ 31.390,81',tipo:'pos'},
      {label:'Gratificações (paridade)',valor:'R$ 6.278,16',tipo:'pos'},
      {label:'Ad. Qualificação Doutorado',valor:'R$ 2.511,26',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 4.226,82',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 8.541,22',tipo:'neg'},
    ],liquido:'R$ 27.412,19'},

  // ===== AUDITORES TCE ESTADUAIS =====
  {org:'Auditor de Controle Externo — TCE-SP, Padrão I',nome:'Ricardo V.',sigla:'TCE-SP',mes:'JAN/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 24.512,30',tipo:'pos'},
      {label:'Gratif. por Atividade Fiscal',valor:'R$ 4.902,46',tipo:'pos'},
      {label:'Abono Permanência',valor:'R$ 2.690,05',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.850,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 3.431,72',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 7.120,40',tipo:'neg'},
    ],liquido:'R$ 23.402,69'},

  {org:'Auditor de Controle Externo — TCE-MG',nome:'Camila N.',sigla:'TCE-MG',mes:'FEV/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 22.180,45',tipo:'pos'},
      {label:'Gratificação de Desempenho',valor:'R$ 4.436,09',tipo:'pos'},
      {label:'Adicional por Tempo',valor:'R$ 2.218,05',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.200,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 3.105,26',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 6.247,84',tipo:'neg'},
    ],liquido:'R$ 20.681,49'},

  {org:'Auditor de Controle Externo — TCE-RJ',nome:'Fernando G.',sigla:'TCE-RJ',mes:'MAR/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 20.450,70',tipo:'pos'},
      {label:'Gratif. de Atividade Externa',valor:'R$ 6.135,21',tipo:'pos'},
      {label:'Gratif. de Titulação (mestre)',valor:'R$ 2.045,07',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.100,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 2.863,09',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 5.987,42',tipo:'neg'},
    ],liquido:'R$ 20.880,47'},

  {org:'Auditor de Controle Externo — TCE-RS, Classe B',nome:'Lucas M.',sigla:'TCE-RS',mes:'ABR/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 21.860,12',tipo:'pos'},
      {label:'Gratif. de Desempenho',valor:'R$ 5.465,03',tipo:'pos'},
      {label:'Adicional Tempo Serviço',valor:'R$ 1.530,21',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.450,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 3.060,42',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 6.521,89',tipo:'neg'},
    ],liquido:'R$ 20.723,05'},

  {org:'Auditor TCE-PE — Padrão Especial',nome:'Gabriela C.',sigla:'TCE-PE',mes:'MAI/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 23.105,89',tipo:'pos'},
      {label:'Gratif. Controle Externo',valor:'R$ 6.931,77',tipo:'pos'},
      {label:'Ad. Pós-Graduação',valor:'R$ 2.310,58',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.350,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 3.234,82',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 7.234,18',tipo:'neg'},
    ],liquido:'R$ 23.229,24'},

  {org:'Auditor TCE-BA — Classe A',nome:'Diogo H.',sigla:'TCE-BA',mes:'JUN/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 19.840,55',tipo:'pos'},
      {label:'Gratif. de Produtividade',valor:'R$ 5.952,16',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 980,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 2.777,68',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 5.421,33',tipo:'neg'},
    ],liquido:'R$ 18.573,70'},

  // ===== RFB — casos especiais =====
  {org:'Auditor-Fiscal RFB lotado em aduana (fronteira)',nome:'André K.',sigla:'RFB',mes:'JUL/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 22.921,71',tipo:'pos'},
      {label:'Bônus de Eficiência',valor:'R$ 11.460,85',tipo:'pos'},
      {label:'Gratificação Aduaneira',valor:'R$ 2.292,17',tipo:'pos'},
      {label:'Diárias do mês (missão)',valor:'R$ 4.380,00',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 3.209,04',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 9.215,47',tipo:'neg'},
    ],liquido:'R$ 29.630,22'},

  {org:'Auditor-Fiscal RFB — 13º salário (dezembro)',nome:'Beatriz L.',sigla:'RFB',mes:'DEZ/2025',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 22.921,71',tipo:'pos'},
      {label:'13º Salário (integral)',valor:'R$ 22.921,71',tipo:'pos'},
      {label:'Bônus de Eficiência',valor:'R$ 11.460,85',tipo:'pos'},
      {label:'Bônus 13º',valor:'R$ 11.460,85',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 6.418,08',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 15.842,30',tipo:'neg'},
    ],liquido:'R$ 47.504,74'},

  {org:'Auditor-Fiscal RFB + Função DAS-5',nome:'Thiago E.',sigla:'RFB',mes:'AGO/2026',
    rubricas:[
      {label:'Vencimento Básico (Especial III)',valor:'R$ 29.760,95',tipo:'pos'},
      {label:'Bônus de Eficiência',valor:'R$ 11.460,85',tipo:'pos'},
      {label:'Função DAS-5 (Superintendente)',valor:'R$ 10.480,00',tipo:'pos'},
      {label:'Adicional Tempo Serviço',valor:'R$ 4.464,14',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 4.164,53',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 12.810,47',tipo:'neg'},
    ],liquido:'R$ 40.190,94'},

  // ===== TCU — casos especiais =====
  {org:'Auditor TCU + Função FC-05 (Coordenador)',nome:'Patrícia O.',sigla:'TCU',mes:'SET/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 28.456,33',tipo:'pos'},
      {label:'Gratif. Desempenho',valor:'R$ 4.268,44',tipo:'pos'},
      {label:'Gratif. Controle Externo',valor:'R$ 1.422,81',tipo:'pos'},
      {label:'Função Comissionada FC-05',valor:'R$ 7.800,00',tipo:'pos'},
      {label:'Adicional Qualificação',valor:'R$ 1.422,81',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 3.983,88',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 9.852,16',tipo:'neg'},
    ],liquido:'R$ 30.534,35'},

  {org:'Auditor TCU — 13º salário',nome:'Eduardo M.',sigla:'TCU',mes:'DEZ/2025',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 26.159,01',tipo:'pos'},
      {label:'13º Salário (integral)',valor:'R$ 26.159,01',tipo:'pos'},
      {label:'Gratif. Desempenho (dobro)',valor:'R$ 7.848,00',tipo:'pos'},
      {label:'Gratif. Controle Externo (dobro)',valor:'R$ 2.616,00',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 7.324,52',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 17.254,00',tipo:'neg'},
    ],liquido:'R$ 39.203,50'},

  // ===== ESPECIALISTAS =====
  {org:'Auditor-Fiscal RFB — Equipe Operação Especial',nome:'Rafaela B.',sigla:'RFB',mes:'OUT/2026',
    rubricas:[
      {label:'Vencimento Básico',valor:'R$ 24.523,54',tipo:'pos'},
      {label:'Bônus de Eficiência',valor:'R$ 11.460,85',tipo:'pos'},
      {label:'Diárias de Operação',valor:'R$ 6.570,00',tipo:'pos'},
      {label:'Adicional Noturno',valor:'R$ 1.962,12',tipo:'pos'},
      {label:'Auxílio-Alimentação',valor:'R$ 1.000,00',tipo:'pos'},
      {label:'Contribuição Previdenciária',valor:'-R$ 3.433,30',tipo:'neg'},
      {label:'Imposto de Renda',valor:'-R$ 9.842,15',tipo:'neg'},
    ],liquido:'R$ 32.241,06'},
];

/**
 * Retorna o contracheque do dia (rotaciona baseado no dia do ano)
 */
function getContrachequeDoDia(){
  const now = new Date();
  const start = new Date(now.getFullYear(),0,0);
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return CONTRACHEQUES[dayOfYear % CONTRACHEQUES.length];
}

/**
 * Renderiza um card de contracheque no mural
 */
function renderContrachequeHTML(c){
  return `
    <div class="contracheque-card">
      <div class="contracheque-header">
        <div>
          <div class="contracheque-org">${c.org}</div>
          <div class="contracheque-name">Servidor(a) exemplo: <strong>${c.nome}</strong></div>
        </div>
        <div class="contracheque-mes">${c.mes}</div>
      </div>
      <div class="contracheque-body">
        ${c.rubricas.map(r=>`
          <div class="contracheque-row ${r.tipo}">
            <span>${r.label}</span>
            <span>${r.valor}</span>
          </div>
        `).join('')}
      </div>
      <div class="contracheque-liquid">
        <div class="contracheque-liquid-label">💰 Líquido do mês</div>
        <div class="contracheque-liquid-value">${c.liquido}</div>
      </div>
      <div class="contracheque-footer">Valores baseados em dados públicos · Nome fictício · ${c.sigla}</div>
    </div>
  `;
}

/**
 * Atualiza o mural com: 1 contracheque + 2 motivacionais (rotação diária)
 */
function updateDailyMotivation(){
  const container = $('#noticesList');
  if(!container) return;
  const now = new Date();
  const start = new Date(now.getFullYear(),0,0);
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));

  const total = MOTIVATIONAL_QUOTES.length;
  const q1 = MOTIVATIONAL_QUOTES[dayOfYear % total];
  const q2 = MOTIVATIONAL_QUOTES[(dayOfYear + 37) % total];

  const cheque = getContrachequeDoDia();

  container.innerHTML = `
    ${renderContrachequeHTML(cheque)}
    <div class="notice">
      <div class="notice-date">${q1.tag}</div>
      <div class="notice-title">${q1.title}</div>
      <div class="notice-body">${q1.body}</div>
    </div>
    <div class="notice">
      <div class="notice-date">${q2.tag}</div>
      <div class="notice-title">${q2.title}</div>
      <div class="notice-body">${q2.body}</div>
    </div>
  `;

  // Progresso por matéria
  const subjContainer = $('#homeSubjProgress');
  if(subjContainer){
    subjContainer.innerHTML = SUBJECTS.map(s=>{
      const prog = state.editalProgress[s.id] || [];
      const done = prog.filter(Boolean).length;
      const total = s.topics.length;
      const pct = total === 0 ? 0 : Math.round((done/total)*100);
      const editais = (s.editais || []).join(' · ');
      return `
        <div class="home-subj-row">
          <div class="home-subj-head">
            <div class="home-subj-name">${s.name}</div>
            <div class="home-subj-tag" style="background:${s.color}">${editais}</div>
          </div>
          <div class="home-subj-bar"><div class="home-subj-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
          <div class="home-subj-stats">
            <span>${done} de ${total} tópicos</span>
            <span><strong>${pct}%</strong></span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Streak e countdown
  updateStreakAndCountdown();
}

/**
 * Atualiza os cards de Streak e Countdown na home
 */
function updateStreakAndCountdown(){
  // Streak: dias consecutivos com alguma meta concluída
  const today = new Date();
  let streak = 0;
  for(let i=0;i<365;i++){
    const d = dateISO(addDays(today, -i));
    const metas = state.metas[d];
    if(metas && metas.some(m=>m.done)){
      streak++;
    } else {
      if(i===0) continue; // hoje pode não ter estudado ainda
      break;
    }
  }
  const streakEl = $('#streakValue');
  const streakSubEl = $('#streakSub');
  if(streakEl){
    streakEl.textContent = streak + (streak===1?' dia':' dias');
    if(streakSubEl){
      if(streak===0) streakSubEl.textContent = 'Comece hoje sua jornada de disciplina!';
      else if(streak<7) streakSubEl.textContent = 'Continue! Constância vence tudo.';
      else if(streak<30) streakSubEl.textContent = '🔥 Você está pegando o ritmo. Não pare!';
      else if(streak<100) streakSubEl.textContent = '🏆 Disciplina de aprovado! Siga firme.';
      else streakSubEl.textContent = '🌟 Lenda! Essa dedicação leva ao topo.';
    }
  }

  // Countdown: dias até 01/10/2026 (previsão edital RFB)
  const editalDate = new Date(2026,9,1); // outubro = 9 (zero-indexed)
  const countdownEl = $('#countdownValue');
  const countdownSubEl = $('#countdownSub');
  if(countdownEl){
    const diff = editalDate - today;
    const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    countdownEl.textContent = days + (days===1?' dia':' dias');
    if(countdownSubEl){
      if(days<=0) countdownSubEl.textContent = 'O edital pode sair a qualquer momento!';
      else if(days<60) countdownSubEl.textContent = '🚨 Fase final — intensifique os simulados!';
      else if(days<180) countdownSubEl.textContent = 'Reta intermediária — foco em revisões.';
      else countdownSubEl.textContent = 'Tempo ideal para construir base sólida.';
    }
  }
}

/* ============================================================
   CALENDÁRIO MENSAL
============================================================ */
let calOffset = 0; // meses relativo a hoje

function renderCalendario(){
  const hoje = new Date();
  const base = new Date(hoje.getFullYear(), hoje.getMonth() + calOffset, 1);
  const year = base.getFullYear();
  const month = base.getMonth();

  // Título
  const tituloEl = $('#calTitle');
  if(tituloEl){
    tituloEl.textContent = fullMonthNames[month].charAt(0).toUpperCase() + fullMonthNames[month].slice(1) + ' · ' + year;
  }

  // Primeiro e último dia do mês
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month+1, 0);
  const startDow = firstDay.getDay(); // 0=dom
  const daysInMonth = lastDay.getDate();

  // Quantos dias do mês anterior para preencher
  const prevMonth = new Date(year, month, 0);
  const prevDays = prevMonth.getDate();

  const todayStr = dateISO(hoje);
  const hojeISO = dateISO(hoje);

  // Estatísticas do mês
  let statsDone = 0, statsLate = 0, statsHours = 0, statsPending = 0;

  let cellsHtml = '';
  let totalCells = 42; // 6 semanas x 7 dias

  for(let i=0;i<totalCells;i++){
    let dayNum, displayDate, isOtherMonth = false;
    if(i < startDow){
      dayNum = prevDays - (startDow - 1 - i);
      displayDate = new Date(year, month-1, dayNum);
      isOtherMonth = true;
    } else if(i >= startDow + daysInMonth){
      dayNum = i - (startDow + daysInMonth) + 1;
      displayDate = new Date(year, month+1, dayNum);
      isOtherMonth = true;
    } else {
      dayNum = i - startDow + 1;
      displayDate = new Date(year, month, dayNum);
    }

    const dStr = dateISO(displayDate);
    const isToday = dStr === hojeISO;
    const isPast = dStr < hojeISO;
    const isFuture = dStr > hojeISO;

    // Verifica pausa
    let pausaStr = '';
    if(state.pausa && dStr >= state.pausa.inicio && dStr <= state.pausa.fim){
      pausaStr = 'pausa';
    }

    // Metas desse dia
    const metas = pausaStr ? [] : generateMetasForDate(dStr);
    const totalMetas = metas.length;
    const doneMetas = metas.filter(m=>m.done).length;
    const pendingMetas = totalMetas - doneMetas;
    const minsDone = metas.filter(m=>m.done).reduce((a,b)=>a+b.mins,0);

    let dayClass = '';
    if(isOtherMonth) dayClass += ' other-month';
    if(isToday) dayClass += ' today';
    if(pausaStr) dayClass += ' pausa';

    // Status do dia (só para mês atual)
    if(!isOtherMonth && !pausaStr){
      if(totalMetas > 0 && doneMetas === totalMetas){
        dayClass += ' full-done';
        statsDone++;
      } else if(isPast && pendingMetas > 0){
        dayClass += ' late-day';
        statsLate++;
      } else if(isFuture && totalMetas > 0){
        statsPending++;
      }
      statsHours += minsDone / 60;
    }

    // Dots indicadores
    let dots = '';
    if(!pausaStr && totalMetas > 0){
      metas.forEach(m=>{
        let dotCls = 'pending';
        if(m.done) dotCls = 'done';
        else if(isPast && !isToday) dotCls = 'late';
        dots += `<span class="cal-day-dot ${dotCls}" title="${m.modeLabel} · ${m.subjectShort}"></span>`;
      });
    }

    const completed = (!isOtherMonth && totalMetas > 0 && doneMetas === totalMetas) ? '✓' : '';

    let summary = '';
    if(pausaStr){
      summary = '⏸ Pausa';
    } else if(totalMetas > 0){
      summary = `${doneMetas}/${totalMetas} metas`;
    }

    const totalMin = metas.reduce((a,b)=>a+b.mins,0);
    const totalLabel = totalMin > 0 ? `${(totalMin/60).toFixed(1).replace('.',',')}h` : '';

    cellsHtml += `
      <div class="cal-day${dayClass}" onclick="openDayMetas('${dStr}')">
        <div class="cal-day-num">
          <span>${dayNum}</span>
          ${totalLabel?`<span class="cal-day-total">${totalLabel}</span>`:''}
        </div>
        ${completed?`<div class="cal-day-completed">${completed}</div>`:''}
        ${dots?`<div class="cal-day-dots">${dots}</div>`:''}
        ${summary?`<div class="cal-day-summary">${summary}</div>`:''}
      </div>
    `;
  }

  $('#calWeeks').innerHTML = cellsHtml;
  if($('#calStatDone')) $('#calStatDone').textContent = statsDone;
  if($('#calStatLate')) $('#calStatLate').textContent = statsLate;
  if($('#calStatHours')) $('#calStatHours').textContent = statsHours.toFixed(1).replace('.',',')+'h';
  if($('#calStatPending')) $('#calStatPending').textContent = statsPending;
}

function openDayMetas(dateStr){
  // Ao clicar em um dia, se for hoje, vai para Metas. Senão, mostra modal
  const hojeISO = dateISO(new Date());
  if(dateStr === hojeISO){
    navigate('metas');
    return;
  }
  const metas = generateMetasForDate(dateStr);
  const d = new Date(dateStr+'T12:00:00');
  const title = `Metas do dia ${fmt(d)}`;
  let body = '';
  if(metas.length === 0){
    body = 'Nenhuma meta programada para esse dia.';
  } else {
    body = metas.map(m=>{
      const status = m.done?'✓':'⏳';
      return `${status} <strong>${m.subjectShort}</strong> — ${m.topic} (${m.modeLabel}, ${m.mins}min)`;
    }).join('<br><br>');
  }
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = body;
  $('#modalBg').classList.add('show');
  $('#modalOk').textContent = 'Fechar';
  $('#modalOk').onclick = ()=>$('#modalBg').classList.remove('show');
  $('#modalCancel').style.display = 'none';
  setTimeout(()=>{$('#modalCancel').style.display = '';$('#modalOk').textContent = 'Confirmar';},100);
}
window.openDayMetas = openDayMetas;

/* ============================================================
   SIMULADO DO DIA — Banco de questões CERTO/ERRADO
============================================================ */
const QUESTIONS_BANK = [
  // CONSTITUCIONAL
  {s:'constitucional',q:'Os direitos e garantias fundamentais previstos na Constituição Federal podem ser objeto de emenda constitucional tendente a aboli-los.',a:false,exp:'Artigo 60, §4º, IV da CF: não será objeto de deliberação emenda tendente a abolir os direitos e garantias individuais. São cláusulas pétreas.'},
  {s:'constitucional',q:'O habeas corpus é cabível quando alguém sofrer ou se achar ameaçado de sofrer violência ou coação em sua liberdade de locomoção, por ilegalidade ou abuso de poder.',a:true,exp:'Art. 5º, LXVIII da CF. O HC protege o direito fundamental de ir e vir.'},
  {s:'constitucional',q:'A criação de novos tributos pode se dar por ato do Poder Executivo, desde que observadas as normas gerais de direito tributário.',a:false,exp:'Art. 150, I da CF — princípio da legalidade tributária. Tributos só podem ser criados ou majorados mediante LEI.'},
  {s:'constitucional',q:'O Tribunal de Contas da União é órgão auxiliar do Poder Legislativo federal no exercício do controle externo.',a:true,exp:'Art. 71 da CF. O TCU auxilia o Congresso Nacional no controle externo da administração pública federal.'},
  {s:'constitucional',q:'A imunidade tributária recíproca entre entes federativos alcança também as empresas públicas e sociedades de economia mista exploradoras de atividade econômica.',a:false,exp:'A imunidade NÃO alcança empresas públicas exploradoras de atividade econômica — apenas as prestadoras de serviço público em regime de exclusividade (STF).'},

  // ADMINISTRATIVO
  {s:'administrativo',q:'Os atos administrativos gozam do atributo da autoexecutoriedade de forma absoluta, não dependendo de previsão legal específica em qualquer caso.',a:false,exp:'A autoexecutoriedade NÃO é atributo de todos os atos. Exige previsão legal ou situação de urgência.'},
  {s:'administrativo',q:'A Lei 14.133/2021 substitui gradualmente a Lei 8.666/1993 como marco geral de licitações e contratos públicos.',a:true,exp:'A nova lei foi publicada em 2021 e após período de transição revogou integralmente a Lei 8.666/93.'},
  {s:'administrativo',q:'Servidor público federal estável só pode perder o cargo mediante sentença judicial transitada em julgado, processo administrativo disciplinar ou procedimento de avaliação periódica de desempenho.',a:true,exp:'Art. 41, §1º da CF — as três hipóteses de perda do cargo do servidor estável.'},
  {s:'administrativo',q:'A responsabilidade civil do Estado é objetiva e admite excludentes como caso fortuito, força maior ou culpa exclusiva da vítima.',a:true,exp:'Art. 37, §6º CF. Responsabilidade objetiva na modalidade de risco administrativo, admitindo excludentes.'},
  {s:'administrativo',q:'A Lei 8.112/90 aplica-se aos servidores públicos de todas as esferas: federal, estadual e municipal.',a:false,exp:'A Lei 8.112/90 é o Regime Jurídico Único APENAS dos servidores civis federais. Estados e Municípios têm leis próprias.'},

  // TRIBUTÁRIO
  {s:'tributario',q:'O lançamento tributário é atividade administrativa privativa da autoridade fiscal, vinculada e obrigatória.',a:true,exp:'Art. 142 do CTN — definição clássica do lançamento como atividade privativa, vinculada e obrigatória.'},
  {s:'tributario',q:'A responsabilidade tributária por sucessão aplica-se apenas aos tributos devidos até a data do ato de sucessão, não alcançando penalidades pecuniárias.',a:false,exp:'A sucessão tributária (arts. 129 a 133 CTN) alcança tributos E multas de caráter moratório, mas não punitivas (entendimento predominante).'},
  {s:'tributario',q:'O princípio da anterioridade nonagesimal se aplica integralmente a todos os tributos, sem exceções.',a:false,exp:'Existem várias exceções: II, IE, IOF, empréstimos compulsórios (guerra e calamidade), IPI (só anual), etc.'},
  {s:'tributario',q:'A imunidade tributária constitui uma limitação constitucional ao poder de tributar.',a:true,exp:'Imunidade é non-incidência constitucional — verdadeira limitação ao poder de tributar (arts. 150-152 CF).'},
  {s:'tributario',q:'A taxa pode ter base de cálculo ou fato gerador idêntico aos impostos.',a:false,exp:'Art. 145, §2º CF — taxas NÃO podem ter base de cálculo própria de imposto.'},

  // CONTABILIDADE
  {s:'contabilidade',q:'Pelo método das partidas dobradas, para cada débito existe um crédito de valor equivalente, mantendo-se o equilíbrio do patrimônio.',a:true,exp:'Princípio fundamental da contabilidade — o balanço patrimonial sempre fecha.'},
  {s:'contabilidade',q:'O Patrimônio Líquido é sempre igual à soma do Ativo com o Passivo.',a:false,exp:'Equação fundamental: PL = Ativo − Passivo. NUNCA Ativo + Passivo.'},
  {s:'contabilidade',q:'A depreciação é o reconhecimento sistemático da perda de valor do ativo imobilizado ao longo de sua vida útil.',a:true,exp:'CPC 27 — depreciação é alocação sistemática do valor depreciável ao longo da vida útil.'},
  {s:'contabilidade',q:'A DRE (Demonstração do Resultado do Exercício) apresenta a posição patrimonial da entidade em determinada data.',a:false,exp:'A DRE apresenta o RESULTADO (receitas, custos, despesas, lucro/prejuízo). Quem mostra a posição patrimonial é o Balanço Patrimonial.'},
  {s:'contabilidade',q:'Provisões devem ser reconhecidas quando existe obrigação presente resultante de evento passado, é provável a saída de recursos e o valor pode ser estimado com confiabilidade.',a:true,exp:'CPC 25 — três requisitos cumulativos para reconhecer provisão.'},

  // AUDITORIA
  {s:'auditoria',q:'O controle interno é de responsabilidade exclusiva do auditor externo independente.',a:false,exp:'O controle interno é responsabilidade da ADMINISTRAÇÃO. O auditor externo apenas avalia seu funcionamento.'},
  {s:'auditoria',q:'A materialidade em auditoria é um conceito relativo que depende da importância das informações financeiras para os usuários.',a:true,exp:'NBC TA 320 — materialidade é conceito de julgamento profissional, relativo aos usuários.'},
  {s:'auditoria',q:'O risco de auditoria é a soma simples do risco inerente com o risco de controle.',a:false,exp:'Risco de auditoria = Risco Inerente × Risco de Controle × Risco de Detecção (multiplicação, não soma).'},
  {s:'auditoria',q:'Os papéis de trabalho do auditor devem registrar a natureza, oportunidade e extensão dos procedimentos aplicados e respectivas conclusões.',a:true,exp:'NBC TA 230 — requisitos para documentação de auditoria.'},

  // RLM
  {s:'rlm',q:'A negação de uma proposição conjuntiva (p e q) é logicamente equivalente à disjunção das negações (~p ou ~q).',a:true,exp:'Primeira Lei de De Morgan — uma das equivalências mais cobradas.'},
  {s:'rlm',q:'Se p implica q e p é verdadeiro, então q necessariamente é verdadeiro.',a:true,exp:'Modus ponens — regra de inferência básica da lógica proposicional.'},
  {s:'rlm',q:'A probabilidade de um evento é sempre um número entre 0 e 100.',a:false,exp:'Probabilidade é um número entre 0 e 1 (ou 0% e 100% quando expressa em percentual).'},
  {s:'rlm',q:'Em juros compostos, o valor dos juros é calculado sempre sobre o capital inicial, sem incorporação de juros anteriores.',a:false,exp:'Isso descreve JUROS SIMPLES. Em juros COMPOSTOS há capitalização (juros sobre juros).'},

  // PORTUGUÊS
  {s:'portugues',q:'Todos os verbos pronominais devem ter o pronome oblíquo átono posposto ao verbo em qualquer construção sintática.',a:false,exp:'A colocação depende de fatores — palavras atrativas (não, que, pronomes), começo de oração, etc. Nem sempre é ênclise.'},
  {s:'portugues',q:'A concordância verbal depende da relação entre o sujeito e o verbo: o verbo concorda em número e pessoa com o sujeito.',a:true,exp:'Regra geral da concordância verbal em português.'},
  {s:'portugues',q:'A crase é a fusão de duas vogais idênticas, sendo facultativa diante de nomes próprios femininos.',a:false,exp:'Diante de nomes próprios femininos, a crase pode ser facultativa OU obrigatória (antropônimos que admitem artigo).'},
  {s:'portugues',q:'Orações subordinadas substantivas exercem funções sintáticas típicas de substantivos (sujeito, objeto, complemento nominal, etc.).',a:true,exp:'Conceituação correta de oração subordinada substantiva.'},

  // TCU / Controle
  {s:'controle',q:'Compete ao Tribunal de Contas da União julgar as contas dos administradores e demais responsáveis por dinheiros, bens e valores públicos.',a:true,exp:'Art. 71, II da CF — competência expressa do TCU.'},
  {s:'controle',q:'As decisões do TCU que imputem débito ou multa a responsáveis constituem título executivo extrajudicial.',a:true,exp:'Art. 71, §3º da CF. Podem ser executadas diretamente pelo Ministério Público Federal ou AGU.'},

  // AFO
  {s:'afo',q:'O Plano Plurianual (PPA) tem vigência de quatro anos, abrangendo o período do segundo ano do mandato até o primeiro ano do mandato subsequente.',a:true,exp:'Art. 165, §1º CF. PPA vigora do 2º ano do mandato até o 1º do seguinte.'},
  {s:'afo',q:'A Lei de Responsabilidade Fiscal aplica-se exclusivamente à União, não alcançando Estados e Municípios.',a:false,exp:'LC 101/00 aplica-se a TODOS os entes (União, Estados, DF, Municípios) e aos três Poderes.'},
  {s:'afo',q:'Créditos extraordinários são abertos para atender despesas imprevisíveis e urgentes, como calamidade pública, comoção interna ou guerra.',a:true,exp:'Art. 167, §3º CF — hipóteses taxativas de crédito extraordinário.'},

  // LTC
  {s:'ltc',q:'O IPI é imposto seletivo em função da essencialidade do produto, com alíquotas maiores para produtos supérfluos.',a:true,exp:'Art. 153, §3º, I da CF — seletividade obrigatória do IPI.'},
  {s:'ltc',q:'O ICMS não admite compensação do imposto pago nas operações anteriores com o devido nas seguintes, em razão do princípio da cumulatividade.',a:false,exp:'ICMS é NÃO-CUMULATIVO (art. 155, §2º, I CF). Permite compensação.'},
  {s:'ltc',q:'A Reforma Tributária criou o IBS, a CBS e o Imposto Seletivo, substituindo o ICMS, o ISS, o PIS, a COFINS e o IPI em sua essência.',a:true,exp:'EC 132/2023 — novo modelo de tributação sobre consumo.'},

  // ECONOMIA (BACEN)
  {s:'economia',q:'A política monetária é conduzida pelo Banco Central e tem como principal instrumento no Brasil a taxa SELIC.',a:true,exp:'COPOM define a SELIC, principal instrumento de política monetária.'},
  {s:'economia',q:'Inflação de demanda ocorre quando há aumento da oferta agregada da economia.',a:false,exp:'Inflação de DEMANDA ocorre quando a demanda agregada cresce mais que a oferta. O enunciado inverte o conceito.'},

  // CONTABILIDADE PÚBLICA
  {s:'contpub',q:'O Plano de Contas Aplicado ao Setor Público (PCASP) é de uso obrigatório por todos os entes da federação brasileira.',a:true,exp:'Portaria STN — PCASP é obrigatório para todos os entes.'},

  // INFORMÁTICA
  {s:'ti',q:'A LGPD (Lei Geral de Proteção de Dados) aplica-se apenas ao setor privado, não alcançando órgãos públicos.',a:false,exp:'LGPD (Lei 13.709/18) aplica-se a pessoa física E pessoa jurídica, de direito público e privado.'},
  {s:'ti',q:'Backup incremental armazena apenas os arquivos que foram modificados desde o último backup (completo ou incremental).',a:true,exp:'Definição correta de backup incremental.'},
];

/**
 * Sorteia N questões do banco, priorizando matérias que o usuário mais tem metas
 */
function sorteiaQuestoes(n=5){
  // Seed diária para manter consistência durante o dia
  const now = new Date();
  const seed = now.getFullYear()*10000 + (now.getMonth()+1)*100 + now.getDate();
  const shuffled = [...QUESTIONS_BANK];
  // Pseudo-shuffle determinístico
  for(let i=shuffled.length-1;i>0;i--){
    const j = (seed * (i+1) * 9301 + 49297) % (i+1);
    [shuffled[i],shuffled[j]] = [shuffled[j],shuffled[i]];
  }
  return shuffled.slice(0,n);
}

let simuladoState = {answers:{}, finished:false, questions:[]};

function renderSimulado(){
  const wrap = $('#simulWrap');
  if(!wrap) return;

  // Se ainda não sorteou questões do dia, sorteia
  const hoje = dateISO(new Date());
  const storedSim = state.simuladoHoje || {};
  if(storedSim.date !== hoje){
    simuladoState = {answers:{}, finished:false, questions: sorteiaQuestoes(5)};
    state.simuladoHoje = {date:hoje, questions: simuladoState.questions.map(q=>q.q), answers:{}, finished:false};
    saveState();
  } else {
    simuladoState.questions = storedSim.questions.map(qt=>QUESTIONS_BANK.find(q=>q.q===qt)).filter(Boolean);
    simuladoState.answers = storedSim.answers || {};
    simuladoState.finished = storedSim.finished || false;
  }

  const answeredCount = Object.keys(simuladoState.answers).length;
  const totalQ = simuladoState.questions.length;

  let html = `
    <div class="simul-intro">
      <h3>🎯 Mantenha o modo-prova ativo</h3>
      <p>5 questões CERTO ou ERRADO no estilo CEBRASPE/FGV — as bancas dos concursos que você está estudando. Cada dia um novo desafio.</p>
      <div class="simul-meta">
        <span>📅 Data:<strong>${fmt(new Date())}</strong></span>
        <span>📊 Respondidas:<strong>${answeredCount} de ${totalQ}</strong></span>
        <span>🏆 XP em jogo:<strong>${totalQ*20} XP</strong></span>
      </div>
    </div>
  `;

  simuladoState.questions.forEach((qObj, idx)=>{
    const subj = SUBJECTS.find(s=>s.id===qObj.s);
    const answered = simuladoState.answers[idx];
    const isAnswered = answered !== undefined;
    const isCorrect = isAnswered && answered === qObj.a;

    html += `
      <div class="simul-q ${isAnswered?'answered':''}">
        <div>
          <span class="simul-q-num">Questão ${idx+1}</span>
          <span class="simul-q-subj" style="background:${subj?subj.color:'#666'}">${subj?subj.short:'—'}</span>
        </div>
        <div class="simul-q-text">${qObj.q}</div>
        <div class="simul-choices">
          <div class="simul-choice ${isAnswered && answered===true?(qObj.a===true?'correct':'wrong'):''}" ${!isAnswered?`onclick="respSimul(${idx},true)"`:''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/></svg>
            CERTO
          </div>
          <div class="simul-choice ${isAnswered && answered===false?(qObj.a===false?'correct':'wrong'):''}" ${!isAnswered?`onclick="respSimul(${idx},false)"`:''}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ERRADO
          </div>
        </div>
        ${isAnswered?`
          <div class="simul-feedback ${isCorrect?'right':'bad'}">
            <strong>${isCorrect?'✓ Correto!':'✗ Incorreto — gabarito: '+(qObj.a?'CERTO':'ERRADO')}</strong>
            ${qObj.exp}
          </div>
        `:''}
      </div>
    `;
  });

  // Resultado final
  if(answeredCount === totalQ && totalQ > 0){
    let acertos = 0;
    simuladoState.questions.forEach((q,i)=>{
      if(simuladoState.answers[i] === q.a) acertos++;
    });
    const pct = Math.round((acertos/totalQ)*100);
    const cls = pct >= 80 ? '' : pct >= 60 ? 'med' : 'low';
    const msg = pct >= 80 ? 'Excelente! Nota de aprovado!' : pct >= 60 ? 'Boa! Continue assim.' : 'Revise os conceitos e tente novamente amanhã.';

    html += `
      <div class="simul-result ${cls}">
        <h3>Simulado concluído!</h3>
        <div class="simul-result-pct">${pct}%</div>
        <p>Você acertou <strong>${acertos} de ${totalQ}</strong> questões. ${msg}</p>
        <button class="simul-btn-new" onclick="recomecarSimulado()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9M3 12h5M3 3v5"/></svg>
          Recomeçar com novas questões
        </button>
      </div>
    `;

    // Salva no histórico de questões se ainda não foi salvo
    if(!simuladoState.finished){
      simuladoState.finished = true;
      state.simuladoHoje.finished = true;
      state.questions.push({
        date: fmt(new Date()),
        subject: 'simulado',
        hits: acertos,
        total: totalQ,
      });
      state.xp += acertos * 20;
      saveState();
    }
  }

  wrap.innerHTML = html;
}

function respSimul(idx, resp){
  simuladoState.answers[idx] = resp;
  if(!state.simuladoHoje) state.simuladoHoje = {};
  state.simuladoHoje.answers = simuladoState.answers;
  saveState();
  renderSimulado();
  renderTopbar();
}
window.respSimul = respSimul;

function recomecarSimulado(){
  simuladoState = {answers:{}, finished:false, questions: sorteiaQuestoes(5)};
  state.simuladoHoje = {
    date: dateISO(new Date()),
    questions: simuladoState.questions.map(q=>q.q),
    answers: {},
    finished: false,
    counter: (state.simuladoHoje?.counter||0) + 1,
  };
  // Re-sorteio com seed diferente
  const shuffled = [...QUESTIONS_BANK].sort(()=>Math.random()-0.5);
  simuladoState.questions = shuffled.slice(0,5);
  state.simuladoHoje.questions = simuladoState.questions.map(q=>q.q);
  saveState();
  renderSimulado();
}
window.recomecarSimulado = recomecarSimulado;

/* ============================================================
   COMPARAÇÃO EXÉRCITO × AUDITOR FISCAL
   Banco de reflexões diárias e calculadoras em tempo real
============================================================ */

// Valores de referência reais (fontes: MP 1.293/2025, tabelas RFB 2025)
const SALARIO_EXERCITO_LIQUIDO = 12000;  // Capitão líquido (soldo + adicionais)
const SALARIO_AUDITOR_LIQUIDO = 24484;   // Classe A, Padrão I + bônus + auxílios
const DIFERENCA_MENSAL = SALARIO_AUDITOR_LIQUIDO - SALARIO_EXERCITO_LIQUIDO;
const DIFERENCA_ANUAL = DIFERENCA_MENSAL * 13; // 12 meses + 13º
const DIFERENCA_DIARIA = DIFERENCA_MENSAL / 30;
const DIFERENCA_HORARIA = DIFERENCA_DIARIA / 24;

const COMP_DAILY_REFLECTIONS = [
  {
    title:'Hoje você trabalhou 8h no quartel. O Auditor trabalhou 8h em casa.',
    body:'Enquanto você acordava às 5h para o TFM e ficava até tarde no quartel, um Auditor da RFB estava no home office, em frente ao café da manhã da família. Mesmo trabalho cerebral, ambiente completamente diferente. <strong>Diferença hoje: R$ 400 a mais no bolso dele.</strong>'
  },
  {
    title:'Sua mudança custa R$ 40 mil. A do Auditor é "nenhuma".',
    body:'A cada 2-3 anos o Exército te transfere. Mudança, troca de escola dos filhos, estresse, adaptação. O Auditor Fiscal escolheu a cidade e fincou raízes. <strong>Em 20 anos no Exército, você terá mudado 7x. O Auditor, zero.</strong>'
  },
  {
    title:'Um dia de serviço seu vale menos que uma hora e meia de trabalho do Auditor.',
    body:'Soldo diário de Capitão (descontos incluídos): ~R$ 400. Salário/hora de um AFRFB: ~R$ 153. <strong>Você trabalha 8 horas para ganhar o que ele ganha em 2h30.</strong>'
  },
  {
    title:'Seu filho só vê você fim de semana. O do Auditor, todos os dias.',
    body:'Escalas de 24h, operações, exercícios de campo. Festinhas de escola, jantares de família, shows dos filhos muitas vezes perdidos. <strong>O Auditor volta para casa às 17h todo santo dia. E finais de semana são sagrados.</strong>'
  },
  {
    title:'Sua aposentadoria paga R$ 12k. A do Auditor paga R$ 31k.',
    body:'Quando você finalmente se aposentar, continuará recebendo o equivalente ao soldo atual. O Auditor aposentado recebe o último salário integralmente — mais de R$ 30 mil por mês vitalícios. <strong>Diferença de aposentadoria: R$ 228 mil por ano, pelo resto da vida.</strong>'
  },
  {
    title:'TAF obrigatório vs. academia quando você quiser.',
    body:'Teste de Avaliação Física duas vezes ao ano. Corrida, barra, abdominal, natação. Reprovou? Punição administrativa. O Auditor faz academia quando quer, porque quer. <strong>Sem pressão, sem risco de carreira por problema físico.</strong>'
  },
  {
    title:'Você ainda precisa pedir permissão para viajar ao exterior.',
    body:'Militar da ativa precisa de autorização para sair do país. Casamento com estrangeiro? Permissão. Emprego extra? Raríssimas exceções. O Auditor? Liberdade total. <strong>Civil pleno, com direitos plenos, salário de alto executivo.</strong>'
  },
  {
    title:'Bônus de Eficiência = R$ 137 mil por ano só nele.',
    body:'O Auditor Fiscal ganha Bônus de Eficiência de R$ 11.460 por mês, chegando a R$ 137.530 por ano, apenas nessa rubrica. <strong>Isso é quase o salário anual inteiro de um Capitão do Exército. Só o bônus.</strong>'
  },
  {
    title:'Seu Quadro de Acesso é incerto. A progressão do Auditor é garantida.',
    body:'Subir de Capitão para Major no Exército depende de vagas, política interna, Quadro de Acesso. Muitos nunca passam. O Auditor sobe de classe automaticamente por tempo. <strong>Previsibilidade total na carreira civil federal.</strong>'
  },
  {
    title:'Diferença de 1 ano = um apartamento.',
    body:'R$ 162 mil por ano de diferença líquida. Em um único ano no Exército, você deixa de comprar um apartamento de 2 quartos em cidade do interior, à vista. <strong>Cada 12 meses que passa sem mudar, é um imóvel que evapora.</strong>'
  },
  {
    title:'Suas férias: 30 dias fracionados. Do Auditor: 30 dias corridos.',
    body:'Férias no Exército muitas vezes divididas por necessidade de serviço, com convocação de urgência possível. Auditor tira 30 dias seguidos, sem interrupção, planejando com meses de antecedência. <strong>Férias de verdade, não "folga vigiada".</strong>'
  },
  {
    title:'Você come marmita do rancho. Auditor tem R$ 1.000 de auxílio.',
    body:'Auxílio-alimentação do militar: valores simbólicos ou refeição no rancho. Auxílio-alimentação do Auditor: R$ 1.000 mensais, líquidos, livres. <strong>R$ 12 mil por ano só em comida, sem desconto.</strong>'
  },
  {
    title:'24 horas de serviço sem pagar extra. 1h extra do Auditor = compensação.',
    body:'Militares fazem serviços de 24h seguidas sem receber hora extra — é do regime. Auditor tem banco de horas: 1h a mais = 1h de folga. <strong>Tempo de vida justamente valorizado.</strong>'
  },
  {
    title:'Hoje você vale R$ 400. O Auditor hoje vale R$ 816.',
    body:'Divida o salário líquido pelos dias do mês. Capitão: R$ 400/dia. Auditor: R$ 816/dia. <strong>Você passou o dia todo acordado, trabalhando, longe da família, ganhando metade.</strong>'
  },
  {
    title:'Seus 30 anos de serviço = 30 anos deixando de ganhar R$ 4 milhões.',
    body:'R$ 12.484 de diferença líquida mensal × 13 meses × 30 anos = R$ 4,86 milhões. Esse é o valor que você deixaria de ganhar se ficasse os 30 anos no Exército. <strong>Cada dia estudando é R$ 444 voltando pro seu bolso futuro.</strong>'
  },
  {
    title:'IMBEL, fundação dos militares — promessas vs realidade.',
    body:'O sistema de saúde militar (FUSEx) e a assistência aos militares nem sempre cumprem as expectativas. O plano GEAP dos servidores federais atende em hospitais de ponta. <strong>Saúde não é "benefício", é direito. Auditor tem direito pleno.</strong>'
  },
  {
    title:'Promoção no Exército = concurso interno disputadíssimo. Auditor = tempo.',
    body:'Entre Major e Tenente-Coronel, há concurso interno (ESG). A disputa é feroz e muitos excelentes oficiais travam. No serviço civil, progressão é cronológica + mérito. <strong>Você avança sem precisar "brigar" com colegas a cada degrau.</strong>'
  },
  {
    title:'Sua esposa/marido também carrega seu fardo.',
    body:'Cônjuges de militares abandonam carreiras a cada transferência. Perdem vínculos, recomeçam do zero em cidades novas. Cônjuge de Auditor trabalha onde escolher, faz concurso, cresce junto. <strong>Sua família inteira ganha ou perde com sua carreira.</strong>'
  },
  {
    title:'Você assina termo de continência. Auditor faz reuniões no Zoom.',
    body:'Dia a dia militar é protocolo, hierarquia, prestação de continência, formatura diária. Dia a dia de Auditor é análise fiscal, reuniões técnicas, relatórios digitais. <strong>Mesmo nível de responsabilidade, zero formalidade desgastante.</strong>'
  },
  {
    title:'Faltam só 550 dias para a posse. 550 dias até a vida mudar.',
    body:'Provável edital da RFB em outubro/2026, prova em janeiro/2027, posse em meados de 2027. Menos de 2 anos separam você da vida completamente nova. <strong>Essa jornada tem prazo. E o prazo favorece quem estuda hoje.</strong>'
  },
  {
    title:'Oficial do Exército pode ir para guerra. Auditor, não.',
    body:'Parece óbvio, mas é fundamental: sua profissão hoje inclui o risco de conflito armado, operações de GLO, fronteira. O Auditor fiscaliza grandes empresas com computador e cafezinho. <strong>Risco de vida real vs. zero. Stress cerebral vs. físico.</strong>'
  },
  {
    title:'Sua previdência pode mudar a qualquer momento.',
    body:'Reformas de previdência dos militares são recorrentes e sempre desfavoráveis. A previdência dos servidores civis federais tem paridade garantida constitucionalmente para quem entrou até 2003, e regras ainda boas para os novos. <strong>Estabilidade previdenciária muito maior no lado civil.</strong>'
  },
  {
    title:'O stress cumulativo de décadas de escalas não tem volta.',
    body:'Militares de longa carreira apresentam índices elevados de distúrbios do sono, doenças cardiovasculares, tensão crônica. A medicina do trabalho reconhece o desgaste do regime de escalas. <strong>Saúde é o único ativo que dinheiro nenhum recupera.</strong>'
  },
  {
    title:'Sua patente é igual em Roraima e em Manaus. Seu salário não.',
    body:'Oficiais lotados em regiões remotas recebem adicionais, mas geralmente modestos. Auditor Fiscal alocado em aduana de fronteira recebe gratificação aduaneira + diárias de missão, pode somar R$ 5-10 mil extras. <strong>Geografia gera bônus no serviço civil, não só "sofrimento extra".</strong>'
  },
  {
    title:'Hoje você acordou às 5h30. O Auditor acordou às 7h.',
    body:'Formatura diária às 7h20. TFM 3x por semana. Você acorda antes do sol nascer para servir. O Auditor acorda tranquilo, toma café com a família, chega à repartição às 9h. <strong>2h de vida a mais, todo santo dia, por 30 anos = 15.000 horas de vida.</strong>'
  },
  {
    title:'Quando você finalmente folga, precisa se apresentar na volta.',
    body:'Licenças, folgas, férias: tudo depende de escala, aprovação do comando, necessidade de serviço. Auditor marca férias no sistema e pronto. <strong>A palavra "LIBERDADE" só existe no serviço civil com todo seu significado.</strong>'
  },
  {
    title:'Um dia sem estudar é R$ 444 devolvidos ao Exército.',
    body:'Matemática fria: cada dia que você não estuda, a aprovação demora mais, e você passa mais tempo no regime militar. Cada dia = R$ 444 a menos no seu bolso futuro. <strong>Seu estudo de hoje tem valor financeiro mensurável.</strong>'
  },
  {
    title:'Sua progressão depende de chefes. A do Auditor, só de você.',
    body:'Relatórios de desempenho, Quadro de Acesso, indicação de chefia — sua carreira militar depende de outros te enxergarem. Auditor só precisa cumprir estágio probatório. <strong>Meritocracia pura. Só depende de você.</strong>'
  },
  {
    title:'Coronel aposentado: R$ 18k. Auditor aposentado: R$ 33k.',
    body:'Topo da carreira militar (Coronel) aposenta com ~R$ 18.000 brutos. Auditor Classe Especial aposenta com ~R$ 35.000 brutos. <strong>Diferença de R$ 15 mil por mês na aposentadoria. Por 25+ anos. R$ 4,5 milhões a mais.</strong>'
  },
  {
    title:'Seu trabalho é necessário. Mas outro pode fazer. Seu estudo de hoje, só você.',
    body:'O Exército continua funcionando sem você. A aprovação no concurso NÃO acontece sem seu estudo. <strong>Ninguém estuda por você. Cada hora investida é um ativo insubstituível.</strong>'
  },
];

function getReflectionDoDia(){
  const now = new Date();
  const start = new Date(now.getFullYear(),0,0);
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return COMP_DAILY_REFLECTIONS[dayOfYear % COMP_DAILY_REFLECTIONS.length];
}

function formatBRL(v){
  if(v >= 1000000) return 'R$ ' + (v/1000000).toFixed(2).replace('.',',') + ' MI';
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
}

function renderComparacao(){
  // Valores de cabeçalho
  if($('#compMonthLoss')) $('#compMonthLoss').textContent = formatBRL(DIFERENCA_MENSAL);
  if($('#compYearLoss')) $('#compYearLoss').textContent = formatBRL(DIFERENCA_ANUAL);
  if($('#compDecadeLoss')) $('#compDecadeLoss').textContent = formatBRL(DIFERENCA_ANUAL * 10);

  // Reflexão do dia
  const refl = getReflectionDoDia();
  if($('#compDailyHeading')) $('#compDailyHeading').textContent = refl.title;
  if($('#compDailyBody')) $('#compDailyBody').innerHTML = refl.body;

  // Calculadora: quanto já perdeu desde que começou a estudar
  // Usa state.dataInicio para calcular dias
  let diasDesdoInicio = 280; // fallback
  if(state.dataInicio){
    const inicio = new Date(state.dataInicio+'T12:00:00');
    const hoje = new Date();
    diasDesdoInicio = Math.max(0, Math.floor((hoje - inicio) / (1000*60*60*24)));
  }

  if($('#compLostAll')){
    const perdaTotal = diasDesdoInicio * DIFERENCA_DIARIA;
    $('#compLostAll').textContent = formatBRL(perdaTotal);
    const labelEl = $('#compLostAll').previousElementSibling;
    if(labelEl) labelEl.textContent = `Desde ${state.dataInicio ? fmt(new Date(state.dataInicio+'T12:00:00')) : '—'} (${diasDesdoInicio} dias)`;
  }

  if($('#compLostWeek')){
    const perdaSemana = 7 * DIFERENCA_DIARIA;
    $('#compLostWeek').textContent = formatBRL(perdaSemana);
  }

  if($('#compLostDay')){
    // Acumula pelas horas já passadas do dia
    const agora = new Date();
    const horaAtual = agora.getHours() + agora.getMinutes()/60;
    const perdaHoje = horaAtual * DIFERENCA_HORARIA;
    $('#compLostDay').textContent = formatBRL(perdaHoje);
  }

  if($('#comp30y')){
    $('#comp30y').textContent = formatBRL(DIFERENCA_ANUAL * 30);
  }
}

/* ============================================================
   PAINEL & NAVEGAÇÃO
============================================================ */
const pages = {
  home: renderHome,
  metas: renderMetas,
  semana: renderSemana,
  calendario: renderCalendario,
  simulado: renderSimulado,
  pomodoro: renderPomodoro,
  questoes: renderQuestoes,
  desempenho: renderDesempenho,
  materias: renderMaterias,
  comparacao: renderComparacao,
  plano: renderPlano,
  edital: renderEdital,
  metodologia: ()=>{},
  materiais: ()=>{},
};

function navigate(pageId){
  $$('.page').forEach(p=>p.classList.remove('active'));
  $$('.nav-item').forEach(i=>i.classList.remove('active'));
  const page = $('#page-'+pageId);
  const nav  = $(`.nav-item[data-page="${pageId}"]`);
  if(page) page.classList.add('active');
  if(nav) nav.classList.add('active');
  if(pages[pageId]) pages[pageId]();
  window.scrollTo(0,0);
  // fecha sidebar no mobile
  $('#sidebar').classList.remove('open');
  $('#backdrop').classList.remove('show');
}
$$('.nav-item').forEach(i=>i.addEventListener('click',()=>navigate(i.dataset.page)));
$$('[data-goto]').forEach(s=>s.addEventListener('click',()=>navigate(s.dataset.goto)));

// Mobile menu
$('#menuToggle').addEventListener('click',()=>{
  $('#sidebar').classList.toggle('open');
  $('#backdrop').classList.toggle('show');
});
$('#backdrop').addEventListener('click',()=>{
  $('#sidebar').classList.remove('open');
  $('#backdrop').classList.remove('show');
});

/* ============================================================
   TOPBAR
============================================================ */
function renderTopbar(){
  const now = new Date();
  $('#topDay').textContent = weekNamesShort[now.getDay()]+'., '+now.getDate()+' de '+monthNames[now.getMonth()];
  $('#topDate').textContent = now.getFullYear();
  $('#xpCount').textContent = state.xp.toLocaleString('pt-BR');
}

/* ============================================================
   HOME
============================================================ */
function renderHome(){
  // Calcula métricas dinâmicas a partir das metas concluídas
  const stats = calcHeroStats();

  if($('#heroPct')) $('#heroPct').textContent = stats.progress.toFixed(2).replace('.',',')+'%';
  if($('#heroFill')) $('#heroFill').style.width = Math.min(100, stats.progress)+'%';
  if($('#statDays')) $('#statDays').textContent = stats.days;
  if($('#statHours')) $('#statHours').textContent = stats.hours.toFixed(1).replace('.',',')+'h';
  if($('#statCron')) $('#statCron').textContent = stats.hours.toFixed(1).replace('.',',')+'h';
  if($('#statAccuracy')) $('#statAccuracy').textContent = calcAccuracy()+'%';

  // Atualiza data final na home
  if(state.dataFinal && $('#heroEnd')){
    const [y,m,d] = state.dataFinal.split('-');
    $('#heroEnd').textContent = `${d}/${m}/${y}`;
  }
  if(state.dataFinal && $('#endDate')){
    const [y,m,d] = state.dataFinal.split('-');
    $('#endDate').textContent = `${d}/${m}/${y}`;
  }

  // Atualiza mensagem motivacional diária
  updateDailyMotivation();
}

/**
 * Calcula métricas dinâmicas (progresso, horas, dias) a partir das metas concluídas
 * e do progresso do edital.
 */
function calcHeroStats(){
  // Minutos de metas concluídas
  let minConcluidos = 0;
  let diasComEstudo = new Set();
  Object.keys(state.metas || {}).forEach(d=>{
    state.metas[d].forEach(m=>{
      if(m.done){
        minConcluidos += m.mins || 0;
        diasComEstudo.add(d);
      }
    });
  });

  // Progresso do edital: tópicos marcados / total de tópicos
  let totalTopicos = 0;
  let topicosConcluidos = 0;
  SUBJECTS.forEach(s=>{
    totalTopicos += s.topics.length;
    const prog = state.editalProgress[s.id] || [];
    topicosConcluidos += prog.filter(Boolean).length;
  });

  // Progresso combinado: 60% pelos tópicos do edital + 40% pelo tempo estudado
  // Tempo estimado total: 800h (valor padrão razoável para AFRFB/TCU/BACEN)
  const metaHorasTotal = 800;
  const horasEstudadas = minConcluidos / 60;
  const pctHoras = Math.min(100, (horasEstudadas / metaHorasTotal) * 100);
  const pctTopicos = totalTopicos === 0 ? 0 : (topicosConcluidos / totalTopicos) * 100;
  const progresso = (pctTopicos * 0.6) + (pctHoras * 0.4);

  return {
    progress: progresso,
    hours: horasEstudadas,
    days: diasComEstudo.size,
    topicsDone: topicosConcluidos,
    topicsTotal: totalTopicos,
  };
}

function calcAccuracy(){
  if(state.questions.length===0) return 0;
  const total = state.questions.reduce((a,b)=>a+b.total,0);
  const hits  = state.questions.reduce((a,b)=>a+b.hits,0);
  return total===0?0:Math.round((hits/total)*100);
}

/* ============================================================
   METAS DIÁRIAS
============================================================ */
function renderMetas(){
  const today = new Date();
  const todayStr = dateISO(today);
  const metas = generateMetasForDate(todayStr);

  $('#mhToday').textContent = fmt(today);
  const subjects = new Set(metas.map(m=>m.subject));
  $('#mhSubjects').textContent = subjects.size+' matéria'+(subjects.size!==1?'s':'');
  const totalMin = metas.reduce((a,b)=>a+b.mins,0);
  const doneMin  = metas.filter(m=>m.done).reduce((a,b)=>a+b.mins,0);
  $('#mhTotal').textContent = (totalMin/60).toFixed(1).replace('.',',')+'h de metas';
  $('#mhDone').textContent  = (doneMin/60).toFixed(1).replace('.',',')+'h estudadas';
  const pct = totalMin===0?0:Math.round((doneMin/totalMin)*100);
  $('#dailyPct').textContent = pct+'%';
  $('#dailyFill').style.width = pct+'%';

  // Lista
  const list = $('#metasList');
  if(metas.length===0){
    list.innerHTML = `<div class="card" style="text-align:center;padding:60px 20px"><h3 style="font-family:var(--serif);font-size:22px;margin-bottom:8px">🌴 Dia de descanso</h3><p style="color:var(--ink-soft)">Hoje é fim de semana! Aproveite para recarregar as energias.</p></div>`;
    return;
  }
  list.innerHTML = metas.map((m,idx)=>{
    // Verifica atraso (metas de dias anteriores não concluídas)
    const isLate = false; // hoje sempre novo, poderia verificar dias passados
    const progress = m.done?100:(m.mode==='study'?50:0);
    const progressLabel = m.done?'100% concluído':(m.mode==='study'?`estude ${m.mins} min (você terá estudado ${m.mins} min e o assunto tem 180 min no total, seu progresso será de ${Math.round(m.mins/180*100)}%)`:'');
    const accuracy = getSubjectAccuracy(m.subject);
    return `
      <div class="meta-item ${m.mode} ${m.done?'done':''} ${isLate?'late':''}" data-idx="${idx}">
        <div class="meta-header">
          <div class="meta-tags">
            <span class="mode-badge ${m.mode}">
              ${m.mode==='study'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>':''}
              ${m.mode==='review'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 109-9M3 12h5M3 3v5"/></svg>':''}
              ${m.mode==='exercise'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 11l3 3L22 4"/></svg>':''}
              ${m.mode==='resume'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>':''}
              ${m.modeLabel}
            </span>
            <span class="meta-tag date">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              meta do dia ${pad(new Date(todayStr).getDate())}/${pad(new Date(todayStr).getMonth()+1)}
            </span>
            ${isLate?`<span class="meta-tag late">⚠ essa meta está atrasada</span>`:''}
            <span class="meta-tag time">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              ${m.mins>=60?`${Math.floor(m.mins/60)}h ${m.mins%60>0?m.mins%60+'min':''}`:m.mins+' minutos'} de atividade
            </span>
          </div>
          <div class="meta-accuracy">
            <span class="meta-accuracy-value" style="color:${accuracy===0?'var(--muted)':accuracy>=80?'var(--success)':accuracy>=60?'var(--warn)':'var(--danger)'}">${accuracy===0?'—':accuracy+'%'}</span>
            ${accuracy===0?'sem dados':'de acertos'}
          </div>
        </div>

        <div class="meta-check">
          <input type="checkbox" id="chk-${m.id}" ${m.done?'checked':''} onchange="toggleMeta('${todayStr}',${idx})">
          <label for="chk-${m.id}">já terminei esta meta</label>
        </div>

        <div class="meta-subject">${m.subjectName}</div>
        <div class="meta-topic">${m.topic}</div>

        ${m.mode==='study' && !m.done ? `
          <div class="meta-progress">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
            ${progressLabel}
          </div>
        `:''}

        <div class="meta-actions">
          <button class="btn btn-teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/></svg> Caderno</button>
          <button class="btn btn-light" onclick="openPomodoroFor('${m.id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/></svg>
            Cronômetro
          </button>
          ${!m.done?`<button class="btn btn-success" onclick="toggleMeta('${todayStr}',${idx})">✓ Concluir meta</button>`:''}
        </div>

        ${m.ref?`<div class="meta-ref"><strong>Referência:</strong> ${m.ref}</div>`:''}
      </div>
    `;
  }).join('');
}

function toggleMeta(dateStr,idx){
  const metas = state.metas[dateStr];
  if(!metas) return;
  const m = metas[idx];

  // Se já estava concluída, apenas desfaz
  if(m.done){
    m.done = false;
    // remove horas cronometradas se aplicável
    if(m.mode !== 'study') state.heroCron = Math.max(0, (state.heroCron||0) - m.mins/60);
    saveState();
    renderMetas();
    renderHome();
    return;
  }

  // Se for meta de estudo, abrir modal de pergunta
  if(m.mode === 'study'){
    openMetaModal(dateStr, idx);
    return;
  }

  // Revisão, resumo, exercício: apenas marca e dá XP
  m.done = true;
  state.xp += 50;
  state.heroCron = (state.heroCron||0) + m.mins/60;
  toast('✓ Meta concluída! +50 XP','success');
  saveState();
  renderMetas();
  renderTopbar();
  renderHome();
}
window.toggleMeta = toggleMeta;

/* ============================================================
   MODAL DE CONCLUSÃO DE META
============================================================ */
let pendingMeta = null; // {dateStr, idx}

function openMetaModal(dateStr, idx){
  const m = state.metas[dateStr][idx];
  pendingMeta = {dateStr, idx};

  // Calcula o progresso atual do assunto (somando estudos deste tópico em dias passados)
  let minEstudados = m.mins;
  Object.keys(state.metas).forEach(d=>{
    if(d === dateStr) return;
    const dm = state.metas[d];
    dm.forEach(mt=>{
      if(mt.topicKey === m.topicKey && mt.done && mt.mode === 'study'){
        minEstudados += mt.mins;
      }
    });
  });
  const total = m.assuntoTotalMin || 180;
  const pct = Math.min(100, Math.round((minEstudados/total)*100));
  const remaining = 100 - pct;

  $('#modalMetaTitle').textContent = 'Parabéns, você cumpriu essa meta';
  $('#modalMetaDesc').textContent = `Seu estudo de ${m.topic}.`;
  $('#modalProgFill').style.width = pct+'%';
  $('#modalProgDone').textContent = pct+'%';
  $('#modalProgRemain').textContent = remaining+'%';
  $('#modalAlertText').textContent = `Ainda existem metas de estudo de ${m.topic} programadas no seu cronograma para você continuar estudando esse assunto.`;
  $('#modalAlertRemain').style.display = pct >= 100 ? 'none' : 'block';

  $('#modalMetaBg').classList.add('show');
}

function closeMetaModal(){
  $('#modalMetaBg').classList.remove('show');
  pendingMeta = null;
}

function confirmMetaCompletion(finishedSubject){
  if(!pendingMeta) return;
  const {dateStr, idx} = pendingMeta;
  const m = state.metas[dateStr][idx];
  m.done = true;
  state.xp += finishedSubject ? 100 : 50;
  state.heroCron = (state.heroCron||0) + m.mins/60;

  if(finishedSubject){
    // Marcar o assunto todo como concluído (para desbloquear revisão e exercício)
    state.assuntosConcluidos[m.topicKey] = {
      date: dateStr,
      subject: m.subject,
      topic: m.topic,
    };
    // Também marcar no edital se o tópico bater
    const subj = SUBJECTS.find(s=>s.id===m.subject);
    if(subj){
      const topicIndex = subj.topics.indexOf(m.topic);
      if(topicIndex >= 0){
        if(!state.editalProgress[m.subject]){
          state.editalProgress[m.subject] = subj.topics.map(()=>false);
        }
        state.editalProgress[m.subject][topicIndex] = true;
      }
    }
    toast(`🎉 Assunto "${m.topic}" finalizado! Revisão e exercícios foram agendados. +100 XP`,'success');
  } else {
    toast('✓ Meta concluída! Mais tempo será alocado para o assunto. +50 XP','success');
  }

  saveState();
  closeMetaModal();
  renderMetas();
  renderTopbar();
  renderHome();
}

function getSubjectAccuracy(subjId){
  const qs = state.questions.filter(q=>q.subject===subjId);
  if(qs.length===0) return 0;
  const total = qs.reduce((a,b)=>a+b.total,0);
  const hits  = qs.reduce((a,b)=>a+b.hits,0);
  return total===0?0:Math.round((hits/total)*100);
}

function openPomodoroFor(metaId){
  navigate('pomodoro');
  // pode estender para pré-carregar a meta
}
window.openPomodoroFor = openPomodoroFor;

/* ============================================================
   SEMANA
============================================================ */
let currentWeekOffset = 0;

function renderSemana(){
  const today = new Date();
  const weekStart = addDays(startOfWeek(today), currentWeekOffset*7);
  $('#weekTitle').textContent = currentWeekOffset===0?'semana atual':currentWeekOffset<0?`${Math.abs(currentWeekOffset)} semana(s) atrás`:`${currentWeekOffset} semana(s) à frente`;

  const grid = $('#weekGrid');
  let html = '';
  // Headers
  for(let i=0;i<7;i++){
    const d = addDays(weekStart,i);
    html += `<div class="week-day-head"><div class="week-day-name">${weekNames[i]}</div><div class="week-day-date">${fmt(d)}</div></div>`;
  }
  // Colunas
  for(let i=0;i<7;i++){
    const d = addDays(weekStart,i);
    const ds = dateISO(d);
    const metas = generateMetasForDate(ds);
    const isPast = d < today && !isSameDay(d,today);
    html += '<div class="week-day-col">';
    metas.forEach(m=>{
      const cls = m.done?'done':(isPast && !m.done)?'late':m.mode;
      html += `
        <div class="week-card ${cls}">
          <div class="week-subj">${m.subjectShort}</div>
          <div class="week-topic">${m.topic}</div>
          <span class="week-mode">${m.done?'cumprido':(isPast && !m.done)?'atrasado':m.modeLabel}</span>
          <div class="week-mins">${m.mins} min</div>
        </div>
      `;
    });
    html += '</div>';
  }
  grid.innerHTML = html;
}

function isSameDay(a,b){
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

$('#weekPrev').addEventListener('click',()=>{currentWeekOffset--;renderSemana()});
$('#weekNext').addEventListener('click',()=>{currentWeekOffset++;renderSemana()});
$('#weekToday').addEventListener('click',()=>{currentWeekOffset=0;renderSemana()});

// Calendário Mensal
$('#calPrev').addEventListener('click',()=>{calOffset--;renderCalendario()});
$('#calNext').addEventListener('click',()=>{calOffset++;renderCalendario()});
$('#calToday').addEventListener('click',()=>{calOffset=0;renderCalendario()});

/* ============================================================
   POMODORO
============================================================ */
let pomoInterval = null;
let pomoRemaining = 25*60;
let pomoPhase = 'focus'; // focus | break
let pomoCycle = 1;
let pomoRunning = false;
const FOCUS_SEC = 25*60;
const BREAK_SEC = 5*60;
const LONG_BREAK_SEC = 30*60;

function renderPomodoro(){
  updatePomoDisplay();
  updatePomoStats();
}

function updatePomoDisplay(){
  const m = Math.floor(pomoRemaining/60);
  const s = pomoRemaining%60;
  $('#pomoDisplay').textContent = `${pad(m)}:${pad(s)}`;
  $('#pomoPhase').textContent = pomoPhase==='focus'?'FOCO':'PAUSA';
  $('#pomoCycle').textContent = pomoCycle;
  $('#pomoStart').innerHTML = pomoRunning
    ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg> Pausar'
    : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Iniciar';
  document.title = pomoRunning?`${pad(m)}:${pad(s)} · Mentoria AFRFB`:'Futuro Auditor — Mentoria';
}

function updatePomoStats(){
  // Reset dia se mudou
  const todayStr = dateISO(new Date());
  if(state.pomodoro.lastDate !== todayStr){
    if(state.pomodoro.lastDate){
      // sequência
      const yesterday = dateISO(addDays(new Date(),-1));
      state.pomodoro.streak = state.pomodoro.lastDate===yesterday?(state.pomodoro.streak||0)+1:1;
    } else {
      state.pomodoro.streak = 1;
    }
    state.pomodoro.today = 0;
  }
  $('#pomoToday').textContent = state.pomodoro.today;
  $('#pomoTotal').textContent = state.pomodoro.today*25 + ' min';
  $('#pomoStreak').textContent = (state.pomodoro.streak||0)+' dia'+((state.pomodoro.streak||0)!==1?'s':'');
  $('#pomoPausas').textContent = pomoPhase==='break'?'em pausa':`${pomoCycle-1} pausas feitas`;
}

$('#pomoStart').addEventListener('click',()=>{
  pomoRunning = !pomoRunning;
  if(pomoRunning){
    pomoInterval = setInterval(()=>{
      pomoRemaining--;
      if(pomoRemaining<=0){
        clearInterval(pomoInterval);
        handlePomoEnd();
        return;
      }
      updatePomoDisplay();
    },1000);
  } else {
    clearInterval(pomoInterval);
  }
  updatePomoDisplay();
});

$('#pomoReset').addEventListener('click',()=>{
  clearInterval(pomoInterval);
  pomoRunning = false;
  pomoPhase = 'focus';
  pomoCycle = 1;
  pomoRemaining = FOCUS_SEC;
  updatePomoDisplay();
  updatePomoStats();
});

$('#pomoSkip').addEventListener('click',()=>{
  clearInterval(pomoInterval);
  pomoRunning = false;
  handlePomoEnd();
});

function handlePomoEnd(){
  pomoRunning = false;
  try{
    const audio = new (window.AudioContext||window.webkitAudioContext)();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.connect(gain);gain.connect(audio.destination);
    osc.frequency.value=880;gain.gain.value=0.1;
    osc.start();setTimeout(()=>osc.stop(),400);
  }catch(e){}

  if(pomoPhase==='focus'){
    state.pomodoro.today = (state.pomodoro.today||0)+1;
    state.pomodoro.lastDate = dateISO(new Date());
    state.xp += 25;
    saveState();
    toast('🍅 Pomodoro completo! +25 XP','success');
    if(pomoCycle%4===0){
      pomoPhase = 'longbreak';
      pomoRemaining = LONG_BREAK_SEC;
    } else {
      pomoPhase = 'break';
      pomoRemaining = BREAK_SEC;
    }
  } else {
    pomoPhase = 'focus';
    pomoCycle++;
    if(pomoCycle>4) pomoCycle = 1;
    pomoRemaining = FOCUS_SEC;
    toast('⏱️ Hora de voltar ao foco!');
  }
  updatePomoDisplay();
  updatePomoStats();
  renderTopbar();
}

/* ============================================================
   QUESTÕES
============================================================ */
function renderQuestoes(){
  // Preencher select
  const sel = $('#qSubject');
  sel.innerHTML = SUBJECTS.map(s=>`<option value="${s.id}">${s.name}</option>`).join('');

  const tbody = $('#qBody');
  if(state.questions.length===0){
    tbody.innerHTML = '<tr><td colspan="6" class="q-empty">Nenhum registro ainda. Registre sua primeira sessão de questões acima! 🎯</td></tr>';
    return;
  }
  tbody.innerHTML = state.questions.slice().reverse().map((q,i)=>{
    const realIdx = state.questions.length-1-i;
    const pct = Math.round((q.hits/q.total)*100);
    const badge = pct>=80?'good':pct>=60?'ok':'bad';
    const subj = SUBJECTS.find(s=>s.id===q.subject);
    return `
      <tr>
        <td style="color:var(--ink-soft);font-size:13px">${q.date}</td>
        <td><strong>${subj?subj.name:q.subject}</strong></td>
        <td>${q.hits}</td>
        <td>${q.total}</td>
        <td><span class="badge ${badge}">${pct}%</span></td>
        <td><span class="q-del" onclick="delQuestion(${realIdx})">Excluir</span></td>
      </tr>
    `;
  }).join('');
}

$('#qAdd').addEventListener('click',()=>{
  const subj = $('#qSubject').value;
  const hits = parseInt($('#qHits').value,10);
  const total = parseInt($('#qTotal').value,10);
  if(isNaN(hits) || isNaN(total) || total<=0 || hits<0 || hits>total){
    toast('Valores inválidos. Acertos deve estar entre 0 e Total.','error');
    return;
  }
  state.questions.push({
    date: fmt(new Date()),
    subject: subj,
    hits, total,
  });
  state.xp += total*2;
  saveState();
  $('#qHits').value='';
  $('#qTotal').value='';
  toast(`+${total*2} XP pela sessão registrada!`,'success');
  renderQuestoes();
  renderTopbar();
  renderHome();
});

function delQuestion(i){
  if(!confirm('Excluir este registro?')) return;
  state.questions.splice(i,1);
  saveState();
  renderQuestoes();
  renderHome();
}
window.delQuestion = delQuestion;

/* ============================================================
   DESEMPENHO
============================================================ */
let charts = {};
function renderDesempenho(){
  // Destrói charts antigos
  Object.values(charts).forEach(c=>c && c.destroy());
  charts = {};

  // Horas por dia (últimos 14 dias)
  const labels = [];
  const dataHours = [];
  for(let i=13;i>=0;i--){
    const d = addDays(new Date(),-i);
    labels.push(pad(d.getDate())+'/'+pad(d.getMonth()+1));
    const ds = dateISO(d);
    const metas = generateMetasForDate(ds);
    const doneMin = metas.filter(m=>m.done).reduce((a,b)=>a+b.mins,0);
    dataHours.push(+(doneMin/60).toFixed(1));
  }
  charts.hours = new Chart($('#chartHours'),{
    type:'bar',
    data:{labels,datasets:[{label:'Horas de estudo',data:dataHours,backgroundColor:'#C9A961',borderRadius:6}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#F0ECE3'}},x:{grid:{display:false}}}}
  });

  // Acertos por matéria
  const subjLabels = [];
  const subjAccuracy = [];
  SUBJECTS.forEach(s=>{
    const qs = state.questions.filter(q=>q.subject===s.id);
    if(qs.length>0){
      const total = qs.reduce((a,b)=>a+b.total,0);
      const hits = qs.reduce((a,b)=>a+b.hits,0);
      subjLabels.push(s.short);
      subjAccuracy.push(Math.round((hits/total)*100));
    }
  });
  if(subjLabels.length===0){
    subjLabels.push(...SUBJECTS.slice(0,5).map(s=>s.short));
    subjAccuracy.push(85,72,80,78,88);
  }
  charts.accuracy = new Chart($('#chartAccuracy'),{
    type:'bar',
    data:{labels:subjLabels,datasets:[{label:'% acertos',data:subjAccuracy,backgroundColor:subjAccuracy.map(v=>v>=80?'#3BA776':v>=60?'#D97706':'#B83A3A'),borderRadius:6}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,max:100,grid:{color:'#F0ECE3'}},y:{grid:{display:false}}}}
  });

  // Distribuição (pie)
  charts.pie = new Chart($('#chartPie'),{
    type:'doughnut',
    data:{
      labels: SUBJECTS.map(s=>s.short),
      datasets:[{
        data: SUBJECTS.map((s,i)=>15-i),
        backgroundColor: SUBJECTS.map(s=>s.color),
        borderWidth:2,borderColor:'#fff',
      }]
    },
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{font:{size:11}}}}}
  });

  // Progresso (linha)
  const progLabels = [];
  const progData = [];
  for(let i=11;i>=0;i--){
    const d = addDays(new Date(),-i*7);
    progLabels.push(pad(d.getDate())+'/'+pad(d.getMonth()+1));
    progData.push(+(3.15 - i*0.25).toFixed(2));
  }
  charts.progress = new Chart($('#chartProgress'),{
    type:'line',
    data:{labels:progLabels,datasets:[{label:'Progresso %',data:progData,borderColor:'#2E86AB',backgroundColor:'rgba(46,134,171,.1)',fill:true,tension:.3,borderWidth:3,pointBackgroundColor:'#2E86AB',pointRadius:4}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:'#F0ECE3'}},x:{grid:{display:false}}}}
  });
}

/* ============================================================
   MATÉRIAS
============================================================ */
/* ============================================================
   MATÉRIAS — CARDS EXPANSÍVEIS COM TÓPICOS
============================================================ */
let expandedSubj = null; // id da matéria expandida

function renderMaterias(){
  const grid = $('#subjGrid');
  grid.innerHTML = SUBJECTS.map(s=>{
    const done = (state.editalProgress[s.id] || []).filter(Boolean).length;
    const total = s.topics.length;
    const pct = total===0?0:Math.round((done/total)*100);
    const acc = getSubjectAccuracy(s.id);
    const isExpanded = expandedSubj === s.id;
    const editaisTags = (s.editais || []).map(e=>{
      const color = e==='AFRFB'?'#B83A3A':e==='TCU'?'#7A3E3E':'#1B5E7F';
      return `<span class="subj-edital-tag" style="background:${color}">${e}</span>`;
    }).join('');

    let topicsHtml = '';
    if(isExpanded){
      const prog = state.editalProgress[s.id] || s.topics.map(()=>false);
      topicsHtml = `
        <div class="subj-topics-list">
          ${s.topics.map((t,idx)=>`
            <div class="subj-topic-item ${prog[idx]?'done':''}">
              <input type="checkbox" id="st-${s.id}-${idx}" ${prog[idx]?'checked':''} onchange="toggleTopic('${s.id}',${idx})">
              <label for="st-${s.id}-${idx}">${t}</label>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <div class="subj-card ${isExpanded?'expanded':''}" style="border-left:4px solid ${s.color}" onclick="toggleSubjectExpand('${s.id}',event)">
        <div class="subj-card-head">
          <div class="subj-card-info">
            <div class="subj-name">${s.name}</div>
            <div class="subj-sub">${total} tópicos · ${done} concluídos</div>
            <div class="subj-editais">${editaisTags}</div>
          </div>
          <div class="subj-card-expand">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
        <div class="subj-progress" style="margin-top:12px"><div class="subj-fill" style="width:${pct}%;background:${s.color}"></div></div>
        <div class="subj-stats">
          <span>Progresso: <strong>${pct}%</strong></span>
          <span>Acertos: <strong>${acc===0?'—':acc+'%'}</strong></span>
        </div>
        ${topicsHtml}
      </div>
    `;
  }).join('');
}

function toggleSubjectExpand(subjId, e){
  // Se clicou dentro da lista de tópicos (checkbox/label), não fecha
  if(e && e.target && (e.target.closest('.subj-topics-list'))) return;
  expandedSubj = expandedSubj === subjId ? null : subjId;
  renderMaterias();
}
window.toggleSubjectExpand = toggleSubjectExpand;

/* ============================================================
   EDITAL
============================================================ */
function renderEdital(){
  const list = $('#editalList');
  list.innerHTML = SUBJECTS.map((s,i)=>{
    const progress = state.editalProgress[s.id] || s.topics.map(()=>false);
    const done = progress.filter(Boolean).length;
    const total = s.topics.length;
    return `
      <div class="subj-accordion" data-subj="${s.id}">
        <div class="subj-head" onclick="toggleAccordion('${s.id}')">
          <div>
            <h4>${s.name} <span class="subj-count">${done}/${total} tópicos</span></h4>
          </div>
          <div class="subj-toggle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg></div>
        </div>
        <div class="subj-body">
          <div class="subj-body-inner">
            ${s.topics.map((t,idx)=>`
              <div class="topic-row ${progress[idx]?'done':''}">
                <label style="display:flex;align-items:center;gap:10px;cursor:pointer;flex:1;padding-left:26px">
                  <input type="checkbox" ${progress[idx]?'checked':''} onchange="toggleTopic('${s.id}',${idx})">
                  ${t}
                </label>
                <span class="topic-status ${progress[idx]?'done':''}">${progress[idx]?'✓ concluído':'pendente'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleAccordion(subjId){
  const el = document.querySelector(`.subj-accordion[data-subj="${subjId}"]`);
  if(el) el.classList.toggle('open');
}
window.toggleAccordion = toggleAccordion;

function toggleTopic(subjId,idx){
  const subj = SUBJECTS.find(s=>s.id===subjId);
  if(!state.editalProgress[subjId]) state.editalProgress[subjId] = subj.topics.map(()=>false);
  state.editalProgress[subjId][idx] = !state.editalProgress[subjId][idx];
  if(state.editalProgress[subjId][idx]) state.xp += 10;
  saveState();
  renderEdital();
  renderTopbar();
  renderHome();
}
window.toggleTopic = toggleTopic;

/* ============================================================
   MEU PLANO — TODAS AS SUB-ABAS
============================================================ */
function renderPlano(){
  // Event listeners para trocar sub-abas
  $$('.plano-tab').forEach(tab=>{
    tab.onclick = ()=>{
      $$('.plano-tab').forEach(t=>t.classList.remove('active'));
      $$('.plano-panel').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      const panelId = 'panel-'+tab.dataset.panel;
      const panel = $('#'+panelId);
      if(panel) panel.classList.add('active');
    };
  });
  renderHorarios();
  renderReplanejar();
  renderDataFinal();
  renderPausar();
}

/* ---------- HORÁRIOS ---------- */
function renderHorarios(){
  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const list = $('#horariosList');
  list.innerHTML = dias.map((dia,i)=>{
    const h = state.horarios[i] || 0;
    const pct = Math.round((h/12)*100);
    return `
      <div class="horario-item">
        <div class="horario-day">${dia}</div>
        <div class="horario-slider-wrap">
          <input type="range" class="horario-slider" min="0" max="12" step="0.5" value="${h}" data-day="${i}" style="--val:${pct}%">
        </div>
        <div class="horario-value ${h===0?'zero':''}" id="hval-${i}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          ${h.toString().replace('.',',')}h
        </div>
      </div>
    `;
  }).join('');

  $$('.horario-slider').forEach(slider=>{
    slider.oninput = ()=>{
      const day = parseInt(slider.dataset.day,10);
      const val = parseFloat(slider.value);
      state.horarios[day] = val;
      const pct = Math.round((val/12)*100);
      slider.style.setProperty('--val',pct+'%');
      const valEl = $('#hval-'+day);
      valEl.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> ${val.toString().replace('.',',')}h`;
      valEl.classList.toggle('zero',val===0);
      updateTotalHorarios();
    };
  });
  updateTotalHorarios();
}

function updateTotalHorarios(){
  let total = 0;
  for(let i=0;i<7;i++) total += state.horarios[i] || 0;
  $('#totalSemanal').textContent = total.toString().replace('.',',')+'h';
  $('#mediaDiaria').textContent = (total/7).toFixed(1).replace('.',',')+'h';
}

$('#btnSalvarHorarios').addEventListener('click',()=>{
  // Limpa metas futuras para regenerar com novos horários
  const hoje = dateISO(new Date());
  Object.keys(state.metas).forEach(d=>{
    if(d >= hoje){
      // Remove metas não concluídas do futuro para regenerar
      const temConcluida = state.metas[d].some(m=>m.done);
      if(!temConcluida) delete state.metas[d];
    }
  });
  saveState();
  toast('✓ Horários salvos! As metas dos próximos dias serão recalculadas.','success');
  renderMetas();
});

$('#btnResetHorarios').addEventListener('click',()=>{
  openConfirmModal('Restaurar horários padrão?','Isso vai definir 5h de segunda a sexta e 7h no fim de semana.',()=>{
    state.horarios = {0:7, 1:5, 2:5, 3:5, 4:5, 5:7, 6:7};
    saveState();
    renderHorarios();
    toast('Horários restaurados ao padrão','success');
  });
});

/* ---------- REPLANEJAR ATRASOS ---------- */
function renderReplanejar(){
  const hoje = dateISO(new Date());
  const atrasadas = [];
  Object.keys(state.metas).forEach(d=>{
    if(d < hoje){
      state.metas[d].forEach((m,idx)=>{
        if(!m.done){
          atrasadas.push({data:d, idx, meta:m});
        }
      });
    }
  });

  const list = $('#replanList');
  const actions = $('#replanActions');

  if(atrasadas.length === 0){
    list.innerHTML = `
      <div class="empty-state">
        <span class="emoji">🎯</span>
        <h3>Você está em dia!</h3>
        <p>Nenhuma meta atrasada no momento. Continue assim!</p>
      </div>
    `;
    actions.style.display = 'none';
    return;
  }

  list.innerHTML = atrasadas.map(a=>{
    const d = new Date(a.data+'T12:00:00');
    return `
      <div class="replan-meta-item">
        <div class="replan-info">
          <div class="replan-subj">${a.meta.subjectShort} — ${a.meta.modeLabel}</div>
          <div class="replan-topic">${a.meta.topic}</div>
          <span class="replan-meta-tag">⚠ atrasada desde ${fmt(d)} · ${a.meta.mins} min</span>
        </div>
        <button class="btn btn-success" onclick="markLateDone('${a.data}',${a.idx})">✓ Concluir</button>
      </div>
    `;
  }).join('');

  actions.style.display = 'flex';
}

function markLateDone(dateStr, idx){
  state.metas[dateStr][idx].done = true;
  state.xp += 30;
  saveState();
  toast('Meta atrasada concluída! +30 XP','success');
  renderReplanejar();
  renderTopbar();
}
window.markLateDone = markLateDone;

$('#btnReplanejar').addEventListener('click',()=>{
  openConfirmModal('Replanejar todas as atrasadas?','As metas atrasadas serão redistribuídas automaticamente nos próximos dias disponíveis.',()=>{
    const hoje = dateISO(new Date());
    const atrasadas = [];
    Object.keys(state.metas).forEach(d=>{
      if(d < hoje){
        const pend = state.metas[d].filter(m=>!m.done);
        atrasadas.push(...pend);
        state.metas[d] = state.metas[d].filter(m=>m.done);
      }
    });

    // Adiciona nas metas dos próximos dias
    let i = 0;
    let adicionadas = 0;
    while(atrasadas.length > 0 && i < 60){
      const targetDate = dateISO(addDays(new Date(),i));
      const dow = new Date(targetDate+'T12:00:00').getDay();
      const capacidade = (state.horarios[dow] || 0) * 60;
      let metasDia = generateMetasForDate(targetDate);
      let minAtuais = metasDia.reduce((a,b)=>a+b.mins,0);

      while(atrasadas.length > 0 && minAtuais + atrasadas[0].mins <= capacidade + 30){
        const meta = atrasadas.shift();
        meta.id = targetDate+'-replan-'+adicionadas;
        metasDia.push(meta);
        minAtuais += meta.mins;
        adicionadas++;
      }
      state.metas[targetDate] = metasDia;
      i++;
    }
    saveState();
    toast(`✓ ${adicionadas} metas redistribuídas!`,'success');
    renderReplanejar();
    renderMetas();
  });
});

$('#btnMarcarAtrasoFeito').addEventListener('click',()=>{
  openConfirmModal('Marcar todas as atrasadas como concluídas?','Isso vai marcar todas as metas atrasadas como feitas. Use com cuidado.',()=>{
    const hoje = dateISO(new Date());
    let count = 0;
    Object.keys(state.metas).forEach(d=>{
      if(d < hoje){
        state.metas[d].forEach(m=>{
          if(!m.done){m.done = true; count++}
        });
      }
    });
    state.xp += count*20;
    saveState();
    toast(`${count} metas marcadas como concluídas! +${count*20} XP`,'success');
    renderReplanejar();
    renderTopbar();
  });
});

/* ---------- DATA FINAL ---------- */
function renderDataFinal(){
  $('#dataFinal').value = state.dataFinal || '2026-10-25';
  $('#dataConcurso').value = state.dataConcurso || '';
}

$('#btnSalvarDatas').addEventListener('click',()=>{
  state.dataFinal = $('#dataFinal').value;
  state.dataConcurso = $('#dataConcurso').value;
  saveState();
  // Atualiza ecos na home e metas
  const [y,m,d] = state.dataFinal.split('-');
  const formatted = `${d}/${m}/${y}`;
  $('#heroEnd').textContent = formatted;
  $('#endDate').textContent = formatted;
  toast('✓ Datas atualizadas!','success');
});

/* ---------- PAUSAR ---------- */
function renderPausar(){
  if(state.pausa){
    const inicio = new Date(state.pausa.inicio+'T12:00:00');
    const fim = new Date(state.pausa.fim+'T12:00:00');
    $('#pausaAtiva').style.display = 'block';
    $('#pausaInfoText').textContent = `de ${fmt(inicio)} até ${fmt(fim)}`;
    $('#btnCancelarPausa').style.display = 'inline-flex';
    $('#btnPausar').style.display = 'none';
  } else {
    $('#pausaAtiva').style.display = 'none';
    $('#btnCancelarPausa').style.display = 'none';
    $('#btnPausar').style.display = 'inline-flex';
  }
}

$('#btnPausar').addEventListener('click',()=>{
  const inicio = $('#pausaInicio').value;
  const fim = $('#pausaFim').value;
  if(!inicio || !fim){
    toast('Preencha as duas datas para pausar','error');
    return;
  }
  if(fim < inicio){
    toast('A data de retorno deve ser depois da data de início','error');
    return;
  }
  state.pausa = {inicio, fim};
  // Remove metas não concluídas no período
  Object.keys(state.metas).forEach(d=>{
    if(d >= inicio && d <= fim){
      state.metas[d] = state.metas[d].filter(m=>m.done);
    }
  });
  saveState();
  toast('⏸️ Plano pausado com sucesso','success');
  renderPausar();
});

$('#btnCancelarPausa').addEventListener('click',()=>{
  openConfirmModal('Cancelar pausa?','As metas voltarão a ser geradas normalmente.',()=>{
    state.pausa = null;
    saveState();
    toast('▶️ Plano retomado','success');
    renderPausar();
  });
});

/* ---------- REINICIAR ---------- */
$('#btnReiniciar').addEventListener('click',()=>{
  openConfirmModal('Reiniciar plano do zero?','⚠️ Esta ação é IRREVERSÍVEL. Todos os dados serão apagados e o plano recomeçará a partir de HOJE. Considere exportar o backup antes.',()=>{
    // Dupla confirmação
    openConfirmModal('TEM CERTEZA ABSOLUTA?','Esta é sua última chance. Todos os dados serão apagados permanentemente e as metas serão regeneradas a partir de hoje.',()=>{
      // Calcula nova data final: 18 meses à frente da data atual
      const hoje = new Date();
      const novoFim = new Date(hoje);
      novoFim.setMonth(novoFim.getMonth() + 18);
      const novoFimISO = dateISO(novoFim);

      // Preserva apenas os horários atuais configurados
      const horariosAtuais = {...state.horarios};

      // Zera TUDO e substitui o objeto state por completo
      const novoEstado = {
        metas: {},
        questions: [],
        editalProgress: {},
        pomodoro: {today:0,total:0,lastDate:null,streak:0},
        heroHours: 0,
        heroCron: 0,
        heroDays: 0,
        heroProgress: 0,
        xp: 0,
        hoursByDay: [],
        horarios: horariosAtuais,
        dataInicio: dateISO(hoje),
        dataFinal: novoFimISO,
        dataConcurso: '',
        pausa: null,
        assuntosConcluidos: {},
      };
      // Substitui todas as chaves do state
      Object.keys(state).forEach(k=>delete state[k]);
      Object.assign(state, novoEstado);

      saveState();

      // Atualiza labels visuais
      const [y,m,d] = novoFimISO.split('-');
      const formatted = `${d}/${m}/${y}`;
      if($('#heroEnd')) $('#heroEnd').textContent = formatted;
      if($('#endDate')) $('#endDate').textContent = formatted;

      toast('🔄 Plano reiniciado do zero! Contagem começa HOJE.','success');
      setTimeout(()=>{navigate('home')},800);
    });
  });
});

$('#btnExportar').addEventListener('click',()=>{
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mentoria-backup-${dateISO(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('💾 Backup exportado!','success');
});

$('#importFile').addEventListener('change',(e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    try{
      const imported = JSON.parse(ev.target.result);
      openConfirmModal('Importar backup?','Seus dados atuais serão SUBSTITUÍDOS pelos dados do arquivo.',()=>{
        Object.assign(state, imported);
        saveState();
        toast('📥 Backup importado com sucesso!','success');
        setTimeout(()=>{navigate('home')},800);
      });
    } catch(err){
      toast('Arquivo inválido','error');
    }
  };
  reader.readAsText(file);
});

/* ============================================================
   MODAL DE CONFIRMAÇÃO GENÉRICO
============================================================ */
function openConfirmModal(title, body, onConfirm){
  $('#modalTitle').textContent = title;
  $('#modalBody').textContent = body;
  $('#modalBg').classList.add('show');
  $('#modalOk').onclick = ()=>{
    $('#modalBg').classList.remove('show');
    onConfirm();
  };
  $('#modalCancel').onclick = ()=>{
    $('#modalBg').classList.remove('show');
  };
}
// Fecha modal ao clicar no backdrop
$('#modalBg').addEventListener('click',(e)=>{
  if(e.target === $('#modalBg')) $('#modalBg').classList.remove('show');
});

/* ============================================================
   HANDLERS DO MODAL DE META
============================================================ */
$('#modalMetaClose').addEventListener('click', closeMetaModal);
$('#modalMetaBg').addEventListener('click',(e)=>{
  if(e.target === $('#modalMetaBg')) closeMetaModal();
});
$('#choiceMoreTime').addEventListener('click',()=>confirmMetaCompletion(false));
$('#choiceFinished').addEventListener('click',()=>confirmMetaCompletion(true));


document.addEventListener('DOMContentLoaded',()=>{
  // Atualiza topbar a cada 60s (render inicial acontece após login via enterApp)
  setInterval(()=>{if(currentUser) renderTopbar();},60000);
});
