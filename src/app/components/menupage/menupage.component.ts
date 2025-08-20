import { Component, OnInit } from '@angular/core';
import { IonIcon } from "@ionic/angular/standalone";
import { IonicModule } from "@ionic/angular";

@Component({
  selector: 'app-menupage',
  templateUrl: './menupage.component.html',
  styleUrls: ['./menupage.component.scss'],
  imports: [
    IonicModule, 
    IonIcon
  ],
})
export class MenupageComponent  implements OnInit {
  
  menufunctions() {
    const list = document.querySelectorAll(".list");
    function activelink() {
      list.forEach((item) => item.classList.remove("active"));
      this.classList.add("active");
    }
    list.forEach((item) => item.addEventListener("click", activelink));
  }
  constructor() { }

  ngOnInit() {}

}
