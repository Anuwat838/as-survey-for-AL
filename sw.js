/**
 * AS Survey System — Service Worker
 *
 * ทำให้เว็บติดตั้งเป็นแอปได้ (Add to Home Screen / Install)
 * และเปิดใช้แบบ offline ได้บางส่วน
 *
 * กลยุทธ์: Network-first (ลองโหลดจากเน็ตก่อนเสมอ ถ้าไม่มีเน็ตค่อยใช้ cache)
 * เหตุผล: ให้แอปอัปเดตเป็นเวอร์ชันล่าสุดอัตโนมัติทุกครั้งที่มีเน็ต
 *         ไม่ค้างอยู่เวอร์ชันเก่าบนเครื่อง AS
 *
 * ไฟล์นี้ต้องวางไว้ที่ระดับเดียวกับ index.html บน GitHub
 */

const CACHE = 'ss-survey-v2';

self.addEventListener('install', (e) => {
  // เปิดใช้ service worker ใหม่ทันที ไม่ต้องรอปิดแท็บเก่า
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      // ลบ cache เวอร์ชันเก่าทิ้ง
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (e) => {
  // จัดการเฉพาะ GET request
  if (e.request.method !== 'GET') return;

  // ไม่ยุ่งกับ request ไป Apps Script API (ต้องสดเสมอ ห้าม cache)
  if (e.request.url.indexOf('script.google.com') !== -1) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // โหลดจากเน็ตสำเร็จ → เก็บลง cache ไว้เผื่อ offline
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => {
        // ไม่มีเน็ต → ใช้ของใน cache
        return caches.match(e.request);
      })
  );
});
