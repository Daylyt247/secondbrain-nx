import { joinPathFragments, readJson, type Tree } from '@nx/devkit';
import { isUsingTsSolutionSetup } from '../typescript/ts-solution-setup';
import { getPackageJsonModuleFormat } from './module-format';

/**
 * Determine whether a project should be treated as ESM for the purpose of
 * emitting `.ts` config and source files (e.g. choosing between
 * `__filename`/`__dirname` and `import.meta.dirname`, or `require()` and
 * `import` for sibling subpath imports).
 *
 * Resolution order:
 * 1. TS solution workspaces always answer `true` - each project's
 *    package.json is expected to declare `"type": "module"`, even when
 *    the project's own package.json hasn't been written yet at the
 *    moment a generator is making this decision.
 * 2. Otherwise read the project's package.json `type` field.
 * 3. Fall back to the workspace-root package.json `type` field.
 *
 * Returns `true` for `"type": "module"`, `false` otherwise. The
 * package.json mapping is shared with `detect-module-format` via
 * `getPackageJsonModuleFormat`.
 */
export function isEsmProject(tree: Tree, projectRoot: string): boolean {
  if (isUsingTsSolutionSetup(tree)) {
    return true;
  }
  const projectPackageJsonPath = joinPathFragments(projectRoot, 'package.json');
  const packageJson = tree.exists(projectPackageJsonPath)
    ? readJson(tree, projectPackageJsonPath)
    : readJson(tree, 'package.json');
  return getPackageJsonModuleFormat(packageJson) === 'esm';
}
