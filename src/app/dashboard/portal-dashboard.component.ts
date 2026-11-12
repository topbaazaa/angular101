import { Component } from '@angular/core';
import { BonusCalculatorParentComponent } from '../bonus-calculator/bonus-calculator-parent.component';
import { EvaluationHostComponent } from '../evaluation/evaluation-host.component';
import { SearchApiComponent } from '../search-api/search-api.component';
import { SecurityDemoComponent } from '../security-demo/security-demo.component';
import { UserDirectoryComponent } from '../user-directory/user-directory.component';

/**
 * ============================================================================
 * ไฟล์: portal-dashboard.component.ts (All-in-One Portal Dashboard)
 * ============================================================================
 * หน้า Dashboard หลักที่รวบรวมทุกโมดูลการเรียนรู้ไว้ในหน้าเดียวเพื่อให้เห็นภาพรวมทั้งหมดทันที
 * และผู้ใช้ยังสามารถกดเมนูด้านบนเพื่อแยกเปิดแต่ละหน้าแบบ Lazy Loading (Code Splitting) ได้อีกด้วย
 * ============================================================================
 */
@Component({
  selector: 'app-portal-dashboard',
  standalone: true,
  imports: [
    BonusCalculatorParentComponent,
    EvaluationHostComponent,
    UserDirectoryComponent,
    SearchApiComponent,
    SecurityDemoComponent,
  ],
  template: `
    <div class="dashboard-stack">
      <app-bonus-calculator-parent></app-bonus-calculator-parent>
      <app-evaluation-host></app-evaluation-host>
      <app-user-directory></app-user-directory>
      <app-search-api></app-search-api>
      <app-security-demo></app-security-demo>
    </div>
  `,
  styles: [
    `
      .dashboard-stack {
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
      }
    `,
  ],
})
export class PortalDashboardComponent {}

