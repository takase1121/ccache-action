import * as core from "@actions/core";
import * as cache from "@actions/cache";
import * as exec from "@actions/exec";

import * as util from "./util"

async function run() : Promise<void> {
  try{
    const ccache = await util.which("ccache");
    core.info("Ccache stats:");
    let verbosity = '';
    const inputVerbose = core.getInput("verbose");
    switch (inputVerbose) {
        case '0':
            break;

        case '1':
            verbosity = ' -v';
            break;

        case '2':
            verbosity = ' -vv';
            break;

        default:
            core.warning(`Invalid value "${inputVerbose}" of "verbose" option ignored.`);
    }

    await exec.exec(ccache!, [`-s${verbosity}`]);

    let restoreKey = `ccache-`;
    let inputKey = core.getInput("key");

    if (inputKey) {
      restoreKey += `${inputKey}-`;
    }

    const key = restoreKey + new Date().toISOString();
    const paths = [
      '.ccache'
    ];
  
    core.info(`Save cache using key "${key}".`);
    await cache.saveCache(paths, key);
  } catch (error) {
    core.setFailed(`Saving cache failed: ${error}`);
  }
}

run();

export default run;
