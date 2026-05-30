#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import qrcode
from datetime import datetime
from fpdf import FPDF
from config import (
    OUTPUT_DIR, NOTO_SANS_ARABIC_BOLD, NOTO_SANS_ARABIC_REGULAR,
    TIMES_NR_MT_BOLD, TIMES_NR_MT_REGULAR, SEHA_LOGO, GEOMETRIC_SHAPE,
    KINGDOM_TEXT, HOSPITAL_LOGO, HEALTH_INFO_CENTER_LOGO, QR_URL,
    PDF_WIDTH, PDF_HEIGHT
)
import arabic_reshaper
from bidi.algorithm import get_display

class SickLeavePDF(FPDF):
    def __init__(self):
        super().__init__(orientation='P', unit='mm', format=(PDF_WIDTH, PDF_HEIGHT))
        self.set_auto_page_break(auto=False)
        self.times_available = False
        self.load_fonts()

    def load_fonts(self):
        try:
            self.add_font('NotoSansArabic-Bold', '', NOTO_SANS_ARABIC_BOLD)
            self.add_font('NotoSansArabic-Regular', '', NOTO_SANS_ARABIC_REGULAR)
            try:
                self.add_font('TimesNRMTPro-Bold', '', TIMES_NR_MT_BOLD)
                self.add_font('TimesNRMTPro-Regular', '', TIMES_NR_MT_REGULAR)
                self.times_available = True
            except:
                self.times_available = False
        except Exception as e:
            print(f"خطأ في تحميل الخطوط: {e}")

    def process_arabic_text(self, text):
        if not text:
            return ""
        try:
            reshaped = arabic_reshaper.reshape(text)
            return get_display(reshaped)
        except:
            return text

    def add_header_images(self):
        try:
            if os.path.exists(SEHA_LOGO):
                self.image(SEHA_LOGO, x=11, y=12, w=56, h=26)
            if os.path.exists(GEOMETRIC_SHAPE):
                self.image(GEOMETRIC_SHAPE, x=191, y=12, w=94, h=40)
            if os.path.exists(KINGDOM_TEXT):
                self.image(KINGDOM_TEXT, x=100, y=13, w=94, h=45)
        except Exception as e:
            print(f"خطأ في صور الرأس: {e}")

    def add_titles(self):
        self.set_font('NotoSansArabic-Bold', size=22)
        self.set_text_color(48, 109, 181)
        self.set_xy(116, 57)
        self.cell(68, 10, self.process_arabic_text('تقرير إجازة مرضية'), align='C')

        if self.times_available:
            self.set_font('TimesNRMTPro-Bold', size=18)
        else:
            self.set_font('Arial', 'B', size=18)
        self.set_text_color(44, 62, 119)
        self.set_xy(123, 69)
        self.cell(52, 7, 'Sick Leave Report', align='C')

    def generate_leave_id(self, id_number, admission_date, discharge_date):
        id_part = id_number[-4:] if len(id_number) >= 4 else id_number
        admission_nums = ''.join(filter(str.isdigit, admission_date))[-3:]
        discharge_nums = ''.join(filter(str.isdigit, discharge_date))[-4:]
        leave_number = (id_part + admission_nums + discharge_nums).ljust(11, '0')[:11]
        return f"PSL{leave_number}"

    def calculate_duration(self, admission_date_hijri, discharge_date_hijri,
                           admission_date_gregorian, discharge_date_gregorian):
        try:
            a_parts = admission_date_gregorian.split('-')
            d_parts = discharge_date_gregorian.split('-')
            if len(a_parts) == 3 and len(d_parts) == 3:
                a_dt = datetime(int(a_parts[2]), int(a_parts[1]), int(a_parts[0]))
                d_dt = datetime(int(d_parts[2]), int(d_parts[1]), int(d_parts[0]))
                days = (d_dt - a_dt).days + 1
                day_word = "day" if days == 1 else "days"
                dur_ar = f"{days} يوم {admission_date_hijri} إلى {discharge_date_hijri}"
                dur_en = f"{days} {day_word} ({admission_date_gregorian} to {discharge_date_gregorian})"
                return dur_ar, dur_en, days
        except Exception as e:
            print(f"خطأ في حساب المدة: {e}")
        dur_ar = f"1 يوم {admission_date_hijri} إلى {discharge_date_hijri}"
        dur_en = f"1 day ({admission_date_gregorian} to {discharge_date_gregorian})"
        return dur_ar, dur_en, 1

    def add_table(self, data):
        table_x = 12.5
        table_y = 85
        col_widths = [58, 83, 83, 48]
        row_heights = [15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15]
        row_bg_colors = {
            1: (44, 62, 119),
            3: (247, 247, 247),
            5: (247, 247, 247),
            7: (247, 247, 247),
            9: (247, 247, 247),
        }

        leave_id = self.generate_leave_id(
            data.get('id_number', '1234567890'),
            data.get('admission_date_gregorian', '01-01-2025'),
            data.get('discharge_date_gregorian', '01-01-2025')
        )

        duration_ar, duration_en, duration_days = self.calculate_duration(
            data.get('admission_date_hijri', '01-01-1446'),
            data.get('discharge_date_hijri', '01-01-1446'),
            data.get('admission_date_gregorian', '01-01-2025'),
            data.get('discharge_date_gregorian', '01-01-2025')
        )

        processed_data = {}
        for key, value in data.items():
            if key.endswith('_ar') and value:
                processed_data[key] = self.process_arabic_text(value)
            else:
                processed_data[key] = value

        duration_ar_processed = self.process_arabic_text(duration_ar)

        table_data = [
            ['Leave ID', leave_id, '', self.process_arabic_text('رمز الإجازة')],
            ['Leave Duration', duration_en, duration_ar_processed, self.process_arabic_text('مدة الإجازة')],
            ['Admission Date', processed_data.get('admission_date_gregorian', ''), f"({processed_data.get('admission_date_hijri', '')})", self.process_arabic_text('تاريخ الدخول')],
            ['Discharge Date', processed_data.get('discharge_date_gregorian', ''), f"({processed_data.get('discharge_date_hijri', '')})", self.process_arabic_text('تاريخ الخروج')],
            ['Issue Date', processed_data.get('issue_date_gregorian', ''), '', self.process_arabic_text('تاريخ إصدار التقرير')],
            ['Name', processed_data.get('patient_name_en', ''), processed_data.get('patient_name_ar', ''), self.process_arabic_text('الاسم')],
            ['National ID / Iqama', processed_data.get('id_number', ''), '', self.process_arabic_text('رقم الهوية / الإقامة')],
            ['Nationality', processed_data.get('nationality_en', ''), processed_data.get('nationality_ar', ''), self.process_arabic_text('الجنسية')],
            ['Employer', processed_data.get('employer_en', ''), processed_data.get('employer_ar', ''), self.process_arabic_text('جهة العمل')],
            ['Practitioner Name', processed_data.get('doctor_name_en', ''), processed_data.get('doctor_name_ar', ''), self.process_arabic_text('اسم الممارس')],
            ['Position', processed_data.get('position_en', ''), processed_data.get('position_ar', ''), self.process_arabic_text('المسمى الوظيفي')],
        ]

        current_y = table_y
        duration_cell_pos = None  # (x, y, w, h) for the Arabic duration cell

        for row_idx, row_data in enumerate(table_data):
            current_x = table_x
            row_height = row_heights[row_idx]

            if row_idx in row_bg_colors:
                self.set_fill_color(*row_bg_colors[row_idx])
                fill = True
            else:
                fill = False

            for col_idx, cell_text in enumerate(row_data):
                col_width = col_widths[col_idx]

                if self._is_merged_cell(row_idx, col_idx):
                    current_x += col_width
                    continue

                actual_width = col_width
                if self._is_merge_start(row_idx, col_idx):
                    actual_width = col_widths[col_idx] + col_widths[col_idx + 1]

                self.set_draw_color(217, 217, 217)
                self.set_line_width(0.5)
                self.rect(current_x, current_y, actual_width, row_height, 'D' if not fill else 'DF')

                self._set_cell_font_and_color(row_idx, col_idx)

                if cell_text:
                    self.set_xy(current_x, current_y)
                    self.cell(actual_width, row_height, cell_text, align='C')

                # تحديد موضع خلية مدة الإجازة الهجرية لإضافة الأقواس لاحقاً
                if row_idx == 1 and col_idx == 2:
                    duration_cell_pos = (current_x, current_y, actual_width, row_height)

                current_x += col_width

            current_y += row_height

        # رسم القوسين كمربعات نص مستقلة بخط Times بموضع دقيق بناءً على عرض النص
        if duration_cell_pos:
            cx, cy, cw, ch = duration_cell_pos
            paren_font = 'TimesNRMTPro-Regular' if self.times_available else 'Arial'
            paren_style = ''

            # احسب عرض النص الكامل وعرض الجزء الأيمن "N يوم" بخط NotoSansArabic
            self.set_font('NotoSansArabic-Regular', size=13)
            full_w = self.get_string_width(duration_ar_processed)
            days_part_visual = self.process_arabic_text(f"{duration_days} يوم")
            days_w = self.get_string_width(days_part_visual)

            # بداية النص داخل الخلية (محاذاة وسط)
            text_x = cx + (cw - full_w) / 2

            # ) تأتي في أقصى يسار كتلة النص (نهاية التاريخ الثاني بصرياً)
            close_x = text_x

            # ( تأتي مباشرة بعد كلمة "يوم" (يسار كتلة "N يوم" بصرياً)
            open_x = text_x + full_w - days_w

            self.set_text_color(255, 255, 255)
            self.set_font(paren_font, paren_style, size=13)

            # مسافة 2mm قبل وبعد كل قوس
            gap = 2
            self.set_xy(open_x - 3 - gap, cy)
            self.cell(5 + gap, ch, ')', align='R')

            self.set_xy(close_x - 2 + gap, cy)
            self.cell(5 + gap, ch, '(', align='L')

        self.set_draw_color(217, 217, 217)
        self.set_line_width(0.5)
        self.line(152, 254, 152, 335)

    def _is_merged_cell(self, row_idx, col_idx):
        return row_idx in [0, 4, 6] and col_idx == 2

    def _is_merge_start(self, row_idx, col_idx):
        return row_idx in [0, 4, 6] and col_idx == 1

    def _set_cell_font_and_color(self, row_idx, col_idx):
        blue_color = (54, 111, 181)
        dark_blue = (44, 62, 119)
        white_color = (255, 255, 255)

        if row_idx == 1:
            if col_idx in [0, 3]:
                if col_idx == 0:
                    if self.times_available:
                        self.set_font('TimesNRMTPro-Bold', size=13)
                    else:
                        self.set_font('Arial', 'B', size=13)
                else:
                    self.set_font('NotoSansArabic-Bold', size=13)
                self.set_text_color(*white_color)
            else:
                if col_idx == 1:
                    if self.times_available:
                        self.set_font('TimesNRMTPro-Regular', size=13)
                    else:
                        self.set_font('Arial', '', size=13)
                else:
                    self.set_font('NotoSansArabic-Regular', size=13)
                self.set_text_color(*white_color)
        elif col_idx == 0:
            if self.times_available:
                self.set_font('TimesNRMTPro-Bold', size=13)
            else:
                self.set_font('Arial', 'B', size=13)
            self.set_text_color(*blue_color)
        elif col_idx == 1:
            font_size = 11 if row_idx in [5, 7, 9] else 13
            if self.times_available:
                self.set_font('TimesNRMTPro-Regular', size=font_size)
            else:
                self.set_font('Arial', '', size=font_size)
            self.set_text_color(*dark_blue)
        elif col_idx == 2:
            if row_idx in [2, 3]:
                if self.times_available:
                    self.set_font('TimesNRMTPro-Regular', size=13)
                else:
                    self.set_font('Arial', '', size=13)
            else:
                self.set_font('NotoSansArabic-Regular', size=13)
            self.set_text_color(*dark_blue)
        elif col_idx == 3:
            self.set_font('NotoSansArabic-Bold', size=13)
            self.set_text_color(*blue_color)

    def add_footer_elements(self, data):
        try:
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(QR_URL)
            qr.make(fit=True)
            qr_img = qr.make_image(fill_color="black", back_color="white")
            qr_path = os.path.join(OUTPUT_DIR, "temp_qr.png")
            qr_img.save(qr_path)

            self.image(qr_path, x=60, y=265, w=42, h=40)
            if os.path.exists(qr_path):
                os.remove(qr_path)

            self.set_font('NotoSansArabic-Bold', size=10)
            self.set_text_color(0, 0, 0)
            self.set_xy(45, 308)
            self.cell(72, 6, self.process_arabic_text('للتحقق من بيانات التقرير يرجى التأكد من زيارة موقع منصة صحة'), align='C')
            self.set_xy(45, 314)
            self.cell(72, 6, self.process_arabic_text('الرسمي'), align='C')

            if self.times_available:
                self.set_font('TimesNRMTPro-Bold', size=9)
            else:
                self.set_font('Arial', 'B', size=9)
            self.set_xy(45, 320)
            self.cell(72, 6, "To check the report please visit Seha's official website", align='C')

            if self.times_available:
                self.set_font('TimesNRMTPro-Regular', size=9)
            else:
                self.set_font('Arial', '', size=9)
            self.set_text_color(0, 0, 255)
            self.set_xy(45, 326)
            self.cell(72, 6, QR_URL, align='C', link=QR_URL)

            self.set_draw_color(0, 0, 255)
            self.set_line_width(0.1)
            lw = self.get_string_width(QR_URL)
            lx = 45 + (72 - lw) / 2
            self.line(lx, 330, lx + lw, 330)

            custom_logo = data.get('custom_logo')
            if custom_logo and os.path.exists(custom_logo):
                self.image(custom_logo, x=203, y=266, w=43, h=42)
            elif os.path.exists(HOSPITAL_LOGO):
                self.image(HOSPITAL_LOGO, x=203, y=266, w=43, h=42)

            hospital_name_ar = data.get('hospital_name_ar', 'مجمع عائلتي الطبي')
            hospital_name_en = data.get('hospital_name_en', 'My Family Medical Center')

            self.set_font('NotoSansArabic-Bold', size=12)
            self.set_text_color(0, 0, 0)
            self.set_xy(188, 309)
            self.cell(67, 10, self.process_arabic_text(hospital_name_ar), align='C')

            if self.times_available:
                self.set_font('TimesNRMTPro-Bold', size=12)
            else:
                self.set_font('Arial', 'B', size=12)
            self.set_xy(188, 320)
            self.cell(67, 10, hospital_name_en, align='C')

            if os.path.exists(HEALTH_INFO_CENTER_LOGO):
                self.image(HEALTH_INFO_CENTER_LOGO, x=231, y=336, w=54, h=26)

            current_time = data.get('time', '6:23 AM')
            current_date = datetime.now().strftime('%A, %d %B %Y')

            if self.times_available:
                self.set_font('TimesNRMTPro-Bold', size=12)
            else:
                self.set_font('Arial', 'B', size=12)
            self.set_text_color(0, 0, 0)
            self.set_xy(11, 339)
            self.cell(20, 6, current_time, align='L')
            self.set_xy(11, 347)
            self.cell(47, 6, current_date, align='L')

        except Exception as e:
            print(f"خطأ في التذييل: {e}")


def generate_sick_leave_pdf(data, user_id):
    try:
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        pdf = SickLeavePDF()
        pdf.add_page()
        pdf.add_header_images()
        pdf.add_titles()
        pdf.add_table(data)
        pdf.add_footer_elements(data)

        id_number = data.get('id_number', 'UNKNOWN')
        issue_date = data.get('issue_date_gregorian', datetime.now().strftime('%d-%m-%Y'))
        filename = f"SickLeave_{id_number}_{issue_date.replace('-', '')}.pdf"
        filepath = os.path.join(OUTPUT_DIR, filename)
        pdf.output(filepath)
        return filepath
    except Exception as e:
        print(f"خطأ في توليد PDF: {e}")
        raise e
