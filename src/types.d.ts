import { LinterConfig } from "vscode-linter-api";

export type Linters = {
  [key: string]: LinterConfig;
};

export type Config = {
  enabled: boolean;
  debug: boolean;
  linters: Linters;
};
