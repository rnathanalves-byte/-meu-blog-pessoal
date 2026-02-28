let posts = JSON.parse(localStorage.getItem("posts")) || [];
let comentarios = JSON.parse(localStorage.getItem("comentarios")) || {};

let params = new URLSearchParams(window.location.search);
let id = parseInt(params.get("id"), 10);
let post = posts[id];

function stripHtml(html) {
  let tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function renderizarComentarios() {
  let container = document.getElementById("comentarios-container");
  if (!container) return;

  let postComentarios = comentarios[id] || [];
  
  if (postComentarios.length === 0) {
    container.innerHTML = `<p style="color:#999; font-style:italic;">Nenhum comentário ainda. Seja o primeiro a comentar!</p>`;
    return;
  }

  let html = "";
  postComentarios.forEach((com, idx) => {
    let respostasHtml = "";
    if (com.respostas && com.respostas.length > 0) {
      com.respostas.forEach((resp, respIdx) => {
        respostasHtml += `
          <div class="comentario-resposta">
            <div class="comentario-header">
              <strong>${resp.autor}</strong>
              <span class="comentario-data">${resp.data}</span>
              <span class="badge-autor">Autor</span>
            </div>
            <div class="comentario-texto">${resp.texto}</div>
          </div>
        `;
      });
    }

    html += `
      <div class="comentario">
        <div class="comentario-header">
          <strong>${com.autor}</strong>
          <span class="comentario-data">${com.data}</span>
        </div>
        <div class="comentario-texto">${com.texto}</div>
        ${respostasHtml}
        <button class="btn-responder" onclick="mostrarFormResposta(${idx})">Responder</button>
        <div id="form-resposta-${idx}" class="form-resposta" style="display:none; margin-top:12px;">
          <textarea id="textarea-resposta-${idx}" placeholder="Sua resposta..." style="width:100%; padding:10px; font-family:monospace; border:1px solid #ddd; border-radius:4px; min-height:80px;"></textarea>
          <div style="margin-top:8px;">
            <button class="btn btn-sm" onclick="enviarResposta(${id}, ${idx})">Enviar</button>
            <button class="btn btn-outline btn-sm" onclick="ocultarFormResposta(${idx})">Cancelar</button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function mostrarFormResposta(idx) {
  document.getElementById(`form-resposta-${idx}`).style.display = "block";
  document.getElementById(`textarea-resposta-${idx}`).focus();
}

function ocultarFormResposta(idx) {
  document.getElementById(`form-resposta-${idx}`).style.display = "none";
}

function enviarResposta(postId, comentarioIdx) {
  let textarea = document.getElementById(`textarea-resposta-${comentarioIdx}`);
  let texto = textarea.value.trim();
  
  if (!texto) {
    alert("Digite uma resposta!");
    return;
  }

  if (!comentarios[postId]) comentarios[postId] = [];
  if (!comentarios[postId][comentarioIdx].respostas) comentarios[postId][comentarioIdx].respostas = [];

  let data = new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  comentarios[postId][comentarioIdx].respostas.push({
    autor: "Autor do Blog",
    texto: texto,
    data: data
  });

  localStorage.setItem("comentarios", JSON.stringify(comentarios));
  ocultarFormResposta(comentarioIdx);
  renderizarComentarios();
}

function adicionarComentario() {
  let nomeInput = document.getElementById("comentario-nome");
  let emailInput = document.getElementById("comentario-email");
  let textoInput = document.getElementById("comentario-texto");

  let nome = nomeInput.value.trim();
  let email = emailInput.value.trim();
  let texto = textoInput.value.trim();

  if (!nome || !email || !texto) {
    alert("Preencha todos os campos!");
    return;
  }

  if (!comentarios[id]) comentarios[id] = [];

  let data = new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  comentarios[id].push({
    autor: nome,
    email: email,
    texto: texto,
    data: data,
    respostas: []
  });

  localStorage.setItem("comentarios", JSON.stringify(comentarios));
  nomeInput.value = "";
  emailInput.value = "";
  textoInput.value = "";
  renderizarComentarios();
}

if (post) {
  document.title = post.titulo + " — Meu Blog";

  document.getElementById("post").innerHTML = `
    <article class="post-full">
      <h1>${post.titulo}</h1>
      <div class="post-meta">${post.data}</div>
      <div class="post-content">${post.conteudo}</div>
      
      <hr style="margin:40px 0; border:none; border-top:1px solid #ddd;">
      
      <section class="comentarios-section">
        <h2>Comentários</h2>
        <div id="comentarios-container"></div>
        
        <div class="form-comentario">
          <h3>Deixe seu comentário</h3>
          <input type="text" id="comentario-nome" placeholder="Seu nome" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px; font-family:monospace;">
          <input type="email" id="comentario-email" placeholder="Seu email (não será publicado)" style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px; font-family:monospace;">
          <textarea id="comentario-texto" placeholder="Seu comentário..." style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ddd; border-radius:4px; font-family:monospace; min-height:100px;"></textarea>
          <button class="btn" onclick="adicionarComentario()">Publicar Comentário</button>
        </div>
      </section>
    </article>
  `;
  
  renderizarComentarios();
} else {
  document.getElementById("post").innerHTML = `
    <article class="post-full">
      <h1>Post não encontrado</h1>
      <p style="margin-top:16px; color:#666;">
        O post que você está procurando não existe ou foi removido.
      </p>
      <a href="index.html" class="back-link" style="margin-top:20px;">&larr; Voltar ao início</a>
    </article>
  `;
}
