import { LinterConfig } from "vscode-linter-api";
import { getAvailableLinters } from "./getAvailableLinters";

export function getLinterConfig(name: string): LinterConfig {
  const availableLinters = getAvailableLinters();

  return availableLinters[name];
}
