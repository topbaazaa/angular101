import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';

/**
 * ============================================================================
 * ไฟล์: app.spec.ts (Unit Test สำหรับ Root App Component & Core Providers)
 * ============================================================================
 * ทดสอบการสร้าง Root App Shell พร้อมตั้งค่า `provideRouter` และ `provideHttpClient`
 * ============================================================================
 */
describe('App (Root Standalone Component)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([authInterceptor])),
      ],
    }).compileComponents();
  });

  it('ควรสร้าง Root App Component สำเร็จ', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('ควรเรนเดอร์หัวข้อหลักของระบบจัดการและประเมินผลพนักงานบน DOM', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'ระบบจัดการและประเมินผลพนักงาน (Employee & Evaluation Portal)'
    );
  });
});
