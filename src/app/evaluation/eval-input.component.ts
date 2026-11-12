import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EvaluationService } from './evaluation.service';

/**
 * ============================================================================
 * ไฟล์: eval-input.component.ts (Sibling A - ผู้ส่งข้อมูล / Producer)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - เปรียบเสมือน "Producer Service / Command Controller" ที่รับ Input จากผู้ใช้
 *   แล้วเรียกใช้เมธอดของ Singleton Service (`EvaluationService`) เพื่ออัปเดต State
 * - สังเกตว่า `EvalInputComponent` ไม่จำเป็นต้องรู้จัก `EvalResultComponent` เลย
 *   (Loose Coupling) ไม่มีการใช้ `@Input()` หรือ `@Output()` ระหว่างกัน
 * ============================================================================
 */
@Component({
  selector: 'app-eval-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sibling-box sibling-a">
      <div class="sibling-badge">Sibling A: EvalInputComponent (ฝั่งกรอกคะแนน)</div>
      <h3>📝 กรอกคะแนนประเมินผล (Real-time Signal Producer)</h3>

      <div class="form-field">
        <label for="evalEmpName">ชื่อพนักงานที่รับการประเมิน:</label>
        <input
          id="evalEmpName"
          type="text"
          [ngModel]="evalService.employeeName()"
          (ngModelChange)="onNameChange($event)"
          placeholder="ชื่อพนักงาน..."
        />
      </div>

      <div class="form-field">
        <label for="kpiRange">
          คะแนนผลงานหลัก KPI (เต็ม 60): <strong>{{ evalService.kpiScore() }} / 60</strong>
        </label>
        <input
          id="kpiRange"
          type="range"
          min="0"
          max="60"
          [ngModel]="evalService.kpiScore()"
          (ngModelChange)="onKpiChange($event)"
        />
        <input
          id="kpiNumber"
          type="number"
          min="0"
          max="60"
          [ngModel]="evalService.kpiScore()"
          (ngModelChange)="onKpiChange($event)"
        />
      </div>

      <div class="form-field">
        <label for="softRange">
          คะแนน Teamwork & Core Values (เต็ม 40):
          <strong>{{ evalService.softSkillScore() }} / 40</strong>
        </label>
        <input
          id="softRange"
          type="range"
          min="0"
          max="40"
          [ngModel]="evalService.softSkillScore()"
          (ngModelChange)="onSoftSkillChange($event)"
        />
        <input
          id="softNumber"
          type="number"
          min="0"
          max="40"
          [ngModel]="evalService.softSkillScore()"
          (ngModelChange)="onSoftSkillChange($event)"
        />
      </div>

      <div class="btn-row">
        <button type="button" class="btn-save" (click)="saveRecord()">
          💾 บันทึกผลประเมินลงประวัติ
        </button>
        <button type="button" class="btn-clear" (click)="evalService.resetScores()">
          🔄 รีเซ็ตคะแนนเป็น 0
        </button>
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
      .sibling-a {
        background: #eff6ff;
        border: 2px solid #93c5fd;
      }
      .sibling-badge {
        display: inline-block;
        background: #2563eb;
        color: #ffffff;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        margin-bottom: 0.5rem;
      }
      h3 {
        margin: 0.25rem 0 1rem 0;
        color: #1e3a8a;
        font-size: 1.1rem;
      }
      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin-bottom: 0.9rem;
      }
      .form-field label {
        font-size: 0.85rem;
        color: #1e40af;
      }
      .form-field input[type='text'],
      .form-field input[type='number'] {
        padding: 0.5rem 0.7rem;
        border: 1px solid #bfdbfe;
        border-radius: 6px;
        font-size: 0.95rem;
      }
      .btn-row {
        display: flex;
        gap: 0.65rem;
        flex-wrap: wrap;
        margin-top: 1rem;
      }
      .btn-save {
        background: #2563eb;
        color: white;
        border: none;
        padding: 0.6rem 1rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-save:hover {
        background: #1d4ed8;
      }
      .btn-clear {
        background: white;
        color: #1e40af;
        border: 1px solid #93c5fd;
        padding: 0.6rem 1rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }
    `,
  ],
})
export class EvalInputComponent {
  // ใช้ฟังก์ชัน `inject()` แทนการเขียน Constructor Injection แบบเก่า
  // เปรียบเสมือน `@Autowired private final EvaluationService evalService;` ใน Spring Boot
  public readonly evalService = inject(EvaluationService);

  public onNameChange(newName: string): void {
    this.evalService.updateDraftEvaluation(
      newName,
      this.evalService.kpiScore(),
      this.evalService.softSkillScore()
    );
  }

  public onKpiChange(newKpi: number): void {
    this.evalService.updateDraftEvaluation(
      this.evalService.employeeName(),
      Number(newKpi),
      this.evalService.softSkillScore()
    );
  }

  public onSoftSkillChange(newSoftSkill: number): void {
    this.evalService.updateDraftEvaluation(
      this.evalService.employeeName(),
      this.evalService.kpiScore(),
      Number(newSoftSkill)
    );
  }

  public saveRecord(): void {
    this.evalService.saveCurrentEvaluation();
  }
}

