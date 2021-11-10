from .broadcast import get_tv_service, tv_channels
from .chat_header import ProcessState, ScheduleTarget, AnswerRequestType, RequestType, ScheduleState, ProcessType, \
    Category, ServiceType, QUIZ_ANSWER_POSTFIX
import websocket
import json
from datetime import datetime
from django.db.models import Q

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.base import JobLookupError
from django.conf import settings
import time

weekday_table = {'월': 'mon', '화': 'tue', '수': 'wed', '목': 'thu',
                 '금': 'fri', '토': 'sat', '일': 'sun'}


def get_server_domain():
    if settings.DEBUG:
        return settings.TEST_DOMAIN
    else:
        return settings.MAIN_DOMAIN


class Scheduler(object):

    # 클래스 생성시 스케쥴러 데몬을 생성합니다.
    def __init__(self):
        self.sched = BackgroundScheduler()
        self.sched.start()

    # 클래스가 종료될때, 모든 job들을 종료시켜줍니다.
    def __del__(self):
        self.shutdown()

    # 모든 job들을 종료시켜주는 함수입니다.
    def shutdown(self):
        print("start shutdown all schedule: ")
        try:
            self.sched.shutdown()
        except Exception as err:
            print("Exception shutdown sched: %s" % err)
            return

    def resume_schedule(self, service_id):
        print("start resume schedule: " + service_id)
        try:
            self.sched.resume_job(service_id)
        except JobLookupError as err:
            print("fail to resume scheduler: %s" % err)
            return

    def pause_schedule(self, service_id):
        print("start pause schedule: " + service_id)
        try:
            self.sched.pause_job(service_id)
        except JobLookupError as err:
            print("fail to pause scheduler: %s" % err)
            return

    # 특정 job을 종료시켜줍니다.
    def remove_schedule(self, service_id):
        print("start remove schedule: " + service_id)
        try:
            self.sched.remove_job(service_id)
        except JobLookupError as err:
            print("fail to stop scheduler: %s" % err)
            return

    def load_all_schedules(self):
        print("start load all schedules")
        tv_channels.append("ADMIN")
        for owner in tv_channels:
            print("load channel: " + owner)
            repeat_services = get_tv_service(owner).objects.filter(process_type=ProcessType.REPEAT).exclude(
                schedule_state=ScheduleState.FINISH)
            reserve_services = get_tv_service(owner).objects.filter(process_type=ProcessType.RESERVE).exclude(
                schedule_state=ScheduleState.FINISH)

            pending_quiz_answer_reserve = get_tv_service(owner).objects.filter(
                Q(process_state=ProcessState.WAIT_SEND_ANSWER_RESERVE) | Q(
                    process_state=ProcessState.ANSWER_RESERVE))

            for service_obj in repeat_services:
                print("repeat_services, service_title: " + service_obj.service_title)
                if service_obj.process_state != ProcessState.FINISH:

                    self.set_schedule(json.loads(service_obj.process_info), service_obj.service_id, owner,
                                      service_obj.channel_name)
                    if service_obj.schedule_state == ScheduleState.INACTIVE:
                        print("INACTIVE repeat_services, service_id: " + service_obj.service_id)
                        self.sched.pause_job(service_obj.service_id)
                    else:
                        print("ACTIVE repeat_services, service_id: " + service_obj.service_id)
                else:
                    print("FINISH repeat_services, service_id: " + service_obj.service_id)
                    service_obj.schedule_state = ScheduleState.FINISH
                    service_obj.save()

            for service_obj in reserve_services:
                print("reserve_services, service_title: " + service_obj.service_title)
                if service_obj.process_state == ProcessState.WAIT_SEND or service_obj.process_state == ProcessState.WAIT_SEND_ANSWER_RESERVE:
                    process_info = json.loads(service_obj.process_info)
                    current_date = datetime.now()
                    process_date = process_info["date"]
                    process_time = process_info["time"]

                    process_datetime = datetime.strptime(process_date + " " + process_time, "%Y-%m-%d %H:%M")
                    if process_datetime < current_date:
                        print("$$ process date time: " + process_date + " " + process_time)
                        print("$$ process date time already passed!!!! set the service FINISH")
                        service_obj.process_state = ProcessState.FINISH
                        service_obj.schedule_state = ScheduleState.FINISH
                        service_obj.save()
                    else:
                        self.set_schedule(process_info, service_obj.service_id, owner, service_obj.channel_name)
                        if service_obj.schedule_state == ScheduleState.INACTIVE:
                            print("INACTIVE reserve_services, service_id: " + service_obj.service_id)
                            self.sched.pause_job(service_obj.service_id)
                        else:
                            print("ACTIVE reserve_services, service_id: " + service_obj.service_id)
                else:
                    print("FINISH reserve_services, service_id: " + service_obj.service_id)
                    service_obj.schedule_state = ScheduleState.FINISH
                    service_obj.save()


            for service_obj in pending_quiz_answer_reserve:
                print("reserve quiz answer, service_title: " + service_obj.service_title)
                contents_data = json.loads(service_obj.contents)
                current_date = datetime.now()
                if "quiz_answer_process_info" in contents_data:
                    quiz_answer_process_info = contents_data["quiz_answer_process_info"]
                    process_date = quiz_answer_process_info["date"]
                    process_time = quiz_answer_process_info["time"]
                    process_datetime = datetime.strptime(process_date + " " + process_time, "%Y-%m-%d %H:%M")
                    if process_datetime < current_date:
                        print("$$ process date time: " + process_date + " " + process_time)
                        print("$$ process date time already passed!!!! set the service FINISH")
                        #service_obj.process_state = ProcessState.FINISH
                        #service_obj.schedule_state = ScheduleState.FINISH
                        contents_data["answer_schedule_state"] = ScheduleState.FINISH
                        service_obj.contents = json.dumps(contents_data)
                        service_obj.save()
                    else:
                        self.set_quiz_answer_schedule(quiz_answer_process_info, service_obj.service_id, owner, service_obj.channel_name)
                        if "answer_schedule_state" in contents_data and contents_data["answer_schedule_state"] == ScheduleState.INACTIVE:
                            job_id = service_obj.service_id + QUIZ_ANSWER_POSTFIX
                            self.sched.pause_job(job_id)
                            print("INACTIVE reserve quiz answer, service_id: " + service_obj.service_id)
                        else:
                            print("ACTIVE reserve quiz answer, service_id: " + service_obj.service_id)
                else:
                    contents_data["answer_schedule_state"] = ScheduleState.FINISH
                    service_obj.contents = json.dumps(contents_data)
                    service_obj.save()

    def send_service(self, process_type, service_id, owner, room_name):
        print('@@ send service, id:' + service_id + ', channel: ' + room_name + ' type: ' + str(process_type))
        domain = get_server_domain()
        ws = websocket.create_connection("wss://" + domain + "/ws/chat/" + room_name + "/",
                                         header={"everydaytalk": "scheduler"})  # FIXME

        send_data = json.dumps({
            'category': Category.TV,
            'owner': owner,
            'channel_name': room_name,
            'request_type': RequestType.SCHEDULE,
            'service_id': service_id,
            'schedule_target': ScheduleTarget.SERVICE,
            'process_type': process_type
        })
        ws.send(send_data)
        ws.close()
        for job in self.sched.get_jobs():
            print("@@ remain jobs: " + str(job.id))

    def send_quiz_answer(self, process_type, service_id, owner, room_name):
        print('@@ send service, id:' + service_id + ', channel: ' + room_name + ' type: ' + str(process_type))
        domain = get_server_domain()
        ws = websocket.create_connection("wss://" + domain + "/ws/chat/" + room_name + "/",
                                         header={"everydaytalk": "scheduler"})  # FIXME

        send_data = json.dumps({
            'category': Category.TV,
            'owner': owner,
            'channel_name': room_name,
            'request_type': RequestType.SCHEDULE,
            'service_id': service_id,
            'process_type': process_type,
            'schedule_target': ScheduleTarget.QUIZ_ANSWER,
            'answer_request_type': AnswerRequestType.SUBMIT
        })
        ws.send(send_data)
        ws.close()
        for job in self.sched.get_jobs():
            print("@@ remain jobs: " + str(job.id))

    def set_schedule(self, process_info, service_id, owner, room_name):
        process_type = process_info["type"]
        if process_type == ProcessType.RESERVE:
            current_date = datetime.now()
            process_date = process_info["date"]
            process_time = process_info["time"]

            process_datetime = datetime.strptime(process_date + " " + process_time, "%Y-%m-%d %H:%M")
            if process_datetime < current_date:
                print("$$ process date time: " + process_date + " " + process_time)
                print("$$ process date time already passed!!!! set the service FINISH")
                return

            year, month, day = get_date_for_schedule(process_date)
            hour, minute = get_time_for_schedule(process_time)
            print('add reserve schedule, id:' + service_id + " " + year + month + day + "  " + hour + minute)

            self.sched.add_job(self.send_service, 'cron',
                               year=year, month=month, day=day, hour=hour, minute=minute,
                               id=service_id, args=(process_type, service_id, owner, room_name))

        elif process_type == ProcessType.REPEAT:
            process_weekdays = process_info["weekdays"]
            process_time = process_info["time"]
            weekdays = get_weekdays_for_schedule(process_weekdays)
            hour, minute = get_time_for_schedule(process_time)
            print('add repeat schedule, id:' + service_id + " " + weekdays + "  " + hour + minute)
            self.sched.add_job(self.send_service, 'cron', day_of_week=weekdays,
                               hour=hour, minute=minute,
                               id=service_id, args=(process_type, service_id, owner, room_name))

    def set_quiz_answer_schedule(self, process_info, service_id, owner, room_name):
        job_id = service_id + QUIZ_ANSWER_POSTFIX
        process_type = process_info["type"]
        if process_type == ProcessType.RESERVE:
            current_date = datetime.now()
            process_date = process_info["date"]
            process_time = process_info["time"]

            process_datetime = datetime.strptime(process_date + " " + process_time, "%Y-%m-%d %H:%M")
            if process_datetime < current_date:
                print("$$ process date time: " + process_date + " " + process_time)
                print("$$ process date time already passed!!!! set the service FINISH")
                return

            year, month, day = get_date_for_schedule(process_date)
            hour, minute = get_time_for_schedule(process_time)
            print('add quiz answer schedule, id:' + service_id + " " + year + month + day + "  " + hour + minute)

            self.sched.add_job(self.send_quiz_answer, 'cron',
                               year=year, month=month, day=day, hour=hour, minute=minute,
                               id=job_id, args=(process_type, service_id, owner, room_name))

    def activate_schedule(self, service_id, room_name):
        service_obj = get_tv_service(room_name).objects.get(service_id=service_id)
        if service_obj.schedule_state == ScheduleState.INACTIVE:
            print('activate schedule, id:' + service_id)
            service_obj.schedule_state = ScheduleState.ACTIVE
            self.sched.resume_job(service_id)
            service_obj.save()

    def deactivate_schedule(self, service_id, room_name):
        service_obj = get_tv_service(room_name).objects.get(service_id=service_id)
        if service_obj.schedule_state == ScheduleState.ACTIVE:
            print('deactivate schedule, id:' + service_id)
            service_obj.schedule_state = ScheduleState.INACTIVE
            self.sched.pause_job(service_id)
            service_obj.save()


def get_weekdays_for_schedule(process_weekdays):
    value = ""
    count = 0
    for weekday in process_weekdays:
        if count == 0:
            value = weekday_table[weekday]
        else:
            value += "," + weekday_table[weekday]
        count += 1

    print("weekday value: " + value)
    return value


def get_time_for_schedule(process_time):
    hour = process_time.split(":")[0]
    minute = process_time.split(":")[1]
    return hour, minute


def get_date_for_schedule(process_date):
    year = process_date.split("-")[0]
    month = process_date.split("-")[1]
    day = process_date.split("-")[2]

    return year, month, day
