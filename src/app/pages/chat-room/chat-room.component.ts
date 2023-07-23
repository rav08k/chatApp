import { Component, OnInit } from '@angular/core';

import { FormBuilder, Validators, FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { doc, onSnapshot, Firestore, getFirestore, collection, setDoc, getDocs, query, where, deleteDoc, orderBy, } from "firebase/firestore";
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";

import { UserDetailsService } from 'src/app/services/user-details.service';



@Component({
  selector: 'app-chat-room',
  templateUrl: './chat-room.component.html',
  styleUrls: ['./chat-room.component.css']
})
export class ChatRoomComponent implements OnInit {

  srch: FormGroup;
  msg: FormGroup;
  grp: FormGroup;
  users: any = [];
  contacts: any = [];
  isSearching: boolean = false;
  searchResults: any = [];
  user: any = {};
  activeUser: any = {};
  allConvId: any = [];
  activeConvId: any; //active conversation ID
  badgeCount: any = {};
  badgeId: any = [];
  groupShow: Boolean = false;
  groups: any = []


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

  storage = getStorage(this.app)

  mainList: any = [];
  mainMsgList: any = {};



  constructor(private fb: FormBuilder, public ud: UserDetailsService) {
    this.msg = this.fb.group({
      msgInp: [''],
      file: ['']
    })
    this.srch = this.fb.group({
      srchInp: ['']
    })
    this.grp = this.fb.group({
      grpName: [''],
      grpFile: [''],
      members: ['']
    })


    let userDetails = ud.getUser();



    let loadUser = new Promise<any>((resolve, reject) => {
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        if (user) {
          resolve(user);
        } else {
          // // console.log('user logged out');
          reject('error')
        }
      })
    })


    loadUser.then((user) => {
      ud.setUser(user.providerData[0], user.uid);
      userDetails = ud.getUser();
      this.user = userDetails;
      this.activeUser = this.user;
      this.getUsers()
      this.getContacts();
    }).then(() => {
      const Q = query(collection(this.db, `convId`));
      const unsb = onSnapshot(Q, query => {
        let lst: any = [];
        query.docChanges().forEach((changes) => {
          let d = changes.doc.data();
          // // console.log(d['members']);
          if (changes.type == "added") {
            this.allConvId.push(changes.doc.id)
            // // console.log(this.allConvId);

            if (d['members'] != undefined && d['members'].includes(this.user.id)) {
              // console.log('this convId has myuser');
              if (changes.doc.id.includes('group')) {
                // // console.log('this is group');
                this.addGroup(changes.doc.id, changes.doc.data()).then(() => {
                  this.sync(changes.doc.id);
                })
              } else {
                this.getNewContact(changes.doc.id).then(() => {
                  this.sync(changes.doc.id)
                })
              }
            }
          } else {
            // console.log('convId is either modified(rewrites) or removed');

          }
        });
      });
    })

  }

  getUsers() {
    const q = query(collection(this.db, "users"));
    const unsubscribe = onSnapshot(q, querySnapshot => {
      const list1: any = [];
      let lst: any = [];
      querySnapshot.forEach((doc) => {
        let d = doc.data();
        list1.push(d);
        lst.push(doc.id)
        this.users = lst;
      });
      this.mainList = list1;
    });

  }




  getBadgeCount() {
    const q1 = query(collection(this.db, `users/${this.user.id}/badgeCount`));
    // // console.log(this.user.id);

    const unsbs = onSnapshot(q1, query => {
      let lst: any = {};
      query.forEach((changes) => {
        let d = changes.id;
        lst[d] = changes.data()['value'];
      });
      // console.log('badge count', lst);
      this.badgeCount = lst;
      this.badgeId = Object.keys(this.badgeCount)
    })
  }




  i = 0;
  sync(convId: any) {
    let id = convId;
    this.badgeCount[id] = 0;

    let q1 = query(collection(this.db, `message/${convId}/messages`));
    let unsubs = onSnapshot(q1, async querySnapshot => {
      let msgLst: any = [];
      await querySnapshot.docChanges().forEach(async (changes) => {
        let d = changes.doc.data();
        msgLst.push(d);
        // // console.log(d);

      })
      // console.log('syncronized');

      if (this.mainMsgList[convId]) {
        if (id == this.activeConvId) {
          this.mainMsgList[convId].push(msgLst[0])
          // console.log(id, this.activeConvId);
        } else {
          this.badgeCount[id]++;
          const studentRef = collection(this.db, `users/${this.user.id}/badgeCount`);
          setDoc(doc(studentRef, id), {
            value: this.badgeCount[id]
          });
          this.mainMsgList[convId].push(msgLst[0]);
          // console.log(this.badgeCount[id]);
        }
      } else {
        this.mainMsgList[convId] = msgLst;
      }
      this.setScreen(id);
      return msgLst;
    });
    // // console.log(this.mainMsgList);
    // console.log(this.badgeCount);
    this.getBadgeCount()
  }

  ngOnInit(): void { }

  getContacts() {
    const q2 = query(collection(this.db, `users/${this.user.id}/contacts`));
    const unsub = onSnapshot(q2, querySnapshot => {
      let Lst: any = [];
      querySnapshot.forEach((doc) => {
        let d = doc.data();
        Lst.push(d['contactDetails']);
      });
      this.contacts = Lst;
    });
  }


  send() {
    let date = new Date;
    let val = date.getTime();
    const studentRef = collection(this.db, `message/${this.activeConvId}/messages`);
    let msg = this.msg.value.msgInp?this.msg.value.msgInp.trim():'';
    let file = this.showimg;
    if (file != '') {
      console.log(this.msg.value, file)
      let r = ref(this.storage, 'myImg/' + file.name);
      uploadBytes(r, file).then((snapshot) => {
        console.log('Uploaded a blob or file!');
      }).then(() => {
        getDownloadURL(r)
          .then((url) => {
            this.setVal(msg, val, studentRef, "user", url);
          })
      })
    }else if(msg != ''){
      this.setVal(msg, val, studentRef, "user");
    }
    this.msg.reset();
    const preview = document.getElementById('showImg');
    preview?.style.setProperty('visibility', 'hidden')
  }

  setVal(x: any='', y: any, studentRef: any, usr: any, img: any = '') {
    setDoc(doc(studentRef, String(y)), {
      msg: x,
      sender: this.user.id,
      name: this.user.name,
      reciever: this.activeUser.id,
      imgPath: img
    });
    return false;
  }

  append(el: any, txt: any, n: any, msg: any, a: any, b: any, name: any, sender: any, img: any) {
    let imgage = ``
    let pic = ''
    let Name = ''
    let message = ''
    for (let i = 0; i < this.mainList.length; i++) {
      if (this.mainList[i].id.includes(sender) && sender != this.user.id) {
        pic = this.mainList[i].pic;
        pic = `<img src=${pic} style = "width: 35px; height: 35px; border-radius:35px;">`
      }
    }
    if (name != '') {
      Name = `<li style="color: rgb(129, 129, 129);font-size: 12px;display: block;margin: 10px 0px 0px 10px;" > ${name} </li>`
    }
    if (img != '') {
      imgage = `<img style='width:300px; height:180px; margin-top:10px; border: solid grey 1px' src = ${img}>`
    }
    if (msg != '' && msg != null) {
      message = `<span style="background-color: rgb(${n},${n}, ${n});padding:10px;display: flex;align-items: center;max-width: 450px;min-width:60px; width: fit-content;border-radius: ${b}px 10px ${a}px 10px;">${msg} </span>`
    }


    el.innerHTML += `<div style='width:100%; height:fit-content; display:flex; align-items:center; justify-content: flex-${txt};margin: 0px 0px 0px ${a}px;'>
    <div style='position:relative; right:10px;bottom:0px;'>${pic}</div>
    <div style=''>
    ${Name}
        <p style="display: flex;flex-direction:column ;align-items: flex-${txt};line-height: 1;margin:0 0 0px 0;box-sizing: border-box; min-height: 45px; ">
        ${imgage}
        ${message}
        </p>
    </div>
    </div>`
    el.scrollTop = el.scrollHeight;
  }


  activeUsr(usr: any) {
    this.deactiveAll().then(
      () => {
        let usr1 = document.getElementById(usr.id)
        this.activeUser = usr;
        usr1?.classList.add('active');
        let scr = document.getElementById('chat-screen');
        if (this.activeUser.id > this.user.id) {
          this.activeConvId = this.activeUser.id.slice(0, 7) + this.user.id.slice(0, 7)
        } else {
          this.activeConvId = this.user.id.slice(0, 7) + this.activeUser.id.slice(0, 7)
        }

        if (usr.id.includes('group')) {
          this.activeConvId = usr.id;
          this.setScreen(this.activeConvId);
          this.badgeCount[this.activeConvId] = 0;
          const Ref = collection(this.db, `users/${this.user.id}/badgeCount`);
          setDoc(doc(Ref, this.activeConvId), {
            value: this.badgeCount[this.activeConvId]
          });
        } else {
          this.setScreen(this.activeConvId);
          this.badgeCount[this.activeConvId] = 0;
          const Ref = collection(this.db, `users/${this.user.id}/badgeCount`);
          setDoc(doc(Ref, this.activeConvId), {
            value: this.badgeCount[this.activeConvId]
          });
          if (!this.allConvId.includes(this.activeConvId)) {
            const studentRef = collection(this.db, `convId`);
            setDoc(doc(studentRef, this.activeConvId), {
              members: [this.user.id, this.activeUser.id]
            });
          }
        }
      }
    )
  }


  async deactiveAll() {
    for (let i = 0; i < this.contacts.length; i++) {
      document.getElementById(this.contacts[i].id)?.classList.remove('active');
    }
  }

  setScreen(id: any) {
    setTimeout(() => {
      let el: any = document.getElementById('chat-screen');
      if (id == this.activeConvId && this.activeUser.id != this.user.id) {
        el.innerHTML = '';
        if (!this.activeConvId.includes('group')) {
          let data = this.mainMsgList[this.activeConvId];
          console.log('img', data);
          for (let i = 0; i < data.length; i++) {
            if (data[i].reciever == `${this.user.id}`) {
              let pic = this.activeUser.pic;
              pic = `<img src=${pic} style = "width: 35px; height: 35px; border-radius:35px;">`
              this.append(el, "start", 220, data[i].msg, 10, 0, data[i].name, data[i].sender, data[i].imgPath)
            } else if (data[i].sender == `${this.user.id}`) {
              this.append(el, "end", 240, data[i].msg, 0, 10, '', data[i].sender, data[i].imgPath);
            }
          }
        } else {
          let data = this.mainMsgList[this.activeConvId];
          for (let i = 0; i < data.length; i++) {
            if (data[i].reciever == `${this.activeConvId}` && data[i].sender != `${this.user.id}`) {
              let pic = '';
              this.append(el, "start", 220, data[i].msg, 10, 0, data[i].name, data[i].sender, data[i].imgPath)
            } else if (data[i].sender == `${this.user.id}`) {
              this.append(el, "end", 240, data[i].msg, 0, 10, '', data[i].sender, data[i].imgPath)
            }
          }
        }
      }
    }, 10);
  }

  timer: any;
  searchUser(x: any) {
    if (x.value != '') {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.searchResults = []
        for (let i = 0; i < this.mainList.length; i++) {
          if (this.mainList[i].name.toLowerCase().includes(x.value)) {
            this.searchResults.push(this.mainList[i])
          }
        }
      }, 800);
    } else {
      this.searchResults = []
    }
    return false;
  }

  addContact(x: any) {
    this.isSearching = false;
    const studentRef = collection(this.db, `users/${this.user.id}/contacts`);
    setDoc(doc(studentRef, String(x.id)), {
      contactDetails: x
    });
  }


  async addGroup(x: any, details: any) {
    // console.log('workjing fine till here');
    const studentRef = collection(this.db, `users/${this.user.id}/contacts`);
    await setDoc(doc(studentRef, String(x)), {
      contactDetails: details,
    });
  }



  async getNewContact(convId: any) {
    let cont = this.contacts;
    let users = this.mainList;
    let st = true;
    for (let i = 0; i < cont.length; i++) {
      if (convId.includes(cont[i].id.slice(0, 7))) {
        st = false;
      }
    }
    if (st) {
      for (let i = 0; i < users.length; i++) {
        // console.log(users);
        if (convId.includes(users[i].id.slice(0, 7)) && this.user.id != users[i].id) {
          // console.log('new user');
          this.addContact(users[i]);
        }
      }
    }
  }

  temp: any = []
  checked(name: any, usr: any) {
    name = document.getElementById(name);
    if (name && !name.checked) {
      this.temp.push(usr.id)
      return name.checked = true;
    }
    else {
      this.temp.pop(usr.id)
      return name.checked = false;
    }
  }

  async createGroup(e: any) {
    this.temp.push(this.user.id)
    this.grp.patchValue({
      members: this.temp,
    });
    let value = this.grp.value;
    let groupId = 'group' + this.user.id.slice(0, 6) + Math.random().toString().slice(2, 8)

    let file = e.target[1].files[0];
    console.log(file);

    let r = ref(this.storage, 'myImg/' + file.name);
    uploadBytes(r, file).then((snapshot) => {
      console.log('Uploaded a blob or file!');
    }).then(() => {
      getDownloadURL(r)
        .then((url) => {
          const Ref = collection(this.db, `convId`);
          setDoc(doc(Ref, String(groupId)), {
            name: this.grp.value.grpName,
            id: groupId,
            pic: url,
            members: this.grp.value.members,
          });
          this.grp.reset()
          this.temp = []
        })
    })

    this.groupShow = false;
  }

  showimg: any = ``
  showFile(e: any) {
    const preview = document.getElementById('showImg');
    const file = e.target.files[0];

    this.showimg = file;
    console.log(this.msg.value.file);

    const reader = new FileReader();
    console.log(preview);

    reader.addEventListener("load", function () {
      // convert image file to base64 string
      preview?.setAttribute('src', `${reader.result}`)
      preview?.style.setProperty('visibility', 'visible')
      console.log(preview);
    }, false);

    if (file) {
      reader.readAsDataURL(file);
    }

  }
}


