#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests
import json
import logging
from datetime import datetime
from config import API_FULL_URL

logger = logging.getLogger(__name__)

def calculate_days(admission_date, discharge_date):
    try:
        p1 = admission_date.split('-')
        p2 = discharge_date.split('-')
        if len(p1) == 3 and len(p2) == 3:
            d1 = datetime(int(p1[2]), int(p1[1]), int(p1[0]))
            d2 = datetime(int(p2[2]), int(p2[1]), int(p2[0]))
            return max(1, (d2 - d1).days + 1)
        return 1
    except Exception as e:
        logger.error(f"خطأ في حساب الأيام: {e}")
        return 1

def generate_leave_id(id_number, admission_date, discharge_date):
    try:
        id_part = id_number[-4:] if len(id_number) >= 4 else id_number
        admission_nums = ''.join(filter(str.isdigit, admission_date))[-3:]
        discharge_nums = ''.join(filter(str.isdigit, discharge_date))[-4:]
        leave_number = (id_part + admission_nums + discharge_nums).ljust(11, '0')[:11]
        return f"PSL{leave_number}"
    except Exception as e:
        logger.error(f"خطأ في توليد رمز الإجازة: {e}")
        return f"PSL{id_number[-4:] if len(id_number) >= 4 else id_number}0000000"

def send_leave_data_to_api(user_data):
    try:
        leave_id = generate_leave_id(
            user_data.get('id_number', ''),
            user_data.get('admission_date_gregorian', ''),
            user_data.get('discharge_date_gregorian', '')
        )

        duration = calculate_days(
            user_data.get('admission_date_gregorian', '01-01-2025'),
            user_data.get('discharge_date_gregorian', '01-01-2025')
        )

        payload = {
            'leaveCode': leave_id,
            'idNumber': user_data.get('id_number', ''),
            'patientNameAr': user_data.get('patient_name_ar', ''),
            'patientNameEn': user_data.get('patient_name_en', ''),
            'nationalityAr': user_data.get('nationality_ar', ''),
            'nationalityEn': user_data.get('nationality_en', ''),
            'employerAr': user_data.get('employer_ar', ''),
            'employerEn': user_data.get('employer_en', ''),
            'doctorNameAr': user_data.get('doctor_name_ar', ''),
            'doctorNameEn': user_data.get('doctor_name_en', ''),
            'positionAr': user_data.get('position_ar', ''),
            'positionEn': user_data.get('position_en', ''),
            'admissionDateGregorian': user_data.get('admission_date_gregorian', ''),
            'admissionDateHijri': user_data.get('admission_date_hijri', ''),
            'dischargeDateGregorian': user_data.get('discharge_date_gregorian', ''),
            'dischargeDateHijri': user_data.get('discharge_date_hijri', ''),
            'issueDate': user_data.get('issue_date_gregorian', user_data.get('discharge_date_gregorian', '')),
            'hospitalNameAr': user_data.get('hospital_name_ar', ''),
            'hospitalNameEn': user_data.get('hospital_name_en', ''),
            'reportTime': user_data.get('time', ''),
            'durationDays': duration
        }

        response = requests.post(
            API_FULL_URL,
            json=payload,
            headers={'Content-Type': 'application/json; charset=utf-8'},
            timeout=10
        )

        if response.status_code in (200, 201):
            result = response.json()
            logger.info(f"تم حفظ البيانات: {result.get('leaveCode')}")
            return {'success': True, 'leave_id': leave_id}
        else:
            logger.error(f"خطأ HTTP {response.status_code}")
            return {'success': False, 'leave_id': leave_id}

    except Exception as e:
        logger.error(f"خطأ في الإرسال: {e}")
        return {'success': False, 'leave_id': 'غير محدد'}
