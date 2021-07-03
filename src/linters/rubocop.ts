import { sortBy, uniq } from "lodash";
import { camelizeObject } from "../helpers/camelizeObject";
import {
  LinterGetOffensesFunction,
  LinterParseFixOutputFunction,
  LinterGetIgnoreEolPragmaFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

type RubocopOffense = {
  copName: string;
  message: string;
  correctable: boolean;
  severity: string;
  location: {
    startLine: number;
    startColumn: number;
    lastLine: number;
    lastColumn: number;
  };
};

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  warning: LinterOffenseSeverity.warning,
  convention: LinterOffenseSeverity.error,
  error: LinterOffenseSeverity.error,
  info: LinterOffenseSeverity.information,
  fatal: LinterOffenseSeverity.error,
  refactor: LinterOffenseSeverity.information,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result.files[0]?.offenses.forEach((offense: RubocopOffense) => {
    offense = camelizeObject(offense);

    offenses.push({
      uri,
      lineStart: Math.max(0, offense.location.startLine - 1),
      columnStart: Math.max(0, offense.location.startColumn - 1),
      lineEnd: Math.max(0, offense.location.lastLine - 1),
      columnEnd: Math.max(0, offense.location.lastColumn - 1),
      code: offense.copName,
      message: offense.message,
      severity: offenseSeverity[offense.severity],
      source: "rubocop",
      correctable: offense.correctable,
      docsUrl: getDocsUrl(offense.copName),
    });
  });

  return offenses;
};

export const getIgnoreEolPragma: LinterGetIgnoreEolPragmaFunction = ({
  line,
  code,
}) => {
  const regexp = /^(.*?)(?:\s*#\s*rubocop:disable\s*(.*?))?$/;
  const matches = line.text.match(regexp);
  let existingRules: string[] = [code];

  if (matches && matches[2]) {
    existingRules = matches[2].split(",").map((item) => item.trim());
  }

  existingRules = uniq(sortBy(existingRules));

  return [
    (matches && matches[1]) || "",
    "# rubocop:disable",
    existingRules.join(", "),
  ].join(" ");
};

export const parseFixOutput: LinterParseFixOutputFunction = ({ stdout }) =>
  stdout;

function getDocsUrl(code: string) {
  const parts = (code ?? "").split("/");

  if (parts.length === 0) {
    return undefined;
  }

  const department = (
    parts.length > 2 ? parts.slice(0, 2).join("") : parts[0]
  ).toLowerCase();

  const anchor = code.toLowerCase().replace(/\//g, "");

  const urls: { [key: string]: string } = {
    bundler: `https://docs.rubocop.org/rubocop/cops_bundler.html#${anchor}`,
    gemspec: `https://docs.rubocop.org/rubocop/cops_gemspec.html#${anchor}`,
    layout: `https://docs.rubocop.org/rubocop/cops_layout.html#${anchor}`,
    lint: `https://docs.rubocop.org/rubocop/cops_lint.html#${anchor}`,
    metrics: `https://docs.rubocop.org/rubocop/cops_metrics.html#${anchor}`,
    migration: `https://docs.rubocop.org/rubocop/cops_migration.html#${anchor}`,
    minitest: `https://docs.rubocop.org/rubocop-minitest/cops_minitest.html#${anchor}`,
    naming: `https://docs.rubocop.org/rubocop/cops_naming.html#${anchor}`,
    performance: `https://docs.rubocop.org/rubocop-performance/cops_performance.html#${anchor}`,
    rails: `https://docs.rubocop.org/rubocop-rails/cops_rails.html#${anchor}`,
    rspec: `https://docs.rubocop.org/rubocop-rspec/cops_rspec.html#${anchor}`,
    rspeccapybara: `https://docs.rubocop.org/rubocop-rspec/cops_rspec/capybara.html#${anchor}`,
    rspecfactorybot: `https://docs.rubocop.org/rubocop-rspec/cops_rspec/factorybot.html#${anchor}`,
    rspecrails: `https://docs.rubocop.org/rubocop-rspec/cops_rspec/rails.html#${anchor}`,
    security: `https://docs.rubocop.org/rubocop/cops_security.html#${anchor}`,
    sorbet: `https://github.com/Shopify/rubocop-sorbet/blob/master/manual/cops_sorbet.md#${anchor}`,
    style: `https://docs.rubocop.org/rubocop/cops_style.html#${anchor}`,
  };

  return urls[department];
}
