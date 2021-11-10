from asgiref.sync import async_to_sync
# from channels.generic.websocket import WebsocketConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
from threading import Timer
import json
# from .models import TvService
from channels.db import database_sync_to_async
from .broadcast import get_tv_service, BroadCaster
from .urls import SERVICE_SCHEDULER
from django.utils.crypto import get_random_string
from .chat_header import QUIZ_ANSWER_POSTFIX, ScheduleTarget, AnswerRequestType, RequestType, ServiceType, DetailType, Category, ProcessType, ProcessState, ScheduleState
import unicodedata
import time
from django.conf import settings
import datetime

PRINT_DEBUG_LOG = True


class ChatConsumer(AsyncWebsocketConsumer):
    INTERACTION_SERVICE = "send_interaction_service"
    QUIZ_ANSWER = "send_quiz_answer"
    SCHEDULE_DATA = "send_schedule_data"
    SCHEDULE_DB_UPDATE = "send_schedule_db_update"

    room_name = ""
    room_group_name = ""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print("###### Init Chat Consumer #######")

    async def connect(self):
        print("connect")
        user = str(self.scope["user"])
        print(user)

        '''if user == "AnonymousUser":
            proper_user = False
            headers = self.scope['headers']
            for info in headers:
                if str(info[0].decode("utf-8")) == "everydaytalk":
                    proper_user = True
                    break
            if not proper_user:
                print("reject connection")
                return'''

        self.room_name = self.scope['url_route']['kwargs']['room_name']  # ??
        self.room_group_name = 'chat_%s' % self.room_name

        # Join room group
        # async_to_sync(self.channel_layer.group_add)(
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        # async_to_sync(self.channel_layer.group_discard)(
        if self.room_group_name == "":
            return
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        print("called receive func")
        text_data_json = json.loads(text_data)

        category = text_data_json['category']
        # service_type = text_data_json['service_type']
        request_type = text_data_json['request_type']

        if request_type == RequestType.SERVICE_CREATE:
            # process service from Interaction Manager
            # NOW, RESERVE, REPEAT
            service_id = get_service_id(category, text_data_json)
            process_type = text_data_json['process_type']
            if process_type == ProcessType.NOW:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': self.INTERACTION_SERVICE,
                        'service_id': service_id,
                        'data': text_data_json,
                    }
                )
            else:
                # FIXME: set schedule data for REPEAT and RESERVE
                create_service_schedule(service_id, text_data_json)

            # sync to db
            if category == Category.TV or category == Category.MENUAL:
                await update_db_service_create(text_data_json, service_id)

        elif request_type == RequestType.QUIZ_ANSWER:
            # execute quiz answer
            service_id = get_service_id(category, text_data_json)

            answer_request_type = text_data_json['answer_request_type']
            if answer_request_type == AnswerRequestType.SUBMIT:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': self.QUIZ_ANSWER,
                        'service_id': service_id,
                        'data': text_data_json,
                    }
                )

            if category == Category.TV or category == Category.MENUAL:
                await update_quiz_answer(text_data_json, service_id)

        elif request_type == RequestType.SCHEDULE:
            # execute schedule ( send service by schedule )
            service_id = get_service_id(category, text_data_json)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': self.SCHEDULE_DATA,
                    'service_id': service_id,
                    'data': text_data_json,
                }
            )
            if category == Category.TV or category == Category.MENUAL:
                await update_schedule_data(text_data_json, service_id)

        elif request_type == RequestType.UPDATE_SCHEDULE:
            # change schedule (resume, pause, destroy)
            print("request: " + RequestType.UPDATE_SCHEDULE)
            result = update_schedule_db(text_data_json)
            '''await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': self.SCHEDULE_DB_UPDATE,
                    'data': text_data_json,
                    'result': result
                }
            )'''

    '''async def receive_old(self, text_data):
        print("called receive func")
        text_data_json = json.loads(text_data)

        category = text_data_json['category']
        service_type = text_data_json['service_type']

        if service_type == ServiceType.QUIZ_ANSWER:
            # execute quiz answer
            service_id = get_service_id(category, text_data_json)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': self.QUIZ_ANSWER,
                    'service_id': service_id,
                    'data': text_data_json,
                }
            )
            if category == Category.TV or category == Category.MENUAL:
                await self.update_db(text_data_json, service_id)

        elif service_type == ServiceType.SCHEDULE:
            # execute schedule ( send service by schedule )
            service_id = get_service_id(category, text_data_json)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': self.SCHEDULE_DATA,
                    'service_id': service_id,
                    'data': text_data_json,
                }
            )
            if category == Category.TV or category == Category.MENUAL:
                await self.update_db(text_data_json, service_id)

        elif service_type == ServiceType.UPDATE_SCHEDULE:
            # change schedule (resume, pause, destroy)
            result = self.update_schedule_db(text_data_json)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': self.SCHEDULE_DB_UPDATE,
                    'data': text_data_json,
                    'result': result
                }
            )
            return
        else:
            # process service from Interaction Manager
            # NOW, RESERVE, REPEAT
            service_id = get_service_id(category, text_data_json)
            process_type = text_data_json['process_type']
            if process_type == ProcessType.NOW:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': self.INTERACTION_SERVICE,
                        'service_id': service_id,
                        'data': text_data_json,
                    }
                )
            else:
                # FIXME: set schedule data for REPEAT and RESERVE

                create_service_schedule(service_id, text_data_json)

            # sync to db
            if category == Category.TV or category == Category.MENUAL:
                await self.update_db(text_data_json, service_id)'''


    # Receive message from room group
    async def send_interaction_service(self, event):
        send_data = get_send_data(event['service_id'], event['data'])
        # print("send_data: " + str(send_data))
        print_log("send_interaction_service", event['service_id'])
        await self.send(text_data=json.dumps(send_data))

    async def send_quiz_answer(self, event):
        answer_data = get_answer_data(event['service_id'], event['data'])
        print_log("send_quiz_answer", event['service_id'])
        await self.send(text_data=json.dumps(answer_data))

    async def send_schedule_data(self, event):
        schedule_data = get_schedule_data(event['service_id'], event['data'])
        print_log("send_schedule_data", event['service_id'])
        await self.send(text_data=json.dumps(schedule_data))
        if schedule_data['service_type'] == ServiceType.INFO and event['data']["process_type"] == ProcessType.RESERVE:
            timer = Timer(5, delete_contents_image, [event['service_id'], event['data']["owner"]])
            timer.start()
        #delete_contents_image(event['service_id'], event['data']["owner"])

    async def send_schedule_db_update(self, event):
        #print("service " + event['type'])
        schedule_data = get_schedule_db_update(event['result'], event['data'])
        # print("$$$$$$$$$ schedule_db_update_data: " + str(schedule_data))
        print_log("send_schedule_db_update", str(schedule_data))
        await self.send(text_data=json.dumps(schedule_data))


