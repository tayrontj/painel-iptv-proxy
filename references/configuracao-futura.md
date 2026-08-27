# Configuração futura de produção — Videlis

## Princípio de configuração

Nenhum valor sensível deve ser incluído no React, no repositório ou nos arquivos de exemplo. Os valores abaixo serão cadastrados posteriormente no ambiente de produção. A aplicação só lê segredos no servidor.

| Ambiente | Variável | Obrigatoriedade | Finalidade |
| --- | --- | --- | --- |
| Vercel | `NEON_DATABASE_URL` **ou** `POSTGRES_URL` | Obrigatória | Conexão PostgreSQL Neon. Use somente uma URL PostgreSQL válida. |
| Vercel | `NEXUS_ADMIN_USERNAME` | Obrigatória no primeiro seed | Nome do administrador local inicial. |
| Vercel | `NEXUS_ADMIN_PASSWORD` | Obrigatória no primeiro seed | Senha do administrador local; mínimo de 12 caracteres. |
| Vercel | `JWT_SECRET` | Obrigatória | Assinatura da sessão administrativa local. |
| Vercel | `NEXUS_SCHEDULER_SECRET` | Obrigatória para agenda | Autentica o Worker Cloudflare no endpoint interno de tarefas. |
| Vercel | `MERCADO_PAGO_WEBHOOK_URL` | Recomendada | URL pública de callback do Mercado Pago PIX. |
| Vercel | `MERCADO_PAGO_WEBHOOK_SECRET` | Obrigatória com webhook | Validação HMAC do webhook PIX. |
| Vercel | `ANDROID_UPDATE_MANIFEST_PRIVATE_KEY` | Obrigatória para publicar APK | Chave privada Ed25519 em PEM (com quebras como `\n`) ou PKCS#8 DER em Base64. |
| Vercel | `ANDROID_UPDATE_MANIFEST_KEY_ID` | Recomendada | Identificador público da chave de manifesto embutida no APK. |
| Vercel | `PLAYBACK_EDGE_BASE_URL` | Obrigatória para reprodução | Base HTTPS do Worker Cloudflare de mídia, sem caminho. |
| Vercel | `PLAYBACK_TICKET_SECRET` | Obrigatória para reprodução | Assina tickets HMAC de curta duração que não expõem URL de origem. |
| Vercel | `PLAYBACK_EDGE_RESOLVER_SECRET` | Obrigatória para reprodução | Autentica a resolução de origem solicitada exclusivamente pelo gateway. |
| Cloudflare Worker | `VERCEL_API_BASE_URL` | Obrigatória | URL HTTPS da aplicação Vercel, sem caminho de endpoint. |
| Cloudflare Worker | `NEXUS_SCHEDULER_SECRET` | Obrigatória | Mesmo segredo configurado na Vercel. |
| Cloudflare Worker de mídia | `VERCEL_API_BASE_URL` | Obrigatória | URL HTTPS da aplicação Vercel, usada somente para resolver um ticket. |
| Cloudflare Worker de mídia | `PLAYBACK_EDGE_RESOLVER_SECRET` | Obrigatória | Mesmo segredo da Vercel; nunca é devolvido ao cliente. |

## Ordem segura de ativação

1. Conectar a integração Neon na Vercel e disponibilizar a URL PostgreSQL.
2. Executar `pnpm db:migrate` uma única vez contra a base Neon.
3. Configurar as credenciais administrativas e executar `pnpm db:seed` uma única vez; o seeder é idempotente.
4. Configurar Mercado Pago e seu callback HTTPS no painel administrativo.
5. Configurar os dois secrets do Worker agendador e publicar o conteúdo de `infrastructure/cloudflare-scheduler`.
6. Configurar o Worker de mídia em `infrastructure/cloudflare-media-gateway`, bem como os três valores de reprodução listados acima.
7. Inserir a chave privada Ed25519 apenas no ambiente Vercel; embutir exclusivamente a chave pública correspondente no aplicativo Android.
8. Enviar um APK **já assinado** para o armazenamento/CDN escolhido e cadastrar seus metadados em **Atualizações Android**.

## Android fora da Play Store

O Android permite distribuição direta de APK por um site ou servidor próprio, desde que o usuário autorize a fonte de instalação. Para Android 8 ou superior, a permissão é concedida por fonte, e o aplicativo deve verificar `canRequestPackageInstalls()` antes de chamar o instalador. [1] [2]

O painel assina apenas o manifesto de atualização, enquanto o APK precisa continuar assinado pelo mesmo certificado de release. O Android recusa atualizações que não conservem a assinatura compatível; mantenha o keystore de release sob guarda segura e fora deste repositório. [3] [4]

> O fluxo nativo deve sempre solicitar a confirmação do instalador do Android. Instalação silenciosa somente é possível em aparelhos corporativos administrados como device owner ou profile owner. [5]

## Reprodução por gateway de mídia

As respostas M3U, Xtream e da API do aplicativo passam a devolver um ticket assinado com validade de dois minutos para o gateway Cloudflare. O gateway pede a resolução da origem ao endpoint interno Vercel autenticado por segredo, aplica `Origin` e `Referer` quando cadastrados e transmite a resposta ao player. Assim, a função Vercel não baixa o arquivo inteiro na memória nem mantém uma conexão de mídia aberta.

## Referências

[1] [Android Developers — Alternative distribution options](https://developer.android.com/distribute/marketing-tools/alternative-distribution)

[2] [Android Developers — Android 8.0 behavior changes](https://developer.android.com/about/versions/oreo/android-8.0-changes)

[3] [Android Developers — Sign your app](https://developer.android.com/studio/publish/app-signing)

[4] [Android Open Source Project — App signing](https://source.android.com/docs/security/features/apksigning)

[5] [Android Developers — PackageInstaller](https://developer.android.com/reference/android/content/pm/PackageInstaller)
