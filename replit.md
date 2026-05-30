# منصة صحة — Seha Sick Leave Management System

نظام متكامل لإدارة الإجازات المرضية يشمل لوحة تحكم ويب وبوت تيليجرام يولّد تقارير PDF رسمية.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — تشغيل API server (port 5000/8080)
- `pnpm --filter @workspace/seha-dashboard run dev` — تشغيل لوحة التحكم (port 21028)
- `cd artifacts/telegram-bot && python3 bot.py` — تشغيل بوت تيليجرام
- `pnpm run typecheck` — فحص TypeScript كامل
- `pnpm --filter @workspace/api-spec run codegen` — إعادة توليد API hooks من OpenAPI spec
- `pnpm --filter @workspace/db run push` — تطبيق تغييرات الـ schema على قاعدة البيانات

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- Frontend: React + Vite + shadcn/ui + Tailwind CSS, Wouter routing
- API codegen: Orval (from OpenAPI spec)
- Bot: Python 3, python-telegram-bot, fpdf2, arabic-reshaper, hijri-converter

## Where things live

- `lib/api-spec/openapi.yaml` — مصدر الحقيقة لعقد الـ API
- `lib/api-client-react/src/generated/api.ts` — React Query hooks مولّدة
- `lib/api-zod/src/generated/api.ts` — Zod schemas مولّدة
- `lib/db/src/schema/leaves.ts` — schema جدول الإجازات
- `artifacts/api-server/src/routes/leaves.ts` — routes الإجازات
- `artifacts/seha-dashboard/src/` — لوحة التحكم React
- `artifacts/telegram-bot/` — بوت تيليجرام Python

## Architecture decisions

- Contract-first API: OpenAPI spec يُعرَّف أولاً ثم تُولَّد الـ hooks والـ schemas
- Dates stored as DD-MM-YYYY strings (format المستخدم في السعودية)
- Bot يحفظ البيانات في نفس قاعدة البيانات عبر REST API
- PDF يُولَّد محلياً في مجلد artifacts/telegram-bot/output/

## Product

- لوحة تحكم عربية/ثنائية اللغة لإدارة الإجازات المرضية
- بوت تيليجرام يستقبل بيانات المريض ويولّد PDF رسمي بتنسيق منصة صحة
- صفحة استعلام عام لمراجعة الإجازات برقم الهوية ورمز الإجازة

## User preferences

- واجهة عربية RTL مع دعم ثنائي اللغة
- المشروع يجب أن يعمل مية مية بدون أخطاء

## Gotchas

- التواريخ مخزّنة بصيغة DD-MM-YYYY — استخدم `parseDate()` من `@/lib/utils` لعرضها
- `pnpm run typecheck:libs` يجب يُنفَّذ قبل typecheck الـ api-server لأن الـ db lib composite
- BOT_TOKEN يُقرأ من environment variable — لا يُكتب في الكود مطلقاً
- بوت تيليجرام يحتاج BOT_TOKEN كـ secret قبل التشغيل

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
