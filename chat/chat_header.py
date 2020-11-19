class Category:
    TV = "tv"
    SPORTS = "sports"


class ServiceType:
    QUIZ = "quiz"
    INFO = "info"
    VOTE = "vote"
    QUIZ_ANSWER = "quiz_answer"
    SCHEDULE = "schedule"
    UPDATE_SCHEDULE = "update_schedule"


class DetailType:
    MULTI = "multi"
    SINGLE = "single"
    PRODUCT = "product"


class ProcessType:
    NOW = "now"
    RESERVE = "reserve"
    REPEAT = "repeat"


class ProcessState:
    FINISH = 0
    WAIT_ANSWER = 1
    WAIT_SEND = 2


class ScheduleState:
    ACTIVE = 1
    INACTIVE = 0
    FINISH = 9


def get_service_type_str(service_type):
    if service_type == ServiceType.QUIZ:
        return "실시간 퀴즈"
    elif service_type == ServiceType.INFO:
        return "실시간 정보"
    elif service_type == ServiceType.VOTE:
        return "실시간 투표"
    else:
        return "알수없음"


def get_detail_type_str(service_type):
    if service_type == DetailType.MULTI:
        return "객관식"
    elif service_type == DetailType.SINGLE:
        return "주관식"
    elif service_type == DetailType.PRODUCT:
        return "상품"
    else:
        return "알수없음"