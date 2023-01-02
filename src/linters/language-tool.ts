import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";
import { getEditor } from "../helpers/getEditor";

export interface LanguageToolPayload {
  matches: LanguageToolOffense[];
}

export interface LanguageToolOffense {
  message: string;
  offset: number;
  length: number;
  context: LanguageToolContext;
  rule: LanguageToolRule;
  ignoreForIncompleteSentence: boolean;
  replacements: unknown[];
  contextForSureMatch: number;
}

export interface LanguageToolContext {
  text: string;
  offset: number;
  length: number;
}

export interface LanguageToolRule {
  id: string;
}

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result: LanguageToolPayload = JSON.parse(
    stdout.substr(stdout.indexOf("{")),
  );
  const offenses: LinterOffense[] = [];
  const editor = getEditor(uri);

  if (!editor) {
    return Promise.resolve([]);
  }

  result.matches.forEach((offense) => {
    const rangeStart = editor.document.positionAt(offense.offset);
    const rangeEnd = editor.document.positionAt(
      offense.offset + offense.length,
    );
    const lineStart = Math.max(0, rangeStart.line);
    const columnStart = Math.max(0, rangeStart.character);
    const lineEnd = Math.max(0, rangeEnd.line);
    const columnEnd = Math.max(0, rangeEnd.character);

    offenses.push({
      severity: LinterOffenseSeverity.warning,
      message: offense.message.trim(),
      lineStart,
      lineEnd,
      columnStart,
      columnEnd,
      correctable: offense.replacements.length > 0,
      code: offense.rule.id,
      uri,
      source: "language-tool",
    });
  });

  return Promise.resolve(offenses);
};
