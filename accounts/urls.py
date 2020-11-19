from django.urls import path
from . import views
from .views import LogInView


app_name = 'accounts'

urlpatterns = [
    path('', LogInView.as_view(), name='log_in'),
    path('log-in/', LogInView.as_view(), name='log_in'),
    path('log-out/', views.logout_request, name="log_out"),

]
