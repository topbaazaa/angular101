import { Injectable, computed, effect, signal } from '@angular/core';

/**
 * โครงสร้างข้อมูลประวัติการประเมินผลพนักงาน (Immutable Record / DTO)
 */
export interface EvaluationRecord {
  id: number;
  employeeName: string;
  kpiScore: number; // คะแนน KPI (0 - 60)
  softSkillScore: number; // คะแนน Teamwork & Core Values (0 - 40)
  totalScore: number; // คะแนนรวม (0 - 100)
  grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  statusText: string;
  evaluatedAt: string;
}

/**
 * ============================================================================
 * ไฟล์: evaluation.service.ts (Shared Singleton Service + Angular Signals)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * 1. `@Injectable({ providedIn: 'root' })` เทียบเท่ากับ `@Service` (Singleton Scope) ใน Spring Boot
 *    หรือ `services.AddSingleton<EvaluationService>()` ใน .NET DI Container
 *    นั่นหมายความว่าทั้งแอปพลิเคชันจะแชร์ Instance เดียวกัน (In-Memory Shared State)
 * 2. การสื่อสารระหว่าง Sibling Components (พี่น้องที่ไม่ได้เป็นแม่-ลูกกัน):
 *    แทนที่จะส่ง `@Input/@Output` อ้อมผ่านตัวแม่หลายชั้น (Prop Drilling) เราใช้ Shared Singleton Service
 *    ทำหน้าที่เสมือน "In-Memory Message Broker / Redis Cache กลาง" ที่ Sibling A เขียนค่าลงไป
 *    และ Sibling B อ่านค่าไปแสดงผลแบบ Real-time Reactive ทันที!
 * 3. `signal()`, `computed()`, `asReadonly()`:
 *    - `WritableSignal` (`signal()`) เก็บ State ต้นทางที่แก้ไขได้เฉพาะภายใน Service (Private State)
 *    - `asReadonly()` เปิดให้ภายนอกอ่านได้อย่างเดียว ป้องกัน Component แอบสั่ง `.set()` เองโดยไม่ผ่าน Business Logic
 *    - `computed()` คือ Derived State ที่คำนวณใหม่อัตโนมัติเมื่อ Signal ต้นทางเปลี่ยน พร้อมทำ Memoization (แคชผลลัพธ์ไว้ถ้าค่าต้นทางไม่เปลี่ยน)
 * ============================================================================
 */
