import { Injectable } from '@angular/core';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class Products {
  private app: FirebaseApp;
  private db: Firestore;
}
