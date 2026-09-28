/**
 * CSV encoding for the signups export.
 *
 * Two separate problems, both of which the previous `join(',')` had.
 *
 * 1. **Quoting.** A comma, a double quote or a newline inside a field
 *    silently corrupts the row. The `source` field is free text from a form,
 *    so all three are reachable by anyone who fills in the form, and a broken
 *    export of the launch list is discovered at the worst possible moment.
 *
 * 2. **Formula injection.** A spreadsheet treats a cell beginning `=`, `+`,
 *    `-`, `@`, tab or carriage return as a formula. `=HYPERLINK(...)` in a
 *    field is a live link the moment the file is opened, and other functions
 *    can reach the network. Quoting does not help: the quotes are stripped
 *    before the cell is evaluated. The field has to be made non-formulaic,
 *    which is what the leading apostrophe does.
 *
 * The apostrophe is visible in the cell, which is the accepted trade: a
 * visibly odd value beats one that runs.
 */

/** Characters a spreadsheet treats as the start of a formula. */
const FORMULA_LEADERS = ['=', '+', '-', '@', '\t', '\r']

/**
 * Neutralises a value that a spreadsheet would evaluate.
 *
 * Applied before quoting, because quoting does not prevent evaluation.
 */
export function defuseFormula(value: string): string {
  if (value.length === 0) return value
  return FORMULA_LEADERS.includes(value[0]) ? `'${value}` : value
}

/**
 * Encodes one field: defuse, then quote if the content requires it.
 *
 * A field is quoted when it contains a comma, a double quote, a carriage
 * return or a newline. Inner double quotes are doubled, per RFC 4180.
 */
export function csvField(value: unknown): string {
  const raw =
    value === null || value === undefined
      ? ''
      : value instanceof Date
        ? value.toISOString()
        : String(value)

  const defused = defuseFormula(raw)

  // A leading apostrophe was added, so the value now starts with a character
  // Excel reads literally; it still needs quoting if it holds a separator.
  if (/[",\r\n]/.test(defused)) {
    return `"${defused.replace(/"/g, '""')}"`
  }
  return defused
}

/** One row. */
export function csvRow(values: readonly unknown[]): string {
  return values.map(csvField).join(',')
}

/**
 * A complete document.
 *
 * Rows are joined with CRLF, which RFC 4180 specifies and which Excel on
 * Windows needs to avoid reading the whole file as one line.
 */
export function csvDocument(
  header: readonly string[],
  rows: readonly (readonly unknown[])[],
): string {
  return [csvRow(header), ...rows.map(csvRow)].join('\r\n')
}
