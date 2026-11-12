import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * ============================================================================
 * ไฟล์: auth.interceptor.ts (Functional HTTP Interceptor)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - ในฝั่ง Backend (เช่น Spring Boot Filter / HandlerInterceptor, ASP.NET Core Middleware,
 *   หรือ Express.js Middleware) เราใช้ดักจับ HTTP Request ขาเข้าเพื่อตรวจ JWT Token
 * - แต่ในฝั่ง Frontend (Angular) `HttpInterceptorFn` คือ "Outbound/Inbound Middleware"
 *   ที่ดักจับทุกๆ HTTP Request ที่กำลังจะวิ่งออกจาก Browser ไปหา Backend API (เช่น ยิงผ่าน HttpClient)
 *   เพื่อแนบ Header (เช่น Authorization: Bearer <token>) โดยอัตโนมัติ ไม่ต้องเขียนซ้ำทุก Service
 *   และยังดักจับ HTTP Response ขากลับเพื่อทำ Global Error Handling (เช่น ดัก 401 Unauthorized) ได้ด้วย
 * ============================================================================
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // จำลองการดึง JWT Token จากหน่วยความจำ (ในระบบจริงอาจดึงจาก AuthService Memory หรือ Cookie)
  const mockJwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-payload.signature-12345';

  // [สำคัญมากสำหรับคนทำ Backend]:
  // HttpRequest ใน Angular เป็น "Immutable Object" (เหมือน Record ใน Java หรือ C# หรือ Value Object)
  // สาเหตุที่เป็น Immutable เพราะหากเกิดการ Retry Request (เช่นใช้ RxJS retry(3))
  // Request ต้นฉบับจะต้องไม่ถูกแก้ไขซ้ำซ้อน เราจึงต้องใช้ `.clone()` เพื่อสร้างอินสแตนซ์ใหม่พร้อมแนบ Header
  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${mockJwtToken}`,
      'X-Client-Platform': 'Angular-Standalone-Portal',
    },
  });

  // ส่ง Request ที่โคลนแล้วไปให้ Interceptor ตัวถัดไปใน Chain หรือส่งออกไปยัง Network
  // (เทียบเท่าคำสั่ง `next(req)` ใน Express หรือ `chain.doFilter(req, res)` ใน Java Servlet)
  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // ดักจับ Error ขากลับแบบรวมศูนย์ (เทียบเท่า @ControllerAdvice / ExceptionFilter ใน Backend)
      if (error.status === 401) {
        console.error(
          '[AuthInterceptor] ตรวจพบ 401 Unauthorized! เซสชันอาจหมดอายุ กำลังแจ้งเตือนหรือพากลับหน้า Login...'
        );
      } else if (error.status === 403) {
        console.error('[AuthInterceptor] ตรวจพบ 403 Forbidden! คุณไม่มีสิทธิ์เข้าถึง Resource นี้');
      }
      // ส่งต่อ Error ให้ Subscriber ปลายทางรับทราบด้วย
      return throwError(() => error);
    })
  );
};
