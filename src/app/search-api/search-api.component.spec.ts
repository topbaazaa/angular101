import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import '../testing/jasmine-compat';
import { SpyObj } from '../testing/jasmine-compat';
import { SearchApiComponent } from './search-api.component';
import { ExternalUserDto, UserApiService } from './user-api.service';

// ประกาศ type global jasmine เพื่อให้ TypeScript รู้จักคำสั่งมาตรฐาน `jasmine.createSpyObj`
declare const jasmine: {
  createSpyObj: <T extends object>(baseName: string, methodNames: Array<keyof T & string>) => SpyObj<T>;
};

/**
 * ============================================================================
 * ไฟล์: search-api.component.spec.ts (Unit Testing ด้วย TestBed + jasmine.createSpyObj)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - ในฝั่ง Backend เวลาเราเทสต์ Controller หรือ Service เราจะไม่ต่อ Database จริงหรือยิง REST API จริง
 *   แต่เราจะใช้ `@MockBean` หรือ `Mockito.mock(UserApiService.class)` แล้วสั่ง
 *   `Mockito.when(mockService.searchUsers(anyString())).thenReturn(mockUsers)`
 * - ใน Angular เราใช้ **`jasmine.createSpyObj('UserApiService', ['searchUsers'])`**
 *   เพื่อสร้าง Mock Object จำลองขึ้นมา แล้วนำไปแทนที่ Service จริงใน `TestBed` ด้วย:
 *   `{ provide: UserApiService, useValue: mockUserApiService }`
 * - วิธีนี้ช่วยให้ Unit Test รันเร็วมาก (ระดับมิลลิวินาที) ไม่พึ่งพาอินเทอร์เน็ต และไม่ยิง API จริง!
 * ============================================================================
 */
describe('SearchApiComponent (Component + DOM Rendering + Mock Service with jasmine.createSpyObj)', () => {
  let fixture: ComponentFixture<SearchApiComponent>;
  let component: SearchApiComponent;
  let mockUserApiService: SpyObj<UserApiService>;

  // ข้อมูลจำลอง (Mock DTO) ที่จะให้ Mock Service ตอบกลับแทนการยิง API จริง
  const mockUsersResponse: ExternalUserDto[] = [
    {
      id: 1,
      name: 'Leanne Graham (Mocked)',
      username: 'Bret',
      email: 'leanne.mock@april.biz',
      company: { name: 'Romaguera-Crona Mock' },
    },
    {
      id: 2,
      name: 'Ervin Howell (Mocked)',
      username: 'Antonette',
      email: 'ervin.mock@melissa.tv',
      company: { name: 'Deckow-Crist Mock' },
    },
  ];

  beforeEach(async () => {
    // 1. Arrange: สร้าง Mock Service ด้วย `jasmine.createSpyObj` (เทียบเท่า Mockito.mock())
    mockUserApiService = jasmine.createSpyObj<UserApiService>('UserApiService', ['searchUsers']);

    // กำหนดพฤติกรรมเริ่มต้นให้คืนค่า Observable ของข้อมูลจำลอง (`of(mockUsersResponse)`)
    mockUserApiService.searchUsers.and.returnValue(of(mockUsersResponse));

    // 2. ตั้งค่า TestBed และฉีด (Provide) Mock Service เข้าไปแทนที่ UserApiService ตัวจริง
    await TestBed.configureTestingModule({
      imports: [SearchApiComponent],
      providers: [
        {
          provide: UserApiService,
          useValue: mockUserApiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchApiComponent);
    component = fixture.componentInstance;
  });

  it('1. ควรสร้าง SearchApiComponent สำเร็จ', () => {
    expect(component).toBeTruthy();
  });

  it('2. เมื่อกดสั่งค้นหา (triggerManualSearch) ควรเรียกใช้ Mock Service โดยไม่ยิง API จริง และเรนเดอร์รายชื่อลง DOM', async () => {
    // Act: เรียกเมธอดค้นหาข้อมูลและรอให้ DOM เรนเดอร์จนนิ่งด้วย whenStable()
    component.searchControl.setValue('Leanne', { emitEvent: false });
    component.triggerManualSearch();

    fixture.detectChanges();
    await fixture.whenStable();

    // Assert 1: ตรวจสอบว่า Mock Service ถูกเรียกด้วยพารามิเตอร์ที่ถูกต้อง
    expect(mockUserApiService.searchUsers).toHaveBeenCalledWith('Leanne');

    // Assert 2: ตรวจสอบว่า Signal `users` ได้รับข้อมูลจำลองครบ 2 รายการ
    expect(component.users().length).toBe(2);

    // Assert 3: ตรวจสอบ DOM Rendering จริงว่ามีการสร้างการ์ดผู้ใช้ 2 ใบและมีชื่อจาก Mock
    const compiledDom = fixture.nativeElement as HTMLElement;
    const userCards = compiledDom.querySelectorAll('[data-testid="user-card"]');
    expect(userCards.length).toBe(2);
    expect(compiledDom.textContent).toContain('Leanne Graham (Mocked)');
    expect(compiledDom.textContent).toContain('Ervin Howell (Mocked)');
  });
});

