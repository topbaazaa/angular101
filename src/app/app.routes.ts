import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';

/**
 * ============================================================================
 * ไฟล์: app.routes.ts (Routing Table & Lazy Loading Configuration)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - เปรียบเสมือนตาราง URL Routing (`@RequestMapping` ใน Spring หรือ `app.MapGet()` ใน .NET)
 *   แต่แทนที่จะคืนค่าเป็น JSON จะเป็นการสลับ Component มาแสดงใน `<router-outlet>` บนหน้าเว็บ
 * - การใช้ `loadComponent: () => import('...').then(m => m.ComponentName)`:
 *   คือการทำ **Lazy Loading (Code Splitting)** สั่งให้ Bundler (esbuild/Vite) แยกโค้ดของหน้านั้นๆ
 *   ออกเป็นไฟล์ `.js` ย่อย (Chunk) และจะดาวน์โหลดผ่าน Network ก็ต่อเมื่อผู้ใช้กดเข้า URL นั้นจริงๆ เท่านั้น!
 * ============================================================================
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'All-in-One Portal | Employee & Evaluation',
    loadComponent: () =>
      import('./dashboard/portal-dashboard.component').then((m) => m.PortalDashboardComponent),
  },
  {
    path: 'bonus',
    title: 'Module 2: Parent-Child (@Input/@Output)',
    loadComponent: () =>
      import('./bonus-calculator/bonus-calculator-parent.component').then(
        (m) => m.BonusCalculatorParentComponent
      ),
  },
  {
    path: 'evaluation',
    title: 'Module 3: Sibling State (Service + Signals)',
    loadComponent: () =>
      import('./evaluation/evaluation-host.component').then((m) => m.EvaluationHostComponent),
  },
  {
    path: 'directory',
    title: 'Module 4: Lifecycle, OnPush & @defer',
    loadComponent: () =>
      import('./user-directory/user-directory.component').then((m) => m.UserDirectoryComponent),
  },
  {
    path: 'search-api',
    title: 'Module 5: RxJS & HttpClient Search',
    loadComponent: () =>
      import('./search-api/search-api.component').then((m) => m.SearchApiComponent),
  },
  {
    path: 'security',
    title: 'Module 6: Security, XSS & Guards',
    loadComponent: () =>
      import('./security-demo/security-demo.component').then((m) => m.SecurityDemoComponent),
  },
  {
    path: 'admin',
    title: 'Admin Zone (Protected by CanActivateFn)',
    // ผูก Functional Route Guard เพื่อตรวจสอบสิทธิ์ก่อนอนุญาตให้โหลดและเปิดหน้านี้
    canActivate: [authGuard],
    loadComponent: () =>
      import('./security-demo/admin-panel.component').then((m) => m.AdminPanelComponent),
  },
  {
    // Wildcard Route (เทียบเท่า 404 Fallback Handler): ถ้าพิมพ์ URL มั่ว ให้พากลับหน้าหลัก
    path: '**',
    redirectTo: 'dashboard',
  },
];
