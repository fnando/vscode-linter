import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

const lineMatcher = /^stdin:(\d+):(\d+)-(\d+): \((.*?)\) (.+)$/;

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  return stdout
    .split(/\r?\n/)
    .map((line) => {
      const [_, lineNumber, colStartNumber, colEndNumber, code, message] =
        line.match(lineMatcher) ?? [];

      if (!message) {
        return;
      }

      const lineStart = Math.max(0, Number(lineNumber) - 1);
      const columnStart = Math.max(0, Number(colStartNumber) - 1);
      const columnEnd = Number(colEndNumber);

      return {
        uri,
        code,
        message,
        lineStart,
        columnStart,
        lineEnd: lineStart,
        columnEnd: columnEnd,
        source: "luacheck",
        correctable: false,
        severity: LinterOffenseSeverity.error,
        docsUrl: getDocsUrl(code),
      } as LinterOffense;
    })
    .filter(Boolean) as LinterOffense[];
};

function getDocsUrl(code: string): string {
  const baseUrl = "https://luacheck.readthedocs.io/en/stable/warnings.html#";

  if (code.startsWith("W1")) {
    return `${baseUrl}global-variables-1xx`;
  }

  if (code.match(/^W[2-3]/)) {
    return `${baseUrl}unused-variables-2xx-and-values-3xx`;
  }

  if (code.startsWith("W4")) {
    return `${baseUrl}shadowing-declarations-4xx`;
  }

  if (code.startsWith("W5")) {
    return `${baseUrl}control-flow-and-data-flow-issues-5xx`;
  }

  if (code.startsWith("W6")) {
    return `${baseUrl}formatting-issues-6xx`;
  }

  return "";
}
