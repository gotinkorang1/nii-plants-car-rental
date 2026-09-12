export interface LighthouseTempDirectoryOptions {
  platform: string;
  projectDirectory: string;
  systemTempDirectory: string;
}

export function getLighthouseTempDir(
  options: LighthouseTempDirectoryOptions,
): string;
