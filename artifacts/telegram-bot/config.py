import os

BOT_TOKEN = os.environ.get('BOT_TOKEN', '')
ADMIN_USER_ID = os.environ.get('ADMIN_USER_ID', '')

API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:80')
API_ENDPOINT = '/api/leaves'
API_FULL_URL = API_BASE_URL + API_ENDPOINT

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FONTS_DIR = os.path.join(BASE_DIR, 'fonts')
IMAGES_DIR = os.path.join(BASE_DIR, 'images')
OUTPUT_DIR = os.path.join(BASE_DIR, 'output')

NOTO_SANS_ARABIC_BOLD = os.path.join(FONTS_DIR, 'noto_sans_arabic', 'NotoSansArabic-Bold.ttf')
NOTO_SANS_ARABIC_REGULAR = os.path.join(FONTS_DIR, 'noto_sans_arabic', 'NotoSansArabic-Regular.ttf')
TIMES_NR_MT_BOLD = os.path.join(FONTS_DIR, 'times_nr_mt', 'TimesNRMTPro-Bold.otf')
TIMES_NR_MT_REGULAR = os.path.join(FONTS_DIR, 'times_nr_mt', 'TimesNRMTPro-Regular.otf')

SEHA_LOGO = os.path.join(IMAGES_DIR, 'شعارصحةseha.jpg')
GEOMETRIC_SHAPE = os.path.join(IMAGES_DIR, 'الشكلالهندسي.jpg')
KINGDOM_TEXT = os.path.join(IMAGES_DIR, 'كلمةالمملكةالعربيةالسعوديةKingdomofSaudiArabia.jpg')
HOSPITAL_LOGO = os.path.join(IMAGES_DIR, 'شعارالمستشفى.png')
HEALTH_INFO_CENTER_LOGO = os.path.join(IMAGES_DIR, 'شعارالمركزالوطنيللمعلوماتالصحية.jpg')

QR_URL = 'https://www.seha.sa/#/inquiries/slenquiry'

PDF_WIDTH = 297
PDF_HEIGHT = 419
