import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../auth.guard';

/**
 * ============================================================================
 * ไฟล์: admin-panel.component.ts (Protected Route สำหรับผู้ดูแลระบบ)
 * ============================================================================
 * Component นี้ถูกปกป้องด้วย `canActivate: [authGuard]` ใน `app.routes.ts`
 * และโหลดแบบ Lazy Loading (`loadComponent`) เฉพาะเมื่อผ่าน Guard แล้วเท่านั้น!
 * ============================================================================
 */
@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="admin-card">
      <span class="admin-badge">🔐 Protected Admin Zone (/admin)</span>
      <h2>ยินดีต้อนรับสู่หน้าจัดการระบบขั้นสูง (Admin Only)</h2>
      <p>
        คุณสามารถเข้าถึงหน้านี้ได้เพราะผ่านการตรวจสอบจาก <code>authGuard (CanActivateFn)</code>
        เรียบร้อยแล้ว! (และไฟล์ JavaScript ของหน้านี้ถูกโหลดแบบ Lazy Loading ด้วย
        <code>loadComponent</code>)
      </p>
      <div class="admin-actions">
        <a routerLink="/security" class="btn-back">⬅️ กลับไปหน้าทดสอบ Security</a>
        <a routerLink="/" class="btn-back secondary">🏠 กลับหน้า Dashboard รวม</a>
      </div>
    </section>
  `,
  styles: [
    `
      .admin-card {
        background: #1e1b4b;
        color: #ffffff;
        padding: 2rem;
        border-radius: 14px;
        border: 2px solid #6366f1;
      }
      .admin-badge {
        background: #4f46e5;
        padding: 0.25rem 0.75rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 700;
      }
      h2 {
        margin: 0.75rem 0;
      }
      p {
        color: #c7d2fe;
        line-height: 1.6;
      }
      .admin-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 1.25rem;
        flex-wrap: wrap;
      }
      .btn-back {
        background: #6366f1;
        color: white;
        text-decoration: none;
        padding: 0.6rem 1.1rem;
        border-radius: 8px;
        font-weight: 600;
      }
      .btn-back.secondary {
        background: transparent;
        border: 1px solid #818cf8;
      }
    `,
  ],
})
export class AdminPanelComponent {
  public readonly authState = inject(AuthStateService);
}

