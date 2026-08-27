/** Aceita qualquer formato de mídia; o servidor apenas exige uma URL HTTP(S). */
export function isMediaSourceUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
