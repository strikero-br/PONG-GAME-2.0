/**
 * PONG GAME - Jogo Clássico de Pong com melhorias visuais e sonoras.
 * Desenvolvido por Jonathan Pereira Delmonte e Gabriel Caputo Morais.
 */

// Seleção do canvas e contexto
const canvas = document.getElementById("meuCanvas");
const contexto = canvas.getContext("2d");

// Variáveis globais
let teclas = {}; // Armazena as teclas pressionadas
let intervaloJogo; // Controla o loop do jogo
let bola, jogadorEsquerda, jogadorDireita; // Objetos dos jogadores e bola
let dificuldade = 'medio'; // Dificuldade inicial
const pontuacaoMaxima = 5; // Pontuação necessária para vencer
let aceleracaoBola; // Aceleração da bola conforme a dificuldade
let velocidadeInicialBola; // Velocidade inicial da bola
let musicaMutada = false; // Controle de mute da música
let sonsMutados = false; // Controle de mute dos efeitos sonoros
let jogoEmAndamento = false; // Verifica se o jogo está em andamento

// Sons do jogo
let musicaMenu = new Audio("som/menu.mp3");
musicaMenu.loop = true;
musicaMenu.volume = 0.5;

let trilhaSonora = new Audio("som/soundtrack.mp3");
trilhaSonora.loop = true;
trilhaSonora.volume = 1.0;

const somInicioJogo = new Audio("som/iniciojogo.mp3");
somInicioJogo.volume = 1.0;

const somBatida = new Audio("som/bola.mp3");
somBatida.volume = 1.0;

const somPonto = new Audio("som/ponto.mp3");
somPonto.volume = 1.0;

const somFimDeJogo = new Audio("som/fimdejogo.mp3");
somFimDeJogo.volume = 0.7;

/**
 * Função para reproduzir sons sem conflitos.
 * Clona o som para permitir múltiplas reproduções simultâneas.
 * @param {Audio} som - Objeto de áudio a ser reproduzido.
 */
function reproduzirSom(som) {
  if (!sonsMutados) {
    let audio = som.cloneNode();
    audio.play();
  }
}

/**
 * Inicia o jogo com a dificuldade selecionada.
 * @param {string} dificuldadeEscolhida - Nível de dificuldade ('facil', 'medio', 'dificil').
 */
function iniciarJogo(dificuldadeEscolhida) {
  dificuldade = dificuldadeEscolhida;
  definirDificuldade();
  document.getElementById("telaMenu").style.display = "none";
  document.getElementById("telaFimJogo").style.display = "none";
  document.getElementById("telaJogo").style.display = "flex";
  reiniciarJogoInterno();
  intervaloJogo = setInterval(desenhar, 15);
  iniciarTrilhaSonora();
  pararMusicaMenu();
  somInicioJogo.muted = sonsMutados;
  somInicioJogo.play();
  jogoEmAndamento = true;
}

/**
 * Reinicia o jogo e retorna ao menu inicial.
 */
function reiniciarJogo() {
  pararSomFimDeJogo();
  mostrarTelaMenu();
}

/**
 * Define a dificuldade ajustando a velocidade e aceleração da bola.
 */
function definirDificuldade() {
  if (dificuldade === 'facil') {
    velocidadeInicialBola = 3;
    aceleracaoBola = 0.005;
  } else if (dificuldade === 'medio') {
    velocidadeInicialBola = 6;
    aceleracaoBola = 0.01;
  } else if (dificuldade === 'dificil') {
    velocidadeInicialBola = 9;
    aceleracaoBola = 0.015;
  }
}

/**
 * Reinicia as variáveis do jogo para o estado inicial.
 */
function reiniciarJogoInterno() {
  // Configuração da bola
  bola = {
    x: canvas.width / 2 - 15,
    y: canvas.height / 2 - 15,
    altura: 30,
    largura: 30,
    dirx: Math.random() < 0.5 ? -1 : 1, // Direção inicial aleatória
    diry: Math.random() < 0.5 ? -1 : 1,
    mod: 0,
    velocidade: velocidadeInicialBola
  };

  // Configuração dos jogadores
  jogadorEsquerda = {
    x: 10,
    y: canvas.height / 2 - 60,
    altura: 120,
    largura: 40,
    pontuacao: 0,
    velocidade: 12
  };

  jogadorDireita = {
    x: canvas.width - 50,
    y: canvas.height / 2 - 60,
    altura: 120,
    largura: 40,
    pontuacao: 0,
    velocidade: 12
  };

  // Atualiza o placar
  document.getElementById("pontuacao1").innerText = 0;
  document.getElementById("pontuacao2").innerText = 0;
}

