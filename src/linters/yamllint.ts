import { sortBy, uniq } from "lodash";
import {
  LinterGetOffensesFunction,
  LinterGetIgnoreLinePragmaFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  warning: LinterOffenseSeverity.warning,
  error: LinterOffenseSeverity.error,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const offenses: LinterOffense[] = stdout
    .split(/\r?\n/)
    .map((line) => {
      const matches = line.match(/^.*?:(\d+):(\d+): \[(.*?)\] (.+) \((.*?)\)$/);

      if (!matches) {
        return;
      }

      const [_, lineNumber, column, severity, message, code] = matches;
      const lineStart = Math.max(0, Number(lineNumber) - 1);
      const columnStart = Math.max(0, Number(column) - 1);

      return {
        uri,
        lineStart,
        lineEnd: lineStart,
        columnStart,
        columnEnd: columnStart,
        severity: offenseSeverity[severity],
        message,
        code,
        source: "yamllint",
        correctable: false,
      };
    })
    .filter(Boolean) as unknown as LinterOffense[];

  return offenses;
};

export const getIgnoreLinePragma: LinterGetIgnoreLinePragmaFunction = ({
  line,
  code,
  indent,
}) => {
  const matches = line.text.match(/^\s*# yamllint disable-line(?: (.*?))?$/);
  let existingRules: string[] = [];

  if (matches && matches[1]) {
    existingRules = matches[1].split(/\s+/).map((item) => item.trim());
  }

  existingRules.push(`rule:${code}`);

  const pragma = `${indent}# yamllint disable-line ${sortBy(
    uniq(existingRules),
  ).join(", ")}`;

  if (matches) {
    return pragma;
  }

  return line.number === 0
    ? [pragma, line.text].join("\n")
    : [line.text, pragma].join("\n");
};
