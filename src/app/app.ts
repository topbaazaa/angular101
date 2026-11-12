import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthStateService } from './auth.guard';

/**
 * ============================================================================
 * ไฟล์: app.ts (Root Standalone Component - App Shell)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - เปรียบเสมือน Master Layout / Main Entry Shell ของระบบ
 * - ในยุค Standalone Architecture จะไม่มี `@NgModule` อีกต่อไป
 *   Component ใดต้องการใช้ Directive อะไรใน HTML (เช่น `RouterOutlet`, `RouterLink`)
 *   ให้ประกาศลงใน `imports: [...]` ของ `@Component` ตัวนั้นโดยตรง
 * ============================================================================
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // ชื่อระบบหลักเก็บด้วย Angular Signal
  protected readonly title = signal('ระบบจัดการและประเมินผลพนักงาน (Employee & Evaluation Portal)');
  public readonly authState = inject(AuthStateService);
}
