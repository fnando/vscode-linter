import * as path from "path";
import * as fs from "fs";

export function read(filePath: string): unknown {
  try {
    const contents = fs.readFileSync(filePath);

    if (contents) {
      return JSON.parse(contents.toString());
    }
  } catch (error) {}

  return undefined;
}

export function write(filePath: string, data: unknown) {
  const parentDir = path.dirname(filePath);

  fs.mkdirSync(parentDir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
