import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ChatRoomComponent } from './pages/chat-room/chat-room.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';

const routes: Routes = [ 
  {path: 'chat', component: ChatRoomComponent},
 {path: '', component: WelcomeComponent},

];

@NgModule({
  imports: [
  RouterModule.forRoot(routes),
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
