import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  computed,
  signal,
} from '@angular/core';

export interface EmployeeDirectoryItem {
  id: number;
  name: string;
  role: string;
  department: 'Backend' | 'Frontend' | 'DevOps' | 'Security';
  active: boolean;
  performanceIndex: number;
}

/**
 * ============================================================================
 * ไฟล์: user-directory.component.ts (Lifecycle Hooks & Performance Optimization)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * 1. Lifecycle Hooks ใน Angular เปรียบเสมือน Bean Lifecycle ใน Spring Boot หรือ .NET HostedService:
 *    - `constructor()`     ➔ Bean Instantiation (สร้าง Object ในหน่วยความจำ ห้ามยิง API ที่นี่!)
 *    - `ngOnChanges()`     ➔ ทำงานเมื่อ `@Input()` เปลี่ยนค่า (เหมือน Property Setter / Config Reload)
 *    - `ngOnInit()`        ➔ `@PostConstruct` ใน Spring (จุดที่เหมาะที่สุดในการดึงข้อมูล API เริ่มต้น)
 *    - `ngAfterViewInit()` ➔ ทำงานเมื่อ DOM และ `@ViewChild` เรนเดอร์เสร็จสมบูรณ์แล้ว
 *    - `ngOnDestroy()`     ➔ `@PreDestroy` หรือ `IDisposable.Dispose()` (คืน Memory, ล้าง Timer/Socket)
 *
 * 2. `ChangeDetectionStrategy.OnPush`:
 *    - ปกติ Angular (Default Strategy) จะตรวจเช็กทุก Component ทั้ง Tree เมื่อเกิด Event ใดๆ
 *    - เมื่อเปิด `OnPush` Angular จะข้ามการตรวจเช็ก Component นี้ทันที ยกเว้น:
 *      (ก) `@Input()` เปลี่ยน Reference ใหม่ (Immutable)
 *      (ข) มี Event เกิดขึ้นภายใน Component นี้เอง (เช่น กดปุ่ม)
 *      (ค) `Signal` ที่อ่านอยู่ใน Template มีการเปลี่ยนค่า
 * ============================================================================
 */
