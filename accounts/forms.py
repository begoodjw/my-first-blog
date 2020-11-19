from datetime import timedelta

from django import forms
from django.forms import ValidationError
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm
from django.utils import timezone
from django.db.models import Q
from django.utils.translation import gettext_lazy as _
from .models import PrivateUser


class UserCacheMixin:
    user_cache = None


class SignIn(UserCacheMixin, forms.Form):
    password = forms.CharField(label=_(''), strip=False, widget=forms.PasswordInput(attrs={'placeholder': '비밀번호'}))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if settings.USE_REMEMBER_ME:
            self.fields['remember_me'] = forms.BooleanField(label=_('로그인 상태 유지'), required=False)

    def clean_password(self):
        password = self.cleaned_data['password']

        if not self.user_cache:
            return password

        #if not self.user_cache.check_password(password):
        if not self.user_cache.check_password(password):
            raise ValidationError(_('잘못된 비밀 번호 입니다.'))

        return password


class SignInViaUsernameForm(SignIn):
    username = forms.CharField(label=_(''))

    @property
    def field_order(self):
        if settings.USE_REMEMBER_ME:
            return ['username', 'password', 'remember_me']
        return ['username', 'password']

    def clean_username(self):
        username = self.cleaned_data['username']

        user = User.objects.filter(username=username).first()
        if not user:
            raise ValidationError(_('잘못된 사용자 ID 입니다.'))

        if not user.is_active:
            raise ValidationError(_('활성화 되지 않은 사용자 입니다.'))

        self.user_cache = user

        return username


class SignInPrivateUserForm(SignIn):
    username = forms.CharField(label=_(''), widget=forms.TextInput(attrs={'placeholder': '아이디'}))

    @property
    def field_order(self):
        if settings.USE_REMEMBER_ME:
            return ['username', 'password', 'remember_me']
        return ['username', 'password']

    def clean_username(self):
        username = self.cleaned_data['username']

        user = PrivateUser.objects.filter(username=username).first()
        if not user:
            raise ValidationError(_('잘못된 사용자 아이디 입니다.'))

        if not user.is_active:
            raise ValidationError(_('활성화 되지 않은 사용자 입니다.'))

        self.user_cache = user

        return username