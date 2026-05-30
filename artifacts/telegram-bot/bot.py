#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Seha Sick Leave Bot — بوت تيليجرام لتوليد تقارير الإجازة المرضية
"""

import logging
import os
import sys

from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import (
    Application, CommandHandler, MessageHandler,
    filters, ContextTypes
)

from config import BOT_TOKEN, OUTPUT_DIR
from pdf_generator import generate_sick_leave_pdf
from api_client import send_leave_data_to_api
from message_parser import MessageParser
from date_converter import DateConverter

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

if not BOT_TOKEN:
    logger.error("BOT_TOKEN غير محدد. أضفه كـ environment variable.")
    sys.exit(1)

os.makedirs(OUTPUT_DIR, exist_ok=True)

STATES = {
    'START': 0,
    'PATIENT_NAME_AR': 1, 'PATIENT_NAME_EN': 2,
    'ID_NUMBER': 3,
    'NATIONALITY_AR': 4, 'NATIONALITY_EN': 5,
    'EMPLOYER_AR': 6, 'EMPLOYER_EN': 7,
    'DOCTOR_NAME_AR': 8, 'DOCTOR_NAME_EN': 9,
    'POSITION_AR': 10, 'POSITION_EN': 11,
    'ADMISSION_DATE': 12, 'DISCHARGE_DATE': 13,
    'HOSPITAL_AR': 14, 'HOSPITAL_EN': 15,
    'TIME': 16,
    'LOGO_UPLOAD': 17,
}

user_data = {}
message_parser = MessageParser()
date_converter = DateConverter()


def make_keyboard(buttons):
    return ReplyKeyboardMarkup(
        [[KeyboardButton(b)] for b in buttons],
        resize_keyboard=True,
        one_time_keyboard=True
    )


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    user_data[user_id] = {'state': STATES['START'], 'data': {}}

    welcome = (
        "👋 مرحبًا في بوت منصة صحة الرسمي\n\n"
        "يمكنك إرسال بيانات المريض في رسالة واحدة بالصيغة التالية:\n\n"
        "👤 اسم المريض (عربي): عبدالله محمد\n"
        "👤 اسم المريض (إنجليزي): Abdullah Mohammed\n"
        "🆔 رقم الهوية: 1234567890\n"
        "🌍 الجنسية (عربي): سعودي\n"
        "🌍 الجنسية (إنجليزي): Saudi Arabia\n"
        "🏢 جهة العمل (عربي): جامعة الملك عبدالعزيز\n"
        "🏢 جهة العمل (إنجليزي): King Abdulaziz University\n"
        "👨‍⚕️ اسم الطبيب (عربي): د. محمد أحمد\n"
        "👨‍⚕️ اسم الطبيب (إنجليزي): Dr. Mohammed Ahmed\n"
        "💼 المسمى الوظيفي (عربي): طبيب عام\n"
        "💼 المسمى الوظيفي (إنجليزي): General Practitioner\n"
        "📅 تاريخ الدخول (ميلادي): 20-05-2025\n"
        "📅 تاريخ الخروج (ميلادي): 22-05-2025\n"
        "🏥 اسم المنشأة (عربي): مستشفى الملك فهد\n"
        "🏥 اسم المنشأة (إنجليزي): King Fahd Hospital\n"
        "⏰ الوقت: 10:30 AM\n\n"
        "أو اضغط على الزر أدناه للإدخال خطوة بخطوة:"
    )
    await update.message.reply_text(
        welcome,
        reply_markup=make_keyboard(["🆕 إنشاء تقرير جديد"])
    )


async def _process_and_send_pdf(update, data):
    user_id = update.effective_user.id
    await update.message.reply_text("🔄 جاري تحويل التواريخ وتوليد التقرير...")

    date_data = date_converter.process_dates(
        data.get('admission_date_gregorian', '01-01-2025'),
        data.get('discharge_date_gregorian', '01-01-2025')
    )
    final_data = {**data, **date_data}

    await update.message.reply_text(
        f"✅ تم تحويل التواريخ:\n"
        f"دخول: {final_data['admission_date_gregorian']} ← {final_data['admission_date_hijri']}\n"
        f"خروج: {final_data['discharge_date_gregorian']} ← {final_data['discharge_date_hijri']}\n\n"
        "🔄 جاري توليد ملف PDF..."
    )

    pdf_path = generate_sick_leave_pdf(final_data, str(user_id))

    if pdf_path and os.path.exists(pdf_path):
        with open(pdf_path, 'rb') as f:
            await update.message.reply_document(
                document=f,
                filename=f"SickLeave_{final_data.get('id_number', 'Report')}.pdf",
                caption="✅ تم إنشاء تقرير الإجازة المرضية بنجاح!"
            )

        try:
            api_resp = send_leave_data_to_api(final_data)
            if api_resp and api_resp.get('success'):
                await update.message.reply_text("✅ تم حفظ البيانات في قاعدة البيانات.")
        except Exception as e:
            logger.warning(f"API save failed: {e}")

        user_data[user_id] = {'state': STATES['LOGO_UPLOAD'], 'data': final_data, 'last_pdf': pdf_path}
        await update.message.reply_text(
            "هل تريد إضافة شعار المنشأة للتقرير؟",
            reply_markup=make_keyboard(["📤 إرسال شعار المنشأة", "🆕 إنشاء تقرير جديد"])
        )
    else:
        await update.message.reply_text("❌ حدث خطأ في توليد التقرير. حاول مرة أخرى.")


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    if user_id not in user_data or user_data[user_id].get('state') != STATES['LOGO_UPLOAD']:
        await update.message.reply_text("أرسل /start للبدء.")
        return

    photo = update.message.photo[-1]
    file = await context.bot.get_file(photo.file_id)
    logo_path = os.path.join(OUTPUT_DIR, f"logo_{user_id}.png")
    await file.download_to_drive(logo_path)

    prev_data = user_data[user_id].get('data', {})
    prev_data['custom_logo'] = logo_path

    await update.message.reply_text("🔄 جاري إعادة توليد التقرير مع الشعار...")
    pdf_path = generate_sick_leave_pdf(prev_data, str(user_id))

    if pdf_path and os.path.exists(pdf_path):
        with open(pdf_path, 'rb') as f:
            await update.message.reply_document(
                document=f,
                filename=f"SickLeave_{prev_data.get('id_number', 'Report')}_logo.pdf",
                caption="✅ التقرير مع شعار المنشأة!"
            )
    user_data[user_id] = {'state': STATES['START'], 'data': {}}
    await update.message.reply_text(
        "تم! هل تريد إنشاء تقرير آخر؟",
        reply_markup=make_keyboard(["🆕 إنشاء تقرير جديد"])
    )


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    text = update.message.text.strip()

    if user_id not in user_data:
        user_data[user_id] = {'state': STATES['START'], 'data': {}}

    # Detect formatted bulk message
    if message_parser.is_formatted_message(text):
        parsed = message_parser.parse_message(text)
        validated = message_parser.validate_data(parsed)
        await _process_and_send_pdf(update, validated)
        return

    state = user_data[user_id]['state']
    data = user_data[user_id].setdefault('data', {})

    # ── New report button ──
    if text == "🆕 إنشاء تقرير جديد":
        user_data[user_id] = {'state': STATES['PATIENT_NAME_AR'], 'data': {}}
        await update.message.reply_text(
            "✍️ أدخل اسم المريض باللغة العربية:",
            reply_markup=make_keyboard(["⬅️ رجوع"])
        )
        return

    if text == "⬅️ رجوع":
        await start(update, context)
        return

    # ── Step-by-step flow ──
    steps = [
        ('patient_name_ar',  STATES['PATIENT_NAME_AR'],  STATES['PATIENT_NAME_EN'],  "✍️ اسم المريض بالإنجليزي:"),
        ('patient_name_en',  STATES['PATIENT_NAME_EN'],  STATES['ID_NUMBER'],        "🆔 رقم الهوية / الإقامة:"),
        ('id_number',        STATES['ID_NUMBER'],        STATES['NATIONALITY_AR'],   "🌍 الجنسية بالعربي:"),
        ('nationality_ar',   STATES['NATIONALITY_AR'],   STATES['NATIONALITY_EN'],   "🌍 الجنسية بالإنجليزي:"),
        ('nationality_en',   STATES['NATIONALITY_EN'],   STATES['EMPLOYER_AR'],      "🏢 جهة العمل بالعربي:"),
        ('employer_ar',      STATES['EMPLOYER_AR'],      STATES['EMPLOYER_EN'],      "🏢 جهة العمل بالإنجليزي:"),
        ('employer_en',      STATES['EMPLOYER_EN'],      STATES['DOCTOR_NAME_AR'],   "👨‍⚕️ اسم الطبيب بالعربي:"),
        ('doctor_name_ar',   STATES['DOCTOR_NAME_AR'],   STATES['DOCTOR_NAME_EN'],   "👨‍⚕️ اسم الطبيب بالإنجليزي:"),
        ('doctor_name_en',   STATES['DOCTOR_NAME_EN'],   STATES['POSITION_AR'],      "💼 المسمى الوظيفي بالعربي:"),
        ('position_ar',      STATES['POSITION_AR'],      STATES['POSITION_EN'],      "💼 المسمى الوظيفي بالإنجليزي:"),
        ('position_en',      STATES['POSITION_EN'],      STATES['ADMISSION_DATE'],   "📅 تاريخ الدخول (مثال: 20-05-2025):"),
        ('admission_date_gregorian', STATES['ADMISSION_DATE'], STATES['DISCHARGE_DATE'], "📅 تاريخ الخروج (مثال: 22-05-2025):"),
        ('discharge_date_gregorian', STATES['DISCHARGE_DATE'], STATES['HOSPITAL_AR'],    "🏥 اسم المنشأة بالعربي:"),
        ('hospital_name_ar', STATES['HOSPITAL_AR'],      STATES['HOSPITAL_EN'],      "🏥 اسم المنشأة بالإنجليزي:"),
        ('hospital_name_en', STATES['HOSPITAL_EN'],      STATES['TIME'],             "⏰ الوقت (مثال: 10:30 AM):"),
    ]

    for field, current_state, next_state, next_prompt in steps:
        if state == current_state:
            data[field] = text
            user_data[user_id]['state'] = next_state
            await update.message.reply_text(next_prompt, reply_markup=make_keyboard(["⬅️ رجوع"]))
            return

    if state == STATES['TIME']:
        data['time'] = text
        await _process_and_send_pdf(update, data)
        return

    # Fallback
    await start(update, context)


def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.PHOTO, handle_photo))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    logger.info("البوت يعمل...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
