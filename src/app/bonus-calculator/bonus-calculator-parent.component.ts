import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BonusCalculationResult,
  BonusProcessorChildComponent,
} from './bonus-processor-child.component';

/**
 * ============================================================================
 * ไฟล์: bonus-calculator-parent.component.ts (Parent Component)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - Parent Component เปรียบเสมือน "Orchestrator / Controller Layer" ที่รับค่าจากฟอร์มของผู้ใช้
 *   (เหมือนรับ HTTP Request Body) แล้วส่งต่อพารามิเตอร์ลงไปให้ Child Component (`[salary]="salary"`)
 * - เมื่อ Child Component คำนวณเสร็จและยิง `@Output()` กลับมา ตัวแม่จะดักฟังผ่าน Event Binding
 *   `(bonusCalculated)="onBonusCalculated($event)"` ซึ่ง `$event` ก็คือ Payload (DTO) ที่ลูกส่งกลับมานั่นเอง
 * ============================================================================
 */
@Component({
  selector: 'app-bonus-calculator-parent',
  standalone: true,
  // ใน Standalone Architecture เราต้องนำเข้า (imports) ทั้ง FormsModule (สำหรับ [(ngModel)])
  // และ Child Component ที่ต้องการเรียกใช้งานใน Template เสมือนการประกาศ import class ในไฟล์เดียวกัน
  imports: [CommonModule, FormsModule, BonusProcessorChildComponent],
  template: `
    <section class="module-card">
      <div class="module-header">
        <span class="module-tag">Module 2: Parent-Child Communication (@Input / @Output)</span>
        <h2>💰 ระบบคำนวณโบนัส ค่าล่วงเวลา (OT) และสวัสดิการค่าไฟ (Parent Component)</h2>
        <p class="module-desc">
          สาธิตการส่งข้อมูลจาก <strong>Parent ➔ Child</strong> ด้วย Property Binding
          <code>[property]="value"</code> และการรับข้อมูลกลับจาก <strong>Child ➔ Parent</strong> ด้วย
          Event Binding <code>(event)="handler($event)"</code>
        </p>
      </div>

      <!-- ฟอร์มกรอกข้อมูลในฝั่ง Parent (ใช้ Two-Way Binding [(ngModel)] เพื่ออัปเดตตัวแปรทันที) -->
      <div class="parent-form-grid">
        <div class="form-group">
          <label for="empName">ชื่อ-นามสกุลพนักงาน:</label>
          <input
            id="empName"
            type="text"
            [(ngModel)]="employeeName"
            placeholder="ระบุชื่อพนักงาน..."
          />
        </div>

        <div class="form-group">
          <label for="salaryInput">ฐานเงินเดือน (บาท):</label>
          <input
            id="salaryInput"
            type="number"
            [(ngModel)]="salary"
            min="0"
            step="1000"
          />
        </div>

        <div class="form-group">
          <label for="otInput">ชั่วโมง OT สะสม (ชม./เดือน):</label>
          <input
            id="otInput"
            type="number"
            [(ngModel)]="otHours"
            min="0"
            max="200"
          />
        </div>

        <div class="form-group">
          <label for="elecInput">หน่วยค่าไฟ WFH (หน่วย):</label>
          <input
            id="elecInput"
            type="number"
            [(ngModel)]="electricityUnits"
            min="0"
          />
        </div>
      </div>

      <!-- ====================================================================== -->
      <!-- การเรียกใช้งาน Child Component พร้อมเชื่อมสายสัญญาณ @Input และ @Output -->
      <!-- [salary]="salary" คือการส่งค่าจากตัวแปรของแม่ เข้าสู่ @Input() ของลูก -->
      <!-- (bonusCalculated)="onBonusCalculated($event)" คือการดักรับค่าจาก @Output() ของลูก -->
      <!-- ====================================================================== -->
      <app-bonus-processor-child
        [employeeName]="employeeName"
        [salary]="salary"
        [otHours]="otHours"
        [electricityUnits]="electricityUnits"
        (bonusCalculated)="onBonusCalculated($event)"
        (resetRequested)="onResetRequested()"
      ></app-bonus-processor-child>

      <!-- ส่วนแสดงผลลัพธ์ในฝั่ง Parent เมื่อได้รับค่าตอบกลับจาก Child แล้ว -->
      @if (latestResult) {
        <div class="result-banner" data-testid="parent-result-box">
          <div class="result-title">
            <h3>✅ ผลลัพธ์ที่ Parent ได้รับกลับมาจาก Child (@Output EventPayload)</h3>
            <span class="timestamp">คำนวณเมื่อ: {{ latestResult.calculatedAt }}</span>
          </div>

          <div class="result-summary-grid">
            <div class="summary-box">
              <span>ฐานเงินเดือน</span>
              <strong>{{ latestResult.baseSalary | number: '1.0-0' }} ฿</strong>
            </div>
            <div class="summary-box">
              <span>ค่าตอบแทน OT ({{ latestResult.otHours }} ชม.)</span>
              <strong>+{{ latestResult.otPay | number: '1.0-0' }} ฿</strong>
            </div>
            <div class="summary-box">
              <span>โบนัสประจำปี (1.5x)</span>
              <strong>+{{ latestResult.performanceBonus | number: '1.0-0' }} ฿</strong>
            </div>
            <div class="summary-box">
              <span>เงินช่วยค่าไฟ ({{ latestResult.electricityUnits }} หน่วย)</span>
              <strong>+{{ latestResult.electricitySubsidy | number: '1.0-0' }} ฿</strong>
            </div>
            <div class="summary-box highlight-total">
              <span>ยอดรับสุทธิรวมทั้งสิ้น (Total Payout)</span>
              <strong data-testid="total-payout-value">
                {{ latestResult.totalPayout | number: '1.0-0' }} บาท
              </strong>
            </div>
          </div>

          <p class="tier-note">
            🏆 ระดับการทุ่มเท: <strong>{{ latestResult.gradeTier }}</strong>
          </p>
        </div>
      } @else {
        <div class="empty-result">
          ℹ️ กดปุ่ม <strong>"คำนวณและส่งค่ากลับแม่"</strong> ในกล่อง Child Component ด้านบน
          เพื่อดูการทำงานของ <code>&#64;Output() EventEmitter</code>
        </div>
      }
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
        background: #e0e7ff;
        color: #3730a3;
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
      .parent-form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        background: #f9fafb;
        padding: 1rem;
        border-radius: 10px;
        border: 1px solid #f3f4f6;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }
      .form-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #374151;
      }
      .form-group input {
        padding: 0.55rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 0.95rem;
      }
      .result-banner {
        margin-top: 1.25rem;
        background: #ecfdf5;
        border: 1px solid #6ee7b7;
        border-radius: 12px;
        padding: 1.25rem;
      }
      .result-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 1rem;
      }
      .result-title h3 {
        margin: 0;
        color: #065f46;
        font-size: 1.05rem;
      }
      .timestamp {
        font-size: 0.8rem;
        color: #047857;
      }
      .result-summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 0.75rem;
      }
      .summary-box {
        background: #ffffff;
        padding: 0.75rem;
        border-radius: 8px;
        border: 1px solid #a7f3d0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .summary-box span {
        font-size: 0.78rem;
        color: #6b7280;
      }
      .summary-box strong {
        font-size: 1.05rem;
        color: #065f46;
      }
      .highlight-total {
        background: #059669;
        border-color: #047857;
      }
      .highlight-total span,
      .highlight-total strong {
        color: #ffffff !important;
      }
      .tier-note {
        margin: 0.85rem 0 0 0;
        color: #065f46;
        font-size: 0.9rem;
      }
      .empty-result {
        margin-top: 1rem;
        padding: 0.9rem;
        background: #f8fafc;
        border: 1px dashed #cbd5e1;
        border-radius: 8px;
        color: #475569;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class BonusCalculatorParentComponent {
  // State ในฝั่ง Parent ที่ผูกกับ Input Form ด้วย [(ngModel)]
  public employeeName: string = 'สมชาย สายแบ็คเอนด์';
  public salary: number = 45000;
  public otHours: number = 20;
  public electricityUnits: number = 150;

  // เก็บผลลัพธ์ล่าสุดที่ได้รับมาจาก Child Component ผ่าน @Output()
  public latestResult: BonusCalculationResult | null = null;

  /**
   * Event Handler ที่ทำงานเมื่อ Child ยิง `bonusCalculated.emit(payload)`
   */
  public onBonusCalculated(result: BonusCalculationResult): void {
    this.latestResult = result;
  }

  /**
   * Event Handler ที่ทำงานเมื่อ Child ยิง `resetRequested.emit()`
   */
  public onResetRequested(): void {
    this.employeeName = 'สมชาย สายแบ็คเอนด์';
    this.salary = 45000;
    this.otHours = 0;
    this.electricityUnits = 0;
    this.latestResult = null;
  }
}