/**
 * Função principal de desenho, chamada a cada frame.
 */
function desenhar() {
  // Limpa o canvas
  contexto.clearRect(0, 0, canvas.width, canvas.height);

  // Desenha o fundo animado
  desenharAnimacaoFundo();

  // Move os jogadores e a bola
  moverJogadores();
  moverBola();

  // Desenha os jogadores
  contexto.fillStyle = "#ffbe0b";
  contexto.fillRect(jogadorEsquerda.x, jogadorEsquerda.y, jogadorEsquerda.largura, jogadorEsquerda.altura);
  contexto.fillRect(jogadorDireita.x, jogadorDireita.y, jogadorDireita.largura, jogadorDireita.altura);

  // Desenha o rastro da bola
  desenharRastroBola();

  // Desenha a bola
  contexto.fillStyle = "#ffffff";
  contexto.beginPath();
  contexto.arc(bola.x + bola.largura / 2, bola.y + bola.altura / 2, bola.largura / 2, 0, Math.PI * 2);
  contexto.fill();

  // Desenha efeitos
  desenharExplosoes();
  desenharEfeitosJogadores();

  // Aumenta a velocidade da bola gradualmente
  bola.velocidade += aceleracaoBola;

  // Atualiza o placar
  document.getElementById("pontuacao1").innerText = jogadorEsquerda.pontuacao;
  document.getElementById("pontuacao2").innerText = jogadorDireita.pontuacao;

  // Verifica se alguém venceu
  if (jogadorEsquerda.pontuacao >= pontuacaoMaxima || jogadorDireita.pontuacao >= pontuacaoMaxima) {
    fimDeJogo();
  }
}

/**
 * Desenha o fundo animado com estrelas.
 */
let estrelasFundo = [];
for (let i = 0; i < 100; i++) {
  estrelasFundo.push({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    tamanho: Math.random() * 2,
    velocidade: Math.random() * 0.5 + 0.2
  });
}

function desenharAnimacaoFundo() {
  contexto.fillStyle = "#101820";
  contexto.fillRect(0, 0, canvas.width, canvas.height);

  contexto.fillStyle = "#ffffff";
  estrelasFundo.forEach(estrela => {
    contexto.beginPath();
    contexto.arc(estrela.x, estrela.y, estrela.tamanho, 0, Math.PI * 2);
    contexto.fill();

    estrela.y += estrela.velocidade;
    if (estrela.y > canvas.height) {
      estrela.y = 0;
      estrela.x = Math.random() * canvas.width;
    }
  });
}

/**
 * Move os jogadores de acordo com as teclas pressionadas.
 */
function moverJogadores() {
  // Jogador 1 (Esquerda)
  if (87 in teclas && jogadorEsquerda.y > 0) jogadorEsquerda.y -= jogadorEsquerda.velocidade; // Tecla W
  if (83 in teclas && jogadorEsquerda.y + jogadorEsquerda.altura < canvas.height) jogadorEsquerda.y += jogadorEsquerda.velocidade; // Tecla S

  // Jogador 2 (Direita)
  if (38 in teclas && jogadorDireita.y > 0) jogadorDireita.y -= jogadorDireita.velocidade; // Setas para cima
  if (40 in teclas && jogadorDireita.y + jogadorDireita.altura < canvas.height) jogadorDireita.y += jogadorDireita.velocidade; // Setas para baixo
}

/**
 * Move a bola e verifica colisões.
 */
function moverBola() {
  // Colisão com o jogador esquerdo
  if (
    bola.y + bola.altura >= jogadorEsquerda.y &&
    bola.y <= jogadorEsquerda.y + jogadorEsquerda.altura &&
    bola.x <= jogadorEsquerda.x + jogadorEsquerda.largura
  ) {
    bola.dirx = 1;
    bola.mod += 0.2;
    reproduzirSom(somBatida);
    criarEfeitoJogador(jogadorEsquerda.x + jogadorEsquerda.largura, bola.y + bola.altura / 2);
  }
  // Colisão com o jogador direito
  else if (
    bola.y + bola.altura >= jogadorDireita.y &&
    bola.y <= jogadorDireita.y + jogadorDireita.altura &&
    bola.x + bola.largura >= jogadorDireita.x
  ) {
    bola.dirx = -1;
    bola.mod += 0.2;
    reproduzirSom(somBatida);
    criarEfeitoJogador(jogadorDireita.x, bola.y + bola.altura / 2);
  }

  // Colisão com as bordas superior e inferior
  if (bola.y <= 0 || bola.y + bola.altura >= canvas.height) {
    bola.diry = -bola.diry;
    reproduzirSom(somBatida);
  }

  // Move a bola
  bola.x += (bola.velocidade + bola.mod) * bola.dirx;
  bola.y += (bola.velocidade + bola.mod) * bola.diry;

  // Verifica se alguém marcou ponto
  if (bola.x < jogadorEsquerda.x + jogadorEsquerda.largura - 15) {
    jogadorDireita.pontuacao++;
    reproduzirSom(somPonto);
    animarPlacar('direita');
    criarExplosao(bola.x, bola.y);
    sacudirTela();
    resetarBola();
  } else if (bola.x + bola.largura > jogadorDireita.x + 15) {
    jogadorEsquerda.pontuacao++;
    reproduzirSom(somPonto);
    animarPlacar('esquerda');
    criarExplosao(bola.x, bola.y);
    sacudirTela();
    resetarBola();
  }
}

