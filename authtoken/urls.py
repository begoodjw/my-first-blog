from django.contrib import admin
from django.urls import path
from . import views
from .views import init_firebase

urlpatterns = [
    path('customtoken/', views.custom_token)
]

init_firebase()

print("@@@@ authtoken url")

# cron 스케쥴러를 실행시키며, job_id는 "1" 입니다.
#scheduler.scheduler('cron', "1")