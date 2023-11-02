import { uniq } from "lodash";
import { EOL } from "os";
import * as vscode from "vscode";

/* eslint-disable @typescript-eslint/naming-convention */
import {
  LinterGetIgnoreFilePragmaFunction,
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

import { debug } from "../helpers/debug";

type ClippyEntry = {
  reason: string;
  message: ClippyMessage;
  target?: {
    src_path: string;
  };
};

type ClippyMessageChildren = {
  level: string;
  message: string;
  spans?: ClippySpan[];
};

type ClippyMessage = {
  spans: ClippySpan[];
  message: string;
  level: string;
  children?: ClippyMessageChildren[];
  code?: {
    code: string;
  };
};

type ClippySpan = {
  message: string;
  column_start: number;
  column_end: number;
  line_start: number;
  line_end: number;
  file_name: string;
  suggested_replacement?: string;
};

function sameLocation(one: ClippySpan, other: ClippySpan): boolean {
  return (
    one.line_start === other.line_start &&
    one.line_end === other.line_end &&
    one.column_start === other.column_start &&
    one.column_end === other.column_end
  );
}

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const entries = stdout
    .split(/\r?\n/g)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        debug("error parsing JSON:", line);
        return null;
      }
    })
    .filter(Boolean);
  const offenses: LinterOffense[] = [];

  entries.forEach((entry: ClippyEntry) => {
    const src = "file://" + (entry.target?.src_path ?? "");

    if (entry.reason !== "compiler-message") {
      debug("unexpected reason:", entry.reason);
      return;
    }

    if (!entry.message.spans?.length) {
      debug("no spans:", entry);
      return;
    }

    const help = entry.message.children?.find(
      (child) =>
        child.level === "help" &&
        child.message.includes("for further information visit"),
    );
    const spans = entry.message.spans;
    const code = entry.message.code?.code ?? "";
    const level = entry.message.level;
    const message = entry.message.message;
    const docsUrl = help?.message.match(/(?<url>https?:\/\/[^\s]+)[.?!]?/)
      ?.groups?.url;

    spans.forEach((span: ClippySpan) => {
      const {
        line_start: lineStart,
        line_end: lineEnd,
        column_start: columnStart,
        column_end: columnEnd,
        file_name: fileName,
      } = span;

      if (!uri.toString().endsWith(span.file_name.replace('\\', "/"))) {
        debug("span is for another file", { span_file_name: span.file_name, current_document: uri.toString() });
        return;
      }

      let replacement = "";

      const range = {
        start: { line: lineStart - 1, column: columnStart - 1 },
        end: { line: lineEnd - 1, column: columnEnd - 1 },
      };

      const offense: LinterOffense = {
        severity:
          level === "warning"
            ? LinterOffenseSeverity.warning
            : LinterOffenseSeverity.error,
        message,
        lineStart: range.start.line,
        lineEnd: range.end.line,
        columnStart: range.start.column,
        columnEnd: range.end.column,
        correctable: Boolean(replacement),
        docsUrl,
        code,
        uri,
        source: "cargo-clippy",
      };

      if (replacement) {
        offense.inlineFix = {
          replacement,
          start: range.start,
          end: range.end,
        };
      }

      offenses.push(offense);
    });
  });

  return Promise.resolve(offenses);
};

export const getIgnoreFilePragma: LinterGetIgnoreFilePragmaFunction = async ({
  line,
  code,
  document,
}) => {
  const text = document.getText();
  const matches = text.match(
    /^(?<block>#!\[allow\((?<names>[\s\w\d_,:]+)\)\])/g,
  );

  const block = matches ? matches[0] : "";
  const lines = block.split(EOL);
  const linesCount = lines.length;
  const editor = vscode.window.activeTextEditor;
  let names = (RegExp.$2 ?? "")
    .split(/,\s*/gm)
    .map((name) => name.trim())
    .filter(Boolean);

  await editor?.edit((edit) => {
    edit.delete(
      new vscode.Range(
        0,
        0,
        Math.max(0, linesCount - 1),
        Math.max(0, (lines[0] ?? "").length - 1),
      ),
    );
  });

  names.push(code);
  names = uniq(names);
  names.sort();

  let pragma = `#![allow(${names.join(", ")})]`;

  if (pragma.length > 80) {
    pragma = "#![allow(\n";
    pragma += names.map((name) => `    ${name}`).join(",\n");
    pragma += "\n)]";
  }

  return pragma + (matches ? "" : EOL + line.text);
};
