import { remote } from 'electron';
import { ChildProcess, spawn } from 'child_process';
import { join } from 'path';
import { readLine } from '../../process/util';
import { Injectable, NgZone } from '@angular/core';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { Application } from 'express';
import * as express from 'express';


@Injectable()
export class FfmpegService {

  public isRecording: boolean = false;

  videoDevices: Array<any> = [];
  audioDevices: Array<any> = [];
  recordings: Array<any> = [];


  constructor(private zone: NgZone) {
    this.getVideos();
    this.listDevices();
    this.serveVideos();
  }


  serveVideos() {
    const dest = remote.app.getPath('userData') + '/electron-ffmpeg/videos';


    const app: Application = express();
    app.use(express.static(dest));


    const server: any = app.listen(4000, () => {
      console.log('Serving videos ');
    });

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


  getVideos() {
    const dest = remote.app.getPath('userData') + '/electron-ffmpeg/videos';
    const files = readdirSync(dest);
    this.zone.run(() => {
      this.recordings = files.map((x) => join(dest, x));
    });
  }

  stopRecording() {
    this.recordingProcess.kill();
  }

  ensureVideoDir() {
    var dest = remote.app.getPath('userData') + '/electron-ffmpeg/videos';
    if (!existsSync(dest)) {
      mkdirSync(dest);
    }
  }

  startRecording() {
    this.isRecording = true;
    const selectedVideoDevice: any = this.videoDevices.filter((x) => x.selected)[0];
    const selectedAudioDevice: any = this.audioDevices.filter((x) => x.selected)[0];

    this.ensureVideoDir();
    let filename: string = Date.now() + '.mkv';
    var dest = join(remote.app.getPath(`userData`), 'electron-ffmpeg', 'videos', filename);

    const command = `-f avfoundation -capture_cursor 1 -capture_mouse_clicks 1 -i ${selectedVideoDevice.index}:${selectedAudioDevice.index} "${dest}" -y`;
    console.log('Command ', command);
    const ffmpeg = remote.app.getPath('userData') + '/electron-ffmpeg/ffmpeg';
    const child: ChildProcess = spawn('"' + ffmpeg + '"', command.split(' '), { shell: true });
    this.recordingProcess = child;
    child.stdout.on('data', (data) => console.log(data.toString()));
    child.stderr.on('data', (data) => console.log(data.toString()));
    child.on('exit', () => {
      this.zone.run(() => {
        this.recordings.push(dest);
        this.isRecording = false;
      });

    });
  }


}
