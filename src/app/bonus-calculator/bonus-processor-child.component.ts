import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * ============================================================================
 * DTO / Interface สำหรับผลลัพธ์การคำนวณโบนัสและสวัสดิการค่าไฟ
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - เปรียบเสมือน Response DTO (Data Transfer Object) หรือ Record ใน Java / C#
 *   ที่ใช้ห่อหุ้มข้อมูลผลลัพธ์เพื่อส่งกลับจาก Child Service/Component ไปยังผู้เรียก (Parent)
 */
export interface BonusCalculationResult {
  baseSalary: number;
  otHours: number;
  electricityUnits: number;
  otPay: number;
  performanceBonus: number;
  electricitySubsidy: number;
  totalPayout: number;
  gradeTier: string;
  calculatedAt: string;
}

/**
 * ============================================================================
 * ไฟล์: bonus-processor-child.component.ts (Child Component)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - Child Component เปรียบเสมือน "Domain Calculation Engine / Sub-module" ที่รับพารามิเตอร์
 *   เข้ามาประมวลผล แล้วส่ง Event ผลลัพธ์กลับออกไปโดยไม่ผูกติด (Decoupled) กับตัวแม่โดยตรง
 * - `@Input()` เปรียบเสมือน "Method Parameters / Request DTO" ที่ตัวแม่ส่งเข้ามาให้ตัวลูก
 * - `@Output()` + `EventEmitter` เปรียบเสมือน "Callback Function / Domain Event Publisher"
 *   ที่ตัวลูกใช้ยิง (emit) ข้อมูลกลับไปหาตัวแม่เมื่อประมวลผลเสร็จสิ้นหรือกดปุ่มสั่งงาน
 * ============================================================================
 */
