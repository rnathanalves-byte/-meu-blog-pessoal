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

// ===== CONFIGURAÇÃO =====
const SENHA_CORRETA = "T9$vQ8#Lm2@Xr5!K";

let posts = [];
let comentarios = {};
let editando = null;

// ===== LOGIN =====
function verificarSenha() {
  let senha = document.getElementById("senha").value;
  if (senha === SENHA_CORRETA) {
    document.getElementById("login").style.display = "none";
    document.getElementById("painel").style.display = "block";
    carregarLista();
  } else {
    document.getElementById("erro-login").style.display = "block";
    document.getElementById("senha").value = "";
    document.getElementById("senha").focus();
  }
}

// Permitir Enter no campo de senha
document.addEventListener("DOMContentLoaded", function () {
  let senhaInput = document.getElementById("senha");
  if (senhaInput) {
    senhaInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") verificarSenha();
    });
  }
});

function sair() {
  document.getElementById("painel").style.display = "none";
  document.getElementById("login").style.display = "block";
  document.getElementById("senha").value = "";
}

// ===== FORMATAÇÃO =====
function formatar(comando, valor = null) {
  document.getElementById("conteudo").focus();
  document.execCommand(comando, false, valor);
}

function mudarCor(cor) {
  document.getElementById("conteudo").focus();
  document.execCommand("foreColor", false, cor);
}

function mudarTamanho(tamanho) {
  if (!tamanho) return;
  document.getElementById("conteudo").focus();
  document.execCommand("fontSize", false, tamanho);
}

function limparFormatacao() {
  document.getElementById("conteudo").focus();
  document.execCommand("removeFormat", false, null);
}

// ===== UPLOAD E REDIMENSIONAMENTO DE IMAGEM =====
function uploadImagem(event) {
  let file = event.target.files[0];
  if (!file) return;

  let reader = new FileReader();
  reader.onload = function (e) {
    inserirImagemRedimensionavel(e.target.result);
  };
  reader.readAsDataURL(file);

  event.target.value = "";
}

function inserirImagemRedimensionavel(src) {
  let editor = document.getElementById("conteudo");
  editor.focus();

  let wrapper = document.createElement("div");
  wrapper.className = "img-wrapper";
  wrapper.contentEditable = "false";

  let img = document.createElement("img");
  img.src = src;
  img.style.width = "240px";
  img.style.height = "auto";
  img.draggable = false;

  let deleteBtn = document.createElement("span");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = "&times;";
  deleteBtn.title = "Remover imagem";
  deleteBtn.addEventListener("mousedown", function (e) {
    e.preventDefault();
    e.stopPropagation();
    wrapper.remove();
  });

  let handle = document.createElement("span");
  handle.className = "resize-handle";
  handle.title = "Arraste para redimensionar";

  let isResizing = false;
  let startX, startY, startWidth, startHeight;

  handle.addEventListener("mousedown", function (e) {
    e.preventDefault();
    e.stopPropagation();

    isResizing = true;
    startX = e.clientX;
    startY = e.clientY;
    startWidth = img.offsetWidth;
    startHeight = img.offsetHeight;

    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", function onMouseMove(e) {
    if (!isResizing) return;

    let dx = e.clientX - startX;
    let novaLargura = Math.max(60, startWidth + dx);

    let proporcao = startHeight / startWidth;
    let novaAltura = novaLargura * proporcao;

    img.style.width = novaLargura + "px";
    img.style.height = novaAltura + "px";
  });

  document.addEventListener("mouseup", function onMouseUp() {
    if (!isResizing) return;
    isResizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });

  handle.addEventListener("touchstart", function (e) {
    e.preventDefault();
    isResizing = true;
    let touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startWidth = img.offsetWidth;
    startHeight = img.offsetHeight;
  }, { passive: false });

  document.addEventListener("touchmove", function (e) {
    if (!isResizing) return;
    let touch = e.touches[0];
    let dx = touch.clientX - startX;
    let novaLargura = Math.max(60, startWidth + dx);
    let proporcao = startHeight / startWidth;
    img.style.width = novaLargura + "px";
    img.style.height = (novaLargura * proporcao) + "px";
  });

  document.addEventListener("touchend", function () {
    isResizing = false;
  });

  wrapper.appendChild(img);
  wrapper.appendChild(deleteBtn);
  wrapper.appendChild(handle);

  let selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    let range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(wrapper);
      range.setStartAfter(wrapper);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
  }
  editor.appendChild(wrapper);
}

