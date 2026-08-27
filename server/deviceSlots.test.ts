import { describe, expect, it } from "vitest";
import { findAvailableDeviceSlot } from "./db";

describe("reserva de vagas de tela", () => {
  it("bloqueia uma nova tela ao atingir o limite", () => {
    expect(findAvailableDeviceSlot(2, [1, 2])).toBeUndefined();
  });

  it("reutiliza a vaga liberada quando um dispositivo é removido", () => {
    expect(findAvailableDeviceSlot(2, [2])).toBe(1);
  });
});
