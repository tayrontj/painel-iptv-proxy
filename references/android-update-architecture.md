# Atualização nativa Android — Videlis

## Limites de plataforma confirmados

O aplicativo será distribuído diretamente como APK Android, sem Play Store e sem escopo iOS. O Android permite disponibilizar um APK por site próprio, mas o usuário precisa autorizar a instalação pela fonte escolhida. A partir do Android 8 (API 26), essa autorização é específica para cada fonte; o aplicativo deve verificar `canRequestPackageInstalls()` antes de iniciar o instalador. [1] [2]

O sistema não pode instalar uma atualização de modo silencioso em aparelhos comuns. O `PackageInstaller` aceita uma sessão de instalação ou atualização, porém a confirmação do usuário continua necessária, exceto em dispositivos gerenciados como device owner ou profile owner. [3]

Toda atualização deve preservar o mesmo `applicationId` e ser assinada pela mesma chave de release. O Android verifica a assinatura do APK instalado; uma chave perdida impede atualizações futuras. A assinatura v1, v2 e v3 maximiza a compatibilidade entre versões do Android. [4] [5]

## Alternativas consideradas

| Abordagem | Vantagens | Limitações | Decisão |
| --- | --- | --- | --- |
| Download direto no navegador | Implementação curta e sem código nativo de atualização | A experiência sai do aplicativo; menos controle sobre integridade e progresso | Alternativa mínima de contingência |
| Atualizador nativo com `PackageInstaller` | Consulta versão, baixa APK, verifica SHA-256 e abre a confirmação oficial do Android | Exige permissão por fonte e confirmação do usuário | Arquitetura escolhida |
| Instalação silenciosa corporativa | Sem confirmação a cada release | Exige aparelhos administrados como device/profile owner; não serve ao uso comum | Fora de escopo |

## Contrato proposto

O painel publicará uma única release Android ativa no Neon. O aplicativo consulta uma rota pública de versão, compara o `versionCode` local ao disponível e só exibe atualização quando houver versão superior compatível. O manifesto da versão deverá conter:

| Campo | Finalidade |
| --- | --- |
| `versionCode` e `versionName` | Comparação segura com a versão local |
| `minimumSupportedVersionCode` | Bloqueio de versões antigas quando necessário |
| `mandatory` | Informa se o aplicativo deve impedir o uso até atualizar |
| `apkUrl` e `apkSizeBytes` | Download do pacote assinado |
| `sha256` | Validação do pacote baixado antes de abrir o instalador |
| `releaseNotes` e `publishedAt` | Comunicação de release |
| `manifestSignature` | Assinatura Ed25519 do manifesto, validada contra chave pública embutida no app |

O APK deve ser hospedado em armazenamento de objetos/CDN com HTTPS. A URL do APK pode ser pública, mas a integridade será exigida por SHA-256 e assinatura do manifesto. A chave privada Ed25519 e qualquer credencial de armazenamento ficam somente em variáveis do servidor; a chave pública pode ser embutida no aplicativo Android.

## Fluxo Android

1. Na abertura e na tela de configurações, o app consulta a release publicada.
2. O app valida a assinatura do manifesto, compatibilidade de versão e política obrigatória.
3. Após aceite do usuário, o app baixa o APK em armazenamento privado, acompanha o progresso e calcula SHA-256.
4. Se o hash divergir, o arquivo é apagado e a instalação não é iniciada.
5. Se a fonte ainda não puder instalar APKs, o app abre a configuração oficial de permissão; após o retorno, o usuário confirma novamente.
6. O app abre uma sessão `PackageInstaller`, e o Android apresenta sua confirmação de atualização.
7. Depois da instalação, o Android valida que o APK mantém a assinatura de release compatível.

## Referências

[1] [Android Developers — Alternative distribution options](https://developer.android.com/distribute/marketing-tools/alternative-distribution)

[2] [Android Developers — Android 8.0 behavior changes](https://developer.android.com/about/versions/oreo/android-8.0-changes)

[3] [Android Developers — PackageInstaller](https://developer.android.com/reference/android/content/pm/PackageInstaller)

[4] [Android Developers — Sign your app](https://developer.android.com/studio/publish/app-signing)

[5] [Android Open Source Project — App signing](https://source.android.com/docs/security/features/apksigning)
