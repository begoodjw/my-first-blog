from django.shortcuts import render, get_object_or_404
from django.db.models import Q
from django.utils.safestring import mark_safe
from django.contrib.auth.decorators import login_required, permission_required
import json
import websocket
from .models import AllService
from .broadcast import get_tv_service, get_tv_permission, tv_channels
from django.core.exceptions import PermissionDenied
from django.views.decorators.csrf import csrf_exempt
from .chat_header import ProcessState, ScheduleState, ProcessType
from .models import CurrentUser


# Create your views here.


@login_required()
def chat_home_admin(request):
    if request.user.has_perm("chat.add_allservice"):
        pending_quiz = AllService.objects.filter(process_state=ProcessState.WAIT_ANSWER)
        pending_reserve = AllService.objects.filter(process_type=ProcessType.RESERVE).exclude(schedule_state=ScheduleState.FINISH)
        pending_repeat = AllService.objects.filter(process_type=ProcessType.REPEAT).exclude(schedule_state=ScheduleState.FINISH)

        services_all = AllService.objects.all()

        return render(request, 'chat/chat_home.html', {
            'pending_quiz': pending_quiz,
            'pending_reserve': pending_reserve,
            'pending_repeat': pending_repeat,
            'services_all': services_all,
            'action': 'home',
            'room_name': "ADMIN",
            'room_name_json': mark_safe(json.dumps("ADMIN"))})
    else:
        raise PermissionDenied()


@login_required()
def chat_home(request, room_name):
    if request.user.has_perm(get_tv_permission(room_name)):
        user_count = 0
        if CurrentUser.objects.filter(channel_name=room_name).count() > 0:
            obj = CurrentUser.objects.get(channel_name=room_name)
            user_count = obj.user_count
            print("get user count : " + str(user_count))
        else:
            print("create user count : " + room_name)
            obj = CurrentUser.objects.create()
            obj.channel_name = room_name
            obj.user_count = 0

        pending_quiz = get_tv_service(room_name).objects.filter(process_state=ProcessState.WAIT_ANSWER)
        pending_reserve = get_tv_service(room_name).objects.filter(process_type=ProcessType.RESERVE).exclude(schedule_state=ScheduleState.FINISH)
        pending_quiz_answer_reserve = get_tv_service(room_name).objects.filter(Q(process_state=ProcessState.WAIT_SEND_ANSWER_RESERVE) | Q(process_state=ProcessState.ANSWER_RESERVE))
        pending_repeat = get_tv_service(room_name).objects.filter(process_type=ProcessType.REPEAT).exclude(schedule_state=ScheduleState.FINISH)

        services_all = get_tv_service(room_name).objects.all()
        services_all_reverse = reversed(services_all)
        history_list = []
        wait_answer_list = []
        quiz_answer_reserve_list = []

        count = 0
        for service in pending_quiz:
            wait_answer_list.append(service)
            count += 1
            if count >= 10:
                break

        count = 0
        for service in services_all_reverse:
            history_list.append(service)
            count += 1
            if count >= 10:
                break

        for service in pending_quiz_answer_reserve:
            contents_data = json.loads(service.contents)
            if "answer_schedule_state" in contents_data and contents_data["answer_schedule_state"] != ScheduleState.FINISH:
                quiz_answer_reserve_list.append(service)

        return render(request, 'chat/chat_home.html', {
            'user_count': user_count,
            'all_count': len(services_all),
            'pending_quiz_count': len(pending_quiz),
            'pending_quiz': wait_answer_list,
            'pending_reserve': pending_reserve,
            'pending_repeat': pending_repeat,
            'pending_quiz_answer_reserve': quiz_answer_reserve_list,
            'history_list': history_list,
            'action': 'home',
            'room_name': room_name,
            'room_name_json': mark_safe(json.dumps(room_name))})
    else:
        raise PermissionDenied()


@login_required()
#@permission_required('chat.add_tvservice', raise_exception=True)
def chat_admin(request, room_name):
    RECENT_SERVICE_COUNT = 30
    if request.user.has_perm(get_tv_permission(room_name)):
        services = get_tv_service(room_name).objects.all()
        services_all_reverse = reversed(services)
        load_list = []
        count = 0
        for service in services_all_reverse:
            load_list.append(service)
            count += 1
            if count >= RECENT_SERVICE_COUNT:
                break

        return render(request, 'chat/chat_admin.html', {
            'action': 'create',
            'room_name': room_name,
            'services': load_list,
            'room_name_json': mark_safe(json.dumps(room_name))})
    else:
        raise PermissionDenied()


@login_required()
#@permission_required('chat.add_tvservice', raise_exception=True)
def chat_history(request, room_name):
    print("chat_history called: " + room_name)
    #services = TvService.objects.filter(channel_name=room_name)
    #services = TvService.objects.all()
    if request.user.has_perm(get_tv_permission(room_name)):
        services = get_tv_service(room_name).objects.all()
        print(str(services))
        return render(request, 'chat/chat_history.html', {'services': services,
                                                          'action': 'history',
                                                          'room_name': room_name,
                                                          'room_name_json': mark_safe(json.dumps(room_name))})
    else:
        raise PermissionDenied()


@login_required()
#@permission_required('chat.add_tvservice', raise_exception=True)
def quiz_answer(request, room_name):
    print("quiz_answer called: " + room_name)
    #services = TvService.objects.filter(channel_name=room_name)
    #services = TvService.objects.all()
    if request.user.has_perm(get_tv_permission(room_name)):
        services = get_tv_service(room_name).objects.filter(process_state=ProcessState.WAIT_ANSWER)
        reserve_possibles = get_tv_service(room_name).objects\
            .filter(process_state=ProcessState.WAIT_SEND)\
            .exclude(schedule_state=ScheduleState.FINISH)
        print(str(services))
        return render(request, 'chat/quiz_answer.html', {'services': services,
                                                         'reserve_possibles': reserve_possibles,
                                                         'action': 'quiz_answer',
                                                         'room_name': room_name,
                                                         'room_name_json': mark_safe(json.dumps(room_name))})
    else:
        raise PermissionDenied()


@login_required()
#@permission_required('chat.add_tvservice', raise_exception=True)
def contact_us(request, room_name):
    print("quiz_answer called: " + room_name)
    if request.user.has_perm(get_tv_permission(room_name)):
        return render(request, 'chat/contact_us.html', {
            'action': 'contact_us',
            'room_name': room_name,
            'room_name_json': mark_safe(json.dumps(room_name))})
    else:
        raise PermissionDenied()


def room(request, room_name):
    return render(request, 'chat/tv_view.html', {
        'room_name_json': mark_safe(json.dumps(room_name))
    })


@csrf_exempt
def chat_relay(request, room_name):
    received_json_data = {}
    if request.method == "POST":
        received_json_data = json.loads(request.body)
        #print(str(received_json_data))
        ws = websocket.create_connection("ws://localhost:8000/ws/chat/" + room_name + "/")
        ws.send(json.dumps(received_json_data))

    return render(request, 'chat/chat_relay.html', {})