def update_schedule_db(text_data_json):
    # INFO: only called in case RESERVE AND REPEAT services
    result = True
    service_id = text_data_json['service_id']
    # channel_name = text_data_json['channel_name']
    owner = text_data_json['owner']
    state = text_data_json['state']
    target = text_data_json['schedule_target']


    print(owner + " / " + target)
    print(str(state))

    service_obj = get_tv_service(owner).objects.get(service_id=service_id)
    process_state = service_obj.process_state
    if target == ScheduleTarget.SERVICE:
        if state == ScheduleState.ACTIVE:
            service_obj.schedule_state = state
            service_obj.save()
            resume_service_schedule(service_id)
        elif state == ScheduleState.INACTIVE:
            service_obj.schedule_state = state
            pause_service_schedule(service_id)
            if process_state == ProcessState.WAIT_SEND_ANSWER_RESERVE or process_state == ProcessState.ANSWER_RESERVE:
                set_quiz_answer_inactive(service_obj)
                pause_quiz_answer_schedule(service_id)
            service_obj.save()

        elif state == ScheduleState.FINISH:
            print("FINISH service: " + service_obj.service_title)
            service_obj.schedule_state = ScheduleState.FINISH
            if service_obj.process_state == ProcessState.WAIT_SEND:
                service_obj.process_state = ProcessState.FINISH
            elif service_obj.process_state == ProcessState.WAIT_SEND_ANSWER_RESERVE:
                service_obj.process_state = ProcessState.FINISH
                set_quiz_answer_finish(service_obj)
                remove_quiz_answer_schedule(service_id)
            service_obj.save()
            remove_service_schedule(service_id)

        else:
            result = False
    elif target == ScheduleTarget.QUIZ_ANSWER:
        if state == ScheduleState.ACTIVE:
            set_quiz_answer_active(service_obj)
            service_obj.save()
            resume_quiz_answer_schedule(service_id)

        elif state == ScheduleState.INACTIVE:
            set_quiz_answer_inactive(service_obj)
            service_obj.save()
            pause_quiz_answer_schedule(service_id)

        elif state == ScheduleState.FINISH:
            set_quiz_answer_finish(service_obj)
            if service_obj.process_state == ProcessState.WAIT_SEND_ANSWER_RESERVE:
                service_obj.process_state = ProcessState.WAIT_SEND
            elif service_obj.process_state == ProcessState.ANSWER_RESERVE:
                service_obj.process_state = ProcessState.WAIT_ANSWER

            service_obj.save()
            remove_quiz_answer_schedule(service_id)
        else:
            result = False

    return result


