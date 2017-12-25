import { remote } from 'electron';
import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';
import { readLine } from '../../process/util';
import { Injectable, NgZone } from '@angular/core';

@Injectable()
export class FfmpegService {

  public isRecording: boolean = false;

  videoDevices: Array<any> = [];
  audioDevices: Array<any> = [];


  constructor(private zone: NgZone) {

  }

  listDevices() {

    const command = 'ffmpeg -f avfoundation -list_devices true -i ""';
    var dest = remote.app.getPath('userData') + '/electron-ffmpeg/ffmpeg';
    let isVideoDevice = true;
    const child: ChildProcess = spawn(dest, command.split(' '));


    readLine(child.stderr, (line: string) => {
      if (line.indexOf('AVFoundation video devices') != -1) {
        console.log('IS VIDEO!');
        isVideoDevice = true;
      } else if (line.indexOf('AVFoundation audio devices') != -1) {
        isVideoDevice = false;
      } else if (line.indexOf('AVFoundation input device') != -1) {
        console.log(line.substr(line.lastIndexOf(']') + 1));
        let deviceName: string = line.substr(line.lastIndexOf(']') + 1);
        let index = parseInt(line.substring(line.lastIndexOf('[') + 1, line.lastIndexOf(']')));
        console.log('Index ', index);

        if (isVideoDevice) {
          this.videoDevices.push({
            index: index,
            name: deviceName,
            selected: false
          });
        }
        if (!isVideoDevice) {
          this.audioDevices.push({
            index: index,
            name: deviceName,
            selected: false
          });
        }

      }
    });

    child.on('exit', () => {
      this.zone.run(() => {

      });
    });

  }


  recordingProcess: ChildProcess;

  stopRecording() {
    this.recordingProcess.kill();
  }

  startRecording() {
    this.isRecording = true;
    const selectedVideoDevice: any = this.videoDevices.filter((x) => x.selected)[0];
    const selectedAudioDevice: any = this.audioDevices.filter((x) => x.selected)[0];

    var dest = join(remote.app.getPath('userData'), 'electron-ffmpeg', 'output.mkv');
    let command = `-f avfoundation -capture_cursor 1 -capture_mouse_clicks 1 -i ${selectedVideoDevice.index}:${selectedAudioDevice.index} "${dest}" -y`;
    console.log('Command ', command);
    var ffmpeg = remote.app.getPath('userData') + '/electron-ffmpeg/ffmpeg';
    const child: ChildProcess = spawn('"' + ffmpeg + '"', command.split(' '), { shell: true });
    this.recordingProcess = child;
    child.stdout.on('data', (data) => console.log(data.toString()));
    child.stderr.on('data', (data) => console.log(data.toString()));
    child.on('exit', () => {
      this.isRecording = false;
    })
  }


}
