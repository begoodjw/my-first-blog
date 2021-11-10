from django.conf import settings
from django.db import models
from django.db.models.base import ModelBase
from django.utils.safestring import mark_safe
from django.utils import timezone
import datetime
import json
from .chat_header import ServiceType, DetailType, SingleQuizType, ProcessType, ProcessState, ScheduleState, get_service_type_str, get_detail_type_str


'''
def get_model(db_table):

    class CustomMetaClass(ModelBase):
        def __new__(cls, name, bases, attrs):
            model = super(CustomMetaClass, cls).__new__(cls, name, bases, attrs)
            model._meta.db_table = db_table
            return model

    class CustomService(models.Model):

        __metaclass__ = CustomMetaClass

        # define your fileds here
        service_id = models.CharField(max_length=100)
        channel_name = models.CharField(max_length=20)
        service_type = models.CharField(max_length=20)
        service = models.TextField()  # for json type data
        publish_date = models.DateTimeField(default=timezone.now())
        countdown = models.IntegerField()
        note = models.CharField(max_length=100)

        def __str__(self):
            return '%s %s' % (self.channel_name, self.service_type)

    return CustomService
'''


class TvService(models.Model):
    service_id = models.CharField(max_length=100)
    program_title = models.CharField(max_length=100)
    channel_name = models.CharField(max_length=20)
    service_type = models.CharField(max_length=20) # quiz / info / vote
    detail_type = models.CharField(max_length=20) #주관식 / 객관식 등
    service_title = models.CharField(max_length=64)
    process_type = models.CharField(default='now', max_length=20)
    process_info = models.TextField() # for json type data
    #answer_include = models.CharField(max_length=20)
    contents = models.TextField() # for json type data
    publish_date = models.DateTimeField(default=datetime.datetime.now())
    countdown = models.CharField(max_length=10)
    note = models.CharField(max_length=100)
    #answer = models.TextField()  # for json type data
    process_state = models.IntegerField(default=ProcessState.FINISH)
    schedule_state = models.IntegerField(default=ScheduleState.INACTIVE)
    # 0 = service finished
    # 1 = waiting

    class Meta:
        abstract = True

    def get_service_type(self):
        return get_service_type_str(self.service_type)

    def get_detail_type(self):
        return get_detail_type_str(self.detail_type)

    def get_question(self):
        service_data = json.loads(self.contents)
        if self.service_type == ServiceType.QUIZ or self.service_type == ServiceType.VOTE:
            return service_data['question']
        else:
            return "-"

    def display_process_type(self):
        if self.process_type == ProcessType.REPEAT:
            return "반복 수행"
        elif self.process_type == ProcessType.RESERVE:
            return "예약 수행"
        else:
            return "즉시 수행"

    def display_process_state(self):
        if self.process_state == ProcessState.FINISH:
            return "수행완료"
        elif self.process_state == ProcessState.WAIT_ANSWER:
            return "정답대기"
        elif self.process_state == ProcessState.WAIT_SEND:
            return "수행예약"
        elif self.process_state == ProcessState.ANSWER_RESERVE:
            return "정답예약"
        elif self.process_state == ProcessState.WAIT_SEND_ANSWER_RESERVE:
            return "수행정답예약"
        else:
            return "알수없음"

    def display_process_info(self):
        if self.process_type == ProcessType.REPEAT:

            process_info_data = json.loads(self.process_info)
            return process_info_data["weekdays"] + " / " + process_info_data["time"]
        elif self.process_type == ProcessType.RESERVE:
            process_info_data = json.loads(self.process_info)
            return process_info_data["date"] + " / " + process_info_data["time"]
        else:
            return "즉시 수행"

    def display_schedule_info(self):
        if self.schedule_state == ScheduleState.ACTIVE:
            return "운영중"
        elif self.schedule_state == ScheduleState.INACTIVE:
            return "일시정지"
        else:
            return "종료"

    def display_quiz_answer_schedule_info(self):
        contents_data = json.loads(self.contents)
        if "answer_schedule_state" in contents_data:
            schedule_state = contents_data["answer_schedule_state"]
            if schedule_state == ScheduleState.ACTIVE:
                return "운영중"
            elif schedule_state == ScheduleState.INACTIVE:
                return "일시정지"
            else:
                return "종료"
        else:
            return "종료"

    def get_examples(self):
        service_data = json.loads(self.contents)
        if self.service_type == ServiceType.QUIZ or self.service_type == ServiceType.VOTE:
            if self.detail_type == DetailType.MULTI:
                #return self.get_example_display(service_data['examples'])
                return service_data['examples']
            else:
                return ""
        else:
            return ""

    def get_contents_data(self):
        contents_data = json.loads(self.contents)
        #print("get_contents_data: " + str(contents_data))
        return contents_data

    def get_contents_data_str(self):
        contents_data = json.loads(self.contents)
        #print("get_contents_data_str: " + str(contents_data))
        #return str(contents_data)
        return mark_safe(json.dumps(contents_data))

    def show_contents_info(self):
        service_data = json.loads(self.contents)
        return str(service_data)

    def show_result_info(self):
        result_data = json.loads(self.result)
        return str(result_data)

    def get_example_display(self, examples):
        count = 1
        example_display = ""
        for example in examples.split('|'):
            example_display += str(count) + '. ' + example + ' '
            count += 1

        return example_display

    def display_quiz_answer_process_info(self):
        contents_data = json.loads(self.contents)
        if "quiz_answer_process_info" in contents_data:
            quiz_answer_process_info = contents_data["quiz_answer_process_info"]
            return quiz_answer_process_info["date"] + " / " + quiz_answer_process_info["time"]

    def get_quiz_attribute_str(self):

        attr = {}
        contents_data = json.loads(self.contents)
        process_info = json.loads(self.process_info)
        print("type: " + str(self.service_type))
        print("detail: " + str(self.detail_type))
        if self.service_type != ServiceType.QUIZ:
            return ""

        if self.detail_type == DetailType.MULTI:
            select_count = contents_data["select_count"]
            attr["select_count"] = select_count

        elif self.detail_type == DetailType.SINGLE:
            single_type = contents_data["single_quiz_type"]
            if single_type == SingleQuizType.LENGTH:
                answer_length = contents_data["answer_length"]
                attr["answer_length"] = answer_length

        else:
            return ""

        return mark_safe(json.dumps(attr))


