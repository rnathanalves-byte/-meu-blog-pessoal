// ===== CONFIGURAÇÃO FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyBclnyLKhMWoeviT7xRB1QM0iNCUmGaOsY",
  authDomain: "meu-blog-nathan.firebaseapp.com",
  projectId: "meu-blog-nathan",
  storageBucket: "meu-blog-nathan.firebasestorage.app",
  messagingSenderId: "27310750879",
  appId: "1:27310750879:web:f6aeae60ed7425def5b6aa"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let posts = [];
let ordenacao = "recente";
let mesSelecionado = null;
let termoPesquisa = "";

function stripHtml(html) {
  let tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function extrairMesAno(dataString) {
  let partes = dataString.split(",")[0].split("/");
  if (partes.length === 3) {
    return partes[1] + "/" + partes[2];
  }
  return null;
}

function formatarMes(mesAno) {
  let [mes, ano] = mesAno.split("/");
  let meses = ["", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
               "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return meses[parseInt(mes)] + " de " + ano;
}

function construirMesesDisponiveis() {
  let mesesMap = {};
  
  posts.forEach((post) => {
    let mesAno = extrairMesAno(post.data);
    if (mesAno) {
      if (!mesesMap[mesAno]) {
        mesesMap[mesAno] = 0;
      }
      mesesMap[mesAno]++;
    }
  });
  
  let mesesOrdenados = Object.keys(mesesMap).sort((a, b) => {
    let [mesA, anoA] = a.split("/");
    let [mesB, anoB] = b.split("/");
    if (anoA !== anoB) return anoB - anoA;
    return mesB - mesA;
  });
  
  return { mesesMap, mesesOrdenados };
}

function renderizarMeses() {
  let container = document.getElementById("meses-container");
  if (!container) return;
  
  let { mesesMap, mesesOrdenados } = construirMesesDisponiveis();
  
  if (mesesOrdenados.length === 0) {
    container.innerHTML = `<p style="font-size:0.8rem; color:#999;">Nenhum post publicado</p>`;
    return;
  }
  
  let html = `<button class="month-btn ${mesSelecionado === null ? 'active' : ''}" onclick="filtrarPorMes(null)">
    Todos os posts <span class="month-count">(${posts.length})</span>
  </button>`;
  
  mesesOrdenados.forEach((mesAno) => {
    let isActive = mesSelecionado === mesAno ? 'active' : '';
    html += `<button class="month-btn ${isActive}" onclick="filtrarPorMes('${mesAno}')">
      ${formatarMes(mesAno)} <span class="month-count">(${mesesMap[mesAno]})</span>
    </button>`;
  });
  
  container.innerHTML = html;
}

function filtrarPorMes(mesAno) {
  mesSelecionado = mesAno;
  termoPesquisa = "";
  document.getElementById("pesquisa").value = "";
  renderizarMeses();
  mostrarPosts();
}

function ordenarPosts(tipo) {
  ordenacao = tipo;
  
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  event.target.classList.add("active");
  
  mostrarPosts();
}

function filtrarPosts() {
  termoPesquisa = document.getElementById("pesquisa").value.toLowerCase();
  mesSelecionado = null;
  renderizarMeses();
  mostrarPosts();
}

function obterPostsFiltrados() {
  let postsFiltrados = [...posts];
  
  if (mesSelecionado) {
    postsFiltrados = postsFiltrados.filter(post => {
      let mesAno = extrairMesAno(post.data);
      return mesAno === mesSelecionado;
    });
  }
  
  if (termoPesquisa) {
    postsFiltrados = postsFiltrados.filter(post => {
      let titulo = post.titulo.toLowerCase();
      let conteudo = stripHtml(post.conteudo).toLowerCase();
      return titulo.includes(termoPesquisa) || conteudo.includes(termoPesquisa);
    });
  }
  
  if (ordenacao === "recente") {
    postsFiltrados.reverse();
  }
  
  return postsFiltrados;
}

function mostrarPosts() {
  let container = document.getElementById("posts");
  let postsFiltrados = obterPostsFiltrados();
  
  if (postsFiltrados.length === 0) {
    let mensagem = termoPesquisa 
      ? `Nenhum post encontrado para "${termoPesquisa}"`
      : mesSelecionado
      ? `Nenhum post publicado em ${formatarMes(mesSelecionado)}`
      : "Nenhum post publicado ainda.";
    
    container.innerHTML = `
      <div class="empty-state">
        <p>${mensagem}</p>
        ${termoPesquisa || mesSelecionado ? `<p style="margin-top:10px; font-size:0.82rem;">
          <a href="javascript:void(0)" onclick="limparFiltros()" style="color:inherit; text-decoration:underline;">Limpar filtros</a>
        </p>` : ''}
      </div>
    `;
    return;
  }
  
  let html = "";
  postsFiltrados.forEach((post) => {
    let textoLimpo = stripHtml(post.conteudo);
    let resumo = textoLimpo.length > 200 ? textoLimpo.substring(0, 200) + "…" : textoLimpo;
    
    html += `
      <article class="post-card">
        <h2><a href="post.html?id=${post.id}">${post.titulo}</a></h2>
        <div class="post-meta">${post.data}</div>
        <p class="post-excerpt">${resumo}</p>
        <a href="post.html?id=${post.id}" class="read-more">Ler mais &rarr;</a>
      </article>
    `;
  });
  
  container.innerHTML = html;
}

function limparFiltros() {
  termoPesquisa = "";
  mesSelecionado = null;
  document.getElementById("pesquisa").value = "";
  renderizarMeses();
  mostrarPosts();
}

// Inicializar
document.addEventListener("DOMContentLoaded", function() {
  db.collection("posts").orderBy("data", "desc").onSnapshot((snapshot) => {
    posts = [];
    snapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    renderizarMeses();
    mostrarPosts();
  });
});
