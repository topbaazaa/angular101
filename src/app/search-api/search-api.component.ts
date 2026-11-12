import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { ExternalUserDto, UserApiService } from './user-api.service';

/**
 * ============================================================================
 * ไฟล์: search-api.component.ts (RxJS Stream, Operators & HTTP Search)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - RxJS Observable คือ Asynchronous Data Stream (เหมือน Java Project Reactor `Flux<T>`
 *   หรือ C# `IObservable<T>` / `IAsyncEnumerable<T>`)
 * - การค้นหาข้อมูลขณะพิมพ์ (Typeahead Search) หากยิง API ทุกครั้งที่กดคีย์บอร์ด 1 ตัวอักษร
 *   จะทำให้เกิดทั้งภาระหนักที่ Backend (DDOS ตัวเอง) และเกิดปัญหา **Race Condition**
 *   (เช่น พิมพ์ "ab" แต่ Response ของ "a" ตอบกลับมาช้ากว่า เลยมาทับผลลัพธ์ของ "ab"!)
 * - เราจึงใช้ชุด RxJS Operators มาตรฐานในการสอบและใช้งานจริง:
 *   1) `debounceTime(300)`      ➔ รอให้ผู้ใช้หยุดพิมพ์ครบ 300ms ก่อนค่อยส่งค่าต่อ
 *   2) `distinctUntilChanged()` ➔ ถ้าคำค้นหาเหมือนเดิมเป๊ะ (เช่น พิมพ์แล้วลบกลับมาคำเดิม) ไม่ต้องยิงซ้ำ
 *   3) `switchMap(...)`         ➔ **พระเอก!** ถ้ายิง Request ใหม่ทั้งที่ Request เก่ายังไม่เสร็จ
 *                                 มันจะสั่ง **Cancel (ยกเลิก) HTTP Request เก่าทันที** แล้วสลับไปรอตัวใหม่ล่าสุด
 *   4) `catchError(...)`        ➔ ดักจับ Error ใน Stream แล้วคืน Fallback Observable (`of([])`) เพื่อไม่ให้ Stream ตาย
 *   5) `takeUntilDestroyed()`   ➔ Unsubscribe อัตโนมัติเมื่อ Component ถูกทำลาย ป้องกัน Memory Leak 100%
 * ============================================================================
 */
