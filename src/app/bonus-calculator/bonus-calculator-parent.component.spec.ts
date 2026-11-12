import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BonusCalculatorParentComponent } from './bonus-calculator-parent.component';

/**
 * ============================================================================
 * ไฟล์: bonus-calculator-parent.component.spec.ts
 * ============================================================================
 * ทดสอบการทำงานร่วมกันระหว่าง Parent Component และ Child Component (@Input / @Output)
 * รวมถึงการตรวจสอบ DOM Rendering หลังจาก `await fixture.whenStable()`
 * ============================================================================
 */
describe('BonusCalculatorParentComponent (Parent-Child @Input / @Output & DOM Test)', () => {
  let fixture: ComponentFixture<BonusCalculatorParentComponent>;
  let component: BonusCalculatorParentComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BonusCalculatorParentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BonusCalculatorParentComponent);
    component = fixture.componentInstance;
  });

  it('1. ควรเรนเดอร์ Parent Component และส่งค่าเริ่มต้นไปยัง Child Component ได้ถูกต้อง', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
    const nativeEl = fixture.nativeElement as HTMLElement;
    expect(nativeEl.textContent).toContain('สมชาย สายแบ็คเอนด์');
    expect(nativeEl.textContent).toContain('45,000');
  });

  it('2. เมื่อกดปุ่มคำนวณใน Child Component ควรส่งผลลัพธ์ผ่าน @Output() กลับมาแสดงบน DOM ของ Parent', async () => {
    // Arrange: ตั้งค่าตัวแปรใน Parent (ฐานเงินเดือน 50,000, OT 10 ชม., ค่าไฟ 100 หน่วย)
    // โบนัส 1.5x = 75,000, ค่า OT 10*250 = 2,500, ค่าไฟ 100*4.5 = 450 -> รวมสุทธิ = 127,950 บาท
    component.salary = 50000;
    component.otHours = 10;
    component.electricityUnits = 100;

    fixture.detectChanges();
    await fixture.whenStable();

    // Act: ค้นหาปุ่มคำนวณใน Child Component แล้วจำลองการคลิก (Click Event)
    const calcBtn = fixture.nativeElement.querySelector('.btn-calculate') as HTMLButtonElement;
    calcBtn.click();

    fixture.detectChanges();
    await fixture.whenStable();

    // Assert: ตรวจสอบทั้ง State ในตัวแม่ และข้อความที่เรนเดอร์บน DOM จริง
    expect(component.latestResult).not.toBeNull();
    expect(component.latestResult?.totalPayout).toBe(127950);

    const payoutEl = fixture.nativeElement.querySelector(
      '[data-testid="total-payout-value"]'
    ) as HTMLElement;
    expect(payoutEl?.textContent).toContain('127,950');
  });
});
