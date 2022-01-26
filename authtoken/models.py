from django.db import models
from django.utils import timezone

# Create your models here.


class UserInfo(models.Model):
    user_id = models.CharField(max_length=100)
    user_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=20)
    email = models.CharField(max_length=100)
    age_level = models.CharField(max_length=20)
    provider = models.CharField(max_length=50)
    phone_number = models.CharField(max_length=20)
    address1 = models.CharField(max_length=100)
    address2 = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=20)
    approved = models.BooleanField()
    approved_adult = models.BooleanField()
    created_date = models.DateTimeField(
        default=timezone.now)
