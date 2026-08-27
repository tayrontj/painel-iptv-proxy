# Auditoria do backlog — Videlis

**Data:** 27 de agosto de 2026  
**Escopo:** conferência do arquivo `todo.md` contra a implementação, os testes recentes e as limitações ainda registradas no projeto.

O backlog possui **77 itens**: **30 concluídos** e **47 pendentes**. A auditoria reabriu os itens 17, 18 e 25 porque, embora existam bases de webhook, consulta e mudança de plano, faltam respectivamente a visualização persistente do histórico PIX, a autenticação final do aplicativo e a regra que condiciona upgrade/downgrade à aprovação da cobrança. Os itens pendentes não foram removidos nem foram convertidos artificialmente em concluídos. Eles representam recursos que ainda não estão implementados de ponta a ponta, que dependem de variáveis de produção ou que precisam de validação operacional com Neon, Vercel e Cloudflare.

| Prioridade | Bloco de trabalho | Itens pendentes | Critério objetivo de conclusão |
| --- | --- | --- | --- |
| P0 | Infraestrutura de produção e identidade | 56–63 | Login próprio validado com administrador criado pelo seeder; migração aplicada no Neon; função consolidada publicada; Worker autenticado configurado; nome e rota de ativos atualizados. |
| P0 | Segurança administrativa | 50–54 | Todas as consultas e mutações administrativas negam acesso sem sessão local válida; interface não monta dados protegidos; testes cobrem EPG, VOD, PIX, integrações e M3U. |
| P1 | Compatibilidade Xtream e aplicativo oficial | 29–35, 38–43 | Credenciais numéricas únicas autenticam app/Xtream; senha pode ser rotacionada; perfil e dispositivos funcionam; API retorna catálogo, programas, episódios e sinalização etária sem PIN. |
| P1 | Monitoramento e entrega de canais | 65–70 | Saúde por link persiste no banco; origem/fallback é selecionado por resultado; conteúdo indisponível é excluído; Worker dispara a rotina a cada 5 minutos sem sobreposição. |
| P1 | EPG com cobertura real | 71–72 | XMLTV é lido incrementalmente; fim de cobertura e erros persistem; o Worker somente aciona fontes elegíveis pela regra de cobertura. |
| P2 | Cadastros e dados de produto restantes | 26, 37, 40–49 | Histórico PIX aparece; TMDB por ID funciona; edição de cliente está disponível; o contrato de canais inclui todos os metadados e cabeçalhos por link. |

## Situação validada nesta auditoria

As telas administrativas, modais internos, seleção de planos, cadastro VOD episódico, formulário avançado de canais, links de mídia livres, cobertura EPG por regra e estilos de controles foram implementados em diferentes etapas e cobertos por verificações de tipos, build ou testes unitários. Esses itens continuam no histórico como concluídos. A auditoria, contudo, reabriu recursos cujo fluxo de ponta a ponta ainda depende de credenciais finais, persistência completa ou aprovação de cobrança.

Por outro lado, a implementação de produção ainda não deve ser considerada pronta. O projeto possui a migração PostgreSQL inicial, o driver Neon e um seeder idempotente preparados, mas **não deve ser marcado como migrado** antes de a migração ser aplicada à base Neon e o seeder executar nela. A autenticação local também permanece pendente de validação real até que o administrador seja criado pelo seeder com as variáveis de produção.

As rotinas automáticas de monitoramento e EPG possuem parte da lógica e do contrato preparados, mas não estão operacionais em produção: falta a persistência completa de saúde, o endpoint consolidado protegido e a configuração do Worker. Portanto, os itens de monitoramento, Xtream e API oficial continuam explicitamente abertos.

## Próxima ordem de execução

A ordem segura é: concluir a rota `/storage` e escolher o nome; finalizar a função única para Vercel e o contrato do Worker; preparar a documentação de variáveis; aplicar a migração e executar o seeder quando o Neon for conectado; validar login próprio; e, então, concluir Xtream, API do aplicativo, monitor e EPG em cima da infraestrutura efetiva.

> Regra adotada: um item só poderá receber `[x]` após implementação, testes pertinentes e validação compatível com seu escopo. Recursos que dependem de ambiente externo continuarão `[ ]` até a validação no serviço configurado.
