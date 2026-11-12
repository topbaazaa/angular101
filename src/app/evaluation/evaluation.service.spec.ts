import { TestBed } from '@angular/core/testing';
import { EvaluationService } from './evaluation.service';

/**
 * ============================================================================
 * ไฟล์: evaluation.service.spec.ts (Unit Test สำหรับ Service & Angular Signals)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - เปรียบเสมือนการเขียน JUnit 5 ทดสอบ Business Logic ของ `@Service` ใน Spring Boot
 * - โครงสร้างการเขียนเทสต์ใช้รูปแบบมาตรฐาน **AAA Pattern**:
 *   1. Arrange (จัดเตรียมข้อมูลและ Context)
 *   2. Act     (เรียกใช้งานเมธอดที่ต้องการทดสอบ)
 *   3. Assert  (ตรวจสอบผลลัพธ์ด้วย `expect(...).toBe(...)`)
 * ============================================================================
 */
describe('EvaluationService (Signals & Computed State Management)', () => {
  let service: EvaluationService;

  beforeEach(() => {
    // Arrange: จำลอง DI Container ของ Angular ด้วย TestBed
    TestBed.configureTestingModule({
      providers: [EvaluationService],
    });

    // ดึง Singleton Instance ของ EvaluationService ออกมาจาก TestBed
    service = TestBed.inject(EvaluationService);
  });

  it('1. ควรสร้าง Service สำเร็จและมีค่าเริ่มต้นของ Signal ที่ถูกต้อง', () => {
    // Assert: อ่านค่าจาก Signal ด้วยการใส่วงเล็บ `()`
    expect(service).toBeTruthy();
    expect(service.kpiScore()).toBe(52);
    expect(service.softSkillScore()).toBe(35);
    expect(service.totalScore()).toBe(87);
    expect(service.grade()).toBe('A');
  });

  it('2. ควรคำนวณเกรด S, A, B, C, D, F ผ่าน computed() ได้อย่างแม่นยำเมื่อคะแนนเปลี่ยน', () => {
    // Act & Assert: ทดสอบเกรด S (>= 90)
    service.setScores(55, 38); // 93
    expect(service.totalScore()).toBe(93);
    expect(service.grade()).toBe('S');
    expect(service.evaluationSummary().isPassed).toBe(true);

    // Act & Assert: ทดสอบเกรด B (70 - 79)
    service.setScores(45, 30); // 75
    expect(service.totalScore()).toBe(75);
    expect(service.grade()).toBe('B');

    // Act & Assert: ทดสอบเกรด C (60 - 69)
    service.setScores(40, 22); // 62
    expect(service.totalScore()).toBe(62);
    expect(service.grade()).toBe('C');

    // Act & Assert: ทดสอบเกรด F (< 50) และสถานะไม่ผ่านเกณฑ์
    service.setScores(25, 15); // 40
    expect(service.totalScore()).toBe(40);
    expect(service.grade()).toBe('F');
    expect(service.evaluationSummary().isPassed).toBe(false);
  });

  it('3. ควรป้องกันคะแนนเกินขอบเขต (Clamping: KPI <= 60, SoftSkill <= 40)', () => {
    // Act: ลองส่งค่าเกินเพดานและค่าติดลบ
    service.updateDraftEvaluation('ผู้ทดสอบระบบ', 999, -20);

    // Assert: KPI ต้องถูกจำกัดไว้ที่ 60 และ SoftSkill ต้องไม่ต่ำกว่า 0
    expect(service.kpiScore()).toBe(60);
    expect(service.softSkillScore()).toBe(0);
    expect(service.totalScore()).toBe(60);
  });

  it('4. ควรบันทึกผลการประเมินลงในประวัติ (history signal) และคำนวณค่าเฉลี่ยใหม่ได้', () => {
    // Arrange
    const initialCount = service.history().length;
    service.updateDraftEvaluation('สมหญิง สายเทสต์', 50, 30); // รวม 80 (เกรด A)

    // Act
    const saved = service.saveCurrentEvaluation();

    // Assert
    expect(service.history().length).toBe(initialCount + 1);
    expect(saved.employeeName).toBe('สมหญิง สายเทสต์');
    expect(saved.totalScore).toBe(80);
    expect(saved.grade).toBe('A');
  });
});

