function getLighthouseTempDir({
  platform,
  projectDirectory,
  systemTempDirectory,
}) {
  const baseDirectory =
    platform === "win32"
      ? projectDirectory.replace(/[\\/]+$/, "")
      : systemTempDirectory.replace(/\/+$/, "");
  return platform === "win32"
    ? `${baseDirectory}\\.lighthouseci\\tmp`
    : `${baseDirectory}/nii-plants-lhci`;
}

module.exports = { getLighthouseTempDir };
