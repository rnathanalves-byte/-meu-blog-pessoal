let posts = JSON.parse(localStorage.getItem("posts")) || [];

function stripHtml(html) {
  let tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function mostrarPosts() {
  let container = document.getElementById("posts");

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Nenhum post publicado ainda.</p>
        <p style="margin-top:10px; font-size:0.82rem;">
          <a href="admin.html" style="color:inherit; text-decoration:underline;">Acesse o painel admin</a> para criar o primeiro post.
        </p>
      </div>
    `;
    return;
  }

  // Mostrar posts do mais recente para o mais antigo
  let postsOrdenados = [...posts].reverse();

  let html = "";
  postsOrdenados.forEach((post, i) => {
    let indexOriginal = posts.length - 1 - i;
    let textoLimpo = stripHtml(post.conteudo);
    let resumo = textoLimpo.length > 200 ? textoLimpo.substring(0, 200) + "…" : textoLimpo;

    html += `
      <article class="post-card">
        <h2><a href="post.html?id=${indexOriginal}">${post.titulo}</a></h2>
        <div class="post-meta">${post.data}</div>
        <p class="post-excerpt">${resumo}</p>
        <a href="post.html?id=${indexOriginal}" class="read-more">Ler mais &rarr;</a>
      </article>
    `;
  });

  container.innerHTML = html;
}

mostrarPosts();
