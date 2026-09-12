export interface ToolchainCheck {
  name: string;
  ok: boolean;
  required: boolean;
  detail: string;
}

export function parseMajor(output: unknown): number | null;
export function requiresShell(command: string, platform?: string): boolean;
export function evaluateRequirement(
  name: string,
  output: unknown,
  minimumMajor: number,
  required?: boolean,
): ToolchainCheck;
export function summarizeChecks(checks: ToolchainCheck[]): {
  failures: number;
  warnings: number;
};
