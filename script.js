// Simulação de um elevador de 11 paradas (térreo + 10 andares).
// O elevador passa pelos estados: parado → fechando → movendo → abrindo → esperando → fechando…
window.addEventListener('load', () => {
  const elevador = document.querySelector('.elevator');
  const porta = elevador.querySelector('.elevator-door');
  const andares = [...document.querySelectorAll('.building .floor')];
  const botoes = document.querySelectorAll('.handle button');
  const display = document.querySelector('.display');

  const NOMES = ['Térreo', 'Primeiro andar', 'Segundo andar', 'Terceiro andar', 'Quarto andar',
    'Quinto andar', 'Sexto andar', 'Sétimo andar', 'Oitavo andar', 'Nono andar', 'Décimo andar'];

  const VELOCIDADE = 120;        // pixels por segundo
  const VELOCIDADE_PORTA = 60;   // pixels por segundo
  const PORTA_ABERTA = 1;        // largura da porta aberta (px)
  const PORTA_FECHADA = 34;      // largura da porta fechada (px)
  const TEMPO_ESPERA = 2000;     // tempo com a porta aberta (ms)
  const MARGEM_TOPO = 7;         // margin-top do elevador no CSS

  let destinos = [];             // números dos andares pedidos, na ordem
  let andarAtual = 0;
  let estado = 'parado';         // parado, fechando, movendo, abrindo, esperando
  let larguraPorta = PORTA_ABERTA;
  let esperaRestante = 0;
  let subindo = false;
  let instanteAnterior = performance.now();

  // Posição (offsetTop) que o elevador deve ter para estar alinhado com um andar
  const alturaDoAndar = (numero) => andares[numero].offsetTop + 5;

  function posicionarNoAndar(numero) {
    elevador.style.top = alturaDoAndar(numero) - MARGEM_TOPO + 'px';
  }

  // Começa no térreo, com a porta aberta
  posicionarNoAndar(0);
  porta.style.width = larguraPorta + 'px';

  botoes.forEach((botao) => {
    botao.addEventListener('click', () => {
      const pedido = Number(botao.dataset.setFloor);

      if (pedido === andarAtual && estado !== 'movendo') {
        // Apertou o andar em que já está: só abre a porta de novo
        estado = 'abrindo';
        return;
      }
      if (!destinos.includes(pedido)) destinos.push(pedido);
      if (estado === 'parado') estado = 'fechando';
    });
  });

  function atualizar(agora) {
    const segundos = (agora - instanteAnterior) / 1000;
    instanteAnterior = agora;

    switch (estado) {
      case 'abrindo':
        larguraPorta = Math.max(PORTA_ABERTA, larguraPorta - VELOCIDADE_PORTA * segundos);
        if (larguraPorta === PORTA_ABERTA) {
          estado = destinos.length ? 'esperando' : 'parado';
          esperaRestante = TEMPO_ESPERA;
        }
        break;

      case 'esperando':
        esperaRestante -= segundos * 1000;
        if (esperaRestante <= 0) estado = 'fechando';
        break;

      case 'fechando':
        larguraPorta = Math.min(PORTA_FECHADA, larguraPorta + VELOCIDADE_PORTA * segundos);
        if (larguraPorta === PORTA_FECHADA) estado = destinos.length ? 'movendo' : 'parado';
        break;

      case 'movendo': {
        const destino = destinos[0];
        const alvo = alturaDoAndar(destino);
        const posicao = elevador.offsetTop;
        const passo = VELOCIDADE * segundos;

        if (Math.abs(alvo - posicao) <= passo) {
          posicionarNoAndar(destino);
          andarAtual = destino;
          destinos.shift();
          estado = 'abrindo';
        } else {
          const direcao = Math.sign(alvo - posicao);
          subindo = direcao < 0; // no CSS, quanto menor o top, mais alto o andar
          elevador.style.top = posicao + direcao * passo - MARGEM_TOPO + 'px';
          andarAtual = andarMaisProximo(elevador.offsetTop);
        }
        break;
      }
    }

    porta.style.width = larguraPorta + 'px';
    atualizarBotoes();
    atualizarDisplay();
    requestAnimationFrame(atualizar);
  }

  function andarMaisProximo(posicao) {
    let maisProximo = 0;
    andares.forEach((_, numero) => {
      if (Math.abs(alturaDoAndar(numero) - posicao) < Math.abs(alturaDoAndar(maisProximo) - posicao)) {
        maisProximo = numero;
      }
    });
    return maisProximo;
  }

  function atualizarDisplay() {
    let direcao = '';
    if (estado === 'movendo') direcao = subindo ? '▲ Subindo' : '▼ Descendo';
    display.innerHTML = '';
    display.append(NOMES[andarAtual]);
    if (direcao) display.append(document.createElement('br'), direcao);
  }

  function atualizarBotoes() {
    botoes.forEach((botao) => {
      botao.classList.toggle('active', destinos.includes(Number(botao.dataset.setFloor)));
    });
  }

  requestAnimationFrame(atualizar);
});
