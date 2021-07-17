import { sortBy, uniq } from "lodash";
import {
  LinterGetOffensesFunction,
  LinterParseFixOutputFunction,
  LinterGetIgnoreLinePragmaFunction,
  LinterGetIgnoreFilePragmaFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";
import { debug } from "../helpers/debug";

export interface EslintOffense {
  ruleId: string;
  severity: number;
  message: string;
  line: number;
  column: number;
  nodeType: string;
  messageId: string;
  endLine?: number;
  endColumn?: number;
  fix?: EslintFix;
}

interface EslintFix {
  text: string;
  range: [number, number];
}

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  1: LinterOffenseSeverity.warning,
  2: LinterOffenseSeverity.error,
};

const filePragmaRegex = /^\/\*\s*eslint-disable(?:\s+(.*?))?\s*\*\/$/;
const linePragmaRegex = /^\s*\/\/\s*eslint-disable-next-line(?:\s+(.*?))?$/;

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result[0].messages.forEach((item: EslintOffense) => {
    const offense: LinterOffense = {
      uri,
      lineStart: Math.max(0, item.line - 1),
      columnStart: Math.max(0, item.column - 1),
      lineEnd: Math.max(0, (item.endLine ?? item.line) - 1),
      columnEnd: Math.max(0, (item.endColumn ?? item.column) - 1),
      code: item.ruleId,
      message: item.message,
      severity: offenseSeverity[item.severity],
      source: "eslint",
      correctable: Boolean(item.fix),
      docsUrl: getDocsUrl(item.ruleId),
    };

    if (item.fix) {
      offense.inlineFix = {
        replacement: item.fix.text,
        offset: item.fix.range,
      };
    }

    offenses.push(offense);
  });

  return offenses;
};

export const getIgnoreLinePragma: LinterGetIgnoreLinePragmaFunction = ({
  line,
  code,
  indent,
}) => {
  const { text } = line;
  const matches = text.match(linePragmaRegex);
  let existingRules: string[] = [code];

  if (matches) {
    existingRules.push(
      ...(matches[1] ?? "").split(",").map((item) => item.trim()),
    );
  }

  const pragma = [
    `${indent}// eslint-disable-next-line`,
    sortBy(uniq(existingRules)).join(", "),
  ].join(" ");

  if (matches) {
    return pragma;
  }

  if (line.number === 0 && text.match(filePragmaRegex)) {
    return [text, pragma].join("\n");
  }

  return line.number === 0
    ? [pragma, text].join("\n")
    : [text, pragma].join("\n");
};

export const getIgnoreFilePragma: LinterGetIgnoreFilePragmaFunction = ({
  line,
  code,
}) => {
  const { text } = line;
  const matches = text.match(filePragmaRegex);
  let existingRules: string[] = [];

  if (matches) {
    existingRules = (matches[1] ?? "").split(/,\s*/);
  }

  existingRules.push(code);

  const pragma = [
    "/* eslint-disable",
    sortBy(uniq(existingRules)).join(", "),
    "*/",
  ].join(" ");

  if (matches) {
    return pragma;
  }

  return line.number === 0
    ? [pragma, text].join("\n")
    : [text, pragma].join("\n");
};

export const parseFixOutput: LinterParseFixOutputFunction = ({
  input,
  stdout,
}) => {
  try {
    return JSON.parse(stdout)[0].output;
  } catch (error) {
    debug("error while parsing fix output", error);
    return input;
  }
};

function getDocsUrl(code: string) {
  if (!code) {
    return undefined;
  }

  const [plugin, rule] = code.split("/");

  const urls: { [key: string]: string } = {
    standard: `https://eslint.org/docs/rules/${plugin}`,
    "@typescript-eslint": `https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/${rule}.md`,
    react: `https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/${rule}.md`,
    "jsx-a11y": `https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/${rule}.md`,
    jest: `https://github.com/jest-community/eslint-plugin-jest/blob/HEAD/docs/rules/${rule}.md`,
    import: `https://github.com/benmosher/eslint-plugin-import/blob/HEAD/docs/rules/${rule}.md`,
    unicorn: `https://github.com/sindresorhus/eslint-plugin-unicorn/blob/HEAD/docs/rules/${rule}.md`,
    lodash: `https://github.com/wix/eslint-plugin-lodash/blob/HEAD/docs/rules/${rule}.md`,
  };

  if (rule) {
    return urls[plugin];
  }

  return urls.standard;
}
