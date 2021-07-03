import {
  LinterGetOffensesFunction,
  LinterParseFixOutputFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

export interface MarkdownlintOffense {
  fileName: string;
  lineNumber: number;
  ruleNames: string[];
  ruleDescription: string;
  ruleInformation: string;
  errorDetail: null;
  errorContext: string;
  errorRange: null | number[];
  fixInfo: null;
}

export const getOffenses: LinterGetOffensesFunction = ({ stderr, uri }) => {
  const result: MarkdownlintOffense[] = JSON.parse(stderr);
  const offenses: LinterOffense[] = [];

  result.forEach((offense: MarkdownlintOffense) => {
    const [colStart, colEnd] = offense.errorRange ?? [0, 0];
    offenses.push({
      uri,
      lineStart: Math.max(0, offense.lineNumber - 1),
      columnStart: Math.max(0, colStart - 1),
      lineEnd: Math.max(0, offense.lineNumber - 1),
      columnEnd: Math.max(0, colEnd - 1),
      code: offense.ruleNames[0],
      message: offense.ruleDescription,
      severity: LinterOffenseSeverity.error,
      source: "markdownlint",
      correctable: false,
      docsUrl: offense.ruleInformation,
    });
  });

  return offenses;
};

export const parseFixOutput: LinterParseFixOutputFunction = ({ stdout }) =>
  stdout;
