import { CommonModule } from '@angular/common';
import { Component, SecurityContext, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../auth.guard';

/**
 * ============================================================================
 * ไฟล์: security-demo.component.ts (Frontend Security, XSS, DomSanitizer & Route Guard)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * 1. การป้องกัน XSS (Cross-Site Scripting):
 *    - ใน Backend ยุคเก่า (JSP, Razor, Blade) เรามักใช้ HTML Output Encoding เพื่อไม่ให้ `<script>` ทำงาน
 *    - ใน Angular ทุกค่าที่แสดงผ่าน Interpolation `{{ untrustedInput }}` หรือ `[innerHTML]="untrustedInput"`
 *      จะถูก **Sanitize อัตโนมัติ** โดย Angular จะตัด `<script>`, `onerror="..."`, `javascript:` ทิ้งทันที!
 * 2. `DomSanitizer`:
 *    - ใช้เมื่อเราต้องการตรวจสอบ/ทำความสะอาด HTML ด้วย `sanitizer.sanitize(SecurityContext.HTML, value)`
 *    - หรือในกรณีที่จำเป็นต้องเรนเดอร์ Trusted Rich HTML ที่ผ่านการคัดกรองจากระบบภายในที่ปลอดภัย 100% แล้ว
 *      จึงใช้ `bypassSecurityTrustHtml()` (ต้องระวังอย่างยิ่ง ห้ามส่ง Raw Input ของผู้ใช้เข้าฟังก์ชันนี้โดยตรง!)
 * ============================================================================
 */
@Component({
  selector: 'app-security-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="module-card">
      <div class="module-header">
        <span class="module-tag">Module 6: Frontend Security (XSS, DomSanitizer, Guard & Interceptor)</span>
        <h2>🛡️ ระบบความปลอดภัยฝั่ง Frontend (XSS Protection, Route Guard & JWT Interceptor)</h2>
        <p class="module-desc">
          ทดลองป้องกันช่องโหว่ <strong>Cross-Site Scripting (XSS)</strong> ด้วยระบบ Auto-Sanitization
          ของ Angular และ <code>DomSanitizer</code> พร้อมทดสอบสลับสิทธิ์เข้าหน้า
          <code>/admin</code> ที่ป้องกันด้วย <code>authGuard</code>
        </p>
      </div>

      <div class="security-grid">
        <!-- ส่วนที่ 1: ทดสอบ XSS Protection & DomSanitizer -->
        <div class="sec-box">
          <h3>1. ทดสอบการป้องกัน XSS (Cross-Site Scripting)</h3>
          <label for="xssPayloadInput">ลองใส่โค้ดโจมตี XSS (Malicious HTML Payload):</label>
          <textarea
            id="xssPayloadInput"
            rows="3"
            [ngModel]="rawHtmlPayload()"
            (ngModelChange)="rawHtmlPayload.set($event)"
          ></textarea>

          <div class="render-comparison">
            <div class="render-item">
              <span class="render-label">
                A) แสดงด้วย Interpolation <code>&#123;&#123; rawHtmlPayload() &#125;&#125;</code> (Encode เป็น Text 100%):
              </span>
              <div class="output-box">{{ rawHtmlPayload() }}</div>
            </div>

            <div class="render-item">
              <span class="render-label">
                B) แสดงด้วย <code>[innerHTML]="rawHtmlPayload()"</code> (Angular ตัด
                <code>&lt;script&gt;</code> และ <code>onerror</code> ทิ้งอัตโนมัติ):
              </span>
              <div class="output-box" [innerHTML]="rawHtmlPayload()"></div>
            </div>

            <div class="render-item">
              <span class="render-label">
                C) ผลลัพธ์จาก <code>DomSanitizer.sanitize(SecurityContext.HTML, payload)</code>:
              </span>
              <code class="sanitized-code">{{ explicitlySanitizedHtml() }}</code>
            </div>

            <div class="render-item">
              <span class="render-label">
                D) แกลเลอรีป้ายประกาศองค์กรที่ปลอดภัย (Trusted Template ผ่าน
                <code>DomSanitizer.bypassSecurityTrustHtml</code>):
              </span>
              <div class="output-box trusted-box" [innerHTML]="trustedCompanyBadge()"></div>
            </div>
          </div>
        </div>

        <!-- ส่วนที่ 2: ทดสอบ Route Guard (CanActivateFn) & HTTP Interceptor -->
        <div class="sec-box">
          <h3>2. ทดสอบ Route Guard (<code>CanActivateFn</code>) & JWT Interceptor</h3>

          <div class="role-status-card" [class.admin-on]="authState.isAdmin()">
            <div>
              <span>สถานะสิทธิ์ปัจจุบัน (AuthStateService Signal):</span>
              <strong data-testid="admin-role-status">
                {{ authState.isAdmin() ? '🟢 ADMIN (อนุญาตให้เข้า /admin)' : '🔴 GUEST (ห้ามเข้า /admin)' }}
              </strong>
            </div>
            <button
              type="button"
              class="btn-toggle-role"
              data-testid="toggle-role-btn"
              (click)="authState.toggleAdminRole()"
            >
              🔄 สลับสิทธิ์ (Toggle Admin Role)
            </button>
          </div>

          <div class="guard-action-box">
            <p>
              ลองกดปุ่มด้านล่างเพื่อเข้าสู่หน้า <code>/admin</code>:
              <br />
              - หากเป็น <strong>ADMIN</strong> จะเข้าหน้าผู้ดูแลระบบได้สำเร็จ
              <br />
              - หากสลับเป็น <strong>GUEST</strong> ตัว <code>authGuard</code> จะบล็อกและเด้งกลับมาหน้านี้ทันที!
            </p>
            <a routerLink="/admin" class="btn-goto-admin">
              🔐 ทดสอบเข้าสู่หน้า /admin (Protected by authGuard)
            </a>
          </div>

          <div class="interceptor-info-box">
            <h4>🔑 การทำงานของ Functional HTTP Interceptor (<code>auth.interceptor.ts</code>)</h4>
            <ul>
              <li>
                ดักจับทุก Request ของ <code>HttpClient</code> แล้วสั่ง <code>req.clone()</code> แนบ
                <code>Authorization: Bearer &lt;mock-jwt&gt;</code>
              </li>
              <li>
                ดักจับ Response ขากลับด้วย <code>catchError</code> หากเจอ <code>401 Unauthorized</code>
                จะแจ้งเตือนและพร้อมพากลับหน้า Login ทันที
              </li>
            </ul>
          </div>
        </div>
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
        background: #fee2e2;
        color: #991b1b;
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
      .security-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.25rem;
      }
      .sec-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.2rem;
      }
      .sec-box h3 {
        margin: 0 0 0.85rem 0;
        color: #0f172a;
        font-size: 1.05rem;
      }
      textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 0.6rem;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        font-family: monospace;
        font-size: 0.85rem;
        margin-top: 0.35rem;
        margin-bottom: 0.85rem;
      }
      .render-comparison {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .render-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }
      .render-label {
        font-size: 0.8rem;
        color: #334155;
        font-weight: 600;
      }
      .output-box {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        padding: 0.6rem 0.8rem;
        border-radius: 6px;
        font-size: 0.88rem;
      }
      .sanitized-code {
        background: #1e293b;
        color: #38bdf8;
        padding: 0.55rem 0.75rem;
        border-radius: 6px;
        font-size: 0.8rem;
        word-break: break-all;
      }
      .trusted-box {
        border-color: #86efac;
        background: #f0fdf4;
      }
      .role-status-card {
        background: #fef2f2;
        border: 1px solid #fca5a5;
        border-radius: 10px;
        padding: 0.9rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .role-status-card.admin-on {
        background: #ecfdf5;
        border-color: #6ee7b7;
      }
      .role-status-card span {
        display: block;
        font-size: 0.78rem;
        color: #475569;
      }
      .btn-toggle-role {
        background: #0f172a;
        color: white;
        border: none;
        padding: 0.55rem 0.9rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .guard-action-box {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.95rem;
        margin-bottom: 1rem;
        font-size: 0.88rem;
        color: #334155;
      }
      .btn-goto-admin {
        display: inline-block;
        margin-top: 0.65rem;
        background: #dc2626;
        color: #ffffff;
        text-decoration: none;
        padding: 0.6rem 1.05rem;
        border-radius: 8px;
        font-weight: 600;
      }
      .interceptor-info-box {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 10px;
        padding: 0.9rem;
        font-size: 0.85rem;
        color: #1e3a8a;
      }
      .interceptor-info-box h4 {
        margin: 0 0 0.45rem 0;
      }
      .interceptor-info-box ul {
        margin: 0;
        padding-left: 1.2rem;
      }
    `,
  ],
})
export class SecurityDemoComponent {
  private readonly sanitizer = inject(DomSanitizer);
  public readonly authState = inject(AuthStateService);

  // ตัวอย่าง Payload ที่มีทั้ง HTML ปกติ และสคริปต์โจมตี XSS (onerror + script)
  public readonly rawHtmlPayload = signal<string>(
    '<b>ประกาศฝ่ายบุคคล:</b> โบนัสออกศุกร์นี้! <img src="x" onerror="alert(\'XSS Attacked!\')" /> <script>evilHack()</script>'
  );

  // แสดงให้เห็นว่าเมื่อผ่าน DomSanitizer.sanitize(SecurityContext.HTML, ...) โค้ดอันตรายจะถูกชะล้างออก
  public readonly explicitlySanitizedHtml = computed<string>(() => {
    return (
      this.sanitizer.sanitize(SecurityContext.HTML, this.rawHtmlPayload()) ??
      '(ถูกบล็อกเนื้อหาทั้งหมด)'
    );
  });

  // ตัวอย่างการใช้ bypassSecurityTrustHtml อย่างปลอดภัย (ใช้กับ Static/Verified Template ที่ระบบสร้างเองเท่านั้น!)
  public readonly trustedCompanyBadge = computed<SafeHtml>(() => {
    const safeInternalHtml = `
      <div style="display:flex; align-items:center; gap:8px; color:#166534; font-weight:600;">
        <span>🛡️ Verified Internal HR Announcement Badge (Trusted HTML)</span>
      </div>
    `;
    return this.sanitizer.bypassSecurityTrustHtml(safeInternalHtml);
  });
}

