export function getIndent(line: string): string {
  const matches = line.match(/^(\s+)/);

  return matches ? matches[1] : "";
}
