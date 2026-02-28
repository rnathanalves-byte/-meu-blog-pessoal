// ===== CONFIGURAÇÃO =====
const SENHA_CORRETA = "T9$vQ8#Lm2@Xr5!K";

let posts = JSON.parse(localStorage.getItem("posts")) || [];
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

// ===== LOCALSTORAGE =====
function salvar() {
  localStorage.setItem("posts", JSON.stringify(posts));
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

  // Limpar o input para permitir re-upload do mesmo arquivo
  event.target.value = "";
}

function inserirImagemRedimensionavel(src) {
  let editor = document.getElementById("conteudo");
  editor.focus();

  // Criar wrapper
  let wrapper = document.createElement("div");
  wrapper.className = "img-wrapper";
  wrapper.contentEditable = "false";

  // Criar imagem
  let img = document.createElement("img");
  img.src = src;
  img.style.width = "240px";
  img.style.height = "auto";
  img.draggable = false;

  // Botão de deletar
  let deleteBtn = document.createElement("span");
  deleteBtn.className = "delete-btn";
  deleteBtn.innerHTML = "&times;";
  deleteBtn.title = "Remover imagem";
  deleteBtn.addEventListener("mousedown", function (e) {
    e.preventDefault();
    e.stopPropagation();
    wrapper.remove();
  });

  // Handle de redimensionamento
  let handle = document.createElement("span");
  handle.className = "resize-handle";
  handle.title = "Arraste para redimensionar";

  // ===== LÓGICA DE REDIMENSIONAMENTO CORRIGIDA =====
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

    // Cursor global durante o resize
    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
  });

  // Usar listeners no documento para capturar movimento fora do elemento
  document.addEventListener("mousemove", function onMouseMove(e) {
    if (!isResizing) return;

    let dx = e.clientX - startX;
    let novaLargura = Math.max(60, startWidth + dx);

    // Manter proporção
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

  // ===== TOUCH SUPPORT (mobile) =====
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

  // Inserir no editor na posição do cursor
  let selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    let range = selection.getRangeAt(0);
    // Verificar se o range está dentro do editor
    if (editor.contains(range.commonAncestorContainer)) {
      range.deleteContents();
      range.insertNode(wrapper);
      // Mover cursor após a imagem
      range.setStartAfter(wrapper);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
  }
  // Fallback: adicionar ao final
  editor.appendChild(wrapper);
}

// ===== PUBLICAR POST =====
function publicarPost() {
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

  if (editando !== null) {
    posts[editando].titulo = titulo;
    posts[editando].conteudo = conteudo;
    posts[editando].editadoEm = data;
  } else {
    posts.push({ titulo, conteudo, data });
  }

  salvar();
  limparEditor();
  carregarLista();
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
function excluirPost(index) {
  if (!confirm(`Excluir o post "${posts[index].titulo}"? Esta ação não pode ser desfeita.`)) return;
  posts.splice(index, 1);
  salvar();
  if (editando === index) limparEditor();
  carregarLista();
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
  let container = document.getElementById("lista");

  if (posts.length === 0) {
    container.innerHTML = `<p style="color:#999; font-size:0.88rem; padding:12px 0;">Nenhum post publicado ainda.</p>`;
    return;
  }

  let html = "";
  // Mostrar do mais recente ao mais antigo
  [...posts].reverse().forEach((post, i) => {
    let indexOriginal = posts.length - 1 - i;
    html += `
      <div class="admin-post-item">
        <div>
          <h3>${post.titulo}</h3>
          <div class="post-meta">${post.data}${post.editadoEm ? ' &middot; Editado em ' + post.editadoEm : ''}</div>
        </div>
        <div class="admin-post-actions">
          <a href="post.html?id=${indexOriginal}" target="_blank" class="btn btn-outline btn-sm">Ver</a>
          <button class="btn btn-outline btn-sm" onclick="editarPost(${indexOriginal})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="excluirPost(${indexOriginal})">Excluir</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
