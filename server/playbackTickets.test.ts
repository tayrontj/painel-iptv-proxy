import { describe, expect, it } from "vitest";
import { createPlaybackTicket, readPlaybackTicket } from "./playbackTickets";

describe("tickets de reprodução", () => {
  it("vincula o ticket à sessão global de um cliente e ao hash de um consumidor", async () => {
    process.env.PLAYBACK_TICKET_SECRET = "segredo-de-teste-para-ticket";
    const consumerKeyHash = "b".repeat(64);
    const signed = await createPlaybackTicket({ resource: "channel", itemId: 9, customerId: 42, consumerKeyHash, quality: "FHD" });
    await expect(readPlaybackTicket(signed)).resolves.toEqual({ resource: "channel", itemId: 9, customerId: 42, consumerKeyHash, quality: "FHD" });
  });

  it("rejeita ticket sem cliente ou consumidor, mesmo que tenha assinatura válida", async () => {
    process.env.PLAYBACK_TICKET_SECRET = "segredo-de-teste-para-ticket";
    const incomplete = await createPlaybackTicket({ resource: "vod", itemId: 12 } as never);
    await expect(readPlaybackTicket(incomplete)).resolves.toBeUndefined();
  });
});
