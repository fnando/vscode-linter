import { LinterConfig } from "vscode-linter-api";

export type Linters = {
  [key: string]: LinterConfig;
};

export type Config = {
  enabled: boolean;
  cache: boolean;
  debug: boolean;
  linters: Linters;
};
