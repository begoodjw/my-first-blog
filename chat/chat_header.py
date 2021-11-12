QUIZ_ANSWER_POSTFIX = "_quiz_answer"

class Category:
    TV = "tv"
    SPORTS = "sports"
    MENUAL = "menual"


class RequestType:
    SERVICE_CREATE = "service_create"
    QUIZ_ANSWER = "quiz_answer"
    SCHEDULE = "schedule"
    UPDATE_SCHEDULE = "update_schedule"
    GET_USER_COUNT = "get_user_count"


class ScheduleTarget:
    SERVICE = "service"
    QUIZ_ANSWER = "quiz_answer"


class ServiceType:
    QUIZ = "quiz"
    INFO = "info"
    VOTE = "vote"
    #QUIZ_ANSWER = "quiz_answer"
    #SCHEDULE = "schedule"
    #UPDATE_SCHEDULE = "update_schedule"


class DetailType:
    MULTI = "multi"
    SINGLE = "single"
    PRODUCT = "product"


class SingleQuizType:
    NORMAL = "normal"
    LENGTH = "string-length"


class ProcessType:
    NOW = "now"
    RESERVE = "reserve"
    REPEAT = "repeat"


class AnswerRequestType:
    SUBMIT = "submit"
    RESERVE = "reserve"
    CANCEL = "cancel"


class ProcessState:
    FINISH = 0
    WAIT_ANSWER = 1
    WAIT_SEND = 2
    ANSWER_RESERVE = 3
    WAIT_SEND_ANSWER_RESERVE = 4



class ScheduleState:
    ACTIVE = 1
    INACTIVE = 0
    FINISH = 9


def get_service_type_str(service_type):
    if service_type == ServiceType.QUIZ:
        return "퀴즈"
    elif service_type == ServiceType.INFO:
        return "정보"
    elif service_type == ServiceType.VOTE:
        return "투표"
    else:
        return "알수없음"


def get_detail_type_str(service_type):
    if service_type == DetailType.MULTI:
        return "객관식"
    elif service_type == DetailType.SINGLE:
        return "주관식"
    elif service_type == DetailType.PRODUCT:
        return "관련 정보"
    else:
        return "알수없음"