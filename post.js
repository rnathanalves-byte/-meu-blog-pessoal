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

let post = null;
let postId = null;

let params = new URLSearchParams(window.location.search);
postId = params.get("id");

function stripHtml(html) {
  let tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function gerarLinkCompartilhamento() {
  return window.location.href;
}

function compartilharWhatsApp() {
  let titulo = post.titulo;
  let link = gerarLinkCompartilhamento();
  let mensagem = encodeURIComponent(`Confira este post: "${titulo}" ${link}`);
  window.open(`https://wa.me/?text=${mensagem}`, '_blank');
}

function compartilharFacebook() {
  let link = gerarLinkCompartilhamento();
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, '_blank');
}

function compartilharInstagram() {
  let link = gerarLinkCompartilhamento();
  copiarLink(link);
}

function copiarLink(link) {
  navigator.clipboard.writeText(link).then(() => {
    let feedback = document.createElement('div');
    feedback.className = 'copy-feedback';
    feedback.textContent = '✓ Link copiado! Cole nos Stories ou Bio do Instagram';
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.remove();
    }, 3000);
  }).catch(() => {
    alert('Não foi possível copiar. Tente novamente.');
  });
}

function renderizarComentarios() {
  let container = document.getElementById("comentarios-container");
  if (!container) return;

  db.collection("comentarios").where("postId", "==", postId).onSnapshot((snapshot) => {
    let postComentarios = [];
    snapshot.forEach((doc) => {
      postComentarios.push({
        docId: doc.id,
        ...doc.data()
      });
    });
    
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
            <button class="btn-responder" style="margin-left:auto;" onclick="excluirComentarioLeitor('${com.docId}')">Excluir</button>
          </div>
          <div class="comentario-texto">${com.texto}</div>
          ${respostasHtml}
          <button class="btn-responder" onclick="mostrarFormResposta('${com.docId}')">Responder</button>
          <div id="form-resposta-${com.docId}" class="form-resposta" style="display:none; margin-top:12px;">
            <textarea id="textarea-resposta-${com.docId}" placeholder="Sua resposta..." style="width:100%; padding:10px; font-family:monospace; border:1px solid #ddd; border-radius:4px; min-height:80px;"></textarea>
            <div style="margin-top:8px;">
              <button class="btn btn-sm" onclick="enviarResposta('${com.docId}')">Enviar</button>
              <button class="btn btn-outline btn-sm" onclick="ocultarFormResposta('${com.docId}')">Cancelar</button>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  });
}

function mostrarFormResposta(docId) {
  document.getElementById(`form-resposta-${docId}`).style.display = "block";
  document.getElementById(`textarea-resposta-${docId}`).focus();
}

function ocultarFormResposta(docId) {
  document.getElementById(`form-resposta-${docId}`).style.display = "none";
}

async function enviarResposta(docId) {
  let textarea = document.getElementById(`textarea-resposta-${docId}`);
  let texto = textarea.value.trim();
  
  if (!texto) {
    alert("Digite uma resposta!");
    return;
  }

  let data = new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  try {
    await db.collection("comentarios").doc(docId).update({
      respostas: firebase.firestore.FieldValue.arrayUnion({
        autor: "Autor do Blog",
        texto: texto,
        data: data
      })
    });
    
    textarea.value = "";
    ocultarFormResposta(docId);
  } catch (error) {
    console.error("Erro ao enviar resposta:", error);
    alert("Erro ao enviar a resposta.");
  }
}

async function adicionarComentario() {
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

  let data = new Date().toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });

  try {
    await db.collection("comentarios").add({
      postId: postId,
      autor: nome,
      email: email,
      texto: texto,
      data: data,
      respostas: []
    });

    nomeInput.value = "";
    emailInput.value = "";
    textoInput.value = "";
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    alert("Erro ao publicar o comentário.");
  }
}

async function excluirComentarioLeitor(docId) {
  if (!confirm("Tem certeza que deseja excluir seu comentário?")) return;
  
  try {
    await db.collection("comentarios").doc(docId).delete();
  } catch (error) {
    console.error("Erro ao excluir comentário:", error);
    alert("Erro ao excluir o comentário.");
  }
}

// Inicializar
document.addEventListener("DOMContentLoaded", function() {
  if (postId) {
    db.collection("posts").doc(postId).onSnapshot((doc) => {
      if (doc.exists) {
        post = doc.data();
        document.title = post.titulo + " — Meu Blog";

        document.getElementById("post").innerHTML = `
          <article class="post-full">
            <h1>${post.titulo}</h1>
            <div class="post-meta">${post.data}</div>
            <div class="post-content">${post.conteudo}</div>
            
            <div class="share-section">
              <span class="share-label">Compartilhe este post:</span>
              <div class="share-buttons">
                <button class="share-btn whatsapp" onclick="compartilharWhatsApp()">
                  <span class="share-icon">💬</span> WhatsApp
                </button>
                <button class="share-btn facebook" onclick="compartilharFacebook()">
                  <span class="share-icon">f</span> Facebook
                </button>
                <button class="share-btn instagram" onclick="compartilharInstagram()">
                  <span class="share-icon">📷</span> Instagram
                </button>
                <button class="share-btn copy-link" onclick="copiarLink(gerarLinkCompartilhamento())">
                  <span class="share-icon">🔗</span> Copiar Link
                </button>
              </div>
            </div>
            
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
    });
  } else {
    document.getElementById("post").innerHTML = `
      <article class="post-full">
        <h1>Post não encontrado</h1>
        <p style="margin-top:16px; color:#666;">
          Nenhum post foi especificado.
        </p>
        <a href="index.html" class="back-link" style="margin-top:20px;">&larr; Voltar ao início</a>
      </article>
    `;
  }
});
