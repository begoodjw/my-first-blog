# chat/urls.py
from django.urls import path
from .scheduler import Scheduler

from . import views

urlpatterns = [
    path('chatadmin/', views.chat_home_admin, name='chat_home_admin'),
    #path('<str:room_name>/', views.room, name='room'),
    path('chatadmin/<str:room_name>', views.chat_home, name='chat_home'),
    path('chatadmin/<str:room_name>/create', views.chat_admin, name='chat_admin'),
    path('chatadmin/<str:room_name>/history', views.chat_history, name='chat_history'),
    path('chatadmin/<str:room_name>/quiz_answer', views.quiz_answer, name='quiz_answer'),
]
print("@@@@ chat url")
SERVICE_SCHEDULER = Scheduler()
SERVICE_SCHEDULER.load_all_schedules()

# cron 스케쥴러를 실행시키며, job_id는 "1" 입니다.
#scheduler.scheduler('cron', "1")