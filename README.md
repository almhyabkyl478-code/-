# 🏥 منصة صحة — Seha Sick Leave Management System

نظام متكامل لإدارة الإجازات المرضية يشمل لوحة تحكم ويب وبوت تيليجرام يولّد تقارير PDF رسمية بتنسيق منصة صحة.

---

## ✨ المميزات

- **لوحة تحكم عربية RTL** — عرض وإدارة الإجازات المرضية
- **بوت تيليجرام** — استقبال بيانات المريض وتوليد PDF رسمي فوري
- **PDF احترافي** — بتنسيق منصة صحة الرسمي مع دعم التاريخ الهجري
- **API REST** — Express 5 مع PostgreSQL و Drizzle ORM
- **قاعدة بيانات مشتركة** — البوت واللوحة يستخدمان نفس DB

---

## 🗂️ هيكل المشروع

```
seha-platform/
├── artifacts/
│   ├── api-server/          # Express API (Port 8080)
│   ├── seha-dashboard/      # React Dashboard (Port 21028)
│   └── telegram-bot/        # Telegram Bot (Python)
├── lib/
│   ├── db/                  # Drizzle ORM + PostgreSQL schema
│   ├── api-spec/            # OpenAPI spec + codegen
│   ├── api-client-react/    # React Query hooks (generated)
│   └── api-zod/             # Zod schemas (generated)
├── package.json
└── pnpm-workspace.yaml
```

---

## 🛠️ التقنيات المستخدمة

| الطبقة | التقنية |
|--------|---------|
| Frontend | React 19 + Vite + shadcn/ui + Tailwind CSS |
| Backend | Express 5 + Node.js 24 + TypeScript 5.9 |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v4 + drizzle-zod |
| API Contract | OpenAPI 3.0 + Orval codegen |
| Bot | Python 3 + python-telegram-bot |
| PDF | fpdf2 + arabic-reshaper + hijri-converter |
| Package Manager | pnpm workspaces |

---

## ⚙️ الإعداد والتشغيل

### المتطلبات
- Node.js 24+
- pnpm 9+
- Python 3.11+
- PostgreSQL

### 1. تثبيت التبعيات

```bash
pnpm install
pip install python-telegram-bot fpdf2 arabic-reshaper python-bidi hijri-converter requests
```

### 2. متغيرات البيئة

أنشئ ملف `.env` أو اضبط المتغيرات التالية:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/seha
BOT_TOKEN=your_telegram_bot_token
SESSION_SECRET=your_session_secret
```

### 3. تطبيق قاعدة البيانات

```bash
pnpm --filter @workspace/db run push
```

### 4. تشغيل المشروع

```bash
# API Server
pnpm --filter @workspace/api-server run dev

# Dashboard
pnpm --filter @workspace/seha-dashboard run dev

# Telegram Bot
cd artifacts/telegram-bot && python3 bot.py
```

---

## 🤖 صيغة رسالة البوت

أرسل للبوت رسالة بالصيغة التالية:

```
👤 اسم المريض (عربي): محمد عبدالله الغامدي
👤 اسم المريض (إنجليزي): Mohammed Alghamdi
🪪 رقم الهوية: 1034567891
🌍 الجنسية (عربي): السعودية
🌍 الجنسية (إنجليزي): Saudi Arabia
🏢 جهة العمل (عربي): وزارة الصحة
🏢 جهة العمل (إنجليزي): Ministry of Health
👨‍⚕️ اسم الطبيب (عربي): د. سعد العتيبي
👨‍⚕️ اسم الطبيب (إنجليزي): Dr. Saad Al-Otaibi
💼 المسمى الوظيفي (عربي): طبيب عام
💼 المسمى الوظيفي (إنجليزي): General Practitioner
📅 تاريخ الدخول (ميلادي): 26-05-2026
🌙 تاريخ الدخول (هجري): 29-11-1447
📅 تاريخ الخروج (ميلادي): 29-05-2026
🌙 تاريخ الخروج (هجري): 02-12-1447
📅 تاريخ الإصدار: 29-05-2026
🏥 اسم المستشفى (عربي): مستشفى الملك فهد
🏥 اسم المستشفى (إنجليزي): King Fahd Hospital
🕐 الوقت: 09:30 AM
```

---

## 📡 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | فحص الحالة |
| GET | `/api/leaves` | كل الإجازات |
| POST | `/api/leaves` | إضافة إجازة |
| GET | `/api/leaves/:id` | إجازة واحدة |
| PUT | `/api/leaves/:id` | تعديل إجازة |
| DELETE | `/api/leaves/:id` | حذف إجازة |

---

## 📝 ملاحظات مهمة

- التواريخ مخزّنة بصيغة `DD-MM-YYYY`
- PDF يُولَّد محلياً في `artifacts/telegram-bot/output/`
- رمز الإجازة يُولَّد تلقائياً بصيغة `SL-XXXX-XXXX`

---

## 📄 الترخيص

MIT License — للاستخدام الحر
