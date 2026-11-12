import { Component } from '@angular/core';
import { EvalInputComponent } from './eval-input.component';
import { EvalResultComponent } from './eval-result.component';

/**
 * ============================================================================
 * ไฟล์: evaluation-host.component.ts (Host Container สำหรับวาง Sibling A & B คู่กัน)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - Host Component นี้เป็นเพียง Layout Container ที่วาง `<app-eval-input />` (Sibling A)
 *   และ `<app-eval-result />` (Sibling B) ไว้ข้างกัน โดยที่ Host ไม่ต้องถือ State คะแนนเลย!
 * - ทั้งสอง Component สื่อสารกันผ่าน `EvaluationService` (Shared Singleton Service + Signals)
 * ============================================================================
 */
@Component({
  selector: 'app-evaluation-host',
  standalone: true,
  imports: [EvalInputComponent, EvalResultComponent],
  template: `
    <section class="module-card">
      <div class="module-header">
        <span class="module-tag">Module 3: Sibling Communication (Shared Service + Signals)</span>
        <h2>🎯 ระบบตัดเกรดและประเมินผลพนักงานแบบ Real-time (Signals & Computed)</h2>
        <p class="module-desc">
          สาธิตการสื่อสารระหว่าง <strong>Sibling A (EvalInputComponent)</strong> และ
          <strong>Sibling B (EvalResultComponent)</strong> ที่วางคู่กันโดยไม่ต้องส่งข้อมูลผ่านตัวแม่
          แต่ใช้ <code>inject(EvaluationService)</code> ร่วมกับ <code>signal()</code>,
          <code>computed()</code> และ <code>asReadonly()</code>
        </p>
      </div>

      <div class="siblings-grid">
        <app-eval-input></app-eval-input>
        <app-eval-result></app-eval-result>
      </div>
    </section>
  `,
  styles: [
    `
      .module-card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 14px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }
      .module-header h2 {
        margin: 0.4rem 0;
        color: #111827;
        font-size: 1.35rem;
      }
      .module-tag {
        display: inline-block;
        background: #fae8ff;
        color: #86198f;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.25rem 0.65rem;
        border-radius: 6px;
      }
      .module-desc {
        color: #4b5563;
        font-size: 0.92rem;
        margin-bottom: 1.25rem;
      }
      .siblings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.25rem;
      }
    `,
  ],
})
export class EvaluationHostComponent {}

