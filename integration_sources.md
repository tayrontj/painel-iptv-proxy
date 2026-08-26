# Referências de Integração

## Mercado Pago — PIX

O fluxo previsto usa `POST /v1/payments` com `payment_method_id: "pix"`, `Authorization: Bearer`, uma chave de idempotência e dados do pagador. A resposta pendente pode conter `point_of_interaction.transaction_data.qr_code` e `qr_code_base64`, que devem ser exibidos apenas no aplicativo após a cobrança ser criada.

Fonte oficial: [PIX — Mercado Pago Developers](https://www.mercadopago.com.br/developers/en/docs/checkout-bricks/payment-brick/payment-submission/pix).

## Mercado Pago — Webhooks

O webhook deve confirmar recebimento rapidamente com `200` ou `201`, e o servidor deve consultar o pagamento informado antes de atualizar uma assinatura. As notificações de pagamento usam o tópico `payment`; a documentação também descreve a validação da origem por assinatura em integrações compatíveis.

Fonte oficial: [Webhooks — Mercado Pago Developers](https://www.mercadopago.com.br/developers/en/docs/your-integrations/notifications/webhooks).
