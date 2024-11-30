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
let bolas = []; // Array para armazenar múltiplas bolas
let jogadorEsquerda, jogadorDireita; // Objetos dos jogadores
let dificuldade = 'medio'; // Dificuldade inicial
const pontuacaoMaxima = 5; // Pontuação necessária para vencer
let aceleracaoBola; // Aceleração da bola conforme a dificuldade
let velocidadeInicialBola; // Velocidade inicial da bola
let musicaMutada = false; // Controle de mute da música
let sonsMutados = false; // Controle de mute dos efeitos sonoros
let jogoEmAndamento = false; // Verifica se o jogo está em andamento

// Controle dos poderes
let poder5x = null; // Poder 5x
let poderGordo = null; // Poder Gordo
let poder10x = null; // ADICIONADO: Poder 10x
let poderGelo = null; // ADICIONADO: Poder de Gelo

// Variáveis para projéteis de gelo
let projetilGelo = []; // ADICIONADO: Array para armazenar projéteis de gelo

// Estados de congelamento dos jogadores
let jogadorEsquerdaCongelado = false; // ADICIONADO: Estado de congelamento do jogador esquerdo
let jogadorDireitaCongelado = false; // ADICIONADO: Estado de congelamento do jogador direito

// Removido o limite máximo de bolas: maxBolas
const maxAlturaJogador = canvas.height * 0.8; // Altura máxima das raquetes
let isGordoActive = false; // Flag para verificar se o poder "Gordo" está ativo

// Temporizadores para spawn dos poderes
let tempoProximoPoder = getRandomSpawnTime();
let contadorTempoPoder = 0;
let tempoProximoPoderGordo = getRandomSpawnTime();
let contadorTempoPoderGordo = 0;
let tempoProximoPoder10x = getRandomSpawnTime() * 2; // ADICIONADO: Temporizador para poder 10x (mais raro)
let contadorTempoPoder10x = 0; // ADICIONADO: Contador para poder 10x
let tempoProximoPoderGelo = getRandomSpawnTime() * 3; // ADICIONADO: Temporizador para poder de gelo (mais raro)
let contadorTempoPoderGelo = 0; // ADICIONADO: Contador para poder de gelo

// Sons do jogo
let musicaMenu = new Audio("som/menu.mp3");
musicaMenu.loop = true;
musicaMenu.volume = 0.5;

let trilhaSonora = new Audio("som/soundtrack.mp3");
trilhaSonora.loop = true;
trilhaSonora.volume = 1.0;

const somInicioJogo = new Audio("som/iniciojogo.mp3");
somInicioJogo.volume = 1.0;

const somBatidaOriginal = new Audio("som/bola.mp3");
somBatidaOriginal.volume = 1.0;

const somPonto = new Audio("som/ponto.mp3");
somPonto.volume = 1.0;

const somFimDeJogo = new Audio("som/fimdejogo.mp3");
somFimDeJogo.volume = 0.7;

const somPoder = new Audio("som/5x.mp3"); // Som do poder 5x aparecendo
somPoder.volume = 1.0;

const somDrop = new Audio("som/drop.mp3"); // Som ao pegar o poder 5x
somDrop.volume = 1.0;

// ADICIONADO: Sons para o poder 10x
// const somPoder10x = new Audio("som/10x.mp3"); // Som do poder 10x aparecendo
// somPoder10x.volume = 1.0;

// const somDrop10x = new Audio("som/drop10x.mp3"); // Som ao pegar o poder 10x
// somDrop10x.volume = 1.0;

const somGordo = new Audio("som/gordo.mp3"); // Som do poder Gordo aparecendo
somGordo.volume = 1.0;

const somBong = new Audio("som/bong.mp3"); // Som ao pegar o poder Gordo
somBong.volume = 1.0;

const somEsvaziar = new Audio("som/esvaziar.mp3"); // Som ao terminar o poder Gordo
somEsvaziar.volume = 1.0;

// ADICIONADO: Sons para o poder de gelo
const somFrio = new Audio("som/frio.mp3"); // Som do poder de gelo aparecendo
somFrio.volume = 1.0;

const somGelo = new Audio("som/gelo.mp3"); // Som ao congelar o oponente
somGelo.volume = 1.0;

// Sistema de Limitação de Sons para "bola.mp3"
const maxConcurrentBatidaSounds = 10; // Limite máximo de sons "bola.mp3" simultâneos
let currentBatidaSoundsPlaying = 0;

/**
 * Função para gerar um tempo aleatório para spawn dos poderes.
 * @returns {number} Tempo em milissegundos entre 10 e 25 segundos.
 */
function getRandomSpawnTime() {
    return Math.random() * 15000 + 10000; // Entre 10 e 25 segundos
}

/**
 * Função para reproduzir sons sem exceder o limite de sons simultâneos para "bola.mp3".
 * @param {Audio} som - Objeto de áudio a ser reproduzido.
 */