async def update_db_service_create(text_data_json, service_id):
    process_type = text_data_json['process_type']
    owner = text_data_json['owner']

    contents = make_db_contents_data(text_data_json)
    process_state = get_process_state(text_data_json)
    schedule_state = get_schedule_state(process_type)

    note = text_data_json['note']

    # sync to db
    service_obj = get_tv_service(owner).objects.create()
    if service_obj is None:
        print("No DB Object for " + owner)
        return
    service_obj.service_id = service_id
    service_obj.program_title = text_data_json['program_title']
    service_obj.channel_name = text_data_json['channel_name']
    service_obj.service_type = text_data_json['service_type']
    service_obj.detail_type = text_data_json['detail_type']
    service_obj.service_title = text_data_json['service_title']
    service_obj.process_type = process_type
    service_obj.process_info = json.dumps(text_data_json['process_info'])
    service_obj.contents = json.dumps(contents)
    service_obj.countdown = text_data_json['countdown']
    service_obj.note = note
    service_obj.process_state = process_state
    service_obj.schedule_state = schedule_state
    service_obj.publish_date = datetime.datetime.now()

    await database_sync_to_async(service_obj.save)()


async def update_quiz_answer(text_data_json, service_id):
    owner = text_data_json['owner']
    service_obj = get_tv_service(owner).objects.get(service_id=service_id)
    #service_obj.result = text_data_json['answer']
    set_quiz_answer_data(service_obj, text_data_json)
    answer_request_type = text_data_json['answer_request_type']
    process_state = service_obj.process_state
    if process_state == ProcessState.FINISH:
        return

    if service_obj.process_type == ProcessType.NOW:
        if process_state == ProcessState.WAIT_ANSWER:
            if answer_request_type == AnswerRequestType.SUBMIT:
                service_obj.process_state = ProcessState.FINISH
            elif answer_request_type == AnswerRequestType.RESERVE:
                service_obj.process_state = ProcessState.ANSWER_RESERVE
                set_quiz_answer_active(service_obj)
                create_quiz_answer_schedule(service_id, text_data_json)

        elif process_state == ProcessState.ANSWER_RESERVE:
            if answer_request_type == AnswerRequestType.SUBMIT:
                service_obj.process_state = ProcessState.FINISH
                set_quiz_answer_finish(service_obj)
                remove_quiz_answer_schedule(service_id)

            elif answer_request_type == AnswerRequestType.CANCEL:
                service_obj.process_state = ProcessState.WAIT_ANSWER
                set_quiz_answer_finish(service_obj)
                remove_quiz_answer_schedule(service_id)

    elif service_obj.process_type == ProcessType.RESERVE:
        if process_state == ProcessState.WAIT_SEND:
            if answer_request_type == AnswerRequestType.RESERVE:
                service_obj.process_state = ProcessState.WAIT_SEND_ANSWER_RESERVE
                set_quiz_answer_active(service_obj)
                create_quiz_answer_schedule(service_id, text_data_json)

        elif process_state == ProcessState.WAIT_SEND_ANSWER_RESERVE:
            if answer_request_type == AnswerRequestType.CANCEL:
                service_obj.process_state = ProcessState.WAIT_SEND
                set_quiz_answer_finish(service_obj)
                remove_quiz_answer_schedule(service_id)

        elif process_state == ProcessState.WAIT_ANSWER:
            if answer_request_type == AnswerRequestType.SUBMIT:
                service_obj.process_state = ProcessState.FINISH
                set_quiz_answer_finish(service_obj)
                remove_service_schedule(service_id)
                remove_quiz_answer_schedule(service_id)

            elif answer_request_type == AnswerRequestType.RESERVE:
                service_obj.process_state = ProcessState.ANSWER_RESERVE
                set_quiz_answer_active(service_obj)
                create_quiz_answer_schedule(service_id, text_data_json)

        elif process_state == ProcessState.ANSWER_RESERVE:
            if answer_request_type == AnswerRequestType.SUBMIT:
                service_obj.process_state = ProcessState.FINISH
                set_quiz_answer_finish(service_obj)
                remove_service_schedule(service_id)
                remove_quiz_answer_schedule(service_id)
            elif answer_request_type == AnswerRequestType.CANCEL:
                service_obj.process_state = ProcessState.WAIT_ANSWER
                set_quiz_answer_finish(service_obj)
                remove_quiz_answer_schedule(service_id)

    else:
        if process_state == ProcessState.WAIT_SEND:
            if answer_request_type == AnswerRequestType.RESERVE:
                service_obj.process_state = ProcessState.WAIT_SEND_ANSWER_RESERVE
                set_quiz_answer_active(service_obj)
                create_quiz_answer_schedule(service_id, text_data_json)

        elif process_state == ProcessState.WAIT_SEND_ANSWER_RESERVE:
            if answer_request_type == AnswerRequestType.CANCEL:
                service_obj.process_state = ProcessState.WAIT_SEND
                set_quiz_answer_finish(service_obj)
                remove_quiz_answer_schedule(service_id)

        elif process_state == ProcessState.WAIT_ANSWER:
            if answer_request_type == AnswerRequestType.SUBMIT:
                service_obj.process_state = ProcessState.WAIT_SEND
                set_quiz_answer_finish(service_obj)
                remove_quiz_answer_schedule(service_id)

            elif answer_request_type == AnswerRequestType.RESERVE:
                service_obj.process_state = ProcessState.ANSWER_RESERVE
                set_quiz_answer_active(service_obj)
                create_quiz_answer_schedule(service_id, text_data_json)

        elif process_state == ProcessState.ANSWER_RESERVE:
            if answer_request_type == AnswerRequestType.SUBMIT:
                service_obj.process_state = ProcessState.WAIT_SEND
                set_quiz_answer_finish(service_obj)
                remove_quiz_answer_schedule(service_id)

            elif answer_request_type == AnswerRequestType.CANCEL:
                service_obj.process_state = ProcessState.WAIT_ANSWER
                set_quiz_answer_finish(service_obj)
                remove_quiz_answer_schedule(service_id)

    await database_sync_to_async(service_obj.save)()


