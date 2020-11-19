from .broadcast import get_tv_service, tv_channels
from .chat_header import ProcessState, ScheduleState, ProcessType, Category, ServiceType
import websocket
import json
from datetime import datetime

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.base import JobLookupError
import time

weekday_table = {'월': 'mon', '화': 'tue', '수': 'wed', '목': 'thu',
                 '금': 'fri', '토': 'sat', '일': 'sun'}

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
        self.sched.shutdown()

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
        for channel in tv_channels:
            print("load channel: " + channel)
            repeat_services = get_tv_service(channel).objects.filter(channel_name=channel, process_type=ProcessType.REPEAT).exclude(schedule_state=ScheduleState.FINISH)
            reserve_services = get_tv_service(channel).objects.filter(channel_name=channel, process_type=ProcessType.RESERVE).exclude(schedule_state=ScheduleState.FINISH)
            for service_obj in repeat_services:
                print("repeat_services, service_title: " + service_obj.service_title)
                if service_obj.process_state != ProcessState.FINISH:

                    self.set_schedule(json.loads(service_obj.process_info), service_obj.service_id, service_obj.channel_name)
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
                if service_obj.process_state == ProcessState.WAIT_SEND:
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
                        self.set_schedule(json.loads(process_info), service_obj.service_id, service_obj.channel_name)
                        if service_obj.schedule_state == ScheduleState.INACTIVE:
                            print("INACTIVE reserve_services, service_id: " + service_obj.service_id)
                            self.sched.pause_job(service_obj.service_id)
                        else:
                            print("ACTIVE reserve_services, service_id: " + service_obj.service_id)
                else:
                    print("FINISH reserve_services, service_id: " + service_obj.service_id)
                    service_obj.schedule_state = ScheduleState.FINISH
                    service_obj.save()

    def send_service(self, process_type, service_id, room_name):
        print('@@ send service, id:' + service_id + ', channel: ' + room_name + ' type: ' + str(process_type))
        ws = websocket.create_connection("ws://localhost:8000/ws/chat/" + room_name + "/") #FIXME
        send_data = json.dumps({
            'category': Category.TV,
            'channel_name': room_name,
            'service_type': ServiceType.SCHEDULE,
            'service_id': service_id,
            'process_type': process_type
        })
        ws.send(send_data)
        ws.close()
        for job in self.sched.get_jobs():
            print("@@ remain jobs: " + str(job.id))

    def set_schedule(self, process_info, service_id, room_name):
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
                               id=service_id, args=(process_type, service_id, room_name))

        elif process_type == ProcessType.REPEAT:
            process_weekdays = process_info["weekdays"]
            process_time = process_info["time"]
            weekdays = get_weekdays_for_schedule(process_weekdays)
            hour, minute = get_time_for_schedule(process_time)
            print('add repeat schedule, id:' + service_id + " " + weekdays + "  " + hour + minute)
            self.sched.add_job(self.send_service, 'cron', day_of_week=weekdays,
                               hour=hour, minute=minute,
                               id=service_id, args=(process_type, service_id, room_name))

    def activate_schedule(self, service_id, room_name):
        service_obj = get_tv_service(room_name).objects.get(channel_name=room_name, service_id=service_id)
        if service_obj.schedule_state == ScheduleState.INACTIVE:
            print('activate schedule, id:' + service_id)
            service_obj.schedule_state = ScheduleState.ACTIVE
            self.sched.resume_job(service_id)
            service_obj.save()

    def deactivate_schedule(self, service_id, room_name):
        service_obj = get_tv_service(room_name).objects.get(channel_name=room_name, service_id=service_id)
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