/**
 * Reseta a bola para o centro com direção aleatória.
 */
function resetarBola() {
  bola.velocidade = velocidadeInicialBola;
  bola.mod = 0;
  bola.x = canvas.width / 2 - bola.largura / 2;
  bola.y = canvas.height / 2 - bola.altura / 2;
  bola.dirx = Math.random() < 0.5 ? -1 : 1;
  bola.diry = Math.random() < 0.5 ? -1 : 1;
  rastroBola = [];
}

/**
 * Anima o placar quando um ponto é marcado.
 * @param {string} jogador - 'esquerda' ou 'direita'
 */
function animarPlacar(jogador) {
  let elementoPlacar = jogador === 'esquerda' ? document.getElementById("placarJogador1") : document.getElementById("placarJogador2");
  elementoPlacar.classList.add("score-flash");

  setTimeout(() => {
    elementoPlacar.classList.remove("score-flash");
  }, 500);
}

/**
 * Sacode a tela para um efeito de impacto.
 */
function sacudirTela() {
  canvas.classList.add('tremer');
  setTimeout(() => {
    canvas.classList.remove('tremer');
  }, 500);
}

/**
 * Finaliza o jogo e exibe a tela de fim de jogo.
 */
function fimDeJogo() {
  clearInterval(intervaloJogo);
  document.getElementById("telaJogo").style.display = "none";
  document.getElementById("telaFimJogo").style.display = "flex";
  document.getElementById("pontuacaoFinal").innerText = `Jogador 1: ${jogadorEsquerda.pontuacao} - Jogador 2: ${jogadorDireita.pontuacao}`;
  pararTrilhaSonora();
  pararSomInicioJogo();
  reproduzirSom(somFimDeJogo);
  criarParticulas();
  jogoEmAndamento = false;
}

/**
 * Permite ao jogador desistir, finalizando o jogo.
 */
function desistir() {
  if (jogoEmAndamento) {
    fimDeJogo();
  }
}

/**
 * Inicia a trilha sonora do jogo.
 */
function iniciarTrilhaSonora() {
  trilhaSonora.muted = musicaMutada;
  trilhaSonora.play();
}

/**
 * Para a trilha sonora do jogo.
 */
function pararTrilhaSonora() {
  if (trilhaSonora) {
    trilhaSonora.pause();
    trilhaSonora.currentTime = 0;
  }
}

/**
 * Inicia a música do menu.
 */
function iniciarMusicaMenu() {
  musicaMenu.muted = musicaMutada;
  musicaMenu.play();
}

/**
 * Para a música do menu.
 */
function pararMusicaMenu() {
  if (musicaMenu) {
    musicaMenu.pause();
    musicaMenu.currentTime = 0;
  }
}

/**
 * Para o som de início de jogo.
 */
function pararSomInicioJogo() {
  if (somInicioJogo) {
    somInicioJogo.pause();
    somInicioJogo.currentTime = 0;
  }
}

/**
 * Para o som de fim de jogo.
 */
function pararSomFimDeJogo() {
  if (somFimDeJogo) {
    somFimDeJogo.pause();
    somFimDeJogo.currentTime = 0;
  }
}

/**
 * Exibe a tela inicial ao carregar a página.
 */
window.onload = function() {
  document.getElementById("telaInicial").style.display = "flex";
  document.getElementById("mutarMusica").checked = musicaMutada;
  document.getElementById("mutarSons").checked = sonsMutados;
  iniciarMusicaMenu();
};

/**
 * Exibe a tela de menu.
 */