async def update_schedule_data(text_data_json, service_id):
    print_log("UPDATE_SCHEDULE_DATA", "start")
    owner = text_data_json['owner']
    service_obj = get_tv_service(owner).objects.get(service_id=service_id)
    process_state = service_obj.process_state
    if service_obj.process_type == ProcessType.REPEAT:
        print_log("UPDATE_SCHEDULE_DATA", "REPEAT")
        if "answer_request_type" in text_data_json:
            # process quiz answer
            print_log("UPDATE_SCHEDULE_DATA", "process quiz answer")
            if service_obj.service_type != ServiceType.QUIZ:
                return
            answer_request_type = text_data_json['answer_request_type']
            if process_state == ProcessState.ANSWER_RESERVE and answer_request_type == AnswerRequestType.SUBMIT:
                service_obj.process_state = ProcessState.WAIT_SEND
                set_quiz_answer_finish(service_obj)
                remove_quiz_answer_schedule(service_id)
        else:
            # process service
            print_log("UPDATE_SCHEDULE_DATA", "process service")
            if service_obj.service_type == ServiceType.QUIZ:
                contents_data = json.loads(service_obj.contents)
                answer_include = contents_data["answer_include"]
                if answer_include == 'exclude':
                    if process_state == ProcessState.WAIT_SEND:
                        service_obj.process_state = ProcessState.WAIT_ANSWER
                    elif process_state == ProcessState.WAIT_SEND_ANSWER_RESERVE:
                        service_obj.process_state = ProcessState.ANSWER_RESERVE
                else:
                    service_obj.process_state = ProcessState.WAIT_SEND
            else:
                service_obj.process_state = ProcessState.WAIT_SEND

    elif service_obj.process_type == ProcessType.RESERVE:
        print_log("UPDATE_SCHEDULE_DATA", "RESERVE")
        if "answer_request_type" in text_data_json:
            # process quiz answer
            print_log("UPDATE_SCHEDULE_DATA", "process quiz answer")
            if service_obj.service_type != ServiceType.QUIZ:
                return
            answer_request_type = text_data_json['answer_request_type']
            if answer_request_type == AnswerRequestType.SUBMIT:
                print_log("UPDATE_SCHEDULE_DATA", "AnswerRequestType.SUBMIT")
                if process_state == ProcessState.ANSWER_RESERVE:
                    service_obj.process_state = ProcessState.FINISH
                    print_log("UPDATE_SCHEDULE_DATA", "ProcessState.FINISH")
                    set_quiz_answer_finish(service_obj)
                    remove_quiz_answer_schedule(service_id)
                else:
                    print_log("UPDATE_SCHEDULE_DATA", "State Not Normal: " + str(process_state))
                    service_obj.process_state = ProcessState.FINISH
                    print_log("UPDATE_SCHEDULE_DATA", "ProcessState.FINISH")
                    set_quiz_answer_finish(service_obj)
                    remove_quiz_answer_schedule(service_id)
        else:
            # process service
            print_log("UPDATE_SCHEDULE_DATA", "process service")
            if service_obj.service_type == ServiceType.QUIZ:
                print_log("UPDATE_SCHEDULE_DATA", "QUIZ")
                contents_data = json.loads(service_obj.contents)
                answer_include = contents_data["answer_include"]
                if answer_include == 'exclude':
                    if process_state == ProcessState.WAIT_SEND:
                        service_obj.process_state = ProcessState.WAIT_ANSWER
                        print_log("UPDATE_SCHEDULE_DATA", "ProcessState.WAIT_ANSWER")
                    elif process_state == ProcessState.WAIT_SEND_ANSWER_RESERVE:
                        print_log("UPDATE_SCHEDULE_DATA", "ProcessState.ANSWER_RESERVE")
                        service_obj.process_state = ProcessState.ANSWER_RESERVE
                    service_obj.schedule_state = ScheduleState.FINISH
                    print_log("UPDATE_SCHEDULE_DATA", "ScheduleState.FINISH")
                else:

                    service_obj.process_state = ProcessState.FINISH
                    service_obj.schedule_state = ScheduleState.FINISH
                    print_log("UPDATE_SCHEDULE_DATA", "ProcessState.FINISH")
                    print_log("UPDATE_SCHEDULE_DATA", "ScheduleState.FINISH")
            elif service_obj.service_type == ServiceType.INFO:
                print_log("UPDATE_SCHEDULE_DATA", "INFO")
                #delete_contents_image(service_obj)
                service_obj.process_state = ProcessState.FINISH
                service_obj.schedule_state = ScheduleState.FINISH
                print_log("UPDATE_SCHEDULE_DATA", "ProcessState.FINISH")
                print_log("UPDATE_SCHEDULE_DATA", "ScheduleState.FINISH")
            else:
                print_log("UPDATE_SCHEDULE_DATA", "VOTE")
                service_obj.process_state = ProcessState.FINISH
                service_obj.schedule_state = ScheduleState.FINISH
                print_log("UPDATE_SCHEDULE_DATA", "ProcessState.FINISH")
                print_log("UPDATE_SCHEDULE_DATA", "ScheduleState.FINISH")
            remove_service_schedule(service_id)

    await database_sync_to_async(service_obj.save)()


