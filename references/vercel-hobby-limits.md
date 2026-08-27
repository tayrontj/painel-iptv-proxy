# Limites relevantes da Vercel Hobby

Consulta em 27 de agosto de 2026 às páginas oficiais da Vercel.

| Recurso | Limite Hobby relevante | Impacto para o Nexus Stream |
| --- | --- | --- |
| Invocações de Function | 1.000.000 incluídas por mês | Consolidar a API em um único handler e evitar chamadas de polling no cliente. |
| Active CPU | 4 CPU-horas incluídas por mês | Responder cedo e deixar streaming pesado fora da Vercel. |
| Memória | até 2 GB / 1 vCPU por função | Evitar carregar XMLTV inteiro, listas M3U grandes ou mídia em memória. |
| Duração de função | até 300 s | Não usar a função como proxy contínuo de HLS/VOD. |
| Payload de request/response | 4,5 MB | Paginar catálogo/EPG e fazer leitura incremental. |
| Cron | no máximo uma vez por dia; precisão de até uma hora | O monitor de canais a cada 5 min não pode depender de cron nativo no Hobby. |

## Diretriz arquitetural

O frontend será estático e a API administrativa, autenticação própria, webhook PIX, API do aplicativo e exportação Xtream serão agrupados sob um único handler Node em `/api/[...path]`. Isso reduz a contagem de funções criadas e mantém uma única inicialização do cliente PostgreSQL Neon por instância. As rotas internas continuarão distintas por URL, mas não gerarão funções separadas.

O streaming de mídia não será retransmitido pela Vercel. A aplicação retornará URLs de reprodução autorizadas ou redirecionará para a origem selecionada, evitando duração, tráfego e payload incompatíveis com o plano Hobby. Sincronização EPG e monitoramento frequente serão acionados por um Cloudflare Worker que faça `POST` autenticado para um único endpoint interno; no Hobby, o cron nativo é diário.

## Agendamento externo com Cloudflare Worker

Um único Cloudflare Worker usará o handler `scheduled()` com dois gatilhos cron UTC: `*/5 * * * *` para monitoramento de links de canal e `0 * * * *` para avaliação de EPG por cobertura. Ambos chamarão a mesma URL Vercel, diferenciados pelo campo `job` no corpo JSON. O endpoint verificará um segredo de agendamento, exigirá hora UTC de disparo e preservará locks duráveis no PostgreSQL para ignorar sobreposições.

No plano gratuito de Workers, o Worker possui até 100.000 requisições/dia, 10 ms de CPU por execução e 50 subrequisições por chamada. Como ele só encaminhará uma requisição `fetch` para a API Vercel, o fluxo se mantém leve. A rotina de verificação, por sua vez, será limitada no servidor a lotes pequenos e retomáveis: o Worker nunca percorre links de mídia nem lê XMLTV diretamente.

## Fontes oficiais

- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/limits
- https://vercel.com/docs/cron-jobs/usage-and-pricing
- https://vercel.com/docs/functions/limitations
- https://developers.cloudflare.com/workers/configuration/cron-triggers/
- https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/
- https://developers.cloudflare.com/workers/platform/limits/
