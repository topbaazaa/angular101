import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './auth.interceptor';

/**
 * ============================================================================
 * ไฟล์: app.config.ts (Root Application Configuration & DI Container)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - เปรียบเสมือนไฟล์ `Program.cs` (ส่วน `builder.Services.Add...`) ใน ASP.NET Core
 *   หรือ `@Configuration` คลาสหลักใน Spring Boot
 * - ในยุค Modern Angular (v17-19+ Standalone Architecture) เราเลิกใช้ `AppModule (@NgModule)`
 *   แล้วเปลี่ยนมาลงทะเบียน Dependency Injection (Providers) ระดับ Global ที่ `appConfig` แทน
 * - `provideRouter(routes)`             ➔ เปิดใช้งานระบบ Routing ของแอป
 * - `provideHttpClient(withInterceptors([authInterceptor]))` ➔ เปิดใช้งาน HttpClient
 *   พร้อมผูก Functional Interceptor (`authInterceptor`) เพื่อแนบ JWT Token ทุกครั้งที่ยิง API
 * ============================================================================
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // ตั้งค่า Router พร้อมรองรับการผูก Route Params เข้ากับ @Input() อัตโนมัติ
    provideRouter(routes, withComponentInputBinding()),
    // ตั้งค่า HttpClient พร้อมลงทะเบียน Outbound/Inbound Middleware (Interceptor)
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
