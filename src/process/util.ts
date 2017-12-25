import { ChildProcess } from 'child_process';


export function readLine(out: any, callback)  {
  let _stdoutBuf: string = '';

  out.on('data', (data: any) => {

    let buf = _stdoutBuf;
    buf += data;
    let newline;
    while ((newline = buf.indexOf('\n')) > -1) {
      const response = buf.slice(0, newline);
      buf = buf.slice(newline + 1);
      callback(response);
    }
    _stdoutBuf = buf;
  });
}
