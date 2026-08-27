# Auditoria PIX — Mercado Pago

**Data:** 27 de agosto de 2026.  
**Escopo:** criação de cobrança PIX pelo endpoint `v1/payments`, recuperação de status e processamento de notificações.

| Requisito oficial verificado | Estado antes da auditoria | Ajuste aplicado |
| --- | --- | --- |
| Criar pagamento PIX com `payment_method_id: "pix"` e chave de idempotência | Implementado. | Mantido. O backend gera uma chave única por tentativa. |
| Consultar o recurso do pagamento antes de alterar o estado interno | Implementado. | Mantido. O identificador recebido não decide o status da cobrança. |
| Declarar uma URL HTTPS de notificação na criação da cobrança | Ausente. | A criação adiciona `notification_url` quando `MERCADO_PAGO_WEBHOOK_URL` estiver configurada com HTTPS. |
| Validar `x-signature` por HMAC-SHA256 antes de processar | Ausente. | Adicionado manifesto oficial `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, comparação em tempo constante e resposta `401` para assinatura inválida. |
| Identificar o recurso e a solicitação assinada | O código aceitava corpo/queries alternativas e não exigia o identificador da requisição. | Agora exige `data.id` e `x-request-id`, usados tanto no manifesto HMAC como na consulta do pagamento. |
| Responder dentro da janela de confirmação | Consulta sem limite explícito. | A consulta do status passou a limitar-se a 10 segundos, preservando margem frente aos 22 segundos descritos na documentação. |
| Lidar com reentregas | A atualização por `providerPaymentId` é idempotente quando o mesmo status é aplicado novamente. | Mantido; falta validar com pagamento de teste quando as credenciais forem configuradas. |

## Configuração posterior

Quando a Vercel estiver configurada, defina `MERCADO_PAGO_WEBHOOK_URL` com a URL HTTPS pública de `/api/webhooks/mercado-pago` e `MERCADO_PAGO_WEBHOOK_SECRET` com a assinatura secreta gerada no painel do Mercado Pago. Esses valores não são inseridos no repositório e não devem ser expostos ao React.

O endpoint continua a usar a credencial de acesso Mercado Pago previamente cifrada no servidor para criar e consultar pagamentos. A assinatura webhook é uma credencial distinta, mantida apenas no ambiente de produção.

## Referências

[1] [Mercado Pago — Webhooks](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/notifications/webhooks)  
[2] [Mercado Pago — Configure optional notifications](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/optional-notifications)
