from django.db import models
from django.utils import timezone

# Create your models here.


class UserInfo(models.Model):
    user_id = models.CharField(max_length=100, default='')
    user_name = models.CharField(max_length=100, default='')
    gender = models.CharField(max_length=20, default='Unknown')
    email = models.CharField(max_length=100, default='')
    age_level = models.CharField(max_length=20, default='')
    provider = models.CharField(max_length=50, default='')
    phone_number = models.CharField(max_length=20, default='')
    address1 = models.CharField(max_length=100, default='')
    address2 = models.CharField(max_length=100, default='')
    zip_code = models.CharField(max_length=20, default='')
    approved = models.BooleanField(default=False)
    approved_adult = models.BooleanField(default=False)
    created_date = models.DateTimeField(
        default=timezone.now)