@Component({
  selector: 'app-user-directory',
  standalone: true,
  imports: [CommonModule],
  // เปิดโหมด OnPush เพื่อลดภาระการทำ Change Detection ของ CPU (Best Practice สำหรับแอปขนาดใหญ่)
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="module-card">
      <div class="module-header">
        <span class="module-tag">
          Module 4: Lifecycle Hooks, OnPush, &#64;if / &#64;for & &#64;defer (on viewport)
        </span>
        <h2 #directoryTitle>
          👥 ทำเนียบพนักงานและสถิติองค์กร (OnPush + Lifecycle + Deferrable Views)
        </h2>
        <p class="module-desc">
          สาธิตลำดับการทำงานของ Lifecycle Hooks (ดูได้ทั้งใน <code>Console</code> และตาราง Log
          ด้านล่าง), การใช้ <code>ChangeDetectionStrategy.OnPush</code>, Built-in Control Flow
          (<code>&#64;if</code>, <code>&#64;for ... track</code>) และ
          <code>&#64;defer (on viewport)</code>
        </p>
      </div>

      <!-- แถบปุ่มกรองแผนก และจำลองการเปลี่ยนค่าเพื่อดูการทำงานของ OnPush + Signals -->
      <div class="toolbar">
        <div class="filter-group">
          <span>กรองตามแผนก:</span>
          @for (dept of departments; track dept) {
            <button
              type="button"
              class="btn-filter"
              [class.active]="selectedDepartment() === dept"
              (click)="selectDepartment(dept)"
            >
              {{ dept }}
            </button>
          }
        </div>

        <button type="button" class="btn-toggle-active" (click)="toggleOnlyActive()">
          {{ showOnlyActive() ? '🟢 แสดงเฉพาะพนักงานที่ปฏิบัติงานอยู่' : '⚪ แสดงพนักงานทั้งหมด' }}
        </button>
      </div>

      <!-- แสดงรายชื่อพนักงานด้วย Built-in Control Flow @if และ @for พร้อม track item.id -->
      @if (filteredEmployees().length > 0) {
        <div class="employee-grid">
          <!-- [สำคัญมาก]: track emp.id ช่วยให้ Angular อ้างอิง DOM Node เดิมด้วย Primary Key -->
          <!-- ไม่ต้องทุบ DOM ทิ้งแล้วสร้างใหม่ทั้งหมดเมื่อข้อมูลใน Array เปลี่ยนแปลง -->
          @for (emp of filteredEmployees(); track emp.id; let idx = $index; let isFirst = $first) {
            <article class="emp-card" [class.first-highlight]="isFirst">
              <div class="emp-top">
                <span class="emp-index">#{{ idx + 1 }} (ID: {{ emp.id }})</span>
                <span class="dept-badge">{{ emp.department }}</span>
              </div>
              <h4>{{ emp.name }}</h4>
              <p class="emp-role">{{ emp.role }}</p>
              <div class="emp-footer">
                <span [class.status-on]="emp.active" [class.status-off]="!emp.active">
                  {{ emp.active ? '● Active' : '○ On Leave' }}
                </span>
                <strong>ดัชนีผลงาน: {{ emp.performanceIndex }}%</strong>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="empty-state">ไม่พบข้อมูลพนักงานในเงื่อนไขที่เลือก</div>
      }

      <!-- ตารางบันทึกลำดับการทำงานของ Lifecycle Hooks แบบ Real-time -->
      <div class="lifecycle-log-box">
        <h4>🔍 บันทึกลำดับการทำงานของ Lifecycle Hooks (เรียงจากก่อนไปหลัง):</h4>
        <ol class="log-list">
          @for (log of lifecycleLogs(); track $index) {
            <li><code>{{ log }}</code></li>
          }
        </ol>
      </div>

      <!-- ====================================================================== -->
      <!-- @defer (on viewport): โหลดและเรนเดอร์ส่วนกราฟสถิติเมื่อผู้ใช้เลื่อนหน้าจอมาถึง -->
      <!-- ช่วยลดขนาด Initial Render และประหยัดทรัพยากรเครื่องผู้ใช้ -->
      <!-- ====================================================================== -->
      <div class="defer-section-wrapper">
        @defer (on viewport) {
          <div class="stats-chart-card" data-testid="deferred-stats-card">
            <div class="stats-header">
              <span class="defer-badge">✨ โหลดสำเร็จด้วย &#64;defer (on viewport)</span>
              <h3>📈 กราฟสถิติดัชนีประสิทธิภาพพนักงานรายแผนก</h3>
            </div>
            <div class="bar-chart">
              @for (emp of filteredEmployees(); track emp.id) {
                <div class="bar-row">
                  <span class="bar-label">{{ emp.name }} ({{ emp.department }})</span>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width.%]="emp.performanceIndex">
                      {{ emp.performanceIndex }}%
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        } @placeholder {
          <div class="defer-placeholder">
            ⏳ พื้นที่แสดงกราฟสถิติเชิงลึก (กำลังรอให้เลื่อนหน้าจอมาถึงจุดนี้ด้วย
            <code>&#64;defer (on viewport)</code>...)
          </div>
        } @loading (minimum 200ms) {
          <div class="defer-loading">🔄 กำลังโหลดโมดูลกราฟสถิติพนักงาน...</div>
        } @error {
          <div class="defer-error">❌ ไม่สามารถโหลดส่วนแสดงผลกราฟสถิติได้</div>
        }
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
        background: #dcfce7;
        color: #166534;
        font-size: 0.75rem;
        font-weight: 700;
        padding: 0.25rem 0.65rem;
        border-radius: 6px;
      }
      .module-desc {
        color: #4b5563;
        font-size: 0.92rem;
        margin-bottom: 1.15rem;
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1.15rem;
        background: #f8fafc;
        padding: 0.85rem;
        border-radius: 10px;
      }
      .filter-group {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        flex-wrap: wrap;
      }
      .btn-filter {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        padding: 0.4rem 0.8rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .btn-filter.active {
        background: #0f766e;
        color: #ffffff;
        border-color: #0f766e;
      }
      .btn-toggle-active {
        background: #ffffff;
        border: 1px solid #94a3b8;
        padding: 0.45rem 0.85rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
      }
      .employee-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.9rem;
        margin-bottom: 1.25rem;
      }
      .emp-card {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.95rem;
        background: #ffffff;
      }
      .emp-card.first-highlight {
        border-color: #14b8a6;
        background: #f0fdfa;
      }
      .emp-top {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #64748b;
      }
      .dept-badge {
        background: #e2e8f0;
        color: #1e293b;
        padding: 0.1rem 0.45rem;
        border-radius: 4px;
        font-weight: 600;
      }
      .emp-card h4 {
        margin: 0.4rem 0 0.2rem 0;
        color: #0f172a;
      }
      .emp-role {
        margin: 0 0 0.7rem 0;
        font-size: 0.84rem;
        color: #475569;
      }
      .emp-footer {
        display: flex;
        justify-content: space-between;
        font-size: 0.82rem;
        border-top: 1px solid #f1f5f9;
        padding-top: 0.5rem;
      }
      .status-on {
        color: #16a34a;
        font-weight: 600;
      }
      .status-off {
        color: #9ca3af;
      }
      .lifecycle-log-box {
        background: #1e293b;
        color: #e2e8f0;
        padding: 1rem 1.2rem;
        border-radius: 10px;
        margin-bottom: 1.25rem;
      }
      .lifecycle-log-box h4 {
        margin: 0 0 0.5rem 0;
        color: #38bdf8;
        font-size: 0.92rem;
      }
      .log-list {
        margin: 0;
        padding-left: 1.25rem;
        font-size: 0.82rem;
        line-height: 1.6;
      }
      .stats-chart-card {
        background: #f0fdf4;
        border: 1px solid #86efac;
        border-radius: 10px;
        padding: 1.15rem;
      }
      .defer-badge {
        display: inline-block;
        background: #15803d;
        color: white;
        font-size: 0.72rem;
        padding: 0.15rem 0.55rem;
        border-radius: 999px;
        font-weight: 600;
      }
      .stats-header h3 {
        margin: 0.35rem 0 0.85rem 0;
        font-size: 1.05rem;
        color: #14532d;
      }
      .bar-chart {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }
      .bar-row {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .bar-label {
        font-size: 0.8rem;
        color: #166534;
        font-weight: 600;
      }
      .bar-track {
        background: #dcfce7;
        border-radius: 6px;
        overflow: hidden;
        height: 22px;
      }
      .bar-fill {
        background: linear-gradient(90deg, #16a34a, #0d9488);
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        height: 100%;
        display: flex;
        align-items: center;
        padding-left: 0.5rem;
      }
      .defer-placeholder,
      .defer-loading {
        padding: 1rem;
        border: 1px dashed #94a3b8;
        border-radius: 10px;
        text-align: center;
        color: #475569;
        background: #f8fafc;
      }
    `,
  ],
})
export class UserDirectoryComponent implements OnChanges, OnInit, AfterViewInit, OnDestroy {
  // @Input สำหรับทดสอบจังหวะการทำงานของ ngOnChanges เมื่อตัวแม่ส่งค่าเข้ามา
  @Input() initialDepartment: 'ALL' | 'Backend' | 'Frontend' | 'DevOps' | 'Security' = 'ALL';

  // อ้างอิง DOM Element จริงใน Template เพื่อสาธิตว่าเข้าถึงได้ใน ngAfterViewInit เท่านั้น
  @ViewChild('directoryTitle') directoryTitleRef?: ElementRef<HTMLHeadingElement>;

  public readonly departments: Array<'ALL' | 'Backend' | 'Frontend' | 'DevOps' | 'Security'> = [
    'ALL',
    'Backend',
    'Frontend',
    'DevOps',
    'Security',
  ];

  public readonly selectedDepartment = signal<
    'ALL' | 'Backend' | 'Frontend' | 'DevOps' | 'Security'
  >('ALL');
  public readonly showOnlyActive = signal<boolean>(false);
  public readonly lifecycleLogs = signal<string[]>([]);

  private readonly employees = signal<EmployeeDirectoryItem[]>([
    {
      id: 101,
      name: 'ธนภัทร สปริงบูท',
      role: 'Principal Java Architect',
      department: 'Backend',
      active: true,
      performanceIndex: 96,
    },
    {
      id: 102,
      name: 'พิมพ์ชนก แองกูลาร์',
      role: 'Lead Frontend Engineer',
      department: 'Frontend',
      active: true,
      performanceIndex: 94,
    },
    {
      id: 103,
      name: 'ศุภกร คูเบอร์เนเทส',
      role: 'Cloud Platform Engineer',
      department: 'DevOps',
      active: true,
      performanceIndex: 89,
    },
    {
      id: 104,
      name: 'ณัฐกานต์ ไซเบอร์',
      role: 'Application Security Specialist',
      department: 'Security',
      active: false,
      performanceIndex: 91,
    },
  ]);

  public readonly filteredEmployees = computed(() => {
    const dept = this.selectedDepartment();
    const onlyActive = this.showOnlyActive();

    return this.employees().filter((emp) => {
      const matchDept = dept === 'ALL' || emp.department === dept;
      const matchActive = !onlyActive || emp.active;
      return matchDept && matchActive;
    });
  });

  // ============================================================================
  // ลำดับที่ 1: constructor()
  // [เปรียบเทียบกับ Backend]: คือจังหวะ `new UserDirectoryComponent()` ของคลาส
  // ข้อควรระวัง: ณ จุดนี้ค่า `@Input()` ยังไม่ถูกผูกเข้ามา และ DOM ยังไม่ถูกสร้าง!
  // ============================================================================
  constructor() {
    const msg =
      '1. [constructor] สร้าง Instance ของคลาสใน Memory (ค่า @Input ยังไม่เข้า, ห้ามยิง API ที่พึ่งพา @Input ในนี้)';
    console.log(msg);
    this.appendLog(msg);
  }

  // ============================================================================
  // ลำดับที่ 2: ngOnChanges(changes: SimpleChanges)
  // [เปรียบเทียบกับ Backend]: เหมือน Event Listener ที่คอยดักว่า Property ขาเข้า (@Input) เปลี่ยนค่าหรือไม่
  // ทำงานก่อน ngOnInit() ครั้งหนึ่ง (ถ้ามี @Input ส่งเข้ามา) และทำงานซ้ำทุกครั้งที่ @Input เปลี่ยน Reference
  // ============================================================================
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialDepartment']) {
      const current = changes['initialDepartment'].currentValue;
      this.selectedDepartment.set(current);
      const msg = `2. [ngOnChanges] ตรวจพบการเปลี่ยนแปลงของ @Input() initialDepartment = "${current}"`;
      console.log(msg, changes);
      this.appendLog(msg);
    }
  }

  // ============================================================================
  // ลำดับที่ 3: ngOnInit()
  // [เปรียบเทียบกับ Backend]: เทียบเท่า `@PostConstruct` ใน Spring Boot
  // ทำงานเพียงครั้งเดียวหลังจาก Angular ตั้งค่า `@Input()` ครั้งแรกเสร็จเรียบร้อย
  // เป็นจุดมาตรฐานในการเริ่มต้นโหลดข้อมูล (Fetch Data / Initialize Component State)
  // ============================================================================
  ngOnInit(): void {
    const msg =
      '3. [ngOnInit] Component เริ่มต้นทำงาน (@PostConstruct) ค่า @Input พร้อมใช้งานแล้ว เหมาะสำหรับดึงข้อมูลเริ่มต้น';
    console.log(msg);
    this.appendLog(msg);
  }

  // ============================================================================
  // ลำดับที่ 4: ngAfterViewInit()
  // [เปรียบเทียบกับ Backend]: ไม่มีตัวเทียบตรงๆ ใน REST API เพราะเป็นเรื่องของ UI Rendering
  // คือจังหวะที่ HTML Template และ Child Components เรนเดอร์ลงบน DOM ของ Browser เสร็จ 100%
  // หากต้องการใช้ `@ViewChild` หรืออ้างอิง DOM เพื่อวาดกราฟ (เช่น Chart.js) ต้องทำที่นี่!
  // ============================================================================
  ngAfterViewInit(): void {
    const headingText = this.directoryTitleRef?.nativeElement?.textContent?.trim() ?? 'N/A';
    const msg = `4. [ngAfterViewInit] เรนเดอร์ HTML DOM เสร็จสมบูรณ์ อ่านค่า @ViewChild ได้แล้ว ("${headingText.slice(0, 32)}...")`;
    console.log(msg);
    this.appendLog(msg);
  }

  // ============================================================================
  // ลำดับสุดท้าย: ngOnDestroy()
  // [เปรียบเทียบกับ Backend]: เทียบเท่า `@PreDestroy` ใน Spring หรือ `Dispose()` ใน .NET
  // ทำงานก่อนที่ Component จะถูกถอดออกจากหน้าจอ (เช่น ผู้ใช้กดเปลี่ยนหน้า Route)
  // ใช้สำหรับ Clear Interval, ปิด WebSocket หรือ Unsubscribe Observable เพื่อป้องกัน Memory Leak!
  // ============================================================================
  ngOnDestroy(): void {
    const msg =
      '5. [ngOnDestroy] กำลังทำลาย Component (@PreDestroy) คืนค่า Memory และยกเลิก Subscription ทั้งหมด';
    console.log(msg);
  }

  public selectDepartment(dept: 'ALL' | 'Backend' | 'Frontend' | 'DevOps' | 'Security'): void {
    this.selectedDepartment.set(dept);
  }

  public toggleOnlyActive(): void {
    this.showOnlyActive.update((prev) => !prev);
  }

  private appendLog(entry: string): void {
    this.lifecycleLogs.update((logs) => [...logs, entry]);
  }
}

