# Diagnóstico de login administrativo na Vercel — 27 de agosto de 2026

## Achados verificados

O projeto `painel-iptv-proxy` está com implantação de produção marcada como **Ready** e domínio público configurado. A página de variáveis do projeto indica que `DATABASE_URL` foi inserida pela integração Neon para Production e Preview. As variáveis `NEXUS_ADMIN_USERNAME`, `NEXUS_ADMIN_PASSWORD` e `JWT_SECRET` também aparecem configuradas para Production, sem exposição de seus valores.

## Diagnóstico provável

Essas variáveis não criam o registro administrativo automaticamente durante o deploy. O administrador somente passa a existir quando `pnpm db:migrate` cria as tabelas e `pnpm db:seed` grava o hash de `NEXUS_ADMIN_PASSWORD` na tabela `users`. Sem esses comandos, todo login é rejeitado corretamente.

Também foi observada uma implantação de produção baseada no commit `8e57e35`. Antes de testar a correção, confirmar que a implantação selecionada contém a versão atual do repositório e que os comandos de migração/seed foram executados com a mesma `DATABASE_URL` de Production.

## Atualização de variáveis de reprodução

Foram cadastradas, como segredos e sem retenção de seus valores nesta documentação, as variáveis `PLAYBACK_TICKET_SECRET` e `PLAYBACK_EDGE_RESOLVER_SECRET` em Production e Preview. A Vercel informou que uma nova implantação é necessária para que esses valores sejam carregados pelas funções. A variável `PLAYBACK_EDGE_BASE_URL` permanece deliberadamente pendente, pois depende da URL pública real do Worker Cloudflare de mídia.

O redeploy de Production foi iniciado após a confirmação explícita do usuário. A conclusão da implantação deve ser verificada antes de testar qualquer rota publicada.

O redeploy foi concluído com status **Ready**. A implantação continua baseada no commit `8e57e35`; essa versão deve ser considerada ao investigar qualquer divergência entre o código preparado localmente e a produção publicada.

## Falha tRPC confirmada

Uma consulta direta à rota publicada `/api/trpc/auth.me` retornou a página da Vercel `404: NOT_FOUND`, antes de alcançar o Express ou a autenticação. Portanto, as credenciais administrativas e o Neon não são a causa imediata dessa falha: a função catch-all em `api/[...path].ts` não está sendo exposta pela implantação atualmente publicada. A correção deve garantir que a Vercel reconheça e encaminhe todas as rotas `/api/*` para a função Node única antes de executar migração ou seed.

Na página de recursos da implantação, a Vercel confirmou a publicação de uma única função Node em `/api/[...path]`. Entretanto, o acesso literal a esse caminho respondeu `FUNCTION_INVOCATION_FAILED`, enquanto `/api/trpc/auth.me` respondeu `404`. Isso confirma que a função existe, mas o roteamento dinâmico não a encaminha e a inicialização do handler requer análise separada. A correção deve usar uma rota estável de função e um rewrite explícito de `/api/:path*`, mantendo apenas uma função publicada.

O log de runtime identificou a causa da falha de inicialização: `ERR_MODULE_NOT_FOUND` ao importar `/var/task/server/app` a partir da função. A função publicada existe, mas o runtime ESM da Vercel não recebeu a dependência relativa do handler no formato resolvível. A correção deve empacotar o Express e suas dependências locais junto à função de API, em vez de depender de uma importação relativa externa após o deploy.
