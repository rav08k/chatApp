import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserDetailsService {

  constructor() {
   
   }

  user:any ={
  }

  getUser(){
    return this.user;
  }

  setUser(x:any,id:any){
    this.user.id = id;
    this.user.name = x.displayName;
    this.user.email = x.email;
    this.user.photoUrl = x.photoURL;
  }
}
