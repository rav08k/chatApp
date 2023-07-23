import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { environment } from '../environments/environment';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ChatRoomComponent } from './pages/chat-room/chat-room.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';


@NgModule({
  declarations: [
    AppComponent,
    WelcomeComponent,
    ChatRoomComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
