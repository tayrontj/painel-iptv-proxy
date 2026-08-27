# Funções PostgreSQL no Neon — recomendação para o Videlis

## Resposta objetiva

**Sim.** O Neon fornece PostgreSQL e, portanto, suporta funções definidas pelo usuário, procedimentos e gatilhos escritos em PL/pgSQL. O comando `CREATE FUNCTION` e o comportamento de PL/pgSQL seguem o padrão do PostgreSQL. [1] [2]

Para o Videlis, a melhor regra é simples: usar uma função PostgreSQL apenas quando ela proteger uma **invariante transacional entre tabelas**. A API Vercel continua responsável por autenticação, autorização, integração externa, assinatura criptográfica e formatação das respostas; os Workers Cloudflare continuam responsáveis por agenda e transmissão de mídia.

| Responsabilidade | Melhor camada | Motivo |
| --- | --- | --- |
| Reservar uma vaga de tela e registrar o dispositivo | Função PostgreSQL | A reserva, a vaga disponível, o dispositivo e `used_screens` precisam mudar de maneira atômica. |
| Liquidar PIX aprovado e trocar plano | Função/procedimento PostgreSQL | A cobrança só pode ser reivindicada uma vez e a atualização do plano precisa pertencer à mesma transação. |
| Adquirir ou liberar lock de monitor/EPG | SQL atômico ou função PostgreSQL curta | O lock já pertence ao banco; uma função só reduz repetição se houver mais de um chamador. |
| Consultar catálogo, perfil ou EPG | API Vercel + SQL normal | Regras de autorização e DTOs seguros evoluem com frequência e não devem ficar escondidos no banco. |
| Criar PIX, validar webhook, consultar Mercado Pago | API Vercel | Exige HTTP externo, segredos e validação HMAC. |
| Ler XMLTV, testar M3U8 e selecionar fallback | Worker Cloudflare + API | Exige rede, timeout e execução sequencial; não é trabalho do banco. |
| Resolver ticket e transmitir mídia | Gateway Cloudflare | O PostgreSQL não deve buscar nem transmitir mídia. |
| Assinar manifesto e verificar APK Android | API Vercel | A chave privada Ed25519 deve permanecer no ambiente de servidor, nunca em função SQL. |

## Funções que valem a pena depois da conexão Neon

### 1. Reserva atômica de tela

Hoje o servidor procura a vaga livre, insere o dispositivo e atualiza `used_screens`. Embora exista uma segunda tentativa para colisões, uma função como `videlis_register_device(...)` pode encapsular tudo em uma única transação: travar o cliente, descobrir a menor vaga disponível, inserir o hash da chave do dispositivo e atualizar o contador. Isso reduz a chance de duas autenticações simultâneas disputarem a última tela.

A implementação deve usar `SECURITY INVOKER` — o padrão do PostgreSQL — e ser chamada somente pela API autenticada. Não recomendo `SECURITY DEFINER` nesta fase, pois ele amplia o risco de elevação de privilégio caso permissões, `search_path` ou parâmetros sejam configurados incorretamente.

### 2. Liquidação atômica de cobrança PIX

A função `videlis_settle_pix_charge(provider_payment_id)` é a candidata mais valiosa. Ela deve obter a cobrança pendente com bloqueio de linha, marcar a cobrança como aprovada, aplicar o plano/ciclo solicitado e recalcular validade/telas na mesma transação. Caso o webhook seja reenviado, a função deve retornar que já foi processada e não aplicar a troca novamente.

> A função não recebe a notificação diretamente do Mercado Pago e não valida assinatura. A API continua validando `x-signature`, `data.id` e `x-request-id` antes de chamar o banco.

### 3. Lock durável de agendamento

O Videlis já usa `scheduler_locks` com `INSERT ... ON CONFLICT ... WHERE locked_until <= now()`. Esse SQL já é atômico e suficiente. Pode virar `videlis_try_acquire_lock(name, lease_ms)` caso a mesma regra seja chamada por outros processos no futuro; não é prioridade, pois não traz ganho funcional imediato.

## O que não mover para funções PostgreSQL

Não recomendo deslocar autenticação administrativa, hash/verificação Xtream, geração de credenciais, criação ou consulta de PIX, parse de XMLTV, monitoramento de fontes, chamadas TMDB, emissão de tickets, reescrita HLS, gateway de mídia ou atualização Android. Essas atividades dependem de segredos, criptografia de aplicação, rede externa, políticas HTTP ou respostas específicas do cliente. Mantê-las na API/Workers permite timeout, observabilidade e controle de erro adequados sem transformar o banco em um servidor de integração.

Também não recomendo usar `pg_cron` para o monitor de cinco minutos. O Neon informa que esses jobs somente executam enquanto o compute está ativo e recomenda compute 24/7 ou scale-to-zero desativado. O Worker Cloudflare já definido para despertar a API preserva o comportamento no plano serverless. [3]

## Adoção incremental recomendada

Depois de conectar o Neon, primeiro aplicar as migrações existentes e o seeder. Em seguida, adicionar uma migração exclusiva para `videlis_register_device` e cobri-la com teste de concorrência. A segunda migração deve introduzir `videlis_settle_pix_charge`, acompanhada de teste de reenvio de webhook. Só então faz sentido substituir os trechos equivalentes de `server/db.ts` por chamadas SQL para as funções.

## Referências

[1] [Neon — PostgreSQL PL/pgSQL](https://neon.com/postgresql/plpgsql)

[2] [Neon — PostgreSQL CREATE FUNCTION](https://neon.com/postgresql/plpgsql/create-function)

[3] [Neon — extensões PostgreSQL: pg_cron](https://neon.com/docs/extensions/pg-extensions)
