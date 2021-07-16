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
  fixInfo: {
    editColumn: number;
    deleteCount: number;
    insertText: string;
  } | null;
}

export const getOffenses: LinterGetOffensesFunction = ({ stderr, uri }) => {
  const result: MarkdownlintOffense[] = JSON.parse(stderr);
  const offenses: LinterOffense[] = [];

  result.forEach((item: MarkdownlintOffense) => {
    const [colStart, size] = item.errorRange ?? [0, 0];
    const lineStart = Math.max(0, item.lineNumber - 1);
    const columnStart = Math.max(0, colStart - 1);

    const offense: LinterOffense = {
      uri,
      lineStart,
      columnStart,
      lineEnd: lineStart,
      columnEnd: columnStart + size,
      code: item.ruleNames[0],
      message: [item.ruleDescription, item.errorDetail]
        .filter(Boolean)
        .join("\n"),
      severity: LinterOffenseSeverity.error,
      source: "markdownlint",
      correctable: Boolean(item.fixInfo),
      docsUrl: item.ruleInformation,
    };

    if (item.fixInfo) {
      offense.inlineFix = {
        replacement: item.fixInfo.insertText,
        start: { line: lineStart, column: item.fixInfo.editColumn - 1 },
        end: {
          line: lineStart,
          column: item.fixInfo.editColumn + (item.fixInfo.deleteCount - 1),
        },
      };
    }

    offenses.push(offense);
  });

  return offenses;
};

export const parseFixOutput: LinterParseFixOutputFunction = ({ stdout }) =>
  stdout;
