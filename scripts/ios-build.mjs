import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const iosDir = path.join(rootDir, "ios", "App");
const buildDir = path.join(rootDir, "build", "ios");
const publicDir = path.join(rootDir, "ios", "App", "App", "public");

const defaultUnsignedArchivePath = path.join(buildDir, "App-unsigned.xcarchive");
const defaultUnsignedIpaPath = path.join(buildDir, "PureWater-unsigned.ipa");
const defaultSignedArchivePath = path.join(buildDir, "App-signed.xcarchive");
const defaultExportPath = path.join(buildDir, "development-export");
const defaultExportOptionsPath = path.join(
  rootDir,
  "scripts",
  "ExportOptions.development.plist",
);

const command = process.argv[2];
const args = process.argv.slice(3);

function bin(name) {
  return process.platform === "win32" ? `${name}.cmd` : name;
}

function quoteWindowsArg(value) {
  if (value.length === 0) {
    return '""';
  }

  if (!/[\s"]/u.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
}

function run(cmd, cmdArgs, options = {}) {
  const cwd = options.cwd ?? rootDir;
  const result =
    process.platform === "win32"
      ? spawnSync(
          process.env.ComSpec ?? "cmd.exe",
          ["/d", "/s", "/c", [cmd, ...cmdArgs].map(quoteWindowsArg).join(" ")],
          {
            cwd,
            stdio: "inherit",
            shell: false,
          },
        )
      : spawnSync(cmd, cmdArgs, {
          cwd,
          stdio: "inherit",
          shell: false,
        });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function ensureMac() {
  if (process.platform !== "darwin") {
    console.error("This command must run on macOS because it calls Xcode tools.");
    process.exit(1);
  }
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function clearPath(targetPath) {
  rmSync(targetPath, { recursive: true, force: true });
}

function syncIosAssets() {
  run(bin("npm"), ["run", "build"]);
  run(bin("npx"), ["cap", "sync", "ios"]);
}

function prepareMacProject() {
  ensureMac();
  syncIosAssets();
  run("xcodegen", ["generate"], { cwd: iosDir });
  run("pod", ["install"], { cwd: iosDir });
}

function getAppName() {
  try {
    const configText = readFileSync(
      path.join(rootDir, "capacitor.config.ts"),
      "utf8",
    );
    const match = configText.match(/appName:\s*"([^"]+)"/);
    return match?.[1] ?? "App";
  } catch {
    return "App";
  }
}

function injectBundledAssets(archivePath) {
  const appBundlePath = path.join(
    archivePath,
    "Products",
    "Applications",
    "App.app",
  );
  const targetPublicPath = path.join(appBundlePath, "public");

  if (!existsSync(appBundlePath)) {
    console.error(`Archived app bundle was not found: ${appBundlePath}`);
    process.exit(1);
  }

  clearPath(targetPublicPath);
  cpSync(publicDir, targetPublicPath, { recursive: true });
}

function packageUnsignedIpa(archivePath, ipaPath) {
  const stagingDir = path.join(buildDir, "unsigned-staging");
  const payloadDir = path.join(stagingDir, "Payload");
  const archivedAppPath = path.join(
    archivePath,
    "Products",
    "Applications",
    "App.app",
  );

  clearPath(stagingDir);
  ensureDir(payloadDir);
  cpSync(archivedAppPath, path.join(payloadDir, "App.app"), {
    recursive: true,
  });
  clearPath(ipaPath);
  run("zip", ["-qry", ipaPath, "Payload"], { cwd: stagingDir });
}

function archiveUnsigned() {
  prepareMacProject();

  const archivePath = args[0] ?? defaultUnsignedArchivePath;
  const ipaPath = args[1] ?? defaultUnsignedIpaPath;

  ensureDir(path.dirname(archivePath));
  ensureDir(path.dirname(ipaPath));
  clearPath(archivePath);

  run("xcodebuild", [
    "-workspace",
    path.join("ios", "App", "App.xcworkspace"),
    "-scheme",
    "App",
    "-configuration",
    "Release",
    "-sdk",
    "iphoneos",
    "-archivePath",
    archivePath,
    "CODE_SIGNING_ALLOWED=NO",
    "CODE_SIGNING_REQUIRED=NO",
    'CODE_SIGN_IDENTITY=""',
    "clean",
    "archive",
  ]);

  injectBundledAssets(archivePath);
  packageUnsignedIpa(archivePath, ipaPath);

  console.log("");
  console.log(`Unsigned archive: ${archivePath}`);
  console.log(`Unsigned ipa: ${ipaPath}`);
  console.log(`App name: ${getAppName()}`);
}

function archiveSigned() {
  prepareMacProject();

  const archivePath = args[0] ?? defaultSignedArchivePath;

  ensureDir(path.dirname(archivePath));
  clearPath(archivePath);

  run("xcodebuild", [
    "-workspace",
    path.join("ios", "App", "App.xcworkspace"),
    "-scheme",
    "App",
    "-configuration",
    "Release",
    "-sdk",
    "iphoneos",
    "-archivePath",
    archivePath,
    "-allowProvisioningUpdates",
    "clean",
    "archive",
  ]);

  console.log("");
  console.log(`Signed archive: ${archivePath}`);
  console.log("If signing fails, open ios/App/App.xcworkspace in Xcode and fix Team/Profile first.");
}

function exportDevelopment() {
  ensureMac();

  const archivePath = args[0] ?? defaultSignedArchivePath;
  const exportPath = args[1] ?? defaultExportPath;
  const exportOptionsPath = args[2] ?? defaultExportOptionsPath;

  ensureDir(exportPath);

  run("xcodebuild", [
    "-exportArchive",
    "-archivePath",
    archivePath,
    "-exportPath",
    exportPath,
    "-exportOptionsPlist",
    exportOptionsPath,
    "-allowProvisioningUpdates",
  ]);

  console.log("");
  console.log(`Exported files: ${exportPath}`);
}

function printHelp() {
  console.log("Usage: node scripts/ios-build.mjs <command> [args]");
  console.log("");
  console.log("Commands:");
  console.log("  sync");
  console.log("    Build web assets and run 'npx cap sync ios'.");
  console.log("");
  console.log("  prepare-mac");
  console.log("    Sync assets, regenerate the Xcode project, and install CocoaPods.");
  console.log("");
  console.log("  archive-unsigned [archivePath] [ipaPath]");
  console.log("    Build an unsigned xcarchive and zip it into an unsigned ipa.");
  console.log("");
  console.log("  archive-signed [archivePath]");
  console.log("    Build a signed Release archive after Xcode signing is configured.");
  console.log("");
  console.log("  export-development [archivePath] [exportPath] [exportOptionsPlist]");
  console.log("    Export a signed development ipa from a signed xcarchive.");
}

switch (command) {
  case "sync":
    syncIosAssets();
    break;
  case "prepare-mac":
    prepareMacProject();
    break;
  case "archive-unsigned":
    archiveUnsigned();
    break;
  case "archive-signed":
    archiveSigned();
    break;
  case "export-development":
    exportDevelopment();
    break;
  default:
    printHelp();
    process.exit(command ? 1 : 0);
}
