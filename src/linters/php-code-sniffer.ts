import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

export interface CodeSnifferPayload {
  files: { [key: string]: CodeSnifferFilePayload };
}

export interface CodeSnifferFilePayload {
  messages: CodeSnifferOffense[];
}

export interface CodeSnifferOffense {
  message: string;
  source: string;
  severity: number;
  fixable: boolean;
  type: string;
  line: number;
  column: number;
}

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  error: LinterOffenseSeverity.error,
  warning: LinterOffenseSeverity.warning,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result: CodeSnifferPayload = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  Object.values(result.files)[0].messages.forEach((offense) => {
    const lineStart = Math.max(0, offense.line - 1);
    const columnStart = Math.max(0, offense.column - 1);

    offenses.push({
      uri,
      lineStart,
      lineEnd: lineStart,
      columnStart,
      columnEnd: columnStart,
      message: offense.message,
      code: offense.source,
      source: "php-code-sniffer",
      correctable: offense.fixable,
      severity: offenseSeverity[offense.severity],
    });
  });

  return Promise.resolve(offenses);
};