@Component({
  selector: 'app-bonus-processor-child',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="child-card">
      <div class="child-header">
        <span class="badge-child">Child Component (BonusProcessorChildComponent)</span>
        <h4>กลไกคำนวณโบนัส ค่าล่วงเวลา (OT) และเงินช่วยเหลือค่าไฟ</h4>
      </div>

      <!-- แสดงค่าที่รับเข้ามาผ่าน @Input() จาก Parent Component -->
      <div class="input-preview-grid">
        <div class="preview-item">
          <span class="label">พนักงาน (@Input employeeName):</span>
          <strong class="value">{{ employeeName || 'ไม่ได้ระบุชื่อ' }}</strong>
        </div>
        <div class="preview-item">
          <span class="label">ฐานเงินเดือน (@Input salary):</span>
          <strong class="value">{{ salary | number: '1.0-0' }} บาท</strong>
        </div>
        <div class="preview-item">
          <span class="label">ชั่วโมง OT (@Input otHours):</span>
          <strong class="value">{{ otHours }} ชั่วโมง</strong>
        </div>
        <div class="preview-item">
          <span class="label">หน่วยค่าไฟหอพัก/WFH (@Input electricityUnits):</span>
          <strong class="value">{{ electricityUnits }} หน่วย</strong>
        </div>
      </div>

      <!-- ส่วนตรวจสอบความถูกต้องของข้อมูล (Validation) ก่อนคำนวณ -->
      @if (validationError) {
        <div class="alert-error" role="alert">
          <strong>⚠️ ข้อมูลไม่ถูกต้อง (Validation Error):</strong> {{ validationError }}
        </div>
      }

      <div class="formula-info">
        <small>
          💡 <strong>สูตรคำนวณฝั่งลูก:</strong> โบนัสพื้นฐาน 1.5 เท่าของเงินเดือน + ค่า OT (ชั่วโมงละ
          250 บาท, หากเกิน 40 ชม. ได้เรทพิเศษ 350 บาท) + สวัสดิการค่าไฟ WFH (หน่วยละ 4.5 บาท)
        </small>
      </div>

      <!-- ปุ่มสั่งคำนวณและปุ่ม Reset ที่จะยิง @Output() EventEmitter กลับไปหา Parent -->
      <div class="action-buttons">
        <button type="button" class="btn-calculate" (click)="processCalculation()">
          ⚡ คำนวณและส่งค่ากลับแม่ (@Output emit)
        </button>
        <button type="button" class="btn-reset" (click)="resetAll()">
          🔄 ล้างค่าทั้งหมด (Reset)
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .child-card {
        border: 2px dashed #6366f1;
        background: #f5f3ff;
        border-radius: 12px;
        padding: 1.25rem;
        margin-top: 1rem;
      }
      .child-header {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin-bottom: 1rem;
      }
      .child-header h4 {
        margin: 0;
        color: #1e1b4b;
      }
      .badge-child {
        align-self: flex-start;
        background: #4f46e5;
        color: #ffffff;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.2rem 0.6rem;
        border-radius: 999px;
      }
      .input-preview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
        background: #ffffff;
        padding: 0.9rem;
        border-radius: 8px;
        border: 1px solid #e0e7ff;
        margin-bottom: 0.85rem;
      }
      .preview-item {
        display: flex;
        flex-direction: column;
        font-size: 0.875rem;
      }
      .preview-item .label {
        color: #6b7280;
        font-size: 0.78rem;
      }
      .preview-item .value {
        color: #111827;
        font-size: 1rem;
        margin-top: 0.15rem;
      }
      .alert-error {
        background: #fef2f2;
        border-left: 4px solid #ef4444;
        color: #991b1b;
        padding: 0.75rem;
        border-radius: 6px;
        margin-bottom: 0.85rem;
        font-size: 0.875rem;
      }
      .formula-info {
        color: #4338ca;
        background: #eef2ff;
        padding: 0.6rem 0.8rem;
        border-radius: 6px;
        margin-bottom: 1rem;
      }
      .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      .btn-calculate {
        background: #4f46e5;
        color: white;
        border: none;
        padding: 0.65rem 1.15rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      .btn-calculate:hover {
        background: #4338ca;
      }
      .btn-reset {
        background: #ffffff;
        color: #dc2626;
        border: 1px solid #fca5a5;
        padding: 0.65rem 1.15rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-reset:hover {
        background: #fef2f2;
      }
    `,
  ],
})
export class BonusProcessorChildComponent {
  // ============================================================================
  // 1. การรับข้อมูลขาเข้าจาก Parent (@Input)
  // [เปรียบเทียบกับ Backend]: เหมือน Parameter ที่รับเข้ามาในฟังก์ชัน หรือ Property ใน Request DTO
  // ============================================================================
  @Input() employeeName: string = 'สมชาย สายแบ็คเอนด์';
  @Input() salary: number = 45000;
  @Input() otHours: number = 20;
  @Input() electricityUnits: number = 150;

  // ============================================================================
  // 2. การส่งข้อมูลขาออกกลับไปหา Parent (@Output)
  // [เปรียบเทียบกับ Backend]: เหมือน Event Bus / Callback / Webhook ที่ยิง Payload กลับไปหา Caller
  // ============================================================================
  @Output() bonusCalculated = new EventEmitter<BonusCalculationResult>();
  @Output() resetRequested = new EventEmitter<void>();

  // เก็บข้อความแจ้งเตือนกรณีข้อมูล Input ไม่ผ่านเกณฑ์ (Validation)
  public validationError: string = '';

  /**
   * ดำเนินการตรวจสอบความถูกต้อง (Validation) และคำนวณผลลัพธ์ก่อนยิง Event กลับหาตัวแม่
   */
  public processCalculation(): void {
    // 1. Validate Input (เหมือนการทำ Bean Validation / FluentValidation ใน Backend)
    if (!this.employeeName || this.employeeName.trim().length === 0) {
      this.validationError = 'กรุณาระบุชื่อพนักงานก่อนคำนวณ';
      return;
    }
    if (this.salary <= 0) {
      this.validationError = 'ฐานเงินเดือนต้องมากกว่า 0 บาท';
      return;
    }
    if (this.otHours < 0 || this.otHours > 200) {
      this.validationError = 'ชั่วโมง OT ต้องอยู่ระหว่าง 0 ถึง 200 ชั่วโมงต่อเดือน';
      return;
    }
    if (this.electricityUnits < 0) {
      this.validationError = 'จำนวนหน่วยค่าไฟต้องไม่ติดลบ';
      return;
    }

    // ล้าง Error เมื่อข้อมูลถูกต้องทั้งหมด
    this.validationError = '';

    // 2. Business Logic: คำนวณค่าล่วงเวลา (OT) โบนัส และสวัสดิการค่าไฟ WFH
    const otRate = this.otHours > 40 ? 350 : 250;
    const otPay = this.otHours * otRate;
    const performanceBonus = Math.round(this.salary * 1.5);
    const electricitySubsidy = Math.round(this.electricityUnits * 4.5);
    const totalPayout = this.salary + otPay + performanceBonus + electricitySubsidy;

    let gradeTier = 'Standard Performer';
    if (this.otHours >= 40) {
      gradeTier = 'High Dedication (เรท OT พิเศษ)';
    } else if (this.otHours >= 15) {
      gradeTier = 'Active Contributor';
    }

    const resultPayload: BonusCalculationResult = {
      baseSalary: this.salary,
      otHours: this.otHours,
      electricityUnits: this.electricityUnits,
      otPay,
      performanceBonus,
      electricitySubsidy,
      totalPayout,
      gradeTier,
      calculatedAt: new Date().toLocaleTimeString('th-TH'),
    };

    // 3. ส่งข้อมูล (Emit) ออกไปยัง Parent Component ผ่าน @Output()
    this.bonusCalculated.emit(resultPayload);
  }

  /**
   * ล้างค่าสถานะในตัวลูกและส่งสัญญาณบอกตัวแม่ให้รีเซ็ตค่าเริ่มต้น
   */
  public resetAll(): void {
    this.validationError = '';
    this.resetRequested.emit();
  }
}

