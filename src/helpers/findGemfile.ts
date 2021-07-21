import * as path from "path";
import * as fs from "fs";

export function findGemfile(rootDir: string): string | undefined {
  return [
    path.join(rootDir, "Gemfile"),
    path.join(rootDir, "Gemfile.rb"),
    path.join(rootDir, "gems.rb"),
  ].find((entry) => fs.existsSync(entry));
}
