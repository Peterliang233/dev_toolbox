export interface EscapeOptions {
  escapeBackslashes: boolean;
  escapeNewlines: boolean;
  escapeTabs: boolean;
  escapeDoubleQuotes: boolean;
  escapeSingleQuotes: boolean;
  escapeBackticks: boolean;
}

export const DEFAULT_ESCAPE_OPTIONS: EscapeOptions = {
  escapeBackslashes: true,
  escapeNewlines: true,
  escapeTabs: true,
  escapeDoubleQuotes: true,
  escapeSingleQuotes: false,
  escapeBackticks: false,
};

export function doEscape(text: string, options: EscapeOptions): string {
  let res = "";
  const len = text.length;
  
  for (let i = 0; i < len; i++) {
    const char = text[i];
    switch (char) {
      case "\\":
        res += options.escapeBackslashes ? "\\\\" : "\\";
        break;
      case "\n":
        res += options.escapeNewlines ? "\\n" : "\n";
        break;
      case "\r":
        res += options.escapeNewlines ? "\\r" : "\r";
        break;
      case "\t":
        res += options.escapeTabs ? "\\t" : "\t";
        break;
      case "\"":
        res += options.escapeDoubleQuotes ? "\\\"" : "\"";
        break;
      case "'":
        res += options.escapeSingleQuotes ? "\\'" : "'";
        break;
      case "`":
        res += options.escapeBackticks ? "\\`" : "`";
        break;
      default:
        res += char;
    }
  }
  return res;
}

export function doUnescape(text: string): string {
  // Match escaped sequences: \\, \n, \r, \t, \", \', \`
  return text.replace(/\\([\\nrbt"'`])/g, (match, char) => {
    switch (char) {
      case "\\": return "\\";
      case "n": return "\n";
      case "r": return "\r";
      case "t": return "\t";
      case "\"": return "\"";
      case "'": return "'";
      case "`": return "`";
      case "b": return "\b"; // support backspace too if standard
      default: return match;
    }
  });
}
