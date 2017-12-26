import { remote } from 'electron';
import { join } from 'path';
import { readLine } from '../../process/util';
import { Injectable, NgZone } from '@angular/core';
import { existsSync, mkdirSync, readdirSync } from 'fs';
import { Application } from 'express';
import * as express from 'express';
import { ChildProcess, spawn } from 'child_process';
import { Video } from '../components/Video';


@Injectable()
export class FfmpegService {

  public isRecording: boolean = false;

  videoDevices: Array<any> = [];
  audioDevices: Array<any> = [];
  recordings: Array<any> = [];
  videos: Array<Video> = [];


  constructor(private zone: NgZone) {
    this.init();
  }

  async init() {
    try {
      this.videos = await this.getVideos();
    } catch (e) {
      console.log('Error ', e);
    }
    console.log('VVVV ', this.videos);
    this.listDevices();
    this.serveVideos();
  }


  getMetadata(file: string): Promise<any> {
    // ffprobe -show_format -pretty -print_format json 1514238683069.mkv

    return new Promise((resolve, reject) => {
      const command: string = '-print_format json -show_format -show_streams "' + file + '"';
      console.log('Command ', command);
      let output: string = '';
      const ffprobe = remote.app.getPath('userData') + '/electron-ffmpeg/ffprobe';
      const child: ChildProcess = spawn('"' + ffprobe + '"', command.split(' '), { shell: true });
      child.stdout.on('data', (data) => output += data.toString());
      child.stderr.on('data', (data) => console.log('E', data.toString()));
      child.on('exit', () => {
        setTimeout(() => {
          let d: any;
          try {
            d = JSON.parse(output);
            resolve(d);
          } catch (e) {
            console.log(output);
            reject(e);
          }
        }, 200);
      });
    });
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


  async getVideos(): Promise<any> {

    return new Promise((resolve, reject) => {


      const dest = remote.app.getPath('userData') + '/electron-ffmpeg/videos';
      const files = readdirSync(dest);
      this.zone.run(async () => {
        this.recordings = files.map((x) => join(dest, x));

        const videos = await Promise.all(this.recordings.map(async (f) => {
          const metadata: any = await this.getMetadata(f);
          const keyframes = await this.getKeyframes(f);
          const video: Video = new Video();
          video.duration = metadata.format.duration * 1000;
          video.keyframes = keyframes.packates;
          video.file = f;
          return video;
        }));
        resolve(videos);
      });
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


  getKeyframes(file: string): Promise<any> {
    // ffprobe -show_format -pretty -print_format json 1514238683069.mkv

    return new Promise((resolve, reject) => {
      const command: string = '"' + file + '" -show_packets -show_entries packet=pts_time,flags -of json';
      console.log('Command ', command);
      let output: string = '';
      const ffprobe = remote.app.getPath('userData') + '/electron-ffmpeg/ffprobe';
      const child: ChildProcess = spawn('"' + ffprobe + '"', command.split(' '), { shell: true });
      child.stdout.on('data', (data) => output += data.toString());
      child.stderr.on('data', (data) => console.log('E', data.toString()));
      child.on('exit', () => {
        console.log(JSON.parse(output));
        resolve(JSON.parse(output));
      });
    });
  }

}