'''async def update_db(text_data_json, service_id):
    service_type = text_data_json['service_type']
    request_type = text_data_json['request_type']
    owner = text_data_json['owner']

    if request_type == RequestType.QUIZ_ANSWER:
        service_obj = get_tv_service(owner).objects.get(service_id=service_id)
        service_obj.result = text_data_json['answer']
        if service_obj.process_type == ProcessType.REPEAT:
            service_obj.process_state = ProcessState.WAIT_SEND
        else:
            print("finish service: " + service_id)
            service_obj.process_state = ProcessState.FINISH
            if service_obj.process_type == ProcessType.RESERVE:
                print("remove")
                remove_service_schedule(service_id)

    elif request_type == RequestType.SCHEDULE:
        service_obj = get_tv_service(owner).objects.get(service_id=service_id)
        if service_obj.process_type == ProcessType.REPEAT:
            if service_obj.service_type == ServiceType.QUIZ:
                contents_data = json.loads(service_obj.contents)
                answer_include = contents_data["answer_include"]
                if answer_include == 'exclude':
                    service_obj.process_state = ProcessState.WAIT_ANSWER
                else:
                    service_obj.process_state = ProcessState.WAIT_SEND
            else:
                service_obj.process_state = ProcessState.WAIT_SEND
        elif service_obj.process_type == ProcessType.RESERVE:
            if service_obj.service_type == ServiceType.QUIZ:
                contents_data = json.loads(service_obj.contents)
                answer_include = contents_data["answer_include"]
                if answer_include == 'exclude':
                    service_obj.process_state = ProcessState.WAIT_ANSWER
                    service_obj.schedule_state = ScheduleState.FINISH
                else:
                    service_obj.process_state = ProcessState.FINISH
                    service_obj.schedule_state = ScheduleState.FINISH
                    remove_service_schedule(service_id)
            else:
                service_obj.process_state = ProcessState.FINISH
                service_obj.schedule_state = ScheduleState.FINISH
                remove_service_schedule(service_id)

    # service_obj.result = json.dumps(result_info)
    # print("DB SYNC : " + str(service_obj))
    await database_sync_to_async(service_obj.save)()'''


