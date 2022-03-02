from django.shortcuts import render
import firebase_admin
import os
from firebase_admin import credentials
from firebase_admin import auth
from django.views.generic import View
from rest_framework.decorators import api_view
from rest_framework.response import Response

# Create your views here.


"""class FirebaseCustomToken(View):

    def get(self, request, *args, **kwargs):
        init_firebase()
        uid = "test"
        custom_token = auth.create_custom_token(uid)
        print(str(custom_token))

        return Response({"firebaseToken": custom_token})"""


@api_view(['GET', 'POST'])
def custom_token(request):

    uid = str(request.data["uid"])
    #provider = str(request.data["provider"])
    user_email = str(request.data["email"])
    if len(user_email) == 0:
        user_email = "No Email"
    token = auth.create_custom_token(uid)
    #firebase_admin.auth.update_user(uid, email=user_email)
    #print(str(token))

    return Response({"firebaseToken": token})


def init_firebase():
    BASE_DIR = os.path.dirname(os.path.realpath(__file__)) + "/"
    PROJECT_DIR_PATH = BASE_DIR
    CRED_PATH = PROJECT_DIR_PATH + "talkbox-b2af7-firebase-adminsdk-tfxkq-c9d07fb8da.json"
    print(CRED_PATH)

    cred = credentials.Certificate(CRED_PATH)
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://talkbox-b2af7.firebaseio.com'
    })