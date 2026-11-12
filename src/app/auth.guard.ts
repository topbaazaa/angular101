import { Injectable, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * ============================================================================
 * AuthStateService: เก็บสถานะสิทธิ์ผู้ใช้ (Role/Permission State)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - เปรียบเสมือน SecurityContext / Principal ใน Spring Security หรือ ClaimsPrincipal ใน .NET
 *   แต่ฝั่ง Frontend มีไว้เพื่อ "ควบคุมการแสดงผล UI และการเปลี่ยนหน้า (Navigation)" เท่านั้น
 * - ข้อควรระวังด้าน Security: Route Guard บน Frontend ป้องกันได้แค่ระดับ UX (ไม่ให้ผู้ใช้ทั่วไปกดเข้าหน้า Admin)
 *   แต่ฝั่ง Backend API ยังคงต้องตรวจสิทธิ์ (Authorization) ทุกครั้งเสมอ เพราะผู้ใช้แก้ไข JS ใน Browser ได้!
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  // ใช้ Signal เก็บสถานะว่าเป็น Admin หรือไม่ (ค่าเริ่มต้นให้เป็น true เพื่อให้ทดสอบเข้าหน้า /admin ได้ และมีปุ่มสลับเป็น false ได้)
  private readonly _isAdmin = signal<boolean>(true);

  // เปิดให้อ่านค่าได้อย่างเดียว (Encapsulation เหมือน private field + public getter ใน OOP)
  public readonly isAdmin = this._isAdmin.asReadonly();

  public toggleAdminRole(): void {
    this._isAdmin.update((current) => !current);
  }

  public setAdminRole(isAdmin: boolean): void {
    this._isAdmin.set(isAdmin);
  }
}

/**
 * ============================================================================
 * ไฟล์: auth.guard.ts (Functional Route Guard - CanActivateFn)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - เทียบเท่ากับ Authorization Attribute / Annotation บน Controller เช่น:
 *   `@PreAuthorize("hasRole('ADMIN')")` ใน Spring Boot หรือ `[Authorize(Roles = "Admin")]` ใน .NET
 * - ทำงานก่อนที่ Router จะโหลดหรือเรนเดอร์ Component ของ Route นั้นๆ
 * - ในยุค Angular v15+ ได้เปลี่ยนจาก Class-based Guard (`implements CanActivate`) ที่ต้องสร้างคลาสยาวๆ
 *   มาเป็น Functional Guard (`CanActivateFn`) ที่สั้นกระชับและใช้ `inject()` ดึง Dependency ได้ทันที
 * ============================================================================
 */
export const authGuard: CanActivateFn = (route, state) => {
  // ใช้ inject() เพื่อดึง Singleton Service จาก DI Container (เหมือน @Autowired / Constructor Injection)
  const router = inject(Router);
  const authState = inject(AuthStateService);

  const hasAdminAccess = authState.isAdmin();

  if (hasAdminAccess) {
    console.log(`[AuthGuard] อนุญาตให้เข้าถึงเส้นทาง: ${state.url} (สิทธิ์ Admin = true)`);
    return true; // อนุญาตให้ผ่านไปยัง Component ปลายทาง
  } else {
    console.warn(`[AuthGuard] ปฏิเสธการเข้าถึงเส้นทาง: ${state.url}! กำลัง Redirect ไปหน้า /security...`);
    // ใน Angular ยุคใหม่ แนะนำให้คืนค่าเป็น UrlTree แทนการสั่ง router.navigate() แล้ว return false
    // เพื่อให้ Router จัดการ Cancellation และ Redirect ใน Navigation Cycle เดียวกันอย่างปลอดภัย
    return router.createUrlTree(['/security'], {
      queryParams: { blockedUrl: state.url, reason: 'unauthorized_admin_only' },
    });
  }
};