def make_db_contents_data(text_data_json):
    contents_data = {}
    service_type = text_data_json['service_type']
    detail_type = text_data_json['detail_type']
    process_type = text_data_json['process_type']
    if service_type == ServiceType.QUIZ:
        contents_data['question'] = text_data_json['question']
        answer_include = text_data_json['answer_include']
        contents_data['answer_include'] = answer_include
        if answer_include == "include":
            contents_data['answer'] = text_data_json['answer']

        if detail_type == DetailType.MULTI:
            contents_data['examples'] = text_data_json['examples']
            contents_data['select_count'] = text_data_json['select_count']
        else:
            single_type = text_data_json['single_quiz_type']
            contents_data['single_quiz_type'] = single_type
            if single_type == "string-length":
                contents_data["answer_length"] = text_data_json['answer_length']

        return contents_data

    elif service_type == ServiceType.INFO:
        contents_data['describe'] = text_data_json['describe']
        if process_type == ProcessType.RESERVE or process_type == ProcessType.REPEAT:
            contents_data['image'] = text_data_json['info-image']
        contents_data['link'] = text_data_json['info-link']
        return contents_data

    elif service_type == ServiceType.VOTE:
        question = text_data_json['question']
        contents_data['question'] = question
        if detail_type == DetailType.MULTI:
            contents_data['examples'] = text_data_json['examples']
        return contents_data
    else:
        return None



