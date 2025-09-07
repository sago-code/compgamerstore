import { TestBed } from '@angular/core/testing';

import { UserFirebaseService } from './users.service';

describe('Firebase', () => {
  let service: UserFirebaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserFirebaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