// ===== PUBLICAR POST =====
async function publicarPost() {
  let titulo = document.getElementById("titulo").value.trim();
  let conteudo = document.getElementById("conteudo").innerHTML.trim();

  if (!titulo || !conteudo || conteudo === "<br>") {
    alert("Preencha o título e o conteúdo antes de salvar.");
    return;
  }

  let data = new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  try {
    if (editando !== null) {
      // Editar post existente
      await db.collection("posts").doc(posts[editando].id).update({
        titulo: titulo,
        conteudo: conteudo,
        editadoEm: data
      });
    } else {
      // Criar novo post
      await db.collection("posts").add({
        titulo: titulo,
        conteudo: conteudo,
        data: data,
        editadoEm: null
      });
    }
    
    limparEditor();
    carregarLista();
  } catch (error) {
    console.error("Erro ao salvar post:", error);
    alert("Erro ao salvar o post. Tente novamente.");
  }
}

// ===== EDITAR POST =====
function editarPost(index) {
  editando = index;
  document.getElementById("titulo").value = posts[index].titulo;
  document.getElementById("conteudo").innerHTML = posts[index].conteudo;
  document.getElementById("editando-badge").style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ===== EXCLUIR POST =====
async function excluirPost(index) {
  if (!confirm(`Excluir o post "${posts[index].titulo}"? Esta ação não pode ser desfeita.`)) return;
  
  try {
    await db.collection("posts").doc(posts[index].id).delete();
    if (editando === index) limparEditor();
    carregarLista();
  } catch (error) {
    console.error("Erro ao excluir post:", error);
    alert("Erro ao excluir o post.");
  }
}

// ===== LIMPAR EDITOR =====
function limparEditor() {
  editando = null;
  document.getElementById("titulo").value = "";
  document.getElementById("conteudo").innerHTML = "";
  document.getElementById("editando-badge").style.display = "none";
}

// ===== CARREGAR LISTA =====
function carregarLista() {
  db.collection("posts").orderBy("data", "desc").onSnapshot((snapshot) => {
    posts = [];
    snapshot.forEach((doc) => {
      posts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    let container = document.getElementById("lista");

    if (posts.length === 0) {
      container.innerHTML = `<p style="color:#999; font-size:0.88rem; padding:12px 0;">Nenhum post publicado ainda.</p>`;
      carregarModeracaoComentarios();
      return;
    }

    let html = "";
    posts.forEach((post, index) => {
      html += `
        <div class="admin-post-item">
          <div>
            <h3>${post.titulo}</h3>
            <div class="post-meta">${post.data}${post.editadoEm ? ' &middot; Editado em ' + post.editadoEm : ''}</div>
          </div>
          <div class="admin-post-actions">
            <a href="post.html?id=${post.id}" target="_blank" class="btn btn-outline btn-sm">Ver</a>
            <button class="btn btn-outline btn-sm" onclick="editarPost(${index})">Editar</button>
            <button class="btn btn-danger btn-sm" onclick="excluirPost(${index})">Excluir</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
    carregarModeracaoComentarios();
  });
}

// ===== MODERAÇÃO DE COMENTÁRIOS =====
function carregarModeracaoComentarios() {
  db.collection("comentarios").onSnapshot((snapshot) => {
    let container = document.getElementById("moderacao-container");
    let notificacao = document.getElementById("notificacao-comentarios");
    let contador = document.getElementById("contador-comentarios");
    
    let todosComentarios = [];
    
    snapshot.forEach((doc) => {
      let comentario = doc.data();
      let postIndex = posts.findIndex(p => p.id === comentario.postId);
      
      if (postIndex !== -1) {
        todosComentarios.push({
          docId: doc.id,
          postTitulo: posts[postIndex].titulo,
          ...comentario
        });
      }
    });
    
    if (todosComentarios.length === 0) {
      container.innerHTML = `<div class="empty-moderacao">Nenhum comentário para moderar</div>`;
      notificacao.style.display = "none";
      return;
    }
    
    notificacao.style.display = "block";
    contador.textContent = todosComentarios.length;
    
    let html = "";
    todosComentarios.forEach((com) => {
      html += `
        <div class="moderacao-item">
          <div class="moderacao-header">
            <div class="moderacao-info">
              <div class="moderacao-post-title">Post: ${com.postTitulo}</div>
              <div class="moderacao-autor">Por: <strong>${com.autor}</strong> (${com.email})</div>
              <div class="moderacao-data">${com.data}</div>
            </div>
          </div>
          <div class="moderacao-conteudo">${com.texto}</div>
          <div class="moderacao-acoes">
            <button class="btn-rejeitar" onclick="excluirComentarioAdmin('${com.docId}')">Excluir</button>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  });
}

async function excluirComentarioAdmin(docId) {
  if (!confirm("Tem certeza que deseja excluir este comentário?")) return;
  
  try {
    await db.collection("comentarios").doc(docId).delete();
  } catch (error) {
    console.error("Erro ao excluir comentário:", error);
    alert("Erro ao excluir o comentário.");
  }
}
