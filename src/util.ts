import * as io from "@actions/io";
import * as exec from "@actions/exec";

export async function exec_program(program: string, args?: string[]) {
  const buf: Buffer[] = [];
  await exec.exec(program, args, {
    listeners: {
      stdout: (data: Buffer) => buf.push(data)
    }
  });
  return Buffer.concat(buf).toString();
}

export async function win2Posix(path: string) {
  return await exec_program("msys2", ["-c", `cygpath -a ${path}`]);
}

export async function posix2Win(path: string) {
  return await exec_program("msys2", ["-c", `cygpath -w -a ${path}`]);
}

export async function isMsys2() {
  return await io.which("msys2");
}

export async function which(program: string, force?: boolean) {
  const msys2 = await isMsys2();
  if (msys2) {
    try {
      const msysPath = await exec_program("msys2", ["-c", `which ${program}`]);
      return await posix2Win(msysPath);
    } catch (e) {
      if (force)
        throw e;
      else
        return undefined;
    }
  }
  return await io.which(program, force);
}
