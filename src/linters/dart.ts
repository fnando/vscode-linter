import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

const offenseSeverity = {
  info: LinterOffenseSeverity.information,
  warning: LinterOffenseSeverity.warning,
  error: LinterOffenseSeverity.error,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const items = stdout
    .split(/\r?\n/g)
    .map((line) =>
      line
        .trim()
        .match(/^(error|warning|info) - .*?:(\d+):(\d+) - (.+) - (.+)$/),
    )
    .filter(Boolean) as RegExpMatchArray[];
  const offenses: LinterOffense[] = [];

  items.forEach((matches) => {
    const [_, severity, line, column, message, code] = matches;

    const lineStart = Math.max(0, Number(line) - 1);
    const columnStart = Math.max(0, Number(column) - 1);

    offenses.push({
      severity: offenseSeverity[severity as keyof typeof offenseSeverity],
      message,
      lineStart,
      lineEnd: lineStart,
      columnStart,
      columnEnd: columnStart,
      correctable: false,
      code,
      uri,
      source: "dart",
      docsUrl: `https://dart.dev/tools/linter-rules#${code}`,
    });
  });

  return Promise.resolve(offenses);
};
