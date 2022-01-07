import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as process from "process";
import * as cache from "@actions/cache";

import * as util from "./util";

// based on https://cristianadam.eu/20200113/speeding-up-c-plus-plus-github-actions-using-ccache/

async function install() {
  if (process.platform === "darwin") {
    await exec.exec("brew install ccache");
  } else if (process.platform === "win32") {
    await exec.exec("pacman --noconfirm --needed -S ccache");
  } else {
    await exec.exec("sudo apt-get install -y ccache");
  }
}

async function restore() {
  let restoreKey = `ccache-`;

  let inputKey = core.getInput("key");
  if (inputKey) {
    restoreKey += `${inputKey}-`;
  }

  const restoreKeys = [
    restoreKey
  ];
  
  const key = restoreKey + new Date().toISOString();

  const paths = [
    '.ccache'
  ]; 

  const restoredWith = await cache.restoreCache(paths, key, restoreKeys);
  if (restoredWith) {
    core.info(`Restored from cache key "${restoredWith}".`);
  } else {
    core.info("No cache found.");
  }
}

async function configure(ccache: string) {
  let ghWorkSpace = process.env.GITHUB_WORKSPACE!;
  const maxSize = core.getInput('max-size');

  const msys2 = await util.isMsys2();
  if (msys2) {
    // convert this path to posix path via cygpath
    ghWorkSpace = await util.win2Posix(ghWorkSpace);
  }
  
  core.info("Configure ccache");
  await exec.exec(ccache, ["--set-config=cache_dir=" + ghWorkSpace + "/.ccache"]);
  await exec.exec(ccache, ["--set-config=max_size=" + maxSize]);
  await exec.exec(ccache, ["--set-config=compression=true"]);

  core.info("Ccache config:");
  await exec.exec(ccache, ["-p"]);
}

async function run() : Promise<void> {
  try {
    let ccache = await util.which("ccache");
    if (!ccache) {
      core.info("Install ccache");
      await install();
      ccache = await util.which("ccache", true);
    }

    await restore();
    await configure(ccache!);

    await exec.exec(ccache!, ["-z"]);
  } catch (error) {
    core.setFailed(`Restoring cache failed: ${error}`);
  }
}

run();

export default run;