def get_answer_data(service_id, event):
    send_data = {
        'service_id': service_id,
        'service_type': event['request_type'],
        'answer': event['answer']
    }
    return send_data


def get_send_data(service_id, event):
    service_type = event['service_type']
    detail_type = event['detail_type']

    if service_type == ServiceType.QUIZ:
        answer_include = event['answer_include']

        send_data = {
            'service_id': service_id,
            'service_type': service_type,
            'detail_type': detail_type,
            'question': event['question'],
            'countdown': event['countdown'],
        }

        if detail_type == DetailType.MULTI:
            send_data['examples'] = event['examples']
            send_data['select_count'] = event['select_count']
        else:
            single_type = event['single_quiz_type']
            if single_type == "string-length":
                send_data['answer_length'] = event['answer_length']

        if answer_include == 'include':
            send_data['answer'] = event['answer']

        return send_data

    elif service_type == ServiceType.INFO:

        send_data = {
            'service_type': service_type,
            'service_id': service_id,
            'service_title': event['service_title'],
            'description': event['describe'],
            'link': event['info-link'],
            'image': event['info-image'],
            'countdown': event['countdown'],

        }
        return send_data

    elif service_type == ServiceType.VOTE:
        send_data = {
            'service_id': service_id,
            'service_type': service_type,
            'question': event['question'],
            'countdown': event['countdown'],
        }

        if detail_type == 'multi':
            send_data["examples"] = event['examples']

        return send_data

    else:
        send_data = None
        return send_data


def get_service_id(category, json_data):
    if 'service_id' in json_data:
        service_id = json_data['service_id']
    else:
        service_id = json_data['channel_name'].replace(" ", "") + "-" + get_random_string(16)
    '''    
    if category == Category.TV:
        service_type = json_data['service_type']
        if service_type == ServiceType.QUIZ_ANSWER or service_type == ServiceType.SCHEDULE:
            service_id = json_data['service_id']
        else:
            service_id = json_data['channel_name'].replace(" ", "") + "-" + get_random_string(16)
    else:
        service_id = json_data['service_id']
    '''
    return service_id


def get_process_state(json_data):
    process_type = json_data['process_type']
    service_type = json_data['service_type']

    if process_type == ProcessType.NOW:
        if service_type == ServiceType.QUIZ:
            answer_include = json_data['answer_include']
            if answer_include == 'exclude':
                return ProcessState.WAIT_ANSWER
            else:
                return ProcessState.FINISH
        else:
            return ProcessState.FINISH

    else:
        return ProcessState.WAIT_SEND


def get_schedule_state(process_type):
    if process_type == ProcessType.NOW:
        return ScheduleState.INACTIVE
    else:
        return ScheduleState.ACTIVE


def get_schedule_data(service_id, event):
    owner = event["owner"]
    service_obj = get_tv_service(owner).objects.get(service_id=service_id)
    service_type = service_obj.service_type
    detail_type = service_obj.detail_type
    schedule_target = event["schedule_target"]
    if schedule_target == ScheduleTarget.SERVICE:
        send_data = {
            'service_id': service_id,
            'service_type': service_type,
            'countdown': service_obj.countdown,
        }

        if service_type == ServiceType.QUIZ:
            contents_data = json.loads(service_obj.contents)
            send_data['detail_type'] = detail_type
            send_data['question'] = contents_data["question"]

            if detail_type == DetailType.MULTI:
                send_data["examples"] = contents_data["examples"]
                send_data['select_count'] = contents_data['select_count']
            else:
                single_type = contents_data['single_quiz_type']
                if single_type == "string-length":
                    send_data['answer_length'] = contents_data['answer_length']

            # answer_include = service_obj.answer_include
            answer_include = contents_data["answer_include"]
            if answer_include == 'include':
                # answer = service_obj.answer
                send_data["answer"] = contents_data["answer"]

            return send_data

        elif service_type == ServiceType.INFO:
            contents_data = json.loads(service_obj.contents)
            send_data["service_title"] = service_obj.service_title
            send_data["description"] = contents_data["describe"]
            send_data["link"] = contents_data["link"]
            if "image" in contents_data:
                send_data["image"] = contents_data["image"]

            return send_data

        elif service_type == ServiceType.VOTE:
            contents_data = json.loads(service_obj.contents)
            send_data["question"] = contents_data["question"]

            if detail_type == DetailType.MULTI:
                send_data["examples"] = contents_data["examples"]

            return send_data
        else:
            send_data = None
            return send_data

    elif schedule_target == ScheduleTarget.QUIZ_ANSWER:
        contents_data = json.loads(service_obj.contents)

        send_data = {
            'service_id': service_id,
            'service_type': RequestType.QUIZ_ANSWER,
            'answer': contents_data["answer"]
        }
        return send_data


