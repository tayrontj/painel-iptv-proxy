# Direção de Design — Nexus Stream

## Três possibilidades exploradas

| Tema | Introdução breve | Probabilidade |
| --- | --- | --- |
| **Sala de Controle Modernista** | Um painel técnico, silencioso e preciso, inspirado em salas de transmissão e no modernismo editorial. A informação é a matéria-prima e os estados operacionais recebem destaque inequívoco. | 0.07 |
| **Catálogo Broadcast** | Uma linguagem clara e clara, próxima a uma biblioteca de mídia premium, com superfícies claras, metadados generosos e organização por coleções. | 0.04 |
| **Sinal de Emergência** | Uma estética escura de alto contraste, com mensagens de estado contundentes, alertas cromáticos e ritmo de monitoramento em tempo real. | 0.09 |

## Abordagem escolhida: Sala de Controle Modernista

### Movimento de design

**Modernismo editorial aplicado a uma sala de operações.** A interface usa disciplina tipográfica, módulos assimétricos e sinais funcionais para transformar dados de streaming em uma leitura rápida, calma e confiável.

### Princípios fundamentais

1. **Prioridade operacional acima de decoração:** os estados de rede, conexão e disponibilidade devem ser identificáveis em poucos segundos.
2. **Densidade legível:** módulos compactos, mas com respiro e alinhamento rigoroso para não sobrecarregar a tomada de decisão.
3. **Sinalização intencional:** verde-água representa fluxo saudável; âmbar exige atenção; coral sinaliza risco ou interrupção.
4. **Precisão tátil:** cantos discretamente arredondados, bordas finas e microinterações curtas dão clareza sem aparência genérica.

### Filosofia de cor

O fundo grafite-azulado reduz fadiga em uso prolongado, como consoles de supervisão. Superfícies em ardósia criam planos de leitura, enquanto o **Verde Frequência `#43E6C2`** funciona como cor de marca e comunicação de fluxo ativo. Âmbar e coral são reservados a estados críticos, impedindo que a interface pareça decorativa.

### Paradigma de layout

Uma **coluna de navegação permanente** ancora as áreas de gestão. O conteúdo organiza-se em uma linha de telemetria no topo, uma faixa de métricas de leitura rápida e duas massas assimétricas: monitoramento de tráfego à esquerda e uma coluna de eventos/EPG à direita. A composição evita o painel centrado convencional e reproduz a lógica de uma mesa de operações.

### Elementos característicos

1. **Marca de frequência:** três barras horizontais desalinhadas dentro de um quadrado, sugerindo sinal, camadas de playlist e redundância.
2. **Trilhos de sinal pontilhados:** linhas discretas conectando marcadores em gráficos e listas de atividade.
3. **Pílulas de status compacto:** rótulos monoespaçados com ponto luminoso usado somente em estados em tempo real.

### Filosofia de interação

Toda interação deve confirmar a ação e revelar contexto: filtros mudam a leitura do quadro, opções de período atualizam o gráfico e os itens de navegação reorientam o conteúdo. Recursos não implementados exibem uma confirmação curta, sem fingir execução de backend.

### Animação

Entradas de cards surgem por opacidade e deslocamento vertical de 8 px, com cascata de 45 ms. Botões respondem com escala de `0.97` ao clique e transições de 160 ms. Indicadores ativos usam pulsação mínima, respeitando `prefers-reduced-motion`; não há loops decorativos ou brilho excessivo.

### Sistema tipográfico

**Manrope** é a fonte de interface, em pesos 400–800, para títulos e leitura geral. **IBM Plex Mono** marca códigos, status, timestamps e dados técnicos. Títulos usam espaçamento levemente negativo; rótulos têm caixa alta, corpo pequeno e tracking amplo. Nunca usar Inter.

### Essência da marca

**Nexus Stream é o centro de comando para operadores que precisam administrar, proteger e observar ecossistemas IPTV sem ruído.**

Personalidade: **precisa, resiliente, serena.**

### Voz da marca

Headlines são diretas e orientadas à situação; CTAs descrevem a ação exata; microcopy informa causa e consequência com concisão.

> “O sinal está estável. Continue acompanhando as exceções.”

> “Criar teste com validade controlada”

### Wordmark e logotipo

O símbolo é uma marca gráfica sem texto: três faixas horizontais de comprimentos distintos atravessam um quadrado de cantos suaves, como manifestos em camadas convergindo para um fluxo. O wordmark, quando usado, deve combinar Manrope em caixa alta com espaçamento largo, nunca uma fonte padrão sem tratamento.

### Cor de marca distintiva

**Verde Frequência — `#43E6C2`**
