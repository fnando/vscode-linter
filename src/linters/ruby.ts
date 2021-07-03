import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

export const getOffenses: LinterGetOffensesFunction = ({ stderr, uri }) => {
  const lines = stderr.split(/\r?\n/g).filter((line) => line.trim());
  const offenses: LinterOffense[] = [];

  lines.forEach((line) => {
    const matches = line.match(
      /^[^:]+:(\d+):\s*(?:(warning|error):)?\s*(.*?)$/,
    );

    if (!matches) {
      return;
    }

    const lineNumber = matches[1];
    const severity = matches[2] ?? "error";
    const message = matches[3];
    const lineStart = Math.max(0, Number(lineNumber) - 1);

    offenses.push({
      severity:
        severity === "warning"
          ? LinterOffenseSeverity.warning
          : LinterOffenseSeverity.error,
      message,
      lineStart,
      lineEnd: lineStart,
      columnStart: 0,
      columnEnd: 0,
      correctable: false,
      code: "",
      uri,
      source: "ruby",
    });
  });

  return offenses;
};