@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  // ============================================================================
  // 1. Private Writable Signals (State ต้นทางที่ซ่อนไว้ภายใน Service เท่านั้น)
  // ============================================================================
  private readonly _employeeName = signal<string>('วิภาวี ซีเนียร์เดฟ');
  private readonly _kpiScore = signal<number>(52); // เต็ม 60
  private readonly _softSkillScore = signal<number>(35); // เต็ม 40
  private readonly _history = signal<EvaluationRecord[]>([
    {
      id: 1,
      employeeName: 'กิตติพงศ์ เดฟอ็อปส์',
      kpiScore: 55,
      softSkillScore: 38,
      totalScore: 93,
      grade: 'S',
      statusText: 'ดีเยี่ยมระดับท็อป (เลื่อนตำแหน่ง + โบนัสพิเศษ)',
      evaluatedAt: '09:30:00',
    },
  ]);

  // ============================================================================
  // 2. Public Read-only Signals (เปิดให้ Component ภายนอกอ่านค่าได้อย่างเดียวด้วย asReadonly())
  // [เปรียบเทียบกับ Backend]: เหมือนการทำ Private Field แล้วเปิดเฉพาะ Public Getter หรือ ReadOnlyCollection
  // ============================================================================
  public readonly employeeName = this._employeeName.asReadonly();
  public readonly kpiScore = this._kpiScore.asReadonly();
  public readonly softSkillScore = this._softSkillScore.asReadonly();
  public readonly history = this._history.asReadonly();

  // ============================================================================
  // 3. Computed Signals (คำนวณเกรดและสถานะอัตโนมัติแบบ Reactive + Memoized)
  // ============================================================================
  public readonly totalScore = computed<number>(() => {
    const rawTotal = this._kpiScore() + this._softSkillScore();
    return Math.max(0, Math.min(100, rawTotal));
  });

  public readonly grade = computed<'S' | 'A' | 'B' | 'C' | 'D' | 'F'>(() => {
    const score = this.totalScore();
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  });

  public readonly evaluationSummary = computed(() => {
    const score = this.totalScore();
    const currentGrade = this.grade();
    const isPassed = score >= 60;

    const statusMap: Record<'S' | 'A' | 'B' | 'C' | 'D' | 'F', string> = {
      S: 'ดีเยี่ยมระดับท็อป (เลื่อนตำแหน่ง + โบนัสพิเศษ)',
      A: 'ดีมาก (ผ่านเกณฑ์ดีเยี่ยม + ปรับขึ้นเงินเดือนสูงสุด)',
      B: 'ดี (ผ่านเกณฑ์มาตรฐาน)',
      C: 'พอใช้ (ผ่านเกณฑ์ขั้นต่ำ)',
      D: 'ต้องปรับปรุง (เข้าแผนพัฒนาทักษะ PIP)',
      F: 'ไม่ผ่านการประเมิน (ต้องทบทวนผลการปฏิบัติงาน)',
    };

    return {
      employeeName: this._employeeName(),
      totalScore: score,
      grade: currentGrade,
      isPassed,
      statusText: statusMap[currentGrade],
    };
  });

  public readonly averageHistoryScore = computed<number>(() => {
    const items = this._history();
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + item.totalScore, 0);
    return Math.round((sum / items.length) * 10) / 10;
  });

  constructor() {
    // `effect()` จะทำงานอัตโนมัติเมื่อ Signal ที่ถูกอ่านภายในฟังก์ชันนี้มีการเปลี่ยนแปลงค่า
    // เหมาะสำหรับงาน Side-effect เช่น Logging หรือการ Sync ข้อมูลลง LocalStorage
    effect(() => {
      const summary = this.evaluationSummary();
      console.debug(
        `[EvaluationService Signal Effect] คะแนนปัจจุบันของ ${summary.employeeName}: ${summary.totalScore}/100 (เกรด ${summary.grade})`
      );
    });
  }

  // ============================================================================
  // 4. Command / Mutator Methods (ช่องทางเดียวที่อนุญาตให้แก้ไข State ได้)
  // ============================================================================
  public updateDraftEvaluation(name: string, kpi: number, softSkill: number): void {
    const clampedKpi = Math.max(0, Math.min(60, Number(kpi) || 0));
    const clampedSoft = Math.max(0, Math.min(40, Number(softSkill) || 0));

    this._employeeName.set(name.trim() || 'พนักงานไม่ระบุชื่อ');
    this._kpiScore.set(clampedKpi);
    this._softSkillScore.set(clampedSoft);
  }

  public setScores(kpi: number, softSkill: number): void {
    this.updateDraftEvaluation(this._employeeName(), kpi, softSkill);
  }

  public saveCurrentEvaluation(): EvaluationRecord {
    const summary = this.evaluationSummary();
    const newRecord: EvaluationRecord = {
      id: Date.now(),
      employeeName: summary.employeeName,
      kpiScore: this._kpiScore(),
      softSkillScore: this._softSkillScore(),
      totalScore: summary.totalScore,
      grade: summary.grade,
      statusText: summary.statusText,
      evaluatedAt: new Date().toLocaleTimeString('th-TH'),
    };

    // ใช้ `.update()` เพื่อสร้าง Array ใหม่ (Immutable Update) ให้ Signal รับรู้การเปลี่ยนแปลง
    this._history.update((prev) => [newRecord, ...prev]);
    return newRecord;
  }

  public resetScores(): void {
    this._employeeName.set('วิภาวี ซีเนียร์เดฟ');
    this._kpiScore.set(0);
    this._softSkillScore.set(0);
  }
}

