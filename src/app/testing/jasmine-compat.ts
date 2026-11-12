import { vi } from 'vitest';

/**
 * ============================================================================
 * ไฟล์: jasmine-compat.ts (Jasmine Spy Compatibility Bridge สำหรับ Angular CLI รุ่นใหม่)
 * ============================================================================
 * ช่วยให้เราสามารถเขียนโค้ดมาตรฐานสำหรับการสอบอย่าง:
 *   const spyObj = jasmine.createSpyObj('UserApiService', ['searchUsers']);
 *   spyObj.searchUsers.and.returnValue(of(mockData));
 * และรันผ่านทั้งบน Jasmine/Karma ดั้งเดิม และบน Vitest ยุคใหม่ได้ 100%!
 * ============================================================================
 */
export interface JasmineLikeSpy {
  (...args: any[]): any;
  and: {
    returnValue: (val: any) => JasmineLikeSpy;
    callFake: (fn: (...args: any[]) => any) => JasmineLikeSpy;
  };
}

export type SpyObj<T> = T & {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? JasmineLikeSpy : T[K];
};

function createCompatibleSpy(methodName: string): JasmineLikeSpy {
  const fn = vi.fn().mockName(methodName) as unknown as JasmineLikeSpy;
  fn.and = {
    returnValue: (val: any) => {
      (fn as any).mockReturnValue(val);
      return fn;
    },
    callFake: (impl: (...args: any[]) => any) => {
      (fn as any).mockImplementation(impl);
      return fn;
    },
  };
  return fn;
}

export const jasmineCompat = {
  createSpyObj<T extends object>(baseName: string, methodNames: Array<keyof T & string>): SpyObj<T> {
    const obj: any = {};
    for (const method of methodNames) {
      obj[method] = createCompatibleSpy(`${baseName}.${method}`);
    }
    return obj as SpyObj<T>;
  },
};

// ติดตั้งลงบน globalThis.jasmine หากยังไม่มี เพื่อให้เรียกใช้ `jasmine.createSpyObj(...)` ได้โดยตรง
if (typeof (globalThis as any).jasmine === 'undefined') {
  (globalThis as any).jasmine = jasmineCompat;
}
