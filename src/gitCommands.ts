/**
 * Git commands.
 *
 * This module is not named git.ts, in order to keep it distinct from the VS Code Git extension
 * module of the same name and for which there are types under src/api/git.d.ts .
 *
 * There should be be confusion in the Git class here matching the name of one in the VS Code
 * module, since that is not directly used in this project.
 */
import util = require('util');
import childProcess = require('child_process');

import { getWorkspaceFolder } from './workspace';

const exec = util.promisify(childProcess.exec);

/** Run git CLI command and return output. **/
export function execute(cwd: string, subcommand?: string, options: string[] = []) {
  const command = `git ${subcommand} ${options.join(' ')}`;

  return exec(command, { cwd });
}

/**
 * Run git diff-index with flags and return output.
 *
 * This will return both staged and unstaged changes. Pass '--cached' to only use staged changes.
 * Always excludes untracked files.
 *
 * Remove any empty lines, whether because of no changes or just the way the command-line
 * data comes in or is split.
 *
 * Note the output already seems always to have no color from my testing, but the
 * no color flagged is added to be safe.
 */
async function diffIndex(options: string[] = []): Promise<Array<string>> {
  const { stdout, stderr } = await execute(getWorkspaceFolder(), 'diff-index', [
    '--name-status',
    '--find-renames',
    '--find-copies',
    '--no-color',
    ...options,
    'HEAD'
  ]);

  if (stderr) {
    console.debug('stderror for git diff-index command:', stderr);
  }

  return stdout.split('\n').filter(line => line !== '');
}

/**
 * List files changed and how they changed.
 *
 * Look for diff description of staged files, otherwise fall back to all files.
 * Always excludes untracked files - make sure to stage a file so it becomes tracked, especially
 * in the case of a rename.
 *
 * Returns using the type of the underlying `diffIndex` function.
 */
export async function getChanges() {
  const stagedChanges = await diffIndex([
    '--cached'
  ]);

  if (stagedChanges.length) {
    console.debug('Found staged changes');
    return stagedChanges;
  }
  else {
    console.debug('Staging area is empty. Using unstaged files.');
    const allChanges = await diffIndex();
    if (!allChanges.length) {
      console.debug('Could not find any changed files');
    }
    return allChanges;
  }
}

/**
 * Run git status short and return output.
 *
 * Ignore untracked and remove color.
 *
 * UNUSED - This was used before diffIndex was introduced to this project.
 */
async function status(options: string[] = []) {
  return execute(getWorkspaceFolder(), 'status', [
    '--short',
    '-uno',
    '--porcelain',
    ...options
  ]);
}
