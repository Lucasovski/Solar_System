# 🪐 Sistema Solar Interativo

Demonstração interativa de aprendizado do sistema solar em HTML, CSS e JavaScript puros (sem dependências).

## Funcionalidades
- **Animação orbital** do Sol e dos oito planetas, com velocidades proporcionais aos períodos orbitais reais.
- **Clique em um planeta** (ou no Sol) para ver nome, tipo, diâmetro, distância do Sol (UA e km), período orbital, velocidade orbital, luas conhecidas e uma curiosidade.
- **Controles**: Reproduzir/Pausar (ou tecla Espaço), Reiniciar e slider de velocidade (0,1× a 20×; ou setas ← →).
- **Opções**: exibir/ocultar órbitas e nomes, ativar escala relativa de tamanho real entre os corpos.
- Barra comparativa de tamanhos clicável no painel lateral; Saturno com anéis; fundo estrelado animado.

## Como usar
Abra `index.html` diretamente no navegador, ou sirva a pasta localmente:

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## Arquivos
- `index.html` — estrutura da página
- `style.css` — tema espacial e layout responsivo
- `app.js` — dados dos planetas, motor de animação (canvas + DOM) e interação
