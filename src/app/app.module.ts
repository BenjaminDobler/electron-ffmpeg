import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { FfmpegService } from './services/ffmpeg';
import { TrackComponent } from './components/track/track.component';


@NgModule({
  declarations: [
    AppComponent,
    TrackComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [FfmpegService],
  bootstrap: [AppComponent]
})
export class AppModule { }