def get_schedule_db_update(result, data):
    send_data = {
        'service_id': data["service_id"],
        'service_type': data[""],
        'result': result
    }
    return send_data


def quiz_answer_reserve():
    print("answer_reserve")


def quiz_answer_process():
    print("quiz_answer_process")


def quiz_answer_cancel():
    print("quiz_answer_cancel")


def create_service_schedule(service_id, text_data_json):
    owner = text_data_json['owner']
    SERVICE_SCHEDULER.set_schedule(text_data_json['process_info'], service_id, owner, text_data_json['channel_name'])


def remove_service_schedule(service_id):
    SERVICE_SCHEDULER.remove_schedule(service_id)


def pause_service_schedule(service_id):
    SERVICE_SCHEDULER.pause_schedule(service_id)


def resume_service_schedule(service_id):
    SERVICE_SCHEDULER.resume_schedule(service_id)


def create_quiz_answer_schedule(service_id, text_data_json):
    owner = text_data_json['owner']
    SERVICE_SCHEDULER.set_quiz_answer_schedule(text_data_json['quiz_answer_process_info'], service_id, owner, text_data_json['channel_name'])


def pause_quiz_answer_schedule(service_id):
    job_id = service_id + QUIZ_ANSWER_POSTFIX
    SERVICE_SCHEDULER.pause_schedule(job_id)


def remove_quiz_answer_schedule(service_id):
    job_id = service_id + QUIZ_ANSWER_POSTFIX
    SERVICE_SCHEDULER.remove_schedule(job_id)


def resume_quiz_answer_schedule(service_id):
    job_id = service_id + QUIZ_ANSWER_POSTFIX
    SERVICE_SCHEDULER.resume_schedule(job_id)


def set_quiz_answer_active(service_obj):
    contents_data = json.loads(service_obj.contents)
    contents_data["answer_schedule_state"] = ScheduleState.ACTIVE
    service_obj.contents = json.dumps(contents_data)


def set_quiz_answer_inactive(service_obj):
    contents_data = json.loads(service_obj.contents)
    contents_data["answer_schedule_state"] = ScheduleState.INACTIVE
    service_obj.contents = json.dumps(contents_data)


def set_quiz_answer_finish(service_obj):
    contents_data = json.loads(service_obj.contents)
    contents_data["answer_schedule_state"] = ScheduleState.FINISH
    service_obj.contents = json.dumps(contents_data)


def set_quiz_answer_data(service_obj, data):
    contents_data = json.loads(service_obj.contents)
    contents_data["answer"] = data['answer']
    contents_data["quiz_answer_process_info"] = data["quiz_answer_process_info"]
    service_obj.contents = json.dumps(contents_data)


def delete_contents_image(service_id, owner):
    service_obj = get_tv_service(owner).objects.get(service_id=service_id)
    contents_data = json.loads(service_obj.contents)
    if "image" in contents_data:
        print("delete_contents_image")
        del contents_data["image"]
    service_obj.contents = json.dumps(contents_data)


def print_log(tag, string):
    if PRINT_DEBUG_LOG:
        print(tag + " : " + string)
