import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { EvaluationService } from './evaluation.service';

/**
 * ============================================================================
 * ไฟล์: eval-result.component.ts (Sibling B - ผู้รับข้อมูล / Consumer)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - เปรียบเสมือน "Read Model / Projection View (ในรูปแบบ CQRS)" ที่อ่านข้อมูลจาก
 *   Read-only Signals (`asReadonly()`) และ `computed()` ของ `EvaluationService`
 * - ทันทีที่ Sibling A อัปเดตคะแนนใน `EvaluationService` ตัว `EvalResultComponent`
 *   จะได้รับการแจ้งเตือนผ่าน Dependency Graph ของ Angular Signals และอัปเดตเฉพาะจุดใน DOM ทันที!
 * ============================================================================
 */
@Component({
  selector: 'app-eval-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sibling-box sibling-b">
      <div class="sibling-badge">Sibling B: EvalResultComponent (ฝั่งแสดงผลตัดเกรด)</div>
      <h3>📊 ผลลัพธ์การตัดเกรดแบบ Real-time (Computed Signals)</h3>

      @let summary = evalService.evaluationSummary();

      <div class="grade-display-card" [class.failed]="!summary.isPassed">
        <div class="grade-circle" data-testid="computed-grade">
          {{ summary.grade }}
        </div>
        <div class="grade-details">
          <div class="emp-title">พนักงาน: <strong>{{ summary.employeeName }}</strong></div>
          <div class="score-line">
            คะแนนรวมสุทธิ:
            <strong data-testid="computed-total-score">{{ summary.totalScore }} / 100</strong>
          </div>
          <div class="status-pill" [class.pass]="summary.isPassed" [class.fail]="!summary.isPassed">
            {{ summary.isPassed ? '✅ ผ่านเกณฑ์ประเมิน' : '❌ ไม่ผ่านเกณฑ์ขั้นต่ำ' }} —
            {{ summary.statusText }}
          </div>
        </div>
      </div>

      <div class="history-section">
        <div class="history-header">
          <h4>ประวัติการบันทึกผล ({{ evalService.history().length }} รายการ)</h4>
          <span class="avg-badge">
            คะแนนเฉลี่ยรวม: <strong>{{ evalService.averageHistoryScore() }}</strong>
          </span>
        </div>

        <ul class="history-list">
          @for (item of evalService.history(); track item.id) {
            <li class="history-item">
              <span>
                <strong>{{ item.employeeName }}</strong> (KPI: {{ item.kpiScore }}, SoftSkill:
                {{ item.softSkillScore }})
              </span>
              <span class="history-grade">
                รวม {{ item.totalScore }} คะแนน ➔ <strong>เกรด {{ item.grade }}</strong>
              </span>
            </li>
          } @empty {
            <li class="empty-history">ยังไม่มีประวัติการประเมิน</li>
          }
        </ul>
      </div>
    </div>
  `,
  styles: [
    `
      .sibling-box {
        border-radius: 12px;
        padding: 1.25rem;
        height: 100%;
        box-sizing: border-box;
      }
      .sibling-b {
        background: #fdf4ff;
        border: 2px solid #e879f9;
      }
      .sibling-badge {
        display: inline-block;
        background: #9333ea;
        color: #ffffff;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        margin-bottom: 0.5rem;
      }
      h3 {
        margin: 0.25rem 0 1rem 0;
        color: #581c87;
        font-size: 1.1rem;
      }
      .grade-display-card {
        display: flex;
        align-items: center;
        gap: 1.1rem;
        background: #ffffff;
        padding: 1rem;
        border-radius: 10px;
        border: 1px solid #f0abfc;
        margin-bottom: 1rem;
      }
      .grade-display-card.failed {
        border-color: #fca5a5;
        background: #fff5f5;
      }
      .grade-circle {
        width: 68px;
        height: 68px;
        border-radius: 50%;
        background: linear-gradient(135deg, #7e22ce, #c026d3);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: 800;
        flex-shrink: 0;
      }
      .grade-details {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
      }
      .score-line {
        font-size: 1.05rem;
        color: #1f2937;
      }
      .status-pill {
        font-size: 0.82rem;
        font-weight: 600;
        padding: 0.25rem 0.55rem;
        border-radius: 6px;
      }
      .status-pill.pass {
        background: #dcfce7;
        color: #166534;
      }
      .status-pill.fail {
        background: #fee2e2;
        color: #991b1b;
      }
      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .history-header h4 {
        margin: 0;
        color: #581c87;
        font-size: 0.95rem;
      }
      .avg-badge {
        font-size: 0.8rem;
        background: #f3e8ff;
        color: #6b21a8;
        padding: 0.2rem 0.55rem;
        border-radius: 6px;
      }
      .history-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }
      .history-item {
        background: #ffffff;
        padding: 0.55rem 0.75rem;
        border-radius: 6px;
        border: 1px solid #f3e8ff;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        font-size: 0.85rem;
      }
      .history-grade {
        color: #7e22ce;
      }
    `,
  ],
})
export class EvalResultComponent {
  // Inject Singleton EvaluationService ตัวเดียวกันกับที่ EvalInputComponent ใช้งาน
  public readonly evalService = inject(EvaluationService);
}

