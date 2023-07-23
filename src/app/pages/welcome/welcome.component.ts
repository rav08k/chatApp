import { Component, OnInit } from '@angular/core';

import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot,Firestore,getFirestore,collection, setDoc, getDocs,query, where, deleteDoc,  } from "firebase/firestore";
import { initializeApp } from 'firebase/app';

import { Router } from '@angular/router';

import { UserDetailsService } from 'src/app/services/user-details.service';


@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  firebaseConfig = {
    apiKey: "AIzaSyAlhFbfKaRavsaNsmZ-_BX6EwC6AZqsLWE",
    authDomain: "chat-app-b93a4.firebaseapp.com",
    databaseURL: "https://chat-app-b93a4-default-rtdb.firebaseio.com",
    projectId: "chat-app-b93a4",
    storageBucket: "chat-app-b93a4.appspot.com",
    messagingSenderId: "374517068943",
    appId: "1:374517068943:web:fea1b5f3afbf2dafe66cfa"
  }
    
  app = initializeApp(this.firebaseConfig);
    
  db = getFirestore(this.app);


  constructor(private router:Router,private userDetails:UserDetailsService) {

   

   }

  ngOnInit(): void {
  }

  login(){
    const provider = new GoogleAuthProvider();
    const auth = getAuth();
    signInWithPopup(auth, provider)
      .then((result) => {
        // This gives you a Google Access Token. You can use it to access the Google API.
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        // The signed-in user info.
        const user = result.user;
        // ...
        // console.log(user.providerData[0]);
        this.userDetails.setUser(user.providerData[0],user.uid)
        const studentRef = collection(this.db, `users`);
        setDoc(doc(studentRef,`${user.uid}`),{
          name:user.providerData[0].displayName,
          email:user.providerData[0].email,
          pic:user.providerData[0].photoURL,
          id:user.uid,
        });
        this.router.navigate(['chat']);
        
      }).catch((error) => {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        // The email of the user's account used.
        const email = error.email;
        // The AuthCredential type that was used.
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
        console.log(errorCode);
        alert(errorCode)
        alert(errorMessage)
        
      });
  }

}
