from asgiref.sync import async_to_sync
#from channels.generic.websocket import WebsocketConsumer
from channels.generic.websocket import AsyncWebsocketConsumer
import json
#from .models import TvService
from channels.db import database_sync_to_async
from .broadcast import get_tv_service, BroadCaster
from .urls import SERVICE_SCHEDULER
from django.utils.crypto import get_random_string
from .chat_header import ServiceType, DetailType, Category, ProcessType, ProcessState, ScheduleState
import unicodedata
import time


class ChatConsumer(AsyncWebsocketConsumer):
    INTERACTION_SERVICE = "send_interaction_service"
    QUIZ_ANSWER = "send_quiz_answer"
    SCHEDULE_DATA = "send_schedule_data"
    SCHEDULE_DB_UPDATE = "send_schedule_db_update"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        print("###### Init Chat Consumer #######")

    async def connect(self):
        print("connect")
        self.room_name = self.scope['url_route']['kwargs']['room_name'] # ??
        self.room_group_name = 'chat_%s' % self.room_name

        # Join room group
        #async_to_sync(self.channel_layer.group_add)(
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        #async_to_sync(self.channel_layer.group_discard)(
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        print("called receive func")
        text_data_json = json.loads(text_data)

        category = text_data_json['category']
        service_type = text_data_json['service_type']

        send_type = self.INTERACTION_SERVICE
        if service_type == ServiceType.QUIZ_ANSWER:
            send_type = self.QUIZ_ANSWER
        elif service_type == ServiceType.SCHEDULE:
            send_type = self.SCHEDULE_DATA
        elif service_type == ServiceType.UPDATE_SCHEDULE:
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
        process_type = text_data_json['process_type']
        service_id = get_service_id(category, text_data_json)
        if process_type == ProcessType.NOW or send_type == self.QUIZ_ANSWER or send_type == self.SCHEDULE_DATA:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': send_type,
                    'service_id': service_id,
                    'data': text_data_json,
                }
            )
        else:
            # FIXME: set schedule data for REPEAT and RESERVE
            create_service_schedule(service_id, text_data_json)

        # sync to db
        if category == Category.TV:
            await self.update_db(text_data_json, service_id)

    async def update_db(self, text_data_json, service_id):
        service_type = text_data_json['service_type']
        channel_name = text_data_json['channel_name']
        if service_type == ServiceType.QUIZ_ANSWER:
            service_obj = get_tv_service(channel_name).objects.get(channel_name=channel_name, service_id=service_id)
            service_obj.result = text_data_json['answer']
            if service_obj.process_type == ProcessType.REPEAT:
                service_obj.process_state = ProcessState.WAIT_SEND
            else:
                service_obj.process_state = ProcessState.FINISH
                if service_obj.process_type == ProcessType.RESERVE:
                    print("remove")
                    remove_service_schedule(service_id)

        elif service_type == ServiceType.SCHEDULE:
            service_obj = get_tv_service(channel_name).objects.get(channel_name=channel_name, service_id=service_id)
            if service_obj.process_type == ProcessType.REPEAT:
                if service_obj.service_type == ServiceType.QUIZ:
                    if service_obj.answer_include == 'exclude':
                        service_obj.process_state = ProcessState.WAIT_ANSWER
                    else:
                        service_obj.process_state = ProcessState.WAIT_SEND
                else:
                    service_obj.process_state = ProcessState.WAIT_SEND
            elif service_obj.process_type == ProcessType.RESERVE:
                if service_obj.service_type == ServiceType.QUIZ:
                    if service_obj.answer_include == 'exclude':
                        service_obj.process_state = ProcessState.WAIT_ANSWER
                    else:
                        service_obj.process_state = ProcessState.FINISH
                        service_obj.schedule_state = ScheduleState.FINISH
                        remove_service_schedule(service_id)
                else:
                    service_obj.process_state = ProcessState.FINISH
                    service_obj.schedule_state = ScheduleState.FINISH
                    remove_service_schedule(service_id)
        else:
            program_title = text_data_json['program_title']
            detail_type = text_data_json['detail_type']
            service_title = text_data_json['service_title']
            process_type = text_data_json['process_type']
            process_info = text_data_json['process_info']
            countdown = text_data_json['countdown']

            contents = self.make_db_contents_data(text_data_json)

            process_state = get_process_state(text_data_json)
            schedule_state = get_schedule_state(process_type)

            answer_include = ""
            answer = ""
            if service_type == ServiceType.QUIZ:
                answer_include = text_data_json['service_text3']
                if answer_include == 'include':
                    answer = text_data_json['service_text4']

            note = text_data_json['note']

            # sync to db
            #service_obj = TvService.objects.create()
            service_obj = get_tv_service(channel_name).objects.create()
            if service_obj is None:
                print("No DB Object for " + channel_name)
                return
            service_obj.service_id = service_id
            service_obj.program_title = program_title
            service_obj.channel_name = channel_name
            service_obj.service_type = service_type
            service_obj.detail_type = detail_type
            service_obj.service_title = service_title
            service_obj.process_type = process_type
            service_obj.process_info = json.dumps(process_info)
            service_obj.answer_include = answer_include
            service_obj.contents = json.dumps(contents)
            service_obj.countdown = countdown
            service_obj.note = note
            service_obj.answer = answer
            service_obj.process_state = process_state
            service_obj.schedule_state = schedule_state

        #service_obj.result = json.dumps(result_info)
        print("DB SYNC : " + str(service_obj))
        await database_sync_to_async(service_obj.save)()

    def update_schedule_db(self, text_data_json):
        service_id = text_data_json['service_id']
        channel_name = text_data_json['channel_name']
        state = text_data_json['state']

        service_obj = get_tv_service(channel_name).objects.get(channel_name=channel_name, service_id=service_id)

        if state == ScheduleState.ACTIVE:
            service_obj.schedule_state = state
            service_obj.save()
            resume_service_schedule(service_id)
        elif state == ScheduleState.INACTIVE:
            service_obj.schedule_state = state
            service_obj.save()
            pause_service_schedule(service_id)

        elif state == ScheduleState.FINISH:
            print("FINISH service: " + service_obj.service_title)
            service_obj.schedule_state = ScheduleState.FINISH
            if service_obj.process_state != ProcessState.WAIT_ANSWER:
                service_obj.process_state = ProcessState.FINISH
            service_obj.save()
            remove_service_schedule(service_id)
        else:
            return False
        return True


    # Receive message from room group
    async def send_interaction_service(self, event):
        print("service " + event['type'])
        send_data = get_send_data(event['service_id'], event['data'])
        print("send_data: " + str(send_data))
        await self.send(text_data=json.dumps(send_data))

    async def send_quiz_answer(self, event):
        print("service " + event['type'])
        answer_data = get_answer_data(event['service_id'], event['data'])
        print("answer_data: " + str(answer_data))
        await self.send(text_data=json.dumps(answer_data))

    async def send_schedule_data(self, event):
        print("service " + event['type'])
        schedule_data = get_schedule_data(event['service_id'], event['data'])
        print("$$$$$$$$$ schedule_data: " + str(schedule_data))
        await self.send(text_data=json.dumps(schedule_data))

    async def send_schedule_db_update(self, event):
        print("service " + event['type'])
        schedule_data = get_schedule_db_update(event['result'], event['data'])
        print("$$$$$$$$$ schedule_db_update_data: " + str(schedule_data))
        await self.send(text_data=json.dumps(schedule_data))

    def make_db_contents_data(self, text_data_json):
        contents_data = {}
        service_type = text_data_json['service_type']
        detail_type = text_data_json['detail_type']
        if service_type == ServiceType.QUIZ:
            question = text_data_json['service_text1']
            contents_data['question'] = question
            if detail_type == DetailType.MULTI:
                examples = text_data_json['service_text2']
                contents_data['examples'] = examples
            return contents_data
        elif service_type == ServiceType.INFO:
            describe = text_data_json['service_text1']
            contents_data['describe'] = describe
            contents_data['image'] = text_data_json['service_text2']
            contents_data['link'] = text_data_json['service_text3']
            return contents_data
        elif service_type == ServiceType.VOTE:
            question = text_data_json['service_text1']
            contents_data['question'] = question
            if detail_type == DetailType.MULTI:
                examples = text_data_json['service_text2']
                contents_data['examples'] = examples
            return contents_data
        else:
            return None

    def make_db_result_data(self, text_data_json):
        service_type = text_data_json['service_type']
        if service_type == ServiceType.QUIZ:
            answer = text_data_json['service_text4']
            return {'answer': answer}
        else:
            return None


