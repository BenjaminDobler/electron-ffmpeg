import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { FfmpegService } from './services/ffmpeg';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [FfmpegService],
  bootstrap: [AppComponent]
})
export class AppModule { }