function mostrarTelaMenu() {
  document.getElementById("telaInicial").style.display = "none";
  document.getElementById("telaMenu").style.display = "flex";
  document.getElementById("telaFimJogo").style.display = "none";
  document.getElementById("telaJogo").style.display = "none";
  iniciarMusicaMenu();
  pararSomFimDeJogo();
}

/**
 * Cria partículas para efeito visual.
 */
function criarParticulas() {
  for (let i = 0; i < 50; i++) {
    const particula = document.createElement('div');
    particula.classList.add('particula');
    particula.style.left = Math.random() * 100 + '%';
    particula.style.bottom = '-10px';
    particula.style.width = particula.style.height = Math.random() * 10 + 5 + 'px';
    particula.style.animationDuration = Math.random() * 5 + 5 + 's';
    particula.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    document.getElementById("telaFimJogo").appendChild(particula);

    setTimeout(() => {
      particula.remove();
    }, 10000);
  }
}

/**
 * Alterna a exibição do menu de opções.
 */
function alternarMenuOpcoes() {
  const menuOpcoes = document.getElementById("menuOpcoes");
  menuOpcoes.classList.toggle("open");
}

/**
 * Alterna o mute da música.
 */
function alternarMutarMusica() {
  musicaMutada = document.getElementById("mutarMusica").checked;
  musicaMenu.muted = musicaMutada;
  trilhaSonora.muted = musicaMutada;
}

/**
 * Alterna o mute dos efeitos sonoros.
 */
function alternarMutarSons() {
  sonsMutados = document.getElementById("mutarSons").checked;
}

/**
 * Captura as teclas pressionadas.
 */
window.addEventListener("keydown", function(e) {
  teclas[e.keyCode] = true;

  // Tecla ESC para desistir
  if (e.keyCode === 27 && jogoEmAndamento) {
    desistir();
  }

  // Tecla R para reiniciar na tela de fim de jogo
  if (e.keyCode === 82) {
    if (document.getElementById("telaFimJogo").style.display === "flex") {
      reiniciarJogo();
    }
  }
});

window.addEventListener("keyup", function(e) {
  delete teclas[e.keyCode];
});

/**
 * Efeitos visuais e animações.
 */
let explosoes = [];
let efeitosJogadores = [];
let rastroBola = [];

/**
 * Cria uma explosão na posição especificada.
 * @param {number} x - Posição X da explosão.
 * @param {number} y - Posição Y da explosão.
 */
function criarExplosao(x, y) {
  explosoes.push({ x: x, y: y, vida: 30 });
}

/**
 * Desenha as explosões na tela.
 */
function desenharExplosoes() {
  explosoes.forEach((explosao, index) => {
    if (explosao.vida > 0) {
      contexto.fillStyle = 'rgba(255, 69, 0, ' + (explosao.vida / 30) + ')';
      contexto.beginPath();
      contexto.arc(explosao.x, explosao.y, (30 - explosao.vida) * 2, 0, Math.PI * 2);
      contexto.fill();
      explosao.vida--;
    } else {
      explosoes.splice(index, 1);
    }
  });
}

/**
 * Cria um efeito visual no jogador.
 * @param {number} x - Posição X do efeito.
 * @param {number} y - Posição Y do efeito.
 */
function criarEfeitoJogador(x, y) {
  efeitosJogadores.push({ x: x, y: y, vida: 10 });
}

/**
 * Desenha os efeitos visuais nos jogadores.
 */
function desenharEfeitosJogadores() {
  efeitosJogadores.forEach((efeito, index) => {
    if (efeito.vida > 0) {
      contexto.strokeStyle = 'rgba(255, 255, 255, ' + (efeito.vida / 10) + ')';
      contexto.beginPath();
      contexto.arc(efeito.x, efeito.y, (10 - efeito.vida) * 3, 0, Math.PI * 2);
      contexto.stroke();
      efeito.vida--;
    } else {
      efeitosJogadores.splice(index, 1);
    }
  });
}

/**
 * Desenha o rastro deixado pela bola.
 */
function desenharRastroBola() {
  rastroBola.push({ x: bola.x + bola.largura / 2, y: bola.y + bola.altura / 2, alpha: 1 });
  rastroBola.forEach((rastro, index) => {
    contexto.fillStyle = 'rgba(255, 255, 255, ' + rastro.alpha + ')';
    contexto.beginPath();
    contexto.arc(rastro.x, rastro.y, bola.largura / 2, 0, Math.PI * 2);
    contexto.fill();
    rastro.alpha -= 0.05;
    if (rastro.alpha <= 0) {
      rastroBola.splice(index, 1);
    }
  });
}