def get_answer_data(service_id, event):
    send_data = {
        'service_id': service_id,
        'service_type': event['service_type'],
        'answer': event['answer']
    }
    return send_data


def get_send_data(service_id, event):
    category = event['category']
    service_type = event['service_type']
    detail_type = event['detail_type']

    if service_type == ServiceType.QUIZ:
        question = event['service_text1']
        answer_include = event['service_text3']
        countdown = event['countdown']

        examples = ""
        if detail_type == DetailType.MULTI:
            examples = event['service_text2']

        answer = ""
        if answer_include == 'include':
            answer = event['service_text4']

        send_data = {
            'service_id': service_id,
            'service_type': service_type,
            'question': question,
            'examples': examples,
            'countdown': countdown,
            'answer': answer
        }
        return send_data

    elif service_type == ServiceType.INFO:
        service_title = event['service_title']
        description = event['service_text1']
        image = event['service_text2']
        link = event['service_text3']

        send_data = {
            'service_type': service_type,
            'service_id': service_id,
            'service_title': service_title,
            'description': description,
            'link': link,
            'image': image

        }
        return send_data
    elif service_type == ServiceType.VOTE:
        question = event['service_text1']
        examples = ""
        if detail_type == 'multi':
            examples = event['service_text2']

        send_data = {
            'service_id': service_id,
            'service_type': service_type,
            'question': question,
            'examples': examples
        }
        return send_data
    else:
        send_data = None
        return send_data


