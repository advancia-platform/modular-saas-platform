import { readFileSync, writeFileSync } from "fs";
import path from "path";
import semver from "semver";

type DepSection = "dependencies" | "devDependencies";

type MatrixEntry = {
  workspace: string;
  section: DepSection;
  version: string;
};

type UpdateRecord = {
  workspace: string;
  section: DepSection;
  dependency: string;
  from: string;
  to: string;
};

const rootDir = path.resolve(__dirname, "..");
const workspaceDirs = ["backend", "frontend"];
const applyChanges = process.argv.includes("--apply") || process.argv.includes("-a");
const includeDevDeps = process.argv.includes("--include-dev");
const targetSections: DepSection[] = includeDevDeps
  ? ["dependencies", "devDependencies"]
  : ["dependencies"];

function readPackageJson(pkgPath: string) {
  try {
    const raw = readFileSync(pkgPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Unable to read package.json at ${pkgPath}: ${(error as Error).message}`);
  }
}

const workspaces = workspaceDirs.map((dir) => {
  const pkgPath = path.join(rootDir, dir, "package.json");
  const json = readPackageJson(pkgPath);
  return {
    dir,
    packagePath: pkgPath,
    json,
    changed: false,
  };
});

const matrix = new Map<string, MatrixEntry[]>();

for (const workspace of workspaces) {
  const pkgJson = workspace.json;
  for (const section of ["dependencies", "devDependencies"] as DepSection[]) {
    const deps = pkgJson[section];
    if (!deps) continue;

    for (const [name, version] of Object.entries<string>(deps)) {
      const entry: MatrixEntry = {
        workspace: workspace.dir,
        section,
        version,
      };
      const existing = matrix.get(name) ?? [];
      existing.push(entry);
      matrix.set(name, existing);
    }
  }
}

const updates: UpdateRecord[] = [];
const skippedDev: string[] = [];
const reportLines: string[] = [];

function selectPreferred(entries: MatrixEntry[]): MatrixEntry {
  const comparable = entries.map((entry) => ({
    entry,
    parsed: semver.coerce(entry.version),
  }));

  const withSemver = comparable.filter((item) => item.parsed);
  if (withSemver.length === 0) {
    // Fall back to lexical ordering if nothing can be coerced
    return [...entries].sort((a, b) => a.version.localeCompare(b.version))[0];
  }

  withSemver.sort((a, b) => semver.rcompare(a.parsed!, b.parsed!));
  return withSemver[0].entry;
}

for (const [dependency, entries] of matrix.entries()) {
  if (entries.length < 2) continue;

  const bySection = new Map<DepSection, MatrixEntry[]>();
  for (const entry of entries) {
    const sectionEntries = bySection.get(entry.section) ?? [];
    sectionEntries.push(entry);
    bySection.set(entry.section, sectionEntries);
  }

  for (const [section, sectionEntries] of bySection.entries()) {
    const uniqueVersions = new Set(sectionEntries.map((entry) => entry.version));
    if (uniqueVersions.size <= 1) continue;

    const target = selectPreferred(sectionEntries);
    const affectable = targetSections.includes(section);

    const lineParts = sectionEntries.map(
      (entry) => `${entry.workspace}@${entry.version}`,
    );

    if (!affectable) {
      skippedDev.push(`${dependency} (${section}) -> ${lineParts.join(", ")}`);
      continue;
    }

    for (const entry of sectionEntries) {
      if (entry.version === target.version) continue;

      const workspace = workspaces.find((pkg) => pkg.dir === entry.workspace);
      if (!workspace) continue;

      if (!workspace.json[section]) continue;

      updates.push({
        workspace: entry.workspace,
        section,
        dependency,
        from: entry.version,
        to: target.version,
      });

      workspace.json[section][dependency] = target.version;
      workspace.changed = true;
    }

    reportLines.push(
      `${dependency} (${section}): ${lineParts.join(", ")} -> unified on ${target.version}`,
    );
  }
}

if (!applyChanges && reportLines.length === 0 && skippedDev.length === 0) {
  console.log("✔ Dependencies are already aligned across workspaces.");
} else {
  if (reportLines.length > 0) {
    console.log("Potential updates:");
    for (const line of reportLines) {
      console.log(`  - ${line}`);
    }
  }

  if (skippedDev.length > 0) {
    console.log("\nSkipped devDependencies (rerun with --include-dev to manage):");
    for (const line of skippedDev) {
      console.log(`  - ${line}`);
    }
  }
}

if (applyChanges) {
  if (updates.length === 0) {
    console.log("No changes applied; workspaces are already in sync for the selected sections.");
  } else {
    for (const workspace of workspaces) {
      if (!workspace.changed) continue;
      writeFileSync(
        workspace.packagePath,
        `${JSON.stringify(workspace.json, null, 2)}\n`,
        "utf8",
      );
    }

    console.log("\nApplied updates:");
    for (const update of updates) {
      console.log(
        `  - ${update.dependency} (${update.section}) in ${update.workspace}: ${update.from} -> ${update.to}`,
      );
    }

    console.log("\nNext steps:\n  npm install --workspaces\n");
  }
} else if (reportLines.length > 0) {
  console.log("\nDry run complete. To apply these changes run: npm run deps:sync -- --apply");
}

if (!includeDevDeps) {
  console.log(
    "\nNote: devDependencies were not modified. Pass --include-dev to manage them as well.",
  );
}
```}```
