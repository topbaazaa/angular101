import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

/**
 * DTO สำหรับข้อมูลผู้ใช้ที่ได้จาก Public API (https://jsonplaceholder.typicode.com/users)
 */
export interface ExternalUserDto {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  website?: string;
  company?: {
    name: string;
    catchPhrase?: string;
  };
}

/**
 * ============================================================================
 * ไฟล์: user-api.service.ts (HTTP Client Service / Gateway Layer)
 * ============================================================================
 * [เปรียบเทียบกับฝั่ง Backend]:
 * - เปรียบเสมือน `RestTemplate` / `WebClient` (Spring WebFlux) หรือ `HttpClient` ใน .NET
 * - ข้อสำคัญ: `this.http.get<T>(...)` ใน Angular คืนค่าเป็น **Cold Observable**
 *   (เหมือน Reactive Stream `Mono<List<User>>` หรือ `Flux<User>` ใน Spring WebFlux)
 *   นั่นหมายความว่า **ถ้ายังไม่มีใครสั่ง `.subscribe()` (หรือผ่าน `switchMap` ที่ถูก subscribe)
 *   จะยังไม่มีการยิง HTTP Request ออกไปที่ Network จริงๆ เด็ดขาด!** (Lazy Execution)
 * ============================================================================
 */
@Injectable({
  providedIn: 'root',
})
export class UserApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://jsonplaceholder.typicode.com/users';

  /**
   * ดึงรายชื่อผู้ใช้จาก Public API และกรองตามคำค้นหา (Keyword)
   * ทุก Request ที่ยิงผ่าน HttpClient นี้จะวิ่งผ่าน `authInterceptor` โดยอัตโนมัติ!
   */
  public searchUsers(keyword: string = ''): Observable<ExternalUserDto[]> {
    const normalized = keyword.trim().toLowerCase();

    return this.http.get<ExternalUserDto[]>(this.apiUrl).pipe(
      map((users) => {
        if (!normalized) {
          return users;
        }
        return users.filter(
          (u) =>
            u.name.toLowerCase().includes(normalized) ||
            u.username.toLowerCase().includes(normalized) ||
            u.email.toLowerCase().includes(normalized)
        );
      })
    );
  }
}