def get_service_id(category, json_data):
    if category == Category.TV:
        service_type = json_data['service_type']
        if service_type == ServiceType.QUIZ_ANSWER or service_type == ServiceType.SCHEDULE:
            service_id = json_data['service_id']
        else:
            service_id = json_data['channel_name'].replace(" ", "") + "-" + get_random_string(16)
    else:
        service_id = json_data['service_id']

    return service_id


def get_process_state(json_data):
    process_type = json_data['process_type']
    service_type = json_data['service_type']

    if process_type == ProcessType.NOW:
        if service_type == ServiceType.QUIZ:
            result_info = json_data['service_text3']
            if result_info == 'exclude':
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
    channel_name = event["channel_name"]
    service_obj = get_tv_service(channel_name).objects.get(channel_name=channel_name, service_id=service_id)
    service_type = service_obj.service_type
    detail_type = service_obj.detail_type

    if service_type == ServiceType.QUIZ:
        contents_data = json.loads(service_obj.contents)
        question = contents_data["question"]
        examples = ""
        if detail_type == DetailType.MULTI:
            examples = contents_data["examples"]

        answer_include = service_obj.answer_include
        countdown = service_obj.countdown

        answer = ""
        if answer_include == 'include':
            answer = service_obj.answer

        send_data = {
            'service_id': service_id,
            'service_type': service_type,
            'question': question,
            'examples': examples,
            'countdown': countdown,
            'answer': answer
        }
        return send_data

    elif service_type == ServiceType.INFO:
        service_title = service_obj.service_title
        contents_data = json.loads(service_obj.contents)
        description = contents_data['describe']
        image = contents_data['image']
        link = contents_data['link']

        send_data = {
            'service_type': service_type,
            'service_id': service_id,
            'service_title': service_title,
            'description': description,
            'link': link,
            'image': image

        }
        return send_data
    elif service_type == ServiceType.VOTE:
        contents_data = json.loads(service_obj.contents)
        question = contents_data["question"]
        examples = ""
        if detail_type == DetailType.MULTI:
            examples = contents_data["examples"]

        send_data = {
            'service_id': service_id,
            'service_type': service_type,
            'question': question,
            'examples': examples
        }
        return send_data
    else:
        send_data = None
        return send_data


def get_schedule_db_update(result, data):
    send_data = {
        'service_id': data["service_id"],
        'service_type': data["service_type"],
        'result': result
    }
    return send_data


def create_service_schedule(service_id, text_data_json):
    SERVICE_SCHEDULER.set_schedule(text_data_json['process_info'], service_id, text_data_json['channel_name'])


def remove_service_schedule(service_id):
    SERVICE_SCHEDULER.remove_schedule(service_id)


def pause_service_schedule(service_id):
    SERVICE_SCHEDULER.pause_schedule(service_id)


def resume_service_schedule(service_id):
    SERVICE_SCHEDULER.resume_schedule(service_id)