function reproduzirSom(som) {
    if (sonsMutados) return;

    if (som === somBatidaOriginal) {
        if (currentBatidaSoundsPlaying >= maxConcurrentBatidaSounds) {
            // Limite alcançado, não reproduz o som
            return;
        }
        currentBatidaSoundsPlaying++;
        let audio = som.cloneNode();
        audio.play();
        // Reduz o contador quando o som terminar
        audio.addEventListener('ended', () => {
            currentBatidaSoundsPlaying--;
        });
        // Também reduz o contador se o som for interrompido
        audio.addEventListener('pause', () => {
            currentBatidaSoundsPlaying--;
        });
    } else {
        // Para outros sons, sem limite
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
    clearInterval(intervaloJogo);
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
    // Configuração das bolas
    bolas = [criarBola()];

    // Configuração dos jogadores
    jogadorEsquerda = {
        x: 10,
        y: canvas.height / 2 - 60,
        altura: 120,
        largura: 20,
        pontuacao: 0,
        velocidade: 16,
        cor: "#ffbe0b",
        originalAltura: 120 // Armazena a altura original
    };

    jogadorDireita = {
        x: canvas.width - 30,
        y: canvas.height / 2 - 60,
        altura: 120,
        largura: 20,
        pontuacao: 0,
        velocidade: 16,
        cor: "#ffbe0b",
        originalAltura: 120 // Armazena a altura original
    };

    // Atualiza o placar
    document.getElementById("pontuacao1").innerText = 0;
    document.getElementById("pontuacao2").innerText = 0;

    // Reinicia os contadores dos poderes
    poder5x = null;
    poderGordo = null;
    poder10x = null; // ADICIONADO: Reinicia o poder 10x
    poderGelo = null; // ADICIONADO: Reinicia o poder de gelo
    tempoProximoPoder = getRandomSpawnTime();
    contadorTempoPoder = 0;
    tempoProximoPoderGordo = getRandomSpawnTime();
    contadorTempoPoderGordo = 0;
    tempoProximoPoder10x = getRandomSpawnTime() * 2; // ADICIONADO: Reinicia o temporizador para 10x
    contadorTempoPoder10x = 0; // ADICIONADO: Reinicia o contador para 10x
    tempoProximoPoderGelo = getRandomSpawnTime() * 3; // ADICIONADO: Reinicia o temporizador para poder de gelo
    contadorTempoPoderGelo = 0; // ADICIONADO: Reinicia o contador para poder de gelo

    isGordoActive = false; // Reseta o estado do poder Gordo

    // Resetar escala das bolas caso "Gordo" estava ativo
    bolas.forEach(bola => {
        bola.escala = 1;
        bola.cor = "#ffffff";
    });

    // Resetar estados de congelamento
    jogadorEsquerdaCongelado = false; // ADICIONADO
    jogadorDireitaCongelado = false; // ADICIONADO
}

/**
 * Função para criar uma nova bola.
 * @param {number} [x] - Posição X inicial da bola.
 * @param {number} [y] - Posição Y inicial da bola.
 * @returns {object} Objeto representando a bola.
 */
function criarBola(x, y) {
    return {
        x: x !== undefined ? x : canvas.width / 2 - 15, // Posição X fixa ou central
        y: y !== undefined ? y : canvas.height / 2 - 15, // Posição Y fixa ou central
        altura: 30, // Tamanho original
        largura: 30,
        dirx: Math.random() < 0.5 ? -1 : 1, // Direção inicial aleatória
        diry: Math.random() < 0.5 ? -1 : 1,
        mod: 0,
        velocidade: velocidadeInicialBola,
        escala: isGordoActive ? 3 : 1, // Escala baseada no poder "Gordo"
        cor: isGordoActive ? "#ff0000" : "#ffffff" // Cor baseada no poder "Gordo"
    };
}

/**
 * Função principal de desenho, chamada a cada frame.
 */
function desenhar() {
    // Limpa o canvas
    contexto.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha o fundo animado
    desenharAnimacaoFundo();

    // Move os jogadores e as bolas
    moverJogadores();
    moverBolas();

    // Desenha os jogadores
    contexto.fillStyle = jogadorEsquerda.cor;
    contexto.fillRect(
        jogadorEsquerda.x,
        jogadorEsquerda.y,
        jogadorEsquerda.largura,
        jogadorEsquerda.altura
    );
    contexto.fillStyle = jogadorDireita.cor;
    contexto.fillRect(
        jogadorDireita.x,
        jogadorDireita.y,
        jogadorDireita.largura,
        jogadorDireita.altura
    );

    // Desenha as bolas
    desenharBolas();

    // Desenha o rastro das bolas
    desenharRastroBola();

    // Desenha efeitos
    desenharExplosoes();
    desenharEfeitosJogadores();

    // Desenha e move os poderes
    desenharMoverPoder();
    desenharMoverPoderGordo();
    desenharMoverPoder10x(); // Poder 10x
    desenharMoverPoderGelo(); // ADICIONADO: Poder de Gelo

    // Desenha e move os projéteis de gelo
    desenharProjetilGelo(); // ADICIONADO: Projéteis de gelo

    // Atualiza o placar
    document.getElementById("pontuacao1").innerText = jogadorEsquerda.pontuacao;
    document.getElementById("pontuacao2").innerText = jogadorDireita.pontuacao;

    // Verifica se alguém venceu
    if (
        jogadorEsquerda.pontuacao >= pontuacaoMaxima ||
        jogadorDireita.pontuacao >= pontuacaoMaxima
    ) {
        fimDeJogo();
    }

    // Atualiza o contador de tempo para gerar o poder 5x
    contadorTempoPoder += 15; // Já que o intervalo do jogo é de 15ms

    if (contadorTempoPoder >= tempoProximoPoder && !poder5x) {
        criarPoder5x();
        contadorTempoPoder = 0;
        tempoProximoPoder = getRandomSpawnTime(); // Define um novo tempo para o próximo poder
    }

    // Atualiza o contador de tempo para gerar o poder Gordo
    contadorTempoPoderGordo += 15; // Já que o intervalo do jogo é de 15ms

    if (contadorTempoPoderGordo >= tempoProximoPoderGordo && !poderGordo) {
        criarPoderGordo();
        contadorTempoPoderGordo = 0;
        tempoProximoPoderGordo = getRandomSpawnTime(); // Define um novo tempo para o próximo poder
    }

    // Atualiza o contador de tempo para gerar o poder 10x
    contadorTempoPoder10x += 15; // Já que o intervalo do jogo é de 15ms

    if (contadorTempoPoder10x >= tempoProximoPoder10x && !poder10x) {
        criarPoder10x();
        contadorTempoPoder10x = 0;
        tempoProximoPoder10x = getRandomSpawnTime() * 2; // Define um novo tempo para o próximo poder 10x
    }

    // ADICIONADO: Atualiza o contador de tempo para gerar o poder de gelo
    contadorTempoPoderGelo += 15; // Já que o intervalo do jogo é de 15ms

    if (contadorTempoPoderGelo >= tempoProximoPoderGelo && !poderGelo) {
        criarPoderGelo();
        contadorTempoPoderGelo = 0;
        tempoProximoPoderGelo = getRandomSpawnTime() * 3; // Define um novo tempo para o próximo poder de gelo (mais raro)
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
    if (!jogadorEsquerdaCongelado) { // ADICIONADO: Verifica se o jogador esquerdo não está congelado
        if (87 in teclas && jogadorEsquerda.y > 0)
            jogadorEsquerda.y -= jogadorEsquerda.velocidade;
        if (
            83 in teclas &&
            jogadorEsquerda.y + jogadorEsquerda.altura < canvas.height
        )
            jogadorEsquerda.y += jogadorEsquerda.velocidade;
    }

    // Jogador 2 (Direita)
    if (!jogadorDireitaCongelado) { // ADICIONADO: Verifica se o jogador direito não está congelado
        if (38 in teclas && jogadorDireita.y > 0)
            jogadorDireita.y -= jogadorDireita.velocidade;
        if (
            40 in teclas &&
            jogadorDireita.y + jogadorDireita.altura < canvas.height
        )
            jogadorDireita.y += jogadorDireita.velocidade;
    }
}

/**
 * Move as bolas e verifica colisões.
 */
function moverBolas() {
    for (let i = 0; i < bolas.length; i++) {
        let bolaAtual = bolas[i];

        // Move a bola
        bolaAtual.x += (bolaAtual.velocidade + bolaAtual.mod) * bolaAtual.dirx;
        bolaAtual.y += (bolaAtual.velocidade + bolaAtual.mod) * bolaAtual.diry;

        // Verifica colisão com as bordas superior e inferior
        if (bolaAtual.y <= 0 || bolaAtual.y + bolaAtual.altura >= canvas.height) {
            bolaAtual.diry = -bolaAtual.diry;
            reproduzirSom(somBatidaOriginal);
        }

        // Verifica colisão com as raquetes
        // Colisão com o jogador esquerdo
        if (
            bolaAtual.x <= jogadorEsquerda.x + jogadorEsquerda.largura &&
            bolaAtual.x + bolaAtual.largura >= jogadorEsquerda.x &&
            bolaAtual.y + bolaAtual.altura >= jogadorEsquerda.y &&
            bolaAtual.y <= jogadorEsquerda.y + jogadorEsquerda.altura
        ) {
            bolaAtual.dirx = 1;
            bolaAtual.mod += 0.2;
            reproduzirSom(somBatidaOriginal);
            criarEfeitoJogador(
                jogadorEsquerda.x + jogadorEsquerda.largura,
                bolaAtual.y + bolaAtual.altura / 2
            );
        }
        // Colisão com o jogador direito
        else if (
            bolaAtual.x + bolaAtual.largura >= jogadorDireita.x &&
            bolaAtual.x <= jogadorDireita.x + jogadorDireita.largura &&
            bolaAtual.y + bolaAtual.altura >= jogadorDireita.y &&
            bolaAtual.y <= jogadorDireita.y + jogadorDireita.altura
        ) {
            bolaAtual.dirx = -1;
            bolaAtual.mod += 0.2;
            reproduzirSom(somBatidaOriginal);
            criarEfeitoJogador(
                jogadorDireita.x,
                bolaAtual.y + bolaAtual.altura / 2
            );
        }

        // Aumenta a velocidade da bola gradualmente
        bolaAtual.velocidade += aceleracaoBola;

        // Verifica se a bola saiu da tela pela esquerda ou direita
        if (bolaAtual.x + bolaAtual.largura < 0) {
            // A bola saiu pela esquerda (lado do jogadorEsquerda)
            criarExplosao(bolaAtual.x, bolaAtual.y);
            sacudirTela();
            bolas.splice(i, 1); // Remove a bola que saiu
            i--; // Ajusta o índice após remover

            if (bolas.length === 0) {
                jogadorDireita.pontuacao++;
                reproduzirSom(somPonto);
                animarPlacar("direita");
                resetarBola();
                break; // Sai do loop
            }
        } else if (bolaAtual.x > canvas.width) {
            // A bola saiu pela direita (lado do jogadorDireita)
            criarExplosao(bolaAtual.x, bolaAtual.y);
            sacudirTela();
            bolas.splice(i, 1); // Remove a bola que saiu
            i--; // Ajusta o índice após remover

            if (bolas.length === 0) {
                jogadorEsquerda.pontuacao++;
                reproduzirSom(somPonto);
                animarPlacar("esquerda");
                resetarBola();
                break; // Sai do loop
            }
        }
    }
}

/**
 * Desenha as bolas na tela.
 */
function desenharBolas() {
    for (let i = 0; i < bolas.length; i++) {
        let bolaAtual = bolas[i];
        contexto.fillStyle = bolaAtual.cor;
        contexto.beginPath();
        contexto.arc(
            bolaAtual.x + bolaAtual.largura / 2,
            bolaAtual.y + bolaAtual.altura / 2,
            (bolaAtual.largura / 2) * bolaAtual.escala,
            0,
            Math.PI * 2
        );
        contexto.fill();
    }
}

/**
 * Reseta a bola para o centro com direção aleatória.
 */
function resetarBola() {
    bolas = [criarBola()];
    rastroBola = [];
}

/**
 * Anima o placar quando um ponto é marcado.
 * @param {string} jogador - 'esquerda' ou 'direita'
 */
function animarPlacar(jogador) {
    let elementoPlacar =
        jogador === "esquerda"
            ? document.getElementById("placarJogador1")
            : document.getElementById("placarJogador2");
    elementoPlacar.classList.add("score-flash");

    setTimeout(() => {
        elementoPlacar.classList.remove("score-flash");
    }, 500);
}

/**
 * Sacode a tela para um efeito de impacto.
 */
function sacudirTela() {
    canvas.classList.add("tremer");
    setTimeout(() => {
        canvas.classList.remove("tremer");
    }, 500);
}

/**
 * Finaliza o jogo e exibe a tela de fim de jogo.
 */
function fimDeJogo() {
    clearInterval(intervaloJogo);
    document.getElementById("telaJogo").style.display = "none";
    document.getElementById("telaFimJogo").style.display = "flex";
    document.getElementById(
        "pontuacaoFinal"
    ).innerText = `Jogador 1: ${jogadorEsquerda.pontuacao} - Jogador 2: ${jogadorDireita.pontuacao}`;
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
window.onload = function () {
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
 * Cria partículas para efeito visual no fim de jogo.
 */
function criarParticulas() {
    for (let i = 0; i < 50; i++) {
        const particula = document.createElement("div");
        particula.classList.add("particula");
        particula.style.left = Math.random() * 100 + "%";
        particula.style.bottom = "-10px";
        particula.style.width = particula.style.height =
            Math.random() * 10 + 5 + "px";
        particula.style.animationDuration = Math.random() * 5 + 5 + "s";
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
window.addEventListener("keydown", function (e) {
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

window.addEventListener("keyup", function (e) {
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
    explosoes.push({
        x: x,
        y: y,
        vida: 30,
        cor: `hsl(${Math.random() * 360}, 100%, 50%)`
    });
}

/**
 * Desenha as explosões na tela.
 */
function desenharExplosoes() {
    explosoes.forEach((explosao, index) => {
        if (explosao.vida > 0) {
            contexto.fillStyle =
                explosao.cor || "rgba(255, 69, 0, " + explosao.vida / 30 + ")";
            contexto.beginPath();
            contexto.arc(
                explosao.x,
                explosao.y,
                explosao.tamanho || (30 - explosao.vida) * 2,
                0,
                Math.PI * 2
            );
            contexto.fill();
            explosao.x += explosao.velocidadeX || 0;
            explosao.y += explosao.velocidadeY || 0;
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
            contexto.strokeStyle =
                "rgba(255, 255, 255, " + efeito.vida / 10 + ")";
            contexto.beginPath();
            contexto.arc(
                efeito.x,
                efeito.y,
                (10 - efeito.vida) * 3,
                0,
                Math.PI * 2
            );
            contexto.stroke();
            efeito.vida--;
        } else {
            efeitosJogadores.splice(index, 1);
        }
    });
}

/**
 * Desenha o rastro deixado pelas bolas.
 */
function desenharRastroBola() {
    for (let i = 0; i < bolas.length; i++) {
        let bolaAtual = bolas[i];
        rastroBola.push({
            x: bolaAtual.x + bolaAtual.largura / 2,
            y: bolaAtual.y + bolaAtual.altura / 2,
            alpha: 1,
            escala: bolaAtual.escala
        });
    }

    rastroBola.forEach((rastro, index) => {
        contexto.fillStyle = "rgba(255, 255, 255, " + rastro.alpha + ")";
        contexto.beginPath();
        contexto.arc(
            rastro.x,
            rastro.y,
            (bolas[0].largura / 2) * rastro.escala,
            0,
            Math.PI * 2
        );
        contexto.fill();
        rastro.alpha -= 0.05;
        if (rastro.alpha <= 0) {
            rastroBola.splice(index, 1);
        }
    });
}

/**
 * Cria o poder 5x na tela.
 */
function criarPoder5x() {
    poder5x = {
        x: Math.random() * (canvas.width - 30), // Spawn aleatório dentro do canvas
        y: Math.random() * (canvas.height - 30),
        altura: 30,
        largura: 30,
        dirx: Math.random() < 0.5 ? -1 : 1, // Direção horizontal aleatória
        diry: Math.random() < 0.5 ? -1 : 1, // Direção vertical aleatória
        velocidade: 3, // Velocidade do poder
        ativo: true
    };

    // Cria explosão de confetes
    criarExplosaoConfete(
        poder5x.x + poder5x.largura / 2,
        poder5x.y + poder5x.altura / 2,
        "rainbow" // ADICIONADO: Tipo de confetes (arco-íris)
    );

    // Reproduz o som do poder aparecendo
    reproduzirSom(somPoder);

    console.log("Poder 5x criado:", poder5x);
}

/**
 * Desenha e move o poder 5x na tela.
 */
function desenharMoverPoder() {
    if (poder5x && poder5x.ativo) {
        // Move o poder
        poder5x.x += poder5x.velocidade * poder5x.dirx;
        poder5x.y += poder5x.velocidade * poder5x.diry;

        // Desenha o poder como o texto "5X" com efeito arco-íris
        let grad = contexto.createLinearGradient(
            poder5x.x,
            poder5x.y,
            poder5x.x + poder5x.largura,
            poder5x.y
        );
        grad.addColorStop(0, "red");
        grad.addColorStop(0.17, "orange");
        grad.addColorStop(0.34, "yellow");
        grad.addColorStop(0.51, "green");
        grad.addColorStop(0.68, "blue");
        grad.addColorStop(0.85, "indigo");
        grad.addColorStop(1, "violet");

        contexto.font = "bold 24px 'Press Start 2P', cursive";
        contexto.fillStyle = grad;
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";
        contexto.fillText(
            "5X",
            poder5x.x + poder5x.largura / 2,
            poder5x.y + poder5x.altura / 2
        );

        // Desenha o rastro do poder
        desenharRastroPoder();

        // Verifica colisão com as bordas do canvas
        if (poder5x.y <= 0 || poder5x.y + poder5x.altura >= canvas.height) {
            poder5x.diry = -poder5x.diry;
        }
        if (poder5x.x <= 0 || poder5x.x + poder5x.largura >= canvas.width) {
            poder5x.dirx = -poder5x.dirx;
        }

        // Verifica colisão com as raquetes
        // Raquete esquerda
        if (
            poder5x.x <= jogadorEsquerda.x + jogadorEsquerda.largura &&
            poder5x.x + poder5x.largura >= jogadorEsquerda.x &&
            poder5x.y + poder5x.altura >= jogadorEsquerda.y &&
            poder5x.y <= jogadorEsquerda.y + jogadorEsquerda.altura
        ) {
            // Raquete esquerda coletou o poder
            aplicarPoder5x();
            reproduzirSom(somDrop); // Reproduz o som 'drop.mp3' ao pegar o poder
            poder5x.ativo = false;
            poder5x = null; // Remove o poder após coletado
            console.log("Poder 5x coletado pela esquerda.");
        }

        // Raquete direita
        if (
            poder5x.x + poder5x.largura >= jogadorDireita.x &&
            poder5x.x <= jogadorDireita.x + jogadorDireita.largura &&
            poder5x.y + poder5x.altura >= jogadorDireita.y &&
            poder5x.y <= jogadorDireita.y + jogadorDireita.altura
        ) {
            // Raquete direita coletou o poder
            aplicarPoder5x();
            reproduzirSom(somDrop); // Reproduz o som 'drop.mp3' ao pegar o poder
            poder5x.ativo = false;
            poder5x = null; // Remove o poder após coletado
            console.log("Poder 5x coletado pela direita.");
        }
    }
}

/**
 * Desenha o rastro do poder 5x.
 */
let rastroPoder = [];

function desenharRastroPoder() {
    if (!poder5x) return;
    rastroPoder.push({
        x: poder5x.x + poder5x.largura / 2,
        y: poder5x.y + poder5x.altura / 2,
        alpha: 1
    });

    rastroPoder.forEach((rastro, index) => {
        contexto.fillStyle = "rgba(255, 255, 255, " + rastro.alpha + ")";
        contexto.font = "bold 24px 'Press Start 2P', cursive";
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";
        contexto.fillText("5X", rastro.x, rastro.y);
        rastro.alpha -= 0.02;
        if (rastro.alpha <= 0) {
            rastroPoder.splice(index, 1);
        }
    });
}

/**
 * Aplica o efeito do poder 5x.
 */
function aplicarPoder5x() {
    // Adicionar exatamente 5 novas bolas, sem substituir as existentes
    // Definir posições fixas relativas ao centro para as novas bolas
    const posicoes = [
        { x: canvas.width / 2 - 60, y: canvas.height / 2 - 60 },
        { x: canvas.width / 2 + 60, y: canvas.height / 2 - 60 },
        { x: canvas.width / 2 - 60, y: canvas.height / 2 + 60 },
        { x: canvas.width / 2 + 60, y: canvas.height / 2 + 60 },
        { x: canvas.width / 2, y: canvas.height / 2 } // Uma no centro
    ];

    // Adicionar 5 bolas nas posições definidas
    posicoes.forEach(posicao => {
        bolas.push(criarBola(posicao.x, posicao.y));
    });

    console.log(`Poder 5x ativado. 5 bolas adicionadas. Total de bolas: ${bolas.length}`);
}

/**
 * Cria o poder Gordo na tela.
 */
function criarPoderGordo() {
    poderGordo = {
        x: Math.random() * (canvas.width - 30), // Spawn aleatório dentro do canvas
        y: Math.random() * (canvas.height - 30),
        altura: 30,
        largura: 30,
        dirx: Math.random() < 0.5 ? -1 : 1, // Direção horizontal aleatória
        diry: Math.random() < 0.5 ? -1 : 1, // Direção vertical aleatória
        velocidade: 5, // Velocidade do poder
        ativo: true
    };

    // Cria explosão de confetes
    criarExplosaoConfete(
        poderGordo.x + poderGordo.largura / 2,
        poderGordo.y + poderGordo.altura / 2,
        "green" // ADICIONADO: Tipo de confetes (verde)
    );

    // Reproduz o som do poder aparecendo
    reproduzirSom(somGordo);

    console.log("Poder Gordo criado:", poderGordo);
}

/**
 * Desenha e move o poder Gordo na tela.
 */
function desenharMoverPoderGordo() {
    if (poderGordo && poderGordo.ativo) {
        // Move o poder
        poderGordo.x += poderGordo.velocidade * poderGordo.dirx;
        poderGordo.y += poderGordo.velocidade * poderGordo.diry;

        // Desenha o poder como um círculo verde com a letra "G" e efeito pulsante
        contexto.save();
        contexto.translate(
            poderGordo.x + poderGordo.largura / 2,
            poderGordo.y + poderGordo.altura / 2
        );
        contexto.rotate(Date.now() / 500);
        contexto.fillStyle = "green";
        contexto.beginPath();
        contexto.arc(0, 0, poderGordo.largura / 2, 0, Math.PI * 2);
        contexto.fill();

        contexto.fillStyle = "#ffffff";
        contexto.font = "bold 20px 'Press Start 2P', cursive";
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";
        contexto.fillText("G", 0, 0);
        contexto.restore();

        // Desenha o rastro do poder Gordo
        desenharRastroPoderGordo();

        // Verifica colisão com as bordas do canvas
        if (poderGordo.y <= 0 || poderGordo.y + poderGordo.altura >= canvas.height) {
            poderGordo.diry = -poderGordo.diry;
        }
        if (poderGordo.x <= 0 || poderGordo.x + poderGordo.largura >= canvas.width) {
            poderGordo.dirx = -poderGordo.dirx;
        }

        // Verifica colisão com as raquetes
        // Raquete esquerda
        if (
            poderGordo.x <= jogadorEsquerda.x + jogadorEsquerda.largura &&
            poderGordo.x + poderGordo.largura >= jogadorEsquerda.x &&
            poderGordo.y + poderGordo.altura >= jogadorEsquerda.y &&
            poderGordo.y <= jogadorEsquerda.y + jogadorEsquerda.altura
        ) {
            // Raquete esquerda coletou o poder
            aplicarPoderGordo(jogadorEsquerda);
            reproduzirSom(somBong);
            poderGordo.ativo = false;
            poderGordo = null;
            console.log("Poder Gordo coletado pela esquerda.");
        }

        // Raquete direita
        if (
            poderGordo.x + poderGordo.largura >= jogadorDireita.x &&
            poderGordo.x <= jogadorDireita.x + jogadorDireita.largura &&
            poderGordo.y + poderGordo.altura >= jogadorDireita.y &&
            poderGordo.y <= jogadorDireita.y + jogadorDireita.altura
        ) {
            // Raquete direita coletou o poder
            aplicarPoderGordo(jogadorDireita);
            reproduzirSom(somBong);
            poderGordo.ativo = false;
            poderGordo = null;
            console.log("Poder Gordo coletado pela direita.");
        }
    }
}

/**
 * Desenha o rastro do poder Gordo.
 */
let rastroPoderGordo = [];

function desenharRastroPoderGordo() {
    if (!poderGordo) return;
    rastroPoderGordo.push({
        x: poderGordo.x + poderGordo.largura / 2,
        y: poderGordo.y + poderGordo.altura / 2,
        alpha: 1
    });

    rastroPoderGordo.forEach((rastro, index) => {
        contexto.save();
        contexto.translate(rastro.x, rastro.y);
        contexto.rotate(Date.now() / 500);
        contexto.fillStyle = "rgba(0, 255, 0," + rastro.alpha + ")";
        contexto.beginPath();
        contexto.arc(0, 0, poderGordo.largura / 2, 0, Math.PI * 2);
        contexto.fill();

        contexto.fillStyle = "rgba(255, 255, 255," + rastro.alpha + ")";
        contexto.font = "bold 20px 'Press Start 2P', cursive";
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";
        contexto.fillText("G", 0, 0);
        contexto.restore();

        rastro.alpha -= 0.02;
        if (rastro.alpha <= 0) {
            rastroPoderGordo.splice(index, 1);
        }
    });
}

/**
 * Aplica o efeito do poder Gordo.
 * @param {object} jogador - Jogador que pegou o poder.
 */
function aplicarPoderGordo(jogador) {
    if (isGordoActive) {
        // Se o poder já está ativo, não faz nada para evitar acúmulo
        return;
    }

    console.log(
        "Poder Gordo ativado para",
        jogador === jogadorEsquerda ? "esquerda" : "direita"
    );

    isGordoActive = true;

    // Aumentar o tamanho da raquete do jogador, sem exceder o máximo
    let aumento = 2.5; // Aumenta 250%
    let novaAltura = jogador.altura * aumento;
    if (novaAltura <= maxAlturaJogador) {
        jogador.altura = novaAltura;
    } else {
        jogador.altura = maxAlturaJogador;
    }

    // Mudar a cor da raquete
    jogador.cor = "#00ff00";

    // Aumentar o tamanho das bolas existentes
    bolas.forEach(bola => {
        bola.escala *= 3; // Aumenta 300%
        bola.cor = "#ff0000"; // Muda a cor das bolas para vermelho
    });

    // As bolas futuras já terão escala e cor ajustadas na função criarBola()

    // Após 7 segundos, voltar ao tamanho normal
    setTimeout(() => {
        // Reduzir o tamanho da raquete
        jogador.altura /= aumento;
        jogador.cor = "#ffbe0b";

        // Reduzir o tamanho das bolas e voltar à cor original
        bolas.forEach(bola => {
            bola.escala /= 3;
            bola.cor = "#ffffff";
        });

        isGordoActive = false;
        reproduzirSom(somEsvaziar);
        console.log(
            "Poder Gordo desativado para",
            jogador === jogadorEsquerda ? "esquerda" : "direita"
        );
    }, 7000);
}

/**
 * Cria uma explosão de confetes.
 * @param {number} x - Posição X da explosão.
 * @param {number} y - Posição Y da explosão.
 * @param {string} cor - Cor dos confetes. // ADICIONADO
 */
function criarExplosaoConfete(x, y, cor = null) { // ADICIONADO: Parâmetro 'cor' com valor padrão
    for (let i = 0; i < 50; i++) {
        const confete = {
            x: x,
            y: y,
            velocidadeX: (Math.random() - 0.5) * 4,
            velocidadeY: (Math.random() - 0.5) * 4,
            cor: cor ? cor : `hsl(${Math.random() * 360}, 100%, 50%)`, // Use a cor passada ou uma aleatória
            tamanho: Math.random() * 4 + 2,
            vida: 50
        };
        explosoes.push(confete);
    }
}

/**
 * Cria o poder 10x na tela.
 */
function criarPoder10x() {
    poder10x = {
        x: Math.random() * (canvas.width - 30), // Spawn aleatório dentro do canvas
        y: Math.random() * (canvas.height - 30),
        altura: 30,
        largura: 30,
        dirx: Math.random() < 0.5 ? -1 : 1, // Direção horizontal aleatória
        diry: Math.random() < 0.5 ? -1 : 1, // Direção vertical aleatória
        velocidade: 4, // Velocidade do poder (ajustada para diferenciar)
        ativo: true
    };

    // Cria explosão de confetes
    criarExplosaoConfete(
        poder10x.x + poder10x.largura / 2,
        poder10x.y + poder10x.altura / 2,
        "gold" // ADICIONADO: Tipo de confetes (dourado)
    );

    // Reproduz o som do poder aparecendo (reutilizando somPoder)
    reproduzirSom(somPoder); // Pode ser ajustado para usar somPoder10x

    console.log("Poder 10x criado:", poder10x);
}

/**
 * Desenha e move o poder 10x na tela.
 */
function desenharMoverPoder10x() {
    if (poder10x && poder10x.ativo) {
        // Move o poder
        poder10x.x += poder10x.velocidade * poder10x.dirx;
        poder10x.y += poder10x.velocidade * poder10x.diry;

        // Desenha o poder como o texto "10X" com efeito dourado
        contexto.fillStyle = "gold";
        contexto.font = "bold 24px 'Press Start 2P', cursive";
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";
        contexto.fillText(
            "10X",
            poder10x.x + poder10x.largura / 2,
            poder10x.y + poder10x.altura / 2
        );

        // Desenha o rastro do poder
        desenharRastroPoder10x();

        // Verifica colisão com as bordas do canvas
        if (poder10x.y <= 0 || poder10x.y + poder10x.altura >= canvas.height) {
            poder10x.diry = -poder10x.diry;
        }
        if (poder10x.x <= 0 || poder10x.x + poder10x.largura >= canvas.width) {
            poder10x.dirx = -poder10x.dirx;
        }

        // Verifica colisão com as raquetes
        // Raquete esquerda
        if (
            poder10x.x <= jogadorEsquerda.x + jogadorEsquerda.largura &&
            poder10x.x + poder10x.largura >= jogadorEsquerda.x &&
            poder10x.y + poder10x.altura >= jogadorEsquerda.y &&
            poder10x.y <= jogadorEsquerda.y + jogadorEsquerda.altura
        ) {
            // Raquete esquerda coletou o poder
            aplicarPoder10x();
            // ADICIONADO: Reproduzir som específico ao pegar o poder 10x
            // if (somDrop10x) reproduzirSom(somDrop10x);
            reproduzirSom(somDrop); // Reutilizando somDrop para simplificar
            poder10x.ativo = false;
            poder10x = null; // Remove o poder após coletado
            console.log("Poder 10x coletado pela esquerda.");
        }

        // Raquete direita
        if (
            poder10x.x + poder10x.largura >= jogadorDireita.x &&
            poder10x.x <= jogadorDireita.x + jogadorDireita.largura &&
            poder10x.y + poder10x.altura >= jogadorDireita.y &&
            poder10x.y <= jogadorDireita.y + jogadorDireita.altura
        ) {
            // Raquete direita coletou o poder
            aplicarPoder10x();
            // ADICIONADO: Reproduzir som específico ao pegar o poder 10x
            // if (somDrop10x) reproduzirSom(somDrop10x);
            reproduzirSom(somDrop); // Reutilizando somDrop para simplificar
            poder10x.ativo = false;
            poder10x = null; // Remove o poder após coletado
            console.log("Poder 10x coletado pela direita.");
        }
    }
}

/**
 * Desenha o rastro do poder 10x.
 */
let rastroPoder10x = [];

function desenharRastroPoder10x() {
    if (!poder10x) return;
    rastroPoder10x.push({
        x: poder10x.x + poder10x.largura / 2,
        y: poder10x.y + poder10x.altura / 2,
        alpha: 1
    });

    rastroPoder10x.forEach((rastro, index) => {
        contexto.fillStyle = "rgba(255, 215, 0, " + rastro.alpha + ")"; // Dourado
        contexto.font = "bold 24px 'Press Start 2P', cursive";
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";
        contexto.fillText("10X", rastro.x, rastro.y);
        rastro.alpha -= 0.02;
        if (rastro.alpha <= 0) {
            rastroPoder10x.splice(index, 1);
        }
    });
}

/**
 * Aplica o efeito do poder 10x.
 */
function aplicarPoder10x() {
    // Adicionar exatamente 10 novas bolas, sem substituir as existentes
    // Definir posições fixas relativas ao centro para as novas bolas
    const posicoes = [
        { x: canvas.width / 2 - 100, y: canvas.height / 2 - 100 },
        { x: canvas.width / 2 + 100, y: canvas.height / 2 - 100 },
        { x: canvas.width / 2 - 100, y: canvas.height / 2 + 100 },
        { x: canvas.width / 2 + 100, y: canvas.height / 2 + 100 },
        { x: canvas.width / 2, y: canvas.height / 2 - 100 },
        { x: canvas.width / 2, y: canvas.height / 2 + 100 },
        { x: canvas.width / 2 - 100, y: canvas.height / 2 },
        { x: canvas.width / 2 + 100, y: canvas.height / 2 },
        { x: canvas.width / 2 - 50, y: canvas.height / 2 - 50 },
        { x: canvas.width / 2 + 50, y: canvas.height / 2 + 50 }
    ];

    // Adicionar 10 bolas nas posições definidas
    posicoes.forEach(posicao => {
        bolas.push(criarBola(posicao.x, posicao.y));
    });

    console.log(`Poder 10x ativado. 10 bolas adicionadas. Total de bolas: ${bolas.length}`);
}

/**
 * Cria o poder de gelo na tela.
 */
function criarPoderGelo() {
    poderGelo = {
        x: Math.random() * (canvas.width - 30), // Spawn aleatório dentro do canvas
        y: Math.random() * (canvas.height - 30),
        altura: 30,
        largura: 30,
        dirx: Math.random() < 0.5 ? -1 : 1, // Direção horizontal aleatória
        diry: Math.random() < 0.5 ? -1 : 1, // Direção vertical aleatória
        velocidade: 4, // Velocidade do poder (ajustada para diferenciar)
        ativo: true
    };

    // Cria explosão de confetes azuis
    criarExplosaoConfete(
        poderGelo.x + poderGelo.largura / 2,
        poderGelo.y + poderGelo.altura / 2,
        "blue" // ADICIONADO: Tipo de confetes (azul)
    );

    // Reproduz o som do poder aparecendo
    reproduzirSom(somFrio);

    console.log("Poder de Gelo criado:", poderGelo);
}

/**
 * Desenha e move o poder de gelo na tela.
 */
function desenharMoverPoderGelo() {
    if (poderGelo && poderGelo.ativo) {
        // Move o poder
        poderGelo.x += poderGelo.velocidade * poderGelo.dirx;
        poderGelo.y += poderGelo.velocidade * poderGelo.diry;

        // Desenha o poder como o texto "Gelo" com cor azul
        contexto.fillStyle = "blue";
        contexto.font = "bold 24px 'Press Start 2P', cursive";
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";
        contexto.fillText(
            "Gelo",
            poderGelo.x + poderGelo.largura / 2,
            poderGelo.y + poderGelo.altura / 2
        );

        // Desenha o rastro do poder
        desenharRastroPoderGelo();

        // Verifica colisão com as bordas do canvas
        if (poderGelo.y <= 0 || poderGelo.y + poderGelo.altura >= canvas.height) {
            poderGelo.diry = -poderGelo.diry;
        }
        if (poderGelo.x <= 0 || poderGelo.x + poderGelo.largura >= canvas.width) {
            poderGelo.dirx = -poderGelo.dirx;
        }

        // Verifica colisão com as raquetes
        // Raquete esquerda
        if (
            poderGelo.x <= jogadorEsquerda.x + jogadorEsquerda.largura &&
            poderGelo.x + poderGelo.largura >= jogadorEsquerda.x &&
            poderGelo.y + poderGelo.altura >= jogadorEsquerda.y &&
            poderGelo.y <= jogadorEsquerda.y + jogadorEsquerda.altura
        ) {
            // Raquete esquerda coletou o poder
            aplicarPoderGelo(jogadorEsquerda);
            reproduzirSom(somDrop); // Reutilizando somDrop para simplificar
            poderGelo.ativo = false;
            poderGelo = null; // Remove o poder após coletado
            console.log("Poder de Gelo coletado pela esquerda.");
        }

        // Raquete direita
        if (
            poderGelo.x + poderGelo.largura >= jogadorDireita.x &&
            poderGelo.x <= jogadorDireita.x + jogadorDireita.largura &&
            poderGelo.y + poderGelo.altura >= jogadorDireita.y &&
            poderGelo.y <= jogadorDireita.y + jogadorDireita.altura
        ) {
            // Raquete direita coletou o poder
            aplicarPoderGelo(jogadorDireita);
            reproduzirSom(somDrop); // Reutilizando somDrop para simplificar
            poderGelo.ativo = false;
            poderGelo = null; // Remove o poder após coletado
            console.log("Poder de Gelo coletado pela direita.");
        }
    }
}

/**
 * Desenha o rastro do poder de gelo.
 */
let rastroPoderGelo = [];

function desenharRastroPoderGelo() {
    if (!poderGelo) return;
    rastroPoderGelo.push({
        x: poderGelo.x + poderGelo.largura / 2,
        y: poderGelo.y + poderGelo.altura / 2,
        alpha: 1
    });

    rastroPoderGelo.forEach((rastro, index) => {
        contexto.fillStyle = "rgba(0, 0, 255, " + rastro.alpha + ")"; // Azul
        contexto.font = "bold 24px 'Press Start 2P', cursive";
        contexto.textAlign = "center";
        contexto.textBaseline = "middle";
        contexto.fillText("Gelo", rastro.x, rastro.y);
        rastro.alpha -= 0.02;
        if (rastro.alpha <= 0) {
            rastroPoderGelo.splice(index, 1);
        }
    });
}

// Reiniciar jogo interno - Ajuste do temporizador para poder de gelo
tempoProximoPoderGelo = getRandomSpawnTime() * 1.15; // De 3 para 1.5 para spawn mais rápido

/**
* Congela o jogador por 8 segundos.
* @param {object} oponente - Jogador a ser congelado.
*/
function congelarJogador(oponente) {
    if (oponente === jogadorEsquerda) {
        jogadorEsquerdaCongelado = true;
        jogadorEsquerda.cor = "blue"; // Mudar a cor para azul
    } else {
        jogadorDireitaCongelado = true;
        jogadorDireita.cor = "blue"; // Mudar a cor para azul
    }

    // Tocar som de gelo apenas uma vez ao congelar
    reproduzirSom(somGelo);

    console.log(`Oponente ${oponente === jogadorEsquerda ? "esquerda" : "direita"} congelado por 8 segundos.`);

    // Descongelar após 8 segundos e resetar a cor da raquete
    setTimeout(() => {
        if (oponente === jogadorEsquerda) {
            jogadorEsquerdaCongelado = false;
            jogadorEsquerda.cor = "#ffbe0b"; // Resetar a cor original
        } else {
            jogadorDireitaCongelado = false;
            jogadorDireita.cor = "#ffbe0b"; // Resetar a cor original
        }
        console.log(`Oponente ${oponente === jogadorEsquerda ? "esquerda" : "direita"} descongelado.`);
    }, 8000); // Alterado de 2000 para 8000 milissegundos
}

// Modificar a função 'aplicarPoderGelo' para disparar 5 projéteis com intervalo de 1 segundo e velocidade menor
function aplicarPoderGelo(jogador) {
    // Mudar a cor da raquete para azul
    jogador.cor = "blue";

    // Disparar 5 projéteis de gelo com intervalo de 1 segundo
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            let projeteisPorJogador = {
                x: jogador === jogadorEsquerda ? jogador.x + jogador.largura : jogador.x - 20,
                y: jogador.y + jogador.altura / 2,
                largura: 20, // Aumentado de 10 para 20
                altura: 8,   // Aumentado de 4 para 8
                velocidade: jogador === jogadorEsquerda ? 4 : -4, // Velocidade diminuída de 8 para 4
                cor: "cyan"
            };
            projetilGelo.push(projeteisPorJogador);
        }, i * 1000); // 1 segundo de intervalo
    }

    console.log(`Poder de Gelo ativado para ${jogador === jogadorEsquerda ? "esquerda" : "direita"}. 5 projéteis de gelo disparados.`);

    // Reproduzir som ao coletar o poder de gelo
    // reproduzirSom(somGelo); // REMOVIDO para evitar som duplicado

    // Resetar a cor da raquete após 2 segundos
    setTimeout(() => {
        jogador.cor = "#ffbe0b"; // Cor original
        console.log(`Poder de Gelo desativado para ${jogador === jogadorEsquerda ? "esquerda" : "direita"}. Raquete restaurada.`);
    }, 2000);
}

// Modificar a função 'desenharProjetilGelo' para corrigir a colisão e melhorar a aparência dos projéteis
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

// Adicione a função 'oponenteCongelado' antes da função 'desenharProjetilGelo'
function oponenteCongelado(oponente) {
    return oponente === jogadorEsquerda ? jogadorEsquerdaCongelado : jogadorDireitaCongelado;
}

/**
 * Desenha e move os projéteis de gelo na tela.
 */
function desenharProjetilGelo() {
    for (let i = 0; i < projetilGelo.length; i++) {
        let projeteisAtuais = projetilGelo[i];

        // Move o projétil
        projeteisAtuais.x += projeteisAtuais.velocidade;

        // Desenha o projétil como círculo maior e azul
        contexto.fillStyle = projeteisAtuais.cor;
        contexto.beginPath();
        contexto.arc(
            projeteisAtuais.x + projeteisAtuais.largura / 2,
            projeteisAtuais.y,
            projeteisAtuais.largura / 2,
            0,
            Math.PI * 2
        );
        contexto.fill();

        // Verifica se o projétil saiu do canvas
        if (
            projeteisAtuais.x < -projeteisAtuais.largura ||
            projeteisAtuais.x > canvas.width + projeteisAtuais.largura
        ) {
            projetilGelo.splice(i, 1);
            i--;
            continue;
        }

        // Verifica colisão com a raquete oponente considerando o raio do projétil
        let oponente = projeteisAtuais.velocidade > 0 ? jogadorDireita : jogadorEsquerda;
        let raio = projeteisAtuais.largura / 2;

        let closestX = clamp(projeteisAtuais.x + raio, oponente.x, oponente.x + oponente.largura);
        let closestY = clamp(projeteisAtuais.y, oponente.y, oponente.y + oponente.altura);

        let distanceX = (projeteisAtuais.x + raio) - closestX;
        let distanceY = projeteisAtuais.y - closestY;

        let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        if (distanceSquared < (raio * raio)) {
            // Oponente foi atingido
            if (!oponenteCongelado(oponente)) {
                congelarJogador(oponente);
            }
            // Remove o projétil após atingir
            projetilGelo.splice(i, 1);
            i--;
        }
    }
}