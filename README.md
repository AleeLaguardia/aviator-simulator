# Aviator Simulator

Simulador do jogo **Aviator** (crash game) com arquitetura cliente-servidor e algoritmo **Provably Fair**. Saldo fictício, sem dinheiro real — projeto educacional.

> Server-authoritative state, comunicação em tempo real via WebSocket (Socket.io), curva exponencial renderizada em Canvas a 60 FPS.

## Stack

**Backend** (`server/`)
- Node.js + TypeScript
- Express + Socket.io
- `crypto` nativo para o sistema Provably Fair (HMAC-SHA256)

**Frontend** (`client/`)
- Next.js 15 (App Router) + React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion (animações de UI)
- Lucide React (ícones)
- Canvas API (gráfico + avião + partículas)

## Arquitetura

- **Server-authoritative**: o backend dita o multiplicador atual e o momento exato do crash. O frontend apenas escuta e renderiza.
- **Loop do jogo**: `setInterval` a 50ms calcula `multiplicador(t) = e^(0.06·t)` e emite via WebSocket pra todos os clientes simultaneamente.
- **Validação no servidor**: saldo, apostas e cashouts são todos validados no backend — impossível trapacear pelo console do navegador.
- **Provably Fair**: o servidor publica o `SHA-256(seed)` antes da rodada e revela a `seed` original quando o avião cai. O jogador pode verificar que o ponto de crash foi derivado de `max(1, 99 / (100 − X))` com `X` derivado da seed.

## Como rodar

```bash
npm install
npm run dev                # sobe os dois (server + client)

# ou separadamente
npm run dev:server         # http://localhost:4100
npm run dev:client         # http://localhost:3100
```

## Features

- Dois slots de aposta independentes (como o Aviator real)
- Auto-cashout configurável por slot
- Pré-aposta para a próxima rodada (quando a atual já começou)
- Depósito fictício pelo header
- Multiplicadores coloridos por tier (azul < 2x, roxo 2–10x, rosa ≥ 10x)
- Histórico das últimas 25 rodadas com hash da seed
- Painel de verificação Provably Fair (hash + seed revelada)
- Lista de jogadores apostando em tempo real
- Screen shake no canvas quando o multiplicador passa de 10x
- Trilha de partículas atrás do avião

## Provably Fair — como verificar

1. Antes da rodada, o servidor publica `hash = SHA-256(serverSeed)`
2. O multiplicador final é calculado a partir de `HMAC-SHA256(serverSeed, nonce)`
3. Quando o avião cai, a `serverSeed` original é revelada
4. Qualquer um pode recomputar `SHA-256(serverSeed)` e comparar com o hash publicado antes — se baterem, prova que o servidor não manipulou o resultado depois das apostas feitas

## Aviso

Este é um projeto **educacional**. Não há dinheiro real envolvido, é apenas uma simulação para estudo de jogos crash, WebSockets e renderização em Canvas.