@Component({
  selector: 'app-search-api',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="module-card">
      <div class="module-header">
        <span class="module-tag">Module 5: RxJS, Observable, Operators & HttpClient</span>
        <h2>🌐 ระบบค้นหาข้อมูลพนักงานจาก API ด้วย RxJS Reactive Stream</h2>
        <p class="module-desc">
          เชื่อมต่อ <code>https://jsonplaceholder.typicode.com/users</code> ด้วย
          <code>ReactiveFormsModule</code> ร่วมกับไปป์ไลน์
          <code>debounceTime(300) ➔ distinctUntilChanged() ➔ switchMap() ➔ catchError()</code>
          และป้องกัน Memory Leak ด้วย <code>takeUntilDestroyed()</code>
        </p>
      </div>

      <div class="search-bar-container">
        <label for="apiSearchInput">🔍 ค้นหาชื่อ / Username / Email (ลองพิมพ์เช่น "Leanne", "Bret"):</label>
        <div class="input-with-status">
          <input
            id="apiSearchInput"
            data-testid="search-input"
            type="text"
            [formControl]="searchControl"
            placeholder="พิมพ์คำค้นหา... (หน่วงเวลาอัตโนมัติ 300ms)"
          />
          <button type="button" class="btn-reload" (click)="triggerManualSearch()">
            🔄 ดึงข้อมูลใหม่
          </button>
        </div>
        <small class="operator-hint">
          💡 ทุกครั้งที่ยิง Request ระบบจะแนบ <code>Authorization: Bearer &lt;mock-jwt&gt;</code>
          ผ่าน <code>authInterceptor</code> โดยอัตโนมัติ (ตรวจสอบได้ใน DevTools ➔ Network)
        </small>
      </div>

      @if (isLoading()) {
        <div class="loading-banner" data-testid="loading-indicator">
          ⏳ กำลังดึงข้อมูลจาก API ผ่าน RxJS <code>switchMap()</code>...
        </div>
      }

      @if (errorMessage()) {
        <div class="error-banner" role="alert" data-testid="error-banner">
          ⚠️ {{ errorMessage() }}
        </div>
      }

      <div class="user-list-grid" data-testid="user-list">
        @for (user of users(); track user.id) {
          <div class="api-user-card" data-testid="user-card">
            <div class="user-card-top">
              <strong>{{ user.name }}</strong>
              <span class="username-pill">&#64;{{ user.username }}</span>
            </div>
            <div class="user-detail">📧 {{ user.email }}</div>
            @if (user.company?.name) {
              <div class="user-detail">🏢 บริษัท: {{ user.company?.name }}</div>
            }
          </div>
        } @empty {
          @if (!isLoading()) {
            <div class="empty-api-result" data-testid="empty-result">
              ไม่พบรายชื่อที่ตรงกับคำค้นหา "{{ searchControl.value }}"
            </div>
          }
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
        background: #ffedd5;
        color: #9a3412;
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
      .search-bar-container {
        background: #fff7ed;
        border: 1px solid #fed7aa;
        padding: 1rem;
        border-radius: 10px;
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }
      .search-bar-container label {
        font-weight: 600;
        color: #7c2d12;
        font-size: 0.9rem;
      }
      .input-with-status {
        display: flex;
        gap: 0.65rem;
        flex-wrap: wrap;
      }
      .input-with-status input {
        flex: 1;
        min-width: 240px;
        padding: 0.6rem 0.85rem;
        border: 1px solid #fdba74;
        border-radius: 8px;
        font-size: 0.95rem;
      }
      .btn-reload {
        background: #ea580c;
        color: white;
        border: none;
        padding: 0.6rem 1rem;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      }
      .operator-hint {
        color: #9a3412;
        font-size: 0.8rem;
      }
      .loading-banner {
        padding: 0.75rem;
        background: #eff6ff;
        color: #1d4ed8;
        border-radius: 8px;
        margin-bottom: 0.85rem;
        font-weight: 600;
      }
      .error-banner {
        padding: 0.75rem;
        background: #fef2f2;
        color: #b91c1c;
        border-left: 4px solid #ef4444;
        border-radius: 6px;
        margin-bottom: 0.85rem;
      }
      .user-list-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 0.85rem;
      }
      .api-user-card {
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 0.9rem;
        background: #ffffff;
      }
      .user-card-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.45rem;
      }
      .username-pill {
        background: #f3f4f6;
        color: #374151;
        font-size: 0.75rem;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
      }
      .user-detail {
        font-size: 0.84rem;
        color: #4b5563;
        margin-top: 0.2rem;
      }
      .empty-api-result {
        grid-column: 1 / -1;
        padding: 1rem;
        text-align: center;
        color: #6b7280;
        background: #f9fafb;
        border-radius: 8px;
      }
    `,
  ],
})
export class SearchApiComponent implements OnInit {
  private readonly userApiService = inject(UserApiService);
  // DestroyRef คือ Token ของ Angular v16+ ที่ใช้ร่วมกับ takeUntilDestroyed()
  // เพื่อผูกอายุของ Observable Stream เข้ากับอายุของ Component อัตโนมัติ
  private readonly destroyRef = inject(DestroyRef);

  // FormControl จาก ReactiveFormsModule จะปล่อย Observable `valueChanges` ออกมาทุกครั้งที่ค่าเปลี่ยน
  public readonly searchControl = new FormControl<string>('', { nonNullable: true });

  // ใช้ Signals สำหรับเก็บผลลัพธ์ที่ได้จาก RxJS Stream เพื่อแสดงผลบน Template
  public readonly users = signal<ExternalUserDto[]>([]);
  public readonly isLoading = signal<boolean>(false);
  public readonly errorMessage = signal<string>('');

  ngOnInit(): void {
    this.setupSearchStream();
  }

  /**
   * ตั้งค่าท่อลำเลียงข้อมูล (RxJS Pipeline) สำหรับช่องค้นหา
   */
  private setupSearchStream(): void {
    this.searchControl.valueChanges
      .pipe(
        // 1. startWith('') เพื่อให้ยิงโหลดข้อมูลทั้งหมดทันที 1 ครั้งตอนเปิดหน้าจอครั้งแรก
        startWith(this.searchControl.value),
        // 2. รอให้ผู้ใช้หยุดพิมพ์ครบ 300 มิลลิวินาทีก่อนส่งค่าต่อไปในท่อ
        debounceTime(300),
        // 3. กรองค่าซ้ำ: ถ้าคำค้นหาเหมือนกับรอบก่อนหน้าเป๊ะๆ ไม่ต้องยิง API ซ้ำ
        distinctUntilChanged(),
        // 4. Side-effect เปิดสถานะ Loading และล้าง Error เดิม
        tap(() => {
          this.isLoading.set(true);
          this.errorMessage.set('');
        }),
        // 5. switchMap: ยกเลิก Request เก่าที่ยังค้างอยู่ทันทีเมื่อมีคำค้นหาใหม่เข้ามา แล้วสลับไปเรียก API ตัวล่าสุด
        switchMap((keyword) =>
          this.userApiService.searchUsers(keyword).pipe(
            // [สำคัญมาก]: ต้องดัก catchError ด้านใน switchMap!
            // เพราะถ้าดักด้านนอก เมื่อ API พัง 1 ครั้ง ท่อหลัก (valueChanges) จะตายถาวรและพิมพ์ค้นหาต่อไม่ได้อีก!
            catchError((err) => {
              console.error('[SearchApiComponent] เกิดข้อผิดพลาดในการดึงข้อมูล API:', err);
              this.errorMessage.set(
                'ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้ในขณะนี้ (แสดงข้อมูลสำรองแทน)'
              );
              // คืนค่า Fallback ข้อมูลจำลองเพื่อให้ UI ยังทำงานต่อได้อย่างราบรื่น (Graceful Degradation)
              return of<ExternalUserDto[]>([
                {
                  id: 999,
                  name: 'Fallback User (Offline Mode)',
                  username: 'offline_dev',
                  email: 'fallback@company.local',
                  company: { name: 'Local Mock Corp' },
                },
              ]);
            })
          )
        ),
        // 6. ป้องกัน Memory Leak: ยกเลิกการ Subscribe อัตโนมัติทันทีที่ Component ถูกทำลาย (Destroy)
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((resultList) => {
        this.users.set(resultList);
        this.isLoading.set(false);
      });
  }

  /**
   * ปุ่มกดสั่งค้นหาทันทีโดยใช้ค่าปัจจุบันในช่องค้นหา
   */
  public triggerManualSearch(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.userApiService
      .searchUsers(this.searchControl.value)
      .pipe(
        catchError(() => {
          this.errorMessage.set('เกิดข้อผิดพลาดในการเชื่อมต่อ API');
          return of<ExternalUserDto[]>([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((list) => {
        this.users.set(list);
        this.isLoading.set(false);
      });
  }
}