class AllService(TvService):
    pass


class KBS1Service(TvService):
    pass


class KBS2Service(TvService):
    pass


class TVNService(TvService):
    pass


class JTBCService(TvService):
    pass


class MBCService(TvService):
    pass


class SBSService(TvService):
    pass


class TVChosunService(TvService):
    pass


class MBNService(TvService):
    pass


class ChannelAService(TvService):
    pass


class SkyService(TvService):
    pass


class NQQService(TvService):
    pass


class MnetService(TvService):
    pass


class OCNService(TvService):
    pass


class TvnShowService(TvService):
    pass


class ChannelService1(TvService):
    pass


class ChannelService2(TvService):
    pass


class ChannelService3(TvService):
    pass


class ChannelService4(TvService):
    pass


class ChannelService5(TvService):
    pass


class ChannelService6(TvService):
    pass


class ChannelService7(TvService):
    pass


class ChannelService8(TvService):
    pass


class ChannelService9(TvService):
    pass


class ChannelService10(TvService):
    pass


class ChannelService11(TvService):
    pass


class ChannelService12(TvService):
    pass


class ChannelService13(TvService):
    pass


class ChannelService14(TvService):
    pass


class ChannelService15(TvService):
    pass


class ChannelService16(TvService):
    pass





class TvServiceResult(models.Model):
    service_id = models.CharField(max_length=100)
    channel_name = models.CharField(max_length=20)
    participants = models.IntegerField()
    result = models.TextField()

    def publish(self):
        self.published_date = timezone.now()
        self.save()

    def __str__(self):
        return self.channel_name
