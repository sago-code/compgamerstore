import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormUsersPage } from './form-users.page';

describe('FormUsersPage', () => {
  let component: FormUsersPage;
  let fixture: ComponentFixture<FormUsersPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(FormUsersPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
