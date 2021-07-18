/**
 * Message module.
 *
 * Create a commit message using text output that was generated by a `git` subcommand.
 */
import { parseDiffIndex } from "../git/parseOutput";
import { ACTION } from "../lib/constants";
import { friendlyFile, humanList } from "../lib/paths";
import { equal } from "../lib/utils";
import { lookupDiffIndexAction, moveOrRenameMsg } from "./action";
import { ActionKeys } from "./action.d";
import { countMsg } from "./count";

/**
 * Prepare a commit message based on a single changed file.
 *
 * A rename can be handled too - it just requires both the paths to be staged so that git collapses
 * D and A to a single R action.
 *
 * Using the variable name as 'from' is not really descriptive here but the logic works. It's also
 * possible to reverse 'from' and 'to' in `git status` and `git diff-index` output or handle just
 * the parseDiffIndex function to make sure 'to' is always set and 'from' is null if it is not a
 * move.
 *
 * Expects a single line string that came from a `git` subcommand and returns a value like 'Update
 * foo.txt'.
 */
export function oneChange(line: string) {
  const { x: actionChar, from, to } = parseDiffIndex(line);

  const action = lookupDiffIndexAction(actionChar);
  if (action === ACTION.R) {
    return moveOrRenameMsg(from, to);
  }

  const outputPath = friendlyFile(from);

  return `${action} ${outputPath}`;
}

/**
 * Describe an action and paths for a set of changed files.
 *
 * @param lines Expect one or more lines that came from a `git` subcommand.
 *
 * @return A human-readable sentence decribing file changes. e.g. 'update foo.txt and bar.txt'.
 */
export function namedFilesDesc(lines: string[]) {
  const changes = lines.map(line => parseDiffIndex(line));

  const actions = changes.map(item => item.x as ActionKeys);
  const action = equal(actions)
    ? lookupDiffIndexAction(actions[0])
    : ACTION.UNKNOWN;

  const pathsChanged = changes.map(item => item.from);
  const fileList = humanList(pathsChanged);

  if (action === ACTION.UNKNOWN) {
    const changes = lines.map(line => parseDiffIndex(line));

    return countMsg(changes);
  }

  return `${action} ${fileList}`;
}
