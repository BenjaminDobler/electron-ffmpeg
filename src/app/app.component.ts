import { Component } from '@angular/core';
import { remote } from 'electron';
import * as ffbinaries from 'ffbinaries';
import { existsSync, mkdirSync } from 'fs';
import { FfmpegService } from './services/ffmpeg';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';


  constructor(public ffmpeg:FfmpegService) {

  }

  public saveFile() {


    var dest = remote.app.getPath('userData') + '/electron-ffmpeg';
    if (!existsSync(dest)) {
      console.log('Make Dir! ', dest);
      mkdirSync(dest);
    }

    console.log('Dest ', dest);

    ffbinaries.downloadFiles({ destination: dest, platform: ffbinaries.detectPlatform() }, function (err, data) {
      console.log('Downloading binaries for linux:');
      console.log('err', err);
      console.log('data', data);

    });

  }



}



