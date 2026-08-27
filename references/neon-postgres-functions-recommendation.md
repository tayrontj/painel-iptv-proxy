# Funções PostgreSQL no Neon — recomendação para o Videlis

## Resposta objetiva

**Sim.** O Neon fornece PostgreSQL e, portanto, suporta funções definidas pelo usuário, procedimentos e gatilhos escritos em PL/pgSQL. O comando `CREATE FUNCTION` e o comportamento de PL/pgSQL seguem o padrão do PostgreSQL. [1] [2]

Para o Videlis, a melhor regra é simples: usar uma função PostgreSQL apenas quando ela proteger uma **invariante transacional entre tabelas**. A API Vercel continua responsável por autenticação, autorização, integração externa, assinatura criptográfica e formatação das respostas; os Workers Cloudflare continuam responsáveis por agenda e transmissão de mídia.

| Responsabilidade | Melhor camada | Motivo |
| --- | --- | --- |
| Reservar uma tela de reprodução global | Função PostgreSQL | A sessão ativa, a capacidade disponível e sua renovação precisam mudar de maneira atômica, independentemente do conteúdo reproduzido. |
| Liquidar PIX aprovado e trocar plano | Função/procedimento PostgreSQL | A cobrança só pode ser reivindicada uma vez e a atualização do plano precisa pertencer à mesma transação. |
| Adquirir ou liberar lock de monitor/EPG | SQL atômico ou função PostgreSQL curta | O lock já pertence ao banco; uma função só reduz repetição se houver mais de um chamador. |
| Consultar catálogo, perfil ou EPG | API Vercel + SQL normal | Regras de autorização e DTOs seguros evoluem com frequência e não devem ficar escondidos no banco. |
| Criar PIX, validar webhook, consultar Mercado Pago | API Vercel | Exige HTTP externo, segredos e validação HMAC. |
| Ler XMLTV, testar M3U8 e selecionar fallback | Worker Cloudflare + API | Exige rede, timeout e execução sequencial; não é trabalho do banco. |
| Resolver ticket e transmitir mídia | Gateway Cloudflare | O PostgreSQL não deve buscar nem transmitir mídia. |
| Assinar manifesto e verificar APK Android | API Vercel | A chave privada Ed25519 deve permanecer no ambiente de servidor, nunca em função SQL. |

## Funções que valem a pena depois da conexão Neon

### 1. Reserva atômica de sessão global de reprodução

O Videlis mantém a migração `0008_spooky_leech.sql` preparada com a função `videlis_acquire_playback_session(customer_id, consumer_key_hash, lease_seconds)`. Ela bloqueia a linha do cliente com `FOR UPDATE`, remove as sessões expiradas daquele cliente, renova a mesma sessão quando o mesmo consumidor volta a requisitar mídia e, somente para um novo consumidor, confere `screen_limit` antes de inserir a sessão.

> Uma **sessão de reprodução** é global ao cliente: ela não contém canal, filme, episódio, qualidade ou URL de origem. Assim, um cliente com duas telas pode assistir a conteúdos diferentes em duas telas, mas uma terceira reprodução é recusada, ainda que seja outro canal.

`customer_devices` continua sendo o cadastro de aparelhos autorizados pelo cliente; não é a fonte de verdade para conexões simultâneas. A sessão de reprodução armazena somente o hash de um identificador opaco de dispositivo/consumidor, `last_seen_at` e `expires_at`. A locação inicial é de 120 segundos, renovada no resolvedor privado a cada requisição de manifesto ou segmento HLS. Depois de inatividade, a vaga volta a ficar disponível sem necessidade de job agendado.

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

Depois de conectar o Neon, primeiro aplicar as migrações existentes — inclusive `0008_spooky_leech.sql`, que já contém `videlis_acquire_playback_session` — e o seeder. Em seguida, validar com duas requisições concorrentes na última vaga e com renovação do mesmo `consumer_key_hash`. A próxima função prioritária é `videlis_settle_pix_charge`, acompanhada de teste de reenvio de webhook. Só então faz sentido avaliar uma função separada para o cadastro persistente de dispositivos.

## Referências

[1] [Neon — PostgreSQL PL/pgSQL](https://neon.com/postgresql/plpgsql)

[2] [Neon — PostgreSQL CREATE FUNCTION](https://neon.com/postgresql/plpgsql/create-function)

[3] [Neon — extensões PostgreSQL: pg_cron](https://neon.com/docs/extensions/pg-extensions)
